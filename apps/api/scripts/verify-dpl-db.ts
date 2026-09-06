import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const dpls = await prisma.user.findMany({
    where: { role: { name: 'DPL' } },
    select: { id: true, name: true, phone: true, address: true, status: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Total DPL Users in DB: ${dpls.length}`);
  dpls.forEach((d, i) => {
    console.log(`${i + 1}. ${d.name} | NIP: ${d.phone} | Prodi: ${d.address} | Status: ${d.status}`);
  });
}

main().finally(() => prisma.$disconnect());
