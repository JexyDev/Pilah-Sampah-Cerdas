import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

const WASTE_IMAGES = [
  "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=400", // organic
  "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=400", // paper/cardboard
  "https://images.unsplash.com/photo-1605600611281-9b1b702ec945?auto=format&fit=crop&q=80&w=400", // plastic bottles
  "https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?auto=format&fit=crop&q=80&w=400", // dry waste
  "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?auto=format&fit=crop&q=80&w=400", // compostable
  "https://images.unsplash.com/photo-1595278069441-2cf29f8db058?auto=format&fit=crop&q=80&w=400", // aluminum cans
];

async function run() {
  console.log("Seeding 6 realistic discrepancy review cases...");

  // 1. Get a resident and their bins
  const households = await prisma.household.findMany({
    include: {
      user: true,
      wasteLogs: true,
    },
    take: 10,
  });

  const categories = await prisma.wasteCategory.findMany();
  const catO = categories.find(c => c.name.includes("Organik"));
  const catA = categories.find(c => c.name.includes("Anorganik"));

  if (!catO || !catA) {
    console.error("Required waste categories not found!");
    return;
  }

  // Get a petugas residu user to act as verifikator
  const rolePetugas = await prisma.role.findUnique({ where: { name: "PETUGAS_RESIDU" } });
  if (!rolePetugas) {
    console.error("Petugas role not found!");
    return;
  }
  const petugas = await prisma.user.findFirst({
    where: { roleId: rolePetugas.id }
  });
  if (!petugas) {
    console.error("No Petugas Residu user found to act as verifier!");
    return;
  }

  // Seed 6 cases
  for (let i = 0; i < 6; i++) {
    const hh = households[i % households.length];
    
    // Find bins for this household
    const bins = await prisma.bin.findMany({
      where: { userId: hh.userId }
    });
    if (bins.length === 0) continue;

    const bin = bins[0]; // use first bin
    const isAiOrganic = i % 2 === 0;

    const aiClass = isAiOrganic ? "ORGANIC" : "ANORGANIC";
    const petugasClass = isAiOrganic ? "ANORGANIC" : "ORGANIC";
    const matchedCategory = isAiOrganic ? catO : catA; // matches AI classification

    const weight = 3.5 + Math.random() * 5.0;
    const volume = 8.0 + Math.random() * 12.0;

    await prisma.wasteLog.create({
      data: {
        householdId: hh.id,
        binId: bin.id,
        weightKg: weight,
        volumeLiter: volume,
        categoryId: matchedCategory.id,
        requestId: uuidv4(),
        aiConfidence: 91.0 + Math.random() * 8.0, // > 90% confidence
        aiClassification: aiClass,
        petugasClassification: petugasClass,
        actualWeightPetugas: weight + (Math.random() - 0.5) * 0.4, // slightly different weight
        discrepancyStatus: "PENDING_REVIEW",
        geolocation: `${hh.latitude},${hh.longitude}`,
        verifiedByPetugasId: petugas.id,
        verifiedAt: new Date(),
        evidencePhotoUrl: WASTE_IMAGES[i % WASTE_IMAGES.length],
      }
    });

    console.log(`Created discrepancy for household ${hh.user.name}: AI=${aiClass} vs Petugas=${petugasClass}`);
  }

  console.log("Discrepancy seeding completed successfully!");
}

run().finally(() => prisma.$disconnect());
