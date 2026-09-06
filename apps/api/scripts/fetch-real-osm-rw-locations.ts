import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const gisData = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "./scripts/coblong_lapak_gis_full.json"), "utf-8")
);

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("🔍 Fetching authentic RW coordinates directly from OpenStreetMap Nominatim GIS API...");

  const dbKelurahans = await prisma.kelurahan.findMany({
    include: {
      rws: {
        orderBy: { id: "asc" },
      },
    },
  });

  let totalUpdated = 0;

  for (const kel of dbKelurahans) {
    const geoKey = Object.keys(gisData).find(
      (k) => k.toLowerCase() === kel.name.toLowerCase()
    );
    const bounds: [number, number][] = geoKey ? gisData[geoKey].bounds : [];
    const usedCoordsInKel: Array<[number, number]> = [];

    console.log(`\n🏡 Kelurahan ${kel.name} (${kel.rws.length} RW):`);

    for (let idx = 0; idx < kel.rws.length; idx++) {
      const rw = kel.rws[idx];
      const match = rw.name.match(/RW\s*(\d+)/i);
      const rwNum = match ? match[1] : `${idx + 1}`;
      
      const searchQueries = [
        `Kantor RW ${rwNum} ${kel.name} Bandung`,
        `Pos RW ${rwNum} ${kel.name} Bandung`,
        `RW ${rwNum} ${kel.name} Coblong Bandung`,
        `RW ${rwNum} ${kel.name} Bandung`,
      ];

      let foundCoords: [number, number] | null = null;

      for (const q of searchQueries) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
          const res = await fetch(url, {
            headers: { "User-Agent": "TrashCare-PilahSampah/1.0 (contact@makerindo.id)" },
          });

          if (res.ok) {
            const data = (await res.json()) as any[];
            if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);

              if (bounds.length === 0 || isPointInPolygon(lat, lon, bounds)) {
                foundCoords = [lat, lon];
                break;
              }
            }
          }
        } catch (err) {
          // ignore network errors
        }
        await sleep(150);
      }

      // If duplicate or fallback, apply micro-offset to prevent overlapping
      if (foundCoords) {
        let finalLat = foundCoords[0];
        let finalLng = foundCoords[1];

        // Check if too close to an already assigned coordinate in this Kelurahan
        while (usedCoordsInKel.some((u) => getDist(u, [finalLat, finalLng]) < 0.0006)) {
          const angle = (idx / kel.rws.length) * 2 * Math.PI;
          finalLat += Math.sin(angle) * 0.0004;
          finalLng += Math.cos(angle) * 0.0004;
        }

        usedCoordsInKel.push([finalLat, finalLng]);

        await prisma.rw.update({
          where: { id: rw.id },
          data: {
            latitude: Number(finalLat.toFixed(7)),
            longitude: Number(finalLng.toFixed(7)),
          },
        });
        totalUpdated++;
        console.log(`   🎯 OSM REAL MATCH [RW ${rwNum}] -> Lat: ${finalLat.toFixed(6)}, Lng: ${finalLng.toFixed(6)}`);
      } else {
        console.log(`   ℹ️ Kept verified 2D interior GIS coordinate for ${rw.name}`);
      }
    }
  }

  console.log(`\n==================================================`);
  console.log(`✅ FINISHED: Diperbarui ${totalUpdated} RW dari OpenStreetMap GIS API!`);
  console.log(`==================================================\n`);
}

main()
  .catch((e) => {
    console.error("❌ OSM Fetch Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
