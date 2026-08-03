import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

function cleanText(str: any): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
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

function parseRwString(rwRaw: string): number[] {
  const text = cleanText(rwRaw);
  if (!text) return [1];
  const matches = text.match(/\d+/g);
  if (!matches || matches.length === 0) return [1];
  const numbers = matches.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n) && n > 0 && n < 100);
  return numbers.length > 0 ? Array.from(new Set(numbers)).sort((a, b) => a - b) : [1];
}

interface GroupSummaryMap {
  namaKelompok: string;
  kelurahan: string;
  dplNama: string;
  dplPhone: string;
  rwList: number[];
  studentCount: number;
  students: { name: string; phone: string; prodi: string }[];
}

async function main() {
  const args = process.argv.slice(2);
  const isCommit = args.includes('--commit');
  const customFileArg = args.find((a) => !a.startsWith('--'));

  const candidatePaths = [
    path.resolve(process.cwd(), 'scripts/data_kkn.xlsx'),
    path.resolve(process.cwd(), 'apps/api/scripts/data_kkn.xlsx'),
    path.resolve(process.cwd(), 'data_kkn.xlsx'),
    'C:\\Users\\USER\\.gemini\\antigravity-ide\\scratch\\data_kkn.xlsx',
  ];

  let excelPath: string | null = null;
  if (customFileArg) {
    excelPath = path.isAbsolute(customFileArg) ? customFileArg : path.resolve(process.cwd(), customFileArg);
  } else {
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        excelPath = p;
        break;
      }
    }
  }

  console.log(`\n==================================================`);
  console.log(`📂 MEMPROSES DATA SEED & LINKING DPL (BAGIAN 1)`);
  if (excelPath) {
    console.log(`📂 MEMBACA FILE EXCEL: ${excelPath}`);
  }
  console.log(`==================================================\n`);

  const groupMap = new Map<string, GroupSummaryMap>();

  if (excelPath && fs.existsSync(excelPath)) {
    const xlsxLib: any = typeof XLSX.readFile === 'function' ? XLSX : (XLSX as any).default || XLSX;
    const workbook = xlsxLib.readFile(excelPath);

    const primarySheetName =
      workbook.SheetNames.find((s: string) => {
        const sLower = s.toLowerCase().trim();
        return sLower.includes('pengelompokan, lokasi') || (sLower.includes('pengelompokan') && !sLower.includes('ringkasan'));
      }) || workbook.SheetNames[0];

    const sheet = workbook.Sheets[primarySheetName];
    const rawRows: any[] = xlsxLib.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    let headerIndex = -1;
    for (let i = 0; i < Math.min(15, rawRows.length); i++) {
      const rowStr = JSON.stringify(rawRows[i]).toLowerCase();
      if (rowStr.includes('kelurahan') && rowStr.includes('nama mahasiswa')) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex !== -1) {
      const headers: string[] = rawRows[headerIndex].map((h: any) => cleanText(h).toLowerCase());
      const colKelurahan = headers.findIndex((h) => h.includes('kelurahan'));
      const colKelompok = headers.findIndex((h) => h.includes('kelompok'));
      const colRw = headers.findIndex((h) => h.includes('rw') || h.includes('lokasi'));
      const colNama = headers.findIndex(
        (h) => h.includes('nama mahasiswa') || h.includes('nama mhs') || (h.includes('nama') && !h.includes('kelompok'))
      );
      const colPhone = headers.findIndex(
        (h) => h.includes('hp') || h.includes('telp') || h.includes('telepon') || h.includes('no wa') || h === 'wa'
      );
      const colProdi = headers.findIndex((h) => h.includes('prodi') || h.includes('program studi') || h.includes('jurusan'));
      const colDpl = headers.findIndex((h) => h.includes('dpl'));

      let lastKelurahan = 'Dago';
      let lastKelompok = '';
      let lastRw = '';
      let lastDpl = '';

      let dplCounter = 1;
      const dplPhoneMap = new Map<string, string>();

      for (let i = headerIndex + 1; i < rawRows.length; i++) {
        const rawRow = rawRows[i];
        const cellNama = colNama !== -1 ? cleanText(rawRow[colNama]) : '';
        const cellPhone = colPhone !== -1 ? cleanText(rawRow[colPhone]) : '';
        const cellKelurahanRaw = colKelurahan !== -1 ? cleanText(rawRow[colKelurahan]) : '';

        if (cellKelurahanRaw.toLowerCase().includes('jumlah') || cellNama.toLowerCase().includes('jumlah')) continue;
        if (!cellNama && !cellPhone) continue;

        if (cellKelurahanRaw) lastKelurahan = cellKelurahanRaw;
        const cellKelompok = colKelompok !== -1 ? cleanText(rawRow[colKelompok]) : '';
        if (cellKelompok) lastKelompok = cellKelompok;
        const cellRw = colRw !== -1 ? cleanText(rawRow[colRw]) : '';
        if (cellRw) lastRw = cellRw;
        const cellDpl = colDpl !== -1 ? cleanText(rawRow[colDpl]) : '';
        if (cellDpl) lastDpl = cellDpl;
        const cellProdi = colProdi !== -1 ? cleanText(rawRow[colProdi]) : '';

        if (!lastKelompok || !cellNama) continue;

        const groupKey = lastKelompok.trim();
        const dplNameNorm = lastDpl.trim() || `DPL ${groupKey}`;

        if (!dplPhoneMap.has(dplNameNorm)) {
          dplPhoneMap.set(dplNameNorm, `+62813${String(dplCounter++).padStart(8, '0')}`);
        }
        const dplPhone = dplPhoneMap.get(dplNameNorm)!;

        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            namaKelompok: groupKey,
            kelurahan: lastKelurahan,
            dplNama: dplNameNorm,
            dplPhone,
            rwList: parseRwString(lastRw),
            studentCount: 0,
            students: [],
          });
        }

        const grp = groupMap.get(groupKey)!;
        grp.studentCount++;
        grp.students.push({
          name: cellNama,
          phone: normalizePhone(cellPhone),
          prodi: cellProdi,
        });
      }
    }
  }

  const groupsList = Array.from(groupMap.values());
  const uniqueDpls = new Set(groupsList.map((g) => g.dplNama)).size;
  const totalMhs = groupsList.reduce((sum, g) => sum + g.studentCount, 0);

  console.log(`==================================================`);
  console.log(`📊 RINGKASAN PREVIEW DATA DPL (LANGKAH 4)`);
  console.log(`==================================================`);
  console.log(` Total Kelompok Terdeteksi          : ${groupsList.length} Kelompok`);
  console.log(` Total DPL Unik yang Akan Dibuat/Linked: ${uniqueDpls} Akun DPL`);
  console.log(` Total Mahasiswa Bimbingan Terhubung   : ${totalMhs} Mahasiswa`);
  console.log(` Role DPL                              : DPL / DOSEN_PEMBIMBING\n`);

  if (!isCommit) {
    console.log(`🛑 DRY-RUN MODE: Sertakan --commit untuk menyimpan ke DB.`);
    await prisma.$disconnect();
    return;
  }

  console.log(`🚀 EKSEKUSI INSERT & LINKING SUNGGUHAN (LANGKAH 5)...`);

  let dplRole = await prisma.role.findFirst({
    where: { name: { in: ['DPL', 'DOSEN_PEMBIMBING'] } },
  });
  if (!dplRole) {
    dplRole = await prisma.role.create({ data: { name: 'DPL' } });
  }

  let mhsRole = await prisma.role.findFirst({ where: { name: 'MAHASISWA_KKN' } });
  if (!mhsRole) {
    mhsRole = await prisma.role.create({ data: { name: 'MAHASISWA_KKN' } });
  }

  let wargaRole = await prisma.role.findFirst({ where: { name: 'WARGA' } });
  if (!wargaRole) {
    wargaRole = await prisma.role.create({ data: { name: 'WARGA' } });
  }

  let createdDplCount = 0;
  let linkedGroupCount = 0;
  let createdStudentCount = 0;

  const dplUserMap = new Map<string, any>();

  for (const g of groupsList) {
    // 1. Create or fetch DPL
    let dplUser = dplUserMap.get(g.dplNama);
    if (!dplUser) {
      let existingUser = await prisma.user.findUnique({ where: { phone: g.dplPhone } });
      if (!existingUser) {
        const hashed = await bcrypt.hash('123456', 10);
        existingUser = await prisma.user.create({
          data: {
            name: g.dplNama,
            phone: g.dplPhone,
            password: hashed,
            roleId: dplRole.id,
            status: 'Aktif',
            mustChangePassword: false,
          } as any,
        });
        createdDplCount++;
      }
      dplUser = existingUser;
      dplUserMap.set(g.dplNama, dplUser);
    }

    // 2. Create or Update KelompokKkn
    let kelompok = await prisma.kelompokKkn.findUnique({ where: { name: g.namaKelompok } });
    if (!kelompok) {
      kelompok = await prisma.kelompokKkn.create({
        data: {
          name: g.namaKelompok,
          kelurahan: g.kelurahan,
          cakupanRw: g.rwList as any,
          dplNamaMentah: g.dplNama,
          dplId: dplUser.id,
        } as any,
      });
    } else {
      await prisma.kelompokKkn.update({
        where: { id: kelompok.id },
        data: {
          dplId: dplUser.id,
          dplNamaMentah: g.dplNama,
          cakupanRw: g.rwList as any,
        },
      });
    }
    linkedGroupCount++;

    // 3. Create Students & Profiles for this Kelompok
    for (let sIdx = 0; sIdx < g.students.length; sIdx++) {
      const st = g.students[sIdx];
      const phoneNorm = st.phone || `+628129${String(createdStudentCount + 1).padStart(7, '0')}`;
      let studentUser = await prisma.user.findUnique({ where: { phone: phoneNorm } });

      if (!studentUser) {
        const pass = await bcrypt.hash(phoneNorm, 10);
        studentUser = await prisma.user.create({
          data: {
            name: st.name,
            phone: phoneNorm,
            password: pass,
            roleId: mhsRole.id,
            status: 'Aktif',
            mustChangePassword: true,
          } as any,
        });
      }

      let profile = await prisma.studentKkn.findUnique({ where: { userId: studentUser.id } });
      if (!profile) {
        profile = await prisma.studentKkn.create({
          data: {
            userId: studentUser.id,
            jurusan: st.prodi || 'Teknik Informatika',
            fakultas: 'Teknik dan Ilmu Komputer',
            noWa: phoneNorm,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            kelompokId: kelompok.id,
            isKetua: sIdx === 0,
            whitelistStatus: 'APPROVED',
            assessmentScore: 85 + (sIdx % 10),
          },
        });
        createdStudentCount++;
      }
    }
  }

  // 4. Seed demo attendance, bins, setoran, and leave requests for DPL 1 & DPL 2 for rich dashboard demonstration
  console.log(`🌱 Seeding rich demo activities (attendances, bins, leave requests)...`);

  const sampleDpls = Array.from(dplUserMap.values()).slice(0, 2);
  for (const dpl of sampleDpls) {
    const groups = await prisma.kelompokKkn.findMany({
      where: { dplId: dpl.id },
      include: { students: { include: { user: true } } },
    });

    for (const grp of groups) {
      // Create a demo schedule
      const sched = await prisma.schedule.create({
        data: {
          title: `Pendampingan Pilah Sampah - ${grp.name}`,
          date: new Date(),
          category: 'PENDAMPINGAN_WARGA',
          location: grp.kelurahan || 'Coblong',
        },
      });

      for (let idx = 0; idx < grp.students.length; idx++) {
        const mhs = grp.students[idx];

        // Seed attendance
        if (idx % 4 !== 3) {
          await prisma.activityAttendance.upsert({
            where: { studentId_scheduleId: { studentId: mhs.userId, scheduleId: sched.id } },
            update: {},
            create: {
              studentId: mhs.userId,
              scheduleId: sched.id,
              method: 'GPS_RADIUS',
              latitude: -6.891234,
              longitude: 107.612345,
              status: 'DALAM_RADIUS',
            },
          });
        }

        // Seed leave request for 1 student per group
        if (idx === 2) {
          await prisma.studentLeaveRequest.create({
            data: {
              studentId: mhs.userId,
              type: 'SAKIT',
              reason: 'Demam tinggi dan butuh istirahat dokter',
              startDate: new Date(),
              endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
              status: 'PENDING',
            },
          });
        }

        // Seed approval history for 1 student
        if (idx === 3) {
          await prisma.studentLeaveRequest.create({
            data: {
              studentId: mhs.userId,
              type: 'IZIN',
              reason: 'Mengikuti seminar wajib kampus',
              startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              status: 'APPROVED',
              reviewedById: dpl.id,
              reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
          });
        }

        // Seed activated bin + citizen setoran for student 0
        if (idx === 0) {
          const citizenPhone = `+62857${String(Math.floor(Math.random() * 10000000)).padStart(8, '0')}`;
          let citizen = await prisma.user.findUnique({ where: { phone: citizenPhone } });
          if (!citizen) {
            const pass = await bcrypt.hash('123456', 10);
            citizen = await prisma.user.create({
              data: {
                name: `Warga Binaan ${mhs.user.name.split(' ')[0]}`,
                phone: citizenPhone,
                password: pass,
                roleId: wargaRole.id,
                status: 'Aktif',
              } as any,
            });
          }

          const binQr = `PSC-DPL-${mhs.userId.slice(0, 5)}-${Math.floor(Math.random() * 1000)}`;
          let bin = await prisma.bin.findUnique({ where: { qrCode: binQr } });
          if (!bin) {
            bin = await prisma.bin.create({
              data: {
                qrCode: binQr,
                status: 'ACTIVE_BOUND',
                userId: citizen.id,
                registeredByStudentId: mhs.userId,
                latitude: -6.892,
                longitude: 107.613,
              },
            });
          }

          // Create setoran logs over last 7 days to simulate routine pattern
          for (let day = 0; day < 5; day++) {
            await prisma.setoranOtomatis.create({
              data: {
                wargaId: citizen.id,
                fotoSampahUrl: 'https://example.com/foto-sampah.jpg',
                hasilKlasifikasiAi: 'ORGANIK',
                confidenceAi: 95.5,
                berat: 2.5,
                poin: 25,
                qrTempatSampahId: bin.id,
                createdAt: new Date(Date.now() - day * 24 * 60 * 60 * 1000),
              },
            });
          }
        }
      }
    }
  }

  console.log(`==================================================`);
  console.log(`✅ PROSES INSERT & LINKING SUNGGUHAN SELESAI`);
  console.log(`==================================================`);
  console.log(` • Akun DPL Dibuat / Ditemukan : ${createdDplCount}`);
  console.log(` • Kelompok Berhasil Dihubungkan: ${linkedGroupCount}`);
  console.log(` • Mahasiswa KKN Berhasil Dibuat: ${createdStudentCount}\n`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Error saat eksekusi script seed DPL:', e);
  await prisma.$disconnect();
  process.exit(1);
});
