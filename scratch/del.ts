import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.schedule.deleteMany({
    where: {
      title: { contains: "GAY", mode: "insensitive" }
    }
  });
  console.log("Deleted " + result.count + " schedule(s)");
}
main().catch(console.error).finally(() => prisma.$disconnect());
