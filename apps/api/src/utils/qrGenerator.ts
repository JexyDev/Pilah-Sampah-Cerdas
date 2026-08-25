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
 * Mencari nomor urut (sequence) tertinggi untuk kode QR standar BERSEKA (prefix BSK-).
 * Jika belum ada kode BSK di database, nomor urut dasar dimulai dari 999 sehingga kode pertama adalah 1000.
 */
export async function getGlobalHighestSequence(tx: any = prisma): Promise<number> {
  const bskBins = await tx.bin.findMany({
    where: {
      qrCode: {
        startsWith: "BSK-",
      },
    },
    select: { qrCode: true },
  });

  let maxSeq = 999; // Nomor urut dasar, sehingga QR pertama adalah 1000
  for (const bin of bskBins) {
    const code = bin.qrCode || "";
    const parts = code.split("-");
    if (parts.length >= 4) {
      const lastPart = parts[parts.length - 1];
      const cleaned = lastPart.replace(/\D/g, "");
      const parsed = parseInt(cleaned, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
  }

  return maxSeq;
}

/**
 * Generate kode QR unik BERSEKA dengan format: BSK-[CATEGORY]-[DDMMYY]-[SEQUENCE]
 * Contoh: BSK-OGN-250826-1000, BSK-AGN-250826-1001, BSK-OGN-250826-1002
 * Dilengkapi proteksi anti-duplikasi otomatis by system dengan nomor urut global terpadu.
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

  // Cari sequence global tertinggi di database untuk prefix BSK-
  const maxSeq = await getGlobalHighestSequence(prisma);
  let nextSeq = maxSeq + 1;
  let qrCode = `BSK-${codeTag}-${dateStr}-${nextSeq}`;

  // Loop perlindungan ekstra untuk memastikan tidak ada duplikasi sama sekali di database
  while (await prisma.bin.findUnique({ where: { qrCode } })) {
    nextSeq++;
    qrCode = `BSK-${codeTag}-${dateStr}-${nextSeq}`;
  }

  return qrCode;
}
