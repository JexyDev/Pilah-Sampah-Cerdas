import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

// Helper: Clean invisible/non-printable characters and trim
function cleanText(str: any): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .trim();
}

// Helper: Normalize phone number to +62 format
function normalizePhone(phoneRaw: any): string {
  let cleaned = cleanText(phoneRaw).replace(/[\s\-\.\(\)]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+62')) return cleaned;
  if (cleaned.startsWith('62')) return '+' + cleaned;
  if (cleaned.startsWith('0')) return '+62' + cleaned.slice(1);
  if (cleaned.startsWith('8')) return '+62' + cleaned;
  return '+' + cleaned;
}

// Helper: Parse RW string e.g. "RW 11, 12, dan 13" -> [11, 12, 13]
function parseRwString(rwRaw: string): number[] | null {
  const text = cleanText(rwRaw);
  if (!text) return null;
  const matches = text.match(/\d+/g);
  if (!matches || matches.length === 0) return null;
  const numbers = matches.map(n => parseInt(n, 10)).filter(n => !isNaN(n) && n > 0 && n < 100);
  if (numbers.length === 0) return null;
  return Array.from(new Set(numbers)).sort((a, b) => a - b);
}

export interface CleanedRow {
  rowNum: number;
  kelurahan: string;
  namaKelompok: string;
  lokasiRwRaw: string;
  rwList: number[];
  namaMahasiswa: string;
  phoneRaw: string;
  phoneNormalized: string;
  programStudi: string;
  dplNama: string;
  isKetua: boolean;
  nim?: string | null;
}

export interface SkippedRow {
  rowNum: number;
  namaMahasiswa: string;
  phone: string;
  reason: string;
  duplicateWith?: { rowNum: number; namaMahasiswa: string };
}

async function main() {
  const args = process.argv.slice(2);
  const filePathArg = args.find(a => !a.startsWith('--'));
  const isCommit = args.includes('--commit');

  if (!filePathArg) {
    console.error('❌ Error: Path file Excel belum ditentukan.');
    console.log('📌 Penggunaan: npx tsx apps/api/scripts/bulk-insert-kkn.ts <path-file.xlsx> [--commit]');
    process.exit(1);
  }

  const baseDir = process.env.INIT_CWD || process.cwd();
  const resolvedPath = path.isAbsolute(filePathArg) ? filePathArg : path.resolve(baseDir, filePathArg);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Error: File tidak ditemukan di path: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`\n==================================================`);
  console.log(`📂 BACA FILE EXCEL: ${resolvedPath}`);
  console.log(`==================================================\n`);

  const xlsxLib: any = typeof XLSX.readFile === 'function' ? XLSX : (XLSX as any).default || XLSX;
  const workbook = xlsxLib.readFile(resolvedPath);

  // Tab 1: Primary data sheet (match "Pengelompokan, Lokasi" or sheet with "pengelompokan" but excluding "ringkasan")
  const primarySheetName = workbook.SheetNames.find((s: string) => {
    const sLower = s.toLowerCase().trim();
    return sLower.includes('pengelompokan, lokasi') || (sLower.includes('pengelompokan') && !sLower.includes('ringkasan'));
  }) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[primarySheetName];
  const rawRows: any[] = xlsxLib.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (rawRows.length < 2) {
    console.error('❌ Error: File Excel kosong atau hanya berisi header.');
    process.exit(1);
  }

  // Find header row in primary sheet
  let headerIndex = -1;
  for (let i = 0; i < Math.min(15, rawRows.length); i++) {
    const rowStr = JSON.stringify(rawRows[i]).toLowerCase();
    if (rowStr.includes('kelurahan') && rowStr.includes('nama mahasiswa')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.error('❌ Error: Tidak dapat menemukan baris header Excel yang valid.');
    process.exit(1);
  }

  const headers: string[] = rawRows[headerIndex].map((h: any) => cleanText(h).toLowerCase());

  // Column mappers with exact keyword priority
  const colKelurahan = headers.findIndex(h => h.includes('kelurahan'));
  const colKelompok = headers.findIndex(h => h.includes('kelompok'));
  const colRw = headers.findIndex(h => h.includes('rw') || h.includes('lokasi'));
  const colNama = headers.findIndex(h => h.includes('nama mahasiswa') || h.includes('nama mhs') || (h.includes('nama') && !h.includes('kelompok')));
  const colPhone = headers.findIndex(h => h.includes('hp') || h.includes('telp') || h.includes('telepon') || h.includes('no wa') || h.includes('no. wa') || h === 'wa');
  const colProdi = headers.findIndex(h => h.includes('prodi') || h.includes('program studi') || h.includes('jurusan'));
  const colDpl = headers.findIndex(h => h.includes('dpl'));

  console.log(`📌 Sheet Utama: "${primarySheetName}" (Header baris #${headerIndex + 1})`);
  console.log('📌 Indeks Kolom Terdeteksi:');
  console.log(`   • Kelurahan   : Col ${colKelurahan}`);
  console.log(`   • Kelompok    : Col ${colKelompok}`);
  console.log(`   • Lokasi (RW) : Col ${colRw}`);
  console.log(`   • Nama Mhs    : Col ${colNama}`);
  console.log(`   • No. HP      : Col ${colPhone}`);
  console.log(`   • Prodi       : Col ${colProdi}`);
  console.log(`   • DPL         : Col ${colDpl}\n`);

  // Auto-seed all 6 Kelurahans of Coblong if missing
  const officialCoblongKelurahans = ['Dago', 'Sekeloa', 'Lebak Gede', 'Lebak Siliwangi', 'Sadang Serang', 'Cipaganti'];
  for (const name of officialCoblongKelurahans) {
    await prisma.kelurahan.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  // Forward fill state
  let lastKelurahan = '';
  let lastKelompok = '';
  let lastRw = '';
  let lastDpl = '';

  const cleanedRows: CleanedRow[] = [];
  const skippedRows: SkippedRow[] = [];
  // Map phone -> { rowNum, namaMahasiswa }
  const phoneSeenInFile = new Map<string, { rowNum: number; namaMahasiswa: string }>();

  // Fetch DB master data for validation
  const existingKelurahans = await prisma.kelurahan.findMany({ select: { name: true } });
  const validKelurahanNames = new Set(existingKelurahans.map(k => k.name.toLowerCase().trim()));

  const existingUsers = await prisma.user.findMany({ select: { phone: true, name: true } });
  const existingPhonesInDb = new Map<string, string>(existingUsers.map(u => [u.phone, u.name]));

  for (let i = headerIndex + 1; i < rawRows.length; i++) {
    const rawRow = rawRows[i];
    const rowNum = i + 1; // 1-indexed Excel row

    const cellNama = colNama !== -1 ? cleanText(rawRow[colNama]) : '';
    const cellPhone = colPhone !== -1 ? cleanText(rawRow[colPhone]) : '';
    const cellKelurahanRaw = colKelurahan !== -1 ? cleanText(rawRow[colKelurahan]) : '';

    // Skip summary / total subtotal rows (e.g. "Jumlah mahasiswa Kelurahan Dago 163")
    if (cellKelurahanRaw.toLowerCase().includes('jumlah') || cellNama.toLowerCase().includes('jumlah')) {
      continue;
    }

    // Skip completely empty rows
    if (!cellNama && !cellPhone && (!colKelompok || !cleanText(rawRow[colKelompok]))) {
      continue;
    }

    // Forward fill
    if (cellKelurahanRaw && !cellKelurahanRaw.toLowerCase().includes('jumlah')) {
      lastKelurahan = cellKelurahanRaw;
    }

    const cellKelompok = colKelompok !== -1 ? cleanText(rawRow[colKelompok]) : '';
    if (cellKelompok && !cellKelompok.toLowerCase().includes('jumlah')) lastKelompok = cellKelompok;

    const cellRw = colRw !== -1 ? cleanText(rawRow[colRw]) : '';
    if (cellRw && !cellRw.toLowerCase().includes('jumlah')) lastRw = cellRw;

    const cellDpl = colDpl !== -1 ? cleanText(rawRow[colDpl]) : '';
    if (cellDpl && !cellDpl.toLowerCase().includes('jumlah')) lastDpl = cellDpl;

    const cellProdi = colProdi !== -1 ? cleanText(rawRow[colProdi]) : '';

    let phoneNorm = normalizePhone(cellPhone);

    // Validations
    if (!cellNama) {
      skippedRows.push({ rowNum, namaMahasiswa: '(Kosong)', phone: cellPhone, reason: 'Nama Mahasiswa kosong di file Excel' });
      continue;
    }

    // If phone is missing or duplicate in file, generate a unique random fallback phone number
    if (!phoneNorm || phoneSeenInFile.has(phoneNorm)) {
      phoneNorm = `+628999${String(Date.now()).slice(-4)}${String(rowNum).padStart(3, '0')}`;
    }
    // Parse RW (fallback RW 1 if missing)
    const rwList = parseRwString(lastRw) || [1];

    // Check Kelurahan match with DB master
    if (validKelurahanNames.size > 0 && !validKelurahanNames.has(lastKelurahan.toLowerCase().trim())) {
      skippedRows.push({ rowNum, namaMahasiswa: cellNama, phone: phoneNorm, reason: `Kelurahan "${lastKelurahan}" tidak cocok dengan master data DB` });
      continue;
    }

    // Check if phone exists in DB
    if (existingPhonesInDb.has(phoneNorm)) {
      const dbName = existingPhonesInDb.get(phoneNorm);
      skippedRows.push({ rowNum, namaMahasiswa: cellNama, phone: phoneNorm, reason: `No. HP sudah terdaftar di database atas nama "${dbName}" (idempotent skip)` });
      continue;
    }

    cleanedRows.push({
      rowNum,
      kelurahan: lastKelurahan,
      namaKelompok: lastKelompok,
      lokasiRwRaw: lastRw,
      rwList,
      namaMahasiswa: cellNama,
      phoneRaw: cellPhone,
      phoneNormalized: phoneNorm,
      programStudi: cellProdi,
      dplNama: lastDpl,
      isKetua: false,
      nim: null
    });
  }

  // Check Tab Data Ketua if present in workbook
  const ketuaSheetName = workbook.SheetNames.find((s: string) => s.toLowerCase().includes('ketua'));
  let ketuaCount = 0;
  if (ketuaSheetName) {
    console.log(`📌 Tab Ketua Terdeteksi: "${ketuaSheetName}" -> Memproses data Ketua Kelompok...`);
    const ketuaSheet = workbook.Sheets[ketuaSheetName];
    const ketuaRawRows: any[] = xlsxLib.utils.sheet_to_json(ketuaSheet, { header: 1, defval: '' });

    for (const kRow of ketuaRawRows) {
      const kRowStr = JSON.stringify(kRow).toLowerCase();
      for (const row of cleanedRows) {
        const phoneSub = row.phoneNormalized.replace('+62', '');
        const nameSub = row.namaMahasiswa.toLowerCase().trim();
        if (kRowStr.includes(phoneSub) || (nameSub.length >= 4 && kRowStr.includes(nameSub))) {
          row.isKetua = true;
          const nimMatch = JSON.stringify(kRow).match(/\b\d{7,14}\b/);
          if (nimMatch) {
            row.nim = nimMatch[0];
          }
          ketuaCount++;
          break;
        }
      }
    }
    console.log(`   -> Total ${ketuaCount} Mahasiswa berhasil ditandai sebagai Ketua Kelompok.`);
  }

  // Check Tab Data Keseluruhan Peserta if present for NIM matching
  const pesertaSheetName = workbook.SheetNames.find((s: string) => s.toLowerCase().includes('keseluruhan') || s.toLowerCase().includes('peserta'));
  let nimCount = 0;
  if (pesertaSheetName) {
    console.log(`📌 Tab Peserta Terdeteksi: "${pesertaSheetName}" -> Mencocokkan NIM Mahasiswa...`);
    const pesertaSheet = workbook.Sheets[pesertaSheetName];
    const pesertaRawRows: any[] = xlsxLib.utils.sheet_to_json(pesertaSheet, { header: 1, defval: '' });

    for (const pRow of pesertaRawRows) {
      const pRowStr = JSON.stringify(pRow).toLowerCase();
      for (const row of cleanedRows) {
        const phoneSub = row.phoneNormalized.replace('+62', '');
        const nameSub = row.namaMahasiswa.toLowerCase().trim();
        if (pRowStr.includes(phoneSub) || (nameSub.length >= 4 && pRowStr.includes(nameSub))) {
          const nimMatch = JSON.stringify(pRow).match(/\b\d{7,14}\b/);
          if (nimMatch && !row.nim) {
            row.nim = nimMatch[0];
            nimCount++;
          }
        }
      }
    }
    console.log(`   -> Total ${nimCount} NIM Mahasiswa berhasil dicocokkan dari tab peserta.`);
  }

  const uniqueKelompok = new Set(cleanedRows.map(r => r.namaKelompok)).size;
  const uniqueKelurahan = new Set(cleanedRows.map(r => r.kelurahan)).size;

  console.log(`\n==================================================`);
  console.log(`📊 RINGKASAN PREVIEW DATA (LANGKAH 4)`);
  console.log(`==================================================`);
  console.log(` Total sheet ditemukan          : ${workbook.SheetNames.length} (${workbook.SheetNames.join(', ')})`);
  console.log(` Total baris terbaca dari Excel   : ${rawRows.length - (headerIndex + 1)}`);
  console.log(` Total baris BERSIH (siap insert) : ${cleanedRows.length} Mahasiswa`);
  console.log(` Total Kelompok unik             : ${uniqueKelompok} Kelompok`);
  console.log(` Total Kelurahan unik            : ${uniqueKelurahan} Kelurahan`);
  console.log(` Total Ketua terdeteksi          : ${ketuaCount}`);
  console.log(` Total baris dilewati (Skip)     : ${skippedRows.length} Baris\n`);

  console.log(`--------------------------------------------------`);
  console.log(`🔍 SAMPLE 5 BARIS PERTAMA (HASIL BERSIH):`);
  console.log(`--------------------------------------------------`);
  cleanedRows.slice(0, 5).forEach((r, idx) => {
    console.log(`[${idx + 1}] Baris Excel #${r.rowNum}`);
    console.log(`    Nama      : ${r.namaMahasiswa} ${r.isKetua ? '(KETUA KELOMPOK)' : ''}`);
    console.log(`    No. HP    : ${r.phoneNormalized} (mentah: ${r.phoneRaw})`);
    console.log(`    NIM       : ${r.nim || '(Belum ada)'}`);
    console.log(`    Kelompok  : ${r.namaKelompok}`);
    console.log(`    Kelurahan : ${r.kelurahan}`);
    console.log(`    Lokasi RW : [${r.rwList.join(', ')}] (mentah: "${r.lokasiRwRaw}")`);
    console.log(`    Prodi     : ${r.programStudi}`);
    console.log(`    DPL       : ${r.dplNama}`);
  });

  if (skippedRows.length > 0) {
    console.log(`\n--------------------------------------------------`);
    console.log(`⚠️ LAPORAN DETIL BARIS DI-SKIP / GAGAL PROSES (${skippedRows.length} Baris):`);
    console.log(`--------------------------------------------------`);
    skippedRows.forEach((s, idx) => {
      console.log(`[${idx + 1}] Baris Excel #${s.rowNum}`);
      console.log(`    Nama Mhs : ${s.namaMahasiswa}`);
      console.log(`    No. HP   : ${s.phone}`);
      console.log(`    Alasan   : ${s.reason}`);
    });
  }

  if (!isCommit) {
    console.log(`\n==================================================`);
    console.log(`🛑 MODUS PREVIEW / DRY-RUN SELESAI`);
    console.log(`   Data BELUM dimasukkan ke database.`);
    console.log(`   Untuk melakukan insert sungguhan, jalankan command:`);
    console.log(`   npm run bulk-insert-kkn -- "${filePathArg}" --commit`);
    console.log(`==================================================\n`);
    await prisma.$disconnect();
    return;
  }

  console.log(`\n==================================================`);
  console.log(`🚀 EKSEKUSI INSERT SUNGGUHAN KE DATABASE (LANGKAH 5)...`);
  console.log(`==================================================\n`);

  let kknRole = await prisma.role.findUnique({ where: { name: 'MAHASISWA_KKN' } });
  if (!kknRole) {
    kknRole = await prisma.role.create({ data: { name: 'MAHASISWA_KKN' } });
  }

  let rwRole = await prisma.role.findUnique({ where: { name: 'RW' } });
  if (!rwRole) {
    rwRole = await prisma.role.create({ data: { name: 'RW' } });
  }

  let createdUsersCount = 0;
  let createdKelompokCount = 0;
  let createdRwCount = 0;
  const processedRwKeys = new Set<string>();

  for (const row of cleanedRows) {
    // Auto-create RW Accounts per Kelurahan & RW Number
    if (row.rwList && row.rwList.length > 0) {
      for (const rwNum of row.rwList) {
        const key = `${row.kelurahan}-RW-${rwNum}`;
        if (!processedRwKeys.has(key)) {
          processedRwKeys.add(key);
          const kelPadded = String(Math.abs(row.kelurahan.length * 7) % 89 + 10);
          const rwPadded = String(rwNum).padStart(2, '0');
          const rwPhone = `+628${kelPadded}00${rwPadded}`;
          
          let existingRw = await prisma.user.findFirst({
            where: {
              OR: [
                { phone: rwPhone },
                { name: { contains: `RW ${rwPadded}` } }
              ]
            }
          });

          if (!existingRw) {
            const rwPassword = await bcrypt.hash(rwPhone, 10);
            await prisma.user.create({
              data: {
                name: `Pengurus RW ${rwPadded} - Kel. ${row.kelurahan}`,
                phone: rwPhone,
                password: rwPassword,
                roleId: rwRole.id,
                status: 'Aktif',
                mustChangePassword: false,
              } as any
            });
            createdRwCount++;
          }
        }
      }
    }

    // 1. Lookup DPL User for relation
    let dplUser = null;
    if (row.dplNama) {
      const dplTokens = [
        "Umi Narimawati", "Agus Riyanto", "Raeni Dwi Santy", "Linna Ismawati", "Adam Mukharil",
        "Hanhan Maulana", "Alif Finandhita", "Richi Dwi Agustia", "Wartika", "Rangga Sidik",
        "Wendi Zarman", "Iyan Andriana", "Amilia Widya", "Ayub Subandi", "Siswanti Zuraida",
        "Muhammad Aksan", "Hery Dwi Yulianto", "Myrna Dwi Rahmatya", "John Adler", "Agus Mulyana",
        "Sri Dewi Anggadini", "Tatang Supriyadi", "Henike Primawati", "Manap Solihat", "Olih Solihin",
        "Tatik Fidowaty", "Wahyudi", "Arif Try Cahyadi", "Cherry Dharmawan", "Rini Maulina",
        "Nungki Heriyati", "Fenny Febriant"
      ];
      for (const token of dplTokens) {
        if (row.dplNama.toLowerCase().includes(token.toLowerCase())) {
          dplUser = await prisma.user.findFirst({
            where: {
              role: { name: 'DPL' },
              name: { contains: token, mode: 'insensitive' }
            }
          });
          if (dplUser) break;
        }
      }
    }

    // 2. Create or get KelompokKkn with dplId relation
    let kelompok = await prisma.kelompokKkn.findUnique({ where: { name: row.namaKelompok } });
    if (!kelompok) {
      kelompok = await prisma.kelompokKkn.create({
        data: {
          name: row.namaKelompok,
          kelurahan: row.kelurahan,
          cakupanRw: row.rwList as any,
          dplNamaMentah: row.dplNama,
          dplId: dplUser?.id || undefined,
        } as any
      });
      createdKelompokCount++;
    } else if (dplUser && !kelompok.dplId) {
      kelompok = await prisma.kelompokKkn.update({
        where: { id: kelompok.id },
        data: { dplId: dplUser.id, dplNamaMentah: row.dplNama }
      });
    }

    // 2. Lookup primary RW Record in DB for relation
    const primaryRwNum = row.rwList[0];
    const kelurahanDb = await prisma.kelurahan.findFirst({ where: { name: row.kelurahan } });
    let rwRecord = null;
    if (kelurahanDb && primaryRwNum) {
      rwRecord = await prisma.rw.findFirst({
        where: {
          kelurahanId: kelurahanDb.id,
          name: { contains: `RW ${primaryRwNum}`, mode: "insensitive" },
        },
      });
    }

    // 3. Hash password (prefer NIM, fallback phone)
    const loginSecret = row.nim || row.phoneNormalized;
    const hashedPassword = await bcrypt.hash(loginSecret, 10);

    // 4. Create User with mustChangePassword = true (Check existing by phone first)
    const userName = row.isKetua ? `👑 ${row.namaMahasiswa} (Ketua Kelompok)` : row.namaMahasiswa;
    let user = await prisma.user.findFirst({
      where: { phone: row.phoneNormalized }
    });

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            name: userName,
            phone: row.phoneNormalized,
            password: hashedPassword,
            roleId: kknRole.id,
            status: 'Aktif',
            mustChangePassword: true,
            address: row.nim ? `NIM: ${row.nim} | ${row.programStudi}` : row.programStudi,
          } as any
        });
      } catch (err) {
        user = await prisma.user.findFirst({ where: { phone: row.phoneNormalized } });
        if (!user) continue;
      }
    }

    // 5. Create StudentKkn profile with NIM uniqueness check
    let studentNim = row.nim ? String(row.nim).trim() : null;
    if (studentNim) {
      const existingNim = await prisma.studentKkn.findFirst({ where: { nim: studentNim } });
      if (existingNim) {
        studentNim = null; // Set null if NIM already registered in DB to ensure idempotency
      }
    }

    try {
      const existingStudent = await prisma.studentKkn.findFirst({ where: { userId: user.id } });
      if (!existingStudent) {
        await prisma.studentKkn.create({
          data: {
            userId: user.id,
            nim: studentNim,
            jurusan: row.programStudi || 'Belum diisi',
            fakultas: '-',
            noWa: row.phoneNormalized,
            kelompokId: kelompok.id,
            assignedRwId: rwRecord?.id || undefined,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
            isKetua: row.isKetua || false,
            whitelistStatus: 'APPROVED'
          } as any
        });
      }
    } catch (e) {
      // Ignore idempotent duplicate error
    }

    createdUsersCount++;
  }

  console.log(`==================================================`);
  console.log(`✅ PROSES INSERT SUNGGUHAN SELESAI`);
  console.log(`==================================================`);
  console.log(` • Akun Mahasiswa KKN Berhasil Dibuat : ${createdUsersCount}`);
  console.log(` • Akun Pengurus RW Berhasil Dibuat   : ${createdRwCount}`);
  console.log(` • Kelompok KKN Berhasil Dibuat       : ${createdKelompokCount}`);
  console.log(` • Total Dilewati                     : ${skippedRows.length}\n`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Critical Error saat eksekusi script:', e);
  await prisma.$disconnect();
  process.exit(1);
});
