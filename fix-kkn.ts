import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const kknUser = await prisma.user.findFirst({ where: { email: 'kkn@psc.id' } });
  if (!kknUser) return console.log('No KKN user');

  const batch = await prisma.qrBatch.create({
    data: {
      batchCode: 'BATCH-KKN-01',
      assignedPicUserId: kknUser.id,
      status: 'ASSIGNED_TO_PIC',
      totalQr: 50,
    }
  });

  const updated = await prisma.bin.updateMany({
    where: { status: 'ACTIVE_BOUND', qrBatchId: null },
    data: { qrBatchId: batch.id }
  });
  console.log('Linked bins:', updated.count);
}
main().finally(() => prisma.$disconnect());
