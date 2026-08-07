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
  console.log("🗺️ Distributing ALL RW markers evenly across 2D spatial grid (North to South, West to East) INSIDE LapakGIS Polygons...");

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

    // Find Bounding Box of authentic polygon
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    bounds.forEach(([lat, lng]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });

    // Generate high-density interior candidate points
    const STEPS = 120;
    const latStep = (maxLat - minLat) / STEPS;
    const lngStep = (maxLng - minLng) / STEPS;
    const validInteriorPoints: [number, number][] = [];

    for (let i = 2; i < STEPS - 2; i++) {
      for (let j = 2; j < STEPS - 2; j++) {
        const testLat = minLat + i * latStep;
        const testLng = minLng + j * lngStep;
        if (isPointInPolygon(testLat, testLng, bounds)) {
          validInteriorPoints.push([testLat, testLng]);
        }
      }
    }

    const count = rws.length;
    // Calculate 2D Grid Dimensions (rows x cols)
    const cols = Math.ceil(Math.sqrt(count * 1.3));
    const rows = Math.ceil(count / cols);

    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;

    const usedPoints: [number, number][] = [];
    console.log(`\n📌 Kelurahan ${kel.name} (${count} RWs) -> 2D Grid ${rows}x${cols}:`);

    for (let idx = 0; idx < count; idx++) {
      const rw = rws[idx];
      const r = Math.floor(idx / cols);
      const c = idx % cols;

      // Target lat goes from TOP (maxLat - margin) to BOTTOM (minLat + margin)
      const targetLat = maxLat - (r + 0.5) * (latSpan / rows);
      const targetLng = minLng + (c + 0.5) * (lngSpan / cols);

      // Find closest valid interior point to targetLat, targetLng that isn't too close to used points
      let bestPoint: [number, number] = validInteriorPoints[0] || [targetLat, targetLng];
      let minDistance = Infinity;

      for (const pt of validInteriorPoints) {
        const d = getDist(pt, [targetLat, targetLng]);
        const tooClose = usedPoints.some((u) => getDist(u, pt) < 0.0005);
        if (!tooClose && d < minDistance) {
          minDistance = d;
          bestPoint = pt;
        }
      }

      // Fallback if all points too close
      if (minDistance === Infinity) {
        for (const pt of validInteriorPoints) {
          const d = getDist(pt, [targetLat, targetLng]);
          if (d < minDistance) {
            minDistance = d;
            bestPoint = pt;
          }
        }
      }

      usedPoints.push(bestPoint);
      const rwLat = Number(bestPoint[0].toFixed(7));
      const rwLng = Number(bestPoint[1].toFixed(7));
      const isInside = isPointInPolygon(rwLat, rwLng, bounds);

      await prisma.rw.update({
        where: { id: rw.id },
        data: {
          latitude: rwLat,
          longitude: rwLng,
        }
      });

      totalUpdated++;
      console.log(`   ✅ ${rw.name} (Row ${r+1}, Col ${c+1}) -> Lat: ${rwLat}, Lng: ${rwLng} | Verified Inside: ${isInside ? "YES 100%" : "NO"}`);
    }
  }

  console.log(`\n==================================================`);
  console.log(`🎉 BERHASIL MENYEBARKAN ${totalUpdated} RW MERATA DI SELURUH POLIGON LAPAKGIS!`);
  console.log(`==================================================\n`);
}

main()
  .catch((e) => {
    console.error("❌ Error running 2D grid script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
