import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  console.log("=== DB Verification ===");
  const userCount = await prisma.user.count({
    where: { email: { contains: "warga.demo." } }
  });
  const householdCount = await prisma.household.count({
    where: { user: { email: { contains: "warga.demo." } } }
  });
  const binCount = await prisma.bin.count({
    where: { qrCode: { contains: "QR-DEMO-" } }
  });
  const activeBinCount = await prisma.bin.count({
    where: { qrCode: { contains: "QR-DEMO-" }, status: "ACTIVE_BOUND" }
  });
  const pendingBinCount = await prisma.bin.count({
    where: { qrCode: { contains: "QR-DEMO-" }, status: "PENDING_APPROVAL" }
  });
  const logCount = await prisma.wasteLog.count({
    where: { bin: { qrCode: { contains: "QR-DEMO-" } } }
  });

  console.log(`Demo Users Count: ${userCount} (Expected: 100)`);
  console.log(`Demo Households Count: ${householdCount} (Expected: 100)`);
  console.log(`Demo Bins Count: ${binCount} (Expected: 200)`);
  console.log(`Demo Active Bins: ${activeBinCount}`);
  console.log(`Demo Pending Bins: ${pendingBinCount}`);
  console.log(`Demo Waste Logs Count: ${logCount}`);
  console.log("=== Verification Done ===");
}

verify().catch(console.error).finally(() => prisma.$disconnect());
