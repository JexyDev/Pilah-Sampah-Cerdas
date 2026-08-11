import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const baseDir = process.env.INIT_CWD || process.cwd();
  const candidates = [
    path.resolve(baseDir, '../../docs/raw_new_data.xlsx'),
    path.resolve(baseDir, '../docs/raw_new_data.xlsx'),
    path.resolve(baseDir, 'docs/raw_new_data.xlsx'),
    path.resolve(baseDir, '../../raw_data_kkn_2026.xlsx'),
    path.resolve(baseDir, 'raw_data_kkn_2026.xlsx'),
    path.resolve(baseDir, 'scripts/data_kkn.xlsx')
  ];

  const excelPath = candidates.find(c => fs.existsSync(c));
  if (!excelPath) {
    console.error('❌ Excel file not found!');
    process.exit(1);
  }

  console.log(`📂 Processing NIM sync from: ${excelPath}`);
  const wb = XLSX.readFile(excelPath);
  const sheetName = wb.SheetNames.find(s => s.toLowerCase().includes('pengelompokan') && !s.toLowerCase().includes('ringkasan')) || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const norm = (str: string) => str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const nimByName = new Map<string, string>();
  for (let i = 3; i < rows.length; i++) {
    const r = rows[i];
    const nama = r && r[5] ? String(r[5]) : '';
    const nim = r && r[6] ? String(r[6]).trim() : '';
    if (nama && nim && !nama.toLowerCase().includes('jumlah') && !nama.toLowerCase().includes('nama mahasiswa')) {
      nimByName.set(norm(nama), nim);
    }
  }

  console.log(`📌 Found ${nimByName.size} NIM entries in Excel.`);

  const students = await prisma.studentKkn.findMany({
    include: { user: true }
  });

  let updatedCount = 0;
  for (const s of students) {
    if (!s.user) continue;
    const nameKey = norm(s.user.name);
    const nimVal = nimByName.get(nameKey);
    if (nimVal && s.nim !== nimVal) {
      try {
        const existingNim = await prisma.studentKkn.findFirst({ where: { nim: nimVal } });
        if (!existingNim) {
          await prisma.studentKkn.update({
            where: { id: s.id },
            data: { nim: nimVal }
          });
          updatedCount++;
        }
      } catch (e) {
        // Skip duplicate NIM constraint error
      }
    }
  }

  console.log(`✅ Synced NIM for ${updatedCount} Mahasiswa KKN accounts.`);
  const totalWithNim = await prisma.studentKkn.count({
    where: { nim: { not: null } }
  });
  console.log(`📊 Total Mahasiswa KKN with valid NIM now: ${totalWithNim}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
