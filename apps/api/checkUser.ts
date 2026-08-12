import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({
    where: { phone: "+628111111128" },
    include: { role: true }
  });
  console.log("DPL User:", user);
}
main().catch(console.error).finally(() => prisma.$disconnect());
