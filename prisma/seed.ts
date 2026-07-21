import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // 1. Create Roles
  const roles = [
    "SUPER_ADMIN",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "PETUGAS_RESIDU",
    "WARGA",
    "MAHASISWA_KKN"
  ];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }
  console.log("Roles seeded.");

  const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  const adminDlhRole = await prisma.role.findUnique({ where: { name: "ADMIN_DLH" } });
  const camatRole = await prisma.role.findUnique({ where: { name: "CAMAT" } });
  const lurahRole = await prisma.role.findUnique({ where: { name: "LURAH" } });
  const rwRole = await prisma.role.findUnique({ where: { name: "RW" } });
  const petugasRole = await prisma.role.findUnique({ where: { name: "PETUGAS_RESIDU" } });
  const wargaRole = await prisma.role.findUnique({ where: { name: "WARGA" } });
  const kknRole = await prisma.role.findUnique({ where: { name: "MAHASISWA_KKN" } });

  if (!superAdminRole || !adminDlhRole || !camatRole || !lurahRole || !rwRole || !petugasRole || !wargaRole || !kknRole) {
    throw new Error("Failed to create roles");
  }

  // 2. Create Kelurahan & RT/RW Areas
  const dago = await prisma.kelurahan.upsert({
    where: { name: "Dago" },
    update: {},
    create: { name: "Dago" },
  });

  const cigadung = await prisma.kelurahan.upsert({
    where: { name: "Cigadung" },
    update: {},
    create: { name: "Cigadung" },
  });

  const rt04rw06 = await prisma.rtRwArea.upsert({
    where: { kelurahanId_name: { kelurahanId: dago.id, name: "RT 04 / RW 06" } },
    update: {},
    create: { kelurahanId: dago.id, name: "RT 04 / RW 06" },
  });

  const rt02rw06 = await prisma.rtRwArea.upsert({
    where: { kelurahanId_name: { kelurahanId: dago.id, name: "RT 02 / RW 06" } },
    update: {},
    create: { kelurahanId: dago.id, name: "RT 02 / RW 06" },
  });

  const rt01rw05 = await prisma.rtRwArea.upsert({
    where: { kelurahanId_name: { kelurahanId: dago.id, name: "RT 01 / RW 05" } },
    update: {},
    create: { kelurahanId: dago.id, name: "RT 01 / RW 05" },
  });

  console.log("Kelurahan & RT/RW areas seeded.");

  // 3. Create Categories
  const catOrganic = await prisma.wasteCategory.upsert({
    where: { name: "ORGANIC" },
    update: { pointsPerKg: 100 },
    create: { name: "ORGANIC", description: "Sampah Organik", pointsPerKg: 100 },
  });

  const catNonOrganic = await prisma.wasteCategory.upsert({
    where: { name: "NON_ORGANIC" },
    update: { pointsPerKg: 50 },
    create: { name: "NON_ORGANIC", description: "Sampah Anorganik", pointsPerKg: 50 },
  });

  console.log("Categories seeded.");

  // 4. Hash default password
  const passwordHash = await bcrypt.hash("password123", 10);

  // 5. Create Default Users
  const userSeeds = [
    {
      email: "superadmin@psc.id",
      name: "Super Admin",
      roleId: superAdminRole.id,
      nik: "3273012345678906",
      status: "Aktif",
      rtRwId: null,
      wargaSubtype: null,
    },
    {
      email: "admin@psc.id",
      name: "Admin DLH",
      roleId: adminDlhRole.id,
      nik: "3273012345678905",
      status: "Aktif",
      rtRwId: null,
      wargaSubtype: null,
    },
    {
      email: "camat@psc.id",
      name: "Camat Coblong",
      roleId: camatRole.id,
      nik: "3273012345678907",
      status: "Aktif",
      rtRwId: null,
      wargaSubtype: null,
    },
    {
      email: "lurah@psc.id",
      name: "Lurah Dago",
      roleId: lurahRole.id,
      nik: "3273012345678908",
      status: "Aktif",
      rtRwId: null,
      wargaSubtype: null,
    },
    {
      email: "rw@psc.id",
      name: "Asep RW",
      roleId: rwRole.id,
      nik: "3273012345678903",
      status: "Aktif",
      rtRwId: rt02rw06.id,
      wargaSubtype: null,
    },
    {
      email: "petugas@psc.id",
      name: "Budi Petugas Residu",
      roleId: petugasRole.id,
      nik: "3273012345678902",
      status: "Aktif",
      rtRwId: rt02rw06.id,
      wargaSubtype: null,
    },
    {
      email: "warga@psc.id",
      name: "Dewi Lestari",
      roleId: wargaRole.id,
      nik: "3273012345678901",
      status: "Aktif",
      rtRwId: rt04rw06.id,
      wargaSubtype: "UTAMA",
    },
    {
      email: "kkn@psc.id",
      name: "Andi Mahasiswa KKN",
      roleId: kknRole.id,
      nik: "3273012345678910",
      status: "Aktif",
      rtRwId: rt04rw06.id,
      wargaSubtype: null,
    },
    {
      email: "wargatambahan@psc.id",
      name: "Siti Warga Tambahan",
      roleId: wargaRole.id,
      nik: "3273012345678911",
      status: "Aktif",
      rtRwId: rt04rw06.id,
      wargaSubtype: "TAMBAHAN",
    },
  ];

  const dbUsers = [];
  for (const user of userSeeds) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        nik: user.nik,
        status: user.status,
        rtRwId: user.rtRwId,
        wargaSubtype: user.wargaSubtype,
      },
      create: {
        email: user.email,
        name: user.name,
        password: passwordHash,
        roleId: user.roleId,
        nik: user.nik,
        status: user.status,
        rtRwId: user.rtRwId,
        wargaSubtype: user.wargaSubtype,
      },
    });
    dbUsers.push(createdUser);
  }
  console.log("Users seeded.");

  // Seed Profiles
  const kknUser = dbUsers.find((u) => u.email === "kkn@psc.id")!;
  await prisma.studentKkn.upsert({
    where: { userId: kknUser.id },
    update: {},
    create: {
      userId: kknUser.id,
      nim: "10121001",
      jurusan: "Teknik Informatika",
      fakultas: "Fakultas Teknik dan Ilmu Komputer",
      noWa: "081234567890",
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),   // 30 days later
      whitelistStatus: "APPROVED",
      assignedPolygonId: rt04rw06.id,
    },
  });

  const petugasUser = dbUsers.find((u) => u.email === "petugas@psc.id")!;
  await prisma.petugasResidu.upsert({
    where: { userId: petugasUser.id },
    update: {},
    create: {
      userId: petugasUser.id,
      nama: "Budi Petugas Residu",
      noWa: "082345678901",
      kpiScore: 100.0,
      assignedZone: "Zone 1",
      latitude: -6.889,
      longitude: 107.61,
    },
  });
  console.log("Profiles seeded.");

  // Seed System Configs
  const configs = [
    { key: "ai_confidence_threshold", value: "90", tipe: "number", deskripsi: "Threshold AI confidence score (0-100)" },
    { key: "bin_fullness_trigger_wa", value: "80", tipe: "number", deskripsi: "Threshold persentase kapasitas tong penuh untuk trigger notifikasi" },
    { key: "organic_point_multiplier", value: "2.0", tipe: "number", deskripsi: "Multiplier poin untuk sampah organik" },
    { key: "nonorganic_point_multiplier", value: "1.5", tipe: "number", deskripsi: "Multiplier poin untuk sampah non-organik" },
    { key: "residu_penalty_multiplier", value: "-1.0", tipe: "number", deskripsi: "Penalty multiplier untuk residu campur" },
    { key: "reporting_window_morning_start", value: "06:00", tipe: "string", deskripsi: "Mulai window pelaporan pagi petugas" },
    { key: "reporting_window_morning_end", value: "08:00", tipe: "string", deskripsi: "Selesai window pelaporan pagi petugas" },
    { key: "reporting_window_evening_start", value: "16:00", tipe: "string", deskripsi: "Mulai window pelaporan sore petugas" },
    { key: "reporting_window_evening_end", value: "18:00", tipe: "string", deskripsi: "Selesai window pelaporan sore petugas" },
    { key: "late_report_kpi_penalty_percent", value: "15", tipe: "number", deskripsi: "Persentase potongan skor KPI jika telat melapor" },
    { key: "kkn_max_assignment_per_student", value: "20", tipe: "number", deskripsi: "Batas maksimal rumah tangga per mahasiswa KKN" },
    { key: "dispatch_radius_km", value: "2", tipe: "number", deskripsi: "Radius penugasan on-demand petugas residu (KM)" },
    { key: "streak_bonus_days", value: "5", tipe: "number", deskripsi: "Jumlah hari berturut-turut untuk bonus streak" },
    { key: "streak_bonus_points", value: "10", tipe: "number", deskripsi: "Bonus poin streak warga tambahan" },
    { key: "idea_approval_points", value: "50", tipe: "number", deskripsi: "Poin untuk ide daur ulang yang disetujui" },
    { key: "emission_factor_metana", value: "0.05", tipe: "number", deskripsi: "Faktor emisi metana yang dihindari (kgCO2e per kg)" },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log("System configs seeded.");

  const wargaUser = dbUsers.find((u) => u.email === "warga@psc.id")!;

  // 6. Create Household for citizen
  const household = await prisma.household.upsert({
    where: { id: "warga-household-id-01" },
    update: {},
    create: {
      id: "warga-household-id-01",
      user: { connect: { id: wargaUser.id } },
      address: "Jl. Ir. H. Juanda No. 123",
      rtRw: { connect: { id: rt04rw06.id } },
      latitude: -6.88923,
      longitude: 107.6105,
    },
  });
  console.log("Household seeded.");

  // 7. Create Bins
  const bin1 = await prisma.bin.upsert({
    where: { qrCode: "TS-COB-001" },
    update: {
      user: { connect: { id: wargaUser.id } },
    },
    create: {
      qrCode: "TS-COB-001",
      category: { connect: { id: catOrganic.id } },
      maxCapacityLiter: 25.0,
      currentVolumeLiter: 5.0,
      rtRw: { connect: { id: rt04rw06.id } },
      kelurahan: { connect: { id: dago.id } },
      latitude: -6.8895,
      longitude: 107.6108,
      user: { connect: { id: wargaUser.id } },
    },
  });

  const bin2 = await prisma.bin.upsert({
    where: { qrCode: "TS-COB-002" },
    update: {
      user: { connect: { id: wargaUser.id } },
    },
    create: {
      qrCode: "TS-COB-002",
      category: { connect: { id: catNonOrganic.id } },
      maxCapacityLiter: 25.0,
      currentVolumeLiter: 12.0,
      rtRw: { connect: { id: rt04rw06.id } },
      kelurahan: { connect: { id: dago.id } },
      latitude: -6.889,
      longitude: 107.6102,
      user: { connect: { id: wargaUser.id } },
    },
  });

  const bin3 = await prisma.bin.upsert({
    where: { qrCode: "TS-COB-003" },
    update: {},
    create: {
      qrCode: "TS-COB-003",
      category: { connect: { id: catOrganic.id } },
      maxCapacityLiter: 25.0,
      currentVolumeLiter: 23.5,
      rtRw: { connect: { id: rt02rw06.id } },
      kelurahan: { connect: { id: dago.id } },
      latitude: -6.8885,
      longitude: 107.6115,
    },
  });
  console.log("Bins seeded.");

  // 8. Create Waste Logs (Setoran)
  await prisma.wasteLog.deleteMany({});
  const log1 = await prisma.wasteLog.create({
    data: {
      householdId: household.id,
      binId: bin1.id,
      weightKg: 2.0,
      volumeLiter: 5.0,
      categoryId: catOrganic.id,
      requestId: "00000000-0000-0000-0000-000000000001",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const log2 = await prisma.wasteLog.create({
    data: {
      householdId: household.id,
      binId: bin2.id,
      weightKg: 1.5,
      volumeLiter: 7.5,
      categoryId: catNonOrganic.id,
      requestId: "00000000-0000-0000-0000-000000000002",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("Waste logs seeded.");

  // 9. Point History
  await prisma.pointHistory.deleteMany({});
  await prisma.pointHistory.create({
    data: {
      userId: wargaUser.id,
      points: 200,
      description: "Setoran sampah Organik 2.0 kg",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.pointHistory.create({
    data: {
      userId: wargaUser.id,
      points: 75,
      description: "Setoran sampah Anorganik 1.5 kg",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("Point history seeded.");

  // 10. Schedules
  await prisma.schedule.deleteMany({});
  await prisma.schedule.create({
    data: {
      title: "Sosialisasi Pemilahan Mandiri",
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      time: "09:00",
      category: "Sosialisasi",
      location: "Balai RW 06 Dago",
    },
  });
  await prisma.schedule.create({
    data: {
      title: "Pengangkutan Sampah Rutin",
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      time: "08:00",
      category: "Pengangkutan",
      location: "Seluruh RW 06 Dago",
    },
  });
  console.log("Schedules seeded.");

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
