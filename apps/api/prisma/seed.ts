/**
 * Seed data hierarki wilayah — TrashCare
 * Provinsi Jawa Barat → Kota Bandung → 6 Kecamatan (fokus Coblong) → Kelurahan → RW → RT
 * Data berdasarkan administratif resmi Kemendagri / Pemkot Bandung.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PROD_SEED !== "true") {
    console.error("⛔ SEED BLOCKED: Executing seed scripts in production environment is prohibited to protect real VPS data.");
    process.exit(1);
  }

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
  // 3. KECAMATAN (hanya Kecamatan Coblong — fokus area TrashCare)
  // ─────────────────────────────────────────────
  const kecamatans = [
    "Kecamatan Coblong",
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
    { name: "Dago",             kecamatan: "Kecamatan Coblong" },
    { name: "Lebak Gede",       kecamatan: "Kecamatan Coblong" },
    { name: "Lebak Siliwangi",  kecamatan: "Kecamatan Coblong" },
    { name: "Sadang Serang",    kecamatan: "Kecamatan Coblong" },
    { name: "Sekeloa",          kecamatan: "Kecamatan Coblong" },
    { name: "Cipaganti",        kecamatan: "Kecamatan Coblong" },
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
    { roleName: "DPL", phone: "+628111111128", pass: "password123", name: "Dosen Pembimbing Lapangan" },
    { roleName: "RW", phone: "+628111111115", pass: "password123", name: "Ketua RW 06 Dago" },
    { roleName: "PETUGAS_RESIDU", phone: "+628111111117", pass: "password123", name: "Petugas Residu" },
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
  // 10. REAL DPL UNIKOM & KELOMPOK KKN SEED
  // ─────────────────────────────────────────────
  const realDplData = [
    { name: "Muhammad Aksan Ipaenin, S.T. M.Sc", phone: "+6285294754801", nip: "4127.99.90.268", prodi: "S1 Teknik Sipil", kelompok: "Kel 1 Lebak Gede", kelurahan: "Lebak Gede" },
    { name: "Assoc.Prof. Dr. Wartika S.Kom.,MT", phone: "+62895337560201", nip: "4127.70.26.002", prodi: "S1 Sistem Informasi", kelompok: "Kel 2 Lebak Gede", kelurahan: "Lebak Gede" },
    { name: "Myrna Dwi Rahmatya, S.Kom.,M.Kom", phone: "+6285320322236", nip: "4127.70.26.111", prodi: "D3 Manajemen Informatika", kelompok: "Kel 3 Lebak Gede", kelurahan: "Lebak Gede" },
    { name: "Alif Finandhita, S.Kom., M.T.", phone: "+6282115865070", nip: "4127.70.06.025", prodi: "S1 Teknik Informatika", kelompok: "Kel 4 Lebak Gede", kelurahan: "Lebak Gede" },
    { name: "Adam Mukharil Bachtiar, S.Kom., M.T., Ph.D", phone: "+6281318920636", nip: "4127.70.06.024", prodi: "S1 Teknik Informatika", kelompok: "Kel 1 Sekeloa", kelurahan: "Sekeloa" },
    { name: "Dr. Eng. Siswanti Zuraida, S.Pd., M.T.", phone: "+6288210288162", nip: "4127.88.80.717", prodi: "S1 Teknik Arsitektur", kelompok: "Kel 2 Sekeloa", kelurahan: "Sekeloa" },
    { name: "Dr. Olih Solihin, S.Sos., M.I.Kom.", phone: "+6289656618667", nip: "4127.35.30.016", prodi: "S1 Ilmu Komunikasi", kelompok: "Kel 3 Sekeloa", kelurahan: "Sekeloa" },
    { name: "Hery Dwi Yulianto, S.T., M.Kom.", phone: "+628382821127", nip: "4127.70.67.004", prodi: "D3 Komputerisasi Akuntansi", kelompok: "Kel 4 Sekeloa", kelurahan: "Sekeloa" },
    { name: "John Adler, S.Si., M.Si.", phone: "+6282130536915", nip: "4127.70.05.007", prodi: "D3 Teknik Komputer", kelompok: "Kel 5 Sekeloa", kelurahan: "Sekeloa" },
    { name: "Dr. Henike Primawati, S.IP., M.I.Pol.", phone: "+628118748686", nip: "4127.35.32.011", prodi: "S1 Hubungan Internasional", kelompok: "Kel 6 Sekeloa", kelurahan: "Sekeloa" },
    { name: "Fenny Febrianti, S.S.,M.Hum", phone: "+6282121822503", nip: "4127.20.04.004", prodi: "S1 Sastra Jepang", kelompok: "Kel 1 Lebak Siliwangi", kelurahan: "Lebak Siliwangi" },
    { name: "Dr. Tatik Fidowaty, S.IP., M.Si", phone: "+62817616930", nip: "4127.35.31.009", prodi: "S1 Ilmu Pemerintahan", kelompok: "Kel 2 Lebak Siliwangi", kelurahan: "Lebak Siliwangi" },
    { name: "Dr. Nungki Heriyati, S.S.S.,I.Kom.,M.A.", phone: "+6281322752828", nip: "4127.20.03.020", prodi: "S1 Sastra Inggris", kelompok: "Kel 3 Lebak Siliwangi", kelurahan: "Lebak Siliwangi" },
    { name: "Dr. Agus Mulyana, S.Kom, M.T.", phone: "+6282116871007", nip: "4127.70.05.017", prodi: "D3 Teknik Komputer", kelompok: "Sadang Serang 1", kelurahan: "Sadang Serang" },
    { name: "Amilia Widya, S.Pd., M.T.", phone: "+6281344706038", nip: "4127.70.17.015", prodi: "S1 Teknik Perencanaan Wilayah dan Kota", kelompok: "Sadang Serang 2", kelurahan: "Sadang Serang" },
    { name: "Wahyudi, S.H., M.H.", phone: "+6281321920848", nip: "4127.33.00.019", prodi: "S1 Ilmu Hukum", kelompok: "Sadang Serang 3", kelurahan: "Sadang Serang" },
    { name: "Richi Dwi Agustia, S.Kom., M.Kom.", phone: "+6285780084003", nip: "4127.70.06.132", prodi: "S1 Teknik Informatika", kelompok: "Sadang Serang 4", kelurahan: "Sadang Serang" },
    { name: "Assoc. Prof., Dr. Manap Solihat, Drs., M.Si.", phone: "+6281321911449", nip: "4127.35.30.007", prodi: "S1 Ilmu Komunikasi", kelompok: "Sadang Serang 5", kelurahan: "Sadang Serang" },
    { name: "Cherry Dharmawan, S.Sn., M.Sn.", phone: "+6282118047608", nip: "4127.32.04.002", prodi: "S1 Desain Interior", kelompok: "Sadang Serang 6", kelurahan: "Sadang Serang" },
    { name: "Assoc. Prof. Dr. Sri Dewi Anggadini, S.E., M.Si., Ak., CA", phone: "+628122421004", nip: "4127.34.03.003", prodi: "S1 Akuntansi", kelompok: "Sadang Serang 7", kelurahan: "Sadang Serang" },
    { name: "Dr.H.Tatang Supriyadi,S.E.,M.M", phone: "+6281222927778", nip: "4127.34.02.075", prodi: "D3 Manajemen Pemasaran", kelompok: "Sadang Serang 8", kelurahan: "Sadang Serang" },
    { name: "Dr. Wendi Zaman,M.Si", phone: "+628157131405", nip: "4127.70.05.010", prodi: "S1 Sistem Komputer", kelompok: "Sadang Serang 9", kelurahan: "Sadang Serang" },
    { name: "Arif Try Cahyadi, S.Ds., M.Ds.", phone: "+6282298522354", nip: "4127.32.06.087", prodi: "S1 Desain Komunikasi Visual", kelompok: "Sadang Serang 10", kelurahan: "Sadang Serang" },
    { name: "Ayub Subandi, S.Si., M.T., Ph.D.", phone: "+6289612270264", nip: "4127.70.05.030", prodi: "S1 Teknik Elektro", kelompok: "Sadang Serang 11", kelurahan: "Sadang Serang" },
    { name: "Iyan Andriana, S.T., M.T.", phone: "+628112334224", nip: "4127.70.03.009", prodi: "S1 Teknik Industri", kelompok: "Cipaganti 1", kelurahan: "Cipaganti" },
    { name: "Hanhan Maulana, M.Kom., Ph.D.", phone: "+6285222267759", nip: "4127.70.06.134", prodi: "S1 Teknik Informatika", kelompok: "Cipaganti 2", kelurahan: "Cipaganti" },
    { name: "Assoc. Prof. Dr. Rini Maulina, S.Sn., M.Sn.", phone: "+6289670059709", nip: "4127.32.06.011", prodi: "D3 Desain Grafis", kelompok: "Cipaganti 3", kelurahan: "Cipaganti" },
    { name: "Rangga Sidik, S.Kom., M.Kom., M.Eng", phone: "+6285624088878", nip: "4127.70.26.113", prodi: "S1 Sistem Informasi", kelompok: "Cipaganti 4", kelurahan: "Cipaganti" },
    { name: "Prof Umi Narimawati,dra, S.E. M.Si.,M.pd", phone: "+6281213143636", nip: "4127.34.02.015", prodi: "S1 Manajemen", kelompok: "Dago 1", kelurahan: "Dago" },
    { name: "Assoc Prof. Dr. Agus Riyanto S.E., M.S.i", phone: "+6285759996154", nip: "4127.70.03.007", prodi: "S1 Manajemen", kelompok: "Dago 2", kelurahan: "Dago" },
    { name: "Assoc. Prof. Dr. Raeni Dwi Santy, S.E., M.Si., CIMA, CDMP", phone: "+6281223216029", nip: "4127.34.02.006", prodi: "S1 Manajemen", kelompok: "Dago 3", kelurahan: "Dago" },
    { name: "Dr. Linna Ismawati, S.E., M.Si.", phone: "+6281221471617", nip: "4127.34.02.008", prodi: "S1 Manajemen", kelompok: "Dago 4", kelurahan: "Dago" },
  ];

  const dplRoleObj = roleMap["DPL"] ? { id: roleMap["DPL"] } : await prisma.role.findUnique({ where: { name: "DPL" } });
  if (dplRoleObj) {
    const defaultDplPass = await bcrypt.hash("password123", 10);
    for (const d of realDplData) {
      const u = await prisma.user.upsert({
        where: { phone: d.phone },
        update: {
          name: d.name,
          nip: d.nip,
          institusi: "Universitas Komputer Indonesia",
          programStudi: d.prodi,
          roleId: dplRoleObj.id,
          status: "Aktif",
        },
        create: {
          name: d.name,
          phone: d.phone,
          nip: d.nip,
          institusi: "Universitas Komputer Indonesia",
          programStudi: d.prodi,
          password: defaultDplPass,
          roleId: dplRoleObj.id,
          status: "Aktif",
        },
      });
      await prisma.kelompokKkn.upsert({
        where: { name: d.kelompok },
        update: { dplId: u.id, dplNamaMentah: u.name, kelurahan: d.kelurahan },
        create: { name: d.kelompok, dplId: u.id, dplNamaMentah: u.name, kelurahan: d.kelurahan },
      });
    }
    console.log(`✅ ${realDplData.length} Real DPL & Kelompok KKN Unikom seeded with NIP & Prodi!`);
  }

  // ─────────────────────────────────────────────
  // 11. WASTE CATEGORIES
  // ─────────────────────────────────────────────
  const categories = [
    { name: "Organik", pointsPerKg: 10, description: "Sampah sisa makanan, buah, daun, dan sisa bahan organik mudah terurai." },
    { name: "Anorganik", pointsPerKg: 15, description: "Botol plastik, kardus, kertas, kaleng, dan bahan daur ulang anorganik." },
    { name: "Residu", pointsPerKg: 20, description: "Sampah B3, popok, tisu kotor, dan limbah residu yang tidak dapat didaur ulang." },
  ];

  for (const cat of categories) {
    await prisma.wasteCategory.upsert({
      where: { name: cat.name },
      update: { pointsPerKg: cat.pointsPerKg, description: cat.description },
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
