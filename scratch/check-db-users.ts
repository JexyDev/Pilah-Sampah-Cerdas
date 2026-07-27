import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const roles = await prisma.role.findMany({
    include: {
      _count: {
        select: { users: true }
      }
    }
  });
  console.log("Database user counts by role:");
  console.table(roles.map(r => ({ Role: r.name, Count: r._count.users })));

  const wargaSample = await prisma.user.findMany({
    where: { role: { name: "WARGA" } },
    select: { name: true, phone: true, status: true, rtRw: { select: { name: true } } }
  });
  console.log("Warga users list:");
  console.table(wargaSample);
}

run().finally(() => prisma.$disconnect());
