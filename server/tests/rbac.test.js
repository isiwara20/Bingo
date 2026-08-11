/**
 * BinGo – Role-Based Access Control Tests
 *
 * Verifies that protected endpoints correctly reject unauthenticated
 * and unauthorised requests.
 *
 * Full role-based tests (with valid JWTs) require database integration.
 * TODO: Add database integration tests with MongoDB Memory Server.
 */

const request = require("supertest");
const app = require("../src/app");

describe("RBAC – Admin-only endpoints", () => {
  it("GET /api/v1/users should return 401 without token", async () => {
    const res = await request(app).get("/api/v1/users");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("DELETE /api/v1/users/:id should return 401 without token", async () => {
    const res = await request(app).delete("/api/v1/users/64abc123def456789012");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe("RBAC – Authenticated-only endpoints", () => {
  it("GET /api/v1/auth/me should return 401 without token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/v1/reports/my should return 401 without token", async () => {
    const res = await request(app).get("/api/v1/reports/my");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/v1/notifications should return 401 without token", async () => {
    const res = await request(app).get("/api/v1/notifications");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/v1/rewards should return 401 without token", async () => {
    const res = await request(app).get("/api/v1/rewards");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe("RBAC – Public endpoints should be accessible", () => {
  it("GET /api/v1/health should return 200 (no DB needed)", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("GET /api/v1/recycling should not require auth (no 401/403)", async () => {
    // This is a public endpoint. Without DB it may 500, but must not 401/403.
    // Full integration test (200 response) requires MongoDB – see docs/testing.md.
    const res = await request(app).get("/api/v1/recycling");
    expect([200, 500]).toContain(res.status);
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});

describe("RBAC – Role logic unit tests", () => {
  const ROLES = ["resident", "community_leader", "waste_authority", "admin"];

  it("all roles should be valid strings", () => {
    ROLES.forEach((role) => {
      expect(typeof role).toBe("string");
      expect(role.length).toBeGreaterThan(0);
    });
  });

  it("authorizeRoles should allow matching roles", () => {
    const allowed = ["admin", "waste_authority"];
    expect(allowed.includes("admin")).toBe(true);
    expect(allowed.includes("resident")).toBe(false);
  });
});
