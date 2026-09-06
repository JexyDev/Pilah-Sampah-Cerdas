import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.kelompokKkn.findMany({
    include: {
      _count: {
        select: { students: true }
      }
    }
  });

  console.log(`📌 Total Kelompok KKN di DB sebelum cleanup: ${groups.length}`);

  const emptyGroups = groups.filter(g => g._count.students === 0);
  console.log(`📌 Ditemukan ${emptyGroups.length} kelompok kosong (0 anggota).`);

  for (const g of emptyGroups) {
    await prisma.kelompokKkn.delete({
      where: { id: g.id }
    });
    console.log(` - Menghapus kelompok kosong: "${g.name}" (${g.kelurahan || '-'})`);
  }

  const finalCount = await prisma.kelompokKkn.count();
  console.log(`✅ TOTAL KELOMPOK KKN AKHIR DI DB: ${finalCount}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
