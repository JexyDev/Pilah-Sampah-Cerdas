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

  // Seed Core Users
  const userSeeds = [
    { phone: "08111111111", email: "superadmin@psc.id", name: "Super Admin", roleId: roleMap["SUPER_ADMIN"].id, nik: "3273010000000001", rtRwId: null },
    { phone: "08111111112", email: "admin@psc.id", name: "Admin DLH", roleId: roleMap["ADMIN_DLH"].id, nik: "3273010000000002", rtRwId: null },
    { phone: "08111111113", email: "camat@psc.id", name: "Camat Coblong", roleId: roleMap["CAMAT"].id, nik: "3273010000000003", rtRwId: null },
    { phone: "08111111114", email: "lurah@psc.id", name: "Lurah Dago", roleId: roleMap["LURAH"].id, nik: "3273010000000004", rtRwId: null },
    { phone: "08111111115", email: "rw@psc.id", name: "Asep RW 06", roleId: roleMap["RW"].id, nik: "3273010000000005", rtRwId: rw06Dago.id },
    { phone: "08111111116", email: "rt@psc.id", name: "Bambang RT 01", roleId: roleMap["RT"].id, nik: "3273010000000006", rtRwId: rt01Rw06Dago.id },
    { phone: "08111111117", email: "petugas@psc.id", name: "Budi Petugas Residu", roleId: roleMap["PETUGAS_RESIDU"].id, nik: "3273010000000007", rtRwId: rw06Dago.id },
    { phone: "08111111118", email: "kkn@psc.id", name: "Andi Mahasiswa KKN", roleId: roleMap["MAHASISWA_KKN"].id, nik: "3273010000000008", rtRwId: rw06Dago.id },
  ];

  const coreUsers: any = {};
  for (const u of userSeeds) {
    coreUsers[u.phone] = await prisma.user.upsert({
      where: { phone: u.phone },
      update: { rtRwId: u.rtRwId, email: u.email },
      create: { ...u, password: passwordHash, status: "Aktif" },
    });
  }

  const batch = await prisma.qrBatch.upsert({
    where: { batchCode: "BATCH-DEMO" },
    update: {},
    create: { batchCode: "BATCH-DEMO", totalQr: 100, assignedPicUserId: coreUsers["08111111118"].id, printedAt: new Date(), status: "DIPEGANG_MAHASISWA" }
  });

  const catO = await prisma.wasteCategory.upsert({ where: { name: "Organik" }, update: {}, create: { name: "Organik", description: "Sisa makanan", pointsPerKg: 10 }});
  const catA = await prisma.wasteCategory.upsert({ where: { name: "Anorganik" }, update: {}, create: { name: "Anorganik", description: "Plastik, Kertas", pointsPerKg: 15 }});

  // Generate 50 Warga Dummy
  const names = ["Siti", "Agus", "Wati", "Budi", "Dewi", "Rudi", "Sri", "Hendra", "Ayu", "Yudi"];
  for (let i = 1; i <= 50; i++) {
    const phone = `08210000${i.toString().padStart(4, '0')}`;
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
      hh = await prisma.household.create({ data: { userId: w.id, rtRwId: w.rtRwId, address: "Jl. Dago", latitude: -6.89, longitude: 107.61 } });
    }

    const qrO = `QR-O-${i}`;
    const qrA = `QR-A-${i}`;

    await prisma.bin.upsert({
      where: { qrCode: qrO },
      update: {},
      create: { qrCode: qrO, qrBatchId: batch.id, userId: w.id, categoryId: catO.id, kelurahanId: dago.id, rtRwId: hh.rtRwId, status: "ACTIVE_BOUND", maxCapacityLiter: "50", latitude: -6.89, longitude: 107.61 }
    });
    
    await prisma.bin.upsert({
      where: { qrCode: qrA },
      update: {},
      create: { qrCode: qrA, qrBatchId: batch.id, userId: w.id, categoryId: catA.id, kelurahanId: dago.id, rtRwId: hh.rtRwId, status: "ACTIVE_BOUND", maxCapacityLiter: "50", latitude: -6.89, longitude: 107.61 }
    });
  }

  // Add peternakan for Maggot
  await prisma.peternakan.upsert({
    where: { id: "PETERNAKAN-DEMO" },
    update: {},
    create: { id: "PETERNAKAN-DEMO", nama: "Peternakan Mang Udin", pemilik: "Mang Udin", noWa: "08122222222", populasi: 500, hasilPanenKg: 10.5 }
  });

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
