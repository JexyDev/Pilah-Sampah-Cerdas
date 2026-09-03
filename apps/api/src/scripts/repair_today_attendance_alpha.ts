/**
 * Script Pemulihan Data Absensi Mahasiswa KKN (Perbaikan Bug Jam 16:00)
 *
 * Mengidentifikasi record kehadiran (ActivityAttendance) yang seharusnya hadir/berlangsung
 * namun berubah menjadi ALPA karena bug pemotongan paksa pada jam 16:00.
 *
 * Menyesuaikan statusnya menjadi HADIR_MEMENUHI (Hadir) dengan durasi kerja yang sah.
 *
 * Jalankan dengan:
 * npx tsx src/scripts/repair_today_attendance_alpha.ts
 */

import { prisma } from "../lib/prisma.js";

async function repairAttendanceAlpha() {
  console.log("=== Memulai Audit & Pemulihan Absensi KKN (Bug Alpha 16:00) ===");

  const now = new Date();
  const nowWib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const todayWibStr = nowWib.toISOString().slice(0, 10);
  const startOfDay = new Date(`${todayWibStr}T00:00:00+07:00`);
  const endOfDay = new Date(`${todayWibStr}T23:59:59.999+07:00`);

  console.log(`Rentang Tanggal Evaluasi (Hari ini WIB): ${todayWibStr}`);

  // Cari record kehadiran hari ini dengan status ALPA / ALPHA tapi mahasiswa sebenarnya sudah absen
  const erroneousAlpas = await prisma.activityAttendance.findMany({
    where: {
      attendedAt: { gte: startOfDay, lte: endOfDay },
      status: { in: ["ALPA", "ALPHA"] },
    },
    include: {
      student: { select: { id: true, name: true, phone: true } },
      schedule: true,
    },
  });

  console.log(`Ditemukan ${erroneousAlpas.length} record berstatus ALPA hari ini.`);

  let repairedCount = 0;
  for (const att of erroneousAlpas) {
    // Cek apakah mahasiswa ini memiliki jejak lokasi GPS hari ini
    const locCount = await prisma.studentLocation.count({
      where: {
        studentId: att.studentId,
        recordedAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    const isGenuineAttendance =
      locCount > 0 ||
      att.method !== "ALPA_AUTO" ||
      (att.actualInZoneMinutes !== null && att.actualInZoneMinutes > 0);

    if (isGenuineAttendance) {
      console.log(
        `[Memulihkan] Mahasiswa ${att.student.name} (${att.studentId}) pada jadwal "${att.schedule?.title || att.scheduleId}" (GPS pings: ${locCount})`
      );

      const resolvedMinutes = Math.max(att.actualInZoneMinutes || 0, 240);
      const checkoutTime = att.checkOutAt || new Date(`${todayWibStr}T18:00:00+07:00`);

      await prisma.activityAttendance.update({
        where: { id: att.id },
        data: {
          status: "HADIR_MEMENUHI",
          actualInZoneMinutes: resolvedMinutes,
          checkOutAt: checkoutTime,
          deskripsiKegiatan:
            (att.deskripsiKegiatan || "") +
            " [Dipulihkan Sistem: Presensi sah, diselesaikan otomatis jam 18:00 WIB]",
        },
      });

      repairedCount++;
    } else {
      console.log(
        `[Skip] Mahasiswa ${att.student.name} (${att.studentId}) memang tidak ada aktivitas hari ini (Alpa murni).`
      );
    }
  }

  console.log(`=== Selesai. Total data dipulihkan: ${repairedCount} mahasiswa ===`);
}

repairAttendanceAlpha()
  .catch((err) => {
    console.error("Error menjalankan repair script:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
