import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { residuService } from "../services/residuService.js";

export class ResiduController {
  async getPendingLogs(req: Request, res: Response): Promise<void> {
    try {
      const petugasUserId = req.user!.userId;
      const data = await residuService.getPendingLogs(petugasUserId);
      res.status(200).json({ success: true, data });
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

      const kelurahanFilter = req.query.kelurahan as string | undefined;
      const rwFilter = req.query.rw as string | undefined;

      let whereCondition: any = {
        status: "ACTIVE_BOUND",
      };

      if (rwFilter) {
        whereCondition.rw = {
          name: { contains: rwFilter, mode: "insensitive" },
        };
      }

      // Get all active bins
      const bins = await prisma.bin.findMany({
        where: whereCondition,
        include: {
          category: true,
          rw: {
            include: { kelurahan: true },
          },
          user: true,
        },
        take: 20,
      });

      let filteredBins = bins;
      if (kelurahanFilter) {
        filteredBins = bins.filter((b: any) =>
          b.rw?.kelurahan?.name?.toLowerCase().includes(kelurahanFilter.toLowerCase())
        );
      }

      const targetBins = filteredBins.filter((b: any) => {
        const vol = Number(b.currentVolumeLiter);
        const max = Number(b.maxCapacityLiter);
        return max > 0 && vol / max >= 0.7;
      });

      const finalBins = targetBins.length > 0 ? targetBins : filteredBins;

      if (finalBins.length === 0) {
        res.status(200).json([]);
        return;
      }

      const scheduleList = finalBins.map((b: any, idx: number) => {
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
      const range = req.query.range as string;
      const type = req.query.type as string;
      const data = await residuService.getRiwayat(petugasUserId, range, type);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[ResiduController] getRiwayat error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPetugasPoints(req: Request, res: Response): Promise<void> {
    try {
      const petugasUserId = req.user!.userId;
      const data = await residuService.getPetugasPoints(petugasUserId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[ResiduController] getPetugasPoints error:", error);
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

      if (!evidencePhotoUrl) {
        res.status(400).json({ success: false, message: "Foto bukti pelanggaran wajib diunggah" });
        return;
      }

      const result = await residuService.recordViolation(petugasUserId, {
        binQrCode: req.body.binQrCode,
        type: req.body.type,
        severity: req.body.severity,
        evidencePhotoUrl,
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
      const petugasUserId = req.user?.userId;
      const data = await residuService.getAnalytics(petugasUserId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[ResiduController] getAnalytics error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async submitLog(req: Request, res: Response) {
    try {
      const petugasUserId = req.user!.userId;

      let imagePhotoUrl = req.body.imagePhotoUrl || req.body.image || req.body.photoPath;
      if (req.file) {
        imagePhotoUrl = `/uploads/${req.file.filename}`;
      } else if (req.files) {
        const filesObj = req.files as any;
        const f = filesObj.image?.[0] || filesObj.evidence?.[0] || filesObj.imagePhotoUrl?.[0];
        if (f) imagePhotoUrl = `/uploads/${f.filename}`;
      }

      if (!imagePhotoUrl) {
        res.status(400).json({ success: false, message: "Foto bukti residu wajib diunggah" });
        return;
      }

      const data = await residuService.submitLog(petugasUserId, {
        actualWeightKg: req.body.actualWeightKg || req.body.weight,
        classification: req.body.classification || req.body.kategori,
        imagePhotoUrl,
        rw: req.body.rw,
        kelurahan: req.body.kelurahan,
        notes: req.body.notes,
        logId: req.body.logId,
        binId: req.body.binId,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
      });

      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error("[ResiduController] submitLog error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getPengajuan(req: Request, res: Response): Promise<void> {
    try {
      const data = await residuService.getPengajuanResetBin();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[ResiduController] getPengajuan error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async acceptPengajuan(req: Request, res: Response): Promise<void> {
    try {
      const petugasUserId = req.user!.userId;
      const { id } = req.params;
      const data = await residuService.acceptPengajuanResetBin(id, petugasUserId);
      res.status(200).json({
        success: true,
        message: "Pengajuan reset tempat sampah berhasil diambil oleh petugas.",
        data,
      });
    } catch (error: any) {
      console.error("[ResiduController] acceptPengajuan error:", error);
      if (error.message === "PERMINTAAN_SUDAH_DIAMBIL") {
        res.status(409).json({
          success: false,
          error: "PERMINTAAN_SUDAH_DIAMBIL",
          message: "Permintaan reset ini sudah diambil oleh petugas lain.",
        });
        return;
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const residuController = new ResiduController();
