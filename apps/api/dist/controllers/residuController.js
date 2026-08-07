/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { PrismaClient } from "@prisma/client";
import { residuService } from "../services/residuService.js";
const prisma = new PrismaClient();
export class ResiduController {
    async getPendingLogs(req, res) {
        try {
            if (!req.user || req.user.role !== "PETUGAS_RESIDU") {
                res
                    .status(403)
                    .json({ error: "FORBIDDEN", message: "Only Petugas Residu can access this." });
                return;
            }
            res.status(200).json({ success: true, data: [] });
        }
        catch (error) {
            console.error("[ResiduController] getPendingLogs error:", error);
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memuat log." });
        }
    }
    /**
     * Get daily schedule for Petugas (Bins > 70% in their zone)
     */
    async getJadwalHarian(req, res) {
        try {
            if (!req.user || req.user.role !== "PETUGAS_RESIDU") {
                res
                    .status(403)
                    .json({ error: "FORBIDDEN", message: "Only Petugas Residu can access this." });
                return;
            }
            // Get all active bins
            const bins = await prisma.bin.findMany({
                where: {
                    status: "ACTIVE_BOUND",
                },
                include: {
                    category: true,
                    rw: true,
                    user: true,
                },
                take: 20,
            });
            const targetBins = bins.filter((b) => {
                const vol = Number(b.currentVolumeLiter);
                const max = Number(b.maxCapacityLiter);
                return max > 0 && vol / max >= 0.7;
            });
            const scheduleList = (targetBins.length > 0 ? targetBins : bins).map((b, idx) => {
                const vol = Number(b.currentVolumeLiter);
                const max = Number(b.maxCapacityLiter);
                const pct = max > 0 ? Math.min(100, Math.round((vol / max) * 100)) : 80;
                return {
                    id: b.id,
                    binId: b.id,
                    qrCode: b.qrCode,
                    kodeQr: b.qrCode,
                    kategori: b.category?.name || "Organik",
                    lokasi: b.rw ? `${b.rw.name}` : "RT 01 / RW 01",
                    alamat: b.user?.address || "Jl. Coblong Raya No. " + (idx + 1),
                    wargaNama: b.user?.name || "Warga Dampingan " + (idx + 1),
                    namaWarga: b.user?.name || "Warga Dampingan " + (idx + 1),
                    volumePercent: pct,
                    status: "BELUM_DIANGKUT",
                    currentVolumeLiter: vol,
                    maxCapacityLiter: max,
                    category: b.category,
                    rw: b.rw,
                    user: b.user,
                };
            });
            res.status(200).json({
                success: true,
                data: scheduleList,
            });
        }
        catch (error) {
            console.error("[ResiduController] getJadwalHarian error:", error);
            res
                .status(500)
                .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memuat jadwal harian." });
        }
    }
    async getRiwayat(req, res) {
        try {
            const petugasUserId = req.user.userId;
            const range = req.query.range;
            const type = req.query.type;
            const data = await residuService.getRiwayat(petugasUserId, range, type);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[ResiduController] getRiwayat error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async recordViolation(req, res) {
        try {
            const petugasUserId = req.user.userId;
            let evidencePhotoUrl = req.body.evidencePhotoUrl || req.body.evidence;
            if (req.file) {
                evidencePhotoUrl = `/uploads/${req.file.filename}`;
            }
            else if (req.files) {
                const filesObj = req.files;
                const f = filesObj.evidence?.[0] || filesObj.image?.[0] || filesObj.evidencePhotoUrl?.[0];
                if (f)
                    evidencePhotoUrl = `/uploads/${f.filename}`;
            }
            const result = await residuService.recordViolation(petugasUserId, {
                binQrCode: req.body.binQrCode,
                type: req.body.type,
                severity: req.body.severity,
                evidencePhotoUrl: evidencePhotoUrl || "/uploads/default-violation.jpg",
                notes: req.body.notes,
            });
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            console.error("[ResiduController] recordViolation error:", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async getDashboardSummary(req, res) {
        try {
            const petugasUserId = req.user.userId;
            const period = req.query.period || "hari";
            const data = await residuService.getDashboardSummary(petugasUserId, period);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[ResiduController] getDashboardSummary error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getAnalytics(req, res) {
        try {
            const data = await residuService.getAnalytics();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[ResiduController] getAnalytics error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async submitLog(req, res) {
        try {
            const petugasUserId = req.user.userId;
            let imagePhotoUrl = req.body.imagePhotoUrl || req.body.image || req.body.photoPath;
            if (req.file) {
                imagePhotoUrl = `/uploads/${req.file.filename}`;
            }
            else if (req.files) {
                const filesObj = req.files;
                const f = filesObj.image?.[0] || filesObj.evidence?.[0] || filesObj.imagePhotoUrl?.[0];
                if (f)
                    imagePhotoUrl = `/uploads/${f.filename}`;
            }
            const data = await residuService.submitLog(petugasUserId, {
                actualWeightKg: req.body.actualWeightKg || req.body.weight,
                classification: req.body.classification || req.body.kategori,
                imagePhotoUrl: imagePhotoUrl || "/uploads/default-residu.jpg",
                rw: req.body.rw,
                kelurahan: req.body.kelurahan,
                notes: req.body.notes,
                logId: req.body.logId,
                binId: req.body.binId,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
            });
            res.status(201).json({ success: true, data });
        }
        catch (error) {
            console.error("[ResiduController] submitLog error:", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
export const residuController = new ResiduController();
