/**
 * Cleanup Script: De-duplicate DPL Users and Kelompok KKN in PostgreSQL
 * Ensures EXACTLY 32 Real DPL Users and EXACTLY 32 Real Kelompok KKN with standardized names exist.
 */
import { PrismaClient } from "@prisma/client";
import { REAL_32_DPL_STANDARDIZED } from "./sync_real_dpl.js";

const prisma = new PrismaClient();

async function cleanup() {
  console.log("=== START CLEANUP DUPLICATE DPL & KELOMPOK (STANDARDIZED) ===");

  const validPhones = REAL_32_DPL_STANDARDIZED.map((item) => item.phone);
  const validKelompokNames = REAL_32_DPL_STANDARDIZED.map((item) => item.kelompok);

  // Delete all refresh tokens for stale DPL users
  const dplRole = await prisma.role.findUnique({ where: { name: "DPL" } });
  if (dplRole) {
    const allDpls = await prisma.user.findMany({
      where: { roleId: dplRole.id },
    });

    for (const u of allDpls) {
      if (!validPhones.includes(u.phone)) {
        await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
        await prisma.kelompokKkn.updateMany({
          where: { dplId: u.id },
          data: { dplId: null },
        });
        try {
          await prisma.user.delete({ where: { id: u.id } });
          console.log(`[DELETED STALE DPL USER] ${u.name} (${u.phone})`);
        } catch (err: any) {
          console.warn(`Could not delete user ${u.name}: ${err.message}`);
        }
      }
    }
  }

  // Delete any stale kelompok that does not match official 32 standardized names
  const allKelompoks = await prisma.kelompokKkn.findMany({
    include: { students: true },
  });

  for (const kel of allKelompoks) {
    if (!validKelompokNames.includes(kel.name)) {
      // Re-link students to official standardized kelompok if possible
      let targetName = "";
      const lower = kel.name.toLowerCase();

      for (const item of REAL_32_DPL_STANDARDIZED) {
        const offLower = item.kelompok.toLowerCase();
        if (
          lower.includes(offLower) ||
          offLower.includes(lower.replace(/kelompok\s*/gi, "").replace(/kel\s*/gi, "").trim())
        ) {
          targetName = item.kelompok;
          break;
        }
      }

      if (targetName) {
        const targetKel = await prisma.kelompokKkn.findFirst({ where: { name: targetName } });
        if (targetKel) {
          console.log(`Re-linking ${kel.students.length} students from "${kel.name}" to standardized "${targetName}"...`);
          for (const st of kel.students) {
            await prisma.studentKkn.update({
              where: { id: st.id },
              data: { kelompokId: targetKel.id },
            });
          }
        }
      }

      try {
        await prisma.kelompokKkn.delete({ where: { id: kel.id } });
        console.log(`[DELETED STALE KELOMPOK] ${kel.name}`);
      } catch (err: any) {
        console.warn(`Could not delete stale kelompok ${kel.name}: ${err.message}`);
      }
    }
  }

  const finalDpls = await prisma.user.count({ where: { role: { name: "DPL" } } });
  const finalKelompok = await prisma.kelompokKkn.count();

  console.log(`\n✅ CLEANUP COMPLETE!`);
  console.log(`Final DPL Users Count: ${finalDpls} (Expected: 32)`);
  console.log(`Final Kelompok KKN Count: ${finalKelompok} (Expected: 32)`);
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
