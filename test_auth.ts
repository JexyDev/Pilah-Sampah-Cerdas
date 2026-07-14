import { PrismaClient } from "@prisma/client";
import { authService } from "./src/services/authService.js";
import { hashPassword } from "./src/utils/hashUtils.js";

const prisma = new PrismaClient();

async function run() {
  console.log("Setting up mock user...");
  // 1. Create Role
  const role = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN" }
  });

  // 2. Create User
  const passwordHash = await hashPassword("password123");
  const user = await prisma.user.upsert({
    where: { email: "admin@pilahsampah.id" },
    update: { password: passwordHash },
    create: {
      name: "Super Admin",
      email: "admin@pilahsampah.id",
      password: passwordHash,
      roleId: role.id
    }
  });

  console.log("Testing Login...");
  try {
    const result = await authService.login("admin@pilahsampah.id", "password123");
    console.log("Login Success! Access Token:", result.accessToken.substring(0, 20) + "...");
    
    console.log("Testing Refresh...");
    const refreshResult = await authService.refresh(result.refreshToken);
    console.log("Refresh Success! New Access Token:", refreshResult.accessToken.substring(0, 20) + "...");
    
    console.log("Testing Logout...");
    await authService.logout(result.refreshToken);
    console.log("Logout Success! Refresh token invalidated.");
    
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
