import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.role.upsert({
    where: { name: 'RT' },
    update: {},
    create: { name: 'RT' }
  });
  console.log('RT role seeded');
}

main().catch(console.error).finally(() => prisma.$disconnect());
