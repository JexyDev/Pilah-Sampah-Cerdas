import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log("Start seeding massive dummy data...");

  // 1. Roles
  const roles = ["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "PETUGAS_RESIDU", "WARGA", "MAHASISWA_KKN"];
  const roleMap: Record<string, any> = {};
  for (const roleName of roles) {
    roleMap[roleName] = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }
  console.log("Roles seeded.");

  // 2. Areas
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

  const rtRwAreas = [];
  for (let rw = 1; rw <= 10; rw++) {
    for (let rt = 1; rt <= 5; rt++) {
      const name = `RT ${rt.toString().padStart(2, "0")} / RW ${rw.toString().padStart(2, "0")}`;
      const area = await prisma.rtRwArea.upsert({
        where: { kelurahanId_name: { kelurahanId: dago.id, name } },
        update: {},
        create: { kelurahanId: dago.id, name },
      });
      rtRwAreas.push(area);
    }
  }
  console.log(`Created ${rtRwAreas.length} RT/RW Areas.`);

  // 3. Categories
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

  // 4. Configs
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

  const passwordHash = await bcrypt.hash("password123", 10);

  // 5. Default Users
  const userSeeds = [
    { email: "superadmin@psc.id", name: "Super Admin", roleId: roleMap["SUPER_ADMIN"].id, nik: "3273012345678906", rtRwId: null },
    { email: "admin@psc.id", name: "Admin DLH", roleId: roleMap["ADMIN_DLH"].id, nik: "3273012345678905", rtRwId: null },
    { email: "camat@psc.id", name: "Camat Coblong", roleId: roleMap["CAMAT"].id, nik: "3273012345678907", rtRwId: null },
    { email: "lurah@psc.id", name: "Lurah Dago", roleId: roleMap["LURAH"].id, nik: "3273012345678908", rtRwId: null },
    { email: "rw@psc.id", name: "Asep RW 06", roleId: roleMap["RW"].id, nik: "3273012345678903", rtRwId: rtRwAreas.find(r => r.name.includes("RW 06"))?.id },
    { email: "petugas@psc.id", name: "Budi Petugas Residu", roleId: roleMap["PETUGAS_RESIDU"].id, nik: "3273012345678902", rtRwId: rtRwAreas.find(r => r.name.includes("RW 06"))?.id },
    { email: "petugaspending1@psc.id", name: "Candra Petugas", roleId: roleMap["PETUGAS_RESIDU"].id, nik: "3273012345678912", rtRwId: rtRwAreas.find(r => r.name.includes("RW 06"))?.id },
    { email: "petugaspending2@psc.id", name: "Deni Petugas", roleId: roleMap["PETUGAS_RESIDU"].id, nik: "3273012345678913", rtRwId: rtRwAreas.find(r => r.name.includes("RW 06"))?.id },
    { email: "kkn@psc.id", name: "Andi Mahasiswa KKN", roleId: roleMap["MAHASISWA_KKN"].id, nik: "3273012345678910", rtRwId: rtRwAreas.find(r => r.name.includes("RW 06"))?.id },
  ];

  const coreUsers: any = {};
  for (const u of userSeeds) {
    coreUsers[u.email] = await prisma.user.upsert({
      where: { email: u.email },
      update: { rtRwId: u.rtRwId },
      create: { ...u, password: passwordHash, status: "Aktif" },
    });
  }

  // Profile KKN & Petugas
  await prisma.studentKkn.upsert({
    where: { userId: coreUsers["kkn@psc.id"].id },
    update: {},
    create: {
      userId: coreUsers["kkn@psc.id"].id,
      nim: "10121001",
      jurusan: "Teknik Informatika",
      fakultas: "FTIK",
      noWa: "081234567890",
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      whitelistStatus: "APPROVED",
      assignedPolygonId: rtRwAreas[5].id,
    },
  });

  await prisma.petugasResidu.upsert({
    where: { userId: coreUsers["petugas@psc.id"].id },
    update: {},
    create: {
      userId: coreUsers["petugas@psc.id"].id,
      nama: "Budi Petugas Residu",
      noWa: "082345678901",
      kpiScore: 85.5,
      assignedZone: "RW 06",
      latitude: -6.889,
      longitude: 107.61,
    },
  });

  await prisma.petugasResidu.upsert({
    where: { userId: coreUsers["petugaspending1@psc.id"].id },
    update: {},
    create: {
      userId: coreUsers["petugaspending1@psc.id"].id,
      nama: "Candra Petugas",
      noWa: "082345678911",
      kpiScore: 100.0,
      assignedZone: "RW 06",
      whitelistStatus: "PENDING",
    },
  });

  await prisma.petugasResidu.upsert({
    where: { userId: coreUsers["petugaspending2@psc.id"].id },
    update: {},
    create: {
      userId: coreUsers["petugaspending2@psc.id"].id,
      nama: "Deni Petugas",
      noWa: "082345678922",
      kpiScore: 100.0,
      assignedZone: "RW 06",
      whitelistStatus: "PENDING",
    },
  });

  // 6. Generate Massive Warga (75 users)
  console.log("Generating Warga & Households...");
  const wargaList = [];
  const householdList = [];
  for (let i = 1; i <= 75; i++) {
    const area = rtRwAreas[i % rtRwAreas.length];
    const phone = `+628120000${i.toString().padStart(4, "0")}`;
    const wUser = await prisma.user.upsert({
      where: { email: `warga${i}@psc.id` },
      update: {},
      create: {
        email: `warga${i}@psc.id`,
        name: `Warga Dummy ${i}`,
        password: passwordHash,
        roleId: roleMap["WARGA"].id,
        nik: `327301000000${i.toString().padStart(4, "0")}`,
        status: "Aktif",
        rtRwId: area.id,
        wargaSubtype: "UTAMA",
        phone: phone,
      },
    });
    wargaList.push(wUser);

    const latBase = -6.88 + (Math.random() * 0.02 - 0.01);
    const lngBase = 107.61 + (Math.random() * 0.02 - 0.01);

    const hh = await prisma.household.upsert({
      where: { id: `household-${i}` },
      update: {},
      create: {
        id: `household-${i}`,
        userId: wUser.id,
        address: `Jalan Dummy Blok ${i}, No ${Math.floor(Math.random() * 100)}`,
        rtRwId: area.id,
        latitude: latBase,
        longitude: lngBase,
      },
    });
    householdList.push(hh);
    
    // Initial Point History
    await prisma.pointHistory.create({
      data: {
        userId: wUser.id,
        points: Math.floor(Math.random() * 500) + 100,
        description: "Saldo Awal Partisipasi (Generasi)",
        kategori: "PARTISIPASI_STREAK"
      }
    });
  }

  // 7. Generate Bins (300 bins, heavy favor for RW 06)
  console.log("Generating Bins...");
  const bins = [];
  const statuses = ["PRINTED", "ACTIVE_BOUND", "ACTIVE_BOUND", "ACTIVE_BOUND", "PENDING_APPROVAL", "PENDING_APPROVAL", "BROKEN", "INACTIVE"];
  
  const rw06Areas = rtRwAreas.filter(r => r.name.includes("RW 06"));
  
  for (let i = 1; i <= 300; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const assignedUser = status === "ACTIVE_BOUND" || status === "PENDING_APPROVAL" || status === "INACTIVE" ? wargaList[i % wargaList.length] : null;
    const cat = i % 3 === 0 ? catNonOrganic.id : catOrganic.id;
    
    // 60% chance to force it into RW 06 for demo purposes
    let area = rtRwAreas[i % rtRwAreas.length];
    if (Math.random() < 0.6 && rw06Areas.length > 0) {
      area = rw06Areas[Math.floor(Math.random() * rw06Areas.length)];
    }
    
    // Calculate realistic lat long based on area
    const lat = -6.88 + (Math.random() * 0.02 - 0.01);
    const lng = 107.61 + (Math.random() * 0.02 - 0.01);

    // For INACTIVE bins, set updatedAt to 35 days ago
    let updatedAt = new Date();
    if (status === "INACTIVE") {
      updatedAt = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
    }

    const bin = await prisma.bin.upsert({
      where: { qrCode: `TS-MASS-${i.toString().padStart(4, "0")}` },
      update: {},
      create: {
        qrCode: `TS-MASS-${i.toString().padStart(4, "0")}`,
        categoryId: cat,
        maxCapacityLiter: 30.0,
        currentVolumeLiter: status === "ACTIVE_BOUND" ? (Math.random() * 30.0) : 0.0,
        rtRwId: area.id,
        kelurahanId: dago.id,
        latitude: lat,
        longitude: lng,
        status: status as any,
        userId: assignedUser ? assignedUser.id : null,
        updatedAt,
      },
    });
    bins.push(bin);
  }

  // 8. Generate Waste Logs (1000 logs distributed over last 30 days)
  console.log("Generating 1000 Waste Logs...");
  const logs = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const activeBins = bins.filter(b => b.status === "ACTIVE_BOUND" && b.userId);
  
  // Make large chunks of data
  for (let i = 1; i <= 1000; i++) {
    const randomBin = activeBins[Math.floor(Math.random() * activeBins.length)];
    const randomHousehold = householdList.find(h => h.userId === randomBin.userId!);
    if (!randomHousehold) continue;

    const logDate = randomDate(thirtyDaysAgo, now);
    const isMismatch = Math.random() < 0.15; // 15% discrepancy rate
    const aiConf = 80 + Math.random() * 19;
    const isHighConfMismatch = isMismatch && aiConf > 90;
    
    const weight = Math.random() * 5 + 0.5; // 0.5 to 5.5 kg

    const log = await prisma.wasteLog.create({
      data: {
        householdId: randomHousehold.id,
        binId: randomBin.id,
        weightKg: weight,
        volumeLiter: weight * 3.5, // rough estimate
        categoryId: randomBin.categoryId,
        requestId: crypto.randomUUID(), // uuid format
        aiConfidence: aiConf,
        aiClassification: randomBin.categoryId === catOrganic.id ? "ORGANIC" : "NON_ORGANIC",
        actualWeightPetugas: weight + (isMismatch ? (Math.random() > 0.5 ? 1.5 : -1.5) : 0),
        discrepancyStatus: isHighConfMismatch ? "PENDING_REVIEW" : (isMismatch ? "RESOLVED" : "NONE"),
        petugasClassification: isMismatch ? (randomBin.categoryId === catOrganic.id ? "NON_ORGANIC" : "ORGANIC") : null,
        verifiedByPetugasId: coreUsers["petugas@psc.id"].id,
        verifiedAt: new Date(logDate.getTime() + 2 * 60 * 60 * 1000), // verified 2 hours later
        createdAt: logDate,
      },
    });
    logs.push(log);
  }

  // 9. Generate Facilities
  console.log("Generating Facilities & Production...");
  const types = ["loseda", "bata_terawang", "rumah_maggot", "bank_sampah"];
  const facilities = [];
  for (let i = 1; i <= 10; i++) {
    const type = types[i % types.length];
    const fac = await prisma.facility.create({
      data: {
        jenis: type as any,
        nama: `Fasilitas ${type.replace("_", " ").toUpperCase()} 0${i}`,
        pic: `Bapak RW ${i}`,
        kapasitas: Math.random() * 500 + 100,
        latitude: -6.88 + (Math.random() * 0.02 - 0.01),
        longitude: 107.61 + (Math.random() * 0.02 - 0.01),
        rtRwId: rtRwAreas[i % rtRwAreas.length].id,
        statusApproval: "APPROVED",
        createdAt: randomDate(thirtyDaysAgo, now),
      }
    });
    facilities.push(fac);

    if (type === "rumah_maggot") {
      for (let j = 0; j < 5; j++) {
        await prisma.facilityProductionLog.create({
          data: {
            facilityId: fac.id,
            materialMasukKg: Math.random() * 50 + 10,
            outputKg: Math.random() * 20 + 5,
            jenisOutput: "Maggot Kering",
            periode: `2026-W${25+j}`,
            createdAt: randomDate(thirtyDaysAgo, now),
          }
        });
      }
    }
  }

  // 10. Violations
  console.log("Generating Violations...");
  for (let i = 0; i < 20; i++) {
    const randomHousehold = householdList[Math.floor(Math.random() * householdList.length)];
    await prisma.violation.create({
      data: {
        userId: randomHousehold.userId,
        petugasUserId: coreUsers["petugas@psc.id"].id,
        type: "RESIDU_MIXED_ORGANIC",
        severity: "MEDIUM",
        evidencePhotoUrl: "https://via.placeholder.com/150",
        pointsDeducted: 2,
        notes: "Sampah plastik tercampur di tong organik",
        createdAt: randomDate(thirtyDaysAgo, now),
      }
    });
  }

  console.log("Massive seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
