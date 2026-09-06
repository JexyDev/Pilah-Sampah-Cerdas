const fs = require('fs');
const path = require('path');
const dotenvPath = path.resolve('c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/main/apps/api/.env');
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

const prismaPath = path.resolve('c:/Users/USER/.gemini/antigravity-ide/scratch/berseka/main/node_modules/@prisma/client');
const { PrismaClient } = require(prismaPath);
const prisma = new PrismaClient();

async function reconcile() {
  console.log('=== MEMULAI REKONSILIASI AKURASI DATA PRESENSI KKN ===\n');

  const attendances = await prisma.activityAttendance.findMany({
    include: {
      student: { select: { id: true, name: true, studentProfile: { select: { nim: true } } } },
      schedule: { select: { id: true, title: true } },
    },
    orderBy: { attendedAt: 'desc' },
  });

  console.log(`Total sesi presensi yang diperiksa: ${attendances.length}`);

  let correctedCount = 0;

  for (const att of attendances) {
    const jedaLogsArray = Array.isArray(att.jedaLogs) ? att.jedaLogs : [];
    if (jedaLogsArray.length === 0) continue;

    const lastLog = jedaLogsArray[jedaLogsArray.length - 1];
    const isUnresumedJeda = lastLog && lastLog.waktuJeda && !lastLog.waktuResume;

    if (isUnresumedJeda) {
      const correctMins = Number(lastLog.durasiSebelumJedaMenit) || 0;
      const currentMins = att.actualInZoneMinutes ?? 0;

      // Jika ada anomali durasi yang membengkak padahal dijeda
      if (currentMins > correctMins || (att.status === 'HADIR_MEMENUHI' && correctMins < 240)) {
        const correctStatus = correctMins >= 240 ? 'HADIR_MEMENUHI' : 'HADIR_TIDAK_MEMENUHI';

        console.log(`\n[KOREKSI] Mahasiswa: ${att.student?.name} (${att.student?.studentProfile?.nim})`);
        console.log(`  ID Presensi: ${att.id}`);
        console.log(`  Alasan Jeda: "${lastLog.alasan}"`);
        console.log(`  Durasi Sebelumnya: ${currentMins} Menit (${att.status})`);
        console.log(`  Durasi Dikoreksi : ${correctMins} Menit (${correctStatus})`);

        await prisma.activityAttendance.update({
          where: { id: att.id },
          data: {
            actualInZoneMinutes: correctMins,
            status: correctStatus,
          },
        });

        correctedCount++;
      }
    }
  }

  console.log(`\n=== REKONSILIASI SELESAI ===`);
  console.log(`Total sesi yang dikoreksi: ${correctedCount}`);
}

reconcile()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
