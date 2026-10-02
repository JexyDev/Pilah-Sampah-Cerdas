/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { laporanAkhirService } from "../services/laporanAkhirService.js";

export class LaporanAkhirController {
  /**
   * Mengunggah berkas PDF & detail Laporan Akhir (Mahasiswa)
   */
  async submitLaporanAkhir(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || (req.user as any)?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Akses tidak sah." });
        return;
      }

      const result = await laporanAkhirService.submitLaporanAkhirIndividu(
        userId,
        req.body,
        req.file
      );

      res.status(200).json({
        success: true,
        message: "Laporan Akhir KKN berhasil disimpan dan diteruskan ke DPL.",
        data: result,
      });
    } catch (error: any) {
      console.error("[LaporanAkhirController] submitLaporanAkhir error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Gagal mengunggah laporan akhir.",
      });
    }
  }

  /**
   * Mengambil status Laporan Akhir milik mahasiswa yang sedang login
   */
  async getLaporanAkhirMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || (req.user as any)?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Akses tidak sah." });
        return;
      }

      const data = await laporanAkhirService.getLaporanAkhirMe(userId);

      res.status(200).json({
        success: true,
        message: data.hasSubmitted
          ? "Data laporan akhir berhasil dimuat"
          : "Belum ada laporan akhir yang diunggah",
        data,
      });
    } catch (error: any) {
      console.error("[LaporanAkhirController] getLaporanAkhirMe error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Gagal memuat status laporan akhir.",
      });
    }
  }

  /**
   * Mengambil riwayat pengajuan Laporan Akhir mahasiswa
   */
  async getLaporanAkhirHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || (req.user as any)?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Akses tidak sah." });
        return;
      }

      const history = await laporanAkhirService.getLaporanAkhirHistory(userId);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      console.error("[LaporanAkhirController] getLaporanAkhirHistory error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Gagal memuat riwayat laporan akhir.",
      });
    }
  }

  /**
   * Matriks Progres Laporan Akhir Seluruh Mahasiswa dalam Kelompok (Untuk DPL)
   */
  async getLaporanAkhirDplMatrix(req: Request, res: Response): Promise<void> {
    try {
      const { kelompokId } = req.params;
      if (!kelompokId) {
        res.status(400).json({ success: false, message: "Parameter kelompokId wajib disertakan." });
        return;
      }

      const matrix = await laporanAkhirService.getLaporanAkhirDplMatrix(kelompokId);

      res.status(200).json(matrix);
    } catch (error: any) {
      console.error("[LaporanAkhirController] getLaporanAkhirDplMatrix error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Gagal memuat matriks laporan akhir kelompok.",
      });
    }
  }
}

export const laporanAkhirController = new LaporanAkhirController();
