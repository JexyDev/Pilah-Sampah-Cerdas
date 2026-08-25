import { prisma } from "../lib/prisma.js";

/**
 * Format kategori sampah menjadi kode 3-huruf standar BERSEKA:
 * - Organik => OGN
 * - Anorganik => AGN
 * - Residu => RSD
 * - B3 / Lainnya => B3 / UMM
 */
export function getCategoryCodeTag(categoryNameOrId?: string | null): string {
  const upper = (categoryNameOrId || "").toUpperCase();
  if (
    upper.includes("ANORGANIK") ||
    upper.includes("ANORG") ||
    upper.includes("NON_ORGANIC") ||
    upper.includes("AGN") ||
    upper.includes("ANG") ||
    categoryNameOrId === "anorganik"
  ) {
    return "AGN";
  } else if (upper.includes("RESIDU") || upper.includes("RSD") || categoryNameOrId === "residu") {
    return "RSD";
  } else if (upper.includes("B3")) {
    return "B3";
  } else {
    return "OGN";
  }
}

/**
 * Format tanggal sekarang menjadi DDMMYY (contoh: 250826 untuk 25 Agustus 2026 atau 140226 untuk 14 Feb 2026)
 */
export function formatCurrentDateDDMMYY(d: Date = new Date()): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

/**
 * Generate kode QR unik BERSEKA dengan format: BSK-[CATEGORY]-[DDMMYY]-[SEQUENCE]
 * Contoh: BSK-OGN-140226-1000 atau BSK-AGN-250826-1001
 * Dilengkapi proteksi anti-duplikasi otomatis by system.
 */
export async function generateNextQrCode(categoryId: string): Promise<string> {
  let catName = categoryId;
  if (categoryId) {
    const category = await prisma.wasteCategory.findUnique({
      where: { id: categoryId },
    });
    if (category) {
      catName = category.name;
    }
  }

  const codeTag = getCategoryCodeTag(catName);
  const dateStr = formatCurrentDateDDMMYY();

  // Cari semua bin dengan prefix BSK-{codeTag}- untuk mencari sequence tertinggi
  const allMatchingBins = await prisma.bin.findMany({
    where: {
      qrCode: {
        startsWith: `BSK-${codeTag}-`,
      },
    },
    select: { qrCode: true },
  });

  let maxSeq = 999; // Base agar nomor awal mulai dari 1000
  for (const bin of allMatchingBins) {
    const parts = bin.qrCode.split("-");
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      const cleaned = lastPart.replace(/\D/g, "");
      const parsed = parseInt(cleaned, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
  }

  let nextSeq = maxSeq + 1;
  let qrCode = `BSK-${codeTag}-${dateStr}-${nextSeq}`;

  // Loop perlindungan ekstra untuk memastikan tidak ada duplikasi sama sekali di database
  while (await prisma.bin.findUnique({ where: { qrCode } })) {
    nextSeq++;
    qrCode = `BSK-${codeTag}-${dateStr}-${nextSeq}`;
  }

  return qrCode;
}
