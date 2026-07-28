import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAnorganik() {
  const activePetugas = await prisma.petugasResidu.findFirst();
  const bins = await prisma.bin.findMany({ take: 5 });

  console.log('Petugas found:', !!activePetugas, 'Bins count:', bins.length);

  if (activePetugas && bins.length >= 2) {
    const today = new Date();
    
    // Add Anorganik WasteLog
    await prisma.wasteLog.create({
      data: {
        userId: bins[1].userId,
        binId: bins[1].id,
        category: 'ANORGANIK',
        weightKg: 8.2,
        volumeLiter: 15.0,
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
  }
}

seedAnorganik().catch(console.error).finally(() => { prisma.$disconnect() });
