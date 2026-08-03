import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.kelompokKkn.findMany({
    select: {
      id: true,
      name: true,
      dplNamaMentah: true,
      dplId: true,
      dpl: { select: { id: true, name: true, phone: true } },
      _count: { select: { students: true } },
    },
  });

  console.log('Total Kelompok in DB:', groups.length);
  console.log('Groups with dplId:', groups.filter((g) => g.dplId !== null).length);

  const dplUsers = await prisma.user.findMany({
    where: { role: { name: { in: ['DPL', 'DOSEN_PEMBIMBING'] } } },
    select: { id: true, name: true, phone: true },
  });

  console.log('Total DPL Users in DB:', dplUsers.length);
  console.log('Sample DPL Users:', JSON.stringify(dplUsers.slice(0, 5), null, 2));
  console.log('Sample Groups:', JSON.stringify(groups.slice(0, 5), null, 2));
}

main().finally(() => prisma.$disconnect());
