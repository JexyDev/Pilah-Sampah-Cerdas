import { prisma } from "../lib/prisma.js";

export async function generateNextQrCode(categoryId: string): Promise<string> {
  const category = await prisma.wasteCategory.findUnique({
    where: { id: categoryId },
  });

  const catName = (category?.name || categoryId).toUpperCase();
  let codeTag = "OGN";
  if (catName.includes("ANORGANIK") || catName.includes("ANG") || categoryId === "anorganik") {
    codeTag = "ANG";
  } else if (catName.includes("RESIDU") || catName.includes("RSD") || categoryId === "residu") {
    codeTag = "RSD";
  } else {
    codeTag = "OGN";
  }

  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  const dateStr = `${day}${month}${year}`;

  const allBins = await prisma.bin.findMany({
    select: { qrCode: true },
  });

  let maxNum = 0;
  for (const bin of allBins) {
    const code = bin.qrCode.toUpperCase();
    if (code.includes(codeTag)) {
      const parts = code.split("-");
      const lastPart = parts[parts.length - 1];
      const cleaned = lastPart ? lastPart.replace(/\D/g, "") : "";
      if (cleaned) {
        const parsed = parseInt(cleaned, 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    }
  }

  const nextNum = maxNum + 1;
  const paddedSeq = String(nextNum).padStart(3, "0");
  return `TC-${codeTag}-${dateStr}-${paddedSeq}`;
}
