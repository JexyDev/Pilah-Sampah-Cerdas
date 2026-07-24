import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const API_URL = 'http://localhost:3000/api/v1';

async function runTest() {
  console.log("=== START E2E DEMO TEST ===");
  try {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    // Find Role IDs
    const mahasiswaRole = await prisma.role.findFirst({ where: { name: 'MAHASISWA_KKN' } });
    const wargaRole = await prisma.role.findFirst({ where: { name: 'WARGA' } });

    // Create Mahasiswa
    const mahasiswa = await prisma.user.upsert({
      where: { email: 'mhs.demo@psc.id' },
      update: { password: hashedPassword },
      create: {
        name: 'Mhs Demo',
        email: 'mhs.demo@psc.id',
        password: hashedPassword,
        phone: '+628999123456',
        nik: '1234567890123456',
        roleId: mahasiswaRole!.id,
        status: 'Aktif'
      }
    });
    console.log("Mahasiswa created:", mahasiswa.email);

    // Create Warga
    const warga = await prisma.user.upsert({
      where: { email: 'warga.demo@psc.id' },
      update: { password: hashedPassword },
      create: {
        name: 'Warga Demo',
        email: 'warga.demo@psc.id',
        password: hashedPassword,
        phone: '+628999654321',
        nik: '6543210987654321',
        roleId: wargaRole!.id,
        status: 'Aktif'
      }
    });
    console.log("Warga created:", warga.email);

    // Create Household for Warga if not exists
    let household = await prisma.household.findFirst({ where: { userId: warga.id } });
    if (!household) {
      const rtRw = await prisma.rtRwArea.findFirst();
      household = await prisma.household.create({
        data: {
          address: 'Jl. Demo No 1',
          userId: warga.id,
          rtRwId: rtRw!.id,
          latitude: -6.8915,
          longitude: 107.610
        }
      });
    }

    // Get an unassigned QR Code
    const organicCategory = await prisma.wasteCategory.findFirst({ where: { name: 'Organik' } });
    let bin = await prisma.bin.findFirst({
      where: { categoryId: organicCategory!.id, status: { in: ['PRINTED', 'ASSIGNED_TO_PIC'] } }
    });

    if (!bin) {
      // Just grab any bin and force it for the test
      bin = await prisma.bin.findFirst({ where: { categoryId: organicCategory!.id } });
      await prisma.bin.update({
        where: { id: bin!.id },
        data: { status: 'PRINTED', userId: null }
      });
    }

    console.log("Found Bin to activate:", bin!.qrCode);

    // Clean up any existing ownership for demo warga
    await prisma.binOwnership.deleteMany({
      where: { userId: warga.id }
    });

    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+628999654321', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log("Login Data:", loginData);
    const wargaToken = loginData.data?.accessToken;

    console.log("Warga logged in, activating bin...");

    // Warga activates bin
    try {
      const activateRes = await fetch(`${API_URL}/bins/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${wargaToken}`
        },
        body: JSON.stringify({
          qrCodes: [bin!.qrCode],
          latitude: -6.8915,
          longitude: 107.610
        })
      });
      const activateData = await activateRes.json();
      if (!activateRes.ok) {
        throw new Error(JSON.stringify(activateData));
      }
      console.log("Activation success:", activateData.success);
    } catch (e: any) {
      console.error("Activation failed:", e.message);
      if (!e.message.includes("BIN_CATEGORY_DUPLICATE")) {
        throw e;
      }
    }

    // Approve the bin manually for test (since Warga activation makes it PENDING_APPROVAL)
    await prisma.bin.update({
      where: { id: bin!.id },
      data: { status: 'ACTIVE_BOUND' }
    });
    console.log("Bin approved to ACTIVE_BOUND.");

    // Scan Trash! (Mock AI)
    console.log("Simulating AI scan and sending trash deposit...");
    try {
      const scanRes = await fetch(`${API_URL}/bins/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${wargaToken}`
        },
        body: JSON.stringify({
          qrCode: bin!.qrCode,
          detectedType: "Organik",
          estimatedVolume: 2.5, // liter
          householdId: household.id,
          userLat: -6.8915,
          userLng: 107.610,
          aiConfidence: 0.95,
          evidencePhotoUrl: "mock_photo.jpg",
          detections: [
            { detectedType: "Organik", volumeEstimate: 2.5, confidence: 0.95 }
          ]
        })
      });
      const scanData = await scanRes.json();
      if (!scanRes.ok) {
        throw new Error(JSON.stringify(scanData));
      }
      console.log("Scan success! Transaction ID:", scanData.data?.id);
    } catch (e: any) {
      console.error("Scan failed:", e.message);
      throw e;
    }

    const tx = await prisma.wasteLog.findFirst({
      where: { householdId: household!.id },
      orderBy: { createdAt: 'desc' }
    });
    console.log("Latest Transaction found:", tx ? "YES" : "NO");

    const points = await prisma.pointHistory.findFirst({
      where: { userId: warga.id },
      orderBy: { createdAt: 'desc' }
    });
    console.log("Warga points from transaction:", points?.points || 0);
    if ((points?.points || 0) > 0) {
      console.log("SUCCESS! Points were added.");
    } else {
      console.log("FAILED! Points were NOT added.");
    }

    console.log("=== END E2E DEMO TEST ===");

  } catch (error: any) {
    console.error("TEST FAILED:", error.stack || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
