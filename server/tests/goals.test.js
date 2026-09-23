const path = require("path");
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, "../node_modules/.cache/mongodb-binaries");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
const Goal = require("../src/models/SustainabilityGoal");
const Entry = require("../src/models/GoalProgressEntry");
const { generateToken } = require("../src/services/authService");
let replica, alice, bob, admin, aliceToken, bobToken, adminToken;
const base = "/api/v1/goals";
const input = { title: "Recycle more", category: "Recycling", description: "My personal goal", targetAmount: 10, unit: "Items", period: "Custom", startDate: "2020-01-01", targetDate: "2030-12-31", icon: "recycle" };
const api = (method, route = "", body, token = aliceToken) => request(app)[method](base + route).set("Authorization", `Bearer ${token}`).send(body);
const create = async changes => { const response = await api("post", "", { ...input, ...changes }); expect(response.status).toBe(201); return response.body.data; };
const add = (id, amountAdded, requestId = "progress-request-1", note = "") => api("post", `/${id}/progress`, { amountAdded, requestId, note });
beforeAll(async () => {
  process.env.JWT_SECRET = "isolated-goal-test-secret"; process.env.BCRYPT_SALT_ROUNDS = "4";
  replica = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  await mongoose.connect(replica.getUri(), { dbName: "bingo_goals_test" });
  await Promise.all([Goal.init(), Entry.init(), User.init()]);
  [alice, bob, admin] = await User.create([
    { name: "Alice", email: "alice@example.com", passwordHash: "Password1", role: "resident" },
    { name: "Bob", email: "bob@example.com", passwordHash: "Password1", role: "resident" },
    { name: "Admin", email: "admin@example.com", passwordHash: "Password1", role: "admin" },
  ]);
  aliceToken = generateToken(alice._id); bobToken = generateToken(bob._id); adminToken = generateToken(admin._id);
}, 180000);
beforeEach(async () => { await Goal.deleteMany({}); await Entry.deleteMany({}); });
afterAll(async () => { await mongoose.disconnect(); if (replica) await replica.stop(); });

test("requires authentication", async () => { expect((await request(app).get(base)).status).toBe(401); });
test("creates an owned goal and ignores forged owner/progress/status fields", async () => {
  const goal = await create({ userId: bob._id, currentProgress: 500, status: "completed", completedAt: new Date() });
  expect(goal.userId).toBe(String(alice._id)); expect(goal.currentProgress).toBe(0); expect(goal.status).toBe("active");
  const list = await api("get"); expect(list.body.data.goals[0]._id).toBe(goal._id);
  expect((await api("get", "", undefined, bobToken)).body.data.goals).toEqual([]);
});
test.each([
  { title: " " }, { targetAmount: 0 }, { targetAmount: -2 }, { targetAmount: "10" }, { targetAmount: 1.001 },
  { targetDate: "2019-01-01" }, { startDate: "2026-02-30" }, { targetDate: "not a date" },
  { category: "Rewards" }, { unit: "Points" }, { period: "Yearly" }, { icon: "invalid" },
])("validates goal input: %j", async change => { expect((await api("post", "", { ...input, ...change })).status).toBe(422); expect(await Goal.countDocuments()).toBe(0); });
test("returns templates and valid options", async () => { const res = await api("get", "/options"); expect(res.body.data.suggestions).toHaveLength(6); expect(res.body.data.units).toContain("kg"); });
test("protects every goal operation from other users and admins", async () => {
  const goal = await create();
  for (const token of [bobToken, adminToken]) {
    for (const [method, suffix, body] of [
      ["get", "", undefined], ["get", "/history", undefined], ["patch", "", { title: "Forged" }],
      ["post", "/progress", { amountAdded: 1, requestId: "other-user-request" }], ["post", "/cancel", {}], ["delete", "", undefined],
    ]) expect((await api(method, `/${goal._id}${suffix}`, body, token)).status).toBe(404);
  }
  expect((await Goal.findById(goal._id)).title).toBe(input.title);
});
test("rejects invalid IDs and editable-field injection", async () => {
  expect((await api("get", "/invalid")).status).toBe(422);
  const goal = await create();
  expect((await api("patch", `/${goal._id}`, { userId: bob._id })).status).toBe(422);
  expect((await api("patch", `/${goal._id}`, { currentProgress: 10 })).status).toBe(422);
});
test("adds progress, records notes, caps at target and automatically completes", async () => {
  const goal = await create();
  const first = await add(goal._id, 3, "first-progress", "Sorted paper"); expect(first.status).toBe(200); expect(first.body.data.goal.progressPercentage).toBe(30);
  const second = await add(goal._id, 20, "second-progress"); expect(second.status).toBe(200);
  expect(second.body.data.goal.status).toBe("completed"); expect(second.body.data.goal.currentProgress).toBe(10); expect(second.body.data.goal.progressPercentage).toBe(100);
  expect(second.body.data.entry.amountAdded).toBe(7); expect(second.body.data.goal.completedAt).toBeTruthy();
  const history = (await api("get", `/${goal._id}/history`)).body.data.entries;
  expect(history.map(e => e.progressAfterUpdate)).toEqual([10, 3]); expect(history[1].note).toBe("Sorted paper");
  expect((await api("get", "?status=completed")).body.data.total).toBe(1);
  expect((await api("get", "?status=active")).body.data.total).toBe(0);
  expect((await add(goal._id, 1, "third-progress")).status).toBe(409);
});
test("supports fractional kg without floating-point accumulation", async () => {
  const goal = await create({ unit: "kg", targetAmount: 0.3 }); await add(goal._id, 0.1, "decimal-first");
  const res = await add(goal._id, 0.2, "decimal-second"); expect(res.body.data.goal.currentProgress).toBe(0.3); expect(res.body.data.goal.status).toBe("completed");
});
test("is idempotent, even for retries after completion", async () => {
  const goal = await create(); await add(goal._id, 10);
  const retry = await add(goal._id, 10); expect(retry.status).toBe(200); expect(retry.body.data.replayed).toBe(true); expect(await Entry.countDocuments()).toBe(1);
  expect((await add(goal._id, 5)).status).toBe(409);
});
test("handles simultaneous updates without lost progress or duplicate history", async () => {
  const goal = await create();
  const responses = await Promise.all([add(goal._id, 4, "parallel-one"), add(goal._id, 4, "parallel-two"), add(goal._id, 4, "parallel-three")]);
  expect(responses.map(r => r.status)).toEqual([200, 200, 200]);
  expect((await Goal.findById(goal._id)).currentProgress).toBe(10);
  const history = await Entry.find({ goalId: goal._id }); expect(history.reduce((sum, e) => sum + e.amountAdded, 0)).toBe(10); expect(history).toHaveLength(3);
});
test("handles simultaneous retries of the same progress request", async () => {
  const goal = await create(); const responses = await Promise.all([add(goal._id, 2), add(goal._id, 2)]);
  expect(responses.map(r => r.status)).toEqual([200, 200]); expect(await Entry.countDocuments()).toBe(1); expect((await Goal.findById(goal._id)).currentProgress).toBe(2);
});
test("rolls back goal progress if history cannot be saved", async () => {
  const goal = await create(); const spy = jest.spyOn(Entry, "create").mockRejectedValueOnce(new Error("Simulated write failure"));
  try { expect((await add(goal._id, 5)).status).toBe(500); } finally { spy.mockRestore(); }
  expect((await Goal.findById(goal._id)).currentProgress).toBe(0); expect(await Entry.countDocuments()).toBe(0);
});
test("edits and reopens goals without rewriting history snapshots", async () => {
  const goal = await create(); await add(goal._id, 10);
  const edited = await api("patch", `/${goal._id}`, { title: "A bigger goal", category: "Waste Reduction", description: "Updated", targetAmount: 20, targetDate: "2031-01-01", unit: "Actions" });
  expect(edited.status).toBe(200); expect(edited.body.data.status).toBe("active"); expect(edited.body.data.completedAt).toBeNull();
  const entry = await Entry.findOne(); expect(entry.unit).toBe("Items"); expect(entry.targetAtUpdate).toBe(10);
  const reduced = await api("patch", `/${goal._id}`, { targetAmount: 5 }); expect(reduced.body.data.status).toBe("completed"); expect(reduced.body.data.currentProgress).toBe(10); expect(reduced.body.data.progressPercentage).toBe(100);
});
test("cancels goals while retaining history; deletion removes both", async () => {
  const goal = await create(); await add(goal._id, 2);
  expect((await api("post", `/${goal._id}/cancel`)).body.data.status).toBe("cancelled");
  expect((await add(goal._id, 1, "after-cancel")).status).toBe(409);
  expect((await api("get", "?status=cancelled")).body.data.total).toBe(1);
  expect((await api("get", `/${goal._id}/history`)).body.data.entries).toHaveLength(1);
  expect((await api("delete", `/${goal._id}`)).status).toBe(200); expect(await Entry.countDocuments()).toBe(0); expect(await Goal.countDocuments()).toBe(0);
});
test("calculates personal statistics without mixing units or including cancelled goals in rates", async () => {
  const active = await create({ targetAmount: 4, unit: "Actions" }); await add(active._id, 2);
  const complete = await create(); await add(complete._id, 10);
  const cancelled = await create(); await api("post", `/${cancelled._id}/cancel`);
  const summary = (await api("get", "/summary")).body.data;
  expect(summary).toMatchObject({ activeGoals: 1, completedGoals: 1, cancelledGoals: 1, overallProgress: 75, completionRate: 50 });
  expect(summary.month).toMatchObject({ totalEcoActions: 2, completedGoals: 1, activeGoals: 1, completionRate: 50 }); expect(summary.month.amountsByUnit.Items).toBe(10);
  const other = (await api("get", "/summary", undefined, bobToken)).body.data; expect(other.activeGoals).toBe(0); expect(other.month.totalEcoActions).toBe(0);
});
test("excludes previous-month progress from monthly totals", async () => {
  const goal = await create(); await add(goal._id, 2);
  await Entry.collection.updateMany({}, { $set: { createdAt: new Date("2020-01-01") } });
  expect((await api("get", "/summary")).body.data.month.amountsByUnit.Items).toBe(0);
});
test("paginates goals and history", async () => {
  const goal = await create(); await create({ title: "Another goal" });
  expect((await api("get", "?limit=1&page=2")).body.data.goals).toHaveLength(1);
  await add(goal._id, 1, "page-one"); await add(goal._id, 1, "page-two");
  const res = await api("get", `/${goal._id}/history?limit=1&page=2`); expect(res.body.data.entries).toHaveLength(1); expect(res.body.data.totalPages).toBe(2);
});
test("rejects zero, negative, malformed, and overprecise progress", async () => {
  const goal = await create();
  for (const amount of [0, -1, "5", 0.001]) expect((await add(goal._id, amount)).status).toBe(422);
  expect(await Entry.countDocuments()).toBe(0);
});
