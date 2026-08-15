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
    const xi = polygon[i].lat,
      yi = polygon[i].lng;
    const xj = polygon[j].lat,
      yj = polygon[j].lng;

    const intersect =
      yi > point.lng !== yj > point.lng &&
      point.lat < ((xj - xi) * (point.lng - yi)) / (yj - yi) + xi;
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
    Math.min(1, ((p.lat - a.lat) * dLat + (p.lng - a.lng) * dLng) / (dLat * dLat + dLng * dLng || 1))
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
export function isPointInPolygonWithBuffer(point: Point, polygon: Point[], bufferMeters = 15): boolean {
  if (isPointInPolygon(point, polygon)) return true;
  if (bufferMeters <= 0) return false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const dist = distToSegmentInMeters(point, polygon[i], polygon[j]);
    if (dist <= bufferMeters) return true;
  }
  return false;
}
