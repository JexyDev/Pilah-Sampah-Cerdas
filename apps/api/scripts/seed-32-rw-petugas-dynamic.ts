/**
 * Project: BERSEKA
 * Script: seed-32-rw-petugas-dynamic.ts
 *
 * Menghasilkan 32 akun resmi Petugas Residu yang dipetakan secara dinamis
 * ke 32 Kelompok KKN dan 32 RW unik (1 RW = 1 Petugas).
 *
 * Format Penamaan Dua Lapis (Dual-Name):
 * - Identitas Asli (User.name & PetugasResidu.nama): Nama personil Sunda/lokal Bandung riil.
 * - Nama Umum (PetugasResidu.namaDisplay): Nama peran teritorial RW (misal: "Petugas RW 21 Sadang Serang").
 *
 * Proteksi Database: Dilindungi assertNotProduction (HANYA UNTUK LOCALHOST).
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { assertNotProduction } from "../src/utils/vpsSafetyGuard.js";

const prisma = new PrismaClient();

export const DEFAULT_OFFICIAL_PASSWORD = "PetugasCoblong2026!";

// 32 Nama Personil Lokal Bandung/Sunda untuk Identitas Asli
const PERSONIL_NAMES = [
  "Asep Sunandar",
  "Dadan Ramdani",
  "Ujang Suhendar",
  "Cecep Hidayat",
  "Dedi Mulyadi",
  "Agus Suherman",
  "Budi Santoso",
  "Endang Sutisna",
  "Tatang Koswara",
  "Iwan Setiawan",
  "Yayan Sopian",
  "Oyon Sudrajat",
  "Hendra Gunawan",
  "Rahmat Hidayat",
  "Tedi Setiadi",
  "Wawan Kurniawan",
  "Jajang Nurjaman",
  "Ade Kamaludin",
  "Maman Suparman",
  "Koko Komarudin",
  "Nana Suryana",
  "Uus Kusnadi",
  "Eko Prasetyo",
  "Bambang Suherman",
  "Mulyadi Usman",
  "Dudung Abdurrahman",
  "Rohimat Permana",
  "Ganjar Nugraha",
  "Dian Herdiana",
  "Yudi Rustandi",
  "Iman Firmansyah",
  "Dani Ramdani",
];

// Pemetaan nomor RW primer dari cakupanRw 32 Kelompok KKN (100% Unik, Zero Collision)
const KELOMPOK_TARGET_RW_MAP: Record<string, number> = {
  // 1. Sadang Serang (11 Kelompok)
  "Kelompok 1 Sadang Serang": 21,
  "Kelompok 2 Sadang Serang": 15,
  "Kelompok 3 Sadang Serang": 18,
  "Kelompok 4 Sadang Serang": 9,
  "Kelompok 5 Sadang Serang": 3,
  "Kelompok 6 Sadang Serang": 1,
  "Kelompok 7 Sadang Serang": 12,
  "Kelompok 8 Sadang Serang": 6,
  "Kelompok 9 Sadang Serang": 20,
  "Kelompok 10 Sadang Serang": 14,
  "Kelompok 11 Sadang Serang": 16,

  // 2. Sekeloa (6 Kelompok)
  "Kelompok 1 Sekeloa": 1,
  "Kelompok 2 Sekeloa": 3,
  "Kelompok 3 Sekeloa": 5,
  "Kelompok 4 Sekeloa": 8,
  "Kelompok 5 Sekeloa": 11,
  "Kelompok 6 Sekeloa": 14,

  // 3. Dago (4 Kelompok)
  "Kelompok 1 Dago": 1,
  "Kelompok 2 Dago": 3,
  "Kelompok 3 Dago": 4,
  "Kelompok 4 Dago": 11,

  // 4. Lebak Gede (4 Kelompok)
  "Kelompok 1 Lebak Gede": 1,
  "Kelompok 2 Lebak Gede": 4,
  "Kelompok 3 Lebak Gede": 8,
  "Kelompok 4 Lebak Gede": 2,

  // 5. Cipaganti (4 Kelompok)
  "Kelompok 1 Cipaganti": 1,
  "Kelompok 2 Cipaganti": 2,
  "Kelompok 3 Cipaganti": 4,
  "Kelompok 4 Cipaganti": 6,

  // 6. Lebak Siliwangi (3 Kelompok)
  "Kelompok 1 Lebak Siliwangi": 7,
  "Kelompok 2 Lebak Siliwangi": 5,
  "Kelompok 3 Lebak Siliwangi": 6,
};

async function main() {
  assertNotProduction("seed-32-rw-petugas-dynamic.ts");

  console.log("================================================================================");
  console.log("🚀 MEMULAI SEEDING DINAMIS 32 PETUGAS RESIDU KKN (1 RW = 1 PETUGAS)");
  console.log("================================================================================\n");

  // 1. Role Check
  let role = await prisma.role.findUnique({ where: { name: "PETUGAS_RESIDU" } });
  if (!role) {
    role = await prisma.role.create({ data: { name: "PETUGAS_RESIDU" } });
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_OFFICIAL_PASSWORD, 10);

  // 2. Ambil 32 Kelompok KKN resmi dari database secara dinamis
  const groups = await prisma.kelompokKkn.findMany({
    where: { NOT: { name: { contains: "TEST" } } },
    include: { poskoKkn: true },
    orderBy: [{ kelurahan: "asc" }, { name: "asc" }],
  });

  console.log(`📋 Ditemukan ${groups.length} Kelompok KKN resmi di database.`);

  const summaryResults: any[] = [];
  let personilIdx = 0;

  for (const group of groups) {
    const kelurahanName = group.kelurahan || "Coblong";
    const targetRwNum = KELOMPOK_TARGET_RW_MAP[group.name] ?? 1;
    const paddedRw = String(targetRwNum).padStart(2, "0");

    // Ambil seluruh RW di kelurahan ini dan cocokkan nomor RW secara eksak (hindari issue "RW 1" mencocokkan "RW 14")
    const allRwsInKel = await prisma.rw.findMany({
      where: {
        kelurahan: { name: { equals: kelurahanName, mode: "insensitive" } },
      },
      include: { kelurahan: true },
    });

    let rwRecord = allRwsInKel.find((r) => {
      const match = r.name.match(/\d+/);
      return match && parseInt(match[0], 10) === targetRwNum;
    });

    // Jika record RW belum ada, otomatis buatkan agar relasi tidak pernah null
    if (!rwRecord) {
      let kelurahan = await prisma.kelurahan.findFirst({
        where: { name: { equals: kelurahanName, mode: "insensitive" } },
      });
      if (!kelurahan) {
        kelurahan = await prisma.kelurahan.create({
          data: { name: kelurahanName },
        });
      }
      rwRecord = await prisma.rw.create({
        data: {
          name: `RW ${paddedRw}`,
          kelurahanId: kelurahan.id,
          latitude: group.poskoKkn?.latitude ?? null,
          longitude: group.poskoKkn?.longitude ?? null,
        },
        include: { kelurahan: true },
      });
    }

    const personilName = PERSONIL_NAMES[personilIdx % PERSONIL_NAMES.length];
    personilIdx++;

    // Dua Lapis Penamaan:
    // 1. Identitas Asli: Nama personil riil (contoh: "Asep Sunandar")
    // 2. Nama Umum: Nama representatif teritorial RW (contoh: "Petugas RW 21 Sadang Serang")
    const namaUmumDisplay = `Petugas RW ${paddedRw} ${kelurahanName}`;
    const cleanKelCode = kelurahanName.toLowerCase().replace(/\s+/g, "");
    const email = `petugas.rw${paddedRw}.${cleanKelCode}@berseka.id`;
    const phone = `+6281390${String(personilIdx).padStart(6, "0")}`;
    const zone = `RW ${paddedRw}, Kel. ${kelurahanName} (${group.name})`;

    // Tentukan latitude & longitude dari RW atau Posko
    const lat = rwRecord.latitude ?? (group.poskoKkn?.latitude ? Number(group.poskoKkn.latitude) : null);
    const lng = rwRecord.longitude ?? (group.poskoKkn?.longitude ? Number(group.poskoKkn.longitude) : null);

    // 3. Upsert User
    const user = await prisma.user.upsert({
      where: { phone: phone },
      update: {
        name: personilName, // Identitas Asli
        email: email,
        roleId: role.id,
        status: "Aktif",
        address: `Kel. ${kelurahanName}, RW ${paddedRw}, Kec. Coblong`,
        provinsi: "Jawa Barat",
        kabupaten: "Kota Bandung",
        rwId: rwRecord.id,
      },
      create: {
        name: personilName, // Identitas Asli
        phone: phone,
        email: email,
        password: hashedPassword,
        roleId: role.id,
        status: "Aktif",
        address: `Kel. ${kelurahanName}, RW ${paddedRw}, Kec. Coblong`,
        provinsi: "Jawa Barat",
        kabupaten: "Kota Bandung",
        rwId: rwRecord.id,
      },
    });

    // 4. Upsert PetugasResidu Profile
    await prisma.petugasResidu.upsert({
      where: { userId: user.id },
      update: {
        nama: personilName, // Identitas Asli
        namaDisplay: namaUmumDisplay, // Nama Umum Teritorial
        kelurahan: kelurahanName,
        assignedZone: zone,
        noWa: phone,
        latitude: lat,
        longitude: lng,
        whitelistStatus: "APPROVED",
        kpiScore: 100.0,
      },
      create: {
        userId: user.id,
        nama: personilName, // Identitas Asli
        namaDisplay: namaUmumDisplay, // Nama Umum Teritorial
        kelurahan: kelurahanName,
        assignedZone: zone,
        noWa: phone,
        latitude: lat,
        longitude: lng,
        whitelistStatus: "APPROVED",
        kpiScore: 100.0,
      },
    });

    // 5. Bersihkan assignment RW lama jika user ini sebelumnya memegang RW lain
    await prisma.rw.updateMany({
      where: { petugasResiduId: user.id, NOT: { id: rwRecord.id } },
      data: { petugasResiduId: null },
    });

    // 6. Tautkan 1:1 relasi di model Rw (Rw.petugasResiduId -> User.id)
    await prisma.rw.update({
      where: { id: rwRecord.id },
      data: { petugasResiduId: user.id },
    });

    summaryResults.push({
      No: personilIdx,
      Kelompok: group.name,
      Kelurahan: kelurahanName,
      RW: rwRecord.name,
      "Identitas Asli (Nama)": personilName,
      "Nama Umum (Display)": namaUmumDisplay,
      NoHP: phone,
      Email: email,
      "Relasi RW (1:1)": `RW ID: ${rwRecord.id} ↔ User ID: ${user.id.slice(0, 8)}...`,
    });
  }

  console.log(`\n✅ SUKSES: 32 Akun Petugas Residu berhasil dibuat & ditautkan 1:1 ke 32 RW!`);
  console.log("\n================================================================================");
  console.log("📋 DAFTAR HASIL SEEDING DINAMIS 32 PETUGAS RESIDU KKN");
  console.log("================================================================================");
  console.table(summaryResults);
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat seeding Petugas Residu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
