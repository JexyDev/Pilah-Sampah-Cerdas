/**
 * Utility: Export data ke file XLSX menggunakan library xlsx (SheetJS).
 * Digunakan oleh semua halaman yang sebelumnya menggunakan ekspor CSV.
 */
import * as XLSX from "xlsx";

/**
 * Export array of arrays (rows) ke file XLSX.
 * @param headers - Baris header (array of string)
 * @param rows - Baris data (array of array of any)
 * @param filename - Nama file tanpa ekstensi (akan ditambah .xlsx otomatis)
 * @param sheetName - Nama sheet (opsional, default: "Data")
 */
export function exportToXlsx(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  filename: string,
  sheetName = "Data"
): void {
  // Gabungkan header dan rows menjadi worksheet data
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-fit lebar kolom berdasarkan konten
  const colWidths = headers.map((h, i) => {
    const maxLen = wsData.reduce((max, row) => {
      const cell = row[i];
      const len = cell !== null && cell !== undefined ? String(cell).length : 0;
      return Math.max(max, len);
    }, h.length);
    return { wch: Math.min(maxLen + 2, 60) };
  });
  ws["!cols"] = colWidths;

  // Style header row (bold) via cell format
  headers.forEach((_, colIdx) => {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: colIdx });
    if (!ws[cellAddr]) return;
    ws[cellAddr].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "009966" } },
      alignment: { horizontal: "center" },
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Tambah .xlsx jika belum ada di nama file
  const finalName = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, finalName);
}
