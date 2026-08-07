import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Load authentic high-precision GIS LapakGIS data
const gisData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "./scripts/coblong_lapak_gis_full.json"), "utf-8"));

// Ray-Casting Point-in-Polygon Algorithm (Exact Math)
function isPointInPolygon(lat: number, lng: number, vs: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function getDist(p1: [number, number], p2: [number, number]) {
  const dLat = p1[0] - p2[0];
  const dLng = p1[1] - p2[1];
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

async function main() {
  console.log("🎯 Clamping ALL RW markers strictly INSIDE authentic LapakGIS Kelurahan Polygons...");

  const dbKelurahans = await prisma.kelurahan.findMany({
    include: {
      rws: {
        orderBy: { id: "asc" }
      }
    }
  });

  let totalUpdated = 0;

  for (const kel of dbKelurahans) {
    const geoKey = Object.keys(gisData).find(
      (k) => k.toLowerCase() === kel.name.toLowerCase()
    );

    if (!geoKey) {
      console.warn(`⚠️ No GIS polygon found for Kelurahan: ${kel.name}`);
      continue;
    }

    const gisKel = gisData[geoKey];
    const bounds: [number, number][] = gisKel.bounds;
    const rws = kel.rws;
    if (rws.length === 0) continue;

    // Find Bounding Box
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    bounds.forEach(([lat, lng]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });

    // Generate Candidate Grid inside polygon
    const STEPS = 100;
    const latStep = (maxLat - minLat) / STEPS;
    const lngStep = (maxLng - minLng) / STEPS;
    const validInteriorPoints: [number, number][] = [];

    for (let i = 3; i < STEPS - 3; i++) {
      for (let j = 3; j < STEPS - 3; j++) {
        const testLat = minLat + i * latStep;
        const testLng = minLng + j * lngStep;
        if (isPointInPolygon(testLat, testLng, bounds)) {
          validInteriorPoints.push([testLat, testLng]);
        }
      }
    }

    console.log(`\n📌 Kelurahan ${kel.name}: Found ${validInteriorPoints.length} valid interior GIS grid points for ${rws.length} RWs`);

    const selectedPoints: [number, number][] = [];
    const stepRatio = validInteriorPoints.length / rws.length;

    for (let idx = 0; idx < rws.length; idx++) {
      const rw = rws[idx];
      let targetIndex = Math.floor((idx + 0.5) * stepRatio);
      if (targetIndex >= validInteriorPoints.length) targetIndex = validInteriorPoints.length - 1;
      
      let candidate = validInteriorPoints[targetIndex];

      // Ensure candidate point maintains safe distance from others
      for (const p of validInteriorPoints) {
        if (selectedPoints.every((sp) => getDist(sp, p) > 0.0007)) {
          candidate = p;
          break;
        }
      }

      selectedPoints.push(candidate);
      const rwLat = Number(candidate[0].toFixed(7));
      const rwLng = Number(candidate[1].toFixed(7));

      // Verify 100% point-in-polygon math
      const isInside = isPointInPolygon(rwLat, rwLng, bounds);

      await prisma.rw.update({
        where: { id: rw.id },
        data: {
          latitude: rwLat,
          longitude: rwLng,
        }
      });

      totalUpdated++;
      console.log(`   ✅ ${rw.name} -> Lat: ${rwLat}, Lng: ${rwLng} | Inside Polygon: ${isInside ? "YES (100% Verified)" : "NO"}`);
    }
  }

  console.log(`\n==================================================`);
  console.log(`🎉 BERHASIL MENEMPATKAN ${totalUpdated} RW STRIKLIS DI DALAM POLIGON GIS LAPAK!`);
  console.log(`==================================================\n`);
}

main()
  .catch((e) => {
    console.error("❌ Error running clamp script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
