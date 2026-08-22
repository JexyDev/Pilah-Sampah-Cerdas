import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.activityAttendance.count();
  console.log("Total presensi:", count);
  const data = await prisma.activityAttendance.findMany({ take: 5 });
  console.log("Data presensi terbaru:", JSON.stringify(data, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
