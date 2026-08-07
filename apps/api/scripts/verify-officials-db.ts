import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        name: {
          in: ["ADMIN_DLH", "CAMAT", "LURAH", "PEMIMPIN", "PANITIA_TASKFORCE"],
        },
      },
    },
    select: {
      name: true,
      phone: true,
      address: true,
      role: { select: { name: true } },
    },
    orderBy: { role: { name: "asc" } },
  });

  console.log("==================================================");
  console.log("📊 BUKTI DATA REAL PEJABAT & STAKEHOLDER DI DATABASE POSTGRESQL");
  console.log("==================================================");
  console.log(JSON.stringify(users, null, 2));
  console.log("==================================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
