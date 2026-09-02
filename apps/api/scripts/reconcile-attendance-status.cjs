/**
 * Script: Rekonsiliasi Status Kehadiran & Durasi Aktual Presensi KKN
 * Proyek: BERSEKA
 * 
 * Menyelaraskan seluruh data historis presensi di database:
 * - Jika status HADIR_MEMENUHI tetapi durasi aktual < target (default 240 menit) -> ubah ke HADIR_TIDAK_MEMENUHI.
 * - Jika status HADIR_TIDAK_MEMENUHI tetapi durasi aktual >= target -> ubah ke HADIR_MEMENUHI.
 * - Jika sesi terjeda tidak pernah di-resume dan durasi membengkak -> sesuaikan ke durasi sebelum jeda.
 */

const fs = require('fs');
const path = require('path');

const dotenvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(dotenvPath)) {
  const lines = fs.readFileSync(dotenvPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      process.env[key] = val;
    }
  }
}

let PrismaClient;
try {
  PrismaClient = require('@prisma/client').PrismaClient;
} catch {
  const prismaPath = path.resolve(__dirname, '../../../node_modules/@prisma/client');
  PrismaClient = require(prismaPath).PrismaClient;
}
const prisma = new PrismaClient();

async function reconcileAttendanceStatus() {
  console.log('================================================================');
  console.log('  AUDIT & REKONSILIASI STATUS KEHADIRAN KKN BERSEKA');
  console.log('================================================================\n');

  const attendances = await prisma.activityAttendance.findMany({
    include: {
      student: { select: { id: true, name: true, studentProfile: { select: { nim: true } } } },
      schedule: { select: { id: true, title: true, date: true } },
    },
    orderBy: { attendedAt: 'desc' },
  });

  console.log(`Total sesi presensi ditemukan: ${attendances.length}`);

  let correctedCount = 0;
  const targetMinMinutes = 240; // 4 Jam

  for (const att of attendances) {
    const st = String(att.status || '').toUpperCase();
    const jedaLogsArray = Array.isArray(att.jedaLogs) ? att.jedaLogs : [];
    let currentMins = att.actualInZoneMinutes ?? 0;
    let adjustedMins = currentMins;

    // 1. Cek anomali jeda tidak ter-resume
    if (jedaLogsArray.length > 0) {
      const lastLog = jedaLogsArray[jedaLogsArray.length - 1];
      const isUnresumedJeda = lastLog && lastLog.waktuJeda && !lastLog.waktuResume;
      if (isUnresumedJeda) {
        const correctMins = Number(lastLog.durasiSebelumJedaMenit) || 0;
        if (currentMins > correctMins) {
          adjustedMins = correctMins;
        }
      }
    }

    // 2. Evaluasi kesesuaian status terhadap durasi aktual
    let targetStatus = st;
    const isFinished = Boolean(att.checkOutAt) || ['HADIR_MEMENUHI', 'HADIR_TIDAK_MEMENUHI', 'HADIR', 'SELESAI', 'SELESAI_TELAT'].includes(st);

    if (isFinished && st !== 'SELESAI_TELAT') {
      if (adjustedMins >= targetMinMinutes) {
        targetStatus = 'HADIR_MEMENUHI';
      } else if (adjustedMins < targetMinMinutes) {
        targetStatus = 'HADIR_TIDAK_MEMENUHI';
      }
    }

    // 3. Update DB jika ada perbedaan status atau durasi
    if (st !== targetStatus || currentMins !== adjustedMins) {
      const dateStr = att.attendedAt ? new Date(att.attendedAt.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10) : '-';
      console.log(`\n[KOREKSI ANOMALI]`);
      console.log(`  Mahasiswa : ${att.student?.name} (${att.student?.studentProfile?.nim || '-'})`);
      console.log(`  Tanggal   : ${dateStr}`);
      console.log(`  Kegiatan  : ${att.schedule?.title || att.scheduleId}`);
      console.log(`  Sebelum   : Durasi ${currentMins} Menit, Status: ${st}`);
      console.log(`  Sesudah   : Durasi ${adjustedMins} Menit, Status: ${targetStatus}`);

      await prisma.activityAttendance.update({
        where: { id: att.id },
        data: {
          actualInZoneMinutes: adjustedMins,
          status: targetStatus,
        },
      });

      correctedCount++;
    }
  }

  console.log('\n================================================================');
  console.log(`  REKONSILIASI SELESAI: ${correctedCount} SESI TELAH DISINKRONKAN`);
  console.log('================================================================\n');
}

reconcileAttendanceStatus()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
