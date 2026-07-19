/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { aiService } from "../services/aiService.js";
import { redisService } from "../services/redisService.js";

export class AiController {
  /**
   * Mock AI Waste Detection using concurrent Redis queues
   */
  async detect(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const imageUrl = req.body.imageUrl || "";

      const result = await aiService.detectWasteMock(userId, imageUrl);
      const quotaRemaining = await redisService.getRemainingQuota(userId);

      res.status(200).json({
        success: true,
        requestId: (result as any).requestId,
        data: {
          ...result,
          quotaRemaining,
        },
      });
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") {
        res.status(429).json({
          error: "QUOTA_EXCEEDED",
          message: "Batas harian request AI terlampaui. Coba lagi besok.",
        });
      } else if (error.message === "AI_TIMEOUT") {
        res.status(408).json({
          error: "AI_TIMEOUT",
          message: "Waktu deteksi AI habis (Timeout > 2000ms). Silakan coba lagi.",
        });
      } else if (error.message === "IMAGE_UNREADABLE") {
        res.status(422).json({
          error: "IMAGE_UNREADABLE",
          message: "Gambar buram atau jenis sampah tidak teridentifikasi.",
        });
      } else {
        console.error("AI Detect Error:", error);
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memproses deteksi AI" });
      }
    }
  }

  /**
   * Handle Waste Image Upload
   */
  async uploadWastePhoto(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "BAD_REQUEST", message: "File gambar tidak ditemukan" });
        return;
      }
      const filePath = `/uploads/${req.file.filename}`;
      res.status(200).json({
        success: true,
        data: {
          imageUrl: filePath,
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengunggah gambar sampah" });
    }
  }

  /**
   * Handle Waste Image Upload + Detect in one step (For Mobile App)
   */
  async detectCombined(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      if (!req.file) {
        res
          .status(400)
          .json({ error: "BAD_REQUEST", message: "File gambar (image) tidak ditemukan" });
        return;
      }

      const filePath = `/uploads/${req.file.filename}`;
      const result = await aiService.detectWasteMock(userId, filePath);
      const quotaRemaining = await redisService.getRemainingQuota(userId);

      res.status(200).json({
        success: true,
        requestId: (result as any).requestId,
        data: {
          ...result,
          quotaRemaining,
        },
      });
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") {
        res.status(429).json({
          error: "QUOTA_EXCEEDED",
          message: "Batas harian request AI terlampaui. Coba lagi besok.",
        });
      } else if (error.message === "AI_TIMEOUT") {
        res.status(408).json({
          error: "AI_TIMEOUT",
          message: "Waktu deteksi AI habis (Timeout > 2000ms). Silakan coba lagi.",
        });
      } else if (error.message === "IMAGE_UNREADABLE") {
        res.status(422).json({
          error: "IMAGE_UNREADABLE",
          message: "Gambar buram atau jenis sampah tidak teridentifikasi.",
        });
      } else {
        console.error("AI Detect Error:", error);
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memproses deteksi AI" });
      }
    }
  }
}

export const aiController = new AiController();
