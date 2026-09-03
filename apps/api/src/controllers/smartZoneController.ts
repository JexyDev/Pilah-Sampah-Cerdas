/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * SmartZoneController — Multi-Posko & Auto-Polygon Endpoints
 */

import { Request, Response } from "express";
import { smartZoneService } from "../services/smartZoneService.js";
import { poskoKknService } from "../services/poskoKknService.js";
import { prisma } from "../lib/prisma.js";

export const smartZoneController = {
  /**
   * GET /posko-kkn/kelompok/:kelompokId/all-zones
   * Endpoint utama mobile: return semua posko + auto-polygon untuk kelompok
   * Mobile Developer: Call this on app start & when fcm event MULTI_POSKO_UPDATED received
   */
  getGroupAllZones: async (req: Request, res: Response): Promise<void> => {
    try {
      const { kelompokId } = req.params;
      if (!kelompokId) {
        res.status(400).json({ success: false, message: "kelompokId diperlukan" });
        return;
      }
      const data = await poskoKknService.getGroupAllPoskos(kelompokId);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res
        .status(500)
        .json({ success: false, message: err.message || "Gagal mengambil zona kelompok" });
    }
  },

  /**
   * GET /posko-kkn/me/all-zones
   * Endpoint utama mobile mahasiswa: return zona lengkap kelompok sendiri
   * Mobile Developer: Call this after login & on FCM MULTI_POSKO_UPDATED event
   */
  getMyGroupAllZones: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const student = await prisma.studentKkn.findUnique({
        where: { userId },
        select: { kelompokId: true },
      });
      if (!student?.kelompokId) {
        res.status(404).json({ success: false, message: "Kelompok tidak ditemukan" });
        return;
      }
      const data = await poskoKknService.getGroupAllPoskos(student.kelompokId);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res
        .status(500)
        .json({ success: false, message: err.message || "Gagal mengambil zona kelompok" });
    }
  },

  /**
   * GET /posko-kkn/kelompok/:kelompokId/multi
   * List semua posko tambahan (multi) dari satu kelompok
   */
  getMultiPoskos: async (req: Request, res: Response): Promise<void> => {
    try {
      const { kelompokId } = req.params;
      const data = await poskoKknService.getMultiPoskos(kelompokId);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res
        .status(500)
        .json({ success: false, message: err.message || "Gagal mengambil multi-posko" });
    }
  },

  /**
   * POST /posko-kkn/multi
   * Daftarkan posko tambahan untuk kelompok
   * Body: { kelompokId?, nama, alamat, latitude, longitude, radius?, isUtama?, keterangan? }
   * Untuk MAHASISWA_KKN (Ketua): kelompokId di-auto-resolve dari profil mahasiswa
   */
  addMultiPosko: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const peran = (req as any).user?.role ?? "";
      let { kelompokId, nama, alamat, latitude, longitude, radius, isUtama, keterangan, fotoUrl } =
        req.body;

      if (!nama || !alamat || latitude === undefined || longitude === undefined) {
        res
          .status(400)
          .json({ success: false, message: "nama, alamat, latitude, longitude wajib diisi" });
        return;
      }

      // Auto-resolve kelompokId untuk mahasiswa
      if (peran === "MAHASISWA_KKN" && !kelompokId) {
        const student = await prisma.studentKkn.findFirst({
          where: { userId },
          select: { kelompokId: true, isKetua: true },
        });
        if (!student?.kelompokId) {
          res
            .status(400)
            .json({ success: false, message: "Mahasiswa belum terdaftar dalam kelompok KKN" });
          return;
        }
        kelompokId = student.kelompokId;
      }

      if (!kelompokId) {
        res.status(400).json({ success: false, message: "kelompokId wajib diisi" });
        return;
      }

      const posko = await poskoKknService.addMultiPosko(kelompokId, {
        nama,
        alamat,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius: radius ? Number(radius) : undefined,
        isUtama: isUtama ?? false,
        keterangan: keterangan ?? undefined,
        fotoUrl: fotoUrl ?? undefined,
      });

      res
        .status(201)
        .json({ success: true, message: "Posko tambahan berhasil didaftarkan", data: posko });
    } catch (err: any) {
      res
        .status(500)
        .json({ success: false, message: err.message || "Gagal menambah multi-posko" });
    }
  },

  /**
   * PUT /posko-kkn/multi/:poskoId
   * Update data posko tambahan
   */
  updateMultiPosko: async (req: Request, res: Response): Promise<void> => {
    try {
      const { poskoId } = req.params;
      const { nama, alamat, latitude, longitude, radius, isUtama, keterangan, fotoUrl } = req.body;
      const updated = await poskoKknService.updateMultiPosko(poskoId, {
        ...(nama !== undefined ? { nama } : {}),
        ...(alamat !== undefined ? { alamat } : {}),
        ...(latitude !== undefined ? { latitude: Number(latitude) } : {}),
        ...(longitude !== undefined ? { longitude: Number(longitude) } : {}),
        ...(radius !== undefined ? { radius: Number(radius) } : {}),
        ...(isUtama !== undefined ? { isUtama } : {}),
        ...(keterangan !== undefined ? { keterangan } : {}),
        ...(fotoUrl !== undefined ? { fotoUrl } : {}),
      });
      res.status(200).json({ success: true, message: "Posko berhasil diperbarui", data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal update multi-posko" });
    }
  },

  /**
   * DELETE /posko-kkn/multi/:poskoId
   * Hapus posko tambahan
   */
  deleteMultiPosko: async (req: Request, res: Response): Promise<void> => {
    try {
      const { poskoId } = req.params;
      await poskoKknService.deleteMultiPosko(poskoId);
      res.status(200).json({ success: true, message: "Posko tambahan berhasil dihapus" });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || "Gagal hapus multi-posko" });
    }
  },

  /**
   * GET /smart-zone/:kelompokId/preview
   * Preview zona auto-generated untuk portal admin / peta inspeksi
   */
  getZonePreview: async (req: Request, res: Response): Promise<void> => {
    try {
      const { kelompokId } = req.params;
      const data = await smartZoneService.getGroupZonePreview(kelompokId);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res
        .status(500)
        .json({ success: false, message: err.message || "Gagal mengambil zona preview" });
    }
  },

  /**
   * POST /smart-zone/:kelompokId/regenerate
   * Force-regenerate polygon (admin action)
   */
  forceRegeneratePolygon: async (req: Request, res: Response): Promise<void> => {
    try {
      const { kelompokId } = req.params;
      const info = await smartZoneService.forceRegeneratePolygon(kelompokId);
      if (!info) {
        res
          .status(404)
          .json({ success: false, message: "Kelompok tidak ditemukan atau tidak ada data GPS" });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Polygon berhasil di-regenerate",
        data: {
          kelompokId: info.kelompokId,
          kelompokName: info.kelompokName,
          polygon: info.polygon,
          centerLat: info.centerLat,
          centerLng: info.centerLng,
          boundingRadius: info.boundingRadius,
          studentCount: info.studentCount,
          updatedAt: info.updatedAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal regenerate polygon" });
    }
  },

  /**
   * POST /smart-zone/check-position
   * Cek apakah posisi mahasiswa masuk zona kelompok tertentu (debug / testing endpoint)
   * Body: { latitude, longitude, kelompokId }
   */
  checkPosition: async (req: Request, res: Response): Promise<void> => {
    try {
      const { latitude, longitude, kelompokId } = req.body;
      if (!latitude || !longitude || !kelompokId) {
        res
          .status(400)
          .json({ success: false, message: "latitude, longitude, kelompokId diperlukan" });
        return;
      }
      const result = await smartZoneService.isStudentInGroupZone(
        Number(latitude),
        Number(longitude),
        kelompokId
      );
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal cek posisi" });
    }
  },
};
