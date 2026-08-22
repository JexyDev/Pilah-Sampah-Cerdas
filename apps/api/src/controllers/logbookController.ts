/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Controller Logbook KKN (Mahasiswa & DPL)
 */

import { Request, Response } from "express";
import { logbookService } from "../services/logbookService.js";
import { prisma } from "../lib/prisma.js";

function getUserId(req: Request): string {
  return req.user?.userId || (req.user as any)?.id || "";
}

function getUserRole(req: Request): string {
  return String((req.user as any)?.role || (req.user as any)?.peran || "").toUpperCase();
}

export const logbookController = {
  /**
   * Mengambil list logbook mahasiswa (Tabular)
   */
  getMahasiswaLogbooks: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);
      const userRole = getUserRole(req);
      const {
        groupId,
        pekanKe,
        statusApproval,
        tipeAktivitas,
        search,
        startDate,
        endDate,
      } = req.query;

      const data = await logbookService.getMahasiswaLogbooks(userId, userRole, {
        groupId: groupId as string,
        pekanKe: pekanKe ? parseInt(pekanKe as string, 10) : undefined,
        statusApproval: statusApproval as string,
        tipeAktivitas: tipeAktivitas as string,
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[logbookController.getMahasiswaLogbooks] error:", error);
      res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  },

  /**
   * Submit logbook aktivitas baru oleh Mahasiswa
   */
  createMahasiswaLogbook: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);
      const userRole = getUserRole(req);

      let fotoBuktiUrl = req.body.fotoBuktiUrl || req.body.fotoUrl || req.body.evidencePhotoUrl;
      if (req.file) {
        fotoBuktiUrl = `/uploads/${req.file.filename}`;
      } else if (req.files) {
        const filesObj = req.files as any;
        const f = filesObj.fotoBukti?.[0] || filesObj.image?.[0] || filesObj.foto?.[0] || filesObj.file?.[0];
        if (f) fotoBuktiUrl = `/uploads/${f.filename}`;
      }

      const payload = {
        tanggalKegiatan: req.body.tanggalKegiatan || req.body.tanggal,
        waktuMulai: req.body.waktuMulai,
        waktuSelesai: req.body.waktuSelesai,
        tempat: req.body.tempat,
        deskripsi: req.body.deskripsi,
        fotoBuktiUrl,
        tipeAktivitas: req.body.tipeAktivitas,
        programKerjaId: req.body.programKerjaId || undefined,
        fasilitasId: req.body.fasilitasId || undefined,
        pekanKe: req.body.pekanKe ? parseInt(req.body.pekanKe, 10) : undefined,
      };

      const data = await logbookService.createMahasiswaLogbook(userId, userRole, payload);

      res.status(201).json({
        success: true,
        message: "Logbook aktivitas berhasil disimpan dan diajukan untuk proses persetujuan.",
        data,
      });
    } catch (error: any) {
      console.error("[logbookController.createMahasiswaLogbook] error:", error);
      res.status(400).json({ success: false, message: error.message || "Gagal menyimpan logbook" });
    }
  },

  /**
   * Persetujuan oleh Ketua Kelompok
   */
  approveByKetua: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const ketuaUserId = getUserId(req);
      const { action, catatanKetua } = req.body;

      if (!["APPROVE", "REJECT"].includes(action)) {
        res.status(400).json({ success: false, message: "Aksi harus 'APPROVE' atau 'REJECT'" });
        return;
      }

      const data = await logbookService.approveByKetua(id, ketuaUserId, action, catatanKetua);
      res.status(200).json({
        success: true,
        message:
          action === "APPROVE"
            ? "Logbook aktivitas berhasil disetujui Ketua Kelompok dan diteruskan ke DPL."
            : "Logbook aktivitas ditolak oleh Ketua Kelompok.",
        data,
      });
    } catch (error: any) {
      console.error("[logbookController.approveByKetua] error:", error);
      res.status(400).json({ success: false, message: error.message || "Gagal memproses persetujuan ketua" });
    }
  },

  /**
   * Verifikasi oleh DPL (Single)
   */
  verifikasiByDpl: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const dplUserId = getUserId(req);
      const userRole = getUserRole(req);
      const { action, catatanDpl } = req.body;

      if (!["APPROVE", "REVISI"].includes(action)) {
        res.status(400).json({ success: false, message: "Aksi harus 'APPROVE' atau 'REVISI'" });
        return;
      }

      const data = await logbookService.verifikasiByDpl(id, dplUserId, userRole, action, catatanDpl);
      res.status(200).json({
        success: true,
        message:
          action === "APPROVE"
            ? "Logbook aktivitas berhasil diverifikasi dan disetujui resmi oleh DPL."
            : "Logbook aktivitas ditandai perlu revisi.",
        data,
      });
    } catch (error: any) {
      console.error("[logbookController.verifikasiByDpl] error:", error);
      res.status(400).json({ success: false, message: error.message || "Gagal memverifikasi logbook" });
    }
  },

  /**
   * Batch Verifikasi oleh DPL
   */
  batchVerifikasiByDpl: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = getUserRole(req);
      const { logbookIds, action, catatanDpl } = req.body;

      if (!Array.isArray(logbookIds) || logbookIds.length === 0) {
        res.status(400).json({ success: false, message: "Daftar logbookIds wajib berupa array dan tidak kosong" });
        return;
      }

      const results = await logbookService.batchVerifikasiByDpl(logbookIds, dplUserId, userRole, action || "APPROVE", catatanDpl);
      res.status(200).json({
        success: true,
        message: `Batch verifikasi logbook selesai diproses (${results.filter((r) => r.success).length} berhasil).`,
        data: results,
      });
    } catch (error: any) {
      console.error("[logbookController.batchVerifikasiByDpl] error:", error);
      res.status(400).json({ success: false, message: error.message || "Gagal memproses batch verifikasi" });
    }
  },

  /**
   * Mengambil logbook monitoring DPL (Minimal 1x per pekan)
   */
  getDplLogbooks: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = getUserRole(req);
      const { groupId } = req.query;

      const data = await logbookService.getDplLogbooks(dplUserId, userRole, groupId as string);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[logbookController.getDplLogbooks] error:", error);
      res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  },

  /**
   * Submit logbook monitoring mingguan DPL
   */
  createDplLogbook: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = getUserRole(req);

      let fotoBuktiUrl = req.body.fotoBuktiUrl || req.body.fotoUrl;
      if (req.file) {
        fotoBuktiUrl = `/uploads/${req.file.filename}`;
      }

      const payload = {
        kelompokId: req.body.kelompokId,
        tanggal: req.body.tanggal,
        pekanKe: parseInt(req.body.pekanKe, 10),
        tempat: req.body.tempat,
        deskripsi: req.body.deskripsi,
        arahanEvaluasi: req.body.arahanEvaluasi,
        fotoBuktiUrl,
      };

      const data = await logbookService.createDplLogbook(dplUserId, userRole, payload);
      res.status(201).json({
        success: true,
        message: "Logbook monitoring mingguan DPL berhasil dicatat.",
        data,
      });
    } catch (error: any) {
      console.error("[logbookController.createDplLogbook] error:", error);
      res.status(400).json({ success: false, message: error.message || "Gagal menyimpan logbook DPL" });
    }
  },

  /**
   * Mengambil statistik kepatuhan logbook & skor otomatis
   */
  getComplianceScore: async (req: Request, res: Response): Promise<void> => {
    try {
      const { kelompokId } = req.params;
      if (!kelompokId) {
        res.status(400).json({ success: false, message: "kelompokId wajib disertakan" });
        return;
      }

      const target = req.query.target ? parseInt(req.query.target as string, 10) : undefined;
      const data = await logbookService.getLogbookComplianceScore(kelompokId, target);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[logbookController.getComplianceScore] error:", error);
      res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  },

  /**
   * Konfigurasi toleransi backdate (developer setting)
   */
  getToleranceConfig: async (_req: Request, res: Response): Promise<void> => {
    try {
      const days = await logbookService.getBackdateToleranceDays();
      res.status(200).json({
        success: true,
        data: {
          toleranceDays: days,
          description: `Pengisian logbook diizinkan maksimal ${days} hari sebelumnya (H-${days}).`,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Mengubah konfigurasi toleransi backdate (khusus developer / super user)
   */
  updateToleranceConfig: async (req: Request, res: Response): Promise<void> => {
    try {
      const { toleranceDays } = req.body;
      if (toleranceDays === undefined || isNaN(Number(toleranceDays)) || Number(toleranceDays) < 0) {
        res.status(400).json({ success: false, message: "toleranceDays harus berupa angka >= 0" });
        return;
      }

      const daysNum = parseInt(toleranceDays, 10);
      const user = req.user as any;

      await prisma.systemConfig.upsert({
        where: { key: "logbook_backdate_tolerance_days" },
        create: {
          key: "logbook_backdate_tolerance_days",
          value: String(daysNum),
          tipe: "NUMBER",
          deskripsi: "Batas toleransi hari keterlambatan input logbook KKN (H-x)",
          updatedBy: user?.name || user?.userId || "DEVELOPER",
        },
        update: {
          value: String(daysNum),
          updatedBy: user?.name || user?.userId || "DEVELOPER",
        },
      });

      res.status(200).json({
        success: true,
        message: `Konfigurasi toleransi pengisian logbook berhasil diubah menjadi ${daysNum} hari sebelumnya (H-${daysNum}).`,
        data: { toleranceDays: daysNum },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
