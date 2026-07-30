/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { z } from "zod";
import { binService } from "../services/binService.js";
import { generateNextQrCode } from "../utils/qrGenerator.js";

const scanSchema = z.object({
  qrCode: z.string().min(1, "QR Code diperlukan"),
  detectedType: z.string().min(1, "Jenis sampah terdeteksi diperlukan"),
  estimatedVolume: z.number().positive("Volume harus positif"),
  householdId: z.string().uuid("Household ID tidak valid"),
  userLat: z.number().min(-90).max(90),
  userLng: z.number().min(-180).max(180),
  aiConfidence: z.number().optional(),
  evidencePhotoUrl: z.string().optional(),
  detections: z
    .array(
      z.object({
        detectedType: z.string(),
        volumeEstimate: z.number().positive(),
        confidence: z.number().optional(),
      })
    )
    .optional(),
});

export class BinController {
  /**
   * Get all bins
   */
  async getAllBins(req: Request, res: Response): Promise<void> {
    try {
      const { search, status, areaId, categoryId } = req.query;
      const filters = {
        search: search as string,
        status: status as string,
        areaId: areaId as string,
        categoryId: categoryId as string,
      };

      const bins = await binService.getAllBins(req.user, filters);
      const mappedBins = bins.map((bin: any) => {
        const currentVol = Number(bin.currentVolumeLiter);
        const maxVol = Number(bin.maxCapacityLiter);
        const kapasitas = maxVol > 0 ? Math.round((currentVol / maxVol) * 100) : 0;

        const isInactive7Days = bin.updatedAt
          ? Date.now() - new Date(bin.updatedAt).getTime() > 7 * 24 * 60 * 60 * 1000
          : false;

        return {
          id: bin.id,
          kode: bin.qrCode,
          lokasi: bin.category?.name ? `Kategori: ${bin.category.name}` : "Kategori: -",
          rtRw: bin.rtRw?.name || (bin.rtRwId ? `ID RT/RW: ${bin.rtRwId}` : "Belum Terikat"),
          kapasitas,
          status: bin.status === "BROKEN" ? "Rusak" : kapasitas > 80 ? "Penuh" : kapasitas > 50 ? "Sedang" : "Normal",
          lastUpdate: bin.updatedAt ? new Date(bin.updatedAt).toLocaleTimeString() : "-",
          categoryId: bin.categoryId || null,
          rtRwId: bin.rtRwId || null,
          maxCapacityLiter: maxVol,
          latitude: bin.latitude,
          longitude: bin.longitude,
          currentVolumeLiter: currentVol,
          category: bin.category,
          wargaName: bin.user?.name || "-",
          kknName: bin.qrBatch?.assignedPic?.name || "-",
          userId: bin.userId || null,
          realStatus: bin.status,
          needsInspection: isInactive7Days && bin.status === "ACTIVE_BOUND",
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
      const { name, kelurahanId, latitude, longitude } = req.body;
      const newArea = await binService.createArea(
        name,
        kelurahanId,
        latitude ? Number(latitude) : undefined,
        longitude ? Number(longitude) : undefined
      );
      res.status(201).json({
        success: true,
        data: newArea,
      });
    } catch (error) {
      console.error("[BinController] createArea error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to create area" });
    }
  }

  async updateArea(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, kelurahanId, latitude, longitude } = req.body;
      const updatedArea = await binService.updateArea(
        Number(id),
        name,
        kelurahanId,
        latitude ? Number(latitude) : undefined,
        longitude ? Number(longitude) : undefined
      );
      res.status(200).json({
        success: true,
        data: updatedArea,
      });
    } catch (error) {
      console.error("[BinController] updateArea error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to update area" });
    }
  }

  async deleteArea(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await binService.deleteArea(Number(id));
      res.status(200).json({
        success: true,
        message: "Area deleted successfully",
      });
    } catch (error: any) {
      console.error("[BinController] deleteArea error:", error);
      res
        .status(400)
        .json({ error: "BAD_REQUEST", message: error.message || "Failed to delete area" });
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

      const {
        qrCode,
        detectedType,
        estimatedVolume,
        householdId,
        userLat,
        userLng,
        aiConfidence,
        evidencePhotoUrl,
        detections,
      } = parsed.data as any;

      const result = await binService.processScan(
        qrCode,
        userId,
        householdId,
        detectedType,
        estimatedVolume,
        userLat,
        userLng,
        aiConfidence,
        evidencePhotoUrl,
        detections
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.message === "BIN_NOT_FOUND") {
        res
          .status(404)
          .json({ error: "RESOURCE_NOT_FOUND", message: "QR Code tempat sampah tidak ditemukan" });
      } else if (error.message === "BIN_NOT_ACTIVE" || error.message === "NO_ACTIVE_BINS") {
        res.status(400).json({
          error: "BIN_NOT_ACTIVE",
          message: "Tidak bisa scan, Anda belum memiliki tempat sampah aktif.",
        });
      } else if (error.message === "BIN_NOT_OWNED") {
        res.status(403).json({
          error: "BIN_NOT_OWNED",
          message: "tempat sampah ini milik warga lain dan tidak dapat digunakan oleh Anda.",
        });
      } else if (error.message === "LOCATION_OUT_OF_RANGE") {
        res.status(400).json({
          error: "LOCATION_OUT_OF_RANGE",
          message: "Lokasi Anda terlalu jauh dari tempat sampah fisik (> 50m).",
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
          message: "Gagal memproses pemindaian tempat sampah",
        });
      }
    }
  }

  async registerWargaBin(req: Request, res: Response) {
    try {
      const data = req.body;
      const role = req.user!.role;
      const userId = role === "MAHASISWA_KKN" && data.wargaId ? data.wargaId : req.user!.userId;

      const result = await binService.registerWargaBin(userId, data);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[BinController] registerWargaBin error:", error);

      if (error.message.startsWith("ONBOARDING_INCOMPLETE_WRONG_CATEGORY:")) {
        const missingCat = error.message.split(":")[1];
        res.status(400).json({
          success: false,
          error: "ONBOARDING_INCOMPLETE_WRONG_CATEGORY",
          message: `Anda belum menyelesaikan aktivasi awal. Selesaikan aktivasi tong ${missingCat === "ORGANIC" ? "Non-Organik" : "Organik"} Anda terlebih dahulu.`,
        });
        return;
      }
      if (error.message.startsWith("BIN_CATEGORY_DUPLICATE:")) {
        const cat = error.message.split(":")[1];
        res.status(400).json({
          success: false,
          error: "BIN_CATEGORY_DUPLICATE",
          message: `tempat sampah ${cat} sudah terdaftar untuk Anda.`,
        });
        return;
      }
      if (error.message === "BIN_CATEGORY_DUPLICATE_IN_REQUEST") {
        res.status(400).json({
          success: false,
          error: "BIN_CATEGORY_DUPLICATE",
          message: "Tidak boleh mengaktivasi dua tong dengan kategori yang sama sekaligus.",
        });
        return;
      }

      res.status(400).json({ success: false, message: error.message });
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
          .json({ error: "RESOURCE_NOT_FOUND", message: "tempat sampah tidak ditemukan" });
      } else {
        res.status(500).json({
          error: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil status tempat sampah",
        });
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
        message: "Kapasitas tempat sampah berhasil dikosongkan ke 0 Liter.",
      });
    } catch (error: any) {
      if (error.message === "BIN_NOT_FOUND") {
        res
          .status(404)
          .json({ error: "RESOURCE_NOT_FOUND", message: "tempat sampah tidak ditemukan" });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengosongkan tempat sampah" });
      }
    }
  }

  async getNextQr(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.query;
      if (!categoryId) {
        res.status(400).json({ success: false, message: "categoryId is required" });
        return;
      }
      const nextQr = await generateNextQrCode(categoryId as string);
      res.status(200).json({ success: true, data: { qrCode: nextQr } });
    } catch (error: any) {
      console.error("[BinController] getNextQr error:", error);
      res.status(500).json({ success: false, message: "Failed to generate next QR code" });
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
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal membuat tempat sampah" });
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
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memperbarui tempat sampah" });
    }
  }

  /**
   * Delete a Bin (Admin only)
   */
  async deleteBin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await binService.deleteBin(id);
      res.status(200).json({ success: true, message: "tempat sampah berhasil dihapus" });
    } catch (error) {
      console.error("[BinController] deleteBin error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal menghapus tempat sampah" });
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
        message: "Gagal mengambil data status tempat sampah Anda",
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
      if (error.message === "RESOURCE_NOT_FOUND") {
        res.status(404).json({ error: "RESOURCE_NOT_FOUND", message: "Tempat sampah tidak ditemukan" });
      } else if (error.message === "BIN_NOT_OWNED") {
        res.status(403).json({ error: "BIN_NOT_OWNED", message: "Tempat sampah bukan milik Anda" });
      } else if (error.message === "DUPLICATE_REQUEST") {
        res.status(400).json({ error: "DUPLICATE_REQUEST", message: "Sudah ada pengajuan pengosongan aktif untuk tong ini" });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal membuat pengajuan pengosongan" });
      }
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
   * List all reset requests (Admin/RW/Lurah)
   */
  async listResetRequests(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user;
      const { status } = req.query;
      const result = await binService.listResetRequests(
        currentUser,
        status ? { status: String(status) } : undefined
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error("[BinController] listResetRequests error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil daftar pengajuan" });
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

      if (
        status !== "APPROVED" &&
        status !== "REJECTED" &&
        status !== "COMPLETED" &&
        status !== "ON_PROGRESS"
      ) {
        res
          .status(400)
          .json({ error: "BAD_REQUEST", message: "status tidak valid" });
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

  /**
   * Approve bin reset request instantly (sets status to COMPLETED and resets volume)
   */
  async approveResetRequest(req: Request, res: Response): Promise<void> {
    try {
      const reviewedById = req.user!.userId;
      const { id } = req.params;

      const result = await binService.reviewResetRequest(id, "COMPLETED", reviewedById);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[BinController] approveResetRequest error:", error);
      if (error.message === "REQUEST_NOT_FOUND") {
        res.status(404).json({ error: "RESOURCE_NOT_FOUND", message: "Pengajuan tidak ditemukan" });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal menyetujui pengajuan" });
      }
    }
  }

  /**
   * Create QR Batch (Super Admin/Admin DLH)
   */
  async createQrBatch(req: Request, res: Response): Promise<void> {
    try {
      const { quantity } = req.body;
      if (!quantity || isNaN(parseInt(quantity))) {
        res
          .status(400)
          .json({ success: false, code: "BAD_REQUEST", message: "quantity wajib berupa angka" });
        return;
      }
      const batch = await binService.createQrBatch(parseInt(quantity));
      res.status(201).json({ success: true, data: batch });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Get all QR Batches
   */
  async getAllQrBatches(req: Request, res: Response): Promise<void> {
    try {
      const batches = await binService.getAllQrBatches();
      res.status(200).json({ success: true, data: batches });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Assign QR Batch to PIC (Camat, Lurah, RW, or Admin DLH)
   */
  async assignQrBatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { picUserId } = req.body;
      if (!picUserId) {
        res
          .status(400)
          .json({ success: false, code: "BAD_REQUEST", message: "picUserId wajib diisi" });
        return;
      }
      const adminUserId = req.user!.userId;
      const batch = await binService.assignQrBatch(id, picUserId, adminUserId);
      res.status(200).json({ success: true, data: batch });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Mark Bin as Broken
   */
  async markBinAsBroken(req: Request, res: Response): Promise<void> {
    try {
      const { qrCode } = req.params;
      const adminUserId = req.user!.userId;
      const bin = await binService.markBinAsBroken(qrCode, adminUserId);
      res.status(200).json({
        success: true,
        message: "Status tempat sampah berhasil diubah menjadi BROKEN",
        data: bin,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Claim dispatch task
   */
  async claimDispatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const petugasUserId = req.user!.userId;
      const task = await binService.claimDispatchTask(id, petugasUserId);
      res
        .status(200)
        .json({ success: true, message: "Tugas penjemputan berhasil diklaim", data: task });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Get optimized route of claimed tasks
   */
  async getOptimizedRoute(req: Request, res: Response): Promise<void> {
    try {
      const petugasUserId = req.user!.userId;
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "Parameter lat dan lng wajib diisi",
        });
        return;
      }
      const route = await binService.getOptimizedRoute(petugasUserId, Number(lat), Number(lng));
      res.status(200).json({ success: true, data: route });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  async approveActivation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.user!.userId;
      const result = await binService.approveActivation(id, adminUserId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[BinController] approveActivation error:", error);
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  async rejectActivation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.user!.userId;
      const result = await binService.rejectActivation(id, adminUserId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[BinController] rejectActivation error:", error);
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  async reportIssue(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const { issueType, notes, evidencePhotoUrl } = req.body;
      if (!issueType || !["EMPTY_REQUEST", "BROKEN_REPORT"].includes(issueType)) {
        res.status(400).json({
          success: false,
          code: "INVALID_ISSUE_TYPE",
          message: "Tipe laporan tidak valid",
        });
        return;
      }
      const result = await binService.reportIssue(
        id,
        userId,
        issueType,
        notes || "",
        evidencePhotoUrl
      );
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[BinController] reportIssue error:", error);
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }
  async reactivateBin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await binService.reactivateBin(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[BinController] reactivateBin error:", error);
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  async updateCapacity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { maxCapacityLiter, evidencePhotoUrl } = req.body;

      if (!maxCapacityLiter) {
        res.status(400).json({ success: false, message: "Kapasitas wajib diisi" });
        return;
      }

      if (req.user!.role === "WARGA" && !evidencePhotoUrl) {
        res.status(400).json({ success: false, message: "Foto bukti wajib diunggah" });
        return;
      }

      const result = await binService.updateCapacity(
        id,
        Number(maxCapacityLiter),
        evidencePhotoUrl || null
      );
      res
        .status(200)
        .json({ success: true, data: result, message: "Kapasitas tong berhasil diperbarui" });
    } catch (error: any) {
      console.error("[BinController] updateCapacity error:", error);
      res.status(500).json({ success: false, message: "Gagal memperbarui kapasitas tong" });
    }
  }

  async measure(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      const result = await binService.measureBin(data);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[BinController] measureBin error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async createResetRequestMobile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { binId } = req.body;
      if (!req.file) {
        res.status(400).json({ error: "BAD_REQUEST", message: "File evidence tidak ditemukan" });
        return;
      }
      if (!binId) {
        res.status(400).json({ error: "BAD_REQUEST", message: "binId wajib diisi" });
        return;
      }
      const host = req.get("host");
      const protocol = req.protocol;
      const evidencePhotoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
      const result = await binService.createResetRequest(binId, userId, evidencePhotoUrl);
      res.status(201).json({
        success: true,
        data: {
          id: result.id,
          binId: result.binId,
          userId: result.userId,
          status: result.status,
          evidencePhotoUrl: result.evidencePhotoUrl,
          createdAt: result.createdAt,
        },
      });
    } catch (error: any) {
      console.error("[BinController] createResetRequestMobile error:", error);
      if (error.message === "RESOURCE_NOT_FOUND") {
        res.status(404).json({ error: "RESOURCE_NOT_FOUND", message: "Tempat sampah tidak ditemukan" });
      } else if (error.message === "BIN_NOT_OWNED") {
        res.status(403).json({ error: "BIN_NOT_OWNED", message: "Tempat sampah bukan milik Anda" });
      } else if (error.message === "DUPLICATE_REQUEST") {
        res.status(400).json({ error: "DUPLICATE_REQUEST", message: "Sudah ada pengajuan pengosongan aktif untuk tong ini" });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal membuat pengajuan pengosongan" });
      }
    }
  }
}

export const binController = new BinController();
