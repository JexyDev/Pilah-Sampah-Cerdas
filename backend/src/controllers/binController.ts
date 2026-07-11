import { Request, Response } from "express";
import { z } from "zod";
import { binService } from "../services/binService.js";

const scanSchema = z.object({
  qrCode: z.string().min(1, "QR Code diperlukan"),
  detectedType: z.string().min(1, "Jenis sampah terdeteksi diperlukan"),
  estimatedVolume: z.number().positive("Volume harus positif"),
  householdId: z.string().uuid("Household ID tidak valid"),
  userLat: z.number().min(-90).max(90).optional(),
  userLng: z.number().min(-180).max(180).optional(),
});

export class BinController {
  /**
   * Handle QR Scan Request
   */
  async scan(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      
      const parsed = scanSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({ error: "VALIDATION_ERROR", details: parsed.error.format() });
        return;
      }
      
      const { qrCode, detectedType, estimatedVolume, householdId, userLat, userLng } = parsed.data;

      const result = await binService.processScan(
        qrCode,
        userId,
        householdId,
        detectedType,
        estimatedVolume,
        userLat,
        userLng
      );

      res.status(200).json({
        success: true,
        data: result
      });
      
    } catch (error: any) {
      if (error.message === "BIN_NOT_FOUND") {
        res.status(404).json({ error: "RESOURCE_NOT_FOUND", message: "QR Code Tong Sampah tidak ditemukan" });
      } else if (error.message === "LOCATION_OUT_OF_RANGE") {
        res.status(400).json({ 
          error: "LOCATION_OUT_OF_RANGE", 
          message: "Lokasi Anda terlalu jauh dari tong sampah fisik (> 10m).",
          distanceMeters: error.distanceMeters 
        });
      } else if (error.message === "BIN_TYPE_MISMATCH") {
        res.status(400).json({ 
          error: "BIN_TYPE_MISMATCH", 
          message: `Tong tidak sesuai! Anda memasukkan sampah ke tong khusus ${error.binType}.` 
        });
      } else if (error.message === "BIN_OVERFLOW") {
        res.status(400).json({ 
          error: "BIN_OVERFLOW", 
          message: "Tong penuh! Penyimpanan ditolak karena sisa kapasitas tong tidak mencukupi (Kapasitas Maks: 25 Liter)." 
        });
      } else {
        console.error("Bin Scan Error:", error);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memproses pemindaian tong sampah" });
      }
    }
  }
}

export const binController = new BinController();
