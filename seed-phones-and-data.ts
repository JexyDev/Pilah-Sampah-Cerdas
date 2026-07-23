import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateRandomPhone() {
  const prefix = '+628';
  const rest = Math.floor(100000000 + Math.random() * 900000000).toString();
  return prefix + rest;
}

async function seed() {
  console.log('Updating users with phone numbers...');
  const users = await prisma.user.findMany();
  for (const u of users) {
    if (!u.phone) {
      await prisma.user.update({
        where: { id: u.id },
        data: { phone: generateRandomPhone(), nik: null }
      });
    }
  }
  console.log('Phone numbers updated.');

  console.log('Adding waste logs for anorganik and residu...');
  const wargaList = await prisma.user.findMany({ where: { role: { name: 'WARGA' } } });
  if (wargaList.length === 0) return console.log('No warga found.');

  // Categories
  let anorganik = await prisma.binCategory.findFirst({ where: { name: 'Anorganik' } });
  let residu = await prisma.binCategory.findFirst({ where: { name: 'Residu' } });

  if (!anorganik) {
    anorganik = await prisma.binCategory.create({ data: { name: 'Anorganik', description: 'Plastik dll', pointsPerKg: 150 } });
  }
  if (!residu) {
    residu = await prisma.binCategory.create({ data: { name: 'Residu', description: 'Popok dll', pointsPerKg: 0 } });
  }

  const today = new Date();
  
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000); // Past days
    const warga = wargaList[i % wargaList.length];
    
    // Anorganik log
    await prisma.wasteLog.create({
      data: {
        userId: warga.id,
        weightKg: Math.random() * 5 + 1,
        timestamp: d,
        status: 'RESOLVED',
        aiConfidence: 0.95,
        categoryId: anorganik.id
      }
    });

    // Residu log
    await prisma.wasteLog.create({
      data: {
        userId: warga.id,
        weightKg: Math.random() * 3,
        timestamp: new Date(d.getTime() + 3600000), // 1 hour later
        status: 'RESOLVED',
        aiConfidence: 0.99,
        categoryId: residu.id
      }
    });
  }
  console.log('Waste logs added.');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
