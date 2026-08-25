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
    // 1. Check Quota via Redis
    const hasQuota = await redisService.checkAndUseQuota(userId);
    if (!hasQuota) {
      throw new Error("QUOTA_EXCEEDED");
    }

    const requestId = uuidv4();
    const finalImageUrl = imageUrl || "http://mock-storage/waste.jpg";

    try {
      // 2. Enqueue the AI Task into FIFO Queue (max 2 concurrent from redisService)
      const result: any = await redisService.enqueueAiTask(async () => {
        const adapter = WasteAiAdapterFactory.getAdapter();
        const aiResponse = await adapter.classifyWaste({
          imageUrl: finalImageUrl,
          imagePath,
        });

        const isOrganic = (aiResponse.detectedType || "").toLowerCase().includes("organ");
        const detectedType = isOrganic ? "ORGANIC" : "NON_ORGANIC";
        const volumeEstimate = aiResponse.estimatedVolumeLiter || 2.0;
        const confidence = aiResponse.confidenceScore || 0.9;

        const detections = aiResponse.detections?.length
          ? aiResponse.detections
          : [
              {
                detectedType,
                volumeEstimate,
                confidence,
              },
            ];

        const orgDet = detections.find((d) =>
          d.detectedType?.toUpperCase().includes("ORGANIC")
        );
        const nonOrgDet = detections.find((d) =>
          d.detectedType?.toUpperCase().includes("NON")
        );
        const orgVol = orgDet ? orgDet.volumeEstimate : isOrganic ? volumeEstimate : 0;
        const nonOrgVol = nonOrgDet ? nonOrgDet.volumeEstimate : !isOrganic ? volumeEstimate : 0;
        const totalVol = orgVol + nonOrgVol;

        let organik_percent = (aiResponse.rawPayload as any)?.organik_percent;
        let non_organik_percent = (aiResponse.rawPayload as any)?.non_organik_percent;

        if (organik_percent === undefined || non_organik_percent === undefined) {
          if (totalVol > 0) {
            organik_percent = Math.round((orgVol / totalVol) * 100);
            non_organik_percent = 100 - organik_percent;
          } else if (isOrganic) {
            organik_percent = 100;
            non_organik_percent = 0;
          } else {
            organik_percent = 0;
            non_organik_percent = 100;
          }
        }

        return {
          requestId: aiResponse.requestId || requestId,
          detectedType,
          volumeEstimate,
          confidence,
          detections,
          isBlurry: false,
          organik_percent,
          non_organik_percent,
          recommended_bin: isOrganic ? "organik" : "anorganik",
          vendorName: aiResponse.vendorName,
          annotatedImageBase64: aiResponse.annotatedImageBase64,
        };
      });

      // 3. Write Success Log
      await aiRepository.logRequest(userId, requestId, finalImageUrl, "SUCCESS").catch((err) => {
        console.warn("Failed to write AI success log to DB:", err.message);
      });

      return result;
    } catch (error: any) {
      // Handle Failure
      const isTimeout = error.message === "AI_TIMEOUT";
      const failureStatus = isTimeout ? "TIMEOUT" : "IMAGE_UNREADABLE";

      // Write Failed Log
      await aiRepository
        .logRequest(userId, requestId, finalImageUrl, failureStatus)
        .catch(() => {});

      // Refund Quota
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
