import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const roles = await prisma.role.findMany();
  for (const r of roles) {
    const user = await prisma.user.findFirst({
      where: { roleId: r.id },
      include: { role: true }
    });
    if (user) {
      console.log(`Role: ${r.name}, Phone: ${user.phone}, Email: ${user.email}`);
    } else {
      console.log(`Role: ${r.name} - NO USER FOUND`);
    }
  }
}
run().finally(() => prisma.$disconnect());
