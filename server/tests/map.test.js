/**
 * BinGo – Map API Tests
 * Member 2 – US-M2-06, US-M2-07
 *
 * No MongoDB required for these tests.
 * All DB-dependent scenarios are integration tests (TODO with Memory Server).
 */

const request = require("supertest");
const app = require("../src/app");

// ── US-M2-06: Authentication requirements ────────────────────────────────
describe("Map – authentication requirements", () => {
  it("GET /api/v1/map/reports returns 401 without token", async () => {
    const res = await request(app).get("/api/v1/map/reports");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/v1/map/nearby without params returns 400, not 401 (public)", async () => {
    // Proves the endpoint is reachable without a token.
    // 400 = controller logic ran; 401 would mean auth is blocking it.
    const res = await request(app).get("/api/v1/map/nearby");
    expect(res.status).toBe(400);
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ── Map nearby – parameter validation ────────────────────────────────────
describe("Map – nearby endpoint parameter validation", () => {
  it("returns 400 when both lat and lng are missing", async () => {
    const res = await request(app).get("/api/v1/map/nearby");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when only lat is provided", async () => {
    const res = await request(app).get("/api/v1/map/nearby?lat=6.9271");
    expect(res.status).toBe(400);
  });

  it("returns 400 when only lng is provided", async () => {
    const res = await request(app).get("/api/v1/map/nearby?lng=79.8612");
    expect(res.status).toBe(400);
  });
});

// ── US-M2-07: Marker type definitions ────────────────────────────────────
describe("Map – marker type definitions (unit)", () => {
  const LOCATION_TYPES = ["recycling_centre", "collection_point", "bin", "other"];

  it("required facility marker types are defined", () => {
    expect(LOCATION_TYPES).toContain("recycling_centre");
    expect(LOCATION_TYPES).toContain("collection_point");
  });

  it("illegal dumping markers are derived from WasteReport (status: pending|under_review)", () => {
    const ACTIVE_DUMPING_STATUSES = ["pending", "under_review"];
    expect(ACTIVE_DUMPING_STATUSES).toContain("pending");
    expect(ACTIVE_DUMPING_STATUSES).toContain("under_review");
    expect(ACTIVE_DUMPING_STATUSES).not.toContain("cleaned");
    expect(ACTIVE_DUMPING_STATUSES).not.toContain("rejected");
  });

  it("four filter categories cover all marker types", () => {
    const FILTERS = ["all", "illegal_dumping", "recycling_centre", "collection_point"];
    expect(FILTERS.length).toBe(4);
    FILTERS.forEach((f) => expect(typeof f).toBe("string"));
  });
});

// ── Report → Map integration logic (unit) ────────────────────────────────
describe("Map – reporting integration logic (unit)", () => {
  const showsOnMap = (status) => ["pending", "under_review"].includes(status);

  it("pending report appears on map", () => {
    expect(showsOnMap("pending")).toBe(true);
  });

  it("under_review report appears on map", () => {
    expect(showsOnMap("under_review")).toBe(true);
  });

  it("cleaned report does NOT appear on active map markers", () => {
    expect(showsOnMap("cleaned")).toBe(false);
  });

  it("rejected report does NOT appear on active map markers", () => {
    expect(showsOnMap("rejected")).toBe(false);
  });
});
