/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo,
 * tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 *
 * Controller: Poin Mahasiswa KKN
 * Endpoint simulasi dan normalisasi poin berdasarkan formula kelompok.
 */

import { Request, Response } from "express";
import { mahasiswaPoinService } from "../services/mahasiswaPoinService.js";

export const mahasiswaPoinController = {
  /**
   * GET /api/v1/points/kkn/simulasi
   * Simulasi / preview perhitungan poin KKN semua kelompok tanpa commit ke DB.
   * Akses: DEVELOPER, SUPER_USER
   */
  async simulasiFormula(req: Request, res: Response): Promise<void> {
    try {
      const hasil = await mahasiswaPoinService.simulasiFormula();
      res.status(200).json({
        success: true,
        message: "Simulasi formula poin KKN berhasil dihitung (tidak disimpan ke database)",
        data: hasil,
      });
    } catch (error: any) {
      console.error("[mahasiswaPoinController.simulasiFormula]", error);
      res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: error?.message ?? "Gagal menghitung simulasi poin KKN",
      });
    }
  },

  /**
   * POST /api/v1/points/kkn/normalisasi-bulk
   * Normalisasi poin KKN ke PointHistory untuk semua mahasiswa aktif.
   * Menghapus entri POIN_KKN_FINAL lama dan membuat yang baru.
   * Akses: DEVELOPER ONLY
   */
  async normalisasiPoinBulk(req: Request, res: Response): Promise<void> {
    try {
      const hasil = await mahasiswaPoinService.normalisasiPoinBulk();
      const statusCode = hasil.gagal === 0 ? 200 : 207; // 207 Multi-Status jika ada yang gagal
      res.status(statusCode).json({
        success: hasil.gagal === 0,
        message: `Normalisasi selesai: ${hasil.berhasil} kelompok berhasil, ${hasil.gagal} gagal`,
        data: hasil,
      });
    } catch (error: any) {
      console.error("[mahasiswaPoinController.normalisasiPoinBulk]", error);
      res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: error?.message ?? "Gagal melakukan normalisasi poin KKN",
      });
    }
  },
};
