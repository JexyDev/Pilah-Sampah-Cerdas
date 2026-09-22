import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const survei = await prisma.surveiKelurahan.findMany({
    include: {
      pemilahanSampah: true,
      volumeSampah: true
    }
  });
  console.log(JSON.stringify(survei, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
