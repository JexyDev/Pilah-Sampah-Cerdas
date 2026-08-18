import { prisma } from "../lib/prisma.js";
/**
 * Project: TrashCare
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
   * Mock AI Detection using Redis Queue with strict limits
   */
  async detectWasteMock(userId: string, imageUrl: string) {
    // 1. Check Quota via Redis
    const hasQuota = await redisService.checkAndUseQuota(userId);
    if (!hasQuota) {
      throw new Error("QUOTA_EXCEEDED");
    }

    const requestId = uuidv4();
    const finalImageUrl = imageUrl || "http://mock-storage/waste.jpg";

    try {
      // 2. Enqueue the AI Task into FIFO Queue (max 2 concurrent from redisService)
      const result = await redisService.enqueueAiTask(() => {
        return new Promise((resolve, reject) => {
          // Decide AI computation duration (15% chance of timeout > 2000ms)
          const isTimeout = Math.random() < 0.15;
          const duration = isTimeout ? 2500 : 1200;

          // 20% chance of image unreadable failure
          const isUnreadable = Math.random() < 0.2;

          const timeoutId = setTimeout(() => {
            if (isTimeout) {
              reject(new Error("AI_TIMEOUT"));
            } else if (isUnreadable) {
              reject(new Error("IMAGE_UNREADABLE"));
            } else {
              // 80% chance of mixture, 10% organic only, 10% inorganic only
              const rand = Math.random();
              const detections = [];
              if (rand < 0.8) {
                // Mixture
                detections.push({
                  detectedType: "ORGANIC",
                  volumeEstimate: parseFloat((Math.random() * 3 + 1.0).toFixed(2)),
                  confidence: parseFloat((Math.random() * 0.2 + 0.8).toFixed(2)), // 80%-100%
                });
                detections.push({
                  detectedType: "NON_ORGANIC",
                  volumeEstimate: parseFloat((Math.random() * 3 + 1.0).toFixed(2)),
                  confidence: parseFloat((Math.random() * 0.2 + 0.8).toFixed(2)), // 80%-100%
                });
              } else if (rand < 0.9) {
                // Organic only
                detections.push({
                  detectedType: "ORGANIC",
                  volumeEstimate: parseFloat((Math.random() * 4.5 + 1.5).toFixed(2)),
                  confidence: parseFloat((Math.random() * 0.2 + 0.8).toFixed(2)),
                });
              } else {
                // Inorganic only
                detections.push({
                  detectedType: "NON_ORGANIC",
                  volumeEstimate: parseFloat((Math.random() * 4.5 + 1.5).toFixed(2)),
                  confidence: parseFloat((Math.random() * 0.2 + 0.8).toFixed(2)),
                });
              }

              const dominant = detections.reduce((prev, current) =>
                prev.volumeEstimate > current.volumeEstimate ? prev : current
              );
              const orgDet = detections.find((d) => d.detectedType === "ORGANIC");
              const nonOrgDet = detections.find((d) => d.detectedType === "NON_ORGANIC");
              const orgVol = orgDet ? orgDet.volumeEstimate : 0;
              const nonOrgVol = nonOrgDet ? nonOrgDet.volumeEstimate : 0;
              const totalVol = orgVol + nonOrgVol;

              let organik_percent = 0;
              let non_organik_percent = 0;
              if (totalVol > 0) {
                organik_percent = Math.round((orgVol / totalVol) * 100);
                non_organik_percent = 100 - organik_percent;
              } else if (dominant.detectedType === "ORGANIC") {
                organik_percent = 100;
              } else {
                non_organik_percent = 100;
              }

              resolve({
                requestId,
                detectedType: dominant.detectedType,
                volumeEstimate: dominant.volumeEstimate,
                confidence: dominant.confidence,
                detections,
                isBlurry: false,
                organik_percent,
                non_organik_percent,
                recommended_bin:
                  dominant.detectedType.toLowerCase() === "organic" ? "organik" : "anorganik",
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
