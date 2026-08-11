/**
 * BinGo – Authentication API Tests
 *
 * Tests for:
 *   POST /api/v1/auth/register
 *   POST /api/v1/auth/login
 *   GET  /api/v1/auth/me
 *
 * These tests require a running MongoDB connection.
 * Use MongoDB Memory Server for CI or configure a test Atlas cluster.
 *
 * TODO: Add MongoDB Memory Server for isolated testing without Atlas.
 */

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");

// ── Test data ──────────────────────────────────────────────────────────────
const validUser = {
  name: "Test User",
  email: "test@example.com",
  password: "TestPassword1!",
};

const invalidEmail = {
  name: "Bad User",
  email: "not-an-email",
  password: "TestPassword1!",
};

const weakPassword = {
  name: "Weak User",
  email: "weak@example.com",
  password: "weak",
};

// ── Register Tests ─────────────────────────────────────────────────────────
describe("POST /api/v1/auth/register", () => {
  it("should return 422 for invalid email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(invalidEmail);

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it("should return 422 for weak password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(weakPassword);

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it("should return 422 when name is missing", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "test@example.com", password: "TestPassword1!" });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});

// ── Login Tests ────────────────────────────────────────────────────────────
describe("POST /api/v1/auth/login", () => {
  it("should return 422 when email is missing", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ password: "TestPassword1!" });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it("should return 422 when password is missing", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});

// ── Protected Route Tests ──────────────────────────────────────────────────
describe("GET /api/v1/auth/me", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 for an invalid token", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer invalidtoken123");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ── Health Check ───────────────────────────────────────────────────────────
describe("GET /api/v1/health", () => {
  it("should return server status", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("BinGo API is running");
  });
});
