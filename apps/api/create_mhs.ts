import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  const phone = '08123456789';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  let role = await prisma.role.findFirst({ where: { name: 'MAHASISWA_KKN' } });
  if (!role) {
    role = await prisma.role.create({ data: { name: 'MAHASISWA_KKN', description: 'Mahasiswa KKN' } });
  }

  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Demo Mahasiswa',
        phone,
        password: hashedPassword,
        roleId: role.id,
      }
    });
  } else {
    user = await prisma.user.update({
      where: { phone },
      data: { password: hashedPassword, roleId: role.id }
    });
  }
  
  let student = await prisma.studentKkn.findUnique({ where: { userId: user.id } });
  
  let kelompok = await prisma.kelompokKkn.findFirst({ where: { name: 'Kelompok Demo' } });
  if (!kelompok) {
    kelompok = await prisma.kelompokKkn.create({
      data: {
        name: 'Kelompok Demo',
        kelurahan: 'Sadang Serang',
      }
    });
  }

  if (!student) {
    student = await prisma.studentKkn.create({
      data: {
        userId: user.id,
        nim: '10124095',
        jurusan: 'Teknik Informatika',
        fakultas: 'Fakultas Teknik',
        noWa: phone,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        whitelistStatus: 'APPROVED',
        kelompokId: kelompok.id,
      }
    });
  } else {
    student = await prisma.studentKkn.update({
      where: { userId: user.id },
      data: { whitelistStatus: 'APPROVED', kelompokId: kelompok.id }
    });
  }

  console.log("=== AKUN DEMO MAHASISWA BERHASIL DIBUAT ===");
  console.log("Nomor HP:", phone);
  console.log("Password:", password);
  console.log("Kelurahan Penugasan:", "Sadang Serang");
  console.log("===========================================");
}

main().catch(console.error).finally(() => prisma.$disconnect());
