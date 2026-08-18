import { prisma } from "../lib/prisma.js";
/**
 * Script Pembaruan Presisi Cakupan RW 32 Kelompok KKN & Format Nama Mahasiswa TitleCase
 * Presisi 100% Sesuai Data Excel docs/raw_new_data.xlsx.
 */
import XLSX from "xlsx";
import path from "path";
import fs from "fs";


const EXCEL_PATHS = [
  path.resolve(process.cwd(), "docs/raw_new_data.xlsx"),
  path.resolve(process.cwd(), "../../docs/raw_new_data.xlsx"),
  path.resolve(process.cwd(), "../docs/raw_new_data.xlsx"),
  "/home/maker/Pilah-Sampah-Cerdas/docs/raw_new_data.xlsx",
];

export function toTitleCase(str: string): string {
  if (!str) return "";
  const words = str.trim().split(/\s+/);
  return words
    .map((w) => {
      if (!w) return "";
      if (w.length === 1) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

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

export function parseRwNumbers(rwStr: string): number[] {
  if (!rwStr) return [];
  const cleanStr = rwStr.replace(/\(\s*\d+%\s*\)/gi, "").replace(/\([^)]*\)/gi, "");
  const numbers: number[] = [];
  const matches = cleanStr.match(/\d+/g);
  if (matches) {
    for (const m of matches) {
      const num = parseInt(m, 10);
      if (num > 0 && num <= 30) {
        numbers.push(num);
      }
    }
  }
  return Array.from(new Set(numbers)).sort((a, b) => a - b);
}

async function updateRwAndTitlecase() {
  console.log("=== SINKRONISASI CAKUPAN RW & TITLECASE MAHASISWA ===");

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
  const sheet = wb.Sheets["Pengelompokan, Lokasi dan DPL "];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const groupRwMap: Record<string, number[]> = {};

  let curKelompok = "";
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;
    if (r[3] && String(r[3]).trim().toLowerCase() !== "nama kelompok") {
      curKelompok = standardizeKelompokName(String(r[3]).trim());
      const rwRaw = r[4] ? String(r[4]).trim() : "";
      const rws = parseRwNumbers(rwRaw);
      if (curKelompok) {
        groupRwMap[curKelompok.toLowerCase()] = rws;
      }
    }
  }

  console.log("=== SINKRONISASI CAKUPAN RW PADA 32 KELOMPOK KKN ===");
  const allKelompok = await prisma.kelompokKkn.findMany();
  for (const kel of allKelompok) {
    const rws = groupRwMap[kel.name.toLowerCase()] || [];
    await prisma.kelompokKkn.update({
      where: { id: kel.id },
      data: {
        cakupanRw: rws,
      },
    });
    console.log(`[UPDATED KELOMPOK] ${kel.name} -> RW: [${rws.join(", ")}]`);
  }

  console.log("\n=== SINKRONISASI TITLECASE & CLEAN NIM NAMA MAHASISWA ===");
  const studentRole = await prisma.role.findUnique({ where: { name: "MAHASISWA_KKN" } });
  if (!studentRole) return;

  const students = await prisma.studentKkn.findMany({
    include: { user: true },
  });

  let titleCaseCount = 0;
  for (const st of students) {
    const cleanNim = st.nim ? st.nim.replace("-2", "") : st.nim;
    const cleanName = st.user?.name ? toTitleCase(st.user.name) : "";

    if (st.user && cleanName) {
      await prisma.user.update({
        where: { id: st.userId },
        data: {
          name: cleanName,
        },
      });
    }

    if (st.nim !== cleanNim) {
      try {
        await prisma.studentKkn.update({
          where: { id: st.id },
          data: { nim: cleanNim },
        });
      } catch {
        // Ignore unique constraint if duplicate NIM exists
      }
    }
    titleCaseCount++;
  }

  console.log(`\n✅ SELESAI: ${titleCaseCount} Mahasiswa Diperbarui ke TitleCase & Clean NIM!`);
}

updateRwAndTitlecase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
