/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
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
    async detectWasteMock(userId, imageUrl) {
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
                        }
                        else if (isUnreadable) {
                            reject(new Error("IMAGE_UNREADABLE"));
                        }
                        else {
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
                            }
                            else if (rand < 0.9) {
                                // Organic only
                                detections.push({
                                    detectedType: "ORGANIC",
                                    volumeEstimate: parseFloat((Math.random() * 4.5 + 1.5).toFixed(2)),
                                    confidence: parseFloat((Math.random() * 0.2 + 0.8).toFixed(2)),
                                });
                            }
                            else {
                                // Inorganic only
                                detections.push({
                                    detectedType: "NON_ORGANIC",
                                    volumeEstimate: parseFloat((Math.random() * 4.5 + 1.5).toFixed(2)),
                                    confidence: parseFloat((Math.random() * 0.2 + 0.8).toFixed(2)),
                                });
                            }
                            const dominant = detections.reduce((prev, current) => prev.volumeEstimate > current.volumeEstimate ? prev : current);
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
                            }
                            else if (dominant.detectedType === "ORGANIC") {
                                organik_percent = 100;
                            }
                            else {
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
                                recommended_bin: dominant.detectedType.toLowerCase() === "organic" ? "organik" : "anorganik",
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
        }
        catch (error) {
            // Handle Failure
            const isTimeout = error.message === "AI_TIMEOUT";
            const failureStatus = isTimeout ? "TIMEOUT" : "IMAGE_UNREADABLE";
            // Write Failed Log
            await aiRepository
                .logRequest(userId, requestId, finalImageUrl, failureStatus)
                .catch(() => { });
            // Refund Quota
            await redisService.refundQuota(userId);
            throw error;
        }
    }
    /**
     * Submit Petugas report for a WasteLog
     */
    async submitPetugasReport(wasteLogId, petugasUserId, actualWeight, manualClassification, geolocation) {
        return prisma.$transaction(async (tx) => {
            const log = await tx.wasteLog.findUnique({
                where: { id: wasteLogId },
                include: { category: true },
            });
            if (!log)
                throw new Error("WASTE_LOG_NOT_FOUND");
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
    async resolveDiscrepancy(wasteLogId, finalClassification, adminUserId, finalWeight) {
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
            if (!log)
                throw new Error("WASTE_LOG_NOT_FOUND");
            if (log.discrepancyStatus !== "PENDING_REVIEW") {
                throw new Error("DISCREPANCY_NOT_PENDING");
            }
            // Update discrepancy status to RESOLVED
            const dataToUpdate = {
                discrepancyStatus: "RESOLVED",
                petugasClassification: finalClassification,
            };
            if (finalWeight !== undefined) {
                dataToUpdate.actualWeightPetugas = finalWeight;
            }
            const updated = await tx.wasteLog.update({
                where: { id: wasteLogId },
                data: dataToUpdate,
            });
            // Recalculate and adjust points if final classification or weight differs
            const weightToUse = finalWeight !== undefined ? finalWeight : Number(log.weightKg);
            const isOrganic = finalClassification === "ORGANIC";
            const multiplierKey = isOrganic
                ? "organic_point_multiplier"
                : "nonorganic_point_multiplier";
            const multiplierVal = await configService.getConfig(multiplierKey);
            const multiplier = multiplierVal ? Number(multiplierVal) : isOrganic ? 2.0 : 1.5;
            const newPoints = Math.round(weightToUse * (isOrganic ? 100 : 50) * multiplier);
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
            const oldPoints = Math.round(Number(log.weightKg) * (oldIsOrganic ? 100 : 50) * oldMultiplier);
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
    async calculateComplianceScore(userId) {
        const logs = await prisma.wasteLog.findMany({
            where: {
                household: { userId },
            },
        });
        if (logs.length === 0)
            return 100;
        let onTimeCount = 0;
        let totalConfidence = 0;
        let confidenceCount = 0;
        for (const log of logs) {
            // 1. OnTimeSubmissionRate (6-8 AM or 4-6 PM window)
            const hour = log.createdAt.getHours();
            if ((hour >= 6 && hour < 8) || (hour >= 16 && hour < 18)) {
                onTimeCount++;
            }
            // 2. AI Confidence
            if (log.aiConfidence) {
                totalConfidence += Number(log.aiConfidence);
                confidenceCount++;
            }
        }
        const onTimeRate = (onTimeCount / logs.length) * 100;
        const avgConfidence = confidenceCount > 0 ? (totalConfidence / confidenceCount) * 100 : 100;
        // Formula: Compliance_Score = (0.5 * OnTimeSubmissionRate) + (0.5 * AI_Confidence_Rate rata-rata)
        const score = 0.5 * onTimeRate + 0.5 * avgConfidence;
        return Math.round(score * 10) / 10;
    }
    /**
     * Calculate Avoided Greenhouse Gas (CO2e) emissions
     */
    async calculateCo2eAvoided(weightKg) {
        const factorVal = await configService.getConfig("emission_factor_metana");
        const factor = factorVal ? Number(factorVal) : 0.05;
        return parseFloat((weightKg * factor).toFixed(3));
    }
    /**
     * Mock AI Volume estimation from image (length, width, height)
     */
    async estimateVolume(imageUrl) {
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
    async getDiscrepancies(status, startDate, endDate) {
        const whereClause = {
            discrepancyStatus: { not: "NONE" },
        };
        if (status && status !== "Semua") {
            whereClause.discrepancyStatus = status;
        }
        else if (!status) {
            whereClause.discrepancyStatus = "PENDING_REVIEW";
        }
        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) {
                whereClause.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                whereClause.createdAt.lte = end;
            }
        }
        return prisma.wasteLog.findMany({
            where: whereClause,
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
