import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  let mhsRole = await prisma.role.findFirst({ where: { name: 'MAHASISWA_KKN' } });
  if (!mhsRole) {
    mhsRole = await prisma.role.create({ data: { name: 'MAHASISWA_KKN' } });
  }

  const pass = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { phone: '+628111111118' },
    update: { password: pass },
    create: {
      name: 'Budi Mahasiswa KKN',
      phone: '+628111111118',
      password: pass,
      roleId: mhsRole.id,
      status: 'Aktif',
    } as any,
  });

  await prisma.studentKkn.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      jurusan: 'Teknik Informatika',
      fakultas: 'Teknik dan Ilmu Komputer',
      noWa: '+628111111118',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      whitelistStatus: 'APPROVED',
    },
  });

  console.log('✅ Demo Mhs KKN user + profile created!');
}

main().finally(() => prisma.$disconnect());
