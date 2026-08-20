/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { superUserService } from "../services/superUserService.js";

export class SuperUserController {
  async getInactiveBins(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;
      const data = await superUserService.getInactiveBins({ search: search as string });
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[superUserController] getInactiveBins error:", error);
      res
        .status(500)
        .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  async reactivateBin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.user!.userId;
      await superUserService.reactivateBin(id, adminUserId);
      res.status(200).json({ success: true, message: "Tempat sampah berhasil diaktifkan kembali" });
    } catch (error: any) {
      console.error("[superUserController] reactivateBin error:", error);
      if (error.message === "BIN_NOT_FOUND") {
        res
          .status(404)
          .json({ success: false, error: "NOT_FOUND", message: "Tempat sampah tidak ditemukan" });
      } else {
        res
          .status(500)
          .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }
  }

  async handoverKkn(req: Request, res: Response): Promise<void> {
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

      const adminUserId = req.user!.userId;
      const result = await superUserService.handoverKkn(
        { fromUserId, toUserId, rwId: parseInt(rtRwId), notes },
        adminUserId
      );

      res
        .status(200)
        .json({ success: true, data: result, message: "Handover tugas KKN berhasil diselesaikan" });
    } catch (error: any) {
      console.error("[superUserController] handoverKkn error:", error);
      if (error.message === "FROM_USER_INVALID" || error.message === "TO_USER_INVALID") {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: "Mahasiswa asal atau tujuan tidak valid / bukan mahasiswa KKN",
        });
      } else {
        res
          .status(500)
          .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }
  }

  async getKknHandoverHistory(req: Request, res: Response): Promise<void> {
    try {
      const data = await superUserService.getKknHandoverHistory();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[superUserController] getKknHandoverHistory error:", error);
      res
        .status(500)
        .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  async getQrMaster(req: Request, res: Response): Promise<void> {
    try {
      const { search, status } = req.query;
      const data = await superUserService.getQrMaster({
        search: search as string,
        status: status as string,
      });
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[superUserController] getQrMaster error:", error);
      res
        .status(500)
        .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  async generateQrBatch(req: Request, res: Response): Promise<void> {
    try {
      const { batchCode, totalQr, categoryId, rtRwId } = req.body;
      if (!totalQr) {
        res
          .status(400)
          .json({ success: false, error: "VALIDATION_ERROR", message: "totalQr wajib diisi" });
        return;
      }

      const adminUserId = req.user!.userId;
      const batch = await superUserService.generateQrBatch(
        {
          batchCode: batchCode || undefined,
          totalQr: parseInt(totalQr),
          categoryId: categoryId || undefined,
          rwId: rtRwId ? parseInt(rtRwId) : undefined,
        },
        adminUserId
      );

      res
        .status(201)
        .json({ success: true, data: batch, message: "Batch QR Code berhasil digenerate" });
    } catch (error: any) {
      console.error("[superUserController] generateQrBatch error:", error);
      if (error.message === "BATCH_CODE_EXISTS") {
        res
          .status(409)
          .json({ success: false, error: "CONFLICT", message: "Kode batch sudah digunakan" });
      } else {
        res
          .status(500)
          .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }
  }

  async getAuditTrail(req: Request, res: Response): Promise<void> {
    try {
      const { action, userId, startDate, endDate, search } = req.query;
      const data = await superUserService.getAuditTrail({
        action: action as string,
        userId: userId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
      });
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[superUserController] getAuditTrail error:", error);
      res
        .status(500)
        .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  async getAggregatedDashboard(req: Request, res: Response): Promise<void> {
    try {
      const data = await superUserService.getAggregatedDashboard();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[superUserController] getAggregatedDashboard error:", error);
      res
        .status(500)
        .json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  async getPendingBins(req: Request, res: Response): Promise<void> {
    try {
      const data = await superUserService.getPendingBins();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[superUserController] getPendingBins error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async approveBin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.user!.userId;
      const data = await superUserService.approveBin(id, adminUserId);
      res.status(200).json({ success: true, data, message: "Bin berhasil diaktifkan" });
    } catch (error: any) {
      console.error("[superUserController] approveBin error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async rejectBin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      if (!reason) {
        res.status(400).json({ success: false, message: "Alasan penolakan wajib diisi" });
        return;
      }
      const data = await superUserService.rejectBin(id, reason);
      res.status(200).json({ success: true, data, message: "Pengajuan bin ditolak" });
    } catch (error: any) {
      console.error("[superUserController] rejectBin error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPendingPetugas(req: Request, res: Response): Promise<void> {
    try {
      const data = await superUserService.getPendingPetugas();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[superUserController] getPendingPetugas error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async verifyPetugas(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { action } = req.body; // "APPROVED" or "REJECTED"
      if (!["APPROVED", "REJECTED"].includes(action)) {
        res.status(400).json({ success: false, message: "Aksi tidak valid" });
        return;
      }
      const data = await superUserService.verifyPetugas(id, action as "APPROVED" | "REJECTED");
      res.status(200).json({ success: true, data, message: "Verifikasi petugas berhasil" });
    } catch (error: any) {
      console.error("[superUserController] verifyPetugas error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateBinStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        res.status(400).json({ success: false, message: "Status wajib diisi" });
        return;
      }
      const adminUserId = req.user!.userId;
      const data = await superUserService.updateBinStatus(id, status, adminUserId);
      res
        .status(200)
        .json({ success: true, data, message: "Status tempat sampah berhasil diperbarui" });
    } catch (error: any) {
      console.error("[superUserController] updateBinStatus error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async replaceBrokenBin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newBinId } = req.body;
      if (!newBinId) {
        res.status(400).json({ success: false, message: "newBinId wajib diisi" });
        return;
      }
      const adminUserId = req.user!.userId;
      const data = await superUserService.replaceBrokenBin(id, newBinId, adminUserId);
      res
        .status(200)
        .json({ success: true, data, message: "Penggantian tempat sampah rusak berhasil" });
    } catch (error: any) {
      console.error("[superUserController] replaceBrokenBin error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteBin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.user!.userId;
      const data = await superUserService.deleteBin(id, adminUserId);
      res.status(200).json({ success: true, data, message: "Tempat sampah berhasil dihapus" });
    } catch (error: any) {
      console.error("[superUserController] deleteBin error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async purgeDuplicates(req: Request, res: Response): Promise<void> {
    try {
      const adminUserId = req.user!.userId;
      const data = await superUserService.checkAndPurgeDuplicateUsers(adminUserId);
      res
        .status(200)
        .json({ success: true, data, message: "Data cleansing pengguna ganda selesai" });
    } catch (error: any) {
      console.error("[superUserController] purgeDuplicates error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getCircularEconomyReport(_req: Request, res: Response): Promise<void> {
    try {
      const data = await superUserService.getCircularEconomyReport();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[superUserController] getCircularEconomyReport error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const superUserController = new SuperUserController();
