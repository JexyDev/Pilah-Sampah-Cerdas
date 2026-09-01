import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { v4 as uuidv4 } from "uuid";
import { aiRepository } from "../repositories/aiRepository.js";
import { redisService } from "./redisService.js";
import { configService } from "./configService.js";
import { WasteAiAdapterFactory } from "../infrastructure/ai/WasteAiAdapterFactory.js";

export class AiService {
  /**
   * AI Detection using WasteAiAdapterFactory with Redis Queue
   */
  async detectWasteMock(userId: string, imageUrl: string, imagePath?: string) {
    const hasQuota = await redisService.checkAndUseQuota(userId);
    if (!hasQuota) throw new Error("QUOTA_EXCEEDED");

    const requestId = uuidv4();
    const finalImageUrl = imageUrl || "http://mock-storage/waste.jpg";

    try {
      const result: any = await redisService.enqueueAiTask(async () => {
        const adapter = WasteAiAdapterFactory.getAdapter();
        const aiResult = await adapter.classifyWaste({ imageUrl, imagePath });

        const detections = aiResult.detections || [];
        const orgDet = detections.filter((d: any) => d.detectedType === "ORGANIC");
        const nonOrgDet = detections.filter((d: any) => d.detectedType === "NON_ORGANIC");
        const orgVol = orgDet.reduce((s: number, d: any) => s + (d.volumeEstimate || 0), 0);
        const nonOrgVol = nonOrgDet.reduce((s: number, d: any) => s + (d.volumeEstimate || 0), 0);
        const totalVol = orgVol + nonOrgVol;

        const rawPercent = (aiResult.rawPayload as any) || {};
        let organik_percent = rawPercent.organik_percent;
        let non_organik_percent = rawPercent.non_organik_percent;
        if (organik_percent === undefined || non_organik_percent === undefined) {
          if (totalVol > 0) {
            organik_percent = Math.round((orgVol / totalVol) * 100);
            non_organik_percent = 100 - organik_percent;
          } else {
            const isOrg =
              String(aiResult.detectedType).toUpperCase() === "ORGANIC" ||
              String(aiResult.detectedType).toUpperCase() === "ORGANIK";
            organik_percent = isOrg ? 95 : 5;
            non_organik_percent = 100 - organik_percent;
          }
        }

        const isOrgMajority = Number(organik_percent) >= Number(non_organik_percent);
        const finalDetectedType = isOrgMajority ? "ORGANIC" : "NON_ORGANIC";
        const finalRecommendedBin = isOrgMajority ? "organik" : "anorganik";

        return {
          requestId,
          detectedType: finalDetectedType,
          volumeEstimate: aiResult.estimatedVolumeLiter,
          confidence: aiResult.confidenceScore,
          detections,
          isBlurry: false,
          organik_percent,
          non_organik_percent,
          recommended_bin: finalRecommendedBin,
          vendorName: aiResult.vendorName,
          annotatedImageBase64: aiResult.annotatedImageBase64,
        };
      });

      await aiRepository.logRequest(userId, requestId, finalImageUrl, "SUCCESS").catch((err) => {
        console.warn("Failed to write AI success log to DB:", err.message);
      });

      return result;
    } catch (error: any) {
      const isTimeout = error.message === "AI_TIMEOUT";
      const failureStatus = isTimeout ? "TIMEOUT" : "IMAGE_UNREADABLE";
      await aiRepository
        .logRequest(userId, requestId, finalImageUrl, failureStatus)
        .catch(() => {});
      await redisService.refundQuota(userId);
      throw error;
    }
  }

  /**
   * Submit Petugas report for a WasteLog
   */
  async submitPetugasReport(
    wasteLogId: string,
    petugasUserId: string,
    actualWeight: number,
    manualClassification: string,
    geolocation: string
  ) {
    return { id: wasteLogId };
  }

  async resolveDiscrepancy(
    wasteLogId: string,
    finalClassification: string,
    adminUserId: string,
    finalWeight?: number
  ) {
    return { id: wasteLogId };
  }

  /**
   * Calculate Warga compliance score
   */
  async calculateComplianceScore(userId: string) {
    const logs = await prisma.setoranOtomatis.findMany({
      where: {
        wargaId: userId,
      },
    });

    if (logs.length === 0) return 100;

    let onTimeCount = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const log of logs) {
      const hour = log.createdAt.getHours();
      if ((hour >= 6 && hour < 8) || (hour >= 16 && hour < 18)) {
        onTimeCount++;
      }

      if (log.confidenceAi) {
        totalConfidence += Number(log.confidenceAi);
        confidenceCount++;
      }
    }

    const onTimeRate = (onTimeCount / logs.length) * 100;
    const avgConfidence = confidenceCount > 0 ? (totalConfidence / confidenceCount) * 100 : 100;

    const score = 0.5 * onTimeRate + 0.5 * avgConfidence;

    return Math.round(score * 10) / 10;
  }

  /**
   * Calculate Avoided Greenhouse Gas (CO2e) emissions
   */
  async calculateCo2eAvoided(weightKg: number) {
    const factorVal = await configService.getConfig("emission_factor_metana");
    const factor = factorVal ? Number(factorVal) : 0.05;
    return parseFloat((weightKg * factor).toFixed(3));
  }

  /**
   * Mock AI Volume estimation from image (length, width, height)
   */
  async estimateVolume(imageUrl: string) {
    const lengthCm = Math.round(Math.random() * 20 + 30); // 30-50 cm
    const widthCm = Math.round(Math.random() * 20 + 30); // 30-50 cm
    const heightCm = Math.round(Math.random() * 30 + 50); // 50-80 cm
    const volumeLiters = parseFloat(((lengthCm * widthCm * heightCm) / 1000).toFixed(2));

    return {
      imageUrl,
      lengthCm,
      widthCm,
      heightCm,
      volumeLiters,
    };
  }

  async getDiscrepancies(status?: string, startDate?: string, endDate?: string) {
    return [];
  }
}

export const aiService = new AiService();
