import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const categories = await prisma.wasteCategory.findMany({});
  console.log("Categories in database:");
  console.table(categories);

  const warga = await prisma.user.findMany({
    where: { role: { name: "WARGA" } },
    select: { id: true, name: true, phone: true }
  });
  console.log("Warga in database:");
  console.table(warga);
}

run().finally(() => prisma.$disconnect());
