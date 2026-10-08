import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const prisma = new PrismaClient();

async function main() {
  const isCommit = process.argv.includes("--commit");
  const targetNimArg = process.argv.find((arg) => arg.startsWith("--nim="))?.split("=")[1];

  console.log("================================================================================");
  console.log("      AUDIT & REKONSILIASI PRESENSI MANDIRI KE KEHADIRAN KEGIATAN KKN          ");
  console.log("================================================================================");
  console.log(`MODE: ${isCommit ? "🔥 COMMIT (MUTASI DB BERJALAN)" : "🛡️ DRY-RUN (HANYA SIMULASI & AUDIT)"}`);
  if (targetNimArg) {
    console.log(`TARGET NIM KHUSUS: ${targetNimArg}`);
  }
  console.log("--------------------------------------------------------------------------------\n");

  // 1. Ambil data presensi mandiri SELESAI yang durasinya > 0
  const allMandiri = await prisma.presensiMandiri.findMany({
    where: {
      status: "SELESAI",
      durasiMenit: { gt: 0 },
      ...(targetNimArg
        ? {
            student: {
              studentProfile: {
                nim: targetNimArg,
              },
            },
          }
        : {}),
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          studentProfile: {
            select: {
              nim: true,
              kelompokId: true,
              kelompok: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
    orderBy: { checkInAt: "asc" },
  });

  console.log(`Ditemukan total ${allMandiri.length} sesi Presensi Mandiri berstatus SELESAI.`);

  let reconciledCount = 0;
  let alreadySyncedCount = 0;
  let skippedNoScheduleCount = 0;

  for (const pm of allMandiri) {
    const student = pm.student;
    const nim = student?.studentProfile?.nim || "-";
    const nama = student?.name || "-";
    const kelompokId = pm.kelompokId || student?.studentProfile?.kelompokId;
    const kelompokNama = student?.studentProfile?.kelompok?.name || "-";

    const checkInDate = new Date(pm.checkInAt);
    const wibDate = new Date(checkInDate.getTime() + 7 * 60 * 60 * 1000);
    const dateKey = wibDate.toISOString().slice(0, 10);
    const dayStart = new Date(`${dateKey}T00:00:00+07:00`);
    const dayEnd = new Date(`${dateKey}T23:59:59.999+07:00`);
    const yesterdayStart = new Date(dayStart.getTime() - 24 * 60 * 60 * 1000);

    // 2. Cek apakah sudah ada rekaman di kehadiran_kegiatan pada tanggal WIB yang sama
    const existingAtt = await prisma.activityAttendance.findFirst({
      where: {
        studentId: pm.studentId,
        attendedAt: { gte: dayStart, lte: dayEnd },
        status: {
          in: [
            "HADIR_MEMENUHI",
            "HADIR_TIDAK_MEMENUHI",
            "BERLANGSUNG",
            "TERJEDA",
            "DALAM_RADIUS",
            "DI_ZONA",
          ],
        },
      },
    });

    if (existingAtt) {
      alreadySyncedCount++;
      continue;
    }

    // 3. Sesi ini stranded! Cari schedule yang cocok
    let matchedSchedule = await prisma.schedule.findFirst({
      where: {
        date: { gte: yesterdayStart, lte: dayEnd },
        isActive: true,
        ...(kelompokId ? { OR: [{ kelompokId }, { kelompokId: null }] } : {}),
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    if (!matchedSchedule && kelompokId) {
      matchedSchedule = await prisma.schedule.findFirst({
        where: {
          kelompokId,
          isActive: true,
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      });
    }

    if (!matchedSchedule) {
      console.warn(`[SKIP] Mahasiswa ${nama} (${nim}) - Tanggal ${dateKey}: Tidak ditemukan jadwal KKN yang cocok.`);
      skippedNoScheduleCount++;
      continue;
    }

    const durasiMenit = pm.durasiMenit || 0;
    const effectiveDurasi = Math.min(480, durasiMenit);
    const status = effectiveDurasi >= 240 ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI";
    const checkOutAt = pm.checkOutAt || new Date(checkInDate.getTime() + durasiMenit * 60000);

    console.log(
      `[${isCommit ? "SYNCED" : "DETECTED"}] NIM ${nim} | ${nama.padEnd(25)} | Tgl: ${dateKey} | Durasi: ${String(durasiMenit).padStart(3)}m (cap ${effectiveDurasi}m) | Kelompok: ${kelompokNama} | Jadwal: ${matchedSchedule.title}`
    );

    if (isCommit) {
      await prisma.activityAttendance.upsert({
        where: {
          studentId_scheduleId: {
            studentId: pm.studentId,
            scheduleId: matchedSchedule.id,
          },
        },
        update: {
          status,
          attendedAt: pm.checkInAt,
          checkOutAt,
          actualInZoneMinutes: effectiveDurasi,
          latitude: pm.latitude,
          longitude: pm.longitude,
          deskripsiKegiatan: pm.deskripsiKegiatan,
          fotoUrl: pm.fotoUrl,
          platformOs: pm.platformOs || "ANDROID",
          method: "GPS_MANDIRI_SYNC",
        },
        create: {
          studentId: pm.studentId,
          scheduleId: matchedSchedule.id,
          status,
          attendedAt: pm.checkInAt,
          checkOutAt,
          actualInZoneMinutes: effectiveDurasi,
          latitude: pm.latitude,
          longitude: pm.longitude,
          deskripsiKegiatan: pm.deskripsiKegiatan,
          fotoUrl: pm.fotoUrl,
          platformOs: pm.platformOs || "ANDROID",
          method: "GPS_MANDIRI_SYNC",
        },
      });
    }

    reconciledCount++;
  }

  console.log("\n================================================================================");
  console.log("                           RINGKASAN REKONSILIASI                               ");
  console.log("================================================================================");
  console.log(`Sudah Sinkron Sebelumnya : ${alreadySyncedCount} sesi`);
  console.log(`Berhasil Direkonsiliasi  : ${reconciledCount} sesi ${isCommit ? "(Tersimpan di DB)" : "(Dry-Run)"}`);
  console.log(`Dilewati (Tanpa Jadwal)  : ${skippedNoScheduleCount} sesi`);
  console.log("================================================================================\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error during reconciliation:", err);
  process.exit(1);
});
