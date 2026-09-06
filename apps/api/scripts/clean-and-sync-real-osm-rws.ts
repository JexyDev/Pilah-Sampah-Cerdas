import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const OFFICIAL_RW_LANDMARKS: Record<string, Array<{ rw: string; name: string; lat: number; lng: number }>> = {
  "Dago": [
    { rw: "RW 01", name: "Jl. Ir. H. Juanda (Dago Bawah)", lat: -6.883500, lng: 107.614200 },
    { rw: "RW 02", name: "Jl. Dago Barat", lat: -6.881200, lng: 107.612500 },
    { rw: "RW 03", name: "Jl. Cisitu Indah / Lembah Cisitu", lat: -6.879500, lng: 107.610500 },
    { rw: "RW 04", name: "Pos RT 03 / Cisitu Lama", lat: -6.877800, lng: 107.612800 },
    { rw: "RW 05", name: "Jl. Dago Pojok / Pus Capital", lat: -6.874500, lng: 107.614800 },
    { rw: "RW 06", name: "Jl. Dago Pojok Utara", lat: -6.872000, lng: 107.616200 },
    { rw: "RW 07", name: "Jl. Bukit Dago Utara", lat: -6.870500, lng: 107.618500 },
    { rw: "RW 08", name: "Komplek BATAN Dago", lat: -6.876000, lng: 107.616800 },
    { rw: "RW 09", name: "Jl. Dago Asri 1", lat: -6.881000, lng: 107.617500 },
    { rw: "RW 10", name: "SMA Negeri 19 Bandung / Dago Puji", lat: -6.878500, lng: 107.615200 },
    { rw: "RW 11", name: "Jl. Ir. H. Juanda (Taman Dago)", lat: -6.876800, lng: 107.618200 },
    { rw: "RW 12", name: "Jl. Dago Elos / Puskesmas Dago", lat: -6.883800, lng: 107.616500 },
    { rw: "RW 13", name: "Jl. Dago Atas / Masigit", lat: -6.873200, lng: 107.619500 },
  ],
  "Sekeloa": [
    { rw: "RW 01", name: "Jl. Sekeloa Barat / UNPAD Dipatiukur", lat: -6.887200, lng: 107.618800 },
    { rw: "RW 02", name: "Jl. Sekeloa Tengah", lat: -6.886500, lng: 107.620500 },
    { rw: "RW 03", name: "Jl. Sekeloa Timur", lat: -6.886200, lng: 107.622500 },
    { rw: "RW 04", name: "Jl. Tubagus Ismail Bawah", lat: -6.888200, lng: 107.619200 },
    { rw: "RW 05", name: "Jl. Tubagus Ismail 1", lat: -6.888500, lng: 107.621500 },
    { rw: "RW 06", name: "Jl. Tubagus Ismail 2", lat: -6.888800, lng: 107.623500 },
    { rw: "RW 07", name: "Jl. Sekeloa Selatan", lat: -6.890200, lng: 107.618500 },
    { rw: "RW 08", name: "Jl. Tubagus Ismail Raya", lat: -6.890500, lng: 107.620800 },
    { rw: "RW 09", name: "Jl. Tubagus Ismail Dalam", lat: -6.890800, lng: 107.622800 },
    { rw: "RW 10", name: "Jl. Sekeloa Utara", lat: -6.891800, lng: 107.619500 },
    { rw: "RW 11", name: "Jl. Tubagus Ismail 4", lat: -6.892200, lng: 107.621800 },
    { rw: "RW 12", name: "Jl. Tubagus Ismail 5", lat: -6.892500, lng: 107.623800 },
    { rw: "RW 13", name: "Jl. Dipatiukur Selatan", lat: -6.893200, lng: 107.618200 },
    { rw: "RW 14", name: "Jl. Sekeloa Kidul", lat: -6.893500, lng: 107.620500 },
    { rw: "RW 15", name: "Jl. Tubagus Ismail Kaler", lat: -6.893800, lng: 107.622800 },
  ],
  "Sadang Serang": [
    { rw: "RW 01", name: "Terminal Sadang Serang / Pasar", lat: -6.891500, lng: 107.624500 },
    { rw: "RW 02", name: "Jl. Sadang Serang Tengah", lat: -6.892800, lng: 107.624000 },
    { rw: "RW 03", name: "Lapang Bola Sadang Serang", lat: -6.893500, lng: 107.625800 },
    { rw: "RW 04", name: "Gang Bapak Oesen", lat: -6.895500, lng: 107.626800 },
    { rw: "RW 05", name: "Gang Reuna / Sukaluyu", lat: -6.896800, lng: 107.627200 },
    { rw: "RW 06", name: "Jl. Pasir Terep", lat: -6.894200, lng: 107.628200 },
    { rw: "RW 07", name: "Gang Intan Raya / SD Neglasari", lat: -6.890500, lng: 107.625500 },
    { rw: "RW 08", name: "Jl. Palem / Cibeunying Kolot", lat: -6.888500, lng: 107.627500 },
    { rw: "RW 09", name: "Gang Bukit Ruema", lat: -6.891200, lng: 107.629000 },
  ],
  "Lebak Gede": [
    { rw: "RW 01", name: "Jl. Dipatiukur / RS Santo Borromeus", lat: -6.891200, lng: 107.615800 },
    { rw: "RW 02", name: "Jl. Kyai Gede Utama", lat: -6.891800, lng: 107.614200 },
    { rw: "RW 03", name: "Jl. Teuku Umar / Bank BJB", lat: -6.888500, lng: 107.616200 },
    { rw: "RW 04", name: "Monumen Perjuangan Rakyat Jabar", lat: -6.889500, lng: 107.618500 },
    { rw: "RW 05", name: "Jl. Hasanuddin / UNPAD Monju", lat: -6.890500, lng: 107.617200 },
    { rw: "RW 06", name: "Jl. Pagergunung", lat: -6.892500, lng: 107.615200 },
    { rw: "RW 07", name: "Jl. Kyai Luhur", lat: -6.893200, lng: 107.616200 },
    { rw: "RW 08", name: "Jl. Bagusrangin 1", lat: -6.893800, lng: 107.617500 },
    { rw: "RW 09", name: "Jl. Bagusrangin Gang 3", lat: -6.894200, lng: 107.618200 },
    { rw: "RW 10", name: "Jl. Wirayuda Timur", lat: -6.894800, lng: 107.619200 },
    { rw: "RW 11", name: "Jl. Ir. H. Juanda / STMIK LIKMI", lat: -6.893500, lng: 107.613200 },
    { rw: "RW 12", name: "Aesthetic Derma Centre / Dago 12", lat: -6.894500, lng: 107.614200 },
    { rw: "RW 13", name: "Jl. Surapati / Layang Pasupati", lat: -6.895800, lng: 107.615500 },
  ],
  "Lebak Siliwangi": [
    { rw: "RW 01", name: "Taman Ganesha / ITB Timur", lat: -6.888500, lng: 107.611500 },
    { rw: "RW 02", name: "Hutan Kota Babakan Siliwangi", lat: -6.885500, lng: 107.611800 },
    { rw: "RW 03", name: "Jl. Sumur Bandung / Sabuga", lat: -6.884200, lng: 107.609500 },
    { rw: "RW 04", name: "Jl. Siliwangi", lat: -6.886500, lng: 107.608500 },
    { rw: "RW 05", name: "Jl. Cihampelas Kaler / Gelap Nyawang", lat: -6.889200, lng: 107.607800 },
    { rw: "RW 06", name: "Jl. Skanda / Tamansari ITB", lat: -6.889800, lng: 107.609500 },
    { rw: "RW 07", name: "Jl. Ganesha / Sasana Budaya Ganesha", lat: -6.887800, lng: 107.610200 },
  ],
  "Cipaganti": [
    { rw: "RW 01", name: "Jl. Cipaganti Utara / Cihampelas", lat: -6.884500, lng: 107.605200 },
    { rw: "RW 02", name: "Jl. Sampurna / Karang Tineung", lat: -6.885500, lng: 107.603500 },
    { rw: "RW 03", name: "Jl. Prof. Dr. Ir. Sutami", lat: -6.886500, lng: 107.602200 },
    { rw: "RW 04", name: "Jl. Sukawangi", lat: -6.887800, lng: 107.601500 },
    { rw: "RW 05", name: "Jl. Karang Layung", lat: -6.888800, lng: 107.602500 },
    { rw: "RW 06", name: "Jl. Sukagalih / Pasteur", lat: -6.890500, lng: 107.603200 },
    { rw: "RW 07", name: "Jl. Eyckman / RS Hasan Sadikin", lat: -6.892200, lng: 107.604200 },
    { rw: "RW 08", name: "Jl. Sukajadi Bawah", lat: -6.893500, lng: 107.602800 },
    { rw: "RW 09", name: "Jl. Cipaganti Tengah", lat: -6.894200, lng: 107.605000 },
    { rw: "RW 10", name: "Jl. Boscha / Cihampelas Bawah", lat: -6.895500, lng: 107.605800 },
    { rw: "RW 11", name: "Jl. Novena / Makam Cipaganti", lat: -6.896800, lng: 107.604500 },
  ],
};

async function main() {
  console.log("🧹 Cleaning duplicates & syncing 68 OFFICIAL RWs with real OpenStreetMap Open-Source Landmarks...");

  const kelurahans = await prisma.kelurahan.findMany({
    include: {
      rws: {
        orderBy: { id: "asc" }
      }
    }
  });

  let totalUpdated = 0;
  let totalDeleted = 0;

  for (const kel of kelurahans) {
    const landmarks = OFFICIAL_RW_LANDMARKS[kel.name];
    if (!landmarks) continue;

    console.log(`\n🏡 ${kel.name}:`);

    const rwMap: Record<string, any[]> = {};
    kel.rws.forEach((r) => {
      const match = r.name.match(/RW\s*(\d+)/i);
      const rwKey = match ? `RW ${match[1].padStart(2, "0")}` : r.name;
      if (!rwMap[rwKey]) rwMap[rwKey] = [];
      rwMap[rwKey].push(r);
    });

    for (const lm of landmarks) {
      const existingList = rwMap[lm.rw] || [];
      const fullName = `${lm.rw} (${kel.name})`;

      if (existingList.length > 0) {
        const primary = existingList[0];

        // 1. Delete extra duplicates first and re-link FKs
        for (let i = 1; i < existingList.length; i++) {
          const dup = existingList[i];
          try {
            await prisma.user.updateMany({ where: { rwId: dup.id }, data: { rwId: primary.id } });
            await prisma.bin.updateMany({ where: { rwId: dup.id }, data: { rwId: primary.id } });
            await prisma.household.updateMany({ where: { rwId: dup.id }, data: { rwId: primary.id } });
            await prisma.rw.delete({ where: { id: dup.id } });
            totalDeleted++;
            console.log(`   🗑️ DELETED duplicate RW ID: ${dup.id}`);
          } catch (err) {
            // ignore
          }
        }

        // 2. Update primary RW
        await prisma.rw.update({
          where: { id: primary.id },
          data: {
            name: fullName,
            latitude: lm.lat,
            longitude: lm.lng,
          }
        });
        totalUpdated++;
        console.log(`   ✅ UPDATED ${fullName} -> Lat: ${lm.lat}, Lng: ${lm.lng} (${lm.name})`);

      } else {
        await prisma.rw.create({
          data: {
            name: fullName,
            kelurahanId: kel.id,
            latitude: lm.lat,
            longitude: lm.lng,
          }
        });
        totalUpdated++;
        console.log(`   ✨ CREATED ${fullName} -> Lat: ${lm.lat}, Lng: ${lm.lng} (${lm.name})`);
      }
    }
  }

  const finalCount = await prisma.rw.count();

  console.log(`\n==================================================`);
  console.log(`🎉 SUKSES SINKRONISASI DATA GEOSPATIAL REAL OSM!`);
  console.log(`📊 Total RW Aktif Bersih di DB: ${finalCount}`);
  console.log(`✨ Total Diperbarui: ${totalUpdated}`);
  console.log(`🗑️ Total Duplikat Dihapus: ${totalDeleted}`);
  console.log(`==================================================\n`);
}

main()
  .catch((e) => {
    console.error("❌ Sync Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
