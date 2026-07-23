import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.systemConfig.findMany();
  console.log(JSON.stringify(configs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
