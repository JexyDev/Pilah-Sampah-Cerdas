/**
 * Script: dedupe-rws.ts
 * Purpose: Consolidate duplicate RW entries per Kelurahan and re-link all child foreign keys.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting RW deduplication...");

  const allRws = await prisma.rw.findMany({
    include: {
      kelurahan: true,
    },
    orderBy: { id: "asc" },
  });

  console.log(`Total RW records found: ${allRws.length}`);

  // Group RWs by kelurahanId + normalized name (e.g. "RW 01")
  const groups: Record<string, typeof allRws> = {};

  for (const rw of allRws) {
    let cleanName = rw.name.replace(/\s*\([^)]*\)/g, "").trim();
    const match = cleanName.match(/^RW\s*(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      cleanName = `RW ${num.toString().padStart(2, "0")}`;
    }

    const key = `${rw.kelurahanId}::${cleanName}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push({ ...rw, cleanName });
  }

  let totalMerged = 0;

  for (const [key, rws] of Object.entries(groups)) {
    const cleanName = rws[0].cleanName;

    let targetRw = rws.find((r) => r.name === cleanName) || rws[0];
    const duplicateRws = rws.filter((r) => r.id !== targetRw.id);

    if (duplicateRws.length > 0) {
      console.log(
        `Found ${duplicateRws.length} duplicate(s) for [${targetRw.kelurahan.name} - ${cleanName}], keeping Primary ID: ${targetRw.id}`
      );

      for (const dup of duplicateRws) {
        console.log(`  Merging duplicate ID ${dup.id} ('${dup.name}') -> Target ID ${targetRw.id}...`);

        // Handle RT deduplication/re-linking
        const dupRts = await prisma.rt.findMany({ where: { rwId: dup.id } });
        const targetRts = await prisma.rt.findMany({ where: { rwId: targetRw.id } });

        for (const dupRt of dupRts) {
          const existingTargetRt = targetRts.find((tr) => tr.name === dupRt.name);
          if (existingTargetRt) {
            await prisma.user.updateMany({
              where: { rtId: dupRt.id },
              data: { rtId: existingTargetRt.id },
            });
            await prisma.rt.delete({ where: { id: dupRt.id } });
          } else {
            await prisma.rt.update({
              where: { id: dupRt.id },
              data: { rwId: targetRw.id },
            });
          }
        }

        // Re-link Users
        await prisma.user.updateMany({
          where: { rwId: dup.id },
          data: { rwId: targetRw.id },
        });

        // Re-link Bins
        await prisma.bin.updateMany({
          where: { rwId: dup.id },
          data: { rwId: targetRw.id },
        });

        // Re-link Facilities
        await prisma.facility.updateMany({
          where: { rwId: dup.id },
          data: { rwId: targetRw.id },
        });

        // Re-link StudentKkn (assignedRwId)
        await prisma.studentKkn.updateMany({
          where: { assignedRwId: dup.id },
          data: { assignedRwId: targetRw.id },
        });

        // Re-link Household
        await prisma.household.updateMany({
          where: { rwId: dup.id },
          data: { rwId: targetRw.id },
        });

        // Re-link SetoranManual
        await prisma.setoranManual.updateMany({
          where: { rwId: dup.id },
          data: { rwId: targetRw.id },
        });

        // Re-link KknHandoverHistory
        await prisma.kknHandoverHistory.updateMany({
          where: { rwId: dup.id },
          data: { rwId: targetRw.id },
        });

        // Clear petugasResiduId on dup if set
        if (dup.petugasResiduId) {
          await prisma.rw.update({
            where: { id: dup.id },
            data: { petugasResiduId: null },
          });
        }

        // Delete duplicate RW record
        await prisma.rw.delete({
          where: { id: dup.id },
        });

        totalMerged++;
      }
    }

    // Update target name to cleanName if needed
    if (targetRw.name !== cleanName) {
      await prisma.rw.update({
        where: { id: targetRw.id },
        data: { name: cleanName },
      });
      console.log(`Updated Target RW #${targetRw.id} name to '${cleanName}'`);
    }
  }

  console.log(`Deduplication finished successfully! Total duplicate RWs merged/removed: ${totalMerged}`);
}

main()
  .catch((e) => {
    console.error("Deduplication error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
