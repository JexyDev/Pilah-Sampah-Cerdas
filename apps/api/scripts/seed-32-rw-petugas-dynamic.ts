/**
 * Project: BERSEKA
 * Script: seed-32-rw-petugas-dynamic.ts
 *
 * Menghasilkan akun resmi Petugas Pemilah / Petugas Residu yang dipetakan secara dinamis
 * ke seluruh RW unik binaan Kelompok KKN (1 RW = 1 Petugas).
 * Mengambil data secara dinamis dari tabel kelompok_kkn (field cakupan_rw).
 *
 * Format Penamaan Dua Lapis (Dual-Name):
 * - Identitas Asli (PetugasResidu.nama): Nama personil Sunda/lokal Bandung riil.
 * - Nama Umum (User.name & PetugasResidu.namaDisplay): Nama peran teritorial RW (misal: "Petugas Pemilah RW 03 Cipaganti").
 *
 * Proteksi Database: Dilindungi assertNotProduction (HANYA UNTUK LOCALHOST).
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { assertNotProduction } from "../src/utils/vpsSafetyGuard.js";

const prisma = new PrismaClient();

export const DEFAULT_OFFICIAL_PASSWORD = "PetugasCoblong2026!";

// 75 Nama Personil Lokal Bandung/Sunda untuk Identitas Asli
const PERSONIL_NAMES = [
  "Asep Sunandar", "Dadan Ramdani", "Ujang Suhendar", "Cecep Hidayat",
  "Dedi Mulyadi", "Agus Suherman", "Budi Santoso", "Endang Sutisna",
  "Tatang Koswara", "Iwan Setiawan", "Yayan Sopian", "Oyon Sudrajat",
  "Hendra Gunawan", "Rahmat Hidayat", "Tedi Setiadi", "Wawan Kurniawan",
  "Jajang Nurjaman", "Ade Kamaludin", "Maman Suparman", "Koko Komarudin",
  "Nana Suryana", "Uus Kusnadi", "Eko Prasetyo", "Bambang Suherman",
  "Mulyadi Usman", "Dudung Abdurrahman", "Rohimat Permana", "Ganjar Nugraha",
  "Dian Herdiana", "Yudi Rustandi", "Iman Firmansyah", "Dani Ramdani",
  "Dadang Hermawan", "Engkus Kusnandar", "Aceng Suryadi", "Deden Rohman",
  "Gugun Gunawan", "Yana Mulyana", "Agus Supriatna", "Nandang Suhendar",
  "Entis Sutisna", "Didin Rosidin", "Aang Kunaefi", "Ayi Sobarna",
  "Encep Suryana", "Jujun Junaedi", "Lili Somantri", "Mamat Rahmat",
  "Oki Sudrajat", "Pipin Arifin", "Roni Sahroni", "Saepul Bahri",
  "Tatan Rustandi", "Ucup Supriadi", "Wahyu Hidayat", "Yayang Rukmana",
  "Zaenal Muttaqin", "Anwar Sanusi", "Burhanudin", "Cepi Iskandar",
  "Deni Sumarna", "Eful Saefuloh", "Fajar Sidik", "Ginanjar Permana",
  "Hedi Hendrawan", "Iik Rahmat", "Jenal Aripin", "Kosasih",
  "Lukman Hakim", "Memed Sukardi", "Nurdin Samsudin", "Otang Sutisna",
  "Pupung Purnomo", "Ramdan Syamsudin", "Soni Suharsono"
];

async function main() {
  assertNotProduction("seed-32-rw-petugas-dynamic.ts");

  console.log("================================================================================");
  console.log("🚀 MEMULAI SEEDING DINAMIS PETUGAS PEMILAH KKN (1 RW = 1 PETUGAS)");
  console.log("================================================================================\n");

  // 1. Role Check
  let role = await prisma.role.findUnique({ where: { name: "PETUGAS_RESIDU" } });
  if (!role) {
    role = await prisma.role.create({ data: { name: "PETUGAS_RESIDU" } });
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_OFFICIAL_PASSWORD, 10);

  // 2. Ambil seluruh kelompok KKN resmi dari database secara dinamis
  const groups = await prisma.kelompokKkn.findMany({
    where: { NOT: { name: { contains: "TEST" } } },
    include: { poskoKkn: true },
    orderBy: [{ kelurahan: "asc" }, { name: "asc" }],
  });

  console.log(`📋 Ditemukan ${groups.length} Kelompok KKN resmi di database.`);

  // 3. Ambil seluruh RW yang ada di database
  const allDbRws = await prisma.rw.findMany({
    include: { kelurahan: true }
  });

  // 4. Ekstrak seluruh RW unik dari cakupan_rw
  const uniqueRwList: any[] = [];
  const registeredSet = new Set<string>();

  for (const g of groups) {
    const kel = g.kelurahan;
    if (!kel || !g.cakupanRw) continue;

    let rws: string[] = [];
    try {
      rws = typeof g.cakupanRw === "string" ? JSON.parse(g.cakupanRw) : (g.cakupanRw as string[]);
    } catch {
      rws = [];
    }

    for (const rwStr of rws) {
      const rwNum = parseInt(rwStr, 10);
      const key = `${kel}_${rwNum}`;
      if (!registeredSet.has(key)) {
        registeredSet.add(key);

        const dbRw = allDbRws.find((r) =>
          r.kelurahan?.name?.toLowerCase() === kel.toLowerCase() &&
          (r.name === `RW ${String(rwNum).padStart(2, "0")}` ||
           r.name === `RW ${rwNum}` ||
           r.name.includes(String(rwNum)))
        );

        uniqueRwList.push({
          kelurahan: kel,
          rwNum: rwNum,
          paddedRw: String(rwNum).padStart(2, "0"),
          kelompok: g.name,
          posko: g.poskoKkn,
          dbRwId: dbRw ? dbRw.id : null,
        });
      }
    }
  }

  uniqueRwList.sort((a, b) => {
    if (a.kelurahan !== b.kelurahan) return a.kelurahan.localeCompare(b.kelurahan);
    return a.rwNum - b.rwNum;
  });

  console.log(`📍 Ditemukan ${uniqueRwList.length} RW unik binaan KKN untuk dibuatkan Petugas Pemilah.`);

  const summaryResults: any[] = [];

  for (let i = 0; i < uniqueRwList.length; i++) {
    const item = uniqueRwList[i];
    const personilName = PERSONIL_NAMES[i % PERSONIL_NAMES.length];
    const namaUmumDisplay = `Petugas Pemilah RW ${item.paddedRw} ${item.kelurahan}`;
    const phone = `+628139000${String(i + 1).padStart(4, "0")}`;
    const zone = `RW ${item.paddedRw}, Kel. ${item.kelurahan} (${item.kelompok})`;

    let rwId = item.dbRwId;
    if (!rwId) {
      let kelRec = await prisma.kelurahan.findFirst({
        where: { name: { equals: item.kelurahan, mode: "insensitive" } },
      });
      if (!kelRec) {
        kelRec = await prisma.kelurahan.create({ data: { name: item.kelurahan } });
      }
      const newRw = await prisma.rw.create({
        data: {
          name: `RW ${item.paddedRw}`,
          kelurahanId: kelRec.id,
          latitude: item.posko?.latitude ? Number(item.posko.latitude) : null,
          longitude: item.posko?.longitude ? Number(item.posko.longitude) : null,
        },
      });
      rwId = newRw.id;
    }

    const user = await prisma.user.upsert({
      where: { phone: phone },
      update: {
        name: namaUmumDisplay,
        email: null,
        roleId: role.id,
        status: "Aktif",
        address: `Kel. ${item.kelurahan}, RW ${item.paddedRw}, Kec. Coblong`,
        provinsi: "Jawa Barat",
        kabupaten: "Kota Bandung",
        rwId: rwId,
      },
      create: {
        name: namaUmumDisplay,
        phone: phone,
        email: null,
        password: hashedPassword,
        roleId: role.id,
        status: "Aktif",
        address: `Kel. ${item.kelurahan}, RW ${item.paddedRw}, Kec. Coblong`,
        provinsi: "Jawa Barat",
        kabupaten: "Kota Bandung",
        rwId: rwId,
      },
    });

    // 6. Upsert PetugasResidu Profile
    await prisma.petugasResidu.upsert({
      where: { userId: user.id },
      update: {
        nama: personilName,
        namaDisplay: namaUmumDisplay,
        kelurahan: item.kelurahan,
        assignedZone: zone,
        noWa: phone,
        whitelistStatus: "APPROVED",
        kpiScore: 100.0,
      },
      create: {
        userId: user.id,
        nama: personilName,
        namaDisplay: namaUmumDisplay,
        kelurahan: item.kelurahan,
        assignedZone: zone,
        noWa: phone,
        whitelistStatus: "APPROVED",
        kpiScore: 100.0,
      },
    });

    // 7. Tautkan relasi 1:1 di tabel RW
    await prisma.rw.update({
      where: { id: rwId },
      data: { petugasResiduId: user.id },
    });

    summaryResults.push({
      No: i + 1,
      Kelurahan: item.kelurahan,
      RW: `RW ${item.paddedRw}`,
      Kelompok: item.kelompok,
      "Nama Wilayah": namaUmumDisplay,
      "Identitas Asli": personilName,
      NoHP: phone,
    });
  }

  console.log(`\n✅ SUKSES: ${summaryResults.length} Akun Petugas Pemilah berhasil dibuat & ditautkan 1:1 ke RW!`);
  console.log("\n================================================================================");
  console.log("📋 DAFTAR HASIL SEEDING DINAMIS PETUGAS PEMILAH KKN (1 RW = 1 PETUGAS)");
  console.log("================================================================================");
  console.table(summaryResults);
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat seeding Petugas Pemilah:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
