import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function cleanNameToEmail(name: string): string {
  // Strip academic titles and prefixes
  let cleaned = name
    .replace(/,\s*.*$/gi, "") // strip all comma suffixes
    .replace(/\b(assoc\.\s*prof\.|assoc\s*prof\.|assoc\s*prof|assoc\.|assoc|prof\.|prof|dr\.|dr|drs\.|drs|dra\.|dra|eng\.|eng|h\.|h|hj\.|hj|ir\.|ir)\b/gi, "")
    .replace(/[^a-zA-Z\s]/g, " ")
    .trim()
    .toLowerCase();

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "dpl@email.unikom.ac.id";
  if (parts.length === 1) return `${parts[0]}@email.unikom.ac.id`;
  return `${parts[0]}.${parts[1]}@email.unikom.ac.id`;
}

async function main() {
  console.log("🔄 Updating DPL emails...");
  const dpls = await prisma.user.findMany({
    where: { role: { name: { in: ["DPL", "DOSEN_PEMBIMBING"] } } },
    select: { id: true, name: true, phone: true, nip: true, email: true },
  });

  console.log(`Found ${dpls.length} DPL records.`);

  for (const dpl of dpls) {
    const generatedEmail = cleanNameToEmail(dpl.name);
    await prisma.user.update({
      where: { id: dpl.id },
      data: { email: generatedEmail },
    });
    console.log(`✅ [${dpl.name}] -> ${generatedEmail}`);
  }

  console.log("🎉 All DPL emails updated successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
