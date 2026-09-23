jest.mock("../src/models/User", () => ({ findByIdAndUpdate: jest.fn(), findById: jest.fn() }));
jest.mock("../src/middleware/authMiddleware", () => ({ authenticateUser: (req, res, next) => { req.user = { _id: "user-1", role: req.headers["x-test-role"] }; next(); }, authorizeRoles: () => (req, res, next) => next() }));
const express = require("express");
const request = require("supertest");
const User = require("../src/models/User");
const app = express();
app.use(express.json());
app.use("/users", require("../src/routes/userRoutes"));
app.use((err, req, res, next) => res.status(500).json({ message: err.message }));
beforeEach(() => jest.clearAllMocks());
test.each(["resident", "community_leader", "waste_authority"])("%s profile update and password change endpoints load and work", async role => {
  User.findByIdAndUpdate.mockResolvedValue({ _id: "user-1", role, name: "Updated" });
  const result = await request(app).put("/users/me").set("x-test-role", role).send({ name: "Updated", role: "admin" });
  expect(result.status).toBe(200);
  expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user-1", { name: "Updated" }, { new: true, runValidators: true });
  const account = { comparePassword: jest.fn().mockResolvedValue(true), save: jest.fn().mockResolvedValue() };
  User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(account) });
  const changed = await request(app).put("/users/change-password").set("x-test-role", role).send({ currentPassword: "Current123", newPassword: "NewPass123" });
  expect(changed.status).toBe(200);
  expect(account.comparePassword).toHaveBeenCalledWith("Current123");
  expect(account.save).toHaveBeenCalled();
});
test("incorrect current password does not save a replacement", async () => {
  const account = { comparePassword: jest.fn().mockResolvedValue(false), save: jest.fn() };
  User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(account) });
  const result = await request(app).put("/users/change-password").send({ currentPassword: "wrong", newPassword: "NewPass123" });
  expect(result.status).toBe(400); expect(account.save).not.toHaveBeenCalled();
});
