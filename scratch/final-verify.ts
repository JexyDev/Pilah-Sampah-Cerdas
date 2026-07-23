import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

console.log("=== VERIFIKASI FINAL DATABASE ===\n");

// 1. User counts by role
const usersByRole = await prisma.$queryRaw<any[]>`
  SELECT r.nama AS role_name, COUNT(u.id)::int AS total
  FROM pengguna u JOIN peran r ON u.id_peran = r.id
  GROUP BY r.nama ORDER BY total DESC
`;
console.log("--- Users per Role ---");
usersByRole.forEach((r: any) => console.log(`  ${r.role_name}: ${r.total}`));

// 2. UJI-prefixed users
const ujiUsers = await prisma.user.count({ where: { name: { startsWith: "UJI_" } } });
console.log(`\n--- UJI-prefixed users: ${ujiUsers} ---`);

// 3. Bin stats
const binStats = await prisma.$queryRaw<any[]>`
  SELECT status, COUNT(*)::int AS total FROM tong_sampah GROUP BY status ORDER BY total DESC
`;
console.log("\n--- Bin Status ---");
binStats.forEach((b: any) => console.log(`  ${b.status}: ${b.total}`));

// 4. WasteLog stats
const totalLogs = await prisma.wasteLog.count();
const logsWithAiAbove90 = await prisma.wasteLog.count({ where: { aiConfidence: { gte: 0.9 } } });
const logsWithAiBelow90 = await prisma.wasteLog.count({ where: { aiConfidence: { lt: 0.9 } } });
console.log(`\n--- WasteLog ---`);
console.log(`  Total: ${totalLogs}`);
console.log(`  AI confidence >= 90%: ${logsWithAiAbove90}`);
console.log(`  AI confidence < 90%: ${logsWithAiBelow90}`);

// 5. Fasilitas
const facilStats = await prisma.$queryRaw<any[]>`
  SELECT jenis, COUNT(*)::int AS total FROM fasilitas GROUP BY jenis ORDER BY total DESC
`;
console.log("\n--- Fasilitas per Jenis ---");
facilStats.forEach((f: any) => console.log(`  ${f.jenis}: ${f.total}`));

// 6. Ide daur ulang
const ideStats = await prisma.ideDaurUlang.groupBy({
  by: ["statusApproval"],
  _count: true,
});
console.log("\n--- Ide Daur Ulang ---");
ideStats.forEach((i: any) => console.log(`  ${i.statusApproval}: ${i._count}`));

// 7. Household count
const hhCount = await prisma.household.count();
console.log(`\n--- Household total: ${hhCount} ---`);

// 8. BinOwnership
const boCount = await prisma.binOwnership.count();
console.log(`--- BinOwnership total: ${boCount} ---`);

// 9. KKN students
const kknActive = await prisma.studentKkn.count({ where: { endDate: { gte: new Date() } } });
const kknExpired = await prisma.studentKkn.count({ where: { endDate: { lt: new Date() } } });
console.log(`\n--- Mahasiswa KKN ---`);
console.log(`  Aktif: ${kknActive}`);
console.log(`  Expired: ${kknExpired}`);

// 10. Petugas Residu
const petugasCount = await prisma.petugasResidu.count();
console.log(`\n--- Petugas Residu: ${petugasCount} ---`);

// 11. Points ledger
const pointsCount = await prisma.pointHistory.count();
console.log(`--- Riwayat Poin: ${pointsCount} entries ---`);

// 12. Sample 5 warga waste log count via household
console.log("\n--- Sample Warga (5) waste log count ---");
const sampleWarga = await prisma.user.findMany({
  where: { email: { contains: "uji.warga." } },
  take: 5,
  include: { households: { select: { id: true } } },
});
for (const w of sampleWarga) {
  const hhId = w.households[0]?.id;
  const logCount = hhId ? await prisma.wasteLog.count({ where: { householdId: hhId } }) : 0;
  console.log(`  ${w.name}: ${logCount} logs`);
}

// 13. Warga tanpa aktivitas (index 81-100)
const inactiveEmails = Array.from({ length: 20 }, (_, i) => `uji.warga.${String(i + 81).padStart(3, "0")}@uji-trashcare.id`);
const inactiveWarga = await prisma.user.findMany({
  where: { email: { in: inactiveEmails } },
  include: { households: { select: { id: true } } },
});
let inactiveWithLogs = 0;
for (const w of inactiveWarga) {
  const hhId = w.households[0]?.id;
  const c = hhId ? await prisma.wasteLog.count({ where: { householdId: hhId } }) : 0;
  if (c > 0) inactiveWithLogs++;
}
console.log(`\n--- Warga 81-100 (seharusnya 0 aktivitas): ${inactiveWithLogs}/${inactiveWarga.length} punya log ---`);

await prisma.$disconnect();
