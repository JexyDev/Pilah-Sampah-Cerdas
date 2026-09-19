/**
 * Migration: Recalculate subtotalDpl - Formula 6 Aspek DPL (K-01 Fix)
 *
 * Formula lama: 5 aspek - Kontribusi 20%, LaporanAkhir TIDAK dihitung
 * Formula baru: 6 aspek selaras frontend:
 *   Perencanaan 20%, Kontribusi 10%, Logbook 20%, Analisis 20%, Output 20%, LaporanAkhir 10%
 *
 * CARA PAKAI:
 *   DRY RUN (aman):  DRY_RUN=true  npx ts-node --esm scripts/migrate-recalculate-subtotal-dpl.ts
 *   REAL EXECUTION:  DRY_RUN=false npx ts-node --esm scripts/migrate-recalculate-subtotal-dpl.ts
 *
 * WAJIB backup DB sebelum DRY_RUN=false. DILARANG di VPS / NODE_ENV=production.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// VPS Safety Guard
const DB_URL: string = process.env.DATABASE_URL || "";
const IS_PRODUCTION: boolean = process.env.NODE_ENV === "production";
if (IS_PRODUCTION || DB_URL.includes("157.10.252.252")) {
  console.error("[SAFETY GUARD] DILARANG dijalankan di VPS / NODE_ENV=production!");
  process.exit(1);
}

const IS_DRY_RUN: boolean = process.env.DRY_RUN !== "false"; // Default: DRY RUN

/** Formula helper: (skor * bobot) / 100, di-clamp antara 0-100 */
function calcAspect(score: number, weight: number): number {
  const safe = Math.max(0, Math.min(100, Number(score) || 0));
  return Number(((safe * weight) / 100).toFixed(2));
}

/** Formula 6 aspek DPL baru (K-01 fix) */
function calcNewSubtotalDpl(r: {
  skorDplPerencanaan: number;
  skorDplKontribusi: number;
  skorDplLogbook: number;
  skorDplAnalisis: number;
  skorDplOutput: number;
  skorDplLaporanAkhir: number;
}): number {
  return Number(
    (
      calcAspect(r.skorDplPerencanaan, 20) +
      calcAspect(r.skorDplKontribusi, 10) + // BERUBAH: 20 -> 10
      calcAspect(r.skorDplLogbook, 20) +
      calcAspect(r.skorDplAnalisis, 20) +
      calcAspect(r.skorDplOutput, 20) +
      calcAspect(r.skorDplLaporanAkhir, 10) // BARU: 0 -> 10
    ).toFixed(2)
  );
}

const SEP = "=".repeat(62);

async function main(): Promise<void> {
  console.log(SEP);
  console.log("MIGRATION: Recalculate subtotalDpl - 6 Aspek DPL");
  console.log("Mode : " + (IS_DRY_RUN ? "DRY RUN (tidak ada update)" : "REAL EXECUTION"));
  console.log(SEP);

  if (!IS_DRY_RUN) {
    console.log("REAL MODE! Backup DB sudah dilakukan? Lanjut dalam 3 detik...");
    await new Promise<void>((resolve) => setTimeout(resolve, 3000));
  }

  const records = await prisma.penilaianKknMahasiswa.findMany({
    where: {
      OR: [
        { skorDplPerencanaan:  { gt: 0 } },
        { skorDplKontribusi:   { gt: 0 } },
        { skorDplLogbook:      { gt: 0 } },
        { skorDplAnalisis:     { gt: 0 } },
        { skorDplOutput:       { gt: 0 } },
        { skorDplLaporanAkhir: { gt: 0 } },
      ],
    },
    include: {
      student: {
        select: {
          name: true,
          studentProfile: { select: { nim: true } },
        },
      },
    },
  });

  console.log("\nDitemukan " + records.length + " record penilaian DPL.\n");

  let changed  = 0;
  let noChange = 0;
  let errors   = 0;

  type AuditRow = {
    NIM: string;
    Nama: string;
    "DPL Lama": number;
    "DPL Baru": number;
    Delta: string;
    "NA Lama": number;
    "NA Baru": number;
  };
  const auditLog: AuditRow[] = [];

  for (const r of records) {
    try {
      const oldDpl   = Number(r.subtotalDpl);

      // GUARD: Jika semua aspek DPL = 0, record ini diisi langsung (direct entry)
      // dan tidak bisa di-recalculate dari aspek. Skip untuk keamanan.
      const allAspectsZero =
        r.skorDplPerencanaan === 0 && r.skorDplKontribusi === 0 &&
        r.skorDplLogbook === 0 && r.skorDplAnalisis === 0 &&
        r.skorDplOutput === 0 && r.skorDplLaporanAkhir === 0;
      if (allAspectsZero) {
        noChange++;
        console.log("  SKIP   " + r.studentId.substring(0, 8) + " | subtotalDpl: " + oldDpl + " (direct entry, semua aspek=0, tidak di-recalculate)");
        continue;
      }

      const subMitra = Number(r.subtotalMitra);

      const newDpl = calcNewSubtotalDpl({
        skorDplPerencanaan:  r.skorDplPerencanaan,
        skorDplKontribusi:   r.skorDplKontribusi,
        skorDplLogbook:      r.skorDplLogbook,
        skorDplAnalisis:     r.skorDplAnalisis,
        skorDplOutput:       r.skorDplOutput,
        skorDplLaporanAkhir: r.skorDplLaporanAkhir,
      });

      const delta = Number((newDpl - oldDpl).toFixed(2));
      const oldNA = Number(r.nilaiAkhir);
      const newNA =
        subMitra > 0 && newDpl > 0
          ? Number((newDpl * 0.5 + subMitra * 0.5).toFixed(2))
          : oldNA;

      const student = r.student as { name?: string; studentProfile?: { nim?: string } | null } | null;
      const nim  = student?.studentProfile?.nim || r.studentId.substring(0, 8);
      const name = student?.name || "-";

      if (Math.abs(delta) < 0.01) {
        noChange++;
        console.log("  OK    " + nim + " | subtotalDpl: " + oldDpl + " (tidak berubah)");
        continue;
      }

      changed++;
      const sign = delta > 0 ? "+" : "";
      auditLog.push({
        NIM: nim,
        Nama: name.substring(0, 22),
        "DPL Lama": oldDpl,
        "DPL Baru": newDpl,
        Delta: sign + delta,
        "NA Lama": oldNA,
        "NA Baru": newNA,
      });

      console.log(
        "  UBAH  " + nim + " | " + name.padEnd(22) +
        " | DPL: " + oldDpl + " -> " + newDpl +
        " (" + sign + delta + ")" +
        " | NA: " + oldNA + " -> " + newNA
      );

      if (!IS_DRY_RUN) {
        await prisma.penilaianKknMahasiswa.update({
          where: { studentId: r.studentId },
          data: { subtotalDpl: newDpl, nilaiAkhir: newNA },
        });
      }
    } catch (err: unknown) {
      errors++;
      console.error("  ERROR " + r.studentId + ":", (err as Error).message);
    }
  }

  console.log("\n" + SEP);
  console.log("RINGKASAN");
  console.log("  Total diperiksa  : " + records.length);
  console.log("  Perlu diupdate   : " + changed);
  console.log("  Tidak berubah    : " + noChange);
  console.log("  Error            : " + errors);
  console.log(
    "  Mode             : " +
      (IS_DRY_RUN ? "DRY RUN - tidak ada yg diupdate" : "REAL - DB sudah diupdate")
  );
  console.log(SEP);

  if (IS_DRY_RUN && auditLog.length > 0) {
    console.log("\nAUDIT LOG (record yang akan berubah jika DRY_RUN=false):");
    console.table(auditLog);
    console.log("\nJalankan DRY_RUN=false untuk eksekusi " + changed + " update ke DB.\n");
  }
}

main()
  .catch((e: unknown) => {
    console.error("[FATAL ERROR]", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
