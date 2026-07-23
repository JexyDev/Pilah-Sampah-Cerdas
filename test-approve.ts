import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { rwService } from "./src/services/rwService.js";

async function testApprove() {
  const pendingBin = await prisma.bin.findFirst({ where: { status: "PENDING_APPROVAL" } });
  if (pendingBin) {
    try {
      console.log("Approving bin:", pendingBin.id);
      await rwService.approveBin(pendingBin.id);
      console.log("Success!");
    } catch (e: any) {
      console.error("Failed:", e.message);
    }
  } else {
    console.log("No pending bin");
  }
}

testApprove().finally(() => prisma.$disconnect());
