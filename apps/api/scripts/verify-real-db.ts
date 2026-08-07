import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const superUsers = await prisma.user.findMany({
    where: { role: { name: "SUPER_USER" } },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      address: true,
      createdAt: true,
      role: { select: { name: true } },
    },
  });

  console.log("==================================================");
  console.log("📊 BUKTI DATA REAL DATABASE POSTGRESQL (Tabel: pengguna)");
  console.log("==================================================");
  console.log(`Total Super User di DB: ${superUsers.length}\n`);
  console.log(JSON.stringify(superUsers, null, 2));
  console.log("==================================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
