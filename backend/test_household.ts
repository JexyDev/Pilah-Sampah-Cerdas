import { PrismaClient } from "@prisma/client";
import { householdService } from "./src/services/householdService.js";
import { authService } from "./src/services/authService.js";

const prisma = new PrismaClient();

async function run() {
  console.log("Testing Household Registration...");
  try {
    // 1. Login to get User ID
    const loginResult = await authService.login("admin@pilahsampah.id", "password123");
    const userId = loginResult.user.id;
    console.log("Logged in as User ID:", userId);

    // 2. Setup RT/RW and Kelurahan
    const kel = await prisma.kelurahan.upsert({
      where: { name: "Test Kelurahan" },
      update: {},
      create: { name: "Test Kelurahan" }
    });
    
    const rtrw = await prisma.rtRwArea.upsert({
      where: { kelurahanId_name: { kelurahanId: kel.id, name: "RT 01 / RW 01" } },
      update: {},
      create: { kelurahanId: kel.id, name: "RT 01 / RW 01" }
    });

    // 3. Delete existing household for this user and RT/RW if exists
    await prisma.household.deleteMany({
      where: { userId: userId, rtRwId: rtrw.id }
    });

    // 4. Register Household
    const household = await householdService.registerHousehold(
      userId,
      "Jl. Testing Cerdas No. 123",
      rtrw.id,
      -6.8912345,
      107.6123456
    );
    console.log("Household Registered Successfully:", household.id);

    // 5. Get My Households
    const myHouseholds = await householdService.getHouseholdsByUser(userId);
    console.log("My Households Count:", myHouseholds.length);

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
