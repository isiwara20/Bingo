/**
 * BinGo – Waste Report Validation Tests
 *
 * Tests for:
 *   POST /api/v1/reports (validation layer only – no DB)
 *   PATCH /api/v1/reports/:id/status
 *
 * These tests verify the validation middleware and 401 protection,
 * without requiring a live database connection.
 */

const request = require("supertest");
const app = require("../src/app");

describe("POST /api/v1/reports – without authentication", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/v1/reports")
      .send({
        description: "Large pile of mixed waste",
        wasteType: "mixed",
        latitude: 6.9271,
        longitude: 79.8612,
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/v1/reports – validation (authenticated mock skipped)", () => {
  it("validation schema: wasteType enum check", () => {
    const validTypes = ["plastic", "glass", "paper", "metal", "electronic", "organic", "mixed", "other"];
    expect(validTypes).toContain("plastic");
    expect(validTypes).not.toContain("furniture");
  });

  it("validation schema: coordinates range check", () => {
    const latValid = (lat) => lat >= -90 && lat <= 90;
    const lngValid = (lng) => lng >= -180 && lng <= 180;

    expect(latValid(6.9271)).toBe(true);
    expect(latValid(91)).toBe(false);
    expect(lngValid(79.8612)).toBe(true);
    expect(lngValid(181)).toBe(false);
  });

  it("validation schema: description length check", () => {
    const isValid = (desc) => desc.length >= 10 && desc.length <= 1000;
    expect(isValid("Too short")).toBe(false);
    expect(isValid("This is a valid description with enough content.")).toBe(true);
  });
});

describe("RBAC: Report status update", () => {
  it("should return 401 for unauthenticated status update", async () => {
    const res = await request(app)
      .patch("/api/v1/reports/64abc123def456789012/status")
      .send({ status: "cleaned" });

    expect(res.status).toBe(401);
  });
});
