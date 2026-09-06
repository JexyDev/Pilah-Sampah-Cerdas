import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("=== BUKTI OTENTIK INTEGRASI DATABASE REAL (SQL/PRISMA QUERY) ===");

  const totalUsers = await prisma.user.count();
  const totalBins = await prisma.bin.count();
  const totalSetoranOtomatis = await prisma.setoranOtomatis.count();
  const totalSetoranManual = await prisma.setoranManual.count();
  const totalFacilities = await prisma.facility.count();
  const totalAuditTrail = await prisma.auditTrail.count();
  const totalRw = await prisma.rw.count();
  const totalKelurahan = await prisma.kelurahan.count();

  const sumOtomatis = await prisma.setoranOtomatis.aggregate({
    _sum: { berat: true },
  });
  const sumManual = await prisma.setoranManual.aggregate({
    _sum: { berat: true },
  });

  console.log("Kutipan Count & Aggregation Query DB Real:");
  console.log({
    totalUsers,
    totalBins,
    totalSetoranOtomatis,
    totalSetoranManual,
    totalFacilities,
    totalAuditTrail,
    totalRw,
    totalKelurahan,
    totalOtomatisKg: sumOtomatis._sum.berat ? Number(sumOtomatis._sum.berat) : 0,
    totalManualKg: sumManual._sum.berat ? Number(sumManual._sum.berat) : 0,
  });

  const recentAudit = await prisma.auditTrail.findMany({
    take: 3,
    orderBy: { timestamp: "desc" },
    select: { id: true, action: true, timestamp: true },
  });
  console.log("Kutipan Log Audit Trail Real dari Database:", JSON.stringify(recentAudit, null, 2));

  await prisma.$disconnect();
}

run().catch(console.error);
