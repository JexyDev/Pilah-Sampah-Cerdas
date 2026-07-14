import { PrismaClient } from "@prisma/client";
import { pointService } from "./src/services/pointService.js";
import { authService } from "./src/services/authService.js";

const prisma = new PrismaClient();

async function run() {
  console.log("Testing Point Ledger...");
  try {
    // 1. Get Admin User
    const loginResult = await authService.login("admin@pilahsampah.id", "password123");
    const userId = loginResult.user.id;
    console.log("Testing ledger for User ID:", userId);

    // 2. Insert dummy point history manually if none exists
    const points = await prisma.pointHistory.findMany({ where: { userId } });
    if (points.length === 0) {
      console.log("No points found, inserting mock point data...");
      await prisma.pointHistory.createMany({
        data: [
          { userId, points: 50, description: "Sampah Plastik 1 Kg" },
          { userId, points: 150, description: "Sampah Organik 1.5 Kg" }
        ]
      });
    }

    // 3. Get Ledger via service
    const ledger = await pointService.getLedger(userId);
    console.log("Total Points:", ledger.totalPoints);
    console.log("History Length:", ledger.history.length);

    if (ledger.totalPoints > 0 && ledger.history.length > 0) {
      console.log("✅ Point Ledger Test Passed!");
      console.log("Recent History:", ledger.history.slice(0, 2));
    } else {
      console.log("❌ Point Ledger Test Failed.");
    }
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
