/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { z } from "zod";
import { binService } from "../services/binService.js";

const scanSchema = z.object({
  qrCode: z.string().min(1, "QR Code diperlukan"),
  detectedType: z.string().min(1, "Jenis sampah terdeteksi diperlukan"),
  estimatedVolume: z.number().positive("Volume harus positif"),
  householdId: z.string().uuid("Household ID tidak valid"),
  userLat: z.number().min(-90).max(90).optional(),
  userLng: z.number().min(-180).max(180).optional(),
});

export class BinController {
  /**
   * Get all bins
   */
  async getAllBins(req: Request, res: Response): Promise<void> {
    try {
      const bins = await binService.getAllBins();
      const mappedBins = bins.map((bin: any) => {
        const currentVol = Number(bin.currentVolumeLiter);
        const maxVol = Number(bin.maxCapacityLiter);
        const kapasitas = maxVol > 0 ? Math.round((currentVol / maxVol) * 100) : 0;

        return {
          kode: bin.qrCode,
          lokasi: `Kategori: ${bin.category?.name || bin.categoryId}`,
          rtRw: bin.rtRw?.name || `ID RT/RW: ${bin.rtRwId}`,
          kapasitas,
          status: kapasitas > 80 ? "Penuh" : kapasitas > 50 ? "Sedang" : "Normal",
          lastUpdate: bin.updatedAt ? new Date(bin.updatedAt).toLocaleTimeString() : "-",
          categoryId: bin.categoryId,
          rtRwId: bin.rtRwId,
          maxCapacityLiter: maxVol,
          latitude: bin.latitude,
          longitude: bin.longitude,
          currentVolumeLiter: currentVol,
          category: bin.category,
        };
      });

      res.status(200).json({
        success: true,
        data: mappedBins,
      });
    } catch (error) {
      console.error("[BinController] getAllBins error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to get bins" });
    }
  }

  /**
   * Get locations summary grouped by RW
   */
  async getLocations(req: Request, res: Response): Promise<void> {
    try {
      const locations = await binService.getLocations();
      res.status(200).json({
        success: true,
        data: locations,
      });
    } catch (error) {
      console.error("[BinController] getLocations error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to get locations" });
    }
  }

  async getAreas(req: Request, res: Response): Promise<void> {
    try {
      const areas = await binService.getAreas();
      res.status(200).json({
        success: true,
        data: areas,
      });
    } catch (error) {
      console.error("[BinController] getAreas error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to get areas" });
    }
  }

  async getKelurahans(req: Request, res: Response): Promise<void> {
    try {
      const kelurahans = await binService.getKelurahans();
      res.status(200).json({
        success: true,
        data: kelurahans,
      });
    } catch (error) {
      console.error("[BinController] getKelurahans error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to get kelurahans" });
    }
  }

  async createArea(req: Request, res: Response): Promise<void> {
    try {
      const { name, kelurahanId } = req.body;
      const newArea = await binService.createArea(name, kelurahanId);
      res.status(201).json({
        success: true,
        data: newArea,
      });
    } catch (error) {
      console.error("[BinController] createArea error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to create area" });
    }
  }

  /**
   * Handle QR Scan Request
   */
  async scan(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const parsed = scanSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({ error: "VALIDATION_ERROR", details: parsed.error.format() });
        return;
      }

      const { qrCode, detectedType, estimatedVolume, householdId, userLat, userLng } = parsed.data;

      const result = await binService.processScan(
        qrCode,
        userId,
        householdId,
        detectedType,
        estimatedVolume,
        userLat,
        userLng
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.message === "BIN_NOT_FOUND") {
        res
          .status(404)
          .json({ error: "RESOURCE_NOT_FOUND", message: "QR Code Tong Sampah tidak ditemukan" });
      } else if (error.message === "LOCATION_OUT_OF_RANGE") {
        res.status(400).json({
          error: "LOCATION_OUT_OF_RANGE",
          message: "Lokasi Anda terlalu jauh dari tong sampah fisik (> 10m).",
          distanceMeters: error.distanceMeters,
        });
      } else if (error.message === "BIN_TYPE_MISMATCH") {
        res.status(400).json({
          error: "BIN_TYPE_MISMATCH",
          message: `Tong tidak sesuai! Anda memasukkan sampah ke tong khusus ${error.binType}.`,
        });
      } else if (error.message === "BIN_OVERFLOW") {
        res.status(400).json({
          error: "BIN_OVERFLOW",
          message:
            "Tong penuh! Penyimpanan ditolak karena sisa kapasitas tong tidak mencukupi (Kapasitas Maks: 25 Liter).",
        });
      } else {
        console.error("Bin Scan Error:", error);
        res.status(500).json({
          error: "INTERNAL_SERVER_ERROR",
          message: "Gagal memproses pemindaian tong sampah",
        });
      }
    }
  }

  /**
   * Get Bin Status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const bin = await binService.getBinStatus(id as string);
      res.status(200).json({
        success: true,
        data: bin,
      });
    } catch (error: any) {
      if (error.message === "BIN_NOT_FOUND") {
        res
          .status(404)
          .json({ error: "RESOURCE_NOT_FOUND", message: "Tong sampah tidak ditemukan" });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil status tong sampah" });
      }
    }
  }

  /**
   * Empty Bin Capacity (Reset)
   */
  async emptyBin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await binService.emptyBin(id as string);
      res.status(200).json({
        success: true,
        message: "Kapasitas tong sampah berhasil dikosongkan ke 0 Liter.",
      });
    } catch (error: any) {
      if (error.message === "BIN_NOT_FOUND") {
        res
          .status(404)
          .json({ error: "RESOURCE_NOT_FOUND", message: "Tong sampah tidak ditemukan" });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengosongkan tong sampah" });
      }
    }
  }

  /**
   * Create a new Bin (Admin only)
   */
  async createBin(req: Request, res: Response): Promise<void> {
    try {
      const result = await binService.createBin(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      console.error("[BinController] createBin error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal membuat tong sampah" });
    }
  }

  /**
   * Update a Bin (Admin only)
   */
  async updateBin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await binService.updateBin(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error("[BinController] updateBin error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memperbarui tong sampah" });
    }
  }

  /**
   * Delete a Bin (Admin only)
   */
  async deleteBin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await binService.deleteBin(id);
      res.status(200).json({ success: true, message: "Tong sampah berhasil dihapus" });
    } catch (error) {
      console.error("[BinController] deleteBin error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal menghapus tong sampah" });
    }
  }

  /**
   * Get bins for current Warga based on their RT/RW
   */
  async getMyBins(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const mapped = await binService.getMyBins(userId);
      res.status(200).json({ success: true, data: mapped });
    } catch (error) {
      console.error("[BinController] getMyBins error:", error);
      res.status(500).json({
        error: "INTERNAL_SERVER_ERROR",
        message: "Gagal mengambil data status tong sampah Anda",
      });
    }
  }

  /**
   * Create a new bin reset request (Warga)
   */
  async createResetRequest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { binId, evidencePhotoUrl } = req.body;
      if (!binId || !evidencePhotoUrl) {
        res
          .status(400)
          .json({ error: "BAD_REQUEST", message: "binId dan evidencePhotoUrl wajib diisi" });
        return;
      }

      const result = await binService.createResetRequest(binId, userId, evidencePhotoUrl);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[BinController] createResetRequest error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal membuat pengajuan pengosongan" });
    }
  }

  /**
   * Get detail of a bin reset request
   */
  async getResetRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await binService.getResetRequest(id);
      if (!result) {
        res.status(404).json({ error: "RESOURCE_NOT_FOUND", message: "Pengajuan tidak ditemukan" });
        return;
      }
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error("[BinController] getResetRequest error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil data pengajuan" });
    }
  }

  /**
   * Review bin reset request (Petugas/Admin)
   */
  async reviewResetRequest(req: Request, res: Response): Promise<void> {
    try {
      const reviewedById = req.user!.userId;
      const { id } = req.params;
      const { status } = req.body;

      if (status !== "APPROVED" && status !== "REJECTED") {
        res
          .status(400)
          .json({ error: "BAD_REQUEST", message: "status harus APPROVED atau REJECTED" });
        return;
      }

      const result = await binService.reviewResetRequest(id, status, reviewedById);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[BinController] reviewResetRequest error:", error);
      if (error.message === "REQUEST_NOT_FOUND") {
        res.status(404).json({ error: "RESOURCE_NOT_FOUND", message: "Pengajuan tidak ditemukan" });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memproses pengajuan" });
      }
    }
  }
}

export const binController = new BinController();
