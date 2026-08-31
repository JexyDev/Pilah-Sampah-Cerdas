/**
 * Utility functions for Geolocation and Polygon math.
 */

export interface Point {
  lat: number;
  lng: number;
}

/**
 * Ray-casting algorithm to determine if a point is inside a polygon.
 * @param point The point to check {lat, lng}
 * @param polygon The polygon represented as an array of points [{lat, lng}, ...]
 * @returns boolean true if inside, false otherwise
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let isInside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const latI = polygon[i].lat;
    const lngI = polygon[i].lng;
    const latJ = polygon[j].lat;
    const lngJ = polygon[j].lng;

    const intersect =
      latI > point.lat !== latJ > point.lat &&
      point.lng < ((lngJ - lngI) * (point.lat - latI)) / (latJ - latI) + lngI;
    if (intersect) isInside = !isInside;
  }
  return isInside;
}

/**
 * Calculates distance between two points in meters using Haversine formula.
 */
export function getDistanceInMeters(p1: Point, p2: Point): number {
  const R = 6371e3; // Earth radius in meters
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const deltaLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const deltaLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Computes the convex hull of a set of points using the Monotone Chain algorithm.
 */
export function convexHull(points: Point[]): Point[] {
  if (points.length <= 3) return points;

  const sorted = [...points].sort((a, b) => (a.lat === b.lat ? a.lng - b.lng : a.lat - b.lat));

  const cross = (o: Point, a: Point, b: Point) => {
    return (a.lat - o.lat) * (b.lng - o.lng) - (a.lng - o.lng) * (b.lat - o.lat);
  };

  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/**
 * Distance from point P to line segment AB in meters.
 */
export function distToSegmentInMeters(p: Point, a: Point, b: Point): number {
  const l2 = getDistanceInMeters(a, b);
  if (l2 === 0) return getDistanceInMeters(p, a);

  const dLat = b.lat - a.lat;
  const dLng = b.lng - a.lng;
  const t = Math.max(
    0,
    Math.min(
      1,
      ((p.lat - a.lat) * dLat + (p.lng - a.lng) * dLng) / (dLat * dLat + dLng * dLng || 1)
    )
  );
  const projection: Point = {
    lat: a.lat + t * dLat,
    lng: a.lng + t * dLng,
  };
  return getDistanceInMeters(p, projection);
}

/**
 * Checks if point is inside polygon OR within bufferMeters from any polygon edge.
 */
export function isPointInPolygonWithBuffer(
  point: Point,
  polygon: Point[],
  bufferMeters = 15
): boolean {
  if (isPointInPolygon(point, polygon)) return true;
  if (bufferMeters <= 0) return false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const dist = distToSegmentInMeters(point, polygon[i], polygon[j]);
    if (dist <= bufferMeters) return true;
  }
  return false;
}

/**
 * Compute the geographic centroid (arithmetic mean) of a set of points.
 */
export function computeCentroid(points: Point[]): Point {
  if (points.length === 0) return { lat: 0, lng: 0 };
  const sumLat = points.reduce((s, p) => s + p.lat, 0);
  const sumLng = points.reduce((s, p) => s + p.lng, 0);
  return { lat: sumLat / points.length, lng: sumLng / points.length };
}

/**
 * Buffer-inflate a convex hull polygon outward from its centroid by bufferMeters.
 * Each vertex is moved away from the centroid by the given distance.
 * Works in geographic coordinates by converting meters to approximate degrees.
 */
export function inflatePolygon(hull: Point[], bufferMeters: number, centroid?: Point): Point[] {
  if (hull.length === 0) return [];
  const center = centroid ?? computeCentroid(hull);
  // 1 degree latitude ≈ 111,320 m; longitude varies with cos(lat)
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((center.lat * Math.PI) / 180);
  if (mPerDegLng === 0) return hull;

  return hull.map((p) => {
    const dLat = p.lat - center.lat;
    const dLng = p.lng - center.lng;
    const dLatM = dLat * mPerDegLat;
    const dLngM = dLng * mPerDegLng;
    const len = Math.sqrt(dLatM * dLatM + dLngM * dLngM);
    if (len === 0) {
      // Point at centroid — push north by default
      return { lat: p.lat + bufferMeters / mPerDegLat, lng: p.lng };
    }
    const scale = (len + bufferMeters) / len;
    return {
      lat: center.lat + dLat * scale,
      lng: center.lng + dLng * scale,
    };
  });
}

/**
 * Merge multiple sets of points into a single convex hull polygon.
 * Useful for creating a unified zone boundary from scattered sub-zone positions.
 */
export function mergeZones(pointSets: Point[][]): Point[] {
  const all = pointSets.flat();
  if (all.length === 0) return [];
  if (all.length <= 3) return all;
  return convexHull(all);
}

/**
 * Generate a circular polygon approximation (N-gon) around a center point.
 * Used as fallback when there are too few student positions for a hull.
 */
export function circleToPolygon(center: Point, radiusMeters: number, sides = 16): Point[] {
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((center.lat * Math.PI) / 180);
  const points: Point[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i) / sides;
    points.push({
      lat: center.lat + (Math.sin(angle) * radiusMeters) / mPerDegLat,
      lng: center.lng + (Math.cos(angle) * radiusMeters) / (mPerDegLng || 1),
    });
  }
  return points;
}
