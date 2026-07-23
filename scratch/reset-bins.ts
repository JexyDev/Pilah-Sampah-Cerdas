import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Reset volume semua bin UJI agar bisa diisi ulang
const result = await prisma.bin.updateMany({
  where: {
    qrBatch: { batchCode: { startsWith: "UJI-BATCH" } },
  },
  data: {
    currentVolumeLiter: 0,
  },
});
console.log(`Reset volume ${result.count} bins`);
await prisma.$disconnect();
