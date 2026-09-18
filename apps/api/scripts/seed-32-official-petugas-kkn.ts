/**
 * Project: BERSEKA
 * Script: Seed 32 Official Petugas Residu KKN Accounts
 *
 * Menghasilkan 32 akun resmi Petugas Residu yang dipetakan 1:1 dengan 32 Kelompok KKN
 * di 6 Kelurahan Kecamatan Coblong:
 * - Sadang Serang : 11 Kelompok (Petugas Sadang Serang 01 s/d 11)
 * - Sekeloa       : 6 Kelompok (Petugas Sekeloa 01 s/d 06)
 * - Dago          : 4 Kelompok (Petugas Dago 01 s/d 04)
 * - Lebak Gede    : 4 Kelompok (Petugas Lebak Gede 01 s/d 04)
 * - Cipaganti     : 4 Kelompok (Petugas Cipaganti 01 s/d 04)
 * - Lebak Siliwangi: 3 Kelompok (Petugas Lebak Siliwangi 01 s/d 03)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { assertNotProduction } from "../src/utils/vpsSafetyGuard.js";

const prisma = new PrismaClient();

export interface PetugasAccountSpec {
  no: number;
  kelurahan: string;
  kelompokName: string;
  name: string;
  namaDisplay: string;
  phone: string;
  email: string;
  zone: string;
}

export const OFFICIAL_32_PETUGAS_SPECS: PetugasAccountSpec[] = [
  // 1. Kelurahan Sadang Serang (11 Kelompok)
  { no: 1,  kelurahan: "Sadang Serang", kelompokName: "Kelompok 1",  name: "Petugas Sadang Serang 01", namaDisplay: "Petugas Sadang Serang 01", phone: "+628139040001", email: "petugas01.sadangserang@berseka.id", zone: "Kelompok 01 (Sadang Serang), Kec. Coblong" },
  { no: 2,  kelurahan: "Sadang Serang", kelompokName: "Kelompok 2",  name: "Petugas Sadang Serang 02", namaDisplay: "Petugas Sadang Serang 02", phone: "+628139040002", email: "petugas02.sadangserang@berseka.id", zone: "Kelompok 02 (Sadang Serang), Kec. Coblong" },
  { no: 3,  kelurahan: "Sadang Serang", kelompokName: "Kelompok 3",  name: "Petugas Sadang Serang 03", namaDisplay: "Petugas Sadang Serang 03", phone: "+628139040003", email: "petugas03.sadangserang@berseka.id", zone: "Kelompok 03 (Sadang Serang), Kec. Coblong" },
  { no: 4,  kelurahan: "Sadang Serang", kelompokName: "Kelompok 4",  name: "Petugas Sadang Serang 04", namaDisplay: "Petugas Sadang Serang 04", phone: "+628139040004", email: "petugas04.sadangserang@berseka.id", zone: "Kelompok 04 (Sadang Serang), Kec. Coblong" },
  { no: 5,  kelurahan: "Sadang Serang", kelompokName: "Kelompok 5",  name: "Petugas Sadang Serang 05", namaDisplay: "Petugas Sadang Serang 05", phone: "+628139040005", email: "petugas05.sadangserang@berseka.id", zone: "Kelompok 05 (Sadang Serang), Kec. Coblong" },
  { no: 6,  kelurahan: "Sadang Serang", kelompokName: "Kelompok 6",  name: "Petugas Sadang Serang 06", namaDisplay: "Petugas Sadang Serang 06", phone: "+628139040006", email: "petugas06.sadangserang@berseka.id", zone: "Kelompok 06 (Sadang Serang), Kec. Coblong" },
  { no: 7,  kelurahan: "Sadang Serang", kelompokName: "Kelompok 7",  name: "Petugas Sadang Serang 07", namaDisplay: "Petugas Sadang Serang 07", phone: "+628139040007", email: "petugas07.sadangserang@berseka.id", zone: "Kelompok 07 (Sadang Serang), Kec. Coblong" },
  { no: 8,  kelurahan: "Sadang Serang", kelompokName: "Kelompok 8",  name: "Petugas Sadang Serang 08", namaDisplay: "Petugas Sadang Serang 08", phone: "+628139040008", email: "petugas08.sadangserang@berseka.id", zone: "Kelompok 08 (Sadang Serang), Kec. Coblong" },
  { no: 9,  kelurahan: "Sadang Serang", kelompokName: "Kelompok 9",  name: "Petugas Sadang Serang 09", namaDisplay: "Petugas Sadang Serang 09", phone: "+628139040009", email: "petugas09.sadangserang@berseka.id", zone: "Kelompok 09 (Sadang Serang), Kec. Coblong" },
  { no: 10, kelurahan: "Sadang Serang", kelompokName: "Kelompok 10", name: "Petugas Sadang Serang 10", namaDisplay: "Petugas Sadang Serang 10", phone: "+628139040010", email: "petugas10.sadangserang@berseka.id", zone: "Kelompok 10 (Sadang Serang), Kec. Coblong" },
  { no: 11, kelurahan: "Sadang Serang", kelompokName: "Kelompok 11", name: "Petugas Sadang Serang 11", namaDisplay: "Petugas Sadang Serang 11", phone: "+628139040011", email: "petugas11.sadangserang@berseka.id", zone: "Kelompok 11 (Sadang Serang), Kec. Coblong" },

  // 2. Kelurahan Sekeloa (6 Kelompok)
  { no: 12, kelurahan: "Sekeloa", kelompokName: "Kelompok 1", name: "Petugas Sekeloa 01", namaDisplay: "Petugas Sekeloa 01", phone: "+628139050001", email: "petugas01.sekeloa@berseka.id", zone: "Kelompok 01 (Sekeloa), Kec. Coblong" },
  { no: 13, kelurahan: "Sekeloa", kelompokName: "Kelompok 2", name: "Petugas Sekeloa 02", namaDisplay: "Petugas Sekeloa 02", phone: "+628139050002", email: "petugas02.sekeloa@berseka.id", zone: "Kelompok 02 (Sekeloa), Kec. Coblong" },
  { no: 14, kelurahan: "Sekeloa", kelompokName: "Kelompok 3", name: "Petugas Sekeloa 03", namaDisplay: "Petugas Sekeloa 03", phone: "+628139050003", email: "petugas03.sekeloa@berseka.id", zone: "Kelompok 03 (Sekeloa), Kec. Coblong" },
  { no: 15, kelurahan: "Sekeloa", kelompokName: "Kelompok 4", name: "Petugas Sekeloa 04", namaDisplay: "Petugas Sekeloa 04", phone: "+628139050004", email: "petugas04.sekeloa@berseka.id", zone: "Kelompok 04 (Sekeloa), Kec. Coblong" },
  { no: 16, kelurahan: "Sekeloa", kelompokName: "Kelompok 5", name: "Petugas Sekeloa 05", namaDisplay: "Petugas Sekeloa 05", phone: "+628139050005", email: "petugas05.sekeloa@berseka.id", zone: "Kelompok 05 (Sekeloa), Kec. Coblong" },
  { no: 17, kelurahan: "Sekeloa", kelompokName: "Kelompok 6", name: "Petugas Sekeloa 06", namaDisplay: "Petugas Sekeloa 06", phone: "+628139050006", email: "petugas06.sekeloa@berseka.id", zone: "Kelompok 06 (Sekeloa), Kec. Coblong" },

  // 3. Kelurahan Dago (4 Kelompok)
  { no: 18, kelurahan: "Dago", kelompokName: "Kelompok 1", name: "Petugas Dago 01", namaDisplay: "Petugas Dago 01", phone: "+628139010001", email: "petugas01.dago@berseka.id", zone: "Kelompok 01 (Dago), Kec. Coblong" },
  { no: 19, kelurahan: "Dago", kelompokName: "Kelompok 2", name: "Petugas Dago 02", namaDisplay: "Petugas Dago 02", phone: "+628139010002", email: "petugas02.dago@berseka.id", zone: "Kelompok 02 (Dago), Kec. Coblong" },
  { no: 20, kelurahan: "Dago", kelompokName: "Kelompok 3", name: "Petugas Dago 03", namaDisplay: "Petugas Dago 03", phone: "+628139010003", email: "petugas03.dago@berseka.id", zone: "Kelompok 03 (Dago), Kec. Coblong" },
  { no: 21, kelurahan: "Dago", kelompokName: "Kelompok 4", name: "Petugas Dago 04", namaDisplay: "Petugas Dago 04", phone: "+628139010004", email: "petugas04.dago@berseka.id", zone: "Kelompok 04 (Dago), Kec. Coblong" },

  // 4. Kelurahan Lebak Gede (4 Kelompok)
  { no: 22, kelurahan: "Lebak Gede", kelompokName: "Kelompok 1", name: "Petugas Lebak Gede 01", namaDisplay: "Petugas Lebak Gede 01", phone: "+628139020001", email: "petugas01.lebakgede@berseka.id", zone: "Kelompok 01 (Lebak Gede), Kec. Coblong" },
  { no: 23, kelurahan: "Lebak Gede", kelompokName: "Kelompok 2", name: "Petugas Lebak Gede 02", namaDisplay: "Petugas Lebak Gede 02", phone: "+628139020002", email: "petugas02.lebakgede@berseka.id", zone: "Kelompok 02 (Lebak Gede), Kec. Coblong" },
  { no: 24, kelurahan: "Lebak Gede", kelompokName: "Kelompok 3", name: "Petugas Lebak Gede 03", namaDisplay: "Petugas Lebak Gede 03", phone: "+628139020003", email: "petugas03.lebakgede@berseka.id", zone: "Kelompok 03 (Lebak Gede), Kec. Coblong" },
  { no: 25, kelurahan: "Lebak Gede", kelompokName: "Kelompok 4", name: "Petugas Lebak Gede 04", namaDisplay: "Petugas Lebak Gede 04", phone: "+628139020004", email: "petugas04.lebakgede@berseka.id", zone: "Kelompok 04 (Lebak Gede), Kec. Coblong" },

  // 5. Kelurahan Cipaganti (4 Kelompok)
  { no: 26, kelurahan: "Cipaganti", kelompokName: "Kelompok 1", name: "Petugas Cipaganti 01", namaDisplay: "Petugas Cipaganti 01", phone: "+628139060001", email: "petugas01.cipaganti@berseka.id", zone: "Kelompok 01 (Cipaganti), Kec. Coblong" },
  { no: 27, kelurahan: "Cipaganti", kelompokName: "Kelompok 2", name: "Petugas Cipaganti 02", namaDisplay: "Petugas Cipaganti 02", phone: "+628139060002", email: "petugas02.cipaganti@berseka.id", zone: "Kelompok 02 (Cipaganti), Kec. Coblong" },
  { no: 28, kelurahan: "Cipaganti", kelompokName: "Kelompok 3", name: "Petugas Cipaganti 03", namaDisplay: "Petugas Cipaganti 03", phone: "+628139060003", email: "petugas03.cipaganti@berseka.id", zone: "Kelompok 03 (Cipaganti), Kec. Coblong" },
  { no: 29, kelurahan: "Cipaganti", kelompokName: "Kelompok 4", name: "Petugas Cipaganti 04", namaDisplay: "Petugas Cipaganti 04", phone: "+628139060004", email: "petugas04.cipaganti@berseka.id", zone: "Kelompok 04 (Cipaganti), Kec. Coblong" },

  // 6. Kelurahan Lebak Siliwangi (3 Kelompok)
  { no: 30, kelurahan: "Lebak Siliwangi", kelompokName: "Kelompok 1", name: "Petugas Lebak Siliwangi 01", namaDisplay: "Petugas Lebak Siliwangi 01", phone: "+628139030001", email: "petugas01.lebaksiliwangi@berseka.id", zone: "Kelompok 01 (Lebak Siliwangi), Kec. Coblong" },
  { no: 31, kelurahan: "Lebak Siliwangi", kelompokName: "Kelompok 2", name: "Petugas Lebak Siliwangi 02", namaDisplay: "Petugas Lebak Siliwangi 02", phone: "+628139030002", email: "petugas02.lebaksiliwangi@berseka.id", zone: "Kelompok 02 (Lebak Siliwangi), Kec. Coblong" },
  { no: 32, kelurahan: "Lebak Siliwangi", kelompokName: "Kelompok 3", name: "Petugas Lebak Siliwangi 03", namaDisplay: "Petugas Lebak Siliwangi 03", phone: "+628139030003", email: "petugas03.lebaksiliwangi@berseka.id", zone: "Kelompok 03 (Lebak Siliwangi), Kec. Coblong" },
];

export const DEFAULT_OFFICIAL_PASSWORD = "PetugasCoblong2026!";

async function main() {
  assertNotProduction("seed-32-official-petugas-kkn.ts");

  console.log("================================================================================");
  console.log("🚀 MEMULAI GENERASI 32 AKUN RESMI PETUGAS RESIDU KKN (KECAMATAN COBLONG)");
  console.log("================================================================================\n");

  // 1. Role Check
  let role = await prisma.role.findUnique({ where: { name: "PETUGAS_RESIDU" } });
  if (!role) {
    role = await prisma.role.create({ data: { name: "PETUGAS_RESIDU" } });
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_OFFICIAL_PASSWORD, 10);

  // 2. Cache RWs per kelurahan for territorial linking
  const rws = await prisma.rw.findMany({
    include: { kelurahan: true },
    orderBy: { name: "asc" },
  });

  const kelurahanRwMap = new Map<string, number>();
  for (const r of rws) {
    const kelName = r.kelurahan?.name?.toLowerCase().trim() || "";
    if (kelName && !kelurahanRwMap.has(kelName)) {
      kelurahanRwMap.set(kelName, r.id);
    }
  }

  console.log(`📍 Wilayah RW terdeteksi untuk ${kelurahanRwMap.size} Kelurahan di database.`);

  // 3. Upsert 32 Accounts
  const results: any[] = [];

  for (const spec of OFFICIAL_32_PETUGAS_SPECS) {
    const cleanKelLower = spec.kelurahan.toLowerCase().trim();
    const assignedRwId = kelurahanRwMap.get(cleanKelLower) || null;

    // Upsert User
    const user = await prisma.user.upsert({
      where: { phone: spec.phone },
      update: {
        name: spec.name,
        email: spec.email,
        roleId: role.id,
        status: "Aktif",
        address: `Kel. ${spec.kelurahan}, Kecamatan Coblong`,
        provinsi: "Jawa Barat",
        kabupaten: "Kota Bandung",
        rwId: assignedRwId || undefined,
      },
      create: {
        name: spec.name,
        phone: spec.phone,
        email: spec.email,
        password: hashedPassword,
        roleId: role.id,
        status: "Aktif",
        address: `Kel. ${spec.kelurahan}, Kecamatan Coblong`,
        provinsi: "Jawa Barat",
        kabupaten: "Kota Bandung",
        rwId: assignedRwId || null,
      },
    });

    // Upsert PetugasResidu Profile
    const profile = await prisma.petugasResidu.upsert({
      where: { userId: user.id },
      update: {
        namaDisplay: spec.namaDisplay,
        kelurahan: spec.kelurahan,
        assignedZone: spec.zone,
        noWa: spec.phone,
        whitelistStatus: "APPROVED",
      },
      create: {
        userId: user.id,
        nama: spec.name, // default to territorial name, can be changed via UI
        namaDisplay: spec.namaDisplay,
        kelurahan: spec.kelurahan,
        assignedZone: spec.zone,
        noWa: spec.phone,
        whitelistStatus: "APPROVED",
      },
    });

    results.push({
      no: spec.no,
      kelurahan: spec.kelurahan,
      kelompok: spec.kelompokName,
      namaAkun: spec.name,
      namaDisplay: spec.namaDisplay,
      phone: spec.phone,
      password: DEFAULT_OFFICIAL_PASSWORD,
    });
  }

  console.log(`\n✅ SUKSES: 32 Akun Petugas Residu Resmi berhasil di-upsert ke Database!`);
  console.log("\n================================================================================");
  console.log("📋 DAFTAR 32 KREDENSIAL AKUN OPERASIONAL RESMI PETUGAS RESIDU");
  console.log("================================================================================");
  console.table(results);
}

main()
  .catch((e) => {
    console.error("Error generating 32 Petugas accounts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
