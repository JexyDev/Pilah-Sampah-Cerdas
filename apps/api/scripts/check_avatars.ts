import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, phone: true, role: { select: { name: true } }, fotoProfil: true }
  });
  console.log('--- DATABASE USERS AVATAR STATS ---');
  console.log('Total users:', users.length);
  console.log('Null fotoProfil count:', users.filter(u => !u.fotoProfil).length);
  console.log('Empty string fotoProfil count:', users.filter(u => u.fotoProfil === '').length);
  console.log('/uploads/default-avatar.png count:', users.filter(u => u.fotoProfil === '/uploads/default-avatar.png').length);
  console.log('Unsplash URLs count:', users.filter(u => u.fotoProfil?.includes('unsplash')).length);
  console.log('\nSample 10 users:');
  console.log(users.slice(0, 10));
}

main().finally(() => prisma.$disconnect());
