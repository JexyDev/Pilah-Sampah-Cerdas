/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { superUserService } from "../services/superUserService.js";
export class superUserController {
    async getInactiveBins(req, res) {
        try {
            const { search } = req.query;
            const data = await superUserService.getInactiveBins({ search: search });
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[superUserController] getInactiveBins error:", error);
            res
                .status(500)
                .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
    async reactivateBin(req, res) {
        try {
            const { id } = req.params;
            const adminUserId = req.user.userId;
            await superUserService.reactivateBin(id, adminUserId);
            res.status(200).json({ success: true, message: "Tempat sampah berhasil diaktifkan kembali" });
        }
        catch (error) {
            console.error("[superUserController] reactivateBin error:", error);
            if (error.message === "BIN_NOT_FOUND") {
                res
                    .status(404)
                    .json({ success: false, error: "NOT_FOUND", message: "Tempat sampah tidak ditemukan" });
            }
            else {
                res
                    .status(500)
                    .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
            }
        }
    }
    async handoverKkn(req, res) {
        try {
            const { fromUserId, toUserId, rtRwId, notes } = req.body;
            if (!fromUserId || !toUserId || !rtRwId) {
                res.status(400).json({
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: "fromUserId, toUserId, dan rtRwId wajib diisi",
                });
                return;
            }
            const adminUserId = req.user.userId;
            const result = await superUserService.handoverKkn({ fromUserId, toUserId, rwId: parseInt(rtRwId), notes }, adminUserId);
            res
                .status(200)
                .json({ success: true, data: result, message: "Handover tugas KKN berhasil diselesaikan" });
        }
        catch (error) {
            console.error("[superUserController] handoverKkn error:", error);
            if (error.message === "FROM_USER_INVALID" || error.message === "TO_USER_INVALID") {
                res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: "Mahasiswa asal atau tujuan tidak valid / bukan mahasiswa KKN",
                });
            }
            else {
                res
                    .status(500)
                    .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
            }
        }
    }
    async getKknHandoverHistory(req, res) {
        try {
            const data = await superUserService.getKknHandoverHistory();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[superUserController] getKknHandoverHistory error:", error);
            res
                .status(500)
                .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
    async getQrMaster(req, res) {
        try {
            const { search, status } = req.query;
            const data = await superUserService.getQrMaster({
                search: search,
                status: status,
            });
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[superUserController] getQrMaster error:", error);
            res
                .status(500)
                .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
    async generateQrBatch(req, res) {
        try {
            const { batchCode, totalQr, categoryId, rtRwId } = req.body;
            if (!totalQr) {
                res
                    .status(400)
                    .json({ success: false, error: "VALIDATION_ERROR", message: "totalQr wajib diisi" });
                return;
            }
            const adminUserId = req.user.userId;
            const batch = await superUserService.generateQrBatch({
                batchCode: batchCode || undefined,
                totalQr: parseInt(totalQr),
                categoryId: categoryId || undefined,
                rwId: rtRwId ? parseInt(rtRwId) : undefined,
            }, adminUserId);
            res
                .status(201)
                .json({ success: true, data: batch, message: "Batch QR Code berhasil digenerate" });
        }
        catch (error) {
            console.error("[superUserController] generateQrBatch error:", error);
            if (error.message === "BATCH_CODE_EXISTS") {
                res
                    .status(409)
                    .json({ success: false, error: "CONFLICT", message: "Kode batch sudah digunakan" });
            }
            else {
                res
                    .status(500)
                    .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
            }
        }
    }
    async getAuditTrail(req, res) {
        try {
            const { action, userId, startDate, endDate, search } = req.query;
            const data = await superUserService.getAuditTrail({
                action: action,
                userId: userId,
                startDate: startDate,
                endDate: endDate,
                search: search,
            });
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[superUserController] getAuditTrail error:", error);
            res
                .status(500)
                .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
    async getAggregatedDashboard(req, res) {
        try {
            const data = await superUserService.getAggregatedDashboard();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[superUserController] getAggregatedDashboard error:", error);
            res
                .status(500)
                .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
    async getPendingBins(req, res) {
        try {
            const data = await superUserService.getPendingBins();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[superUserController] getPendingBins error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async approveBin(req, res) {
        try {
            const { id } = req.params;
            const adminUserId = req.user.userId;
            const data = await superUserService.approveBin(id, adminUserId);
            res.status(200).json({ success: true, data, message: "Bin berhasil diaktifkan" });
        }
        catch (error) {
            console.error("[superUserController] approveBin error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async rejectBin(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            if (!reason) {
                res.status(400).json({ success: false, message: "Alasan penolakan wajib diisi" });
                return;
            }
            const data = await superUserService.rejectBin(id, reason);
            res.status(200).json({ success: true, data, message: "Pengajuan bin ditolak" });
        }
        catch (error) {
            console.error("[superUserController] rejectBin error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getPendingPetugas(req, res) {
        try {
            const data = await superUserService.getPendingPetugas();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[superUserController] getPendingPetugas error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async verifyPetugas(req, res) {
        try {
            const { id } = req.params;
            const { action } = req.body; // "APPROVED" or "REJECTED"
            if (!["APPROVED", "REJECTED"].includes(action)) {
                res.status(400).json({ success: false, message: "Aksi tidak valid" });
                return;
            }
            const data = await superUserService.verifyPetugas(id, action);
            res.status(200).json({ success: true, data, message: "Verifikasi petugas berhasil" });
        }
        catch (error) {
            console.error("[superUserController] verifyPetugas error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async updateBinStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!status) {
                res.status(400).json({ success: false, message: "Status wajib diisi" });
                return;
            }
            const adminUserId = req.user.userId;
            const data = await superUserService.updateBinStatus(id, status, adminUserId);
            res.status(200).json({ success: true, data, message: "Status tempat sampah berhasil diperbarui" });
        }
        catch (error) {
            console.error("[superUserController] updateBinStatus error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async replaceBrokenBin(req, res) {
        try {
            const { id } = req.params;
            const { newBinId } = req.body;
            if (!newBinId) {
                res.status(400).json({ success: false, message: "newBinId wajib diisi" });
                return;
            }
            const adminUserId = req.user.userId;
            const data = await superUserService.replaceBrokenBin(id, newBinId, adminUserId);
            res.status(200).json({ success: true, data, message: "Penggantian tempat sampah rusak berhasil" });
        }
        catch (error) {
            console.error("[superUserController] replaceBrokenBin error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async deleteBin(req, res) {
        try {
            const { id } = req.params;
            const adminUserId = req.user.userId;
            const data = await superUserService.deleteBin(id, adminUserId);
            res.status(200).json({ success: true, data, message: "Tempat sampah berhasil dihapus" });
        }
        catch (error) {
            console.error("[superUserController] deleteBin error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async purgeDuplicates(req, res) {
        try {
            const adminUserId = req.user.userId;
            const data = await superUserService.checkAndPurgeDuplicateUsers(adminUserId);
            res.status(200).json({ success: true, data, message: "Data cleansing pengguna ganda selesai" });
        }
        catch (error) {
            console.error("[superUserController] purgeDuplicates error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getCircularEconomyReport(_req, res) {
        try {
            const data = await superUserService.getCircularEconomyReport();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[superUserController] getCircularEconomyReport error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
export const superUserController = new superUserController();
