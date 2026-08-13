/**
 * Script untuk Meringkas & Menyambungkan 500+ Mahasiswa ke 32 Kelompok KKN Baku
 * berdasarkan data komprehensif dari Excel raw_data_kkn_2026.xlsx.
 */
import { PrismaClient } from "@prisma/client";
import XLSX from "xlsx";
import path from "path";

const prisma = new PrismaClient();

const EXCEL_PATHS = [
  path.resolve(process.cwd(), "raw_data_kkn_2026.xlsx"),
  path.resolve(process.cwd(), "../../raw_data_kkn_2026.xlsx"),
  path.resolve(process.cwd(), "../raw_data_kkn_2026.xlsx"),
  "/home/maker/Pilah-Sampah-Cerdas/raw_data_kkn_2026.xlsx",
];

export function standardizeKelompokName(rawName: string, kelurahanHint?: string): string {
  if (!rawName) return "";
  let clean = rawName.trim();

  clean = clean.replace(/^Kel\s+/i, "Kelompok ");
  clean = clean.replace(/-\s*/g, ""); // remove dashes

  // Standardize "Dago 1" -> "Kelompok 1 Dago"
  const matchAreaNum = clean.match(/^(Sadang Serang|Cipaganti|Dago|Sekeloa|Lebak Gede|Lebak Siliwangi)\s+(\d+)$/i);
  if (matchAreaNum) {
    clean = `Kelompok ${matchAreaNum[2]} ${matchAreaNum[1]}`;
  }

  return clean;
}

async function syncStudents() {
  console.log("=== SINKRONISASI RELASI MAHASISWA DENGAN 32 KELOMPOK KKN ===");

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
    console.error("Excel file raw_data_kkn_2026.xlsx tidak ditemukan.");
    return;
  }

  console.log(`Menggunakan file Excel: ${excelPath}`);

  const wb = XLSX.readFile(excelPath);
  const sheetName = wb.SheetNames.find((s) => s.trim().includes("Pengelompokan"));
  if (!sheetName) {
    console.error("Sheet Pengelompokan tidak ditemukan dalam file Excel.");
    return;
  }

  const sheet = wb.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  // Map official KelompokKkn: lowercase name -> id
  const dbKelompoks = await prisma.kelompokKkn.findMany();
  const kelompokMap = new Map<string, string>();

  dbKelompoks.forEach((k) => {
    kelompokMap.set(k.name.toLowerCase().trim(), k.id);
  });

  console.log(`Jumlah Kelompok KKN Terdaftar di DB: ${dbKelompoks.length}`);

  let currentRawKelompok = "";
  let currentKelurahan = "";
  let linkedCount = 0;
  let skippedCount = 0;

  const now = new Date();
  const endDate = new Date();
  endDate.setMonth(now.getMonth() + 1);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const colKelurahan = row[2] ? String(row[2]).trim() : "";
    const colKelompok = row[3] ? String(row[3]).trim() : "";

    if (colKelurahan) currentKelurahan = colKelurahan;
    if (colKelompok && colKelompok.toLowerCase() !== "nama kelompok") {
      currentRawKelompok = colKelompok;
    }

    let nim = "";
    let name = "";
    let prodi = "";

    for (let c = 0; c < row.length; c++) {
      const val = String(row[c]).trim();
      if (/^\d{7,10}$/.test(val) && !nim) {
        nim = val;
        if (c > 0 && typeof row[c - 1] === "string" && row[c - 1].trim().length > 2) {
          name = row[c - 1].trim();
        }
        if (c + 2 < row.length && typeof row[c + 2] === "string") {
          prodi = row[c + 2].trim();
        }
      }
    }

    if (!nim) continue;

    const stdKelompokName = standardizeKelompokName(currentRawKelompok, currentKelurahan);
    const targetKelompokId = kelompokMap.get(stdKelompokName.toLowerCase());

    if (!targetKelompokId) {
      console.warn(`[UNMATCHED KELOMPOK] NIM ${nim} (${name}) -> Raw: "${currentRawKelompok}" Std: "${stdKelompokName}"`);
      skippedCount++;
      continue;
    }

    // Find StudentKkn by NIM or User name
    let student = await prisma.studentKkn.findFirst({
      where: {
        OR: [
          { nim: nim },
          { user: { name: { equals: name, mode: "insensitive" } } },
        ],
      },
    });

    if (student) {
      await prisma.studentKkn.update({
        where: { id: student.id },
        data: {
          kelompok: { connect: { id: targetKelompokId } },
          nim: nim,
          jurusan: prodi || student.jurusan || "Informasi",
        },
      });
      linkedCount++;
    } else {
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: `+628000${nim}` },
            { name: { equals: name, mode: "insensitive" } },
          ],
        },
      });

      const studentRole = await prisma.role.findUnique({ where: { name: "MAHASISWA_KKN" } });

      if (!user && studentRole) {
        const defaultPass = "$2a$10$e8w6P.9F9aL8a8000000000000000000000000000000000000000";
        user = await prisma.user.create({
          data: {
            name: name || `Mahasiswa ${nim}`,
            phone: `+628000${nim}`,
            password: defaultPass,
            roleId: studentRole.id,
            status: "Aktif",
            institusi: "Universitas Komputer Indonesia",
            programStudi: prodi,
          },
        });
      }

      if (user) {
        await prisma.studentKkn.create({
          data: {
            user: { connect: { id: user.id } },
            nim: nim,
            kelompok: { connect: { id: targetKelompokId } },
            jurusan: prodi || "Informasi",
            fakultas: "Unikom",
            noWa: `+628000${nim}`,
            startDate: now,
            endDate: endDate,
          },
        });
        linkedCount++;
      }
    }
  }

  console.log(`\n=== SINKRONISASI MAHASISWA SELESAI ===`);
  console.log(`Mahasiswa Berhasil Dihubungkan ke Kelompok: ${linkedCount}`);
  console.log(`Mahasiswa Gagal/Unmatched: ${skippedCount}`);

  const totalLinked = await prisma.studentKkn.count({ where: { NOT: { kelompokId: null } } });
  console.log(`Total Mahasiswa Terhubung ke Kelompok di DB: ${totalLinked}`);
}

syncStudents()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
