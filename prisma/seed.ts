import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding Demo Data for TrashCare...");
  
  const passwordHash = await bcrypt.hash("password123", 10);

  // Seed Roles
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

  // Seed Wilayah (Kota Bandung -> Kecamatan Coblong -> Kelurahan Dago, dll)
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

  const rw06Dago = await prisma.rtRwArea.upsert({
    where: { kelurahanId_name: { kelurahanId: dago.id, name: "RW 06" } },
    update: {},
    create: { kelurahanId: dago.id, name: "RW 06" }
  });
  
  const rt01Rw06Dago = await prisma.rtRwArea.upsert({
    where: { kelurahanId_name: { kelurahanId: dago.id, name: "RT 01 / RW 06" } },
    update: {},
    create: { kelurahanId: dago.id, name: "RT 01 / RW 06" }
  });

  // Delete all existing data to prevent unique constraint failures
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

  // Seed Core Users
  const userSeeds = [
    { phone: "+628111111111", email: "superadmin@psc.id", name: "Super Admin", roleId: roleMap["SUPER_ADMIN"].id, nik: "3273010000000001", rtRwId: null },
    { phone: "+628111111112", email: "admin@psc.id", name: "Admin DLH", roleId: roleMap["ADMIN_DLH"].id, nik: "3273010000000002", rtRwId: null },
    { phone: "+628111111113", email: "camat@psc.id", name: "Camat Coblong", roleId: roleMap["CAMAT"].id, nik: "3273010000000003", rtRwId: null },
    { phone: "+628111111114", email: "lurah@psc.id", name: "Lurah Dago", roleId: roleMap["LURAH"].id, nik: "3273010000000004", rtRwId: null },
    { phone: "+628111111115", email: "rw@psc.id", name: "Asep RW 06", roleId: roleMap["RW"].id, nik: "3273010000000005", rtRwId: rw06Dago.id },
    { phone: "+628111111116", email: "rt@psc.id", name: "Bambang RT 01", roleId: roleMap["RT"].id, nik: "3273010000000006", rtRwId: rt01Rw06Dago.id },
    { phone: "+628111111117", email: "petugas@psc.id", name: "Budi Petugas Residu", roleId: roleMap["PETUGAS_RESIDU"].id, nik: "3273010000000007", rtRwId: rw06Dago.id },
    { phone: "+628111111118", email: "kkn@psc.id", name: "Andi Mahasiswa KKN", roleId: roleMap["MAHASISWA_KKN"].id, nik: "3273010000000008", rtRwId: rw06Dago.id },
  ];

  const coreUsers: any = {};
  for (const u of userSeeds) {
    coreUsers[u.phone] = await prisma.user.upsert({
      where: { phone: u.phone },
      update: { rtRwId: u.rtRwId, email: u.email },
      create: { ...u, password: passwordHash, status: "Aktif" },
    });
  }

  // Create StudentKkn profile for KKN user
  const kknUser = coreUsers["+628111111118"];
  await prisma.studentKkn.upsert({
    where: { userId: kknUser.id },
    update: {},
    create: {
      userId: kknUser.id,
      nim: "12345678",
      jurusan: "Teknik Informatika",
      fakultas: "STEI",
      noWa: "+628111111118",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
      whitelistStatus: "APPROVED"
    }
  });

  // Create PetugasResidu profile for Petugas user
  const petugasUser = coreUsers["+628111111117"];
  await prisma.petugasResidu.upsert({
    where: { userId: petugasUser.id },
    update: {},
    create: {
      userId: petugasUser.id,
      nama: petugasUser.name,
      noWa: "+628111111117",
      kpiScore: 100.0,
      assignedZone: "RW 06 Dago",
      whitelistStatus: "APPROVED"
    }
  });

  const batch = await prisma.qrBatch.upsert({
    where: { batchCode: "BATCH-DEMO" },
    update: {},
    create: { batchCode: "BATCH-DEMO", totalQr: 100, assignedPicUserId: coreUsers["+628111111118"].id, printedAt: new Date(), status: "DIPEGANG_MAHASISWA" }
  });

  const catO = await prisma.wasteCategory.upsert({ where: { name: "Organik" }, update: {}, create: { name: "Organik", description: "Sisa makanan", pointsPerKg: 10 }});
  const catA = await prisma.wasteCategory.upsert({ where: { name: "Anorganik" }, update: {}, create: { name: "Anorganik", description: "Plastik, Kertas", pointsPerKg: 15 }});

  // Generate 50 Warga Dummy & Waste Logs
  const names = ["Siti", "Agus", "Wati", "Budi", "Dewi", "Rudi", "Sri", "Hendra", "Ayu", "Yudi"];
  const importUuid = "43c39682-ee3a-4428-94b1-6a2e99859f5b"; // Static UUID for requestId

  for (let i = 1; i <= 50; i++) {
    const phone = `+628210000${i.toString().padStart(4, '0')}`;
    const name = `${names[i % 10]} ${Math.floor(i / 10) + 1}`;
    const w = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: {
        phone,
        email: `warga${i}@psc.id`,
        name,
        password: passwordHash,
        status: "Aktif",
        roleId: roleMap["WARGA"].id,
        rtRwId: i % 2 === 0 ? rt01Rw06Dago.id : rw06Dago.id,
        nik: `327301990000${i.toString().padStart(4, '0')}`
      }
    });

    // Create households and bins
    let hh = await prisma.household.findFirst({ where: { userId: w.id } });
    if (!hh) {
      hh = await prisma.household.create({ 
        data: { 
          userId: w.id, 
          rtRwId: w.rtRwId!, 
          address: `Jl. Dago No. ${i}`, 
          latitude: -6.890000 + (i * 0.0001), 
          longitude: 107.610000 + (i * 0.0001) 
        } 
      });
    }

    const qrO = `QR-O-${i}`;
    const qrA = `QR-A-${i}`;

    const binO = await prisma.bin.upsert({
      where: { qrCode: qrO },
      update: {},
      create: { qrCode: qrO, qrBatchId: batch.id, userId: w.id, categoryId: catO.id, kelurahanId: dago.id, rtRwId: hh.rtRwId, status: "ACTIVE_BOUND", maxCapacityLiter: 50.0, latitude: hh.latitude, longitude: hh.longitude }
    });
    
    const binA = await prisma.bin.upsert({
      where: { qrCode: qrA },
      update: {},
      create: { qrCode: qrA, qrBatchId: batch.id, userId: w.id, categoryId: catA.id, kelurahanId: dago.id, rtRwId: hh.rtRwId, status: "ACTIVE_BOUND", maxCapacityLiter: 50.0, latitude: hh.latitude, longitude: hh.longitude }
    });

    // Generate Waste Logs (last 2-4 weeks)
    // Every 4 days, citizens deposit waste
    const now = new Date();
    const petugasId = coreUsers["+628111111117"].id;

    for (let dayOffset = 28; dayOffset > 0; dayOffset -= 4) {
      const depositDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      
      // Organik Log
      const weightOrg = 1.0 + Math.random() * 3.0; // 1-4 kg
      await prisma.wasteLog.create({
        data: {
          householdId: hh.id,
          binId: binO.id,
          weightKg: weightOrg,
          volumeLiter: weightOrg * 1.5,
          categoryId: catO.id,
          requestId: importUuid,
          aiConfidence: 92.5,
          aiClassification: "Organik",
          actualWeightPetugas: weightOrg,
          discrepancyStatus: "NONE",
          verifiedByPetugasId: petugasId,
          verifiedAt: depositDate,
          createdAt: depositDate,
          updatedAt: depositDate
        }
      });

      // Anorganik Log
      const weightAnorg = 0.5 + Math.random() * 2.0; // 0.5-2.5 kg
      await prisma.wasteLog.create({
        data: {
          householdId: hh.id,
          binId: binA.id,
          weightKg: weightAnorg,
          volumeLiter: weightAnorg * 2.0,
          categoryId: catA.id,
          requestId: importUuid,
          aiConfidence: 94.0,
          aiClassification: "Anorganik",
          actualWeightPetugas: weightAnorg,
          discrepancyStatus: "NONE",
          verifiedByPetugasId: petugasId,
          verifiedAt: depositDate,
          createdAt: depositDate,
          updatedAt: depositDate
        }
      });
    }
  }

  // Add peternakan for Maggot
  await prisma.peternakan.upsert({
    where: { id: "PETERNAKAN-DEMO" },
    update: {},
    create: { id: "PETERNAKAN-DEMO", nama: "Peternakan Mang Udin", pemilik: "Mang Udin", noWa: "08122222222", populasi: 500, hasilPanenKg: 10.5 }
  });

  // Add Facilities
  const facilities = [
    { jenis: "bata_terawang" as const, nama: "Bata Terawang RW 06", pic: "Kang Dadang", kontak: "08123456780", kapasitas: 50.0, latitude: -6.891, longitude: 107.611, rtRwId: rw06Dago.id, statusApproval: "APPROVED" },
    { jenis: "loseda" as const, nama: "Loseda Kompos Dago", pic: "Teh Lilis", kontak: "08123456781", kapasitas: 20.0, latitude: -6.892, longitude: 107.612, rtRwId: rw06Dago.id, statusApproval: "APPROVED" },
    { jenis: "rumah_maggot" as const, nama: "Rumah Maggot Coblong", pic: "Pak RT", kontak: "08123456782", kapasitas: 150.0, latitude: -6.893, longitude: 107.613, rtRwId: rw06Dago.id, statusApproval: "APPROVED" },
    { jenis: "bank_sampah" as const, nama: "Bank Sampah Bersinar RW 06", pic: "Bu RW", kontak: "08123456783", kapasitas: 500.0, latitude: -6.894, longitude: 107.614, rtRwId: rw06Dago.id, statusApproval: "APPROVED" }
  ];

  for (const f of facilities) {
    await prisma.facility.upsert({
      where: { id: f.nama.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: f.nama.toLowerCase().replace(/\s+/g, '-'),
        jenis: f.jenis,
        nama: f.nama,
        pic: f.pic,
        kontak: f.kontak,
        kapasitas: f.kapasitas,
        latitude: f.latitude,
        longitude: f.longitude,
        rtRwId: f.rtRwId,
        statusApproval: f.statusApproval
      }
    });
  }

  // Create 3-5 REQUEST_ACTIVATE_BIN audit trail logs to simulate citizens helped by KKN student
  const wargaList = await prisma.user.findMany({
    where: { role: { name: "WARGA" } },
    take: 5
  });

  for (let i = 0; i < wargaList.length; i++) {
    const w = wargaList[i];
    const binsOfWarga = await prisma.bin.findMany({ where: { userId: w.id } });
    const qrCodes = binsOfWarga.map(b => b.qrCode);
    
    await prisma.auditTrail.create({
      data: {
        action: "REQUEST_ACTIVATE_BIN",
        userId: kknUser.id,
        timestamp: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000), // different days
        newValue: {
          qrCodes,
          status: "PENDING_APPROVAL",
          ownerUserId: w.id,
          kknLocation: {
            latitude: -6.890000 + (i * 0.0002),
            longitude: 107.610000 + (i * 0.0002)
          }
        }
      }
    });
  }

  console.log("Demo Data seeded successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
