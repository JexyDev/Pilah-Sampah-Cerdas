import { generateNextQrCode } from "../src/utils/qrGenerator.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  const categories = await prisma.wasteCategory.findMany();
  for (const cat of categories) {
    try {
      const nextQr = await generateNextQrCode(cat.id);
      console.log(`Category: ${cat.name} (${cat.id}) -> Next QR: ${nextQr}`);
    } catch (e: any) {
      console.error(`Failed for ${cat.name}:`, e.message);
    }
  }
}

run().finally(() => prisma.$disconnect());
