import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'admin@pilahsampah.id',
      name: 'Admin Utama',
      role: Role.ADMIN,
    },
    {
      email: 'lurah@pilahsampah.id',
      name: 'Siti Kelurahan',
      role: Role.PETUGAS_KELURAHAN,
    },
    {
      email: 'rw@pilahsampah.id',
      name: 'Asep RW',
      role: Role.PETUGAS_RW,
    },
    {
      email: 'rt@pilahsampah.id',
      name: 'Budi RT',
      role: Role.PETUGAS_RT,
    },
    {
      email: 'warga@pilahsampah.id',
      name: 'Dewi Lestari',
      role: Role.WARGA,
    }
  ];

  console.log('Menyemai data pengguna...');

  for (const user of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: user.email,
          password: passwordHash,
          name: user.name,
          role: user.role,
        }
      });
      console.log(`Berhasil membuat user: ${user.email} (Role: ${user.role})`);
    } else {
      console.log(`User ${user.email} sudah ada, dilewati.`);
    }
  }

  console.log('Seeding selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
