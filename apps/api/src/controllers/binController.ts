import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
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
  confidence: z.number().optional(),
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
      let mappedBins = bins.map((bin: any) => {
        const currentVol = Number(bin.currentVolumeLiter || 0);
        const maxVol = Number(bin.maxCapacityLiter || 25);
        const kapasitas = maxVol > 0 ? Math.round((currentVol / maxVol) * 100) : 0;

        const isInactive7Days = bin.updatedAt
          ? Date.now() - new Date(bin.updatedAt).getTime() > 7 * 24 * 60 * 60 * 1000
          : false;

        // Resolve the effective owner from direct user or primary/first binOwnerships
        const effectiveOwner =
          bin.user ||
          bin.binOwnerships?.find((bo: any) => bo.type === "UTAMA")?.user ||
          bin.binOwnerships?.[0]?.user ||
          null;

        const isBound = Boolean(effectiveOwner);
        const effectiveUserId = effectiveOwner?.id || bin.userId || null;
        const isActivated = (bin.status === "ACTIVE_BOUND" || bin.status === "ACTIVE") && isBound;

        let verifiedAtStr = "Belum Diaktivasi";
        if (isActivated && bin.updatedAt) {
          const d = new Date(bin.updatedAt);
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          const hours = String(d.getHours()).padStart(2, "0");
          const minutes = String(d.getMinutes()).padStart(2, "0");
          verifiedAtStr = `${day}/${month}/${year}, ${hours}.${minutes}`;
        }

        const hasGps =
          bin.latitude !== null &&
          bin.longitude !== null &&
          bin.latitude !== undefined &&
          bin.longitude !== undefined;
        const latVal = hasGps ? Number(bin.latitude).toFixed(4) : null;
        const lngVal = hasGps ? Number(bin.longitude).toFixed(4) : null;
        const altVal = bin.height ? Math.round(Number(bin.height) * 10) + 700 : 768;
        const gpsFormatted = hasGps
          ? `${latVal}, ${lngVal}, ${altVal} mdpl`
          : "Belum Terikat (GPS)";

        const ensureTcFormat = (codeStr: string, catName?: string) => {
          if (!codeStr) return "BSK-OGN-250826-0001";
          if (codeStr.startsWith("BSK-") || codeStr.startsWith("TC-")) return codeStr;
          const upperCat = (catName || "").toUpperCase();
          let tag = "OGN";
          if (
            upperCat.includes("ANORGANIK") ||
            upperCat.includes("AGN") ||
            upperCat.includes("ANG")
          )
            tag = "AGN";
          else if (upperCat.includes("RESIDU") || upperCat.includes("RSD")) tag = "RSD";
          const digits = codeStr.replace(/\D/g, "");
          const seq = digits
            ? String(parseInt(digits.slice(-4) || "1", 10)).padStart(4, "0")
            : "0001";
          return `BSK-${tag}-250826-${seq}`;
        };

        const lastDeposit = bin.setoranOtomatis?.[0] || null;
        let lastActivityLog = verifiedAtStr;
        if (lastDeposit) {
          const d = new Date(lastDeposit.createdAt);
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          const hours = String(d.getHours()).padStart(2, "0");
          const minutes = String(d.getMinutes()).padStart(2, "0");
          const cat = (lastDeposit.hasilKlasifikasiAi || "").toLowerCase().includes("anorganik")
            ? "Anorganik"
            : "Organik";
          const rawConf = Number(lastDeposit.confidenceAi || 0);
          const confVal = rawConf > 1 ? Math.round(rawConf) : Math.round(rawConf * 100);
          const conf = confVal > 0 && confVal <= 100 ? ` (${confVal}% AI)` : "";
          lastActivityLog = `Setoran ${cat} ${lastDeposit.berat || 0} kg (${day}/${month}/${year}, ${hours}.${minutes})${conf}`;
        } else if (isActivated) {
          lastActivityLog = verifiedAtStr;
        }

        const calculatedAddress =
          effectiveOwner?.address ||
          effectiveOwner?.households?.[0]?.address ||
          (bin.rw?.name ? `${bin.rw.name}, Coblong` : "Kecamatan Coblong");

        return {
          id: bin.id,
          qrCode: bin.qrCode,
          kode: ensureTcFormat(bin.qrCode, bin.category?.name),
          lokasi: calculatedAddress,
          address: calculatedAddress,
          wargaAddress: effectiveOwner?.address || effectiveOwner?.households?.[0]?.address || null,
          rw: bin.rw?.name || (bin.rwId ? `ID RT/RW: ${bin.rwId}` : "Belum Terikat"),
          kelurahan: bin.rw?.kelurahan?.name || null,
          user: effectiveOwner
            ? {
                id: effectiveOwner.id,
                name: effectiveOwner.name,
                phone: effectiveOwner.phone,
                address: effectiveOwner.address || effectiveOwner.households?.[0]?.address || null,
              }
            : null,
          kapasitas,
          status:
            bin.status === "PRINTED"
              ? "PRINTED"
              : bin.status === "BROKEN"
                ? "Rusak"
                : kapasitas > 80
                  ? "Penuh"
                  : kapasitas > 50
                    ? "Sedang"
                    : "Normal",
          lastUpdate: bin.updatedAt ? new Date(bin.updatedAt).toLocaleTimeString() : "-",
          verifiedAt: verifiedAtStr,
          gpsFormatted,
          altitude: altVal,
          categoryId: bin.categoryId || null,
          rwId: bin.rwId || null,
          maxCapacityLiter: maxVol,
          latitude: bin.latitude,
          longitude: bin.longitude,
          currentVolumeLiter: currentVol,
          category: bin.category,
          wargaName: effectiveOwner?.name || null,
          wargaPhone: effectiveOwner?.phone || null,
          kknName: bin.qrBatch?.assignedPic?.name || "-",
          userId: effectiveUserId,
          isBound,
          realStatus: bin.status,
          needsInspection: isInactive7Days && bin.status === "ACTIVE_BOUND",
          lastActivityLog,
        };
      });

      if (filters.status && filters.status !== "Semua Status") {
        const targetStatus = filters.status.toLowerCase();
        mappedBins = mappedBins.filter((b: any) => {
          const st = (b.status || "").toLowerCase();
          const rst = (b.realStatus || "").toLowerCase();
          if (
            targetStatus === "perbaikan" ||
            targetStatus === "rusak" ||
            targetStatus === "broken"
          ) {
            return st === "rusak" || rst === "broken" || st === "perbaikan";
          }
          if (targetStatus === "normal") {
            return st === "normal" || rst === "active_bound" || rst === "active";
          }
          return st === targetStatus || rst === targetStatus;
        });
      }

      res.status(200).json({
        status: "success",
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
      const areas = await binService.getAreas(req.user);
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

  async createKelurahan(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;
      if (!name) {
        res
          .status(400)
          .json({ success: false, error: "INVALID_INPUT", message: "Nama Kelurahan wajib diisi" });
        return;
      }
      const kelurahan = await binService.createKelurahan(name);
      res.status(201).json({ success: true, data: kelurahan });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async deleteKelurahan(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await binService.deleteKelurahan(id);
      res.status(200).json({ success: true, message: "Kelurahan berhasil dihapus" });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
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

      const user = req.user;
      if (user && user.role === "RW") {
        let userRwId = user.rwId;
        if (!userRwId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { rwId: true },
          });
          userRwId = dbUser?.rwId ?? undefined;
        }
        if (!userRwId || Number(userRwId) !== Number(id)) {
          res.status(403).json({
            error: "FORBIDDEN",
            message: "Akses ditolak: Anda hanya berwenang mengubah lokasi wilayah RW Anda sendiri.",
          });
          return;
        }
      }

      const updatedArea = await binService.updateArea(
        Number(id),
        name,
        kelurahanId,
        latitude !== undefined && latitude !== null && latitude !== "" ? Number(latitude) : undefined,
        longitude !== undefined && longitude !== null && longitude !== "" ? Number(longitude) : undefined
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
        res.status(400).json({
          status: "error",
          error: "VALIDATION_ERROR",
          message: "QR Code tidak valid atau format data scan tidak sesuai.",
          details: parsed.error.format(),
        });
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
        confidence,
        evidencePhotoUrl,
        detections,
      } = parsed.data as any;

      // Validasi QR Code: Harus berupa string valid (minimal 4 karakter)
      if (!qrCode || typeof qrCode !== "string" || qrCode.trim().length < 4) {
        res.status(400).json({
          status: "error",
          error: "INVALID_QR_FORMAT",
          message: "QR Code tidak valid atau tempat sampah tidak terdaftar di sistem.",
        });
        return;
      }

      const finalConfidence = confidence ?? aiConfidence;

      // Anti-dummy-data: tolak transaksi kalau bukti foto atau confidence AI
      // asli tidak ada, alih-alih diam-diam mengisi foto stok/confidence palsu.
      if (!evidencePhotoUrl) {
        res.status(400).json({
          status: "error",
          error: "EVIDENCE_PHOTO_MISSING",
          message: "Foto bukti sampah wajib disertakan. Silakan foto ulang dan kirim lagi.",
        });
        return;
      }
      const hasValidConfidence =
        Array.isArray(detections) && detections.length > 0
          ? detections.every((d: any) => typeof d.confidence === "number" && d.confidence > 0)
          : typeof finalConfidence === "number" && finalConfidence > 0;
      if (!hasValidConfidence) {
        res.status(400).json({
          status: "error",
          error: "AI_CONFIDENCE_MISSING",
          message:
            "Hasil deteksi AI tidak valid atau gagal diproses. Silakan foto ulang dan kirim lagi.",
        });
        return;
      }

      const result = await binService.processScan(
        qrCode,
        userId,
        householdId,
        detectedType,
        estimatedVolume,
        userLat,
        userLng,
        finalConfidence,
        evidencePhotoUrl,
        detections
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.message === "BIN_NOT_FOUND" || error.message.startsWith("BIN_NOT_FOUND:")) {
        res.status(404).json({
          status: "error",
          error: "RESOURCE_NOT_FOUND",
          message: "QR Code tidak valid atau tempat sampah tidak terdaftar di sistem.",
        });
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
      } else if (error.message === "BIN_RW_MISMATCH") {
        res.status(403).json({
          error: "BIN_RW_MISMATCH",
          message: "QR Code ini hanya dapat digunakan oleh warga yang terdaftar di RW yang sama.",
        });
      } else if (
        error.message === "LOCATION_OUT_OF_RANGE" ||
        error.message === "LOCATION_TOO_FAR"
      ) {
        res.status(400).json({
          success: false,
          error: "LOCATION_TOO_FAR",
          code: "LOCATION_TOO_FAR",
          message: `Posisi Anda terlalu jauh dari lokasi Tempat Sampah (${error.distanceMeters ? error.distanceMeters + "m" : ">10m"}).`,
          distanceMeters: error.distanceMeters,
        });
      } else if (error.message === "BIN_TYPE_MISMATCH") {
        res.status(400).json({
          error: "BIN_TYPE_MISMATCH",
          message: `Tempat Sampah tidak sesuai! Anda memasukkan sampah ke Tempat Sampah khusus ${error.binType}.`,
        });
      } else if (error.message === "BIN_OVERFLOW" || error.message === "BIN_FULL") {
        res.status(400).json({
          success: false,
          code: "BIN_FULL",
          error: "BIN_FULL",
          message:
            "Tempat Sampah ini sudah penuh! Transaksi tidak dapat dilakukan. Silakan gunakan QR Tempat Sampah milik Anda yang lain atau ajukan Pengosongan Tempat Sampah.",
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

      // ✅ FIX: handle format BIN_NOT_FOUND dengan dan tanpa suffix qrCode
      if (error.message === "BIN_NOT_FOUND" || error.message.startsWith("BIN_NOT_FOUND:")) {
        res.status(404).json({
          success: false,
          error: "BIN_NOT_FOUND",
          message: "QR Code tidak terdaftar di sistem. Pastikan QR Code yang Anda scan benar.",
        });
        return;
      }

      if (error.message === "BIN_RW_MISMATCH") {
        res.status(403).json({
          success: false,
          error: "BIN_RW_MISMATCH",
          message: "QR Code ini hanya dapat diaktivasi oleh warga yang terdaftar di RW yang sama.",
        });
        return;
      }

      if (error.message === "USER_RW_NOT_SET") {
        res.status(400).json({
          success: false,
          error: "USER_RW_NOT_SET",
          message: "Data RW akun Anda belum terdaftar. Silakan lengkapi profil terlebih dahulu.",
        });
        return;
      }

      if (error.message.startsWith("ONBOARDING_INCOMPLETE_WRONG_CATEGORY:")) {
        const missingCat = error.message.split(":")[1];
        res.status(400).json({
          success: false,
          error: "ONBOARDING_INCOMPLETE_WRONG_CATEGORY",
          message: `Anda belum menyelesaikan aktivasi awal. Selesaikan aktivasi Tempat Sampah ${missingCat === "ORGANIC" ? "Non-Organik" : "Organik"} Anda terlebih dahulu.`,
        });
        return;
      }
      if (error.message.startsWith("BIN_CATEGORY_DUPLICATE:")) {
        const cat = error.message.split(":")[1];
        res.status(400).json({
          success: false,
          error: "BIN_CATEGORY_DUPLICATE",
          message: `Tempat Sampah ${cat} sudah terdaftar untuk Anda.`,
        });
        return;
      }
      if (error.message === "BIN_CATEGORY_DUPLICATE_IN_REQUEST") {
        res.status(400).json({
          success: false,
          error: "BIN_CATEGORY_DUPLICATE",
          message:
            "Tidak boleh mengaktivasi dua Tempat Sampah dengan kategori yang sama sekaligus.",
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
   * Get poster specification / HTML for a bin / QR code (Mobile & Web sync)
   */
  async getPoster(req: Request, res: Response): Promise<void> {
    try {
      const { identifier } = req.params;
      if (!identifier) {
        res.status(400).json({ success: false, message: "QR Code or Bin ID is required" });
        return;
      }

      const bin = await prisma.bin.findFirst({
        where: {
          OR: [{ id: identifier }, { qrCode: identifier }],
        },
        include: {
          category: true,
          rw: { include: { kelurahan: true } },
        },
      });

      const qrCode = bin ? bin.qrCode : identifier;
      const categoryName =
        bin?.category?.name ||
        (identifier.toUpperCase().includes("-AGN-") ? "ANORGANIK" : "ORGANIK");
      const isAnorganik =
        categoryName.toUpperCase().includes("ANORGANIK") ||
        categoryName.toUpperCase().includes("NON_ORGANIC") ||
        categoryName.toUpperCase().includes("AGN") ||
        qrCode.toUpperCase().includes("-AGN-");

      const theme = isAnorganik ? "YELLOW" : "GREEN";
      const title = isAnorganik ? "TEMPAT SAMPAH ANORGANIK" : "TEMPAT SAMPAH ORGANIK";
      const description = isAnorganik
        ? "Untuk sampah anorganik seperti plastik, kaleng, kaca, logam, dan bahan sintetis lainnya."
        : "Untuk sampah organik dari sisa makanan, daun, ranting, dan bahan alami lainnya.";

      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=1&data=${encodeURIComponent(qrCode)}`;

      const format = (req.query.format as string) || "json";

      if (format === "html" || req.headers.accept?.includes("text/html")) {
        const origin = req.protocol + "://" + req.get("host");
        const themeClass = isAnorganik ? "theme-anorganik" : "theme-organik";
        const catTitle = isAnorganik ? "ANORGANIK" : "ORGANIK";
        const catDesc = description;

        const formattedSerialCode = (() => {
          if (!qrCode) return "BSK-OGN-250826-0001";
          if (qrCode.startsWith("BSK-") || qrCode.startsWith("TC-")) return qrCode;
          const tag = isAnorganik ? "AGN" : "OGN";
          const digits = qrCode.replace(/\D/g, "");
          const seq = digits
            ? String(parseInt(digits.slice(-4) || "1", 10)).padStart(4, "0")
            : "0001";
          return `BSK-${tag}-250826-${seq}`;
        })();

        const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Poster ${qrCode} BERSEKA</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&family=JetBrains+Mono:wght@800;900&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #000000;
      background: #0f172a;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 16px;
    }

    /* Poster Card (100mm x 150mm scale) */
    .poster-card {
      width: 100%;
      max-width: 380px;
      aspect-ratio: 10 / 15;
      border-radius: 16px;
      padding: 16px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      background: #ffffff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    /* ANORGANIK YELLOW THEME */
    .poster-card.theme-anorganik {
      border: 12px solid #FFC20E;
      background: #FFFFFF;
    }
    .poster-card.theme-anorganik .banner-box {
      background: #FFC20E;
      color: #000000;
    }
    .poster-card.theme-anorganik .logo-pill {
      background: #FFC20E;
      color: #000000;
    }
    .poster-card.theme-anorganik .benefit-icon {
      background: #FFC20E;
      color: #000000;
    }
    .poster-card.theme-anorganik .scan-icon-circle {
      background: #FFC20E;
      color: #000000;
    }
    .poster-card.theme-anorganik .pill-serial {
      background: #FFC20E;
      color: #000000;
    }

    /* ORGANIK GREEN THEME */
    .poster-card.theme-organik {
      border: 12px solid #006837;
      background: #FFFFFF;
    }
    .poster-card.theme-organik .banner-box {
      background: #006837;
      color: #FFFFFF;
    }
    .poster-card.theme-organik .logo-pill {
      background: #006837;
      color: #FFFFFF;
    }
    .poster-card.theme-organik .benefit-icon {
      background: #006837;
      color: #FFFFFF;
    }
    .poster-card.theme-organik .scan-icon-circle {
      background: #006837;
      color: #FFFFFF;
    }
    .poster-card.theme-organik .pill-serial {
      background: #006837;
      color: #FFFFFF;
    }

    /* HEADER */
    .header-section {
      text-align: center;
    }
    .header-top {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .header-title {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 2px;
      color: #000000;
      line-height: 1;
    }
    .leaf-icon-left, .leaf-icon-right {
      font-size: 14px;
    }
    .header-sub-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 2px;
    }
    .header-sub-line {
      flex: 1;
      height: 1.5px;
      background: #cbd5e1;
    }
    .header-subtitle {
      font-size: 8px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #000000;
    }

    /* LOGOS ROW */
    .logos-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2px;
      padding: 3px;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      text-align: center;
      background: #ffffff;
      margin: 8px 0;
    }
    .logo-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      gap: 2px;
      border-right: 1px solid #e2e8f0;
      padding: 2px;
    }
    .logo-item:last-child {
      border-right: none;
    }
    .logo-img-wrapper {
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-img {
      max-height: 22px;
      max-width: 100%;
      object-fit: contain;
    }
    .logo-pill {
      font-size: 5px;
      font-weight: 900;
      line-height: 1.1;
      border-radius: 4px;
      padding: 2px 3px;
      width: 100%;
      text-transform: uppercase;
    }

    /* MAIN BANNER */
    .banner-box {
      border-radius: 12px;
      padding: 6px 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
    }
    .banner-left {
      flex-shrink: 0;
    }
    .bin-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #ffffff;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    .banner-right {
      text-align: left;
      flex: 1;
    }
    .banner-sub-sm {
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.5px;
      line-height: 1;
    }
    .banner-title-main {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 1px;
      line-height: 1.1;
    }
    .banner-leaf-divider {
      font-size: 8px;
      margin: 1px 0;
    }
    .banner-desc-box {
      font-size: 7px;
      line-height: 1.2;
      font-weight: 700;
    }

    /* 4 BENEFITS */
    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2px;
      text-align: center;
      margin: 8px 0;
    }
    .benefit-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      border-right: 1px solid #f1f5f9;
    }
    .benefit-item:last-child {
      border-right: none;
    }
    .benefit-icon {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
    }
    .benefit-text {
      font-size: 5.5px;
      font-weight: 800;
      line-height: 1.15;
      color: #000000;
    }

    /* QR SECTION */
    .qr-section {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
    }
    .qr-box {
      width: 110px;
      height: 110px;
      background: #ffffff;
      padding: 2px;
      border-radius: 6px;
      border: 1.5px solid #000000;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .qr-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: pixelated;
    }
    .qr-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      text-align: left;
    }
    .scan-header {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .scan-icon-circle {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      flex-shrink: 0;
    }
    .scan-title-bold {
      font-size: 9px;
      font-weight: 900;
      line-height: 1.1;
      color: #000000;
    }
    .scan-desc {
      font-size: 6px;
      font-weight: 700;
      color: #334155;
      line-height: 1.2;
    }
    .pill-serial {
      border-radius: 9999px;
      padding: 3px 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5px;
      font-weight: 900;
      text-align: center;
      letter-spacing: 0.5px;
    }

    /* FOOTER */
    .footer-bar {
      border-top: 1.5px solid #cbd5e1;
      padding-top: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .footer-left {
      display: flex;
      align-items: center;
      gap: 4px;
      text-align: left;
    }
    .shield-icon {
      font-size: 10px;
    }
    .footer-text {
      font-size: 6px;
      font-weight: 900;
      color: #000000;
      line-height: 1.1;
    }
    .footer-right {
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="poster-card ${themeClass}">
    <!-- Header Section -->
    <div class="header-section">
      <div class="header-top">
        <span class="leaf-icon-left">🍃</span>
        <div class="header-title">BERSEKA</div>
        <span class="leaf-icon-right">🍃</span>
      </div>
      <div class="header-sub-row">
        <div class="header-sub-line"></div>
        <div class="header-subtitle">BERSIH • SEHAT • KAMPUNG ASRI</div>
        <div class="header-sub-line"></div>
      </div>
    </div>

    <!-- Row of 4 Institutional Logos -->
    <div class="logos-row">
      <div class="logo-item">
        <div class="logo-img-wrapper">
          <img src="${origin}/image/mitra/prov-jabar.png" alt="Jawa Barat" class="logo-img" />
        </div>
        <div class="logo-pill">PROVINSI<br/>JAWA BARAT</div>
      </div>
      <div class="logo-item">
        <div class="logo-img-wrapper">
          <img src="${origin}/image/mitra/pemkot-bandung.svg" alt="Kota Bandung" class="logo-img" />
        </div>
        <div class="logo-pill">PEMERINTAH<br/>KOTA BANDUNG</div>
      </div>
      <div class="logo-item">
        <div class="logo-img-wrapper">
          <img src="${origin}/image/mitra/dlh-bandung.svg" alt="DLH Kota Bandung" class="logo-img" />
        </div>
        <div class="logo-pill">DINAS<br/>LINGKUNGAN HIDUP</div>
      </div>
      <div class="logo-item">
        <div class="logo-img-wrapper">
          <img src="${origin}/image/mitra/unikom.png" alt="UNIKOM" class="logo-img" />
        </div>
        <div class="logo-pill">UNIVERSITAS<br/>KOMPUTER INDONESIA</div>
      </div>
    </div>

    <!-- Main Category Banner -->
    <div class="banner-box">
      <div class="banner-left">
        <div class="bin-circle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            <path d="M10 11v6m4-6v6"></path>
          </svg>
        </div>
      </div>
      <div class="banner-right">
        <div class="banner-sub-sm">TEMPAT SAMPAH</div>
        <div class="banner-title-main">${catTitle}</div>
        <div class="banner-leaf-divider">🍃 🍃</div>
        <div class="banner-desc-box">${catDesc}</div>
      </div>
    </div>

    <!-- 4 Benefit Columns -->
    <div class="benefits-grid">
      <div class="benefit-item">
        <div class="benefit-icon">🍃</div>
        <div class="benefit-text">Menjaga<br/>lingkungan<br/>tetap bersih</div>
      </div>
      <div class="benefit-item">
        <div class="benefit-icon">♻️</div>
        <div class="benefit-text">Mengurangi<br/>sampah<br/>ke TPA</div>
      </div>
      <div class="benefit-item">
        <div class="benefit-icon">🗑️</div>
        <div class="benefit-text">Kelola sampah<br/>lebih baik dan<br/>bermanfaat</div>
      </div>
      <div class="benefit-item">
        <div class="benefit-icon">👥</div>
        <div class="benefit-text">Bersama wujudkan<br/>kampung yang<br/>bersih & asri</div>
      </div>
    </div>

    <!-- Bottom QR Code & Scan Section -->
    <div class="qr-section">
      <div class="qr-box">
        <img src="${qrImageUrl}" alt="${qrCode}" class="qr-img" />
      </div>
      <div class="qr-right">
        <div class="scan-header">
          <div class="scan-icon-circle">📱</div>
          <div class="scan-titles">
            <div class="scan-title-bold">SCAN UNTUK</div>
            <div class="scan-title-bold">CATAT & LAPOR</div>
          </div>
        </div>
        <div class="scan-desc">
          Setiap scan membantu kami mencatat dan mengelola sampah dengan lebih baik.
        </div>
        <div class="pill-serial">
          ${formattedSerialCode}
        </div>
      </div>
    </div>

    <!-- Footer Bar -->
    <div class="footer-bar">
      <div class="footer-left">
        <span class="shield-icon">🛡️</span>
        <div class="footer-text">
          <div>MARI JAGA KEBERSIHAN</div>
          <div>UNTUK MASA DEPAN YANG LEBIH HIJAU</div>
        </div>
      </div>
      <div class="footer-right">🍃</div>
    </div>
  </div>
</body>
</html>`;
        res.setHeader("Content-Type", "text/html");
        res.status(200).send(html);
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: bin?.id || null,
          qrCode,
          category: categoryName,
          theme,
          title,
          description,
          qrImageUrl,
          posterHtmlUrl: `/api/v1/bins/${encodeURIComponent(qrCode)}/poster?format=html`,
        },
      });
    } catch (error: any) {
      console.error("[BinController] getPoster error:", error);
      res.status(500).json({ success: false, message: "Gagal mengambil poster QR code" });
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
    } catch (error: any) {
      console.error("[BinController] deleteBin error:", error);
      if (error.message === "BIN_NOT_FOUND") {
        res.status(404).json({
          success: false,
          error: "RESOURCE_NOT_FOUND",
          message: "Tempat sampah tidak ditemukan",
        });
      } else {
        res.status(500).json({
          success: false,
          error: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus tempat sampah",
        });
      }
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
   * Get reset request status for user (Mobile)
   */
  async getResetRequestStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const requests = await prisma.binResetRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { bin: true },
      });

      res.status(200).json({
        success: true,
        data: requests.map((r: any) => ({
          id: r.id,
          binId: r.binId,
          qrCode: r.bin.qrCode,
          status: r.status,
          evidencePhotoUrl: r.evidencePhotoUrl,
          createdAt: r.createdAt,
          resetRequestStatus: r.status,
        })),
      });
    } catch (error) {
      console.error("[BinController] getResetRequestStatus error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil status pengajuan" });
    }
  }

  /**
   * Cek status petugas tetap warga yang sedang login.
   * Response: { hasDefaultPetugas: bool, petugas: { id, nama, foto } | null }
   */
  async getPetugasStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await binService.getPetugasStatusForWarga(userId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[BinController] getPetugasStatus error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil status petugas" });
    }
  }

  /**
   * Daftar petugas residu yang bertugas di wilayah RW yang sama dengan warga.
   * Sumber wilayah dari profil server, bukan query param frontend.
   */
  async getPetugasByWilayah(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await binService.getPetugasByRw(userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error("[BinController] getPetugasByWilayah error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil daftar petugas" });
    }
  }

  /**
   * Simpan petugas tetap untuk warga.
   * Body: { petugasId: string }
   * Validasi wilayah dilakukan di service layer.
   */
  async setDefaultPetugas(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { petugasId } = req.body;
      if (!petugasId) {
        res.status(400).json({ error: "BAD_REQUEST", message: "petugasId wajib diisi" });
        return;
      }
      const result = await binService.setDefaultPetugas(userId, petugasId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[BinController] setDefaultPetugas error:", error);
      if (error.message === "PETUGAS_NOT_FOUND") {
        res.status(404).json({ error: "PETUGAS_NOT_FOUND", message: "Petugas tidak ditemukan" });
      } else if (error.message === "NOT_PETUGAS") {
        res.status(400).json({ error: "NOT_PETUGAS", message: "User bukan Petugas Residu" });
      } else if (error.message === "WILAYAH_MISMATCH") {
        res.status(403).json({
          error: "WILAYAH_MISMATCH",
          message: "Petugas tidak bertugas di wilayah Anda",
        });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal menyimpan petugas tetap" });
      }
    }
  }

  async debugPetugas(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string;
      const result = await binService.debugPetugasData(userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal debug" });
    }
  }

  /**
   * Create a new bin reset request (Warga)
   */
  async createResetRequest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { binId, evidencePhotoUrl, petugasId, jenisSampah } = req.body;
      if (!binId || !evidencePhotoUrl) {
        res
          .status(400)
          .json({ error: "BAD_REQUEST", message: "binId dan evidencePhotoUrl wajib diisi" });
        return;
      }

      const result = await binService.createResetRequest(
        binId,
        userId,
        evidencePhotoUrl,
        petugasId ?? null,
        jenisSampah ?? null
      );
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[BinController] createResetRequest error:", error);
      if (error.message === "RESOURCE_NOT_FOUND") {
        res
          .status(404)
          .json({ error: "RESOURCE_NOT_FOUND", message: "Tempat sampah tidak ditemukan" });
      } else if (error.message === "BIN_NOT_OWNED") {
        res.status(403).json({ error: "BIN_NOT_OWNED", message: "Tempat sampah bukan milik Anda" });
      } else if (error.message === "DUPLICATE_REQUEST") {
        res.status(400).json({
          error: "DUPLICATE_REQUEST",
          message: "Sudah ada pengajuan pengosongan aktif untuk tempat sampah ini",
        });
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
        res.status(400).json({ error: "BAD_REQUEST", message: "status tidak valid" });
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
   * Create QR Batch (SUPER USER/Admin DLH)
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
      res.status(200).json({
        success: true,
        data: result,
        message: "Kapasitas Tempat Sampah berhasil diperbarui",
      });
    } catch (error: any) {
      console.error("[BinController] updateCapacity error:", error);
      res
        .status(500)
        .json({ success: false, message: "Gagal memperbarui kapasitas Tempat Sampah" });
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
      const { binId, petugasId, jenisSampah } = req.body;
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
      const result = await binService.createResetRequest(
        binId,
        userId,
        evidencePhotoUrl,
        petugasId ?? null,
        jenisSampah ?? null
      );
      res.status(201).json({
        success: true,
        data: {
          id: result.id,
          binId: result.binId,
          userId: result.userId,
          petugasId: result.petugasId,
          jenisSampah: result.jenisSampah,
          status: result.status,
          evidencePhotoUrl: result.evidencePhotoUrl,
          createdAt: result.createdAt,
        },
      });
    } catch (error: any) {
      console.error("[BinController] createResetRequestMobile error:", error);
      if (error.message === "RESOURCE_NOT_FOUND") {
        res
          .status(404)
          .json({ error: "RESOURCE_NOT_FOUND", message: "Tempat sampah tidak ditemukan" });
      } else if (error.message === "BIN_NOT_OWNED") {
        res.status(403).json({ error: "BIN_NOT_OWNED", message: "Tempat sampah bukan milik Anda" });
      } else if (error.message === "DUPLICATE_REQUEST") {
        res.status(400).json({
          error: "DUPLICATE_REQUEST",
          message: "Sudah ada pengajuan pengosongan aktif untuk tempat sampah ini",
        });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal membuat pengajuan pengosongan" });
      }
    }
  }

  async resetOwnership(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.user?.userId;
      const result = await binService.resetBinOwnership(id, adminUserId);
      res.status(200).json({
        status: "success",
        success: true,
        message: "Kepemilikan tempat sampah berhasil di-reset ke status PRINTED",
        data: result,
      });
    } catch (error: any) {
      console.error("[BinController] resetOwnership error:", error);
      if (error.message === "BIN_NOT_FOUND") {
        res.status(404).json({
          status: "error",
          success: false,
          error: "RESOURCE_NOT_FOUND",
          message: "Tempat sampah tidak ditemukan",
        });
      } else {
        res.status(500).json({
          status: "error",
          success: false,
          error: "INTERNAL_SERVER_ERROR",
          message: "Gagal mereset kepemilikan tempat sampah",
        });
      }
    }
  }
}

export const binController = new BinController();
