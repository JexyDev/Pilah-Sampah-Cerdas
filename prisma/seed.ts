import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding EMERGENCY Demo Data for TrashCare...");
  
  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Seed Roles
  const roles = [
    "SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT",
    "PETUGAS_RESIDU", "WARGA", "MAHASISWA_KKN"
  ];
  
  const roleMap: Record<string, any> = {};
  for (const r of roles) {
    roleMap[r] = await prisma.role.upsert({
      where: { name: r },
      update: {},
      create: { name: r }
    });
  }

  // 2. Clean Up Tables
  console.log("Cleaning up existing tables...");
  await prisma.refreshToken.deleteMany({});
  await prisma.pointHistory.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.notificationLog.deleteMany({});
  await prisma.aiRequestLog.deleteMany({});
  await prisma.binResetRequest.deleteMany({});
  await prisma.dispatchTask.deleteMany({});
  await prisma.violation.deleteMany({});
  await prisma.kknHandoverHistory.deleteMany({});
  await prisma.residuLog.deleteMany({});
  await prisma.auditTrail.deleteMany({});
  await prisma.socialFeed.deleteMany({});
  await prisma.binOwnership.deleteMany({});
  await prisma.wasteLog.deleteMany({});
  await prisma.bin.deleteMany({});
  await prisma.household.deleteMany({});
  await prisma.studentKkn.deleteMany({});
  await prisma.petugasResidu.deleteMany({});
  await prisma.qrBatch.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.facility.deleteMany({});
  await prisma.peternakan.deleteMany({});
  await prisma.rtRwArea.deleteMany({});
  await prisma.kelurahan.deleteMany({});

  // 3. Seed Wilayah (Kecamatan Coblong, Kota Bandung)
  console.log("Seeding Kelurahan and RW/RT areas...");
  const dago = await prisma.kelurahan.upsert({
    where: { name: "Dago" },
    update: {},
    create: { name: "Dago" }
  });
  const sadangserang = await prisma.kelurahan.upsert({
    where: { name: "Sadang Serang" },
    update: {},
    create: { name: "Sadang Serang" }
  });

  const rw06Dago = await prisma.rtRwArea.create({
    data: { kelurahanId: dago.id, name: "RW 06" }
  });
  
  const rt01Rw06Dago = await prisma.rtRwArea.create({
    data: { kelurahanId: dago.id, name: "RT 01 / RW 06" }
  });

  // 4. Seed Waste Categories
  const catO = await prisma.wasteCategory.upsert({
    where: { name: "Organik" },
    update: {},
    create: { name: "Organik", description: "Sisa makanan & organik basah", pointsPerKg: 10 }
  });
  const catA = await prisma.wasteCategory.upsert({
    where: { name: "Anorganik" },
    update: {},
    create: { name: "Anorganik", description: "Plastik, kertas, logam, dll", pointsPerKg: 15 }
  });

  // 5. Seed Core & Staff Users
  console.log("Seeding staff and management users...");
  const userSeeds = [
    { phone: "+628111111111", email: "superadmin@psc.id", name: "Super Admin TrashCare", roleId: roleMap["SUPER_ADMIN"].id, nik: "3273010000000001", rtRwId: null },
    { phone: "+628111111112", email: "admin@psc.id", name: "Admin DLH Bandung", roleId: roleMap["ADMIN_DLH"].id, nik: "3273010000000002", rtRwId: null },
    { phone: "+628111111113", email: "camat@psc.id", name: "Camat Coblong", roleId: roleMap["CAMAT"].id, nik: "3273010000000003", rtRwId: null },
    { phone: "+628111111114", email: "lurah@psc.id", name: "Lurah Dago", roleId: roleMap["LURAH"].id, nik: "3273010000000004", rtRwId: null },
    { phone: "+628111111115", email: "rw@psc.id", name: "Asep RW 06", roleId: roleMap["RW"].id, nik: "3273010000000005", rtRwId: rw06Dago.id },
    { phone: "+628111111116", email: "rt@psc.id", name: "Bambang RT 01", roleId: roleMap["RT"].id, nik: "3273010000000006", rtRwId: rt01Rw06Dago.id },
  ];

  const coreUsers: Record<string, any> = {};
  for (const u of userSeeds) {
    coreUsers[u.phone] = await prisma.user.create({
      data: { ...u, password: passwordHash, status: "Aktif" },
    });
  }

  // 6. Seed Mahasiswa (2 orang)
  console.log("Seeding KKN Students...");
  const students = [
    { phone: "+628111111118", email: "andi.kkn@psc.id", name: "Andi Saputra", nim: "12345678", jurusan: "Teknik Informatika", fakultas: "Fastek" },
    { phone: "+628111111119", email: "dewi.kkn@psc.id", name: "Dewi Lestari", nim: "12345679", jurusan: "Sistem Informasi", fakultas: "Fastek" }
  ];

  for (const s of students) {
    const u = await prisma.user.create({
      data: {
        phone: s.phone,
        email: s.email,
        name: s.name,
        password: passwordHash,
        status: "Aktif",
        roleId: roleMap["MAHASISWA_KKN"].id,
        rtRwId: rw06Dago.id,
        nik: `327301202600000${s.nim.slice(-1)}`
      }
    });

    await prisma.studentKkn.create({
      data: {
        userId: u.id,
        nim: s.nim,
        jurusan: s.jurusan,
        fakultas: s.fakultas,
        noWa: s.phone,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        whitelistStatus: "APPROVED",
        assignedPolygonId: rw06Dago.id
      }
    });
    
    coreUsers[s.phone] = u;
  }

  // 7. Seed Petugas Residu (2 orang)
  console.log("Seeding Residu Officers...");
  const officers = [
    { phone: "+628111111117", email: "budi.petugas@psc.id", name: "Budi Petugas", zone: "RW 06 Dago" },
    { phone: "+628111111120", email: "soni.petugas@psc.id", name: "Soni Petugas", zone: "RW 06 Dago" }
  ];

  for (let i = 0; i < officers.length; i++) {
    const o = officers[i];
    const u = await prisma.user.create({
      data: {
        phone: o.phone,
        email: o.email,
        name: o.name,
        password: passwordHash,
        status: "Aktif",
        roleId: roleMap["PETUGAS_RESIDU"].id,
        rtRwId: rw06Dago.id,
        nik: `327301302600000${i + 1}`
      }
    });

    await prisma.petugasResidu.create({
      data: {
        userId: u.id,
        nama: o.name,
        noWa: o.phone,
        kpiScore: 100.0,
        assignedZone: o.zone,
        whitelistStatus: "APPROVED"
      }
    });

    coreUsers[o.phone] = u;
  }

  // 8. Seed Warga (5 orang)
  console.log("Seeding Citizens (Warga)...");
  const wargaSeeds = [
    { phone: "+6282100000001", email: "siti@psc.id", name: "Siti Aminah", address: "Jl. Dago Barat No. 12" },
    { phone: "+6282100000002", email: "agus@psc.id", name: "Agus Setiawan", address: "Jl. Dago Timur No. 4" },
    { phone: "+6282100000003", email: "sri@psc.id", name: "Sri Wahyuni", address: "Jl. Dago Pojok No. 17" },
    { phone: "+6282100000004", email: "dewis@psc.id", name: "Dewi Sartika", address: "Jl. Dago Asri No. 5" },
    { phone: "+6282100000005", email: "budir@psc.id", name: "Budi Rahardjo", address: "Jl. Dago Elos No. 2" }
  ];

  const citizenUsers: any[] = [];
  for (let i = 0; i < wargaSeeds.length; i++) {
    const ws = wargaSeeds[i];
    const u = await prisma.user.create({
      data: {
        phone: ws.phone,
        email: ws.email,
        name: ws.name,
        password: passwordHash,
        status: "Aktif",
        roleId: roleMap["WARGA"].id,
        rtRwId: rt01Rw06Dago.id,
        nik: `327301402600000${i + 1}`,
        address: ws.address,
        wargaSubtype: "UTAMA"
      }
    });

    const hh = await prisma.household.create({
      data: {
        userId: u.id,
        rtRwId: rt01Rw06Dago.id,
        address: ws.address,
        latitude: -6.890000 + (i * 0.0005),
        longitude: 107.610000 + (i * 0.0005)
      }
    });

    citizenUsers.push({ user: u, household: hh });
  }

  // 9. Generate 10 QR Codes (5 Organik & 5 Anorganik) with status PRINTED
  console.log("Generating 10 master QR codes ready for activation...");
  const batch = await prisma.qrBatch.create({
    data: {
      batchCode: "BATCH-EMERGENCY-01",
      totalQr: 10,
      status: "PRINTED",
      printedAt: new Date()
    }
  });

  const orgQrCodes = ["QR-ORG-001", "QR-ORG-002", "QR-ORG-003", "QR-ORG-004", "QR-ORG-005"];
  const anoQrCodes = ["QR-ANO-001", "QR-ANO-002", "QR-ANO-003", "QR-ANO-004", "QR-ANO-005"];

  for (const code of orgQrCodes) {
    await prisma.bin.create({
      data: {
        qrCode: code,
        categoryId: catO.id,
        qrBatchId: batch.id,
        status: "PRINTED",
        rtRwId: rt01Rw06Dago.id,
        kelurahanId: dago.id,
        maxCapacityLiter: 25.0,
        currentVolumeLiter: 0.0
      }
    });
  }

  for (const code of anoQrCodes) {
    await prisma.bin.create({
      data: {
        qrCode: code,
        categoryId: catA.id,
        qrBatchId: batch.id,
        status: "PRINTED",
        rtRwId: rt01Rw06Dago.id,
        kelurahanId: dago.id,
        maxCapacityLiter: 25.0,
        currentVolumeLiter: 0.0
      }
    });
  }

  // 10. Seed standard system configs
  console.log("Seeding system configs...");
  await prisma.systemConfig.upsert({
    where: { key: "DEFAULT_BIN_CAPACITY" },
    update: {},
    create: { key: "DEFAULT_BIN_CAPACITY", value: "25.0", tipe: "number", deskripsi: "Default bin capacity in liters" }
  });

  console.log("EMERGENCY Demo Data seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
