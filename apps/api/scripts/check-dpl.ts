import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.kelompokKkn.findMany({
    select: {
      id: true,
      name: true,
      kelurahan: true,
      dplNamaMentah: true,
      dplId: true,
      dpl: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      _count: {
        select: {
          students: true,
        },
      },
    },
  });

  console.log('Total Kelompok:', groups.length);
  console.log(JSON.stringify(groups, null, 2));

  const dplRole = await prisma.role.findFirst({ where: { name: { in: ['DPL', 'DOSEN_PEMBIMBING'] } } });
  const dplUsers = dplRole
    ? await prisma.user.findMany({
        where: { roleId: dplRole.id },
        select: { id: true, name: true, phone: true },
      })
    : [];
  console.log('Total User DPL:', dplUsers.length);
  console.log(JSON.stringify(dplUsers, null, 2));
}

main().finally(() => prisma.$disconnect());
