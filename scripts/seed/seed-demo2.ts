import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDemo() {
  console.log('Seeding demo data...');

  // 1. Leaderboard Data
  const wargaRole = await prisma.role.findUnique({ where: { name: 'WARGA' } });
  if (wargaRole) {
    const wargas = await prisma.user.findMany({ where: { roleId: wargaRole.id } });
    if (wargas.length >= 3) {
      await prisma.pointHistory.create({ data: { userId: wargas[0].id, points: 15430, description: 'Bonus Setoran' } });
      await prisma.pointHistory.create({ data: { userId: wargas[1].id, points: 12200, description: 'Bonus Setoran' } });
      await prisma.pointHistory.create({ data: { userId: wargas[2].id, points: 10500, description: 'Bonus Setoran' } });
    }
  }

  // 2. Pending Petugas
  const petugasRole = await prisma.role.findUnique({ where: { name: 'PETUGAS_RESIDU' } });
  if (petugasRole) {
    const existingPending = await prisma.user.findUnique({ where: { email: 'pending.petugas@demo.com' } });
    if (!existingPending) {
      const pswd = await bcrypt.hash('password123', 10);
      const newPetugasUser = await prisma.user.create({
        data: {
          email: 'pending.petugas@demo.com',
          password: pswd,
          name: 'Budi (Petugas Baru)',
          roleId: petugasRole.id,
          phone: '081234567891',
        }
      });
      await prisma.petugasResidu.create({
        data: {
          userId: newPetugasUser.id,
          nama: 'Budi (Petugas Baru)',
          noWa: '081234567891',
          whitelistStatus: 'PENDING',
          assignedZone: 'RW 01'
        }
      });
      console.log('Created pending petugas');
    }
  }

  // 3. ResiduDashboard: Bins with >70% capacity
  const bins = await prisma.bin.findMany({ take: 5 });
  for (let i = 0; i < Math.min(3, bins.length); i++) {
    await prisma.bin.update({
      where: { id: bins[i].id },
      data: {
        currentVolumeLiter: Number(bins[i].maxCapacityLiter || 100) * 0.8,
      }
    });
  }

  // 4. ResiduDashboard: tugasSelesaiHariIni
  const activePetugas = await prisma.petugasResidu.findFirst({ where: { whitelistStatus: 'APPROVED' } });
  if (activePetugas && bins.length > 0) {
    const today = new Date();
    await prisma.wasteLog.create({
      data: {
        userId: bins[0].userId,
        binId: bins[0].id,
        category: 'ORGANIK',
        weightKg: 5.5,
        wasteImage: 'dummy.jpg',
        aiClassification: 'ORGANIK',
        aiConfidence: 0.95,
        status: 'VERIFIED',
        verifiedByPetugasId: activePetugas.userId,
        verifiedAt: today,
        pointsEarned: 10,
        notes: 'Selesai diangkut'
      }
    });
    console.log('Created waste log for today');
  }

  console.log('Demo seed complete!');
}

seedDemo().catch(console.error).finally(() => { prisma.$disconnect() });