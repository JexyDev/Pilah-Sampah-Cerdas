/**
 * Utility functions for Geolocation and Polygon math.
 */
/**
 * Ray-casting algorithm to determine if a point is inside a polygon.
 * @param point The point to check {lat, lng}
 * @param polygon The polygon represented as an array of points [{lat, lng}, ...]
 * @returns boolean true if inside, false otherwise
 */
export function isPointInPolygon(point, polygon) {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;
        const intersect = yi > point.lng !== yj > point.lng &&
            point.lat < ((xj - xi) * (point.lng - yi)) / (yj - yi) + xi;
        if (intersect)
            isInside = !isInside;
    }
    return isInside;
}
/**
 * Calculates distance between two points in meters using Haversine formula.
 */
export function getDistanceInMeters(p1, p2) {
    const R = 6371e3; // Earth radius in meters
    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const deltaLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const deltaLng = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
/**
 * Computes the convex hull of a set of points using the Monotone Chain algorithm.
 */
export function convexHull(points) {
    if (points.length <= 3)
        return points;
    const sorted = [...points].sort((a, b) => (a.lat === b.lat ? a.lng - b.lng : a.lat - b.lat));
    const cross = (o, a, b) => {
        return (a.lat - o.lat) * (b.lng - o.lng) - (a.lng - o.lng) * (b.lat - o.lat);
    };
    const lower = [];
    for (const p of sorted) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
            lower.pop();
        }
        lower.push(p);
    }
    const upper = [];
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
