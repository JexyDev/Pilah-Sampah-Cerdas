import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const connInfo = await prisma.$queryRaw`SELECT current_database(), current_user, inet_server_addr(), inet_server_port()`;
  console.log("Connection info:", connInfo);

  const binCount = await prisma.bin.count();
  console.log("Bin count:", binCount);

  const bins = await prisma.bin.groupBy({ by: ["status"], _count: { id: true } });
  console.log("Bins by status:", bins);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
