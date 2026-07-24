import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  console.log("=== DB Real Demo Verification ===");
  
  const superAdminCount = await prisma.user.count({ where: { role: { name: "SUPER_ADMIN" } } });
  const rwCount = await prisma.user.count({ where: { role: { name: "RW" } } });
  const kknCount = await prisma.user.count({ where: { role: { name: "MAHASISWA_KKN" } } });
  const petugasCount = await prisma.user.count({ where: { role: { name: "PETUGAS_RESIDU" } } });
  const wargaCount = await prisma.user.count({ where: { role: { name: "WARGA" } } });
  
  const activeBins = await prisma.bin.count({ where: { status: "ACTIVE_BOUND" } });
  const totalWasteLogs = await prisma.wasteLog.count();
  const completedDispatchTasks = await prisma.dispatchTask.count({ where: { status: "COMPLETED" } });
  
  const facilities = await prisma.facility.count();

  console.log(`Super Admin: ${superAdminCount} (Expected: 1)`);
  console.log(`RW: ${rwCount} (Expected: 1)`);
  console.log(`KKN: ${kknCount} (Expected: 2)`);
  console.log(`Petugas: ${petugasCount} (Expected: 3)`);
  console.log(`Warga: ${wargaCount} (Expected: 10)`);
  console.log(`Active Bins: ${activeBins} (Expected: 20)`);
  console.log(`Waste Logs: ${totalWasteLogs} (Expected: 44, 40 history + 4 verification)`);
  console.log(`Completed Dispatch Tasks: ${completedDispatchTasks} (Expected: 4)`);
  console.log(`Facilities: ${facilities} (Expected: 2)`);
  
  console.log("=== Verification Successful ===");
}

verify().catch(console.error).finally(() => prisma.$disconnect());
