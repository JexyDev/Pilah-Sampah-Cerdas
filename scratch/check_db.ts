import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  try {
    const users = await prisma.user.findMany({
      include: { role: true }
    });
    console.log("Found users in DB:");
    for (const u of users) {
      console.log(`- ID: ${u.id}, Email: ${u.email}, NIK: ${u.nik}, Role: ${u.role?.name}, Status: ${u.status}`);
    }
  } catch (error) {
    console.error("Error reading users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
