import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const survey = await prisma.surveiKelurahan.findFirst();
  console.log(survey);
}
main().catch(console.error).finally(() => prisma.$disconnect());
