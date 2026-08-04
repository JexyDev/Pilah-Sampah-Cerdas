import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("🔧 FIX & RELINK ACCURATE RT & RW ACCOUNTS IN DB");
  console.log("==================================================\n");

  const rtRole = await prisma.role.findFirst({ where: { name: "RT" } });
  const rwRole = await prisma.role.findFirst({ where: { name: "RW" } });

  if (!rtRole || !rwRole) {
    console.error("❌ Role RT or RW not found in database!");
    process.exit(1);
  }

  // 1. Fetch all RT & RW Areas
  const allAreas = await prisma.rtRwArea.findMany({
    include: { kelurahan: true },
  });

  console.log(`Found ${allAreas.length} RtRwArea records in DB.`);

  // 2. Fetch all users whose names start with 'Ketua RT' or 'Ketua RW'
  const rtRwUsers = await prisma.user.findMany({
    where: {
      OR: [
        { name: { startsWith: "Ketua RT" } },
        { name: { startsWith: "Ketua RW" } },
      ],
    },
  });

  console.log(`Found ${rtRwUsers.length} RT/RW user accounts in DB.`);

  let updatedCount = 0;

  for (const user of rtRwUsers) {
    const isRt = user.name.startsWith("Ketua RT");
    const targetRoleId = isRt ? rtRole.id : rwRole.id;

    // Parse Kelurahan and RW code from name
    // Example name: "Ketua RT 01 / RW 01 Cipaganti" or "Ketua RW 02 Lebak Siliwangi"
    let matchedArea = null;

    for (const area of allAreas) {
      const kelName = area.kelurahan.name; // e.g. "Cipaganti"
      const rwName = area.name; // e.g. "RW 01 (Cipaganti)"

      if (user.name.toLowerCase().includes(kelName.toLowerCase())) {
        // Check RW match
        const rwMatch = user.name.match(/RW\s*(\d+)/i);
        if (rwMatch) {
          const rwNum = parseInt(rwMatch[1], 10);
          const formattedRw = `RW ${rwNum < 10 ? "0" + rwNum : rwNum}`;
          if (area.name.includes(formattedRw)) {
            matchedArea = area;
            break;
          }
        }
      }
    }

    const updateData: any = {
      roleId: targetRoleId,
    };

    if (matchedArea) {
      updateData.rtRwId = matchedArea.id;
      console.log(
        `✅ Updated [${user.name}] -> Role: ${isRt ? "RT" : "RW"} | Wilayah: ${matchedArea.name}`
      );
    } else {
      console.log(
        `⚠️ Updated [${user.name}] -> Role: ${isRt ? "RT" : "RW"} | Wilayah: Keep existing (id: ${user.rtRwId})`
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
    updatedCount++;
  }

  // 3. Ensure all Warga users have a valid rtRwId
  const defaultArea = allAreas[0];
  if (defaultArea) {
    const wargaUsers = await prisma.user.findMany({
      where: {
        role: { name: "WARGA" },
        rtRwId: null,
      },
    });

    if (wargaUsers.length > 0) {
      console.log(`Linking ${wargaUsers.length} unassigned Warga to default area [${defaultArea.name}]...`);
      await prisma.user.updateMany({
        where: {
          role: { name: "WARGA" },
          rtRwId: null,
        },
        data: { rtRwId: defaultArea.id },
      });
    }
  }

  console.log(`\n==================================================`);
  console.log(`✅ BERHASIL PERBAIKI ${updatedCount} AKUN RT & RW!`);
  console.log(`==================================================\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
