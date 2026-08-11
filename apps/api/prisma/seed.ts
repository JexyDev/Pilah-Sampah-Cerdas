/**
 * Seed data hierarki wilayah — TrashCare
 * Provinsi Jawa Barat → Kota Bandung → 6 Kecamatan (fokus Coblong) → Kelurahan → RW → RT
 * Data berdasarkan administratif resmi Kemendagri / Pemkot Bandung.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding data wilayah TrashCare...\n");

  // ─────────────────────────────────────────────
  // 0. CLEANUP — Hapus kecamatan & kelurahan lama yang bukan Coblong
  // Harus dihapus dari tabel anak ke tabel induk (RT → RW → Kelurahan → Kecamatan)
  // karena tidak ada onDelete: Cascade pada relasi Rw→Kelurahan
  // ─────────────────────────────────────────────
  const NON_COBLONG_KECAMATAN = ["Sukasari", "Cidadap", "Cibeunying Kidul", "Cibeunying Kaler", "Sumur Bandung"];
  const NON_COBLONG_KELURAHAN = ["Gegerkalong", "Isola", "Sarijadi", "Sukasari", "Ciumbuleuit", "Hegarmanah", "Ledeng"];

  // Langkah 1: Cari ID kelurahan non-Coblong
  const staleKelurahan = await prisma.kelurahan.findMany({
    where: { name: { in: NON_COBLONG_KELURAHAN } },
    select: { id: true },
  });
  const staleKelurahanIds = staleKelurahan.map((k) => k.id);

  if (staleKelurahanIds.length > 0) {
    // Langkah 2: Cari ID RW dari kelurahan tersebut
    const staleRws = await prisma.rw.findMany({
      where: { kelurahanId: { in: staleKelurahanIds } },
      select: { id: true },
    });
    const staleRwIds = staleRws.map((r) => r.id);

    // Langkah 3: Hapus RT dari RW tersebut
    if (staleRwIds.length > 0) {
      await prisma.rt.deleteMany({ where: { rwId: { in: staleRwIds } } });
      console.log(`🧹 Cleanup: RT dari ${staleRwIds.length} RW non-Coblong dihapus`);
    }

    // Langkah 4: Hapus RW dari kelurahan tersebut
    await prisma.rw.deleteMany({ where: { kelurahanId: { in: staleKelurahanIds } } });
    console.log(`🧹 Cleanup: RW non-Coblong dihapus`);

    // Langkah 5: Hapus kelurahan non-Coblong
    await prisma.kelurahan.deleteMany({ where: { id: { in: staleKelurahanIds } } });
    console.log(`🧹 Cleanup: ${staleKelurahanIds.length} kelurahan non-Coblong dihapus`);
  }

  // Langkah 6: Hapus kecamatan non-Coblong (kelurahan sudah bersih)
  await prisma.kecamatan.deleteMany({
    where: { name: { in: NON_COBLONG_KECAMATAN } },
  });
  console.log(`🧹 Cleanup: ${NON_COBLONG_KECAMATAN.length} kecamatan non-Coblong dihapus\n`);

  // ─────────────────────────────────────────────
  // 1. PROVINSI
  // ─────────────────────────────────────────────
  const jabar = await prisma.provinsi.upsert({
    where: { name: "Jawa Barat" },
    update: {},
    create: { name: "Jawa Barat" },
  });
  console.log(`✅ Provinsi: ${jabar.name}`);

  // ─────────────────────────────────────────────
  // 2. KABUPATEN/KOTA
  // ─────────────────────────────────────────────
  const kotaBandung = await prisma.kabupaten.upsert({
    where: { provinsiId_name: { provinsiId: jabar.id, name: "Kota Bandung" } },
    update: {},
    create: { provinsiId: jabar.id, name: "Kota Bandung" },
  });
  console.log(`✅ Kabupaten/Kota: ${kotaBandung.name}`);

  // ─────────────────────────────────────────────
  // 3. KECAMATAN (hanya Coblong — fokus area TrashCare)
  // ─────────────────────────────────────────────
  const kecamatans = [
    "Coblong",
  ];

  const kecamatanMap: Record<string, number> = {};
  for (const name of kecamatans) {
    const kec = await prisma.kecamatan.upsert({
      where: { kabupatenId_name: { kabupatenId: kotaBandung.id, name } },
      update: {},
      create: { kabupatenId: kotaBandung.id, name },
    });
    kecamatanMap[name] = kec.id;
  }
  console.log(`✅ Kecamatan: ${kecamatans.join(", ")}`);

  // ─────────────────────────────────────────────
  // 4. KELURAHAN (hanya 6 kelurahan resmi Coblong)
  // ─────────────────────────────────────────────
  const kelurahanData: { name: string; kecamatan: string }[] = [
    { name: "Dago",             kecamatan: "Coblong" },
    { name: "Lebak Gede",       kecamatan: "Coblong" },
    { name: "Lebak Siliwangi",  kecamatan: "Coblong" },
    { name: "Sadang Serang",    kecamatan: "Coblong" },
    { name: "Sekeloa",          kecamatan: "Coblong" },
    { name: "Cipaganti",        kecamatan: "Coblong" },
  ];

  const kelurahanMap: Record<string, string> = {};
  for (const kel of kelurahanData) {
    const existing = await prisma.kelurahan.findFirst({ where: { name: kel.name } });
    if (existing) {
      const updated = await prisma.kelurahan.update({
        where: { id: existing.id },
        data: { kecamatanId: kecamatanMap[kel.kecamatan] },
      });
      kelurahanMap[kel.name] = updated.id;
    } else {
      const created = await prisma.kelurahan.create({
        data: {
          name: kel.name,
          kecamatanId: kecamatanMap[kel.kecamatan],
        },
      });
      kelurahanMap[kel.name] = created.id;
    }
  }
  console.log(`✅ Kelurahan Coblong: ${kelurahanData.map(k => k.name).join(", ")}`);

  // ─────────────────────────────────────────────
  // 5. RW (per kelurahan, 5-8 RW masing-masing)
  // ─────────────────────────────────────────────
  const rwData: { kelurahan: string; rwNumbers: number[]; lat: number; lng: number }[] = [
    { kelurahan: "Dago",            rwNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], lat: -6.8750079, lng: 107.6159521 },
    { kelurahan: "Lebak Gede",      rwNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], lat: -6.8947907, lng: 107.6152105 },
    { kelurahan: "Lebak Siliwangi", rwNumbers: [1, 2, 3, 4, 5, 6],                           lat: -6.8920097, lng: 107.6103326 },
    { kelurahan: "Sadang Serang",   rwNumbers: Array.from({length: 21}, (_, i) => i + 1),    lat: -6.8916671, lng: 107.626937  },
    { kelurahan: "Sekeloa",         rwNumbers: Array.from({length: 16}, (_, i) => i + 1),    lat: -6.8864841, lng: 107.620447  },
    { kelurahan: "Cipaganti",       rwNumbers: [1, 2, 3, 4, 5, 6, 7],                        lat: -6.8866719, lng: 107.6029364 },
  ];

  const rwMap: Record<string, number[]> = {}; // kelurahan → [rwId, ...]
  let totalRw = 0;

  for (const data of rwData) {
    const kelurahanId = kelurahanMap[data.kelurahan];
    if (!kelurahanId) continue;
    rwMap[data.kelurahan] = [];

    for (const num of data.rwNumbers) {
      const rwName = `RW ${String(num).padStart(2, "0")}`;
      const latOffset = (num - 1) * 0.0008;
      const lngOffset = (num - 1) * 0.0005;

      const rw = await prisma.rw.upsert({
        where: { kelurahanId_name: { kelurahanId, name: rwName } },
        update: {},
        create: {
          kelurahanId,
          name: rwName,
          latitude: data.lat + latOffset,
          longitude: data.lng + lngOffset,
        },
      });
      rwMap[data.kelurahan].push(rw.id);
      totalRw++;

      // ─────────────────────────────────────────────
      // 6. RT (5 RT per RW)
      // ─────────────────────────────────────────────
      for (let rtNum = 1; rtNum <= 5; rtNum++) {
        const rtName = `RT ${String(rtNum).padStart(2, "0")}`;
        await prisma.rt.upsert({
          where: { rwId_name: { rwId: rw.id, name: rtName } },
          update: {},
          create: { rwId: rw.id, name: rtName },
        });
      }
    }
  }
  console.log(`✅ RW: ${totalRw} RW seeded (5 RT masing-masing)`);

  // ─────────────────────────────────────────────
  // 7. ROLES
  // ─────────────────────────────────────────────
  const roles = [
    "DEVELOPER",
    "SUPER_USER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "RT",
    "MAHASISWA_KKN",
    "DPL",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "PETUGAS_RESIDU",
    "WARGA",
  ];

  const roleMap: Record<string, number> = {};
  for (const roleName of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    roleMap[roleName] = role.id;
  }
  console.log(`✅ Roles: ${roles.join(", ")}`);

  // ─────────────────────────────────────────────
  // 8. DEFAULT PERMISSIONS PER ROLE
  // ─────────────────────────────────────────────
  const resources = [
    "dashboard_utama",
    "dashboard_kkn",
    "monitoring_sampah",
    "pengangkutan",
    "pemanfaatan",
    "hasil_pemanfaatan",
    "manajemen_pengguna",
    "manajemen_mahasiswa",
    "manajemen_tempat_sampah",
    "manajemen_lokasi",
    "master_data_wilayah",
    "laporan_analitik",
    "evaluasi_ai",
    "audit_trail",
    "konfigurasi_sistem",
    "rw_approval",
    "rw_fasilitas",
    "poin_warga",
    "ide_daur_ulang",
  ];

  const defaultPermissions: Record<string, Record<string, boolean[]>> = {
    DEVELOPER: Object.fromEntries(resources.map((r) => [r, [true, true, true, true]])),
    SUPER_USER: Object.fromEntries(resources.map((r) => [r, [true, true, true, true]])),
    ADMIN_DLH: {
      dashboard_utama: [true, false, false, false],
      monitoring_sampah: [true, false, false, false],
      pengangkutan: [true, false, false, false],
      pemanfaatan: [true, false, false, false],
      hasil_pemanfaatan: [true, false, false, false],
      laporan_analitik: [true, false, false, false],
      evaluasi_ai: [true, true, false, false], // approval AI
    },
    CAMAT: {
      dashboard_utama: [true, false, false, false],
      monitoring_sampah: [true, false, false, false],
      laporan_analitik: [true, false, false, false],
    },
    LURAH: {
      dashboard_utama: [true, false, false, false],
      monitoring_sampah: [true, false, false, false],
      laporan_analitik: [true, false, false, false],
    },
    RW: {
      dashboard_utama: [true, false, false, false],
      rw_approval: [true, true, true, false],
      rw_fasilitas: [true, true, true, false],
      monitoring_sampah: [true, false, false, false],
      ide_daur_ulang: [true, true, false, false],
    },
    RT: {
      dashboard_utama: [true, false, false, false],
      monitoring_sampah: [true, false, false, false],
    },
    MAHASISWA_KKN: {
      dashboard_utama: [true, false, false, false],
      manajemen_tempat_sampah: [true, true, false, false],
      poin_warga: [true, false, false, false],
    },
    DPL: {
      dashboard_utama: [true, false, false, false],
    },
    PEMIMPIN: {
      dashboard_utama: [true, false, false, false],
      dashboard_kkn: [true, false, false, false],
      monitoring_sampah: [true, false, false, false],
      laporan_analitik: [true, false, false, false],
    },
    PANITIA_TASKFORCE: {
      dashboard_utama: [true, false, false, false],
      dashboard_kkn: [true, true, true, false],
      manajemen_mahasiswa: [true, true, true, false],
    },
    PETUGAS_RESIDU: {
      dashboard_utama: [true, false, false, false],
      pengangkutan: [true, true, true, false],
      monitoring_sampah: [true, false, false, false],
    },
    WARGA: {
      dashboard_utama: [true, false, false, false],
      poin_warga: [true, false, false, false],
      ide_daur_ulang: [true, true, false, false],
    },
  };

  let totalPerms = 0;
  for (const [roleName, permDefs] of Object.entries(defaultPermissions)) {
    const roleId = roleMap[roleName];
    if (!roleId) continue;
    for (const [resource, [canView, canCreate, canEdit, canDelete]] of Object.entries(permDefs)) {
      await prisma.permission.upsert({
        where: { roleId_resource: { roleId, resource } },
        update: { canView, canCreate, canEdit, canDelete },
        create: { roleId, resource, canView, canCreate, canEdit, canDelete },
      });
      totalPerms++;
    }
  }
  console.log(`✅ Permissions: ${totalPerms} default permissions seeded`);

  // ─────────────────────────────────────────────
  // 9. TEST USERS FOR ALL ROLES
  // ─────────────────────────────────────────────
  const testUsersConfig = [
    { roleName: "DEVELOPER", phone: "+6281000000000", pass: "password123", name: "Developer" },
    { roleName: "DEVELOPER", phone: "+628992330060", pass: "password123", name: "Daffa Jaya Perkasa" },
    { roleName: "SUPER_USER", phone: "+6281000000001", pass: "superUser123!", name: "Admin" },
    { roleName: "SUPER_USER", phone: "+628111111111", pass: "password123", name: "Admin Test" },
    { roleName: "ADMIN_DLH", phone: "+628111111112", pass: "password123", name: "Darto, A.P., M.M." },
    { roleName: "CAMAT", phone: "+628111111113", pass: "password123", name: "Ratna Rahayu Pitriyati, S.STP., M.Si." },
    { roleName: "LURAH", phone: "+628111111114", pass: "password123", name: "Jusni Giri Susilowati, S.Sos., M.Si." },
    { roleName: "LURAH", phone: "+628111111121", pass: "password123", name: "Ida, A.KS." },
    { roleName: "LURAH", phone: "+628111111122", pass: "password123", name: "Usman Adireja, S.Sos." },
    { roleName: "LURAH", phone: "+628111111123", pass: "password123", name: "Budi Rukmana, S.Sos., M.Si." },
    { roleName: "LURAH", phone: "+628111111124", pass: "password123", name: "Leny Mariana, S.Sos., M.AP." },
    { roleName: "LURAH", phone: "+628111111125", pass: "password123", name: "Tirta Gumelar, S.STP." },
    { roleName: "PANITIA_TASKFORCE", phone: "+628111111127", pass: "password123", name: "Task Force" },
    { roleName: "RW", phone: "+628111111115", pass: "password123", name: "Ketua RW 06 Dago" },
    { roleName: "PETUGAS_RESIDU", phone: "+628111111117", pass: "password123", name: "Petugas Residu" },
    { roleName: "MAHASISWA_KKN", phone: "+628111111118", pass: "password123", name: "Mahasiswa" },
    { roleName: "WARGA", phone: "+62812001001", pass: "password123", name: "Warga" },
  ];

  for (const tu of testUsersConfig) {
    const roleObj = roleMap[tu.roleName] ? { id: roleMap[tu.roleName] } : await prisma.role.findUnique({ where: { name: tu.roleName } });
    if (roleObj) {
      const hashedPwd = await bcrypt.hash(tu.pass, 10);
      await prisma.user.upsert({
        where: { phone: tu.phone },
        update: { password: hashedPwd, status: "Aktif" },
        create: {
          name: tu.name,
          phone: tu.phone,
          password: hashedPwd,
          roleId: roleObj.id,
          status: "Aktif",
        },
      });
    }
  }
  console.log("✅ Test user accounts for all roles created!");

  // ─────────────────────────────────────────────
  // 10. WASTE CATEGORIES
  // ─────────────────────────────────────────────
  const categories = [
    { name: "Organik", pointsPerKg: 5 },
    { name: "Anorganik", pointsPerKg: 8 },
    { name: "Residu", pointsPerKg: 2 },
    { name: "B3 (Limbah Berbahaya)", pointsPerKg: 10 },
  ];

  for (const cat of categories) {
    await prisma.wasteCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ Waste categories: ${categories.map((c) => c.name).join(", ")}`);

  // ─────────────────────────────────────────────
  // 11. SYSTEM CONFIGS
  // ─────────────────────────────────────────────
  const configs = [
    { key: "BIN_ACTIVE_DURATION_DAYS", value: "30", tipe: "number", deskripsi: "Durasi aktif tempat sampah dalam hari" },
    { key: "MAX_BINS_PER_HOUSEHOLD", value: "2", tipe: "number", deskripsi: "Maksimal tempat sampah per rumah tangga" },
    { key: "DEFAULT_BIN_CAPACITY_LITER", value: "25", tipe: "number", deskripsi: "Kapasitas default tempat sampah dalam liter" },
    { key: "AI_CONFIDENCE_THRESHOLD", value: "0.9", tipe: "number", deskripsi: "Threshold confidence AI untuk diskrepansi" },
    { key: "POIN_AKTIVASI_QR_WARGA", value: "10", tipe: "number", deskripsi: "Poin untuk warga saat aktivasi QR" },
    { key: "POIN_AKTIVASI_QR_MAHASISWA", value: "10", tipe: "number", deskripsi: "Poin untuk mahasiswa saat membantu registrasi warga" },
    { key: "POIN_IDE_DAUR_ULANG", value: "50", tipe: "number", deskripsi: "Poin reward ide daur ulang yang disetujui RW" },
    { key: "COLLECTION_WINDOW_PAGI_START", value: "06:00", tipe: "string", deskripsi: "Jam mulai window pengambilan pagi" },
    { key: "COLLECTION_WINDOW_PAGI_END", value: "08:00", tipe: "string", deskripsi: "Jam selesai window pengambilan pagi" },
    { key: "COLLECTION_WINDOW_SORE_START", value: "16:00", tipe: "string", deskripsi: "Jam mulai window pengambilan sore" },
    { key: "COLLECTION_WINDOW_SORE_END", value: "18:00", tipe: "string", deskripsi: "Jam selesai window pengambilan sore" },
    { key: "APP_VERSION", value: "1.0.0", tipe: "string", deskripsi: "Versi aplikasi TrashCare" },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }
  console.log(`✅ System configs: ${configs.length} konfigurasi sistem`);

  console.log("\n🎉 Seeding selesai! Database TrashCare siap digunakan.\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
