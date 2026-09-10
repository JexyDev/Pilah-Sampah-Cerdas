/**
 * Script: sync-student-sks.ts
 * Purpose: Idempotent synchronization of SKS conversion data for 534 Mahasiswa KKN.
 * Safety: Protected by vpsSafetyGuard, supports --dry-run (default) and --commit.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { assertNotProduction } from '../src/utils/vpsSafetyGuard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

function cleanText(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .trim();
}

function normalizePhone(phoneRaw: any): string {
  let cleaned = cleanText(phoneRaw).replace(/[\s\-\.\(\)]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+62')) return cleaned;
  if (cleaned.startsWith('62')) return '+' + cleaned;
  if (cleaned.startsWith('0')) return '+62' + cleaned.slice(1);
  if (cleaned.startsWith('8')) return '+62' + cleaned;
  return '+' + cleaned;
}

interface StudentSksRecord {
  kelompok: string;
  rw: string;
  nama: string;
  nim: string;
  phone: string;
  sks: number | null;
}

async function main() {
  assertNotProduction('sync-student-sks.ts');

  const args = process.argv.slice(2);
  const isCommit = args.includes('--commit');

  console.log('===============================================================');
  console.log('🔄 SINKRONISASI DATA BEBAN SKS MAHASISWA KKN BERSEKA');
  console.log(`MODE: ${isCommit ? '⚡ COMMIT (Database akan diupdate)' : '🔍 DRY-RUN (Hanya simulasi)'}`);
  console.log('===============================================================\n');

  const jsonPath = path.resolve(__dirname, 'data_sks_mahasiswa.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File data tidak ditemukan di: ${jsonPath}`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(jsonPath, 'utf8');
  const records: StudentSksRecord[] = JSON.parse(rawJson);
  console.log(`📂 Berhasil membaca ${records.length} data mahasiswa dari file JSON.\n`);

  let matchedByNim = 0;
  let matchedByPhone = 0;
  let matchedByName = 0;
  let unmatchedCount = 0;
  const unmatchedList: any[] = [];
  const updatedRecords: Array<{ id: string; nim: string; nama: string; sks: number; matchType: string }> = [];

  const sksDistribution: Record<string, number> = {};

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const nimClean = cleanText(r.nim);
    const phoneNorm = normalizePhone(r.phone);
    const namaClean = cleanText(r.nama);
    const sksValue = r.sks && r.sks > 0 ? r.sks : 0;

    let targetStudent: any = null;
    let matchType = '';

    // 1. Match by NIM
    if (nimClean) {
      targetStudent = await prisma.studentKkn.findFirst({
        where: { nim: nimClean },
        include: { user: true, kelompok: true },
      });
      if (targetStudent) {
        matchType = 'NIM';
        matchedByNim++;
      }
    }

    // 2. Fallback Match by Phone
    if (!targetStudent && phoneNorm) {
      targetStudent = await prisma.studentKkn.findFirst({
        where: {
          OR: [
            { noWa: phoneNorm },
            { user: { phone: phoneNorm } },
          ],
        },
        include: { user: true, kelompok: true },
      });
      if (targetStudent) {
        matchType = 'PHONE';
        matchedByPhone++;
      }
    }

    // 3. Fallback Match by Name
    if (!targetStudent && namaClean) {
      targetStudent = await prisma.studentKkn.findFirst({
        where: {
          user: {
            name: { equals: namaClean, mode: 'insensitive' },
          },
        },
        include: { user: true, kelompok: true },
      });
      if (targetStudent) {
        matchType = 'NAME';
        matchedByName++;
      }
    }

    if (targetStudent) {
      const sksLabel = sksValue > 0 ? `${sksValue} SKS` : 'Reguler (0 SKS)';
      sksDistribution[sksLabel] = (sksDistribution[sksLabel] || 0) + 1;

      updatedRecords.push({
        id: targetStudent.id,
        nim: targetStudent.nim || nimClean,
        nama: targetStudent.user?.name || namaClean,
        sks: sksValue,
        matchType,
      });

      if (isCommit) {
        await prisma.studentKkn.update({
          where: { id: targetStudent.id },
          data: {
            sks: sksValue,
            // Jika pencocokan via phone/nama dan NIM di DB berbeda/kosong, perbarui juga NIM agar sinkron
            ...(matchType !== 'NIM' && nimClean ? { nim: nimClean } : {}),
          },
        });
      }
    } else {
      unmatchedCount++;
      unmatchedList.push(r);
    }
  }

  console.log('---------------------------------------------------------------');
  console.log('📊 HASIL REKONSILIASI PENCOCOKAN:');
  console.log(` • Cocok via NIM Eksak          : ${matchedByNim} Mahasiswa`);
  console.log(` • Cocok via No. Telepon        : ${matchedByPhone} Mahasiswa`);
  console.log(` • Cocok via Nama Lengkap       : ${matchedByName} Mahasiswa`);
  console.log(` • Total Berhasil Dicocokkan    : ${updatedRecords.length} dari ${records.length} Mahasiswa`);
  console.log(` • Tidak Ditemukan              : ${unmatchedCount} Mahasiswa`);
  console.log('---------------------------------------------------------------');

  if (unmatchedList.length > 0) {
    console.log('\n⚠️ Daftar Mahasiswa Tidak Ditemukan:');
    unmatchedList.forEach((u, idx) => {
      console.log(`  ${idx + 1}. [${u.kelompok}] ${u.nama} (NIM: ${u.nim}, HP: ${u.phone})`);
    });
  }

  console.log('\n📈 Distribusi SKS yang Disinkronkan:');
  Object.entries(sksDistribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([label, count]) => {
      const pct = Math.round((count / updatedRecords.length) * 100);
      console.log(` • ${label.padEnd(20)}: ${String(count).padStart(3)} Mahasiswa (${pct}%)`);
    });

  if (isCommit) {
    console.log('\n✅ SUKSES: Seluruh data SKS mahasiswa berhasil diperbarui di database!');
  } else {
    console.log('\nℹ️ INFO: Skrip dijalankan dalam mode DRY-RUN.');
    console.log('Untuk menerapkan perubahan ke database, jalankan:');
    console.log('npx tsx apps/api/scripts/sync-student-sks.ts --commit');
  }
}

main()
  .catch((err) => {
    console.error('❌ Error saat menjalankan sinkronisasi:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
