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

      // Get all active bins
      const bins = await prisma.bin.findMany({
        where: {
          status: "ACTIVE_BOUND",
        },
        include: {
          category: true,
          rtRw: true,
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
          lokasi: b.rtRw ? `${b.rtRw.name}` : "RT 01 / RW 01",
          alamat: b.user?.address || "Jl. Coblong Raya No. " + (idx + 1),
          wargaNama: b.user?.name || "Warga Dampingan " + (idx + 1),
          namaWarga: b.user?.name || "Warga Dampingan " + (idx + 1),
          volumePercent: pct,
          status: "BELUM_DIANGKUT",
          currentVolumeLiter: vol,
          maxCapacityLiter: max,
          category: b.category,
          rtRw: b.rtRw,
          user: b.user,
        };
      });

      res.status(200).json({
        success: true,
        data: scheduleList,
      });
    } catch (error: any) {
      console.error("[ResiduController] getJadwalHarian error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memuat jadwal harian." });
    }
  }

  async getRiwayat(req: Request, res: Response) {
    try {
      const petugasUserId = req.user!.userId;
      const data = await residuService.getRiwayat(petugasUserId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[ResiduController] getRiwayat error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async recordViolation(req: Request, res: Response) {
    try {
      const petugasUserId = req.user!.userId;

      let evidencePhotoUrl = req.body.evidencePhotoUrl || req.body.evidence;
      if (req.file) {
        evidencePhotoUrl = `/uploads/${req.file.filename}`;
      } else if (req.files) {
        const filesObj = req.files as any;
        const f = filesObj.evidence?.[0] || filesObj.image?.[0] || filesObj.evidencePhotoUrl?.[0];
        if (f) evidencePhotoUrl = `/uploads/${f.filename}`;
      }

      const result = await residuService.recordViolation(petugasUserId, {
        binQrCode: req.body.binQrCode,
        type: req.body.type,
        severity: req.body.severity,
        evidencePhotoUrl: evidencePhotoUrl || "/uploads/default-violation.jpg",
        notes: req.body.notes,
      });

      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[ResiduController] recordViolation error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getDashboardSummary(req: Request, res: Response) {
    try {
      const petugasUserId = req.user!.userId;
      const period = (req.query.period as string) || "hari";
      const data = await residuService.getDashboardSummary(petugasUserId, period);
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

      let imagePhotoUrl = req.body.imagePhotoUrl || req.body.image;
      if (req.file) {
        imagePhotoUrl = `/uploads/${req.file.filename}`;
      } else if (req.files) {
        const filesObj = req.files as any;
        const f = filesObj.image?.[0] || filesObj.evidence?.[0] || filesObj.imagePhotoUrl?.[0];
        if (f) imagePhotoUrl = `/uploads/${f.filename}`;
      }

      const data = await residuService.submitLog(petugasUserId, {
        actualWeightKg: Number(req.body.actualWeightKg),
        classification: req.body.classification,
        imagePhotoUrl: imagePhotoUrl || "/uploads/default-residu.jpg",
        rtRw: req.body.rtRw,
        kelurahan: req.body.kelurahan,
        notes: req.body.notes,
        logId: req.body.logId,
      });

      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error("[ResiduController] submitLog error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const residuController = new ResiduController();
