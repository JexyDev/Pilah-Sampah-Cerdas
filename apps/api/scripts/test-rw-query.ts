import { userService } from "../src/services/userService.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const users = await userService.getAllUsers({ roleName: "RW" }, { userId: "1", role: "SUPER_USER" });
  console.log("Total RW users retrieved:", users.length);
  console.log("Sample 5 RW users:\n", JSON.stringify(users.slice(0, 5), null, 2));
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
