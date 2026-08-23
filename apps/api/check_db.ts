import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const records = await prisma.activityAttendance.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });
  console.log("Recent attendances:", JSON.stringify(records, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
