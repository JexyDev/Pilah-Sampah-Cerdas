import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Testing WasteCategory...");
    const categories = await prisma.wasteCategory.findMany();
    console.log("Success! Count:", categories.length);
  } catch (e: any) {
    console.error("WasteCategory failed:", e.message || e);
  }

  try {
    console.log("Testing Schedule...");
    const schedules = await prisma.schedule.findMany();
    console.log("Success! Count:", schedules.length);
  } catch (e: any) {
    console.error("Schedule failed:", e.message || e);
  }

  try {
    console.log("Testing WasteLog...");
    const logs = await prisma.wasteLog.findMany({ take: 5 });
    console.log("Success! Count:", logs.length);
  } catch (e: any) {
    console.error("WasteLog failed:", e.message || e);
  }
}

run().finally(() => prisma.$disconnect());
