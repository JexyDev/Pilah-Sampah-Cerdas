import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const batches = await prisma.qrBatch.findMany({
    orderBy: { createdAt: "desc" }
  });
  console.log("Total QR Batches:", batches.length);
  for (const b of batches) {
    console.log(`ID: ${b.id}, Code: ${b.batchCode}, Status: ${b.status}, CreatedAt: ${b.createdAt}`);
  }
}

run().finally(() => prisma.$disconnect());
