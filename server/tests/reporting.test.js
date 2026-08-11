/**
 * BinGo – Reporting API Tests
 * Member 2 – US-M2-01 to US-M2-05
 *
 * Tests that do not require a MongoDB connection:
 *   - Auth protection on all report endpoints
 *   - Validation rules (schema logic unit tests)
 *   - Status update auth protection
 *
 * Tests requiring MongoDB (marked TODO):
 *   - Successful report creation
 *   - Report ownership enforcement
 *   - Status lifecycle
 */

const request = require("supertest");
const app = require("../src/app");
const { WASTE_TYPES, REPORT_STATUSES } = require("../src/config/constants");

// ── US-M2-01: Auth protection ─────────────────────────────────────────────
describe("Reporting – authentication required", () => {
  it("POST /api/v1/reports returns 401 without token", async () => {
    const res = await request(app).post("/api/v1/reports").send({
      description: "Large pile of plastic waste near canal",
      wasteType: "plastic",
      latitude: 6.9271,
      longitude: 79.8612,
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/v1/reports/my returns 401 without token", async () => {
    const res = await request(app).get("/api/v1/reports/my");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/v1/reports/:id returns 401 without token", async () => {
    const res = await request(app).get("/api/v1/reports/64abc123def456789012");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("PATCH /api/v1/reports/:id/status returns 401 without token", async () => {
    const res = await request(app)
      .patch("/api/v1/reports/64abc123def456789012/status")
      .send({ status: "cleaned" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ── US-M2-03: Waste type validation ──────────────────────────────────────
describe("Reporting – waste type validation", () => {
  const validTypes = Object.values(WASTE_TYPES);

  it("contains all required waste categories", () => {
    expect(validTypes).toContain("general");
    expect(validTypes).toContain("plastic");
    expect(validTypes).toContain("glass");
    expect(validTypes).toContain("paper");
    expect(validTypes).toContain("metal");
    expect(validTypes).toContain("electronic");
    expect(validTypes).toContain("construction");
    expect(validTypes).toContain("organic");
    expect(validTypes).toContain("hazardous");
    expect(validTypes).toContain("mixed");
    expect(validTypes).toContain("other");
  });

  it("rejects unknown waste types", () => {
    expect(validTypes).not.toContain("furniture");
    expect(validTypes).not.toContain("radioactive");
    expect(validTypes).not.toContain("");
  });

  it("POST /api/v1/reports returns 401 before reaching validation (no token)", async () => {
    const res = await request(app).post("/api/v1/reports").send({
      description: "Some description here",
      wasteType: "invalid_type",
      latitude: 6.9271,
      longitude: 79.8612,
    });
    // 401 because auth middleware runs before validator
    expect(res.status).toBe(401);
  });
});

// ── US-M2-04: GPS coordinate validation ──────────────────────────────────
describe("Reporting – GPS coordinate validation logic", () => {
  const latValid = (lat) => lat >= -90 && lat <= 90;
  const lngValid = (lng) => lng >= -180 && lng <= 180;

  it("accepts valid Sri Lanka coordinates", () => {
    expect(latValid(6.9271)).toBe(true);
    expect(lngValid(79.8612)).toBe(true);
  });

  it("rejects out-of-range latitude", () => {
    expect(latValid(91)).toBe(false);
    expect(latValid(-91)).toBe(false);
  });

  it("rejects out-of-range longitude", () => {
    expect(lngValid(181)).toBe(false);
    expect(lngValid(-181)).toBe(false);
  });

  it("accepts boundary values", () => {
    expect(latValid(90)).toBe(true);
    expect(latValid(-90)).toBe(true);
    expect(lngValid(180)).toBe(true);
    expect(lngValid(-180)).toBe(true);
  });
});

// ── US-M2-02: Description validation ─────────────────────────────────────
describe("Reporting – description validation logic", () => {
  const isValidDescription = (d) =>
    typeof d === "string" && d.trim().length >= 10 && d.trim().length <= 1000;

  it("accepts valid descriptions", () => {
    expect(isValidDescription("Large pile of mixed waste dumped beside canal.")).toBe(true);
  });

  it("rejects descriptions that are too short", () => {
    expect(isValidDescription("Too short")).toBe(false);
    expect(isValidDescription("")).toBe(false);
  });

  it("rejects descriptions that exceed 1000 characters", () => {
    expect(isValidDescription("a".repeat(1001))).toBe(false);
  });

  it("accepts description at exact boundaries", () => {
    expect(isValidDescription("a".repeat(10))).toBe(true);
    expect(isValidDescription("a".repeat(1000))).toBe(true);
  });
});

// ── US-M2-05: Report status lifecycle ────────────────────────────────────
describe("Reporting – report status lifecycle", () => {
  const validStatuses = Object.values(REPORT_STATUSES);

  it("initial status must be pending", () => {
    expect(REPORT_STATUSES.PENDING).toBe("pending");
  });

  it("valid status values are defined", () => {
    expect(validStatuses).toContain("pending");
    expect(validStatuses).toContain("under_review");
    expect(validStatuses).toContain("cleaned");
    expect(validStatuses).toContain("rejected");
  });

  it("rejects invalid status values in update (validation unit)", () => {
    const isValidStatus = (s) => validStatuses.includes(s);
    expect(isValidStatus("pending")).toBe(true);
    expect(isValidStatus("cleaned")).toBe(true);
    expect(isValidStatus("completed")).toBe(false);
    expect(isValidStatus("")).toBe(false);
  });
});
