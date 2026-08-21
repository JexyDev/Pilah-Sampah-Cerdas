/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * @file geoValidation.ts
 * @description Geographic validation utilities for KKN attendance anti-spoofing.
 *   Provides coordinate sanity checks, bounding-box validation for Kecamatan Coblong,
 *   and physics-based teleportation detection.
 */

import { calculateDistance } from "../services/kknAttendanceService.js";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Approximate bounding box for Kecamatan Coblong, Kota Bandung.
 * Source: OpenStreetMap administrative boundary data.
 * Any coordinate outside this box is considered out-of-area and rejected.
 */
export const COBLONG_BOUNDING_BOX = {
  latMin: -6.9300,
  latMax: -6.8600,
  lngMin: 107.5900,
  lngMax: 107.6500,
} as const;

/**
 * Maximum realistic walking/vehicle speed in meters per second.
 * 30 m/s ≈ 108 km/h — above this threshold consecutive pings are considered teleportation.
 */
export const MAX_REALISTIC_SPEED_MPS = 30;

/**
 * Minimum time gap (ms) between two location records for speed calculation.
 * Avoids divide-by-zero on near-simultaneous pings.
 */
export const MIN_SPEED_CHECK_INTERVAL_MS = 500;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocationPoint {
  latitude: number;
  longitude: number;
  recordedAt: Date | string;
}

export interface GeoValidationResult {
  valid: boolean;
  errorCode?: "INVALID_COORDINATES" | "OUT_OF_COBLONG_BOUNDS" | "LOCATION_TELEPORTATION_DETECTED";
  message?: string;
}

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * Checks whether a latitude/longitude pair is a finite, real-world coordinate.
 * @param lat - Latitude value to check
 * @param lng - Longitude value to check
 * @returns true if both values are finite numbers within valid WGS84 ranges
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

/**
 * Checks whether a coordinate falls within the Kecamatan Coblong bounding box.
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns true if inside the Coblong bounding box
 */
export function isWithinCoblongBounds(lat: number, lng: number): boolean {
  return (
    lat >= COBLONG_BOUNDING_BOX.latMin &&
    lat <= COBLONG_BOUNDING_BOX.latMax &&
    lng >= COBLONG_BOUNDING_BOX.lngMin &&
    lng <= COBLONG_BOUNDING_BOX.lngMax
  );
}

/**
 * Detects impossibly fast movement between two consecutive location records.
 * Uses Haversine distance / time delta to compute speed and compare against MAX_REALISTIC_SPEED_MPS.
 *
 * @param previous - Previous recorded location
 * @param current - Current location with lat/lng (recordedAt defaults to now)
 * @returns true if movement speed exceeds the maximum realistic threshold (teleportation)
 */
export function isTeleportation(
  previous: LocationPoint,
  current: { latitude: number; longitude: number; recordedAt?: Date | string }
): boolean {
  const prevTime = new Date(previous.recordedAt).getTime();
  const currTime = current.recordedAt
    ? new Date(current.recordedAt).getTime()
    : Date.now();

  const dtMs = currTime - prevTime;

  // Skip check if records are too close together or previous is in the future
  if (dtMs < MIN_SPEED_CHECK_INTERVAL_MS) return false;

  const distanceM = calculateDistance(
    Number(previous.latitude),
    Number(previous.longitude),
    current.latitude,
    current.longitude
  );

  const speedMps = distanceM / (dtMs / 1000);
  return speedMps > MAX_REALISTIC_SPEED_MPS;
}

/**
 * Full coordinate validation pipeline:
 *   1. Numeric sanity check
 *   2. Coblong bounding box check
 *   3. Teleportation check (optional — requires previous location)
 *
 * @param lat - Latitude from client
 * @param lng - Longitude from client
 * @param previousLocation - Last known location for teleportation check (optional)
 * @returns GeoValidationResult with valid flag and optional errorCode/message
 */
export function validateCoordinate(
  lat: number,
  lng: number,
  previousLocation?: LocationPoint | null
): GeoValidationResult {
  if (!isValidCoordinate(lat, lng)) {
    return {
      valid: false,
      errorCode: "INVALID_COORDINATES",
      message: "Koordinat latitude/longitude tidak valid.",
    };
  }

  if (!isWithinCoblongBounds(lat, lng)) {
    return {
      valid: false,
      errorCode: "OUT_OF_COBLONG_BOUNDS",
      message:
        "Koordinat berada di luar wilayah Kecamatan Coblong. Pastikan GPS aktif dan berada di lokasi KKN.",
    };
  }

  if (previousLocation && isTeleportation(previousLocation, { latitude: lat, longitude: lng })) {
    return {
      valid: false,
      errorCode: "LOCATION_TELEPORTATION_DETECTED",
      message:
        "Pergerakan lokasi tidak realistis. Pastikan GPS tidak dalam mode simulasi.",
    };
  }

  return { valid: true };
}
