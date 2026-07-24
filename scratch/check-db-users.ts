import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const target = "+6282100000001";
  const user = await prisma.user.findFirst({
    where: { phone: target },
    include: { role: true }
  });
  console.log(`Searching for ${target}:`, user ? "FOUND" : "NOT FOUND");
  if (user) {
    console.log("User details:", JSON.stringify(user, null, 2));
  } else {
    // Find close matches
    const close = await prisma.user.findMany({
      where: { phone: { startsWith: "+62821" } },
      take: 10,
      select: { phone: true, name: true }
    });
    console.log("Some warga phones starting with +62821:", close);
  }
}

run().finally(() => prisma.$disconnect());
