/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { transactionService } from "../services/transactionService.js";

export const transactionController = {
  getDeposits: async (req: Request, res: Response) => {
    try {
      const { binCode } = req.query;
      const deposits = await transactionService.getDeposits(binCode as string);

      const mappedDeposits = deposits.map((d: any) => ({
        id: d.id,
        warga: d.household?.user?.name || "Unknown",
        rtRw: d.bin?.rtRw?.name || `RT/RW ${d.bin?.rtRwId}`,
        jenis: d.category?.name || d.categoryId,
        berat: Number(d.weightKg),
        poin: Math.floor(Number(d.weightKg) * (d.category?.pointsPerKg || 10)),
        waktu: d.createdAt,
        status: "Selesai",
        lokasi: `Tong: ${d.bin?.qrCode}`,
      }));

      res.status(200).json({ success: true, data: mappedDeposits });
    } catch (error) {
      console.error("[TransactionController] getDeposits error:", error);
      res.status(500).json({ success: false, message: "Gagal mengambil data setoran" });
    }
  },

  getMyDeposits: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const deposits = await transactionService.getMyDeposits(userId);

      const mappedDeposits = deposits.map((d: any) => ({
        id: d.id,
        jenis: d.category?.name || d.categoryId,
        berat: Number(d.weightKg),
        volume: `${Number(d.volumeLiter).toFixed(1)}L`,
        poin: Math.floor(Number(d.weightKg) * (d.category?.pointsPerKg || 10)),
        waktu: d.createdAt,
        status: "Selesai",
        lokasi: `Tong: ${d.bin?.qrCode}`,
      }));

      res.status(200).json({ success: true, data: mappedDeposits });
    } catch (error) {
      console.error("[TransactionController] getMyDeposits error:", error);
      res.status(500).json({ success: false, message: "Gagal mengambil riwayat setoran Anda" });
    }
  },

  createManualDeposit: async (req: Request, res: Response) => {
    try {
      const petugasId = req.user!.userId;
      const { wargaId, beratKg, kategoriId, overridePoin } = req.body;
      const photoPath = req.file ? `/uploads/avatars/${req.file.filename}` : null;

      if (!wargaId || !beratKg || !kategoriId) {
        res.status(400).json({ success: false, message: "Data tidak lengkap" });
        return;
      }

      if (!photoPath) {
        res.status(400).json({ success: false, message: "Foto bukti wajib diunggah" });
        return;
      }

      const overridePoinVal = overridePoin ? parseInt(overridePoin, 10) : null;

      const result = await transactionService.createManualDeposit(
        petugasId,
        wargaId,
        parseFloat(beratKg),
        kategoriId,
        photoPath,
        overridePoinVal
      );

      res.status(201).json({
        success: true,
        message: "Setoran manual berhasil dicatat",
        data: result,
      });
    } catch (error: any) {
      console.error("[TransactionController] createManualDeposit error:", error);
      res.status(500).json({ success: false, message: error.message || "Gagal mencatat setoran" });
    }
  },
};
