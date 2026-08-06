/**
 * Check if a point (lat, lng) lies within a polygon using the Ray-Casting algorithm.
 * @param point Target coordinate point { latitude, longitude }
 * @param polygon Array of boundary points [{ latitude, longitude }]
 */
export function isPointInPolygon(point, polygon) {
    if (!polygon || polygon.length < 3)
        return true; // Default fallback if polygon not defined
    const x = point.longitude;
    const y = point.latitude;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].longitude;
        const yi = polygon[i].latitude;
        const xj = polygon[j].longitude;
        const yj = polygon[j].latitude;
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect)
            inside = !inside;
    }
    return inside;
}
/**
 * Calculate distance in meters between two coordinates using Haversine formula.
 */
export function calculateHaversineDistance(pt1, pt2) {
    const R = 6371e3; // Earth radius in meters
    const rad1 = (pt1.latitude * Math.PI) / 180;
    const rad2 = (pt2.latitude * Math.PI) / 180;
    const deltaLat = ((pt2.latitude - pt1.latitude) * Math.PI) / 180;
    const deltaLng = ((pt2.longitude - pt1.longitude) * Math.PI) / 180;
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(rad1) * Math.cos(rad2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
