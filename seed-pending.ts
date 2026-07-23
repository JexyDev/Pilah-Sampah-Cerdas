import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function addPendingData() {
  const rw = await prisma.user.findFirst({ where: { email: "rw@psc.id" } });
  if (!rw || !rw.rtRwId) {
    console.error("RW not found or no rtRwId");
    return;
  }
  console.log("RW:", rw.name, "rtRwId:", rw.rtRwId);

  // Add a pending bin
  const category = await prisma.wasteCategory.findFirst();
  const warga = await prisma.user.findFirst({ where: { email: "warga1@example.com" } });
  
  if (warga && category) {
    await prisma.bin.create({
      data: {
        qrCode: "QR-PENDING-001",
        categoryId: category.id,
        rtRwId: rw.rtRwId,
        status: "PENDING_APPROVAL",
        userId: warga.id,
      }
    });
    console.log("Added pending bin");
  }

  // Add a pending petugas
  const petugasUser = await prisma.user.findFirst({ where: { email: "petugas@psc.id" } });
  if (petugasUser) {
    await prisma.petugasResidu.update({
      where: { userId: petugasUser.id },
      data: { whitelistStatus: "PENDING", assignedZone: "RW 06" }
    });
    console.log("Updated petugas to PENDING");
  }
}

addPendingData().catch(console.error).finally(() => prisma.$disconnect());
