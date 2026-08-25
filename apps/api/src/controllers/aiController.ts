import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { aiService } from "../services/aiService.js";
import { redisService } from "../services/redisService.js";
import { WasteAiAdapterFactory } from "../infrastructure/ai/WasteAiAdapterFactory.js";


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
          error: "AI_DAILY_LIMIT",
          code: "AI_DAILY_LIMIT",
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
      console.error("[AiController] uploadImage error:", error);
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
      const evidencePhotoUrl = `${req.protocol}://${req.get("host")}${filePath}`;
      const result = await aiService.detectWasteMock(userId, filePath, req.file.path);
      const quotaRemaining = await redisService.getRemainingQuota(userId);

      const weightKg = Number((((result as any).volumeEstimate || 2.5) * 0.4).toFixed(2)) || 1.0;
      const confidence = (result as any).confidence || 0.94;
      const organicPercentage = ((result as any).organik_percent ?? 94) / 100;
      const estimatedPoints = Math.round(weightKg * 100.0 * confidence * 0.9) || 85;

      res.status(200).json({
        success: true,
        requestId: (result as any).requestId,
        data: {
          detectedType: (result as any).detectedType || "ORGANIC",
          volumeEstimate: (result as any).volumeEstimate || 2.5,
          weightKg,
          confidence,
          organicPercentage,
          estimatedPoints,
          isBlurry: (result as any).isBlurry || false,
          requestId: (result as any).requestId,
          quotaRemaining,
          evidencePhotoUrl,
          ...result,
        },
      });
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") {
        res.status(429).json({
          error: "AI_DAILY_LIMIT",
          code: "AI_DAILY_LIMIT",
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
   * Submit Petugas Residu actual report for a WasteLog
   */
  async submitReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { actualWeight, manualClassification, geolocation } = req.body;
      if (actualWeight === undefined || !manualClassification || !geolocation) {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "actualWeight, manualClassification, dan geolocation wajib diisi",
        });
        return;
      }
      const petugasUserId = req.user!.userId;
      const log = await aiService.submitPetugasReport(
        id,
        petugasUserId,
        Number(actualWeight),
        manualClassification,
        geolocation
      );
      res
        .status(200)
        .json({ success: true, message: "Laporan aktual petugas berhasil disimpan", data: log });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Resolve discrepancy by Admin DLH
   */
  async resolveDiscrepancy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { finalClassification, finalWeight } = req.body;
      if (!finalClassification) {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "finalClassification wajib diisi",
        });
        return;
      }
      const adminUserId = req.user!.userId;
      const log = await aiService.resolveDiscrepancy(
        id,
        finalClassification,
        adminUserId,
        finalWeight
      );
      res
        .status(200)
        .json({ success: true, message: "Discrepancy laporan berhasil diselesaikan", data: log });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Get Warga compliance score
   */
  async getComplianceScore(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const score = await aiService.calculateComplianceScore(userId);
      res.status(200).json({ success: true, complianceScore: score });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Get dynamic avoided greenhouse gas statistics
   */
  async getCo2eStats(req: Request, res: Response): Promise<void> {
    try {
      const organicLogs = await prisma.setoranOtomatis.findMany({
        where: {
          hasilKlasifikasiAi: "organik",
        },
        select: {
          berat: true,
        },
      });

      const totalWeight = organicLogs.reduce((acc: number, l: any) => acc + Number(l.berat), 0);
      const co2eAvoided = await aiService.calculateCo2eAvoided(totalWeight);

      res.status(200).json({
        success: true,
        totalOrganicWeightKg: totalWeight,
        co2eAvoidedKg: co2eAvoided,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Mock AI volume estimation
   */
  async estimateVolume(req: Request, res: Response): Promise<void> {
    try {
      let imageUrl = req.body.imageUrl || "";
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }
      const data = await aiService.estimateVolume(imageUrl);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  async getDiscrepancies(req: Request, res: Response): Promise<void> {
    try {
      const { status, startDate, endDate } = req.query;
      const data = await aiService.getDiscrepancies(
        status as string | undefined,
        startDate as string | undefined,
        endDate as string | undefined
      );
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[AiController] getDiscrepancies error:", error);
      res
        .status(500)
        .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Mock AI classification for BantuWargaForm and other features
   */
  async classifyMock(req: Request, res: Response): Promise<void> {
    try {
      let imageUrl = req.body.imageUrl || "";
      let imagePath = "";

      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
        imagePath = req.file.path;
      }

      const adapter = WasteAiAdapterFactory.getAdapter();
      const result = await adapter.classifyWaste({ imageUrl, imagePath });

      // Calculate organik & non-organik percentages if not calculated by adapter (fallback)
      const organik_percent =
        (result.rawPayload as any)?.organik_percent ??
        (result.detectedType === "ORGANIC" ? 100 : 0);
      const non_organik_percent =
        (result.rawPayload as any)?.non_organik_percent ??
        (result.detectedType === "NON_ORGANIC" ? 100 : 0);

      res.status(200).json({
        success: true,
        data: {
          detectedType: result.detectedType,
          confidenceScore: result.confidenceScore,
          estimatedVolumeLiter: result.estimatedVolumeLiter,
          organik_percent,
          non_organik_percent,
          vendorName: result.vendorName,
          annotatedImageBase64: result.annotatedImageBase64,
          imageUrl,
        },
      });
    } catch (error: any) {
      if (error.message === "NO_WASTE_DETECTED") {
        res.status(422).json({
          success: false,
          code: "NO_WASTE_DETECTED",
          message:
            "Tidak terdeteksi objek sampah pada gambar (Tingkat Keyakinan AI < 40%). Coba foto objek sampah dengan pencahayaan dan jarak yang lebih jelas.",
        });
      } else if (error.message === "IMAGE_UNREADABLE") {
        res.status(422).json({
          success: false,
          code: "IMAGE_UNREADABLE",
          message: "Gambar buram atau tidak dapat dibaca oleh AI.",
        });
      } else {
        res
          .status(500)
          .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }
  }
}

export const aiController = new AiController();
