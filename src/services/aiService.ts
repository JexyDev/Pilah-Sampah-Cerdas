/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { v4 as uuidv4 } from "uuid";
import { aiRepository } from "../repositories/aiRepository.js";
import { redisService } from "./redisService.js";
import { PrismaClient } from "@prisma/client";
import { configService } from "./configService.js";

const prisma = new PrismaClient();

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
              const types = ["ORGANIC", "NON_ORGANIC"];
              const detectedType = types[Math.floor(Math.random() * types.length)];
              // Estimate volume between 1.5 and 6.0 Liters
              const volumeEstimate = parseFloat((Math.random() * 4.5 + 1.5).toFixed(2));
              resolve({
                requestId,
                detectedType,
                volumeEstimate,
                isBlurry: false,
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
    return prisma.$transaction(async (tx) => {
      const log = await tx.wasteLog.findUnique({
        where: { id: wasteLogId },
        include: { category: true },
      });
      if (!log) throw new Error("WASTE_LOG_NOT_FOUND");

      const thresholdVal = await configService.getConfig("ai_confidence_threshold");
      const threshold = thresholdVal ? Number(thresholdVal) : 90;

      let discrepancyStatus = "NONE";
      const aiConf = log.aiConfidence ? Number(log.aiConfidence) : 0;
      if (log.aiClassification !== manualClassification && aiConf >= threshold) {
        discrepancyStatus = "PENDING_REVIEW";
      }

      const updated = await tx.wasteLog.update({
        where: { id: wasteLogId },
        data: {
          actualWeightPetugas: actualWeight,
          petugasClassification: manualClassification,
          geolocation,
          discrepancyStatus,
          verifiedByPetugasId: petugasUserId,
          verifiedAt: new Date(),
        },
      });

      return updated;
    });
  }

  /**
   * Resolve discrepancy by Admin DLH
   */
  async resolveDiscrepancy(wasteLogId: string, finalClassification: string, adminUserId: string) {
    return prisma.$transaction(async (tx) => {
      const log = await tx.wasteLog.findUnique({
        where: { id: wasteLogId },
        include: {
          household: {
            include: {
              user: true,
            },
          },
        },
      });
      if (!log) throw new Error("WASTE_LOG_NOT_FOUND");
      if (log.discrepancyStatus !== "PENDING_REVIEW") {
        throw new Error("DISCREPANCY_NOT_PENDING");
      }

      // Update discrepancy status to RESOLVED
      const updated = await tx.wasteLog.update({
        where: { id: wasteLogId },
        data: {
          discrepancyStatus: "RESOLVED",
        },
      });

      // Recalculate and adjust points if final classification differs from original Warga/AI classification
      if (log.aiClassification !== finalClassification) {
        // Find category multiplier
        const isOrganic = finalClassification === "ORGANIC";
        const multiplierKey = isOrganic
          ? "organic_point_multiplier"
          : "nonorganic_point_multiplier";
        const multiplierVal = await configService.getConfig(multiplierKey);
        const multiplier = multiplierVal ? Number(multiplierVal) : isOrganic ? 2.0 : 1.5;

        const newPoints = Math.round(Number(log.weightKg) * (isOrganic ? 100 : 50) * multiplier);

        // Original points awarded (simplified calculation)
        const oldIsOrganic = log.aiClassification === "ORGANIC";
        const oldMultiplierKey = oldIsOrganic
          ? "organic_point_multiplier"
          : "nonorganic_point_multiplier";
        const oldMultiplierVal = await configService.getConfig(oldMultiplierKey);
        const oldMultiplier = oldMultiplierVal
          ? Number(oldMultiplierVal)
          : oldIsOrganic
            ? 2.0
            : 1.5;
        const oldPoints = Math.round(
          Number(log.weightKg) * (oldIsOrganic ? 100 : 50) * oldMultiplier
        );

        const diff = newPoints - oldPoints;

        if (diff !== 0) {
          // Adjust Warga points
          await tx.user.update({
            where: { id: log.household.userId },
            data: {
              pointHistory: {
                create: {
                  points: diff,
                  description: `Penyesuaian klasifikasi akhir audit oleh Admin untuk setoran ${log.id}`,
                  kategori: "REDUKSI_TONASE",
                },
              },
            },
          });
        }
      }

      // Log Audit Trail
      await tx.auditTrail.create({
        data: {
          action: "RESOLVE_DISCREPANCY",
          userId: adminUserId,
          oldValue: { discrepancyStatus: log.discrepancyStatus },
          newValue: { discrepancyStatus: "RESOLVED", finalClassification },
        },
      });

      return updated;
    });
  }

  /**
   * Calculate Warga compliance score
   */
  async calculateComplianceScore(userId: string) {
    const total = await prisma.wasteLog.count({
      where: {
        household: { userId },
      },
    });

    const discrepant = await prisma.wasteLog.count({
      where: {
        household: { userId },
        discrepancyStatus: "PENDING_REVIEW",
      },
    });

    const score = total > 0 ? ((total - discrepant) / total) * 100 : 100;
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

  async getPendingDiscrepancies() {
    return prisma.wasteLog.findMany({
      where: {
        discrepancyStatus: "PENDING_REVIEW",
      },
      include: {
        household: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            rtRw: {
              select: {
                name: true,
                kelurahan: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

export const aiService = new AiService();
