/**
 * Project: BERSEKA
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
      const { otomatisList, manualList } = await transactionService.getDeposits(binCode as string);

      const mappedOtomatis = (otomatisList || []).map((d: any) => {
        let wargaName = d.warga?.name || "Warga Coblong";
        wargaName = wargaName
          .replace(/^Warga\s+Binaan\s+/i, "")
          .replace(/^Warga\s+Binaan\s*-\s*/i, "")
          .trim();
        if (!wargaName) wargaName = "Warga Coblong";

        const rawConf = d.confidenceAi !== null && d.confidenceAi !== undefined ? Number(d.confidenceAi) : null;
        const confVal = rawConf !== null ? (rawConf <= 1 ? Math.round(rawConf * 100) : Math.round(rawConf)) : 95;
        const rawClass = (d.hasilKlasifikasiAi || "ORGANIK").toLowerCase();
        const isOrgRaw = rawClass.includes("organik") && !rawClass.includes("anorganik");
        const organikPercent = isOrgRaw ? confVal : (100 - confVal);
        const anorganikPercent = 100 - organikPercent;
        const finalJenis = organikPercent >= anorganikPercent ? "Organik" : "Anorganik";

        return {
          id: d.id,
          warga: wargaName,
          phone: d.warga?.phone || "-",
          rw: d.warga?.rw?.name || d.bin?.rw?.name || "RW 01",
          kelurahan: d.warga?.rw?.kelurahan?.name || d.bin?.rw?.kelurahan?.name || "Coblong",
          jenis: finalJenis,
          berat: Number(d.berat),
          poin: Math.round(Number(d.poin || 0)),
          waktu: d.createdAt,
          status: d.status || "ACCEPTED",
          lokasi: `Tempat Sampah: ${d.bin?.qrCode || "QR-001"}`,
          confidence: Math.max(organikPercent, anorganikPercent),
          organikPercent,
          anorganikPercent,
          fotoUrl: d.fotoSampahUrl || null,
          fotoProfil: d.warga?.fotoProfil || null,
          isManual: false,
        };
      });

      const mappedManual = (manualList || []).map((m: any) => {
        return {
          id: m.id,
          warga: `Petugas: ${m.petugas?.name || "Petugas Residu"}`,
          phone: m.petugas?.phone || "-",
          rw: m.rw?.name || `RW ${m.rwId}`,
          kelurahan: m.rw?.kelurahan?.name || "Coblong",
          jenis: "Residu",
          berat: Number(m.berat),
          poin: 0,
          waktu: m.createdAt,
          status: m.status || "ACCEPTED",
          lokasi: "Posko Penimbangan Lapangan",
          confidence: null,
          organikPercent: 0,
          anorganikPercent: 0,
          fotoUrl: m.fotoResiduUrl || null,
          fotoProfil: m.petugas?.fotoProfil || null,
          isManual: true,
        };
      });

      // Combine and sort by date descending
      const combined = [...mappedOtomatis, ...mappedManual].sort(
        (a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime()
      );

      res.status(200).json({ success: true, data: combined });
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
        const areaName = d.bin?.rw?.name || "";
        const kelName = d.bin?.rw?.kelurahan?.name || "";
        const binCode = d.bin?.qrCode || "BIN";
        const addr =
          d.bin?.address || (areaName ? `Area ${areaName}` : `Tempat Sampah: ${binCode}`);

        const rawConf = d.confidenceAi !== null && d.confidenceAi !== undefined ? Number(d.confidenceAi) : null;
        const confVal = rawConf !== null ? (rawConf <= 1 ? Math.round(rawConf * 100) : Math.round(rawConf)) : 95;
        const rawClass = (d.hasilKlasifikasiAi || "ORGANIK").toLowerCase();
        const isOrgRaw = rawClass.includes("organik") && !rawClass.includes("anorganik");
        const organikPercent = isOrgRaw ? confVal : (100 - confVal);
        const anorganikPercent = 100 - organikPercent;
        const finalJenis = organikPercent >= anorganikPercent ? "Organik" : "Anorganik";

        return {
          id: d.id,
          jenis: finalJenis,
          berat: Number(d.berat || 0),
          volume: Number(d.volumeEstimate || 0),
          poin: poinVal,
          pointsAwarded: poinVal,
          waktu: d.createdAt,
          createdAt: d.createdAt,
          status: d.status || "ACCEPTED",
          lokasi: addr,
          address: addr,
          rw: areaName || null,
          kelurahan: kelName || areaName || null,
          binQrCode: binCode,
          confidenceAi: d.confidenceAi ? Number(d.confidenceAi) : null,
          confidence: Math.max(organikPercent, anorganikPercent),
          organikPercent,
          anorganikPercent,
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
      if (user.role === "RW" && user.rwId) {
        rwId = user.rwId;
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

      const dep = deposit as any;

      if (dep.isManual) {
        const mappedManual = {
          id: dep.id,
          warga: `Petugas: ${dep.petugas?.name || "Petugas Residu"}`,
          phone: dep.petugas?.phone || "-",
          rw: dep.rw?.name || `RW ${dep.rwId}`,
          kelurahan: dep.rw?.kelurahan?.name || "Coblong",
          jenis: "Residu",
          berat: Number(dep.berat),
          poin: 0,
          waktu: dep.createdAt,
          status: dep.status || "ACCEPTED",
          lokasi: "Posko Penimbangan Lapangan",
          confidence: null,
          organikPercent: 0,
          anorganikPercent: 0,
          gps: dep.lokasiGps,
          fotoUrl: dep.fotoResiduUrl,
          fotoProfil: dep.petugas?.fotoProfil || null,
          isManual: true,
          catatanPenolakan: dep.catatanPenolakan || null,
        };
        res.status(200).json({ success: true, data: mappedManual });
        return;
      }

      const rawConf = dep.confidenceAi !== null && dep.confidenceAi !== undefined ? Number(dep.confidenceAi) : null;
      const confVal = rawConf !== null ? (rawConf <= 1 ? Math.round(rawConf * 100) : Math.round(rawConf)) : 95;
      const rawClass = (dep.hasilKlasifikasiAi || "ORGANIK").toLowerCase();
      const isOrgRaw = rawClass.includes("organik") && !rawClass.includes("anorganik");
      const organikPercent = isOrgRaw ? confVal : (100 - confVal);
      const anorganikPercent = 100 - organikPercent;
      const finalJenis = organikPercent >= anorganikPercent ? "Organik" : "Anorganik";

      const mappedDeposit = {
        id: dep.id,
        warga: dep.warga?.name || "Warga Coblong",
        phone: dep.warga?.phone || "",
        rw: dep.bin?.rw?.name || dep.warga?.rw?.name || "RW 01",
        kelurahan: dep.bin?.rw?.kelurahan?.name || dep.warga?.rw?.kelurahan?.name || "Coblong",
        jenis: finalJenis,
        berat: Number(dep.berat),
        poin: Math.round(Number(dep.poin || 0)),
        waktu: dep.createdAt,
        status: dep.status || "ACCEPTED",
        lokasi: `Tempat Sampah: ${dep.bin?.qrCode || "QR-001"}`,
        confidence: Math.max(organikPercent, anorganikPercent),
        organikPercent,
        anorganikPercent,
        gps: dep.lokasiGps,
        fotoUrl: dep.fotoSampahUrl,
        fotoProfil: dep.warga?.fotoProfil || null,
        isManual: false,
        catatanPenolakan: dep.catatanPenolakan || null,
      };
      res.status(200).json({ success: true, data: mappedDeposit });
    } catch (error) {
      console.error("[TransactionController] getDepositDetails error:", error);
      res.status(500).json({ success: false, message: "Gagal mengambil detail setoran" });
    }
  },

  updateStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, catatanPenolakan } = req.body;

      if (!status || !["ACCEPTED", "REJECTED", "PENDING"].includes(status.toUpperCase())) {
        res.status(400).json({
          success: false,
          message: "Status wajib diisi dan harus bernilai 'ACCEPTED', 'REJECTED', atau 'PENDING'",
        });
        return;
      }

      const result = await transactionService.updateTransactionStatus(
        id,
        status,
        catatanPenolakan
      );

      res.status(200).json({
        success: true,
        message: `Status transaksi berhasil diperbarui menjadi ${status.toUpperCase()}`,
        data: result,
      });
    } catch (error: any) {
      console.error("[TransactionController] updateStatus error:", error);
      if (error.message === "TRANSACTION_NOT_FOUND") {
        res.status(404).json({ success: false, message: "Transaksi setoran tidak ditemukan" });
        return;
      }
      res.status(500).json({ success: false, message: "Gagal memperbarui status transaksi setoran" });
    }
  },
};
