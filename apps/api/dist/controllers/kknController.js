/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { kknService } from "../services/kknService.js";
export class KknController {
    async validateQrMaster(req, res) {
        try {
            const { qrCode } = req.body;
            if (!qrCode) {
                res.status(400).json({ error: "BAD_REQUEST", message: "QR Code diperlukan." });
                return;
            }
            const { PrismaClient } = await import("@prisma/client");
            const prisma = new PrismaClient();
            const existingBin = await prisma.bin.findUnique({
                where: { qrCode },
            });
            if (existingBin && ["ACTIVE_BOUND", "PENDING_APPROVAL"].includes(existingBin.status)) {
                res
                    .status(400)
                    .json({ error: "QR_IN_USE", message: "QR Code ini sudah terdaftar pada tong lain." });
                return;
            }
            // Validasi terhadap master QR (asumsi master QR format valid jika memenuhi kriteria misal diawali TS- atau ada di tabel Master)
            // Untuk MVP TrashCare, kita simulasikan validasi format TS-XXXX
            if (!qrCode.toUpperCase().startsWith("TS-")) {
                res.status(400).json({
                    error: "INVALID_QR",
                    message: "Format QR Master tidak valid. Harus diawali TS-",
                });
                return;
            }
            res.status(200).json({ success: true, message: "QR Code Master Valid dan belum digunakan." });
        }
        catch (error) {
            console.error("[KknController] validateQrMaster error:", error);
            res
                .status(500)
                .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memvalidasi QR Master" });
        }
    }
    async getDashboardStats(req, res) {
        try {
            const kknUserId = req.user.userId;
            const data = await kknService.getDashboardStats(kknUserId);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[KknController] getDashboardStats error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getRegisteredWarga(req, res) {
        try {
            const kknUserId = req.user.userId;
            const rwId = req.query.rwId ? parseInt(req.query.rwId, 10) : undefined;
            const search = req.query.search;
            const data = await kknService.getRegisteredWarga(kknUserId, { rwId, search });
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[KknController] getRegisteredWarga error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getWargaDetail(req, res) {
        try {
            const kknUserId = req.user.userId;
            const { wargaId } = req.params;
            const data = await kknService.getWargaDetail(kknUserId, wargaId);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[KknController] getWargaDetail error:", error);
            const code = error.message === "UNAUTHORIZED_ACCESS_SCOPE" ? 403 : 500;
            res.status(code).json({ success: false, message: error.message });
        }
    }
    async getWargaList(req, res) {
        try {
            const kknUserId = req.user.userId;
            const status = req.query.status;
            const kelurahan = req.query.kelurahan;
            const rwId = req.query.rw ? parseInt(req.query.rw, 10) : undefined;
            const search = req.query.search;
            const data = await kknService.getWargaList(kknUserId, { status, kelurahan, rwId, search });
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[KknController] getWargaList error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async activateByScan(req, res) {
        try {
            const kknUserId = req.user.userId;
            const { wargaId, qrCode, latitude, longitude } = req.body;
            if (!wargaId || !qrCode) {
                return res.status(400).json({
                    success: false,
                    message: "Field wargaId dan qrCode wajib diisi",
                });
            }
            const data = await kknService.activateByScan(wargaId, qrCode, latitude != null ? Number(latitude) : undefined, longitude != null ? Number(longitude) : undefined, kknUserId);
            res.status(200).json({
                success: true,
                message: "Aktivasi warga via scan QR berhasil",
                data,
            });
        }
        catch (error) {
            console.error("[KknController] activateByScan error:", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async activateBin(req, res) {
        try {
            const kknUserId = req.user.userId;
            const { wargaId, binOrganikId, binAnorganikId, latitude, longitude } = req.body;
            if (!wargaId || !binOrganikId || !binAnorganikId) {
                return res.status(400).json({
                    success: false,
                    message: "Field wargaId, binOrganikId, dan binAnorganikId wajib diisi",
                });
            }
            await kknService.activateWargaBin(wargaId, binOrganikId, binAnorganikId, latitude != null ? Number(latitude) : undefined, longitude != null ? Number(longitude) : undefined, kknUserId);
            res.status(200).json({
                success: true,
                message: "Tempat sampah berhasil di-binding ke akun Warga di wilayah RT/RW dampingan KKN.",
            });
        }
        catch (error) {
            console.error("[KknController] activateBin error:", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async createLeaveRequest(req, res) {
        try {
            const studentId = req.user.userId;
            let fotoBuktiUrl = req.body.fotoBuktiUrl;
            if (req.file) {
                fotoBuktiUrl = `/uploads/${req.file.filename}`;
            }
            const data = await kknService.createLeaveRequest(studentId, {
                ...req.body,
                fotoBuktiUrl,
            });
            res.status(201).json({
                success: true,
                message: "Pengajuan izin berhasil dikirim. Menunggu verifikasi Admin DLH.",
                data,
            });
        }
        catch (error) {
            console.error("[KknController] createLeaveRequest error:", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async getActivityLog(req, res) {
        try {
            const kknUserId = req.user.userId;
            const data = await kknService.getActivityLog(kknUserId);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[KknController] getActivityLog error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async handover(req, res) {
        try {
            const kknUserId = req.user.userId;
            const { toKknUserId, rwId, notes } = req.body;
            const data = await kknService.handover(kknUserId, toKknUserId, Number(rwId), notes);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[KknController] handover error:", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async inputFacility(req, res) {
        try {
            const kknUserId = req.user.userId;
            const data = await kknService.bantuInputFasilitas(kknUserId, req.body);
            res.status(201).json({ success: true, data });
        }
        catch (error) {
            console.error("[KknController] inputFacility error:", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async claimQr(req, res) {
        try {
            const kknUserId = req.user.userId;
            const { qrCode, latitude, longitude } = req.body;
            if (!qrCode) {
                return res.status(400).json({ success: false, message: "qrCode wajib diisi" });
            }
            const data = await kknService.claimQr(kknUserId, qrCode, latitude != null ? Number(latitude) : undefined, longitude != null ? Number(longitude) : undefined);
            res.status(200).json({ success: true, message: "QR berhasil diklaim", data });
        }
        catch (error) {
            console.error("[KknController] claimQr error:", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async registerWarga(req, res) {
        try {
            const kknUserId = req.user.userId;
            const data = await kknService.registerWarga(kknUserId, req.body);
            res.status(201).json({ success: true, message: "Registrasi Warga Berhasil", data });
        }
        catch (error) {
            console.error("[KknController] registerWarga error:", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async getMyGroup(req, res) {
        try {
            const kknUserId = req.user.userId;
            const data = await kknService.getMyGroup(kknUserId);
            if (!data) {
                res.status(404).json({
                    success: false,
                    message: "Anda belum dimasukkan ke kelompok KKN oleh Admin DLH.",
                });
                return;
            }
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[KknController] getMyGroup error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async createPemanfaatanSampah(req, res) {
        try {
            const kknUserId = req.user.userId;
            const data = await kknService.createPemanfaatanSampah(kknUserId, req.body);
            res.status(201).json({
                success: true,
                message: "Laporan pemanfaatan sampah berhasil disimpan dan tercatat di Web Monitoring.",
                data,
            });
        }
        catch (error) {
            console.error("[KknController] createPemanfaatanSampah error:", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async notifyWargaStatus(req, res) {
        try {
            const kknUserId = req.user.userId;
            const { wargaId, statusBimbingan } = req.body;
            if (!wargaId || !statusBimbingan) {
                res.status(400).json({
                    success: false,
                    message: "wargaId dan statusBimbingan wajib diisi",
                });
                return;
            }
            await kknService.notifyWargaStatus(kknUserId, wargaId, statusBimbingan);
            res.status(200).json({
                success: true,
                message: "Notifikasi terkirim",
            });
        }
        catch (error) {
            console.error("[KknController] notifyWargaStatus error:", error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async getActiveZone(req, res) {
        try {
            const kknUserId = req.user.userId;
            const data = await kknService.getActiveZone(kknUserId);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[KknController] getActiveZone error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
export const kknController = new KknController();
