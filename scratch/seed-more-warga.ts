import { PrismaClient, BinStatus, OwnershipType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FIRST_NAMES = ["Budi", "Siti", "Agus", "Rina", "Joko", "Sri", "Heri", "Ani", "Eko", "Lilis", "Dedi", "Ratna", "Ahmad", "Dewi", "Wawan", "Tuti", "Andi", "Mega", "Hendra", "Yanti"];
const LAST_NAMES = ["Santoso", "Fatimah", "Widodo", "Lestari", "Prasetyo", "Ningsih", "Kurniawan", "Sari", "Hidayat", "Wahyuni", "Saputra", "Astuti", "Susanto", "Indah", "Subagyo", "Rahayu", "Budiman", "Kartika", "Setiawan", "Utami"];
const STREETS = ["Jl. Dago Pojok", "Jl. Dago Barat", "Jl. Cigadung Raya", "Jl. Cigadung Indah", "Jl. Coblong Raya", "Jl. Coblong Tengah", "Jl. Dago Asri", "Jl. Dago Elos", "Jl. Dago Timur", "Jl. Cigadung Wetan", "Jl. Cisitu Indah", "Jl. Sangkuriang", "Jl. Kanayakan", "Jl. Kidang Pananjung", "Jl. Tubagus Ismail"];

async function run() {
  console.log("Seeding 40 more realistic warga + households + bins in Coblong...");
  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Get Warga Role
  const roleWarga = await prisma.role.findUnique({
    where: { name: "WARGA" },
  });
  if (!roleWarga) {
    console.error("Warga role not found!");
    return;
  }

  // 2. Get categories
  const catO = await prisma.wasteCategory.findFirst({
    where: { name: { contains: "Organik", mode: "insensitive" } },
  });
  const catA = await prisma.wasteCategory.findFirst({
    where: { name: { contains: "Anorganik", mode: "insensitive" } },
  });
  if (!catO || !catA) {
    console.error("Categories not found!");
    return;
  }

  // 3. Get RW areas
  const areas = await prisma.rtRwArea.findMany();
  if (areas.length === 0) {
    console.error("No RT/RW areas found!");
    return;
  }

  // Find max existing number suffix to continue ORG/ANORG numbering
  const allBins = await prisma.bin.findMany({ select: { qrCode: true } });
  let maxOrg = 0;
  let maxAno = 0;
  for (const b of allBins) {
    const code = b.qrCode.toUpperCase();
    if (code.includes("ORG")) {
      const match = code.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (val > maxOrg) maxOrg = val;
      }
    }
    if (code.includes("ANO")) {
      const match = code.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (val > maxAno) maxAno = val;
      }
    }
  }

  console.log(`Starting QR counter at ORG: ${maxOrg}, ANO: ${maxAno}`);

  // 4. Create 40 Warga
  for (let i = 1; i <= 40; i++) {
    const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name = `${fn} ${ln}`;
    const phone = `+62821200000${String(10 + i).padStart(2, "0")}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@psc.id`;
    const nik = `32730140260000${String(10 + i).padStart(2, "0")}`;
    const street = STREETS[Math.floor(Math.random() * STREETS.length)];
    const address = `${street} No. ${Math.floor(Math.random() * 80) + 1}`;
    
    const area = areas[Math.floor(Math.random() * areas.length)];

    // Dispersed coordinates around Coblong (-6.875 to -6.899 lat, 107.605 to 107.629 lng)
    const lat = -6.875 - Math.random() * 0.024;
    const lng = 107.605 + Math.random() * 0.024;

    try {
      const u = await prisma.user.create({
        data: {
          phone,
          email,
          name,
          password: passwordHash,
          status: "Aktif",
          roleId: roleWarga.id,
          rtRwId: area.id,
          nik,
          address,
          wargaSubtype: "UTAMA"
        }
      });

      const hh = await prisma.household.create({
        data: {
          userId: u.id,
          rtRwId: area.id,
          address,
          latitude: lat,
          longitude: lng
        }
      });

      // Increment QR sequence
      maxOrg++;
      maxAno++;
      const qrOrg = `ORG${String(maxOrg).padStart(8, "0")}`;
      const qrAno = `ANORG${String(maxAno).padStart(8, "0")}`;

      const binO = await prisma.bin.create({
        data: {
          qrCode: qrOrg,
          categoryId: catO.id,
          status: "ACTIVE_BOUND",
          rtRwId: area.id,
          latitude: lat,
          longitude: lng,
          userId: u.id,
          maxCapacityLiter: 25.0,
          currentVolumeLiter: Math.random() * 15,
          binType: "STANDARD",
          shape: "CYLINDER"
        }
      });
      await prisma.binOwnership.create({
        data: { binId: binO.id, userId: u.id, type: OwnershipType.UTAMA }
      });

      const binA = await prisma.bin.create({
        data: {
          qrCode: qrAno,
          categoryId: catA.id,
          status: "ACTIVE_BOUND",
          rtRwId: area.id,
          latitude: lat,
          longitude: lng,
          userId: u.id,
          maxCapacityLiter: 25.0,
          currentVolumeLiter: Math.random() * 15,
          binType: "STANDARD",
          shape: "CYLINDER"
        }
      });
      await prisma.binOwnership.create({
        data: { binId: binA.id, userId: u.id, type: OwnershipType.UTAMA }
      });

      console.log(`Registered ${name} at RT/RW ID ${area.id} (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    } catch (e: any) {
      console.error(`Failed seeding warga ${name}:`, e.message);
    }
  }
  console.log("Seeding completed!");
}

run().finally(() => prisma.$disconnect());
