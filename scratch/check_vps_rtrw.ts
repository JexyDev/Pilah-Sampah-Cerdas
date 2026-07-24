import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  try {
    const kelurahans = await prisma.kelurahan.findMany({
      include: { rtRwAreas: true }
    });
    console.log("Kelurahans and RT/RW Areas on VPS:");
    console.log(JSON.stringify(kelurahans, null, 2));

    const households = await prisma.household.findMany();
    console.log("Households in DB:", households.length);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
