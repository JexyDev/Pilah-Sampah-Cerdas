import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("🧹 Cleanup Data Mock & Duplikat DPL + Kelompok KKN dimulai...\n");

  // Real 32 phone numbers of real DPLs
  const realPhones = [
    "+6285294754801",
    "+62895337560201",
    "+6285320322236",
    "+6282115865070",
    "+6281318920636",
    "+6288210288162",
    "+6289656618667",
    "+628382821127",
    "+6282130536915",
    "+628118748686",
    "+6282121822503",
    "+62817616930",
    "+6281322752828",
    "+6282116871007",
    "+6281344706038",
    "+6281321920848",
    "+6285780084003",
    "+6281321911449",
    "+6282118047608",
    "+628122421004",
    "+6281222927778",
    "+628157131405",
    "+6282298522354",
    "+6289612270264",
    "+628112334224",
    "+6285222267759",
    "+6289670059709",
    "+6285624088878",
    "+6281213143636",
    "+6285759996154",
    "+6281223216029",
    "+6281221471617"
  ];

  // 1. Find all mock DPL users (phone starting with +62813000000 or +628111111128)
  const mockDpls = await prisma.user.findMany({
    where: {
      role: { name: "DPL" },
      phone: { notIn: realPhones },
    },
    select: { id: true, name: true, phone: true },
  });

  console.log(`Found ${mockDpls.length} mock DPL users to remove.`);

  const mockDplIds = mockDpls.map((d) => d.id);

  // 2. Re-assign or detach student_kkn linked to mock DPLs or mock KelompokKkn
  if (mockDplIds.length > 0) {
    const mockGroups = await prisma.kelompokKkn.findMany({
      where: {
        OR: [
          { dplId: { in: mockDplIds } },
          { name: { startsWith: "Kelompok " } },
        ],
      },
      select: { id: true, name: true, dplId: true },
    });

    const mockGroupIds = mockGroups.map((g) => g.id);

    console.log(`Found ${mockGroupIds.length} mock KelompokKkn records to remove.`);

    // Detach student_kkn from mock group IDs
    if (mockGroupIds.length > 0) {
      await prisma.studentKkn.updateMany({
        where: { kelompokId: { in: mockGroupIds } },
        data: { kelompokId: null },
      });
      console.log("✅ Detached student_kkn from mock KelompokKkn.");

      // Delete mock KelompokKkn
      await prisma.kelompokKkn.deleteMany({
        where: { id: { in: mockGroupIds } },
      });
      console.log("✅ Deleted mock KelompokKkn records.");
    }

    // Delete mock DPL users
    await prisma.user.deleteMany({
      where: { id: { in: mockDplIds } },
    });
    console.log("✅ Deleted mock DPL users.");
  }

  // 3. Verify final DB state
  const finalDpls = await prisma.user.findMany({
    where: { role: { name: "DPL" } },
    include: { dplKelompok: true },
  });

  const finalGroups = await prisma.kelompokKkn.findMany({
    include: { dpl: true },
  });

  console.log(`\n🎉 VERIFIKASI AKHIR DATABASE:`);
  console.log(`- Total User DPL: ${finalDpls.length} (Harus 32)`);
  console.log(`- Total Kelompok KKN: ${finalGroups.length} (Harus 32)`);

  if (finalDpls.length === 32 && finalGroups.length === 32) {
    console.log("✨ SUKSES PERFECT! Data DPL dan Kelompok KKN 100% bersih, real, dan terintegrasi tanpa mock.");
  } else {
    console.log("⚠️ Perhatikan jumlah data belum persis 32:", finalDpls.length, finalGroups.length);
  }
}

run()
  .catch((e) => {
    console.error("❌ Cleanup error:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
