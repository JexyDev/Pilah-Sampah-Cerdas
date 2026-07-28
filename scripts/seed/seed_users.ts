import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const roles = ["ADMIN", "PETUGAS_KELURAHAN", "PETUGAS_RW", "PETUGAS_RT", "WARGA"];

  console.log('Menyemai data role...');
  const roleMap: Record<string, number> = {};
  for (const roleName of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName }
    });
    roleMap[roleName] = role.id;
  }

  const users = [
    {
      email: 'admin@pilahsampah.id',
      name: 'Admin Utama',
      roleId: roleMap["ADMIN"],
    },
    {
      email: 'lurah@pilahsampah.id',
      name: 'Siti Kelurahan',
      roleId: roleMap["PETUGAS_KELURAHAN"],
    },
    {
      email: 'rw@pilahsampah.id',
      name: 'Asep RW',
      roleId: roleMap["PETUGAS_RW"],
    },
    {
      email: 'rt@pilahsampah.id',
      name: 'Budi RT',
      roleId: roleMap["PETUGAS_RT"],
    },
    {
      email: 'warga@pilahsampah.id',
      name: 'Dewi Lestari',
      roleId: roleMap["WARGA"],
    }
  ];

  console.log('Menyemai data pengguna...');

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { password: passwordHash },
      create: {
        email: user.email,
        password: passwordHash,
        name: user.name,
        roleId: user.roleId,
      }
    });
    console.log(`Berhasil memproses user: ${user.email}`);
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
