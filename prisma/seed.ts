import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create Roles
  const roles = ['ADMIN', 'PETUGAS_KELURAHAN', 'PETUGAS_RW', 'PETUGAS_RT', 'WARGA'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }
  console.log('Roles seeded.');

  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const kelurahanRole = await prisma.role.findUnique({ where: { name: 'PETUGAS_KELURAHAN' } });
  const rwRole = await prisma.role.findUnique({ where: { name: 'PETUGAS_RW' } });
  const rtRole = await prisma.role.findUnique({ where: { name: 'PETUGAS_RT' } });
  const wargaRole = await prisma.role.findUnique({ where: { name: 'WARGA' } });

  if (!adminRole || !kelurahanRole || !rwRole || !rtRole || !wargaRole) {
    throw new Error('Failed to create roles');
  }

  // 2. Create Kelurahan & RT/RW Areas
  const dago = await prisma.kelurahan.upsert({
    where: { name: 'Dago' },
    update: {},
    create: { name: 'Dago' }
  });

  const cigadung = await prisma.kelurahan.upsert({
    where: { name: 'Cigadung' },
    update: {},
    create: { name: 'Cigadung' }
  });

  const rt04rw06 = await prisma.rtRwArea.upsert({
    where: { kelurahanId_name: { kelurahanId: dago.id, name: 'RT 04 / RW 06' } },
    update: {},
    create: { kelurahanId: dago.id, name: 'RT 04 / RW 06' }
  });

  const rt02rw06 = await prisma.rtRwArea.upsert({
    where: { kelurahanId_name: { kelurahanId: dago.id, name: 'RT 02 / RW 06' } },
    update: {},
    create: { kelurahanId: dago.id, name: 'RT 02 / RW 06' }
  });

  const rt01rw05 = await prisma.rtRwArea.upsert({
    where: { kelurahanId_name: { kelurahanId: dago.id, name: 'RT 01 / RW 05' } },
    update: {},
    create: { kelurahanId: dago.id, name: 'RT 01 / RW 05' }
  });

  console.log('Kelurahan & RT/RW areas seeded.');

  // 3. Create Categories
  const catOrganic = await prisma.wasteCategory.upsert({
    where: { name: 'ORGANIC' },
    update: { pointsPerKg: 100 },
    create: { name: 'ORGANIC', description: 'Sampah Organik', pointsPerKg: 100 }
  });

  const catNonOrganic = await prisma.wasteCategory.upsert({
    where: { name: 'NON_ORGANIC' },
    update: { pointsPerKg: 50 },
    create: { name: 'NON_ORGANIC', description: 'Sampah Anorganik', pointsPerKg: 50 }
  });

  console.log('Categories seeded.');

  // 4. Hash default password
  const passwordHash = await bcrypt.hash('password123', 10);

  // 5. Create Default Users
  const userSeeds = [
    { email: 'admin@psc.id', name: 'Admin Utama', roleId: adminRole.id, nik: '3273012345678905', status: 'Aktif', rtRwId: null },
    { email: 'kelurahan@psc.id', name: 'Siti Kelurahan', roleId: kelurahanRole.id, nik: '3273012345678904', status: 'Aktif', rtRwId: null },
    { email: 'rw@psc.id', name: 'Asep RW', roleId: rwRole.id, nik: '3273012345678903', status: 'Aktif', rtRwId: rt02rw06.id },
    { email: 'rt@psc.id', name: 'Budi RT', roleId: rtRole.id, nik: '3273012345678902', status: 'Aktif', rtRwId: rt02rw06.id },
    { email: 'warga@psc.id', name: 'Dewi Lestari', roleId: wargaRole.id, nik: '3273012345678901', status: 'Aktif', rtRwId: rt04rw06.id },
  ];

  const dbUsers = [];
  for (const user of userSeeds) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        nik: user.nik,
        status: user.status,
        rtRwId: user.rtRwId
      },
      create: {
        email: user.email,
        name: user.name,
        password: passwordHash,
        roleId: user.roleId,
        nik: user.nik,
        status: user.status,
        rtRwId: user.rtRwId
      },
    });
    dbUsers.push(createdUser);
  }
  console.log('Users seeded.');

  const wargaUser = dbUsers.find(u => u.email === 'warga@psc.id')!;

  // 6. Create Household for citizen
  const household = await prisma.household.upsert({
    where: { id: 'warga-household-id-01' },
    update: {},
    create: {
      id: 'warga-household-id-01',
      userId: wargaUser.id,
      address: 'Jl. Ir. H. Juanda No. 123',
      rtRwId: rt04rw06.id,
      latitude: -6.88923,
      longitude: 107.6105,
    }
  });
  console.log('Household seeded.');

  // 7. Create Bins
  const bin1 = await prisma.bin.upsert({
    where: { qrCode: 'TS-COB-001' },
    update: {},
    create: {
      qrCode: 'TS-COB-001',
      categoryId: catOrganic.id,
      maxCapacityLiter: 25.0,
      currentVolumeLiter: 5.0,
      rtRwId: rt04rw06.id,
      kelurahanId: dago.id,
      latitude: -6.8895,
      longitude: 107.6108
    }
  });

  const bin2 = await prisma.bin.upsert({
    where: { qrCode: 'TS-COB-002' },
    update: {},
    create: {
      qrCode: 'TS-COB-002',
      categoryId: catNonOrganic.id,
      maxCapacityLiter: 25.0,
      currentVolumeLiter: 12.0,
      rtRwId: rt04rw06.id,
      kelurahanId: dago.id,
      latitude: -6.8890,
      longitude: 107.6102
    }
  });

  const bin3 = await prisma.bin.upsert({
    where: { qrCode: 'TS-COB-003' },
    update: {},
    create: {
      qrCode: 'TS-COB-003',
      categoryId: catOrganic.id,
      maxCapacityLiter: 25.0,
      currentVolumeLiter: 23.5,
      rtRwId: rt02rw06.id,
      kelurahanId: dago.id,
      latitude: -6.8885,
      longitude: 107.6115
    }
  });
  console.log('Bins seeded.');

  // 8. Create Waste Logs (Setoran)
  await prisma.wasteLog.deleteMany({});
  const log1 = await prisma.wasteLog.create({
    data: {
      householdId: household.id,
      binId: bin1.id,
      weightKg: 2.0,
      volumeLiter: 5.0,
      categoryId: catOrganic.id,
      requestId: '00000000-0000-0000-0000-000000000001',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  });

  const log2 = await prisma.wasteLog.create({
    data: {
      householdId: household.id,
      binId: bin2.id,
      weightKg: 1.5,
      volumeLiter: 7.5,
      categoryId: catNonOrganic.id,
      requestId: '00000000-0000-0000-0000-000000000002',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  });
  console.log('Waste logs seeded.');

  // 9. Point History
  await prisma.pointHistory.deleteMany({});
  await prisma.pointHistory.create({
    data: {
      userId: wargaUser.id,
      points: 200,
      description: 'Setoran sampah Organik 2.0 kg',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  });
  await prisma.pointHistory.create({
    data: {
      userId: wargaUser.id,
      points: 75,
      description: 'Setoran sampah Anorganik 1.5 kg',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  });
  console.log('Point history seeded.');

  // 10. Schedules
  await prisma.schedule.deleteMany({});
  await prisma.schedule.create({
    data: {
      title: 'Sosialisasi Pemilahan Mandiri',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      time: '09:00',
      category: 'Sosialisasi',
      location: 'Balai RW 06 Dago'
    }
  });
  await prisma.schedule.create({
    data: {
      title: 'Pengangkutan Sampah Rutin',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      time: '08:00',
      category: 'Pengangkutan',
      location: 'Seluruh RW 06 Dago'
    }
  });
  console.log('Schedules seeded.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
