import { PrismaClient } from "@prisma/client";
import { binService } from "./src/services/binService.js";
import { authService } from "./src/services/authService.js";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function run() {
  console.log("Testing Bin Scan & Geofencing...");
  try {
    // 1. Get Admin User
    const loginResult = await authService.login("admin@pilahsampah.id", "password123");
    const userId = loginResult.user.id;

    // 2. Setup RT/RW, Category, Bin, Household
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
    
    const catOrganic = await prisma.wasteCategory.upsert({
      where: { name: "ORGANIC" },
      update: { pointsPerKg: 100 },
      create: { name: "ORGANIC", description: "Sampah Organik", pointsPerKg: 100 }
    });
    const catNonOrganic = await prisma.wasteCategory.upsert({
      where: { name: "NON_ORGANIC" },
      update: { pointsPerKg: 50 },
      create: { name: "NON_ORGANIC", description: "Sampah Anorganik", pointsPerKg: 50 }
    });

    const binQr = "QR-TEST-" + uuidv4().slice(0, 5);
    const bin = await prisma.bin.create({
      data: {
        qrCode: binQr,
        categoryId: catOrganic.id,
        maxCapacityLiter: 25.0,
        currentVolumeLiter: 5.0,
        rtRwId: rtrw.id,
        latitude: -6.8912345, // Exact same location
        longitude: 107.6123456
      }
    });

    let household = await prisma.household.findFirst({ where: { userId } });
    if (!household) {
      household = await prisma.household.create({
        data: {
          userId,
          address: "Jl. Test 1",
          rtRwId: rtrw.id,
          latitude: -6.8912345,
          longitude: 107.6123456
        }
      });
    }

    // Test 1: Out of range (> 10m)
    // 0.0001 deg is roughly 11 meters
    try {
      console.log("Test 1: Out of Range (Expecting LOCATION_OUT_OF_RANGE error)");
      await binService.processScan(
        binQr,
        userId,
        household.id,
        "ORGANIC",
        2.5,
        -6.8913445, // ~12 meters away
        107.6123456
      );
      console.log("❌ Test 1 Failed: Should have thrown an error!");
    } catch (e: any) {
      if (e.message === "LOCATION_OUT_OF_RANGE") {
        console.log("✅ Test 1 Passed! Distance:", e.distanceMeters, "m");
      } else {
        console.error("❌ Test 1 Failed with unexpected error:", e);
      }
    }

    // Test 2: In range
    try {
      console.log("\nTest 2: In Range (Same coordinate)");
      const res = await binService.processScan(
        binQr,
        userId,
        household.id,
        "ORGANIC",
        2.5, // Liters
        -6.8912345,
        107.6123456
      );
      // Volume = 2.5 L. Organic Density = 0.4. Weight = 1.0 kg. Points = 100 * 1.0 = 100.
      console.log("✅ Test 2 Passed!", res);
      if (res.pointsAwarded === 100 && res.weightKg === 1) {
        console.log("✅ Points correctly calculated!");
      } else {
        console.log("❌ Points calculation failed.");
      }
    } catch (e: any) {
      console.error("❌ Test 2 Failed with error:", e);
    }

    // Test 3: Overflow
    try {
      console.log("\nTest 3: Bin Overflow (Expecting BIN_OVERFLOW error)");
      await binService.processScan(
        binQr,
        userId,
        household.id,
        "ORGANIC",
        30.0, // Liters, max is 25
        -6.8912345,
        107.6123456
      );
      console.log("❌ Test 3 Failed: Should have thrown an error!");
    } catch (e: any) {
      if (e.message === "BIN_OVERFLOW") {
        console.log("✅ Test 3 Passed! Overflow prevented.");
      } else {
        console.error("❌ Test 3 Failed with unexpected error:", e);
      }
    }

  } catch (error) {
    console.error("Fatal Test error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
