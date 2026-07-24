import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  try {
    const schedules = await prisma.schedule.findMany({
      orderBy: { date: "asc" },
    });
    console.log("Total schedules queried successfully from Prisma:", schedules.length);
    if (schedules.length > 0) {
      console.log("Sample schedule:", JSON.stringify(schedules[0], null, 2));
    }
  } catch (e: any) {
    console.error("Prisma schedule query failed:", e.message);
  }
}

run().finally(() => prisma.$disconnect());
