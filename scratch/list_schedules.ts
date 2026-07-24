import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const schedules = await prisma.schedule.findMany();
  console.log(JSON.stringify(schedules, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
