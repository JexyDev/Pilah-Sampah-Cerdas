import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 CLEANING UP DUPLICATE LURAH & OFFICIAL ACCOUNTS IN REAL DATABASE...");

  const OFFICIAL_STAKEHOLDERS = [
    { role: "ADMIN_DLH", name: "Darto, A.P., M.M." },
    { role: "CAMAT", name: "Ratna Rahayu Pitriyati, S.STP., M.Si." },
    { role: "LURAH", name: "Ida, A.KS." },
    { role: "LURAH", name: "Jusni Giri Susilowati, S.Sos., M.Si." },
    { role: "LURAH", name: "Usman Adireja, S.Sos." },
    { role: "LURAH", name: "Budi Rukmana, S.Sos., M.Si." },
    { role: "LURAH", name: "Leny Mariana, S.Sos., M.AP." },
    { role: "LURAH", name: "Tirta Gumelar, S.STP." },
    { role: "PEMIMPIN", name: "Prof. Dr. Ir. H. Eddy Soeryanto Soegoto, M.T." },
    { role: "PANITIA_TASKFORCE", name: "Task Force" },
  ];

  for (const st of OFFICIAL_STAKEHOLDERS) {
    const matchingRole = await prisma.role.findFirst({ where: { name: st.role } });
    if (!matchingRole) continue;

    // Find accounts matching name exactly
    const validAccs = await prisma.user.findMany({
      where: { roleId: matchingRole.id, name: st.name },
      orderBy: { createdAt: "desc" },
    });

    if (validAccs.length > 1) {
      // Keep the first one, delete rest
      const [keep, ...remove] = validAccs;
      for (const rem of remove) {
        await prisma.user.delete({ where: { id: rem.id } }).catch(() => {});
      }
    }

    // Delete outdated dummy accounts with different names for DLH, CAMAT, PEMIMPIN, PANITIA_TASKFORCE
    if (st.role !== "LURAH") {
      const dummies = await prisma.user.findMany({
        where: { roleId: matchingRole.id, NOT: { name: st.name } },
      });
      for (const d of dummies) {
        await prisma.user.delete({ where: { id: d.id } }).catch(() => {});
      }
    }
  }

  // Delete legacy Lurah accounts that don't match the 6 official names
  const lurahRole = await prisma.role.findFirst({ where: { name: "LURAH" } });
  if (lurahRole) {
    const officialLurahNames = [
      "Ida, A.KS.",
      "Jusni Giri Susilowati, S.Sos., M.Si.",
      "Usman Adireja, S.Sos.",
      "Budi Rukmana, S.Sos., M.Si.",
      "Leny Mariana, S.Sos., M.AP.",
      "Tirta Gumelar, S.STP.",
    ];

    const legacyLurahs = await prisma.user.findMany({
      where: {
        roleId: lurahRole.id,
        NOT: { name: { in: officialLurahNames } },
      },
    });

    for (const d of legacyLurahs) {
      await prisma.user.delete({ where: { id: d.id } }).catch(() => {});
    }
  }

  console.log("✅ DUP & LEGACY OFFICIALS CLEANED UP!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
