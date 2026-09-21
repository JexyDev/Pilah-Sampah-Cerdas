/**
 * Migration Script: Perbaikan Data Historis Presensi & Penarikan Poin Durasi Tidak Sah
 * Follow-up BUG-1 Auto-Checkout Fix (Commit 9d96c037)
 * Proyek: BERSEKA
 *
 * CARA PENGGUNAAN:
 *   DRY-RUN (Simulasi murni, 0 mutasi):
 *     npx tsx scripts/migrate-historical-presensi-durasi.ts
 *     atau
 *     DRY_RUN=true npx tsx scripts/migrate-historical-presensi-durasi.ts
 *
 *   REAL EXECUTION (Menjalankan update ke database):
 *     DRY_RUN=false npx tsx scripts/migrate-historical-presensi-durasi.ts --commit
 */

import { PrismaClient } from "@prisma/client";
import { getScheduleTargetDurationMinutes } from "../src/services/kknAttendanceService.js";

const prisma = new PrismaClient();

// Mode Execution
const args = process.argv.slice(2);
const isCommitRequested = args.includes("--commit");
const isDryRunEnv = process.env.DRY_RUN === "false" ? false : true;
const IS_DRY_RUN = !isCommitRequested || isDryRunEnv;

// Safety Guard: Perlindungan Database Produksi Lokal
const DB_URL: string = process.env.DATABASE_URL || "";
const IS_PRODUCTION: boolean = process.env.NODE_ENV === "production";
if (IS_PRODUCTION && IS_DRY_RUN === false && process.env.FORCE_ALLOW_VPS_MUTATION !== "I_UNDERSTAND_THE_RISKS_OVERWRITE_VPS") {
  console.error("⛔ [VPS SAFETY GUARD] Eksekusi langsung ke VPS tanpa orchestrator / golden backup DILARANG!");
  console.error("Gunakan runner: node scripts/vps/migrate_historical_presensi_durasi_vps.cjs --commit");
  process.exit(1);
}

export function calculateRealDuration(
  attendedAt: Date,
  checkOutAt: Date,
  jedaLogs: any
): { durasiKasar: number; totalJedaMenit: number; durasiRiil: number } {
  const startMs = new Date(attendedAt).getTime();
  const endMs = new Date(checkOutAt).getTime();
  const durasiKasar = Math.max(0, Math.floor((endMs - startMs) / 60000));

  let totalJedaMs = 0;
  const jedaLogsArr = Array.isArray(jedaLogs) ? jedaLogs : [];
  for (const j of jedaLogsArr) {
    if (j && j.waktuJeda && j.waktuResume) {
      const jStart = new Date(j.waktuJeda).getTime();
      const jEnd = new Date(j.waktuResume).getTime();
      if (jEnd > jStart) {
        totalJedaMs += jEnd - jStart;
      }
    }
  }
  const totalJedaMenit = Math.floor(totalJedaMs / 60000);
  let durasiRiil = durasiKasar - totalJedaMenit;
  durasiRiil = Math.min(480, Math.max(0, durasiRiil));

  return { durasiKasar, totalJedaMenit, durasiRiil };
}

export async function runMigration(options: { dryRun?: boolean } = {}) {
  const dryRun = options.dryRun !== undefined ? options.dryRun : IS_DRY_RUN;

  console.log("================================================================================");
  console.log("  MIGRATION: PERBAIKAN DATA HISTORIS PRESENSI & PENARIKAN POIN DURASI");
  console.log(`  MODE     : ${dryRun ? "🛡️ DRY-RUN (SIMULASI MURNI - TIDAK ADA UPDATE DB)" : "🚨 REAL COMMIT (DATA AKAN DIUBAH)"}`);
  console.log("================================================================================\n");

  const scheduleCache = new Map<string, number>();
  async function getTarget(schedule: any): Promise<number> {
    if (!schedule) return 240;
    if (scheduleCache.has(schedule.id)) return scheduleCache.get(schedule.id)!;
    let t = 240;
    try {
      t = await getScheduleTargetDurationMinutes(schedule);
    } catch {
      t = 240;
    }
    scheduleCache.set(schedule.id, t);
    return t;
  }

  // 1. Scan semua record kandidat
  const records = await prisma.activityAttendance.findMany({
    where: {
      status: "HADIR_MEMENUHI",
      checkOutAt: { not: null },
      method: { notIn: ["OVERRIDE_DPL", "IZIN_DPL"] },
    },
    include: {
      schedule: true,
      student: {
        select: {
          id: true,
          name: true,
          studentProfile: { select: { nim: true } },
        },
      },
    },
    orderBy: { attendedAt: "asc" },
  });

  console.log(`Total sesi presensi selesai berstatus HADIR_MEMENUHI: ${records.length}`);

  let affectedCount = 0;
  let okCount = 0;
  let totalPointsRetracted = 0;
  const affectedList: any[] = [];

  for (const rec of records) {
    if (!rec.attendedAt || !rec.checkOutAt) continue;

    const { durasiKasar, totalJedaMenit, durasiRiil } = calculateRealDuration(
      rec.attendedAt,
      rec.checkOutAt,
      rec.jedaLogs
    );

    const target = await getTarget(rec.schedule);

    if (durasiRiil < target) {
      affectedCount++;

      // Tanggal kegiatan dalam WIB
      const actDateWib = new Date(rec.attendedAt.getTime() + 7 * 3600000);
      const actDateStr = actDateWib.toISOString().slice(0, 10);
      const startOfDay = new Date(`${actDateStr}T00:00:00+07:00`);
      const endOfDay = new Date(`${actDateStr}T23:59:59.999+07:00`);

      // Cari transaksi poin durasi +3 pada tanggal tersebut
      const relatedPoints = await prisma.pointHistory.findMany({
        where: {
          userId: rec.studentId,
          kategori: "KKN_DURASI_MEMENUHI",
          points: 3,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      });

      const matchedPoint = relatedPoints.length > 0 ? relatedPoints[0] : null;
      const pointsToDeduct = matchedPoint ? matchedPoint.points : 0;

      affectedList.push({
        id: rec.id,
        studentName: rec.student?.name || "Unknown",
        nim: rec.student?.studentProfile?.nim || "-",
        scheduleTitle: rec.schedule?.title || rec.scheduleId,
        dateStr: actDateStr,
        durasiLama: rec.actualInZoneMinutes,
        durasiRiil,
        target,
        statusLama: rec.status,
        statusBaru: "HADIR_TIDAK_MEMENUHI",
        pointId: matchedPoint?.id || null,
        poinDitarik: pointsToDeduct,
      });

      console.log(`[Migration] ${rec.student?.name} (${rec.student?.studentProfile?.nim}): ${rec.actualInZoneMinutes} menit -> ${durasiRiil} menit (target ${target} mnt)`);
      console.log(`            Tanggal: ${actDateStr} | Status: ${rec.status} -> HADIR_TIDAK_MEMENUHI`);
      console.log(`            Poin ditarik: ${pointsToDeduct > 0 ? `Ya (-${pointsToDeduct} PTS, PointId: ${matchedPoint?.id})` : "Tidak ada poin tercatat"}`);

      // Eksekusi mutasi jika bukan dry-run
      if (!dryRun) {
        await prisma.$transaction(async (tx) => {
          // Update ActivityAttendance
          await tx.activityAttendance.update({
            where: { id: rec.id },
            data: {
              actualInZoneMinutes: durasiRiil,
              status: "HADIR_TIDAK_MEMENUHI",
            },
          });

          // Retract PointHistory
          if (matchedPoint) {
            await tx.pointHistory.update({
              where: { id: matchedPoint.id },
              data: {
                points: 0,
                description: `${matchedPoint.description} [DIKOREKSI_MIGRATION_DURASI_TIDAK_MEMENUHI]`,
              },
            });
          }
        });
        totalPointsRetracted += pointsToDeduct;
      } else {
        totalPointsRetracted += pointsToDeduct;
      }
    } else {
      okCount++;
    }
  }

  console.log("\n================================================================================");
  console.log("  HASIL REKAPITULASI MIGRASI PRESENSI");
  console.log("================================================================================");
  console.log(`Total sesi presensi diperiksa : ${records.length}`);
  console.log(`Sesi sah & memenuhi target    : ${okCount} (Aman / Tidak disentuh)`);
  console.log(`Sesi terdampak & dikoreksi    : ${affectedCount}`);
  console.log(`Total poin durasi ditarik     : -${totalPointsRetracted} PTS`);
  console.log(`Status eksekusi               : ${dryRun ? "SIMULASI BERHASIL (Database tetap utuh)" : "DATABASE BERHASIL DI-UPDATE DENGAN AMAN"}`);
  console.log("================================================================================\n");

  return {
    totalChecked: records.length,
    okCount,
    affectedCount,
    totalPointsRetracted,
    affectedList,
  };
}

// Eksekusi saat dipanggil langsung via CLI
if (process.argv[1]?.endsWith("migrate-historical-presensi-durasi.ts")) {
  runMigration()
    .catch((err) => {
      console.error("Migration error:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
