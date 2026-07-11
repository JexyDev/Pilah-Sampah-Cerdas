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

/**
 * @swagger
 * /api/v1/waste/detect-mock:
 *   post:
 *     summary: Simulasi Deteksi Gambar Sampah AI
 *     description: Mengirim gambar sampah untuk dideteksi kategorinya secara otomatis menggunakan antrian Redis FIFO dengan limitasi kuota harian.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID User yang melakukan request
 *                 example: "usr-12345"
 *               imageUrl:
 *                 type: string
 *                 description: URL gambar sampah yang diunggah
 *                 example: "http://mock-storage/waste.jpg"
 *     responses:
 *       200:
 *         description: Deteksi berhasil
 *       400:
 *         description: Bad Request (Missing parameter)
 *       429:
 *         description: Quota Exceeded (Batas harian terlampaui)
 *       408:
 *         description: AI Timeout (Proses deteksi melebihi 2 detik)
 */
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
        categoryId: "ORGANIC",
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
