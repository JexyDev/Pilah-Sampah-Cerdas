/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { residuService } from "../services/residuService.js";

export class ResiduController {
  async getPendingLogs(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== "PETUGAS_RESIDU") {
        res
          .status(403)
          .json({ error: "FORBIDDEN", message: "Only Petugas Residu can access this." });
        return;
      }
      res.status(200).json({ success: true, data: [] });
    } catch (error: any) {
      console.error("[ResiduController] getPendingLogs error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memuat log." });
    }
  }

  /**
   * Get daily schedule for Petugas (Bins > 70% in their zone)
   */
  async getJadwalHarian(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== "PETUGAS_RESIDU") {
        res
          .status(403)
          .json({ error: "FORBIDDEN", message: "Only Petugas Residu can access this." });
        return;
      }

      const userId = req.user.userId;
      // Get petugas assigned zone
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      const petugas = await prisma.petugasResidu.findUnique({ where: { userId: userId } });

      const zoneSearch = petugas?.assignedZone || "";

      // Get all bins > 70% in zone
      const bins = await prisma.bin.findMany({
        where: {
          status: "ACTIVE_BOUND",
          rtRw: {
            name: {
              contains: zoneSearch,
            },
          },
        },
        include: {
          category: true,
          rtRw: true,
          user: true,
        },
      });

      const targetBins = bins.filter((b) => {
        const vol = Number(b.currentVolumeLiter);
        const max = Number(b.maxCapacityLiter);
        return max > 0 && vol / max >= 0.7;
      });

      res.status(200).json({
        success: true,
        data: targetBins,
      });
    } catch (error: any) {
      console.error("[ResiduController] getJadwalHarian error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memuat jadwal harian." });
    }
  }

  async recordViolation(req: Request, res: Response) {
    try {
      const petugasUserId = req.user!.userId;
      const result = await residuService.recordViolation(petugasUserId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[ResiduController] recordViolation error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getDashboardSummary(req: Request, res: Response) {
    try {
      const petugasUserId = req.user!.userId;
      const data = await residuService.getDashboardSummary(petugasUserId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[ResiduController] getDashboardSummary error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAnalytics(req: Request, res: Response) {
    try {
      const data = await residuService.getAnalytics();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[ResiduController] getAnalytics error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  async submitLog(req: Request, res: Response) {
    try {
      const petugasUserId = req.user!.userId;
      const data = await residuService.submitLog(petugasUserId, req.body);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[ResiduController] submitLog error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const residuController = new ResiduController();
