/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { kknService } from "../services/kknService.js";

export class KknController {
  async validateQrMaster(req: Request, res: Response): Promise<void> {
    try {
      const { qrCode } = req.body;
      if (!qrCode) {
        res.status(400).json({ error: "BAD_REQUEST", message: "QR Code diperlukan." });
        return;
      }
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      
      // Cek apakah bin dengan QR ini sudah ada dan aktif/terdaftar
      const existingBin = await prisma.bin.findUnique({
        where: { qrCode },
      });

      if (existingBin) {
        res.status(400).json({ error: "QR_IN_USE", message: "QR Code ini sudah terdaftar pada tong lain." });
        return;
      }

      // Validasi terhadap master QR (asumsi master QR format valid jika memenuhi kriteria misal diawali TS- atau ada di tabel Master)
      // Untuk MVP Pilah Sampah Cerdas, kita simulasikan validasi format TS-XXXX
      if (!qrCode.toUpperCase().startsWith("TS-")) {
        res.status(400).json({ error: "INVALID_QR", message: "Format QR Master tidak valid. Harus diawali TS-" });
        return;
      }

      res.status(200).json({ success: true, message: "QR Code Master Valid dan belum digunakan." });
    } catch (error: any) {
      console.error("[KknController] validateQrMaster error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memvalidasi QR Master" });
    }
  }

  async getDashboardStats(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const data = await kknService.getDashboardStats(kknUserId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getDashboardStats error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async registerWarga(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const result = await kknService.registerWarga(kknUserId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[KknController] registerWarga error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getRegisteredWarga(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const rtRwId = req.query.rtRwId ? parseInt(req.query.rtRwId as string, 10) : undefined;
      const search = req.query.search as string | undefined;

      const data = await kknService.getRegisteredWarga(kknUserId, { rtRwId, search });
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getRegisteredWarga error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getWargaDetail(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const { wargaId } = req.params;
      const data = await kknService.getWargaDetail(kknUserId, wargaId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getWargaDetail error:", error);
      const code = error.message === "UNAUTHORIZED_ACCESS_SCOPE" ? 403 : 500;
      res.status(code).json({ success: false, message: error.message });
    }
  }

  async getUnregisteredHouses(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const data = await kknService.getUnregisteredHouses(kknUserId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getUnregisteredHouses error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getActivityLog(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const data = await kknService.getActivityLog(kknUserId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getActivityLog error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  async claimQr(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const { qrCode, latitude, longitude } = req.body;
      const data = await kknService.claimQr(kknUserId, qrCode, Number(latitude), Number(longitude));
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] claimQr error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async handover(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const { toKknUserId, rtRwId, notes } = req.body;
      const data = await kknService.handover(kknUserId, toKknUserId, Number(rtRwId), notes);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] handover error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async inputFacility(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const data = await kknService.bantuInputFasilitas(kknUserId, req.body);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] inputFacility error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const kknController = new KknController();
