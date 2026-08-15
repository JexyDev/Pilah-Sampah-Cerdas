import { PrismaClient, BinStatus, OwnershipType, DispatchStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding COMPLETE demo database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Clean Up Database (Clean and Relational Safe)
  console.log("Cleaning up existing data...");
  await prisma.refreshToken.deleteMany({});
  await prisma.pointHistory.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.notificationLog.deleteMany({});
  await prisma.aiRequestLog.deleteMany({});
  await prisma.binResetRequest.deleteMany({});
  await prisma.dispatchTask.deleteMany({});
  await prisma.violation.deleteMany({});
  await prisma.kknHandoverHistory.deleteMany({});
  await prisma.setoranManual.deleteMany({});
  await prisma.pemanfaatan.deleteMany({});
  await prisma.auditTrail.deleteMany({});
  await prisma.socialFeed.deleteMany({});
  await prisma.binOwnership.deleteMany({});
  await prisma.setoranOtomatis.deleteMany({});
  await prisma.bin.deleteMany({});
  await prisma.household.deleteMany({});
  await prisma.studentKkn.deleteMany({});
  await prisma.kelompokKkn.deleteMany({});
  await prisma.petugasResidu.deleteMany({});
  await prisma.qrBatch.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.facility.deleteMany({});
  await prisma.peternakan.deleteMany({});
  await prisma.wasteCategory.deleteMany({});
  await prisma.rtRwArea.deleteMany({});
  await prisma.kelurahan.deleteMany({});

  // 2. Seed Roles
  console.log("Creating roles...");
  const roles = [
    "SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT",
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

  // 3. Seed Kelurahan & RW Areas
  console.log("Creating areas...");
  const dago = await prisma.kelurahan.create({ data: { name: "Dago" } });
  const cigadung = await prisma.kelurahan.create({ data: { name: "Cigadung" } });
  const coblong = await prisma.kelurahan.create({ data: { name: "Coblong" } });

  const rw06Dago = await prisma.rtRwArea.create({
    data: { kelurahanId: dago.id, name: "RW 06" }
  });
  const rw02Cigadung = await prisma.rtRwArea.create({
    data: { kelurahanId: cigadung.id, name: "RW 02" }
  });
  const rw01Coblong = await prisma.rtRwArea.create({
    data: { kelurahanId: coblong.id, name: "RW 01" }
  });
  const rw03Dago = await prisma.rtRwArea.create({
    data: { kelurahanId: dago.id, name: "RW 03" }
  });

  const zoneRecords: Record<string, any> = {
    "RW 06": rw06Dago,
    "RW 02": rw02Cigadung,
    "RW 01": rw01Coblong,
    "RW 03": rw03Dago,
  };

  // 4. Seed Waste Categories
  console.log("Creating waste categories...");
  const catO = await prisma.wasteCategory.create({
    data: { name: "Organik", description: "Sampah sisa makanan dan organik", pointsPerKg: 10 }
  });
  const catA = await prisma.wasteCategory.create({
    data: { name: "Anorganik", description: "Sampah plastik, kertas, logam", pointsPerKg: 15 }
  });

  // 5. Seed SUPER USER & RW Accounts
  console.log("Creating core users...");
  const superUser = await prisma.user.create({
    data: {
      phone: "+628111111111",
      email: "superUser@psc.id",
      name: "SUPER USER TrashCare",
      password: passwordHash,
      status: "Aktif",
      roleId: roleMap["SUPER_USER"].id,
      nik: "3273010000000001"
    }
  });

  const rwUser = await prisma.user.create({
    data: {
      phone: "+628111111115",
      email: "rw@psc.id",
      name: "Asep RW 06",
      password: passwordHash,
      status: "Aktif",
      roleId: roleMap["RW"].id,
      rtRwId: rw06Dago.id,
      nik: "3273010000000005"
    }
  });

  // 6. Seed 2 KKN Students
  console.log("Creating KKN students...");
  const kkn1 = await prisma.user.create({
    data: {
      phone: "+628111111118",
      email: "budi.kkn@psc.id",
      name: "Budi ITB",
      password: passwordHash,
      status: "Aktif",
      roleId: roleMap["MAHASISWA_KKN"].id,
      rtRwId: rw06Dago.id,
      nik: "3273012026000008"
    }
  });
  await prisma.studentKkn.create({
    data: {
      userId: kkn1.id,
      nim: "10123001",
      jurusan: "Teknik Informatika",
      fakultas: "Fastek",
      noWa: "+628111111118",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      whitelistStatus: "APPROVED",
      assignedPolygonId: rw06Dago.id
    }
  });

  const kkn2 = await prisma.user.create({
    data: {
      phone: "+628111111119",
      email: "siti.kkn@psc.id",
      name: "Siti UNIKOM",
      password: passwordHash,
      status: "Aktif",
      roleId: roleMap["MAHASISWA_KKN"].id,
      rtRwId: rw02Cigadung.id,
      nik: "3273012026000009"
    }
  });
  await prisma.studentKkn.create({
    data: {
      userId: kkn2.id,
      nim: "10123002",
      jurusan: "Sistem Informasi",
      fakultas: "Fastek",
      noWa: "+628111111119",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      whitelistStatus: "APPROVED",
      assignedPolygonId: rw02Cigadung.id
    }
  });

  // 7. Seed 3 Residu Officers
  console.log("Creating Residu officers...");
  const petugasSeeds = [
    { phone: "+628111111117", email: "yanto.petugas@psc.id", name: "Pak Yanto", zone: "RW 06 Dago" },
    { phone: "+628111111120", email: "ujang.petugas@psc.id", name: "Pak Ujang", zone: "RW 02 Cigadung" },
    { phone: "+628111111121", email: "dadang.petugas@psc.id", name: "Pak Dadang", zone: "RW 01 Coblong" }
  ];

  const petugasUsers: any[] = [];
  for (let i = 0; i < petugasSeeds.length; i++) {
    const p = petugasSeeds[i];
    const u = await prisma.user.create({
      data: {
        phone: p.phone,
        email: p.email,
        name: p.name,
        password: passwordHash,
        status: "Aktif",
        roleId: roleMap["PETUGAS_RESIDU"].id,
        nik: `327301302600000${i + 1}`
      }
    });
    await prisma.petugasResidu.create({
      data: {
        userId: u.id,
        nama: p.name,
        noWa: p.phone,
        kpiScore: 100.0,
        assignedZone: p.zone,
        whitelistStatus: "APPROVED"
      }
    });
    petugasUsers.push(u);
  }

  // 8. Seed 10 Citizens (Warga) in Coblong area
  console.log("Creating 10 citizens...");
  const wargaSeeds = [
    { phone: "+6282120000001", email: "ratna@psc.id", name: "Bu Ratna", address: "Jl. Dago Barat No. 10", zone: "RW 06", lat: -6.8820, lng: 107.6150 },
    { phone: "+6282120000002", email: "asep@psc.id", name: "Pak Asep", address: "Jl. Dago Pojok No. 5", zone: "RW 06", lat: -6.8825, lng: 107.6145 },
    { phone: "+6282120000003", email: "sri@psc.id", name: "Bu Sri", address: "Jl. Cigadung Raya No. 12", zone: "RW 02", lat: -6.8850, lng: 107.6250 },
    { phone: "+6282120000004", email: "heri@psc.id", name: "Pak Heri", address: "Jl. Cigadung Indah No. 3", zone: "RW 02", lat: -6.8855, lng: 107.6245 },
    { phone: "+6282120000005", email: "rina@psc.id", name: "Bu Rina", address: "Jl. Coblong Raya No. 8", zone: "RW 01", lat: -6.8950, lng: 107.6100 },
    { phone: "+6282120000006", email: "joko@psc.id", name: "Pak Joko", address: "Jl. Coblong Tengah No. 2", zone: "RW 01", lat: -6.8945, lng: 107.6105 },
    { phone: "+6282120000007", email: "ani@psc.id", name: "Bu Ani", address: "Jl. Dago Asri No. 15", zone: "RW 03", lat: -6.8900, lng: 107.6150 },
    { phone: "+6282120000008", email: "eko@psc.id", name: "Pak Eko", address: "Jl. Dago Elos No. 1", zone: "RW 03", lat: -6.8895, lng: 107.6155 },
    { phone: "+6282120000009", email: "lilis@psc.id", name: "Bu Lilis", address: "Jl. Dago Timur No. 7", zone: "RW 06", lat: -6.8830, lng: 107.6160 },
    { phone: "+6282120000010", email: "dedi@psc.id", name: "Pak Dedi", address: "Jl. Cigadung Wetan No. 4", zone: "RW 02", lat: -6.8860, lng: 107.6260 }
  ];

  const wargas: any[] = [];
  for (let i = 0; i < wargaSeeds.length; i++) {
    const ws = wargaSeeds[i];
    const rtRwArea = zoneRecords[ws.zone];

    const u = await prisma.user.create({
      data: {
        phone: ws.phone,
        email: ws.email,
        name: ws.name,
        password: passwordHash,
        status: "Aktif",
        roleId: roleMap["WARGA"].id,
        rtRwId: rtRwArea.id,
        nik: `32730140260000${String(i + 1).padStart(2, "0")}`,
        address: ws.address,
        wargaSubtype: "UTAMA"
      }
    });

    const hh = await prisma.household.create({
      data: {
        userId: u.id,
        rtRwId: rtRwArea.id,
        address: ws.address,
        latitude: ws.lat,
        longitude: ws.lng
      }
    });

    wargas.push({ user: u, household: hh, zone: ws.zone, lat: ws.lat, lng: ws.lng });
  }

  // 9. Generate 20 Bins & Activation Records (ACTIVE_BOUND)
  console.log("Generating 20 bins with ACTIVE_BOUND status...");
  // Create QrBatch for these bins (assigned to kkn1)
  const qrBatch = await prisma.qrBatch.create({
    data: {
      batchCode: "BATCH-DEMO-20",
      totalQr: 20,
      status: "ACTIVE_BOUND",
      assignedPicUserId: kkn1.id
    }
  });

  const bins: any[] = [];
  for (let i = 0; i < wargas.length; i++) {
    const w = wargas[i];
    const rtRwArea = zoneRecords[w.zone];

    // Organik Bin
    const binO = await prisma.bin.create({
      data: {
        qrCode: `QR-ORG-${String(i + 1).padStart(3, "0")}`,
        categoryId: catO.id,
        qrBatchId: qrBatch.id,
        status: "ACTIVE_BOUND",
        rtRwId: rtRwArea.id,
        latitude: w.lat,
        longitude: w.lng,
        userId: w.user.id,
        maxCapacityLiter: 25.0,
        currentVolumeLiter: 5.5,
        binType: "STANDARD",
        shape: "CYLINDER"
      }
    });
    await prisma.binOwnership.create({
      data: { binId: binO.id, userId: w.user.id, type: OwnershipType.UTAMA }
    });
    bins.push(binO);

    // Anorganik Bin
    const binA = await prisma.bin.create({
      data: {
        qrCode: `QR-ANO-${String(i + 1).padStart(3, "0")}`,
        categoryId: catA.id,
        qrBatchId: qrBatch.id,
        status: "ACTIVE_BOUND",
        rtRwId: rtRwArea.id,
        latitude: w.lat,
        longitude: w.lng,
        userId: w.user.id,
        maxCapacityLiter: 25.0,
        currentVolumeLiter: 3.2,
        binType: "STANDARD",
        shape: "CYLINDER"
      }
    });
    await prisma.binOwnership.create({
      data: { binId: binA.id, userId: w.user.id, type: OwnershipType.UTAMA }
    });
    bins.push(binA);

    // Points for activation: +10 for Warga, +10 for Mahasiswa
    await prisma.pointHistory.create({
      data: {
        userId: w.user.id,
        points: 10,
        description: "Bonus Aktivasi Tempat Sampah Pertama Kali",
        kategori: "REDUKSI_TONASE"
      }
    });

    await prisma.pointHistory.create({
      data: {
        userId: (i % 2 === 0 ? kkn1.id : kkn2.id),
        points: 10,
        description: `Bonus Aktivasi Warga Dampingan (${w.user.name})`,
        kategori: "REDUKSI_TONASE"
      }
    });
  }

  // 10. Generate 40 Waste Logs spread over last 7 days (to populate graph)
  console.log("Generating 40 historical waste logs...");
  for (let j = 0; j < 40; j++) {
    const w = wargas[j % wargas.length];
    const isOrganic = j % 2 === 0;
    const cat = isOrganic ? catO : catA;
    const bin = bins.find(b => b.userId === w.user.id && b.categoryId === cat.id);

    const weight = parseFloat((1.2 + Math.random() * 3.5).toFixed(1));
    const volume = parseFloat((2.0 + Math.random() * 6.0).toFixed(1));
    const reqId = uuidv4();
    const daysAgo = j % 7; // Spread over last 7 days
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    await prisma.setoranOtomatis.create({
      data: {
        wargaId: w.user.id,
        fotoSampahUrl: "https://picsum.photos/400/300",
        hasilKlasifikasiAi: isOrganic ? "organik" : "anorganik",
        confidenceAi: parseFloat((0.85 + Math.random() * 0.13).toFixed(2)),
        berat: weight,
        unit: "Kg",
        poin: Math.round(weight * 0.9 * 0.9), // Rough approximation
        qrTempatSampahId: bin.id,
        lokasiGps: `${w.household.latitude},${w.household.longitude}`,
        createdAt: date
      }
    });

    // Award points
    const pointsEarned = Math.round(weight * cat.pointsPerKg);
    await prisma.pointHistory.create({
      data: {
        userId: w.user.id,
        points: pointsEarned,
        description: `Setoran Mandiri ${isOrganic ? "Organik" : "Anorganik"}`,
        kategori: "REDUKSI_TONASE",
        createdAt: date
      }
    });
  }

  // 11. Generate 3-5 Completed Dispatch Tasks (Verification & Timbangan)
  console.log("Generating completed dispatch tasks with timbangan aktual...");
  for (let k = 0; k < 4; k++) {
    const w = wargas[k];
    const bin = bins.find(b => b.userId === w.user.id && b.categoryId === catO.id);
    const petugas = petugasUsers[k % petugasUsers.length];

    const dispatchTask = await prisma.dispatchTask.create({
      data: {
        binId: bin.id,
        status: DispatchStatus.COMPLETED,
        claimedByUserId: petugas.id,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    });

    // Update the waste log verified by petugas
    const weightActual = parseFloat((10.0 + Math.random() * 15.0).toFixed(1)); // 10 - 25 kg timbangan industri
    const reqId = uuidv4();
    await prisma.setoranOtomatis.create({
      data: {
        wargaId: w.user.id,
        fotoSampahUrl: "https://picsum.photos/400/300",
        hasilKlasifikasiAi: "organik",
        confidenceAi: 0.95,
        berat: weightActual,
        unit: "Kg",
        poin: Math.round(weightActual * 0.95 * 0.9),
        qrTempatSampahId: bin.id,
        lokasiGps: `${w.household.latitude},${w.household.longitude}`,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    });
  }

  // 12. Create Facilities for GIS Legend
  console.log("Creating facilities...");
  await prisma.facility.create({
    data: {
      jenis: "rumah_maggot",
      nama: "Rumah Maggot Dago",
      pic: "Kang Asep",
      latitude: -6.8830,
      longitude: 107.6160,
      rtRwId: rw06Dago.id,
      statusApproval: "APPROVED"
    }
  });

  await prisma.facility.create({
    data: {
      jenis: "bank_sampah",
      nama: "Bank Sampah Sejahtera",
      pic: "Bu Euis",
      latitude: -6.8920,
      longitude: 107.6120,
      rtRwId: rw03Dago.id,
      statusApproval: "APPROVED"
    }
  });

  console.log("Demo simulation seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Failed to seed demo data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
