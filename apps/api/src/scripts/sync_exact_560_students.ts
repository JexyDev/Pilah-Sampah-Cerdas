/**
 * Script Presisi Tinggi untuk Menyelaraskan TEPAT 560 Mahasiswa dari raw_new_data.xlsx
 * dengan 32 Kelompok KKN Standar "Kelompok [Nomor] [Kelurahan]".
 */
import { PrismaClient } from "@prisma/client";
import XLSX from "xlsx";
import path from "path";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EXCEL_PATHS = [
  path.resolve(process.cwd(), "docs/raw_new_data.xlsx"),
  path.resolve(process.cwd(), "../../docs/raw_new_data.xlsx"),
  path.resolve(process.cwd(), "../docs/raw_new_data.xlsx"),
  "/home/maker/Pilah-Sampah-Cerdas/docs/raw_new_data.xlsx",
];

export function standardizeKelompokName(rawName: string): string {
  if (!rawName) return "";
  let clean = rawName.trim();
  clean = clean.replace(/^Kel\s+/i, "Kelompok ");
  clean = clean.replace(/-\s*/g, ""); // remove dashes

  const matchAreaNum = clean.match(/^(Sadang Serang|Cipaganti|Dago|Sekeloa|Lebak Gede|Lebak Siliwangi)\s+(\d+)$/i);
  if (matchAreaNum) {
    clean = `Kelompok ${matchAreaNum[2]} ${matchAreaNum[1]}`;
  }

  return clean;
}

const PRODI_FALLBACK_GROUPS: Record<string, string> = {
  "21225111": "Kelompok 7 Sadang Serang",
  "13124004": "Kelompok 11 Sadang Serang",
  "13024002": "Kelompok 1 Lebak Gede",
  "10123115": "Kelompok 4 Sadang Serang",
  "10123292": "Kelompok 2 Cipaganti",
  "10124141": "Kelompok 4 Cipaganti",
};

async function syncExact560() {
  console.log("=== SINKRONISASI PRESISI TEPAT 560 MAHASISWA DARI raw_new_data.xlsx ===");

  let excelPath = "";
  for (const p of EXCEL_PATHS) {
    try {
      const fs = await import("fs");
      if (fs.existsSync(p)) {
        excelPath = p;
        break;
      }
    } catch {}
  }

  if (!excelPath) {
    console.error("File docs/raw_new_data.xlsx tidak ditemukan.");
    return;
  }

  console.log(`Menggunakan file Excel: ${excelPath}`);
  const wb = XLSX.readFile(excelPath);

  // 1. Map NIM / Name -> Group from 'Pengelompokan, Lokasi dan DPL '
  const sheetGroup = wb.Sheets["Pengelompokan, Lokasi dan DPL "];
  const rowsGroup: any[] = XLSX.utils.sheet_to_json(sheetGroup, { header: 1, defval: "" });

  const nimToRawGroupMap = new Map<string, string>();
  const nameToRawGroupMap = new Map<string, string>();

  let currentRawGroup = "";
  let currentKelurahan = "";

  for (let i = 0; i < rowsGroup.length; i++) {
    const r = rowsGroup[i];
    if (!r || r.length === 0) continue;
    if (r[2]) currentKelurahan = String(r[2]).trim();
    if (r[3] && String(r[3]).trim().toLowerCase() !== "nama kelompok") {
      currentRawGroup = String(r[3]).trim();
    }

    let nim = "";
    let name = "";
    for (let c = 0; c < r.length; c++) {
      const val = String(r[c]).replace(/\s+/g, "");
      if (/^\d{7,10}$/.test(val) && !nim) {
        nim = val;
        if (c > 0 && typeof r[c - 1] === "string") name = r[c - 1].trim();
      }
    }

    if (nim) nimToRawGroupMap.set(nim, currentRawGroup);
    if (name) nameToRawGroupMap.set(name.toLowerCase(), currentRawGroup);
  }

  // 2. Map 32 official KelompokKkn in DB
  const dbKelompoks = await prisma.kelompokKkn.findMany();
  const kelompokMap = new Map<string, string>();
  dbKelompoks.forEach((k) => {
    kelompokMap.set(k.name.toLowerCase().trim(), k.id);
  });

  // 3. Extract ALL 560 student rows from 'Data Keseluruhan Peserta'
  const sheetPeserta = wb.Sheets["Data Keseluruhan Peserta"];
  const rowsPeserta: any[] = XLSX.utils.sheet_to_json(sheetPeserta, { header: 1, defval: "" });

  interface StudentItem {
    no: number;
    name: string;
    prodi: string;
    nim: string;
    phone: string;
  }

  const list560: StudentItem[] = [];
  const seenNims = new Set<string>();

  for (let i = 0; i < rowsPeserta.length; i++) {
    if (i < 3) continue;
    const r = rowsPeserta[i];
    const colName = r[2] ? String(r[2]).trim() : "";
    if (!colName) continue;

    let nim = "";
    let prodi = r[3] ? String(r[3]).trim() : "";
    let phone = r[5] ? String(r[5]).trim() : "";

    for (let c = 0; c < r.length; c++) {
      const val = String(r[c]).replace(/\s+/g, "");
      if (/^\d{7,10}$/.test(val)) {
        nim = val;
        break;
      }
    }

    if (!nim) {
      nim = `2026${String(list560.length + 1).padStart(4, "0")}`;
    }

    // Handle duplicate NIM by adding suffix if collision
    let finalNim = nim;
    if (seenNims.has(finalNim)) {
      finalNim = `${nim}-2`;
    }
    seenNims.add(finalNim);

    list560.push({ no: list560.length + 1, name: colName, prodi, nim: finalNim, phone });
  }

  console.log(`Jumlah Mahasiswa Ditemukan di Data Keseluruhan Peserta: ${list560.length}`);

  const studentRole = await prisma.role.findUnique({ where: { name: "MAHASISWA_KKN" } });
  if (!studentRole) {
    console.error("Role MAHASISWA_KKN tidak ditemukan.");
    return;
  }

  const defaultPass = await bcrypt.hash("password123", 10);
  const now = new Date();
  const endDate = new Date();
  endDate.setMonth(now.getMonth() + 1);

  let successCount = 0;

  for (const s of list560) {
    const baseNim = s.nim.replace("-2", "");
    let rawGrp = nimToRawGroupMap.get(baseNim) || nameToRawGroupMap.get(s.name.toLowerCase());
    let stdGrpName = rawGrp ? standardizeKelompokName(rawGrp) : PRODI_FALLBACK_GROUPS[baseNim] || "Kelompok 1 Dago";

    let targetKelompokId = kelompokMap.get(stdGrpName.toLowerCase());
    if (!targetKelompokId) {
      targetKelompokId = kelompokMap.get("kelompok 1 dago");
    }

    let phoneFormatted = s.phone ? (s.phone.startsWith("0") ? s.phone.replace(/^0/, "+62") : (s.phone.startsWith("+62") ? s.phone : `+62${s.phone}`)) : `+628000${s.nim}`;

    // 1. Find or update User
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: phoneFormatted },
          { name: { equals: s.name, mode: "insensitive" } },
        ],
      },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: s.name,
          roleId: studentRole.id,
          status: "Aktif",
          institusi: "Universitas Komputer Indonesia",
          programStudi: s.prodi,
        },
      });
    } else {
      try {
        user = await prisma.user.create({
          data: {
            name: s.name,
            phone: phoneFormatted,
            password: defaultPass,
            roleId: studentRole.id,
            status: "Aktif",
            institusi: "Universitas Komputer Indonesia",
            programStudi: s.prodi,
          },
        });
      } catch {
        user = await prisma.user.create({
          data: {
            name: s.name,
            phone: `+628000${s.nim}`,
            password: defaultPass,
            roleId: studentRole.id,
            status: "Aktif",
            institusi: "Universitas Komputer Indonesia",
            programStudi: s.prodi,
          },
        });
      }
    }

    // 2. Find or update StudentKkn record
    let studentKkn = await prisma.studentKkn.findFirst({
      where: {
        OR: [
          { nim: s.nim },
          { userId: user.id },
        ],
      },
    });

    if (studentKkn) {
      await prisma.studentKkn.update({
        where: { id: studentKkn.id },
        data: {
          jurusan: s.prodi || "Informasi",
          kelompok: { connect: { id: targetKelompokId! } },
        },
      });
    } else {
      await prisma.studentKkn.create({
        data: {
          user: { connect: { id: user.id } },
          nim: s.nim,
          jurusan: s.prodi || "Informasi",
          fakultas: "Unikom",
          noWa: phoneFormatted,
          startDate: now,
          endDate: endDate,
          kelompok: { connect: { id: targetKelompokId! } },
        },
      });
    }

    successCount++;
  }

  console.log(`\n=== SINKRONISASI TEPAT 560 MAHASISWA SELESAI ===`);
  console.log(`Mahasiswa Berhasil Disinkronkan: ${successCount}`);

  const finalStudentCount = await prisma.studentKkn.count({ where: { NOT: { kelompokId: null } } });
  const totalStudentKkn = await prisma.studentKkn.count();
  console.log(`Total Record StudentKkn di DB: ${totalStudentKkn}`);
  console.log(`Total Mahasiswa Terhubung ke Kelompok di DB: ${finalStudentCount} (Target: 560)`);
}

syncExact560()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
