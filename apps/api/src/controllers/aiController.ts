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
import { vlmVisionService } from "../services/vlmVisionService.js";
import { dashboardService } from "../services/dashboardService.js";
import fs from "fs";

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
      } else if (error.message === "IMAGE_UNREADABLE" || error.message === "NO_WASTE_DETECTED") {
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

      const detectedTypeStr = String((result as any).detectedType || "ORGANIC").toUpperCase();
      const isOrganic = detectedTypeStr === "ORGANIC";
      const densityFactor = isOrganic ? 0.4 : 0.2;
      const estimatedVol = Number((result as any).volumeEstimate) || 2.5;

      const weightKg = Number((estimatedVol * densityFactor).toFixed(2)) || (isOrganic ? 1.0 : 0.5);
      const rawConfidence = (result as any).confidence;
      const rawOrgPercent = (result as any).organik_percent;
      const rawNonOrgPercent = (result as any).non_organik_percent;

      let confidence = 0.94;
      if (rawOrgPercent !== undefined && rawNonOrgPercent !== undefined) {
        confidence = Number((Math.max(Number(rawOrgPercent), Number(rawNonOrgPercent)) / 100).toFixed(2));
      } else if (typeof rawConfidence === "number" && !isNaN(rawConfidence)) {
        confidence = rawConfidence > 1 ? Number((rawConfidence / 100).toFixed(2)) : Number(Number(rawConfidence).toFixed(2));
      }
      const confidencePercentage = Math.round(confidence * 100);

      const integerOrgPercent =
        rawOrgPercent !== undefined
          ? Math.min(100, Math.max(0, Math.round(Number(rawOrgPercent))))
          : (isOrganic ? confidencePercentage : 100 - confidencePercentage);
      const organicPercentage = Number((integerOrgPercent / 100).toFixed(2));
      const nonOrganicPercentage = 100 - integerOrgPercent;

      const estimatedPoints = Math.round(weightKg * 100.0 * confidence * 0.9) || (isOrganic ? 85 : 42);

      res.status(200).json({
        success: true,
        requestId: (result as any).requestId,
        data: {
          detectedType: (result as any).detectedType || "ORGANIC",
          volumeEstimate: (result as any).volumeEstimate || 2.5,
          weightKg,
          confidence,
          confidencePercentage,
          organicPercentage,
          organik_percent: integerOrgPercent,
          non_organik_percent: nonOrganicPercentage,
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
      } else if (error.message === "IMAGE_UNREADABLE" || error.message === "NO_WASTE_DETECTED") {
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
      // NOTE: adapter berbeda mengembalikan format berbeda -- VendorWasteAiAdapter (model asli)
      // pakai Bahasa Inggris uppercase ("ORGANIC"/"NON_ORGANIC"), sedangkan MockWasteAiAdapter
      // (fallback saat AI_VENDOR_PROVIDER tidak di-set) pakai Bahasa Indonesia lowercase
      // ("organik"/"anorganik"). toUpperCase() saja TIDAK cukup karena "organik".toUpperCase()
      // = "ORGANIK" (beda ejaan dari "ORGANIC", C vs K) -- makanya pakai startsWith("ORGAN")
      // yang cocok untuk kedua bahasa ("ORGANIC" & "ORGANIK" sama-sama diawali "ORGAN",
      // sedangkan "NON_ORGANIC" & "ANORGANIK" tidak).
      const isOrganicType = result.detectedType.toUpperCase().startsWith("ORGAN");
      const organik_percent =
        (result.rawPayload as any)?.organik_percent ?? (isOrganicType ? 100 : 0);
      const non_organik_percent =
        (result.rawPayload as any)?.non_organik_percent ?? (isOrganicType ? 0 : 100);

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

  /**
   * Deteksi Cerdas 3 Klasifikasi (Organik, Anorganik, Residu) + Visual Grounding Bounding Box
   * Endpoint: POST /api/v1/waste/vision-detect atau /api/v1/ai/vision-detect
   */
  async detectVisionBbox(req: Request, res: Response): Promise<void> {
    try {
      let imageBase64 = "";

      if (req.file) {
        const fileBuffer = fs.readFileSync(req.file.path);
        const mimeType = req.file.mimetype || "image/jpeg";
        imageBase64 = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
      } else if (req.body.imageBase64) {
        imageBase64 = req.body.imageBase64;
      } else if (req.body.imageUrl) {
        const imgUrl = String(req.body.imageUrl);
        if (imgUrl.startsWith("http")) {
          const fetchResp = await fetch(imgUrl);
          const arrBuf = await fetchResp.arrayBuffer();
          const mimeType = fetchResp.headers.get("content-type") || "image/jpeg";
          imageBase64 = `data:${mimeType};base64,${Buffer.from(arrBuf).toString("base64")}`;
        } else {
          // File lokal
          const clean = imgUrl.replace(/^\/?uploads\//, "");
          const localPath = `${process.cwd()}/uploads/${clean}`;
          if (fs.existsSync(localPath)) {
            const buf = fs.readFileSync(localPath);
            imageBase64 = `data:image/jpeg;base64,${buf.toString("base64")}`;
          }
        }
      }

      if (!imageBase64) {
        res.status(400).json({
          success: false,
          code: "IMAGE_REQUIRED",
          message: "Harap unggah file foto sampah atau sertakan data gambar base64.",
        });
        return;
      }

      const result = await vlmVisionService.detectWasteWithBoundingBox(imageBase64);

      res.status(200).json({
        success: true,
        data: {
          ...result,
          imageUrl: req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || undefined,
        },
      });
    } catch (error: any) {
      console.error("[AiController] detectVisionBbox error:", error);
      res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memproses analisis visual AI.",
      });
    }
  }

  /**
   * GET /api/v1/waste/baseline
   * Mengambil data baseline statis hasil survei lapangan KKN periode Juli 2026 (6 Kelurahan Coblong).
   * Data ini berstatus statis sebagai titik acuan awal (baseline) dan terisolasi dari filter waktu dinamis.
   */
  async getBaseline(req: Request, res: Response): Promise<void> {
    try {
      const surveyBaselines = await prisma.surveiKelurahan.findMany({
        include: { pemilahanSampah: true, volumeSampah: true },
        orderBy: { kelurahanId: "asc" },
      });

      const kelurahanList = [
        { id: "kel-cipaganti", name: "Cipaganti", defaultRw: 7, highRw: 2, estimasiRate: 13.67, estimasiKg: 1850.0 },
        { id: "kel-dago", name: "Dago", defaultRw: 13, highRw: 4, estimasiRate: 10.0, estimasiKg: 10983.0 },
        { id: "kel-lebakgede", name: "Lebak Gede", defaultRw: 13, highRw: 3, estimasiRate: 21.6, estimasiKg: 2973.5 },
        { id: "kel-lebaksiliwangi", name: "Lebak Siliwangi", defaultRw: 6, highRw: 2, estimasiRate: 15.0, estimasiKg: 2628.0 },
        { id: "kel-sadangserang", name: "Sadang Serang", defaultRw: 21, highRw: 8, estimasiRate: 24.8, estimasiKg: 9123.04 },
        { id: "kel-sekeloa", name: "Sekeloa", defaultRw: 16, highRw: 5, estimasiRate: 17.8, estimasiKg: 10803.78 },
      ];

      const kelurahanData = kelurahanList.map((k) => {
        const normK = k.name.toLowerCase().replace(/\s+/g, "");
        const b = surveyBaselines.find((s) =>
          s.namaKelurahan.toLowerCase().replace(/\s+/g, "").includes(normK)
        );

        let baselineRate: number | null = null;
        let volumeKg: number | null = null;
        let volumeOrganik: number | null = null;
        let volumeAnorganik: number | null = null;
        let volumeResidu: number | null = null;
        if (b?.pemilahanSampah) {
          if (b.pemilahanSampah.persentasePemilahan !== null && b.pemilahanSampah.persentasePemilahan !== undefined) {
            const val = Number(b.pemilahanSampah.persentasePemilahan);
            baselineRate = val <= 1 ? Number((val * 100).toFixed(2)) : Number(val.toFixed(2));
          }
        }

        // Gunakan estimasi/data baku survei awal KKN Juli 2026 jika tidak ada pada DB
        if (baselineRate === null && k.estimasiRate !== null) {
          baselineRate = k.estimasiRate;
        }

        if (b?.volumeSampah) {
          const totalVol = Number(b.volumeSampah.totalVolumeKgPerHari || 0);
          const org = b.volumeSampah.organikKgPerHari ? Number(b.volumeSampah.organikKgPerHari) : null;
          const rawAnorg = b.volumeSampah.anorganikKgPerHari ? Number(b.volumeSampah.anorganikKgPerHari) : null;
          const anorg = rawAnorg && rawAnorg > 10000 ? null : rawAnorg;
          const res = b.volumeSampah.residuKgPerHari ? Number(b.volumeSampah.residuKgPerHari) : null;

          volumeOrganik = org;
          volumeAnorganik = anorg;
          volumeResidu = res;

          // Utamakan total volume resmi survei KKN (total timbulan wilayah, konsisten dengan dashboardService)
          if (normK.includes("lebakgede")) {
            // Penyelarasan survei Coblong 38.361,32 kg/hari: Lebak Gede 2.973,50 kg/hari
            volumeKg = 2973.5;
            volumeOrganik = 200.0;
            volumeAnorganik = 50.0;
            volumeResidu = 2723.5;
          } else if (totalVol > 0) {
            if (normK.includes("lebaksiliwangi") && totalVol <= 50) {
              volumeKg = 2628.0; // Standar BPS: 4.172 jiwa x 0,63 kg/hari
            } else {
              volumeKg = Number(totalVol.toFixed(2));
            }
          } else if (org !== null || anorg !== null || res !== null) {
            volumeKg = Number(((org || 0) + (anorg || 0) + (res || 0)).toFixed(2));
          }
        }

        if (volumeKg === null && k.estimasiKg !== null) {
          volumeKg = k.estimasiKg;
        }

        let rawCatatan = b?.volumeSampah?.catatan || b?.pemilahanSampah?.catatan || null;
        if (!rawCatatan || rawCatatan.includes("Tidak diisi")) {
          if (k.name === "Cipaganti") {
            rawCatatan = "Organik 200 kg/hari (terserap budidaya maggot RT 07), Anorganik 80 kg/hari (Bank Sampah RW 02 & Kelurahan). Total timbulan percontohan 1.850 kg/hari.";
          }
        }

        return {
          id: k.id,
          kelurahan: k.name,
          kepatuhanBaseline: baselineRate,
          volumeBaselineKg: volumeKg,
          volumeOrganik,
          volumeAnorganik,
          volumeResidu,
          jumlahRw: b?.jumlahRw ?? k.defaultRw,
          rwKepatuhanTinggi: k.highRw,
          catatan: rawCatatan,
        };
      });

      res.status(200).json({
        success: true,
        data: {
          periode: "Juli 2026",
          wilayah: "Kecamatan Coblong",
          cakupanSampel: "6 Kelurahan (Coblong)",
          keterangan:
            "Data baseline dihimpun melalui survei sampel lapangan giat KKN pada Juli 2026 sebagai titik tolak evaluasi intervensi sistem pada tingkat RW dan Kelurahan.",
          catatanKaki:
            "Data baseline diambil selama kegiatan survei lapangan KKN (Juli 2026) berbasis sampel 6 kelurahan Kecamatan Coblong sebagai acuan awal evaluasi tingkat RW.",
          summary: {
            avgKepatuhanBaseline: 40.0,
            avgKepatuhanGrafik: 17.8,
            rwKepatuhanTinggi: 24,
            totalKelurahan: 6,
            totalVolumeBaselineKg: 38361.32,
          },
          kelurahan: kelurahanData,
        },
      });
    } catch (error: any) {
      console.error("[AiController.getBaseline] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * GET /api/v1/waste/actual-trends
   * Endpoint evaluasi pemilahan aktual real-time (terisolasi dari data baseline statis)
   */
  async getActualTrends(req: Request, res: Response): Promise<void> {
    try {
      const { weeks = 8, wilayah = "Semua Wilayah" } = req.query;
      const trendData = await dashboardService.getTrend(
        Number(weeks) || 8,
        String(wilayah)
      );
      res.status(200).json({
        success: true,
        data: trendData,
      });
    } catch (error: any) {
      console.error("[AiController.getActualTrends] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }
}

export const aiController = new AiController();
