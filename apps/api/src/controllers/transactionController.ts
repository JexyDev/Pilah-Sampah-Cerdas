/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
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
        warga: d.warga?.name || "Warga Coblong",
        phone: d.warga?.phone || "-",
        rtRw: d.warga?.rtRw?.name || "RT 01 / RW 01",
        kelurahan: d.warga?.rtRw?.kelurahan?.name || "Coblong",
        jenis: d.hasilKlasifikasiAi === "organik" ? "Organik" : "Anorganik",
        berat: Number(d.berat),
        poin: Math.round(Number(d.poin)),
        waktu: d.createdAt,
        status: "Selesai",
        lokasi: `Tempat Sampah: ${d.bin?.qrCode || "QR-001"}`,
        confidence: d.confidenceAi
          ? Number(d.confidenceAi) <= 1
            ? Math.round(Number(d.confidenceAi) * 100)
            : Math.round(Number(d.confidenceAi))
          : 90 + (Math.abs(d.id.charCodeAt(0) || 5) % 9),
        fotoUrl: d.fotoSampahUrl || d.fotoUrl || null,
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

      const mappedDeposits = deposits.map((d: any) => {
        const poinVal = Number(d.poin || 0);
        const areaName = d.bin?.rtRw?.name || "";
        const kelName = d.bin?.rtRw?.kelurahan?.name || "";
        const binCode = d.bin?.qrCode || "BIN";
        const addr =
          d.bin?.address || (areaName ? `Area ${areaName}` : `Tempat Sampah: ${binCode}`);

        return {
          id: d.id,
          jenis: d.hasilKlasifikasiAi === "organik" ? "Organik" : "Anorganik",
          berat: Number(d.berat || 0),
          volume: Number(d.volumeEstimate || 0),
          poin: poinVal,
          pointsAwarded: poinVal,
          waktu: d.createdAt,
          createdAt: d.createdAt,
          status: "Selesai",
          lokasi: addr,
          address: addr,
          rtRw: areaName || null,
          kelurahan: kelName || areaName || null,
          binQrCode: binCode,
        };
      });

      res.status(200).json({ success: true, data: mappedDeposits });
    } catch (error) {
      console.error("[TransactionController] getMyDeposits error:", error);
      res.status(500).json({ success: false, message: "Gagal mengambil riwayat setoran Anda" });
    }
  },

  createManualDeposit: async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const { petugasResiduId, diinputOleh, berat, lokasiGps, rwId } = req.body;
      const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

      if (!berat) {
        res.status(400).json({ success: false, message: "Berat wajib diisi" });
        return;
      }

      if (!photoPath) {
        res.status(400).json({ success: false, message: "Foto bukti residu wajib diunggah" });
        return;
      }

      let finalPetugasId = petugasResiduId;
      let finalDiinputOleh = diinputOleh || "mandiri";

      if (user.role === "PETUGAS_RESIDU") {
        finalPetugasId = user.userId;
        finalDiinputOleh = "mandiri";
      } else if (user.role === "RW") {
        finalDiinputOleh = "rw";
        if (!finalPetugasId) {
          res.status(400).json({ success: false, message: "Petugas Residu wajib dipilih" });
          return;
        }
      }

      const result = await transactionService.createManualDeposit(
        finalPetugasId,
        finalDiinputOleh,
        parseFloat(berat),
        photoPath,
        lokasiGps || null,
        rwId ? parseInt(rwId, 10) : undefined
      );

      res.status(201).json({
        success: true,
        message: "Setoran manual residu berhasil dicatat",
        data: result,
      });
    } catch (error: any) {
      console.error("[TransactionController] createManualDeposit error:", error);
      res.status(500).json({ success: false, message: error.message || "Gagal mencatat setoran" });
    }
  },

  getManualDeposits: async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      let rwId: number | undefined;
      if (user.role === "RW" && user.rtRwId) {
        rwId = user.rtRwId;
      }
      const deposits = await transactionService.getManualDeposits(rwId);
      res.status(200).json({ success: true, data: deposits });
    } catch (error: any) {
      console.error("[TransactionController] getManualDeposits error:", error);
      res
        .status(500)
        .json({ success: false, message: error.message || "Gagal mengambil data setoran manual" });
    }
  },

  getDepositDetails: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deposit = await transactionService.getDepositDetails(id);
      if (!deposit) {
        res.status(404).json({ success: false, message: "Setoran tidak ditemukan" });
        return;
      }
      const mappedDeposit = {
        id: deposit.id,
        warga: deposit.warga?.name || "Unknown",
        phone: deposit.warga?.phone || "",
        rtRw: deposit.bin?.rtRw?.name || "",
        jenis: deposit.hasilKlasifikasiAi === "organik" ? "Organik" : "Anorganik",
        berat: Number(deposit.berat),
        poin: Number(deposit.poin),
        waktu: deposit.createdAt,
        status: "Selesai",
        lokasi: `Tempat Sampah: ${deposit.bin?.qrCode}`,
        confidence: Number(deposit.confidenceAi),
        gps: deposit.lokasiGps,
        fotoUrl: deposit.fotoSampahUrl,
      };
      res.status(200).json({ success: true, data: mappedDeposit });
    } catch (error) {
      console.error("[TransactionController] getDepositDetails error:", error);
      res.status(500).json({ success: false, message: "Gagal mengambil detail setoran" });
    }
  },
};
