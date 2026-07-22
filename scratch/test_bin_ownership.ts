import { PrismaClient } from "@prisma/client";
import { binService } from "../src/services/binService.js";
import { authService } from "../src/services/authService.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function run() {
  console.log("Testing Bin Ownership and Validation...");
  try {
    // 1. Get Warga 1 (Dewi Lestari, owner of TS-COB-001)
    console.log("Logging in Warga 1 (Owner of TS-COB-001)...");
    const loginResult1 = await authService.login("warga@psc.id", "password123");
    const user1Id = loginResult1.user.id;

    // 2. Create Warga 2 (Not Owner)
    console.log("Creating and logging in Warga 2 (Non-owner)...");
    const roleWarga = await prisma.role.findUnique({ where: { name: "WARGA" } });
    if (!roleWarga) throw new Error("WARGA role not found");

    const passwordHash = await bcrypt.hash("password123", 10);
    const warga2 = await prisma.user.upsert({
      where: { email: "warga2@psc.id" },
      update: {},
      create: {
        email: "warga2@psc.id",
        name: "Warga Kedua",
        password: passwordHash,
        roleId: roleWarga.id,
        nik: "3273012345678999",
        status: "Aktif",
      },
    });

    const loginResult2 = await authService.login("warga2@psc.id", "password123");
    const user2Id = loginResult2.user.id;

    // 3. Find the Bin TS-COB-001
    const bin = await prisma.bin.findUnique({
      where: { qrCode: "TS-COB-001" },
    });
    if (!bin) throw new Error("TS-COB-001 not found");
    console.log(`TS-COB-001 currently owned by User ID: ${bin.userId}`);

    // Create Household for Warga 1 if not exists
    let household1 = await prisma.household.findFirst({ where: { userId: user1Id } });
    if (!household1) {
      household1 = await prisma.household.create({
        data: {
          userId: user1Id,
          address: "Jl. Owner 1",
          rtRwId: bin.rtRwId,
          latitude: -6.8895,
          longitude: 107.6108,
        },
      });
    }

    // Create Household for Warga 2 if not exists
    let household2 = await prisma.household.findFirst({ where: { userId: user2Id } });
    if (!household2) {
      household2 = await prisma.household.create({
        data: {
          userId: user2Id,
          address: "Jl. Non-Owner 2",
          rtRwId: bin.rtRwId,
          latitude: -6.8895,
          longitude: 107.6108,
        },
      });
    }

    // Test A: Warga 1 (Owner) scans their own bin
    console.log("\n--- Test A: Owner Scans Own Bin (Expecting Success) ---");
    const resA = await binService.processScan(
      "TS-COB-001",
      user1Id,
      household1.id,
      "ORGANIC",
      1.0, // Volume
      -6.8895, // Latitude in range
      107.6108 // Longitude in range
    );
    console.log("✅ Test A Passed! Scan successful, points awarded:", resA.pointsAwarded);

    // Test B: Warga 2 (Non-owner) scans Warga 1's bin
    console.log("\n--- Test B: Non-owner Scans Bin (Expecting BIN_NOT_OWNED Error) ---");
    try {
      await binService.processScan(
        "TS-COB-001",
        user2Id,
        household2.id,
        "ORGANIC",
        1.0,
        -6.8895,
        107.6108
      );
      console.error("❌ Test B Failed: Scan by non-owner should have been rejected!");
    } catch (e: any) {
      if (e.message === "BIN_NOT_OWNED") {
        console.log("✅ Test B Passed! Successfully blocked unauthorized citizen scanning the bin.");
      } else {
        console.error("❌ Test B Failed with unexpected error:", e);
      }
    }

    // Clean up Warga 2 and their household/waste logs if any
    console.log("\nCleaning up Warga 2 test data...");
    await prisma.wasteLog.deleteMany({ where: { householdId: household2.id } });
    await prisma.household.delete({ where: { id: household2.id } });
    await prisma.refreshToken.deleteMany({ where: { userId: user2Id } });
    await prisma.pointHistory.deleteMany({ where: { userId: user2Id } });
    await prisma.notification.deleteMany({ where: { userId: user2Id } });
    await prisma.user.delete({ where: { id: user2Id } });
    console.log("Cleanup finished.");

  } catch (error) {
    console.error("Fatal test error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
