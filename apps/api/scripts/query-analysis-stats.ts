import dotenv from "dotenv";
dotenv.config();
import { prisma } from "../src/lib/prisma.js";

async function main() {
  console.log("=== 1. ANALISIS TEMPAT SAMPAH (BIN) ===");
  const totalBins = await prisma.bin.count();
  console.log("Total Bins in DB:", totalBins);

  const binsByStatus = await prisma.bin.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  console.log("Bins by status:", binsByStatus);

  const binsByApproval = await prisma.bin.groupBy({
    by: ["status", "rwId"],
    _count: { id: true },
  });
  console.log("Bins with rw vs null rw (grouped count):", binsByApproval.length);

  const activeBoundBins = await prisma.bin.count({ where: { status: "ACTIVE_BOUND" } });
  console.log("Active bound bins:", activeBoundBins);

  console.log("\n=== 2. ANALISIS FASILITAS (FACILITY) ===");
  const totalFacilities = await prisma.facility.count();
  console.log("Total facilities in DB:", totalFacilities);

  const facilitiesByJenis = await prisma.facility.groupBy({
    by: ["jenis"],
    _count: { id: true },
  });
  console.log("Facilities by jenis:", facilitiesByJenis);

  const facilitiesByApproval = await prisma.facility.groupBy({
    by: ["statusApproval"],
    _count: { id: true },
  });
  console.log("Facilities by statusApproval:", facilitiesByApproval);

  // Check what "Pemanfaatan Sampah" or "Analisis Projek" expects
  console.log("\n=== 3. ANALISIS SETORAN MANUAL & OTOMATIS ===");
  const manualCount = await prisma.setoranManual.count();
  const autoCount = await prisma.setoranOtomatis.count();
  console.log("Manual count:", manualCount, "Auto count:", autoCount);

  const totalManualWeight = await prisma.setoranManual.aggregate({ _sum: { berat: true } });
  const totalAutoWeight = await prisma.setoranOtomatis.aggregate({ _sum: { berat: true } });
  console.log("Total manual weight:", totalManualWeight._sum.berat);
  console.log("Total auto weight:", totalAutoWeight._sum.berat);

  const manualRows = await prisma.setoranManual.findMany({
    select: {
      id: true,
      berat: true,
      kategori: true,
      catatan: true,
      diinputOleh: true,
      createdAt: true,
      inputter: {
        select: { id: true, name: true, phone: true, isTestAccount: true, role: { select: { name: true } } },
      },
    },
    orderBy: { berat: "desc" },
    take: 10,
  });
  console.log("Top 10 manual setorans by weight:", JSON.stringify(manualRows, null, 2));

  const autoRows = await prisma.setoranOtomatis.findMany({
    select: {
      id: true,
      berat: true,
      hasilKlasifikasiAi: true,
      kategoriAktual: true,
      wargaId: true,
      createdAt: true,
      warga: {
        select: { id: true, name: true, isTestAccount: true, role: { select: { name: true } } },
      },
    },
    orderBy: { berat: "desc" },
    take: 10,
  });
  console.log("Top 10 auto setorans by weight:", JSON.stringify(autoRows, null, 2));

  // Category breakdown
  const manualByCat = await prisma.setoranManual.groupBy({
    by: ["kategori"],
    _sum: { berat: true },
    _count: { id: true },
  });
  console.log("Manual by kategori:", manualByCat);

  const autoByCat = await prisma.setoranOtomatis.groupBy({
    by: ["hasilKlasifikasiAi"],
    _sum: { berat: true },
    _count: { id: true },
  });
  console.log("Auto by hasilKlasifikasiAi:", autoByCat);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
