import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';

const prisma = new PrismaClient();
const XLSX_PATH = '/home/dajayape/Documents/work/makerindo/employment/projects/trashcare/code/main/raw_data_kkn_2026.xlsx';

async function syncDplExact() {
  console.log("================================================================================");
  console.log("📌 SYNC EXACT DATA DPL KKN FROM EXCEL SHEET 'DATA DOSEN PEMBIMBING LAPANGAN (DPL) KKN'");
  console.log("================================================================================\n");

  const wb = XLSX.readFile(XLSX_PATH);
  const dplSheet = wb.Sheets['Data DPL KKN'];
  const dplRaw: any[] = XLSX.utils.sheet_to_json(dplSheet, { header: 1, defval: '' });

  const excelDpls: { no: number; nama: string; nip: string; prodi: string; jenjang: string }[] = [];

  for (let r = 2; r < dplRaw.length; r++) {
    const row = dplRaw[r];
    const no = row[0];
    const nama = row[1] ? String(row[1]).trim() : '';
    const nip = row[2] ? String(row[2]).trim() : '';
    const prodi = row[3] ? String(row[3]).trim() : '';

    if (nama && typeof no === 'number') {
      const jenjangMatch = prodi.match(/^(S[1-3]|D[3-4])/i);
      const jenjang = jenjangMatch ? jenjangMatch[0].toUpperCase() : 'S1';

      excelDpls.push({
        no,
        nama,
        nip,
        prodi,
        jenjang
      });
    }
  }

  console.log(`📌 Extracted ${excelDpls.length} DPLs from sheet 'Data DPL KKN'\n`);

  const dplRole = await prisma.role.findUnique({ where: { name: 'DPL' } });

  let updatedCount = 0;
  let createdCount = 0;

  for (const d of excelDpls) {
    const cleanFirstName = d.nama.split(',')[0].replace(/prof\.|dr\.|assoc\.|hj\.|h\./gi, '').trim().split(' ')[0];

    // Find existing DPL by NIP or name
    let user = await prisma.user.findFirst({
      where: {
        role: { name: 'DPL' },
        OR: [
          { nip: d.nip },
          { name: { contains: cleanFirstName, mode: 'insensitive' } }
        ]
      }
    });

    const phone = `+62813${String(d.no).padStart(8, '0')}`;

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: d.nama,
          nip: d.nip,
          programStudi: d.prodi,
          jenjangPendidikan: d.jenjang,
          status: 'Aktif'
        }
      });
      updatedCount++;
    } else {
      await prisma.user.create({
        data: {
          name: d.nama,
          phone,
          password: '$2a$10$e7x1A80...hash',
          roleId: dplRole!.id,
          status: 'Aktif',
          nip: d.nip,
          programStudi: d.prodi,
          jenjangPendidikan: d.jenjang,
          address: 'Universitas Komputer Indonesia, Jl. Dipati Ukur No.112-116, Bandung'
        }
      });
      createdCount++;
    }
  }

  console.log(`✅ Updated ${updatedCount} DPLs with exact NIP and Program Studi from Excel!`);
  console.log(`✅ Created ${createdCount} new DPLs.`);

  // Print all 33 DPLs in DB to verify
  const allDpls = await prisma.user.findMany({
    where: { role: { name: 'DPL' } },
    select: { name: true, nip: true, programStudi: true, jenjangPendidikan: true }
  });

  console.log("\n================================================================================");
  console.log("📊 TOTAL DPL IN DB: " + allDpls.length + " DPLs (VERIFIKASI DETIL):");
  console.log("================================================================================");
  console.table(allDpls.map((u, i) => ({
    "No": i + 1,
    "Nama DPL": u.name,
    "NIP (Wajib Ada)": u.nip,
    "Program Studi (Excel)": u.programStudi,
    "Jenjang": u.jenjangPendidikan
  })));
}

syncDplExact()
  .catch(e => {
    console.error("❌ Sync Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
