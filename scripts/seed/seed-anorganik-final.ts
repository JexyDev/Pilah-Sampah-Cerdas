import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function seedAnorganik() {
  const activePetugas = await prisma.user.findFirst({ where: { role: 'PETUGAS_RESIDU' } });
  const anorganikCategory = await prisma.wasteCategory.findFirst({ where: { name: 'Non-Organik' } });
  const bins = await prisma.bin.findMany({ where: { categoryId: anorganikCategory?.id }, include: { household: true }, take: 2 });

  if (activePetugas && anorganikCategory && bins.length >= 1) {
    const today = new Date();
    
    // Add Anorganik WasteLog
    await prisma.wasteLog.create({
      data: {
        householdId: bins[0].householdId,
        binId: bins[0].id,
        weightKg: 8.2,
        volumeLiter: 15.0,
        categoryId: anorganikCategory.id,
        requestId: crypto.randomUUID(),
        aiClassification: 'NON_ORGANIC',
        aiConfidence: 0.92,
        discrepancyStatus: 'NONE',
        verifiedByPetugasId: activePetugas.id,
        verifiedAt: today,
        createdAt: today
      }
    });
    console.log('Created anorganik waste log for today');
  }
}

seedAnorganik().catch(console.error).finally(() => { prisma.$disconnect() });
