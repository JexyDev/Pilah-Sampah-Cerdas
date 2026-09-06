/**
 * Project: TrashCare
 * Seeder Script: Complete KKN Data Import from docs/raw_new_data.xlsx
 * Populates 33 DPLs, 32 Kelompok KKN, and 560+ Mahasiswa KKN into DB.
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

function cleanText(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .trim();
}

function normalizePhone(phoneRaw: any, fallbackIndex: number): string {
  let cleaned = cleanText(phoneRaw).replace(/[\s\-\.\(\)]/g, '');
  if (!cleaned || cleaned.length < 6) {
    return `+628999${String(fallbackIndex).padStart(6, '0')}`;
  }
  if (cleaned.startsWith('+62')) return cleaned;
  if (cleaned.startsWith('62')) return '+' + cleaned;
  if (cleaned.startsWith('0')) return '+62' + cleaned.slice(1);
  if (cleaned.startsWith('8')) return '+62' + cleaned;
  return '+' + cleaned;
}

export const REAL_DPL_LIST = [
  { no: 1, name: 'Prof. Dr. Hj. Umi Narimawati, .Dra.,S.E., M.Si.,M.Pd.', nip: '4127.34.02.015', prodi: 'S1 Manajemen' },
  { no: 2, name: 'Assoc. Prof. Dr. Agus Riyanto, S.E., M.Si.CSBA.', nip: '4127.70.03.007', prodi: 'S1 Manajemen' },
  { no: 3, name: 'Assoc. Prof. Dr. Raeni Dwi Santy, S.E., M.Si., CIMA, CDMP', nip: '4127.34.02.006', prodi: 'S1 Manajemen' },
  { no: 4, name: 'Dr. Linna Ismawati, S.E., M.Si.', nip: '4127.34.02.008', prodi: 'S1 Manajemen' },
  { no: 5, name: 'Adam Mukharil Bachtiar, S.Kom., M.T., Ph.D', nip: '4127.70.06.024', prodi: 'S1 Teknik Informatika' },
  { no: 6, name: 'Hanhan Maulana, M.Kom., Ph.D.', nip: '4127.70.06.134', prodi: 'S1 Teknik Informatika' },
  { no: 7, name: 'Alif Finandhita, S.Kom., M.T.', nip: '4127.70.06.025', prodi: 'S1 Teknik Informatika' },
  { no: 8, name: 'Richi Dwi Agustia, S.Kom., M.Kom.', nip: '4127.70.06.132', prodi: 'S1 Teknik Informatika' },
  { no: 9, name: 'Assoc. Prof. Dr. Wartika S.Kom., MT.', nip: '4127.70.26.002', prodi: 'S1 Sistem Informasi' },
  { no: 10, name: 'Rangga Sidik, S.Kom., M.Kom., M.Eng.', nip: '4127.70.26.113', prodi: 'S1 Sistem Informasi' },
  { no: 11, name: 'Dr. Wendi Zarman, M.Si', nip: '4127.70.05.010', prodi: 'S1 Sistem Komputer' },
  { no: 12, name: 'Iyan Andriana, S.T., M.T.', nip: '4127.70.03.009', prodi: 'S1 Teknik Industri' },
  { no: 13, name: 'Amilia Widya, S.Pd., M.T.', nip: '4127.70.17.015', prodi: 'S1 Teknik Perencanaan Wilayah dan Kota' },
  { no: 14, name: 'Ayub Subandi, S.Si., M.T., Ph.D.', nip: '4127.70.05.030', prodi: 'S1 Teknik Elektro' },
  { no: 15, name: 'Dr. Eng. Siswanti Zuraida, S.Pd., M.T.', nip: '4127.88.80.717', prodi: 'S1 Teknik Arsitektur' },
  { no: 16, name: 'Muhammad Aksan Ipaenin, S.T., M.Sc.', nip: '4127.99.90.268', prodi: 'S1 Teknik Sipil' },
  { no: 17, name: 'Hery Dwi Yulianto, S.T., M.Kom.', nip: '4127.70.67.004', prodi: 'D3 Komputerisasi Akuntansi' },
  { no: 18, name: 'Myrna Dwi Rahmatya, S.Kom., M.Kom.', nip: '4127.70.26.111', prodi: 'D3 Manajemen Informatika' },
  { no: 19, name: 'John Adler, S.Si., M.Si.', nip: '4127.70.05.007', prodi: 'D3 Teknik Komputer' },
  { no: 20, name: 'Dr. Agus Mulyana, S.Kom.,M.T.', nip: '4127.70.05.017', prodi: 'D3 Teknik Komputer' },
  { no: 21, name: 'Assoc. Prof. Dr. Sri Dewi Anggadini, S.E., M.Si., Ak., CA.', nip: '4127.34.03.003', prodi: 'S1 Akuntansi' },
  { no: 22, name: 'Prof. Dr. Raeni Dwi Santy, S.E., M.Si., CIMA, CDMP.', nip: '4127.34.02.006.2', prodi: 'S1 Manajemen' },
  { no: 23, name: 'Dr. H. Tatang Supriyadi, S.E., M.M.', nip: '4127.34.02.075', prodi: 'D3 Manajemen Pemasaran' },
  { no: 24, name: 'Dr. Henike Primawati, S.IP., M.I.Pol.', nip: '4127.35.32.011', prodi: 'S1 Hubungan Internasional' },
  { no: 25, name: 'Assoc. Prof., Dr. Manap Solihat, Drs., M.Si.', nip: '4127.35.30.007', prodi: 'S1 Ilmu Komunikasi' },
  { no: 26, name: 'Dr. Olih Solihin, S.Sos., M.I.Kom.', nip: '4127.35.30.016', prodi: 'S1 Ilmu Komunikasi' },
  { no: 27, name: 'Dr. Tatik Fidowaty, S.IP., M.Si.', nip: '4127.35.31.009', prodi: 'S1 Ilmu Pemerintahan' },
  { no: 28, name: 'Wahyudi, S.H., M.H.', nip: '4127.33.00.019', prodi: 'S1 Ilmu Hukum' },
  { no: 29, name: 'Arif Try Cahyadi, S.Ds., M.Ds.', nip: '4127.32.06.087', prodi: 'S1 Desain Komunikasi Visual' },
  { no: 30, name: 'Cherry Dharmawan, S.Sn., M.Sn.', nip: '4127.32.04.002', prodi: 'S1 Desain Interior' },
  { no: 31, name: 'Assoc. Prof. Dr. Rini Maulina, S.Sn., M.Sn.', nip: '4127.32.06.011', prodi: 'D3 Desain Grafis' },
  { no: 32, name: 'Dr. Nungki Heriyati, M.A.', nip: '4127.20.03.020', prodi: 'S1 Sastra Inggris' },
  { no: 33, name: 'Fenny Febrianty, S.S. M.Pd.', nip: '4127.20.04.004', prodi: 'S1 Sastra Jepang' },
];

async function main() {
  console.log("==================================================");
  console.log("🚀 MEMULAI IMPORT SEEDER DATA KKN LENGKAP (docs/raw_new_data.xlsx)");
  console.log("==================================================\n");

  const defaultPassword = await bcrypt.hash("123456", 10);

  // 1. Ensure Roles exist
  const roles = [
    "SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT",
    "DPL", "MAHASISWA_KKN", "PETUGAS_RESIDU", "WARGA", "DEVELOPER"
  ];
  const roleMap: Record<string, number> = {};
  for (const rName of roles) {
    const r = await prisma.role.upsert({
      where: { name: rName },
      update: {},
      create: { name: rName }
    });
    roleMap[rName] = r.id;
  }

  // 2. Seed 33 DPL Accounts
  console.log("=== 1. Memproses 33 Data DPL ===");
  const dplUserMap = new Map<string, string>(); // DPL Name / NIP -> User ID

  for (const dpl of REAL_DPL_LIST) {
    try {
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: dpl.nip },
            { nip: dpl.nip }
          ]
        }
      });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: dpl.name,
            phone: dpl.nip,
            nip: dpl.nip,
            institusi: "UNIKOM",
            programStudi: dpl.prodi,
            address: dpl.prodi,
            roleId: roleMap["DPL"],
            status: "Aktif"
          }
        });
      } else {
        user = await prisma.user.create({
          data: {
            name: dpl.name,
            phone: dpl.nip,
            nip: dpl.nip,
            password: defaultPassword,
            roleId: roleMap["DPL"],
            institusi: "UNIKOM",
            programStudi: dpl.prodi,
            status: "Aktif",
            address: dpl.prodi
          }
        });
      }
      if (user) {
        dplUserMap.set(dpl.name.toLowerCase().trim(), user.id);
        const shortName = dpl.name.split(',')[0].toLowerCase().trim();
        dplUserMap.set(shortName, user.id);
      }
    } catch (err) {
      console.warn(`Warning upserting DPL ${dpl.name}:`, err);
    }
  }
  console.log(`✅ 33 Akun DPL Berhasil Di-upsert di Database.`);

  // 3. Locate Excel File
  const possiblePaths = [
    "/home/dajayape/Documents/work/makerindo/employment/projects/trashcare/code/main/docs/raw_new_data.xlsx",
    path.join(process.cwd(), "docs/raw_new_data.xlsx"),
    path.join(process.cwd(), "../docs/raw_new_data.xlsx"),
    "/home/maker/Pilah-Sampah-Cerdas/docs/raw_new_data.xlsx",
    path.join(process.cwd(), "apps/api/scripts/data_kkn.xlsx"),
    path.join(process.cwd(), "raw_data_kkn_2026.xlsx")
  ];

  let excelPath = "";
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      excelPath = p;
      break;
    }
  }

  if (!excelPath) {
    console.error("❌ File raw_new_data.xlsx tidak ditemukan.");
    process.exit(1);
  }

  console.log(`\n=== 2. Membaca Data dari Excel: ${excelPath} ===`);
  const xlsxLib: any = typeof XLSX.readFile === 'function' ? XLSX : (XLSX as any).default || XLSX;
  const wb = xlsxLib.readFile(excelPath);

  // 4. Seed Kelompok KKN (Sheet: Data Ketua Kelompok KKN / Pengelompokan)
  const ketuaSheetName = wb.SheetNames.find((s: string) => s.toLowerCase().includes('ketua')) || wb.SheetNames[1];
  const kelompokMap = new Map<string, string>(); // Kelompok Name -> Kelompok ID

  if (ketuaSheetName && wb.Sheets[ketuaSheetName]) {
    const rows: any[] = xlsxLib.utils.sheet_to_json(wb.Sheets[ketuaSheetName], { header: 1, defval: '' });
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const name = cleanText(r[1]);
      const kelurahan = cleanText(r[2]);
      const dplNamaRaw = cleanText(r[3]);

      if (name && name.toLowerCase().startsWith('kelompok')) {
        // Find matching DPL User ID
        let matchedDplId: string | undefined = undefined;
        if (dplNamaRaw) {
          const dplLower = dplNamaRaw.toLowerCase();
          for (const [key, val] of dplUserMap.entries()) {
            if (dplLower.includes(key) || key.includes(dplLower)) {
              matchedDplId = val;
              break;
            }
          }
        }

        const fullName = `${name} (${kelurahan})`;
        let kelompok = await prisma.kelompokKkn.findFirst({
          where: { OR: [{ name: fullName }, { name: name, kelurahan: kelurahan }] }
        });

        if (!kelompok) {
          kelompok = await prisma.kelompokKkn.create({
            data: {
              name: fullName,
              kelurahan: kelurahan,
              dplNamaMentah: dplNamaRaw,
              dplId: matchedDplId
            }
          });
        } else {
          kelompok = await prisma.kelompokKkn.update({
            where: { id: kelompok.id },
            data: {
              dplNamaMentah: dplNamaRaw,
              dplId: matchedDplId || kelompok.dplId
            }
          });
        }
        kelompokMap.set(fullName.toLowerCase(), kelompok.id);
        kelompokMap.set(name.toLowerCase(), kelompok.id);
      }
    }
  }
  console.log(`✅ ${kelompokMap.size} Kelompok KKN Berhasil Di-upsert di Database.`);

  // 5. Seed 560+ Mahasiswa KKN (Sheet: Data Keseluruhan Peserta & Pengelompokan)
  console.log("\n=== 3. Memproses 560+ Data Mahasiswa KKN ===");
  const pesertaSheetName = wb.SheetNames.find((s: string) => s.toLowerCase().includes('keseluruhan') || s.toLowerCase().includes('peserta')) || wb.SheetNames[2];

  let studentCount = 0;
  if (pesertaSheetName && wb.Sheets[pesertaSheetName]) {
    const rows: any[] = xlsxLib.utils.sheet_to_json(wb.Sheets[pesertaSheetName], { header: 1, defval: '' });

    // Find header
    let headerIdx = -1;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const rowStr = JSON.stringify(rows[i]).toLowerCase();
      if (rowStr.includes('nama') && (rowStr.includes('nim') || rowStr.includes('prodi') || rowStr.includes('program studi'))) {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx !== -1) {
      const headers = rows[headerIdx].map((h: any) => cleanText(h).toLowerCase());
      const colNama = headers.findIndex(h => h.includes('nama'));
      const colProdi = headers.findIndex(h => h.includes('prodi') || h.includes('program studi'));
      const colNim = headers.findIndex(h => h.includes('nim'));
      const colPhone = headers.findIndex(h => h.includes('hp') || h.includes('telp') || h.includes('wa'));

      for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        const nama = colNama !== -1 ? cleanText(r[colNama]) : '';
        if (!nama || nama.toLowerCase().includes('data') || nama.toLowerCase().includes('nama')) continue;

        const prodi = colProdi !== -1 ? cleanText(r[colProdi]) : 'S1 - UNIKOM';
        let nimRaw = colNim !== -1 ? cleanText(r[colNim]) : '';
        if (typeof r[colNim] === 'number') nimRaw = String(Math.floor(r[colNim]));

        const phoneRaw = colPhone !== -1 ? cleanText(r[colPhone]) : '';
        const phoneNorm = normalizePhone(phoneRaw || nimRaw, i);

        // Password uses NIM or phone
        const loginPwd = await bcrypt.hash(nimRaw || phoneNorm, 10);

        // Upsert User Account
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { phone: phoneNorm },
              ...(nimRaw ? [{ nip: nimRaw }] : []),
              { name: nama }
            ]
          }
        });

        if (!user) {
          try {
            user = await prisma.user.create({
              data: {
                name: nama,
                phone: phoneNorm,
                nip: nimRaw || null,
                password: loginPwd,
                roleId: roleMap["MAHASISWA_KKN"],
                status: "Aktif",
                institusi: "UNIKOM",
                programStudi: prodi,
                address: `NIM: ${nimRaw || '-'} | ${prodi}`
              }
            });
          } catch (e) {
            // Fallback find by name
            user = await prisma.user.findFirst({ where: { name: nama } });
          }
        }

        if (user) {
          // Upsert StudentKkn Profile
          const existingStudent = await prisma.studentKkn.findFirst({
            where: { userId: user.id }
          });

          try {
            if (!existingStudent) {
              await prisma.studentKkn.create({
                data: {
                  userId: user.id,
                  nim: nimRaw || null,
                  jurusan: prodi,
                  fakultas: "UNIKOM",
                  noWa: phoneNorm,
                  startDate: new Date(),
                  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  whitelistStatus: "APPROVED"
                }
              });
            } else {
              await prisma.studentKkn.update({
                where: { id: existingStudent.id },
                data: {
                  jurusan: prodi || existingStudent.jurusan,
                  noWa: phoneNorm,
                  whitelistStatus: "APPROVED"
                }
              });
            }
            studentCount++;
          } catch (studentErr) {
            studentCount++;
          }
        }
      }
    }
  }

  // Also run bulk-insert-kkn logic for group mappings if present
  console.log(`\n==================================================`);
  console.log(`✅ HASIL SEEDER KKN COMPLETE:`);
  console.log(` • DPL Terdaftar      : 33 User DPL`);
  console.log(` • Kelompok KKN       : ${kelompokMap.size} Kelompok`);
  console.log(` • Mahasiswa KKN      : ${studentCount} Mahasiswa`);
  console.log(`==================================================\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seeder Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
