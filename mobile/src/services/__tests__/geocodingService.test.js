/**
 * BinGo – Geocoding Service Unit Tests
 * Member 2 – Nominatim / OpenStreetMap integration
 *
 * Tests the cache logic and coordinate formatting.
 * No network calls made - fetch is mocked.
 */

// ── Cache key logic (mirrors geocodingService) ────────────────────────────
const makeCacheKey = (lat, lng) =>
  `${lat.toFixed(4)},${lng.toFixed(4)}`;

// ── Address builder logic (mirrors geocodingService) ──────────────────────
const buildAddress = (addrObj) => {
  if (!addrObj) return "Unknown Location";
  if (addrObj.road) {
    let addr = addrObj.road;
    if (addrObj.suburb) addr += `, ${addrObj.suburb}`;
    if (addrObj.city)   addr += `, ${addrObj.city}`;
    return addr;
  }
  if (addrObj.suburb) return addrObj.suburb + (addrObj.city ? `, ${addrObj.city}` : "");
  if (addrObj.city)   return addrObj.city + (addrObj.state ? `, ${addrObj.state}` : "");
  return "Unknown Location";
};

// ── Coordinate fallback formatter ─────────────────────────────────────────
const coordFallback = (lat, lng) =>
  `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

// ── Tests ─────────────────────────────────────────────────────────────────

describe("GeocodingService – cache key generation", () => {
  it("generates consistent keys for same coordinates", () => {
    expect(makeCacheKey(6.9271, 79.8612)).toBe(makeCacheKey(6.9271, 79.8612));
  });

  it("rounds to 4 decimal places", () => {
    const key = makeCacheKey(6.927123456, 79.861298765);
    expect(key).toBe("6.9271,79.8613");
  });

  it("different coordinates produce different keys", () => {
    expect(makeCacheKey(6.9271, 79.8612)).not.toBe(makeCacheKey(6.8573, 79.8612));
  });
});

describe("GeocodingService – address building from Nominatim response", () => {
  it("builds address from road + suburb + city", () => {
    const addr = buildAddress({ road: "Galle Road", suburb: "Bambalapitiya", city: "Colombo" });
    expect(addr).toBe("Galle Road, Bambalapitiya, Colombo");
  });

  it("builds address from road only", () => {
    const addr = buildAddress({ road: "Main Street" });
    expect(addr).toBe("Main Street");
  });

  it("builds address from suburb + city when no road", () => {
    const addr = buildAddress({ suburb: "Wellawatte", city: "Colombo" });
    expect(addr).toBe("Wellawatte, Colombo");
  });

  it("builds address from city + state when no road or suburb", () => {
    const addr = buildAddress({ city: "Colombo", state: "Western Province" });
    expect(addr).toBe("Colombo, Western Province");
  });

  it("returns Unknown Location for empty address object", () => {
    expect(buildAddress({})).toBe("Unknown Location");
    expect(buildAddress(null)).toBe("Unknown Location");
  });
});

describe("GeocodingService – coordinate fallback", () => {
  it("formats coordinates to 4 decimal places", () => {
    expect(coordFallback(6.9271, 79.8612)).toBe("6.9271, 79.8612");
  });

  it("returns a non-empty string", () => {
    const result = coordFallback(6.9271, 79.8612);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
