import { calculateDistance } from "../src/services/kknAttendanceService.js";

function testHaversine() {
  const centerLat = -6.8915;
  const centerLng = 107.6107;

  // Point within 100m (~33 meters away)
  const insideLat = -6.8918;
  const insideLng = 107.6107;
  const distInside = calculateDistance(centerLat, centerLng, insideLat, insideLng);
  console.log(`Jarak poin dalam radius: ${distInside.toFixed(2)} meter`);
  if (distInside <= 100) {
    console.log("✅ SUKSES: Poin teridentifikasi di dalam radius 100m.");
  } else {
    console.log("❌ GAGAL: Poin salah diidentifikasi di luar radius 100m.");
  }

  // Point outside 100m (~500 meters away)
  const outsideLat = -6.8960;
  const outsideLng = 107.6107;
  const distOutside = calculateDistance(centerLat, centerLng, outsideLat, outsideLng);
  console.log(`Jarak poin di luar radius: ${distOutside.toFixed(2)} meter`);
  if (distOutside > 100) {
    console.log("✅ SUKSES: Poin teridentifikasi di luar radius 100m.");
  } else {
    console.log("❌ GAGAL: Poin salah diidentifikasi di dalam radius 100m.");
  }
}

testHaversine();
