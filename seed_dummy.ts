import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai seeding dummy data...');

  // 1. Dapatkan / Buat User Warga dan Admin (Berdasarkan seed_users.ts)
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const wargaRole = await prisma.role.findUnique({ where: { name: 'WARGA' } });

  if (!adminRole || !wargaRole) {
    console.log('❌ Role belum disemai. Harap jalankan `npx tsx seed_users.ts` terlebih dahulu.');
    return;
  }

  const wargaUser = await prisma.user.findUnique({ where: { email: 'warga@pilahsampah.id' } });
  if (!wargaUser) {
    console.log('❌ User Warga belum disemai. Harap jalankan `npx tsx seed_users.ts` terlebih dahulu.');
    return;
  }

  // 2. Buat Waste Categories (Kategori Sampah)
  console.log('Menyemai Kategori Sampah...');
  const catOrganik = await prisma.wasteCategory.upsert({
    where: { name: 'ORGANIC' },
    update: {},
    create: { name: 'ORGANIC', pointsPerKg: 10, description: 'Sampah Organik (Sisa makanan, daun)' }
  });
  const catAnorganik = await prisma.wasteCategory.upsert({
    where: { name: 'NON_ORGANIC' },
    update: {},
    create: { name: 'NON_ORGANIC', pointsPerKg: 20, description: 'Sampah Anorganik (Plastik, kertas)' }
  });
  const catB3 = await prisma.wasteCategory.upsert({
    where: { name: 'B3' },
    update: {},
    create: { name: 'B3', pointsPerKg: 50, description: 'Sampah B3 (Baterai, elektronik)' }
  });

  // 3. Buat Kelurahan & RT/RW
  console.log('Menyemai Kelurahan & Wilayah...');
  const kelDago = await prisma.kelurahan.upsert({
    where: { name: 'Dago' },
    update: {},
    create: { name: 'Dago' }
  });

  const rw06Dago = await prisma.rtRwArea.upsert({
    where: { kelurahanId_name: { kelurahanId: kelDago.id, name: 'RW 06' } },
    update: {},
    create: { kelurahanId: kelDago.id, name: 'RW 06' }
  });

  // 4. Buat Tempat Sampah Cerdas (Bins)
  console.log('Menyemai Tempat Sampah Cerdas...');
  const bin1 = await prisma.bin.upsert({
    where: { qrCode: 'BIN-ORG-001' },
    update: { currentVolumeLiter: 15 },
    create: { 
      qrCode: 'BIN-ORG-001', 
      categoryId: catOrganik.id, 
      maxCapacityLiter: 25.0, 
      currentVolumeLiter: 15.0, 
      rtRwId: rw06Dago.id, 
      kelurahanId: kelDago.id,
      latitude: -6.8903,
      longitude: 107.6186
    }
  });

  const bin2 = await prisma.bin.upsert({
    where: { qrCode: 'BIN-ANO-001' },
    update: { currentVolumeLiter: 8 },
    create: { 
      qrCode: 'BIN-ANO-001', 
      categoryId: catAnorganik.id, 
      maxCapacityLiter: 25.0, 
      currentVolumeLiter: 8.0, 
      rtRwId: rw06Dago.id, 
      kelurahanId: kelDago.id,
      latitude: -6.8904,
      longitude: 107.6187
    }
  });

  // 5. Buat Rumah Tangga (Household)
  console.log('Menyemai Rumah Tangga...');
  const household = await prisma.household.findFirst({ where: { userId: wargaUser.id } }) || await prisma.household.create({
    data: {
      userId: wargaUser.id,
      address: 'Jl. Dago Asri No. 12',
      rtRwId: rw06Dago.id,
      latitude: -6.8910,
      longitude: 107.6190
    }
  });

  // 6. Buat Riwayat Setoran Sampah (Transactions / WasteLogs)
  console.log('Menyemai Transaksi Setoran Sampah...');
  await prisma.wasteLog.create({
    data: {
      householdId: household.id,
      binId: bin1.id,
      categoryId: catOrganik.id,
      weightKg: 2.5,
      volumeLiter: 5.0,
      requestId: '00000000-0000-0000-0000-000000000001'
    }
  });

  await prisma.wasteLog.create({
    data: {
      householdId: household.id,
      binId: bin2.id,
      categoryId: catAnorganik.id,
      weightKg: 1.2,
      volumeLiter: 3.0,
      requestId: '00000000-0000-0000-0000-000000000002'
    }
  });

  // 7. Tambahkan Riwayat Poin
  console.log('Menyemai Poin...');
  await prisma.pointHistory.create({
    data: {
      userId: wargaUser.id,
      points: 25,
      description: 'Setoran Sampah Organik (2.5 kg)'
    }
  });

  await prisma.pointHistory.create({
    data: {
      userId: wargaUser.id,
      points: 24,
      description: 'Setoran Sampah Anorganik (1.2 kg)'
    }
  });

  console.log('✅ Seeding dummy data selesai! Data Dashboard sekarang akan muncul!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
