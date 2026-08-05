/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { superAdminService } from "../services/superAdminService.js";
export class SuperAdminController {
    async getInactiveBins(req, res) {
        try {
            const { search } = req.query;
            const data = await superAdminService.getInactiveBins({ search: search });
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[SuperAdminController] getInactiveBins error:", error);
            res
                .status(500)
                .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
    async reactivateBin(req, res) {
        try {
            const { id } = req.params;
            const adminUserId = req.user.userId;
            await superAdminService.reactivateBin(id, adminUserId);
            res.status(200).json({ success: true, message: "Tempat sampah berhasil diaktifkan kembali" });
        }
        catch (error) {
            console.error("[SuperAdminController] reactivateBin error:", error);
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
            const result = await superAdminService.handoverKkn({ fromUserId, toUserId, rtRwId: parseInt(rtRwId), notes }, adminUserId);
            res
                .status(200)
                .json({ success: true, data: result, message: "Handover tugas KKN berhasil diselesaikan" });
        }
        catch (error) {
            console.error("[SuperAdminController] handoverKkn error:", error);
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
            const data = await superAdminService.getKknHandoverHistory();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[SuperAdminController] getKknHandoverHistory error:", error);
            res
                .status(500)
                .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
    async getQrMaster(req, res) {
        try {
            const { search, status } = req.query;
            const data = await superAdminService.getQrMaster({
                search: search,
                status: status,
            });
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[SuperAdminController] getQrMaster error:", error);
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
            const batch = await superAdminService.generateQrBatch({
                batchCode: batchCode || undefined,
                totalQr: parseInt(totalQr),
                categoryId: categoryId || undefined,
                rtRwId: rtRwId ? parseInt(rtRwId) : undefined,
            }, adminUserId);
            res
                .status(201)
                .json({ success: true, data: batch, message: "Batch QR Code berhasil digenerate" });
        }
        catch (error) {
            console.error("[SuperAdminController] generateQrBatch error:", error);
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
            const data = await superAdminService.getAuditTrail({
                action: action,
                userId: userId,
                startDate: startDate,
                endDate: endDate,
                search: search,
            });
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[SuperAdminController] getAuditTrail error:", error);
            res
                .status(500)
                .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
    async getAggregatedDashboard(req, res) {
        try {
            const data = await superAdminService.getAggregatedDashboard();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[SuperAdminController] getAggregatedDashboard error:", error);
            res
                .status(500)
                .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    }
    async getPendingBins(req, res) {
        try {
            const data = await superAdminService.getPendingBins();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[SuperAdminController] getPendingBins error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async approveBin(req, res) {
        try {
            const { id } = req.params;
            const adminUserId = req.user.userId;
            const data = await superAdminService.approveBin(id, adminUserId);
            res.status(200).json({ success: true, data, message: "Bin berhasil diaktifkan" });
        }
        catch (error) {
            console.error("[SuperAdminController] approveBin error:", error);
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
            const data = await superAdminService.rejectBin(id, reason);
            res.status(200).json({ success: true, data, message: "Pengajuan bin ditolak" });
        }
        catch (error) {
            console.error("[SuperAdminController] rejectBin error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getPendingPetugas(req, res) {
        try {
            const data = await superAdminService.getPendingPetugas();
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            console.error("[SuperAdminController] getPendingPetugas error:", error);
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
            const data = await superAdminService.verifyPetugas(id, action);
            res.status(200).json({ success: true, data, message: "Verifikasi petugas berhasil" });
        }
        catch (error) {
            console.error("[SuperAdminController] verifyPetugas error:", error);
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
            const data = await superAdminService.updateBinStatus(id, status, adminUserId);
            res.status(200).json({ success: true, data, message: "Status tempat sampah berhasil diperbarui" });
        }
        catch (error) {
            console.error("[SuperAdminController] updateBinStatus error:", error);
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
            const data = await superAdminService.replaceBrokenBin(id, newBinId, adminUserId);
            res.status(200).json({ success: true, data, message: "Penggantian tempat sampah rusak berhasil" });
        }
        catch (error) {
            console.error("[SuperAdminController] replaceBrokenBin error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async deleteBin(req, res) {
        try {
            const { id } = req.params;
            const adminUserId = req.user.userId;
            const data = await superAdminService.deleteBin(id, adminUserId);
            res.status(200).json({ success: true, data, message: "Tempat sampah berhasil dihapus" });
        }
        catch (error) {
            console.error("[SuperAdminController] deleteBin error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
export const superAdminController = new SuperAdminController();
