import { PrismaClient, BinStatus, OwnershipType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

const FIRST_NAMES = [
  "Budi", "Siti", "Agus", "Dewi", "Asep", "Sri", "Hadi", "Indah", "Rian", "Mega",
  "Joko", "Ani", "Eko", "Lilis", "Dedi", "Rina", "Bambang", "Susi", "Heri", "Yanti",
  "Roni", "Irma", "Dian", "Taufik", "Novi", "Hendra", "Yulia", "Andi", "Fitri", "Rudi",
  "Maman", "Ratna", "Cecep", "Euis", "Ginanjar", "Imas", "Dadang", "Tati", "Ujang", "Cucu",
  "Aang", "Neng", "Deden", "Eneng", "Ono", "Teten", "Wawan", "Yayat", "Ahmad", "Nur"
];

const LAST_NAMES = [
  "Santoso", "Aminah", "Setiawan", "Lestari", "Hidayat", "Wahyuni", "Prasetyo", "Kartika",
  "Nugroho", "Utami", "Saputra", "Rahmawati", "Wijaya", "Sari", "Kusuma", "Astuti",
  "Hadi", "Indriati", "Purnomo", "Wulandari", "Subagyo", "Susanti", "Budiman", "Anggraini",
  "Gunawan", "Fitriani", "Sutrisno", "Hartati", "Wibowo", "Hayati", "Darwis", "Siregar",
  "Nasution", "Simanjuntak", "Situmorang", "Lubis", "Ginting", "Tarigan", "Sitepu", "Sembiring",
  "Pane", "Harahap", "Tanjung", "Chaniago", "Koto", "Piliang", "Sikumbang", "Melayu", "Gani"
];

const STREET_NAMES = [
  "Jl. Dago Barat", "Jl. Dago Timur", "Jl. Dago Pojok", "Jl. Dago Asri", "Jl. Dago Elos",
  "Jl. Cigadung Raya", "Jl. Cigadung Indah", "Jl. Cigadung Selat", "Jl. Cigadung Wetan",
  "Jl. Coblong Raya", "Jl. Coblong Tengah", "Jl. Coblong Girang", "Jl. Coblong Hilir"
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomWeight(): number {
  return parseFloat((1.0 + Math.random() * 4.0).toFixed(1)); // 1.0 - 5.0 kg
}

function getRandomVolume(): number {
  return parseFloat((2.0 + Math.random() * 8.0).toFixed(1)); // 2.0 - 10.0 L
}

async function main() {
  console.log("Start seeding 100 Warga Bandung Demo Data...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Get Roles
  const wargaRole = await prisma.role.findUnique({ where: { name: "WARGA" } });
  const kknRole = await prisma.role.findUnique({ where: { name: "MAHASISWA_KKN" } });
  if (!wargaRole || !kknRole) {
    throw new Error("Roles 'WARGA' and 'MAHASISWA_KKN' must exist. Please run standard seed first.");
  }

  // 2. Ensure Waste Categories exist
  const catO = await prisma.wasteCategory.findUnique({ where: { name: "Organik" } });
  const catA = await prisma.wasteCategory.findUnique({ where: { name: "Anorganik" } });
  if (!catO || !catA) {
    throw new Error("Waste categories 'Organik' and 'Anorganik' must exist. Please run standard seed first.");
  }

  // 3. Find or Create Kelurahans
  const dago = await prisma.kelurahan.upsert({
    where: { name: "Dago" },
    update: {},
    create: { name: "Dago" }
  });
  const cigadung = await prisma.kelurahan.upsert({
    where: { name: "Cigadung" },
    update: {},
    create: { name: "Cigadung" }
  });
  const coblong = await prisma.kelurahan.upsert({
    where: { name: "Coblong" },
    update: {},
    create: { name: "Coblong" }
  });

  // 4. Find or Create RW Zones
  const rwZones = [
    { kelurahanId: dago.id, name: "RW 06", lat: -6.8820, lng: 107.6150 },
    { kelurahanId: dago.id, name: "RW 03", lat: -6.8900, lng: 107.6150 },
    { kelurahanId: cigadung.id, name: "RW 02", lat: -6.8850, lng: 107.6250 },
    { kelurahanId: coblong.id, name: "RW 01", lat: -6.8950, lng: 107.6100 }
  ];

  const zoneRecords: Record<string, any> = {};
  for (const zone of rwZones) {
    zoneRecords[zone.name] = await prisma.rtRwArea.upsert({
      where: { kelurahanId_name: { kelurahanId: zone.kelurahanId, name: zone.name } },
      update: {},
      create: { kelurahanId: zone.kelurahanId, name: zone.name }
    });
  }

  // 5. Ensure KKN Student exists to assign QrBatch
  let kknStudent = await prisma.user.findFirst({
    where: { role: { name: "MAHASISWA_KKN" } }
  });
  if (!kknStudent) {
    console.log("No KKN Student found, creating dummy student...");
    const u = await prisma.user.create({
      data: {
        phone: "+628111111118",
        email: "andi.kkn@psc.id",
        name: "Andi Saputra",
        password: passwordHash,
        status: "Aktif",
        roleId: kknRole.id,
        rtRwId: zoneRecords["RW 06"].id,
        nik: "3273012026000008"
      }
    });
    await prisma.studentKkn.create({
      data: {
        userId: u.id,
        nim: "12345678",
        jurusan: "Teknik Informatika",
        fakultas: "Fastek",
        noWa: "+628111111118",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        whitelistStatus: "APPROVED",
        assignedPolygonId: zoneRecords["RW 06"].id
      }
    });
    kknStudent = u;
  }

  // 6. Create QrBatch assigned to this KKN Student
  const batch = await prisma.qrBatch.create({
    data: {
      batchCode: `BATCH-DEMO-${Date.now()}`,
      totalQr: 200,
      status: "ASSIGNED_TO_PIC",
      assignedPicUserId: kknStudent.id
    }
  });

  // 7. Seed 100 Wargas
  console.log("Generating 100 Warga records with bins & setoran logs...");
  for (let i = 1; i <= 100; i++) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const email = `warga.demo.${i}@psc.id`;
    const phone = `+6282120000${String(i).padStart(3, "0")}`;
    const nik = `3273014026000${String(i).padStart(3, "0")}`;
    const address = `${getRandomElement(STREET_NAMES)} No. ${Math.floor(1 + Math.random() * 50)}`;

    // Distribute equally across 4 zones
    const zoneName = rwZones[(i - 1) % rwZones.length].name;
    const zoneInfo = rwZones[(i - 1) % rwZones.length];
    const rtRwArea = zoneRecords[zoneName];

    // Jitter coordinates around zone center
    const latJitter = (Math.random() - 0.5) * 0.003;
    const lngJitter = (Math.random() - 0.5) * 0.003;
    const lat = zoneInfo.lat + latJitter;
    const lng = zoneInfo.lng + lngJitter;

    // Status: 85 active, 15 pending approval
    const isPending = i % 7 === 0; // Approx 14-15 wargas will be pending
    const binStatus: BinStatus = isPending ? BinStatus.PENDING_APPROVAL : BinStatus.ACTIVE_BOUND;

    // Create User
    const user = await prisma.user.create({
      data: {
        phone,
        email,
        name,
        password: passwordHash,
        status: "Aktif",
        roleId: wargaRole.id,
        rtRwId: rtRwArea.id,
        nik,
        address,
        wargaSubtype: "UTAMA"
      }
    });

    // Create Household
    const household = await prisma.household.create({
      data: {
        userId: user.id,
        rtRwId: rtRwArea.id,
        address,
        latitude: lat,
        longitude: lng
      }
    });

    // Create Organik Bin
    const binOrg = await prisma.bin.create({
      data: {
        qrCode: `QR-DEMO-O-${String(i).padStart(3, "0")}`,
        categoryId: catO.id,
        qrBatchId: batch.id,
        status: binStatus,
        rtRwId: rtRwArea.id,
        kelurahanId: zoneInfo.kelurahanId,
        latitude: lat,
        longitude: lng,
        maxCapacityLiter: 25.0,
        currentVolumeLiter: binStatus === BinStatus.ACTIVE_BOUND ? getRandomVolume() : 0.0,
        userId: user.id,
        binType: "STANDARD",
        shape: "CYLINDER"
      }
    });

    await prisma.binOwnership.create({
      data: {
        binId: binOrg.id,
        userId: user.id,
        type: OwnershipType.UTAMA
      }
    });

    // Create Anorganik Bin
    const binAno = await prisma.bin.create({
      data: {
        qrCode: `QR-DEMO-A-${String(i).padStart(3, "0")}`,
        categoryId: catA.id,
        qrBatchId: batch.id,
        status: binStatus,
        rtRwId: rtRwArea.id,
        kelurahanId: zoneInfo.kelurahanId,
        latitude: lat,
        longitude: lng,
        maxCapacityLiter: 25.0,
        currentVolumeLiter: binStatus === BinStatus.ACTIVE_BOUND ? getRandomVolume() : 0.0,
        userId: user.id,
        binType: "STANDARD",
        shape: "CYLINDER"
      }
    });

    await prisma.binOwnership.create({
      data: {
        binId: binAno.id,
        userId: user.id,
        type: OwnershipType.UTAMA
      }
    });

    // If active, generate waste logs & point history
    if (binStatus === BinStatus.ACTIVE_BOUND) {
      // 1. Organik Setoran
      const weightO = getRandomWeight();
      const volO = getRandomVolume();
      const reqIdO = uuidv4();
      await prisma.wasteLog.create({
        data: {
          householdId: household.id,
          binId: binOrg.id,
          weightKg: weightO,
          volumeLiter: volO,
          categoryId: catO.id,
          requestId: reqIdO,
          aiConfidence: 0.94,
          aiClassification: "Organik",
          discrepancyStatus: "NONE",
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000)
        }
      });

      // 2. Anorganik Setoran
      const weightA = getRandomWeight();
      const volA = getRandomVolume();
      const reqIdA = uuidv4();
      await prisma.wasteLog.create({
        data: {
          householdId: household.id,
          binId: binAno.id,
          weightKg: weightA,
          volumeLiter: volA,
          categoryId: catA.id,
          requestId: reqIdA,
          aiConfidence: 0.96,
          aiClassification: "Anorganik",
          discrepancyStatus: "NONE",
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000)
        }
      });

      // Add points
      const pointsEarned = Math.round(weightO * catO.pointsPerKg + weightA * catA.pointsPerKg);
      await prisma.pointHistory.create({
        data: {
          userId: user.id,
          points: pointsEarned,
          description: "Setoran Sampah Mandiri (Organik & Anorganik)",
          kategori: "REDUKSI_TONASE",
          redeemable: false
        }
      });
    }
  }

  console.log("Successfully seeded 100 demo citizens with 200 bins & activity logs!");
}

main()
  .catch((e) => {
    console.error("Failed to seed 100 demo wargas:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
