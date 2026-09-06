import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Get Categories
  const catO = await prisma.wasteCategory.findUnique({ where: { name: "Organik" } });
  const catA = await prisma.wasteCategory.findUnique({ where: { name: "Anorganik" } });

  if (!catO || !catA) {
    throw new Error("Categories not found!");
  }

  // 2. Add Organik Bin
  console.log("Adding ORG00012026...");
  const binO = await prisma.bin.upsert({
    where: { qrCode: "ORG00012026" },
    update: {},
    create: {
      qrCode: "ORG00012026",
      categoryId: catO.id,
      latitude: null, // Let's keep it null so geofencing is bypassed automatically!
      longitude: null,
      status: "ACTIVE_BOUND",
    },
  });

  // 3. Add Anorganik Bin
  console.log("Adding ANORG00012026...");
  const binA = await prisma.bin.upsert({
    where: { qrCode: "ANORG00012026" },
    update: {},
    create: {
      qrCode: "ANORG00012026",
      categoryId: catA.id,
      latitude: null,
      longitude: null,
      status: "ACTIVE_BOUND",
    },
  });

  // 4. Bind to ALL WARGA users so the user's test account definitely has it.
  const users = await prisma.user.findMany({ where: { role: "WARGA" } });
  
  for (const user of users) {
    console.log("Binding to user:", user.email);
    await prisma.binOwnership.upsert({
      where: {
        userId_binId: {
          userId: user.id,
          binId: binO.id,
        }
      },
      update: {},
      create: {
        userId: user.id,
        binId: binO.id,
        role: "OWNER"
      }
    });

    await prisma.binOwnership.upsert({
      where: {
        userId_binId: {
          userId: user.id,
          binId: binA.id,
        }
      },
      update: {},
      create: {
        userId: user.id,
        binId: binA.id,
        role: "OWNER"
      }
    });
  }

  console.log("Done adding bins!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
