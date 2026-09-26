jest.mock("../src/models/User", () => ({ findOneAndUpdate: jest.fn(), updateOne: jest.fn(), findById: jest.fn(), findOne: jest.fn() }));
jest.mock("../src/services/otpService", () => ({ sendWhatsApp: jest.fn(), generateOtp: () => "246810" }));
const User = require("../src/models/User");
const { sendWhatsApp } = require("../src/services/otpService");
const service = require("../src/services/passwordResetService");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const express = require("express");
const { authenticateUser } = require("../src/middleware/authMiddleware");
const { globalErrorHandler } = require("../src/middleware/errorMiddleware");
const { generateToken, loginUser } = require("../src/services/authService");

// In-memory persistence adapter for service tests. No real accounts or messages.
let account;
const get = (object, key) => key.split(".").reduce((value, part) => value?.[part], object);
const matches = (query) => Object.entries(query).every(([key, condition]) => {
  if (key === "$or") return condition.some(matches);
  const value = get(account, key);
  if (condition && typeof condition === "object") return Object.entries(condition).every(([op, expected]) => {
    switch (op) {
      case "$exists": return (value !== undefined) === expected;
      case "$nin": return !expected.includes(value);
      case "$gt": return value > expected;
      case "$lt": return value < expected;
      case "$lte": return value <= expected;
      default: throw new Error(`Unsupported test operator: ${op}`);
    }
  });
  return value === condition;
});
const change = (query, update) => {
  if (!matches(query)) return null;
  for (const [op, fields] of Object.entries(update)) for (const [path, value] of Object.entries(fields)) {
    const parts = path.split("."); const key = parts.pop();
    const target = parts.reduce((obj, part) => obj[part] ||= {}, account);
    if (op === "$set") target[key] = value;
    if (op === "$inc") target[key] = (target[key] || 0) + value;
    if (op === "$unset") delete target[key];
  }
  return { ...account };
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = "test-only-reset-secret";
  account = { _id: "user-1", email: "resident@example.com", isActive: true, whatsappNumber: "+94771234567", sessionVersion: 0 };
  User.findOneAndUpdate.mockImplementation(async (query, update) => change(query, update));
  User.updateOne.mockImplementation(async (query, update) => change(query, update));
  User.findById.mockImplementation(() => ({ select: async () => ({ ...account }) }));
  User.findOne.mockImplementation(() => ({ select: async () => ({ ...account, comparePassword: password => bcrypt.compare(password, account.passwordHash) }) }));
  sendWhatsApp.mockResolvedValue();
});

const issue = async () => { await service.requestReset(account.email); return service.verifyReset(account.email, "246810"); };

describe("WhatsApp password recovery", () => {
  test("sends only to the saved WhatsApp number and stores no plaintext OTP", async () => {
    await service.requestReset(account.email);
    expect(sendWhatsApp).toHaveBeenCalledWith(account.whatsappNumber, expect.stringContaining("246810"), { requireDelivery: true });
    expect(JSON.stringify(account)).not.toContain("246810");
  });
  test("does not send for unknown, inactive or missing-WhatsApp accounts", async () => {
    await service.requestReset("unknown@example.com");
    account.isActive = false; await service.requestReset(account.email);
    account.isActive = true; account.whatsappNumber = null; await service.requestReset(account.email);
    expect(sendWhatsApp).not.toHaveBeenCalled();
  });
  test("enforces the resend cooldown, including concurrent requests", async () => {
    await Promise.all([service.requestReset(account.email), service.requestReset(account.email)]);
    expect(sendWhatsApp).toHaveBeenCalledTimes(1);
  });
  test("rolls back a failed delivery and permits retry", async () => {
    sendWhatsApp.mockRejectedValueOnce(new Error("provider failed"));
    await expect(service.requestReset(account.email)).rejects.toMatchObject({ statusCode: 503 });
    expect(account.passwordReset).toBeUndefined();
    await service.requestReset(account.email);
    expect(sendWhatsApp).toHaveBeenCalledTimes(2);
  });
  test("rejects wrong codes and locks after five attempts", async () => {
    await service.requestReset(account.email);
    for (let i = 0; i < 5; i++) await expect(service.verifyReset(account.email, "111111")).rejects.toMatchObject({ statusCode: 400 });
    await expect(service.verifyReset(account.email, "246810")).rejects.toMatchObject({ statusCode: 400 });
  });
  test("rejects expired codes", async () => {
    await service.requestReset(account.email); account.passwordReset.expiresAt = new Date(Date.now() - 1);
    await expect(service.verifyReset(account.email, "246810")).rejects.toThrow("expired code");
  });
  test("does not accept registration verification codes", async () => {
    account.otpCode = "246810"; account.otpExpiry = new Date(Date.now() + 600000);
    await expect(service.verifyReset(account.email, "246810")).rejects.toThrow("Invalid");
  });
  test("issues one reset token even with simultaneous correct verification", async () => {
    await service.requestReset(account.email);
    const results = await Promise.allSettled([service.verifyReset(account.email, "246810"), service.verifyReset(account.email, "246810")]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    const token = results.find(r => r.status === "fulfilled").value.resetToken;
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(account.passwordReset.tokenHash).not.toBe(token);
  });
  test("resending invalidates the previous reset token", async () => {
    const { resetToken } = await issue(); account.passwordReset.sentAt = new Date(Date.now() - 61000);
    await service.requestReset(account.email);
    await expect(service.resetPassword(resetToken, "FreshPassword2")).rejects.toThrow("expired");
  });
  test("rejects expired reset tokens", async () => {
    const { resetToken } = await issue(); account.passwordReset.tokenExpiresAt = new Date(Date.now() - 1);
    await expect(service.resetPassword(resetToken, "FreshPassword2")).rejects.toThrow("expired");
  });
  test("changes the password, consumes the token, and allows sign-in only with the new password", async () => {
    account.passwordHash = await bcrypt.hash("OldPassword1", 4);
    const { resetToken } = await issue();
    await service.resetPassword(resetToken, "FreshPassword2");
    expect(account.passwordHash).not.toBe("FreshPassword2");
    expect(account.passwordReset).toBeUndefined();
    await expect(loginUser({ email: account.email, password: "OldPassword1" })).rejects.toThrow("Invalid");
    const signedIn = await loginUser({ email: account.email, password: "FreshPassword2" });
    expect(jwt.verify(signedIn.token, process.env.JWT_SECRET).sessionVersion).toBe(1);
    await expect(service.resetPassword(resetToken, "AnotherPassword3")).rejects.toThrow("already used");
  });
  test("invalidates old JWTs while allowing newly issued JWTs", async () => {
    const app = express(); app.get("/protected", authenticateUser, (_, res) => res.json({ ok: true })); app.use(globalErrorHandler);
    const oldToken = generateToken(account._id);
    const { resetToken } = await issue(); await service.resetPassword(resetToken, "FreshPassword2");
    expect((await request(app).get("/protected").set("Authorization", `Bearer ${oldToken}`)).status).toBe(401);
    const newToken = generateToken(account._id, account.sessionVersion);
    expect((await request(app).get("/protected").set("Authorization", `Bearer ${newToken}`)).status).toBe(200);
  });
});

describe("Reset API validation", () => {
  const app = express(); app.use(express.json()); app.use("/reset", require("../src/routes/passwordResetRoutes")); app.use(globalErrorHandler);
  test.each([
    ["request", { email: "invalid" }], ["request", { email: {} }],
    ["verify", { email: "resident@example.com", otp: "123" }],
    ["verify", { email: "resident@example.com", otp: 123456 }],
    ["complete", { resetToken: "a".repeat(64), password: "weak" }],
    ["complete", { resetToken: "a".repeat(64), password: "Ab1" + "é".repeat(40) }],
    ["complete", { resetToken: "invalid", password: "StrongPassword1" }],
  ])("rejects malformed %s requests", async (path, payload) => {
    const response = await request(app).post(`/reset/${path}`).send(payload);
    expect(response.status).toBe(422); expect(User.findOneAndUpdate).not.toHaveBeenCalled();
  });
  test("uses a generic request response and never returns the code or phone number", async () => {
    const known = await request(app).post("/reset/request").send({ email: account.email, whatsappNumber: "+94111111111" });
    const unknown = await request(app).post("/reset/request").send({ email: "unknown@example.com" });
    expect(known.status).toBe(200); expect(known.body).toEqual(unknown.body);
    expect(JSON.stringify(known.body)).not.toMatch(/246810|94771234567/);
    expect(sendWhatsApp.mock.calls[0][0]).toBe(account.whatsappNumber);
  });
});
