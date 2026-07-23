/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { superAdminService } from "../services/superAdminService.js";

export class SuperAdminController {
  async getInactiveBins(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;
      const data = await superAdminService.getInactiveBins({ search: search as string });
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[SuperAdminController] getInactiveBins error:", error);
      res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  async reactivateBin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.user!.userId;
      await superAdminService.reactivateBin(id, adminUserId);
      res.status(200).json({ success: true, message: "Tempat sampah berhasil diaktifkan kembali" });
    } catch (error: any) {
      console.error("[SuperAdminController] reactivateBin error:", error);
      if (error.message === "BIN_NOT_FOUND") {
        res.status(404).json({ success: false, error: "NOT_FOUND", message: "Tempat sampah tidak ditemukan" });
      } else {
        res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }
  }

  async handoverKkn(req: Request, res: Response): Promise<void> {
    try {
      const { fromUserId, toUserId, rtRwId, notes } = req.body;
      if (!fromUserId || !toUserId || !rtRwId) {
        res.status(400).json({ success: false, error: "VALIDATION_ERROR", message: "fromUserId, toUserId, dan rtRwId wajib diisi" });
        return;
      }

      const adminUserId = req.user!.userId;
      const result = await superAdminService.handoverKkn(
        { fromUserId, toUserId, rtRwId: parseInt(rtRwId), notes },
        adminUserId
      );

      res.status(200).json({ success: true, data: result, message: "Handover tugas KKN berhasil diselesaikan" });
    } catch (error: any) {
      console.error("[SuperAdminController] handoverKkn error:", error);
      if (error.message === "FROM_USER_INVALID" || error.message === "TO_USER_INVALID") {
        res.status(400).json({ success: false, error: "BAD_REQUEST", message: "Mahasiswa asal atau tujuan tidak valid / bukan mahasiswa KKN" });
      } else {
        res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }
  }

  async getKknHandoverHistory(req: Request, res: Response): Promise<void> {
    try {
      const data = await superAdminService.getKknHandoverHistory();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[SuperAdminController] getKknHandoverHistory error:", error);
      res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  async getQrMaster(req: Request, res: Response): Promise<void> {
    try {
      const { search, status } = req.query;
      const data = await superAdminService.getQrMaster({
        search: search as string,
        status: status as string,
      });
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[SuperAdminController] getQrMaster error:", error);
      res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  async generateQrBatch(req: Request, res: Response): Promise<void> {
    try {
      const { batchCode, totalQr, categoryId, rtRwId } = req.body;
      if (!batchCode || !totalQr || !categoryId || !rtRwId) {
        res.status(400).json({ success: false, error: "VALIDATION_ERROR", message: "batchCode, totalQr, categoryId, dan rtRwId wajib diisi" });
        return;
      }

      const adminUserId = req.user!.userId;
      const batch = await superAdminService.generateQrBatch(
        { batchCode, totalQr: parseInt(totalQr), categoryId, rtRwId: parseInt(rtRwId) },
        adminUserId
      );

      res.status(201).json({ success: true, data: batch, message: "Batch QR Code berhasil digenerate" });
    } catch (error: any) {
      console.error("[SuperAdminController] generateQrBatch error:", error);
      if (error.message === "BATCH_CODE_EXISTS") {
        res.status(409).json({ success: false, error: "CONFLICT", message: "Kode batch sudah digunakan" });
      } else {
        res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }
  }

  async getAuditTrail(req: Request, res: Response): Promise<void> {
    try {
      const { action, userId } = req.query;
      const data = await superAdminService.getAuditTrail({
        action: action as string,
        userId: userId as string,
      });
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[SuperAdminController] getAuditTrail error:", error);
      res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  async getAggregatedDashboard(req: Request, res: Response): Promise<void> {
    try {
      const data = await superAdminService.getAggregatedDashboard();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[SuperAdminController] getAggregatedDashboard error:", error);
      res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }
}

export const superAdminController = new SuperAdminController();
