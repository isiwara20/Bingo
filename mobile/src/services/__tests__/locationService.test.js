/**
 * BinGo – Location Service Unit Tests
 * Member 2 – US-M2-02 (GPS tagging)
 *
 * Simple unit tests for location helper logic.
 * No native modules required.
 */

// ── Coordinate validation helpers (extracted from locationService) ────────
const isValidLatitude  = (lat) => typeof lat === "number" && lat >= -90  && lat <= 90;
const isValidLongitude = (lng) => typeof lng === "number" && lng >= -180 && lng <= 180;
const isValidCoordinate = (lat, lng) => isValidLatitude(lat) && isValidLongitude(lng);

// ── Mock location fallback (matches locationService useMockLocation) ──────
const getMockLocation = () => {
  const baseLat = 6.9271;
  const baseLon = 79.8612;
  return {
    latitude:  baseLat,
    longitude: baseLon,
    accuracy:  50,
  };
};

// ── Tests ─────────────────────────────────────────────────────────────────

describe("LocationService – coordinate validation", () => {
  it("accepts valid Sri Lanka coordinates", () => {
    expect(isValidCoordinate(6.9271, 79.8612)).toBe(true);
  });

  it("rejects latitude above 90", () => {
    expect(isValidLatitude(91)).toBe(false);
  });

  it("rejects latitude below -90", () => {
    expect(isValidLatitude(-91)).toBe(false);
  });

  it("rejects longitude above 180", () => {
    expect(isValidLongitude(181)).toBe(false);
  });

  it("rejects longitude below -180", () => {
    expect(isValidLongitude(-181)).toBe(false);
  });

  it("accepts boundary values", () => {
    expect(isValidLatitude(90)).toBe(true);
    expect(isValidLatitude(-90)).toBe(true);
    expect(isValidLongitude(180)).toBe(true);
    expect(isValidLongitude(-180)).toBe(true);
  });

  it("rejects non-numeric values", () => {
    expect(isValidLatitude("6.9271")).toBe(false);
    expect(isValidLongitude(null)).toBe(false);
    expect(isValidLatitude(undefined)).toBe(false);
  });
});

describe("LocationService – mock location fallback", () => {
  it("returns an object with latitude, longitude, accuracy", () => {
    const loc = getMockLocation();
    expect(loc).toHaveProperty("latitude");
    expect(loc).toHaveProperty("longitude");
    expect(loc).toHaveProperty("accuracy");
  });

  it("returns coordinates within Colombo area", () => {
    const loc = getMockLocation();
    expect(isValidCoordinate(loc.latitude, loc.longitude)).toBe(true);
    // Colombo is roughly 6.7 – 7.1 lat, 79.7 – 80.1 lng
    expect(loc.latitude).toBeGreaterThan(6.5);
    expect(loc.latitude).toBeLessThan(7.5);
    expect(loc.longitude).toBeGreaterThan(79.5);
    expect(loc.longitude).toBeLessThan(80.5);
  });

  it("accuracy is a positive number", () => {
    const loc = getMockLocation();
    expect(typeof loc.accuracy).toBe("number");
    expect(loc.accuracy).toBeGreaterThan(0);
  });
});
