import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { redisService } from "../services/redisService.js";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();
const router = Router();

// Density configurations (Kg per Liter)
const DENSITY = {
  ORGANIC: 0.4,      // Organic waste is denser
  NON_ORGANIC: 0.2   // Non-organic (plastic, paper, etc.) is lighter
};

// 1. POST /api/v1/waste/detect-mock
// Simulate AI Image Detection with Redis queues, timeout, and quotas
router.post("/waste/detect-mock", async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body." });
  }

  // Check quota
  const hasQuota = await redisService.checkAndUseQuota(userId);
  if (!hasQuota) {
    return res.status(429).json({
      error: "QUOTA_EXCEEDED",
      message: "Batas harian request AI terlampaui. Coba lagi besok."
    });
  }

  const requestId = uuidv4();

  try {
    // Enqueue the AI Task into FIFO Queue
    const result = await redisService.enqueueAiTask(() => {
      return new Promise((resolve, reject) => {
        // Decide AI computation duration (15% chance of timeout > 2000ms)
        const isTimeout = Math.random() < 0.15;
        const duration = isTimeout ? 2500 : 1200;

        // 20% chance of image unreadable failure
        const isUnreadable = Math.random() < 0.20;

        const timeoutId = setTimeout(() => {
          if (isTimeout) {
            reject(new Error("AI_TIMEOUT"));
          } else if (isUnreadable) {
            reject(new Error("IMAGE_UNREADABLE"));
          } else {
            const types = ["ORGANIC", "NON_ORGANIC"];
            const detectedType = types[Math.floor(Math.random() * types.length)];
            // Estimate volume between 1.5 and 6.0 Liters
            const volumeEstimate = parseFloat((Math.random() * 4.5 + 1.5).toFixed(2));
            resolve({
              requestId,
              detectedType,
              volumeEstimate,
              isBlurry: false
            });
          }
        }, duration);

        // Standard 2-second threshold for client response timeout
        setTimeout(() => {
          clearTimeout(timeoutId);
          reject(new Error("AI_TIMEOUT"));
        }, 2000);
      });
    });

    // Write Success Log
    try {
      await prisma.aiRequestLog.create({
        data: {
          userId,
          requestId,
          imageUrl: req.body.imageUrl || "http://mock-storage/waste.jpg",
          resultStatus: "SUCCESS"
        }
      });
    } catch (dbErr) {
      console.warn("Failed to write success log to DB, continuing anyway.");
    }

    return res.status(200).json({
      success: true,
      requestId,
      data: result
    });

  } catch (error: any) {
    console.error(`AI Detection Request ${requestId} failed:`, error.message);

    // Write Failed Log to Database
    const failureStatus = error.message === "AI_TIMEOUT" ? "TIMEOUT" : "IMAGE_UNREADABLE";
    try {
      await prisma.aiRequestLog.create({
        data: {
          userId,
          requestId,
          imageUrl: req.body.imageUrl || "http://mock-storage/waste.jpg",
          resultStatus: failureStatus
        }
      });
    } catch (dbErr) {
      // Ignored for standalone mode
    }

    // Quota Refund if error occurred
    await redisService.refundQuota(userId);

    if (error.message === "AI_TIMEOUT") {
      return res.status(408).json({
        error: "AI_TIMEOUT",
        message: "Waktu deteksi AI habis (Timeout > 2000ms). Silakan coba lagi."
      });
    }

    return res.status(422).json({
      error: "IMAGE_UNREADABLE",
      message: "Gambar buram atau jenis sampah tidak teridentifikasi."
    });
  }
});

// 2. GET /api/bins/:id/status
router.get("/bins/:id/status", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const bin = await prisma.bin.findUnique({
      where: { id },
      include: { rtRw: true }
    });

    if (!bin) {
      // Return a mock bin if database is empty/unconfigured for ease of testing
      return res.status(200).json({
        id,
        qrCode: `QR-BIN-${id.slice(0, 5).toUpperCase()}`,
        type: "ORGANIC",
        maxCapacityLiter: 25.0,
        currentVolumeLiter: 5.4,
        rtRw: { name: "RT 01 / RW 05" }
      });
    }

    return res.status(200).json(bin);
  } catch (err) {
    return res.status(500).json({ error: "Database error fetching bin status." });
  }
});

// 3. POST /api/bins/scan
// Handle bin QR scans, validate capacities, convert weights, assign points and trigger alerts
router.post("/bins/scan", async (req: Request, res: Response) => {
  const { qrCode, userId, detectedType, estimatedVolume, householdId } = req.body;

  if (!qrCode || !userId || !detectedType || !estimatedVolume || !householdId) {
    return res.status(400).json({ error: "Missing required fields (qrCode, userId, detectedType, estimatedVolume, householdId)." });
  }

  try {
    // 1. Find the Bin matching QR Code
    let bin = await prisma.bin.findUnique({
      where: { qrCode }
    });

    // Create a mock bin if not found in db for ease of direct API test
    if (!bin) {
      const area = await prisma.rtRwArea.findFirst() || await prisma.rtRwArea.create({ data: { name: "RT 01 / RW 05" } });
      bin = await prisma.bin.create({
        data: {
          qrCode,
          type: detectedType === "NON_ORGANIC" ? "NON_ORGANIC" : "ORGANIC",
          maxCapacityLiter: 25.0,
          currentVolumeLiter: 10.0,
          rtRwId: area.id
        }
      });
    }

    // 2. Validate trash type matching
    if (bin.type !== detectedType) {
      return res.status(400).json({
        error: "INVALID_BIN_TYPE",
        message: `Tong tidak sesuai! Anda memasukkan sampah ${detectedType} ke tong sampah khusus ${bin.type}.`
      });
    }

    // 3. Check remaining capacity (Max 25L)
    const current = Number(bin.currentVolumeLiter);
    const est = Number(estimatedVolume);
    const max = Number(bin.maxCapacityLiter);

    if (current + est > max) {
      // Create user notification for overflow
      await prisma.notification.create({
        data: {
          userId,
          title: "Tong Sampah Penuh!",
          message: `Tong sampah ${bin.qrCode} hampir meluap. Kapasitas maksimum 25 Liter terlampaui.`
        }
      });

      return res.status(400).json({
        error: "BIN_OVERFLOW",
        status: "Selesai - Tidak Tersimpan",
        message: "Penyimpanan ditolak karena sisa kapasitas tong tidak mencukupi (Kapasitas Maks: 25 Liter)."
      });
    }

    // 4. Update Bin current volume
    const newVolume = current + est;
    await prisma.bin.update({
      where: { id: bin.id },
      data: { currentVolumeLiter: newVolume }
    });

    // 5. Convert liters to weight based on density
    const factor = bin.type === "ORGANIC" ? DENSITY.ORGANIC : DENSITY.NON_ORGANIC;
    const weightKg = parseFloat((est * factor).toFixed(2));

    // 6. Create Waste Log
    const wasteLog = await prisma.wasteLog.create({
      data: {
        householdId,
        binId: bin.id,
        weightKg,
        volumeLiter: est,
        type: bin.type,
        requestId: uuidv4() // Generate standard mock request UUID
      }
    });

    // 7. Calculate and assign points (e.g. 100 points per kg)
    const calculatedPoints = Math.round(weightKg * 100);
    if (calculatedPoints > 0) {
      await prisma.pointHistory.create({
        data: {
          userId,
          points: calculatedPoints,
          description: `Disetor sampah ${bin.type} seberat ${weightKg} kg.`
        }
      });
    }

    // 8. Create Success Notification
    await prisma.notification.create({
      data: {
        userId,
        title: "Pencatatan Berhasil",
        message: `Sampah seberat ${weightKg} kg berhasil dicatat. Anda mendapatkan ${calculatedPoints} poin!`
      }
    });

    return res.status(200).json({
      success: true,
      message: "Transaksi berhasil dicatat dan poin telah ditambahkan.",
      data: {
        wasteLogId: wasteLog.id,
        weightKg,
        volumeLiter: est,
        pointsAwarded: calculatedPoints,
        newBinVolume: newVolume
      }
    });

  } catch (err: any) {
    console.error("Scan API Error:", err);
    return res.status(500).json({ error: "Failed to process QR Code scan transaction.", details: err.message });
  }
});

// 4. POST /api/bins/:id/empty
router.post("/bins/:id/empty", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.bin.update({
      where: { id },
      data: { currentVolumeLiter: 0.0 }
    });

    return res.status(200).json({
      success: true,
      message: "Kapasitas tong sampah berhasil dikosongkan ke 0 Liter."
    });
  } catch (err) {
    // If not found in db, just mock return
    return res.status(200).json({
      success: true,
      message: "Kapasitas tong sampah berhasil dikosongkan ke 0 Liter (Mock Mode)."
    });
  }
});

export default router;
