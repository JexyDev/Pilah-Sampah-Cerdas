/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { PrismaClient } from "@prisma/client";
import { configService } from "./configService.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";
const prisma = new PrismaClient();
export class ResiduService {
    async recordViolation(petugasUserId, data) {
        if (!data.evidencePhotoUrl) {
            throw new Error("FOTO_BUKTI_WAJIB");
        }
        const bin = await prisma.bin.findUnique({
            where: { qrCode: data.binQrCode },
            include: {
                binOwnerships: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        if (!bin) {
            throw new Error("BIN_NOT_FOUND");
        }
        const ownerOwnership = bin.binOwnerships.find((o) => o.type === "UTAMA");
        const citizen = ownerOwnership?.user;
        if (!citizen) {
            throw new Error("CITIZEN_NOT_FOUND_FOR_BIN");
        }
        // Retrieve penalty multiplier
        const basePenaltyStr = await configService.getConfig("residu_penalty_multiplier");
        const basePenalty = basePenaltyStr ? Math.abs(parseInt(basePenaltyStr, 10)) : 50;
        let multiplier = 1;
        if (data.severity === "MEDIUM")
            multiplier = 2;
        if (data.severity === "SEVERE")
            multiplier = 3;
        const pointsToDeduct = basePenalty * multiplier;
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Violation record
            const violation = await tx.violation.create({
                data: {
                    userId: citizen.id,
                    binId: bin.id,
                    petugasUserId,
                    type: data.type,
                    severity: data.severity,
                    evidencePhotoUrl: data.evidencePhotoUrl,
                    notes: data.notes || null,
                    pointsDeducted: pointsToDeduct,
                },
            });
            // 2. Deduct Citizen Points (Insert negative PointHistory)
            await tx.pointHistory.create({
                data: {
                    userId: citizen.id,
                    points: -pointsToDeduct,
                    description: `Penalti pelanggaran residu tercampur (${data.severity}): ${data.type}`,
                    kategori: "REDUKSI_TONASE",
                },
            });
            // 3. Create In-App Notification for Citizen
            await tx.notification.create({
                data: {
                    userId: citizen.id,
                    title: "Peringatan Pemilahan Sampah",
                    message: `Ditemukan ketidakpatuhan pemilahan sampah (${data.type}) dengan tingkat keparahan ${data.severity}. Poin Anda dipotong ${pointsToDeduct}. Harap pilah sampah dengan benar demi kelestarian lingkungan.`,
                },
            });
            return violation;
        });
        // 4. Send WhatsApp warning (Mock)
        if (citizen.phone) {
            await notificationIntegrationService.sendWhatsApp(citizen.phone, `Halo ${citizen.name}, petugas residu mendeteksi residu tercampur di tong sampah Anda (${data.type}). Mohon pastikan memilah sampah organik dan anorganik dengan benar. Poin Anda berkurang -${pointsToDeduct}.`);
        }
        return result;
    }
    async getDashboardSummary(petugasUserId) {
        const petugas = await prisma.petugasResidu.findUnique({
            where: { userId: petugasUserId },
        });
        if (!petugas) {
            throw new Error("PETUGAS_NOT_FOUND");
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const totalViolationsToday = await prisma.violation.count({
            where: {
                petugasUserId,
                createdAt: {
                    gte: today,
                },
            },
        });
        // Recent violations recorded by this petugas
        const recentViolations = await prisma.violation.findMany({
            where: { petugasUserId },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
                user: true,
                bin: true,
            },
        });
        // Count completed tasks today
        const tugasSelesaiHariIni = await prisma.wasteLog.count({
            where: {
                verifiedByPetugasId: petugasUserId,
                verifiedAt: {
                    gte: today,
                },
            },
        });
        return {
            kpiScore: Number(petugas.kpiScore),
            assignedZone: petugas.assignedZone || "Semua Zona",
            totalViolationsToday,
            tugasSelesaiHariIni,
            recentViolations: recentViolations.map((v) => ({
                id: v.id,
                wargaName: v.user.name,
                binCode: v.bin?.qrCode || "N/A",
                type: v.type,
                severity: v.severity,
                pointsDeducted: v.pointsDeducted,
                createdAt: v.createdAt,
            })),
        };
    }
    async getAnalytics() {
        // Volume aggregate over time (mocked representation of aggregate query)
        const trend = [
            { date: "Mon", weightKg: 120 },
            { date: "Tue", weightKg: 140 },
            { date: "Wed", weightKg: 90 },
            { date: "Thu", weightKg: 150 },
            { date: "Fri", weightKg: 180 },
            { date: "Sat", weightKg: 110 },
            { date: "Sun", weightKg: 95 },
        ];
        // Compliance heatmap zones
        const zones = [
            { id: 1, region: "RW 06 Dago", complianceScore: 85, violationsCount: 2 },
            { id: 2, region: "RW 02 Cigadung", complianceScore: 60, violationsCount: 8 },
            { id: 3, region: "RW 01 Coblong", complianceScore: 45, violationsCount: 14 },
        ];
        return {
            trend,
            zones,
        };
    }
    async submitLog(petugasUserId, data) {
        const petugas = await prisma.petugasResidu.findUnique({
            where: { userId: petugasUserId },
        });
        if (!petugas)
            throw new Error("PETUGAS_NOT_FOUND");
        const wasteLog = await prisma.wasteLog.findUnique({
            where: { id: data.logId },
        });
        if (!wasteLog)
            throw new Error("WASTE_LOG_NOT_FOUND");
        // 1. Update WasteLog
        const discrepancyStatus = wasteLog.aiClassification &&
            wasteLog.aiConfidence &&
            Number(wasteLog.aiConfidence) > 0.9 &&
            wasteLog.aiClassification !== data.classification
            ? "PENDING_REVIEW"
            : "NONE";
        const updatedLog = await prisma.wasteLog.update({
            where: { id: data.logId },
            data: {
                actualWeightPetugas: data.actualWeightKg,
                petugasClassification: data.classification,
                verifiedByPetugasId: petugasUserId,
                verifiedAt: new Date(),
                discrepancyStatus,
            },
        });
        // 2. Hitung KPI Petugas
        // Formula: KPI = (0.6 * Ketepatan Waktu) + (0.4 * Akurasi AI)
        // Ketepatan waktu:
        // Cek window 06:00-08:00 dan 16:00-18:00
        const now = new Date();
        const currentHour = now.getHours();
        let isPunctual = false;
        if ((currentHour >= 6 && currentHour < 8) || (currentHour >= 16 && currentHour < 18)) {
            isPunctual = true;
        }
        const timeScore = isPunctual ? 100 : 50; // Jika di luar window, skor 50
        // Akurasi AI vs Petugas (kalau cocok = 100, tidak cocok = 0)
        let accuracyScore = 100;
        if (wasteLog.aiClassification && wasteLog.aiClassification !== data.classification) {
            accuracyScore = 0;
        }
        // Current KPI
        const currentKpi = Number(petugas.kpiScore);
        // Calculated score for this log
        const logScore = 0.6 * timeScore + 0.4 * accuracyScore;
        // Update KPI (Moving Average or just direct math, let's use a simple moving average)
        // To simplify, we calculate the average with a small smoothing factor
        const newKpi = currentKpi * 0.9 + logScore * 0.1;
        await prisma.petugasResidu.update({
            where: { userId: petugasUserId },
            data: {
                kpiScore: newKpi,
            },
        });
        // 3. Mark DispatchTask as COMPLETED if exists
        const dispatchTask = await prisma.dispatchTask.findFirst({
            where: {
                binId: wasteLog.binId,
                status: { in: ["PENDING", "ESCALATED"] },
            },
            orderBy: { createdAt: "desc" },
        });
        if (dispatchTask) {
            await prisma.dispatchTask.update({
                where: { id: dispatchTask.id },
                data: {
                    status: "COMPLETED",
                },
            });
        }
        return {
            updatedLog,
            kpiScore: newKpi.toFixed(2),
            isPunctual,
            discrepancyStatus,
        };
    }
}
export const residuService = new ResiduService();
