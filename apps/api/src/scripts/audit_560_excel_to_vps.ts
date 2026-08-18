import { prisma } from "../lib/prisma.js";
/**
 * Audit & Sync Script: Presisi 100% Antara raw_new_data.xlsx dan VPS Database
 */
import XLSX from "xlsx";
import path from "path";
import fs from "fs";


const EXCEL_PATHS = [
  path.resolve(process.cwd(), "../../docs/raw_new_data.xlsx"),
  path.resolve(process.cwd(), "../docs/raw_new_data.xlsx"),
  path.resolve(process.cwd(), "docs/raw_new_data.xlsx"),
  "/home/maker/Pilah-Sampah-Cerdas/docs/raw_new_data.xlsx",
];

export function standardizeKelompokName(rawName: string): string {
  if (!rawName) return "";
  let clean = rawName.trim();
  clean = clean.replace(/^Kel\s+/i, "Kelompok ");
  clean = clean.replace(/-\s*/g, "");

  const matchAreaNum = clean.match(/^(Sadang Serang|Cipaganti|Dago|Sekeloa|Lebak Gede|Lebak Siliwangi)\s+(\d+)$/i);
  if (matchAreaNum) {
    clean = `Kelompok ${matchAreaNum[2]} ${matchAreaNum[1]}`;
  }

  return clean;
}

async function auditAndSync() {
  console.log("=== AUDIT TOTAL 560 MAHASISWA EXCEL VS VPS DATABASE ===");

  let excelPath = "";
  for (const p of EXCEL_PATHS) {
    if (fs.existsSync(p)) {
      excelPath = p;
      break;
    }
  }

  if (!excelPath) {
    console.error("File raw_new_data.xlsx tidak ditemukan.");
    return;
  }

  console.log(`Menggunakan File Excel: ${excelPath}`);
  const wb = XLSX.readFile(excelPath);

  // 1. Build authoritative NIM -> Group & Name -> Group from 'Pengelompokan, Lokasi dan DPL '
  const sheetGroup = wb.Sheets["Pengelompokan, Lokasi dan DPL "];
  const rowsGroup: any[] = XLSX.utils.sheet_to_json(sheetGroup, { header: 1, defval: "" });

  const nimToGroup = new Map<string, { group: string; kelurahan: string; dpl: string }>();
  const nameToGroup = new Map<string, { group: string; kelurahan: string; dpl: string }>();

  let curGroup = "";
  let curKelurahan = "";
  let curDpl = "";

  for (let i = 0; i < rowsGroup.length; i++) {
    const r = rowsGroup[i];
    if (!r || r.length === 0) continue;

    if (r[2]) curKelurahan = String(r[2]).trim();
    if (r[3] && String(r[3]).trim().toLowerCase() !== "nama kelompok") {
      curGroup = standardizeKelompokName(String(r[3]).trim());
    }
    if (r[9] && String(r[9]).trim().toLowerCase() !== "dpl") {
      curDpl = String(r[9]).trim();
    }

    let nim = "";
    let name = "";

    for (let c = 0; c < r.length; c++) {
      const val = String(r[c]).replace(/\s+/g, "");
      if (/^\d{7,10}$/.test(val) && !nim) {
        nim = val;
        if (c > 0 && typeof r[c - 1] === "string" && r[c - 1].trim().length > 2) {
          name = r[c - 1].trim();
        }
      }
    }

    if (nim) {
      nimToGroup.set(nim, { group: curGroup, kelurahan: curKelurahan, dpl: curDpl });
    }
    if (name) {
      nameToGroup.set(name.toLowerCase(), { group: curGroup, kelurahan: curKelurahan, dpl: curDpl });
    }
  }

  console.log(`Jumlah Mappings dari Sheet Pengelompokan: ${nimToGroup.size} NIMs, ${nameToGroup.size} Names`);

  // 2. Read 560 students from 'Data Keseluruhan Peserta'
  const sheetPeserta = wb.Sheets["Data Keseluruhan Peserta"];
  const rowsPeserta: any[] = XLSX.utils.sheet_to_json(sheetPeserta, { header: 1, defval: "" });

  interface StudentAuditItem {
    no: number;
    name: string;
    prodi: string;
    nim: string;
    phone: string;
    expectedGroup: string;
  }

  const list560: StudentAuditItem[] = [];
  const seenNims = new Set<string>();

  for (let i = 3; i < rowsPeserta.length; i++) {
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

    let finalNim = nim;
    if (seenNims.has(finalNim)) {
      finalNim = `${nim}-2`;
    }
    seenNims.add(finalNim);

    const baseNim = finalNim.replace("-2", "");
    const mapObj = nimToGroup.get(baseNim) || nameToGroup.get(colName.toLowerCase());
    const expectedGroup = mapObj ? mapObj.group : "Kelompok 7 Sadang Serang";

    list560.push({
      no: list560.length + 1,
      name: colName,
      prodi,
      nim: finalNim,
      phone,
      expectedGroup,
    });
  }

  console.log(`Jumlah Total Mahasiswa yang diaudit: ${list560.length}`);

  const serena = list560.find((s) => s.name.toLowerCase().includes("serena"));
  if (serena) {
    console.log(`📌 AUDIT SERENA INDRIANI: NIM=${serena.nim}, Name=${serena.name}, ExpectedGroup="${serena.expectedGroup}"`);
  }

  // 3. Map KelompokKkn in DB
  const dbKelompoks = await prisma.kelompokKkn.findMany();
  const kelompokMap = new Map<string, string>();
  dbKelompoks.forEach((k) => {
    kelompokMap.set(k.name.toLowerCase().trim(), k.id);
  });

  // 4. Update all 560 students in DB
  let fixCount = 0;

  for (const s of list560) {
    const targetKelompokId = kelompokMap.get(s.expectedGroup.toLowerCase());
    if (!targetKelompokId) {
      console.warn(`[WARNING] Kelompok ${s.expectedGroup} tidak ditemukan di DB!`);
      continue;
    }

    const studentKkn = await prisma.studentKkn.findFirst({
      where: {
        OR: [
          { nim: s.nim },
          { user: { name: { equals: s.name, mode: "insensitive" } } },
        ],
      },
    });

    if (studentKkn) {
      await prisma.studentKkn.update({
        where: { id: studentKkn.id },
        data: {
          kelompok: { connect: { id: targetKelompokId } },
        },
      });
      fixCount++;
    }
  }

  console.log(`\n=== AUDIT & SINKRONISASI SELESAI ===`);
  console.log(`Total Mahasiswa Diperbarui: ${fixCount}`);

  // Verify Serena Indriani in DB
  const serenaDb = await prisma.studentKkn.findFirst({
    where: { user: { name: { contains: "Serena", mode: "insensitive" } } },
    include: { kelompok: true, user: true },
  });

  if (serenaDb) {
    console.log(`✅ VERIFIKASI DB SERENA INDRIANI: ${serenaDb.user.name} (NIM: ${serenaDb.nim}) -> Kelompok: ${serenaDb.kelompok?.name}`);
  }
}

auditAndSync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
