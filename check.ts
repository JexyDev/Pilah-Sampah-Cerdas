import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const rw = await prisma.rtRwArea.findUnique({ where: { id: 6 } });
  console.log("RW Area:", rw?.name);

  const rwPart = rw?.name.split("/").map(s => s.trim()).find(s => s.startsWith("RW")) || rw?.name;
  console.log("rwPart:", rwPart);

  const p = await prisma.petugasResidu.findMany({
    where: { whitelistStatus: "PENDING" }
  });
  console.log("All pending petugas:", p);
}
check().finally(() => prisma.$disconnect());
