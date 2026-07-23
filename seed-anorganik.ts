import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAnorganik() {
  console.log('Seeding anorganik data...');

  const activePetugas = await prisma.petugasResidu.findFirst({ where: { whitelistStatus: 'APPROVED' } });
  const bins = await prisma.bin.findMany({ take: 5 });

  if (activePetugas && bins.length >= 2) {
    const today = new Date();
    
    // Add Anorganik WasteLog
    await prisma.wasteLog.create({
      data: {
        userId: bins[1].userId,
        binId: bins[1].id,
        category: 'ANORGANIK',
        weightKg: 8.2,
        wasteImage: 'dummy-plastik.jpg',
        aiClassification: 'ANORGANIK',
        aiConfidence: 0.92,
        status: 'VERIFIED',
        verifiedByPetugasId: activePetugas.userId,
        verifiedAt: today,
        pointsEarned: 25, // Anorganik points
        notes: 'Selesai diangkut (Plastik & Kaca)'
      }
    });
    console.log('Created anorganik waste log for today');
    
    // Also create another one for good measure
    await prisma.wasteLog.create({
      data: {
        userId: bins[2].userId,
        binId: bins[2].id,
        category: 'ANORGANIK',
        weightKg: 3.5,
        wasteImage: 'dummy-botol.jpg',
        aiClassification: 'ANORGANIK',
        aiConfidence: 0.88,
        status: 'VERIFIED',
        verifiedByPetugasId: activePetugas.userId,
        verifiedAt: today,
        pointsEarned: 15,
        notes: 'Botol plastik campur'
      }
    });
    console.log('Created second anorganik waste log');
  }

  console.log('Anorganik seed complete!');
}

seedAnorganik().catch(console.error).finally(() => { prisma.$disconnect() });
