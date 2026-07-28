import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function generateNextQrCode(categoryId: string): Promise<string> {
  const category = await prisma.wasteCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  const categoryName = category.name.toUpperCase();
  const isOrganic =
    categoryName.includes("ORGANIK") &&
    !categoryName.includes("ANORGANIK") &&
    !categoryName.includes("NON");

  // Prefixes
  const currentPrefix = isOrganic ? "ORG" : "ANORG";
  // We should also look for older formats (QR-ORG- and QR-ANO-) to continue the sequence
  const legacyPrefix = isOrganic ? "QR-ORG-" : "QR-ANO-";
  const demoPrefix = isOrganic ? "QR-DEMO-O-" : "QR-DEMO-A-";

  const allBins = await prisma.bin.findMany({
    select: { qrCode: true },
  });

  let maxNum = 0;

  for (const bin of allBins) {
    const code = bin.qrCode.toUpperCase();
    let numStr = "";

    if (code.startsWith(currentPrefix)) {
      numStr = code.substring(currentPrefix.length);
    } else if (code.startsWith(legacyPrefix)) {
      numStr = code.substring(legacyPrefix.length);
    } else if (code.startsWith(demoPrefix)) {
      numStr = code.substring(demoPrefix.length);
    }

    // Clean numStr to keep only digits
    const cleaned = numStr.replace(/[^0-9]/g, "");
    if (cleaned) {
      const parsed = parseInt(cleaned, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  const nextNum = maxNum + 1;
  const paddedNum = String(nextNum).padStart(8, "0");
  return `${currentPrefix}${paddedNum}`;
}
