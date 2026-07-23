import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkRtRw() {
  const all = await prisma.rtRwArea.findMany();
  console.log(all);
}
checkRtRw().finally(() => prisma.$disconnect());
