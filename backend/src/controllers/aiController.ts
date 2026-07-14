import { Request, Response } from "express";
import { aiService } from "../services/aiService.js";

export class AiController {
  /**
   * Mock AI Waste Detection using concurrent Redis queues
   */
  async detect(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const imageUrl = req.body.imageUrl || "";

      const result = await aiService.detectWasteMock(userId, imageUrl);

      res.status(200).json({
        success: true,
        requestId: (result as any).requestId,
        data: result
      });
      
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") {
        res.status(429).json({
          error: "QUOTA_EXCEEDED",
          message: "Batas harian request AI terlampaui. Coba lagi besok."
        });
      } else if (error.message === "AI_TIMEOUT") {
        res.status(408).json({
          error: "AI_TIMEOUT",
          message: "Waktu deteksi AI habis (Timeout > 2000ms). Silakan coba lagi."
        });
      } else if (error.message === "IMAGE_UNREADABLE") {
        res.status(422).json({
          error: "IMAGE_UNREADABLE",
          message: "Gambar buram atau jenis sampah tidak teridentifikasi."
        });
      } else {
        console.error("AI Detect Error:", error);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memproses deteksi AI" });
      }
    }
  }
}

export const aiController = new AiController();
