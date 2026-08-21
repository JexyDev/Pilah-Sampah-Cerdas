/**
 * Project: BERSEKA
 * Tests: geoValidation.ts utility
 * Coverage: isValidCoordinate, isWithinCoblongBounds, isTeleportation, validateCoordinate
 */

import { describe, it, expect } from "vitest";
import {
  isValidCoordinate,
  isWithinCoblongBounds,
  isTeleportation,
  validateCoordinate,
  COBLONG_BOUNDING_BOX,
  MAX_REALISTIC_SPEED_MPS,
} from "./geoValidation.js";

// ─── Koordinat referensi ───────────────────────────────────────────────────────
// Koordinat di dalam Kecamatan Coblong
const COBLONG_CENTER = { lat: -6.892, lng: 107.612 };
// Koordinat di luar Coblong (misal: Alun-alun Bandung, Kecamatan Sumur Bandung)
const OUTSIDE_COBLONG = { lat: -6.9218, lng: 107.6069 };
// Koordinat absurd (luar Indonesia)
const JAKARTA_PUSAT = { lat: -6.2088, lng: 106.8456 };

const pastTime = (secondsAgo: number) =>
  new Date(Date.now() - secondsAgo * 1000);

// ─── isValidCoordinate ────────────────────────────────────────────────────────
describe("isValidCoordinate", () => {
  it("returns true for valid WGS84 coordinates", () => {
    expect(isValidCoordinate(COBLONG_CENTER.lat, COBLONG_CENTER.lng)).toBe(true);
    expect(isValidCoordinate(0, 0)).toBe(true);
    expect(isValidCoordinate(-90, -180)).toBe(true);
    expect(isValidCoordinate(90, 180)).toBe(true);
  });

  it("returns false for NaN", () => {
    expect(isValidCoordinate(NaN, 107.6)).toBe(false);
    expect(isValidCoordinate(-6.8, NaN)).toBe(false);
  });

  it("returns false for Infinity", () => {
    expect(isValidCoordinate(Infinity, 107.6)).toBe(false);
  });

  it("returns false for out-of-range values", () => {
    expect(isValidCoordinate(91, 107.6)).toBe(false);
    expect(isValidCoordinate(-6.8, 181)).toBe(false);
  });
});

// ─── isWithinCoblongBounds ────────────────────────────────────────────────────
describe("isWithinCoblongBounds", () => {
  it("returns true for coordinate inside Coblong", () => {
    expect(isWithinCoblongBounds(COBLONG_CENTER.lat, COBLONG_CENTER.lng)).toBe(true);
  });

  it("returns false for coordinate outside Coblong (Jakarta)", () => {
    expect(isWithinCoblongBounds(JAKARTA_PUSAT.lat, JAKARTA_PUSAT.lng)).toBe(false);
  });

  it("returns false for coordinate outside Coblong (southern boundary)", () => {
    expect(isWithinCoblongBounds(COBLONG_BOUNDING_BOX.latMin - 0.001, COBLONG_CENTER.lng)).toBe(false);
  });

  it("returns false for coordinate outside Coblong (eastern boundary)", () => {
    expect(isWithinCoblongBounds(COBLONG_CENTER.lat, COBLONG_BOUNDING_BOX.lngMax + 0.001)).toBe(false);
  });

  it("returns true for coordinate exactly on boundary edge", () => {
    expect(isWithinCoblongBounds(COBLONG_BOUNDING_BOX.latMin, COBLONG_BOUNDING_BOX.lngMin)).toBe(true);
  });
});

// ─── isTeleportation ──────────────────────────────────────────────────────────
describe("isTeleportation", () => {
  it("returns false for realistic walking speed", () => {
    // 5 m/s walking, 10 second gap → 50m movement → no teleportation
    const previous = {
      latitude: COBLONG_CENTER.lat,
      longitude: COBLONG_CENTER.lng,
      recordedAt: pastTime(10),
    };
    // ~50m north (rough)
    const current = { latitude: COBLONG_CENTER.lat + 0.00045, longitude: COBLONG_CENTER.lng };
    expect(isTeleportation(previous, current)).toBe(false);
  });

  it("returns true for teleportation (Coblong to Jakarta in 5 seconds)", () => {
    const previous = {
      latitude: COBLONG_CENTER.lat,
      longitude: COBLONG_CENTER.lng,
      recordedAt: pastTime(5),
    };
    const current = { latitude: JAKARTA_PUSAT.lat, longitude: JAKARTA_PUSAT.lng };
    expect(isTeleportation(previous, current)).toBe(true);
  });

  it("returns false when time gap is below minimum threshold", () => {
    // Two near-simultaneous pings — skip speed check to avoid divide-by-zero edge case
    const previous = {
      latitude: COBLONG_CENTER.lat,
      longitude: COBLONG_CENTER.lng,
      recordedAt: new Date(Date.now() - 100), // 100ms ago
    };
    const current = { latitude: JAKARTA_PUSAT.lat, longitude: JAKARTA_PUSAT.lng };
    // Gap < MIN_SPEED_CHECK_INTERVAL_MS → skip check → returns false
    expect(isTeleportation(previous, current)).toBe(false);
  });

  it(`returns true when speed exceeds ${MAX_REALISTIC_SPEED_MPS} m/s`, () => {
    // Move 10km in 10 seconds → 1000 m/s >> 30 m/s threshold
    const previous = {
      latitude: COBLONG_CENTER.lat,
      longitude: COBLONG_CENTER.lng,
      recordedAt: pastTime(10),
    };
    // ~10km east
    const current = { latitude: COBLONG_CENTER.lat, longitude: COBLONG_CENTER.lng + 0.09 };
    expect(isTeleportation(previous, current)).toBe(true);
  });
});

// ─── validateCoordinate ───────────────────────────────────────────────────────
describe("validateCoordinate", () => {
  it("returns valid:true for good coordinate inside Coblong", () => {
    const result = validateCoordinate(COBLONG_CENTER.lat, COBLONG_CENTER.lng);
    expect(result.valid).toBe(true);
  });

  it("returns INVALID_COORDINATES for NaN input", () => {
    const result = validateCoordinate(NaN, COBLONG_CENTER.lng);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("INVALID_COORDINATES");
  });

  it("returns OUT_OF_COBLONG_BOUNDS for coordinate outside Coblong", () => {
    const result = validateCoordinate(JAKARTA_PUSAT.lat, JAKARTA_PUSAT.lng);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("OUT_OF_COBLONG_BOUNDS");
  });

  it("returns LOCATION_TELEPORTATION_DETECTED when previous location indicates teleportation", () => {
    const previous = {
      latitude: COBLONG_CENTER.lat,
      longitude: COBLONG_CENTER.lng,
      recordedAt: pastTime(5),
    };
    // Current is still within Coblong but movement is physically impossible (other side of Coblong in 5s)
    // Use two Coblong-adjacent but fast-moving points
    const result = validateCoordinate(
      COBLONG_BOUNDING_BOX.latMin + 0.001,
      COBLONG_BOUNDING_BOX.lngMin + 0.001,
      {
        latitude: COBLONG_BOUNDING_BOX.latMax - 0.001,
        longitude: COBLONG_BOUNDING_BOX.lngMax - 0.001,
        recordedAt: pastTime(1), // 1 second gap, ~8km distance → teleportation
      }
    );
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("LOCATION_TELEPORTATION_DETECTED");
  });

  it("returns valid:true without previous location (first ping)", () => {
    const result = validateCoordinate(COBLONG_CENTER.lat, COBLONG_CENTER.lng, null);
    expect(result.valid).toBe(true);
  });
});
