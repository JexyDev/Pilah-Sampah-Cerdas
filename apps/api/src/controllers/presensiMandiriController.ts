/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { Request, Response } from "express";
import { presensiMandiriService } from "../services/presensiMandiriService.js";

const ADMIN_ROLES = ["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "DPL", "DOSEN_PEMBIMBING", "PANITIA_TASKFORCE", "PEMIMPIN"];

export const presensiMandiriController = {
  /**
   * POST /presensi/mandiri
   * Body: multipart/form-data — foto (file), deskripsiKegiatan (text), latitude, longitude
   */
  checkIn: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user!.userId;
      const { latitude, longitude, deskripsiKegiatan } = req.body;
      const file = (req as any).file;

      if (!file) {
        res.status(400).json({ success: false, error: "FOTO_REQUIRED", message: "Foto bukti kegiatan wajib diunggah." });
        return;
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lng)) {
        res.status(400).json({ success: false, error: "INVALID_COORDINATES", message: "Koordinat latitude dan longitude wajib disertakan." });
        return;
      }

      const baseUrl = process.env.BASE_URL ?? "";
      const fotoUrl = `${baseUrl}/uploads/${file.filename}`;

      const result = await presensiMandiriService.checkIn({
        studentId, latitude: lat, longitude: lng, deskripsiKegiatan, fotoUrl,
      });

      res.status(200).json({ success: true, message: "Presensi mandiri berhasil dicatat.", data: result });
    } catch (error: any) {
      const msg: string = error.message ?? "INTERNAL_ERROR";
      const statusMap: Record<string, number> = {
        FOTO_REQUIRED: 400, INVALID_COORDINATES: 400, DESKRIPSI_REQUIRED: 400,
        STUDENT_PROFILE_INCOMPLETE: 403, ALREADY_CHECKED_IN_TODAY: 409,
      };
      const errKey = msg.split(":")[0];
      const status = statusMap[errKey] ?? 500;
      res.status(status).json({ success: false, error: errKey, message: msg });
    }
  },

  /**
   * PATCH /presensi/mandiri/:id/checkout
   */
  checkOut: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user!.userId;
      const presensiId = req.params.id;
      const { deskripsiKegiatan } = req.body;

      const result = await presensiMandiriService.checkOut({ presensiId, studentId, deskripsiKegiatan });
      res.status(200).json({ success: true, message: "Check-out presensi mandiri berhasil.", data: result });
    } catch (error: any) {
      const msg: string = error.message ?? "INTERNAL_ERROR";
      const statusMap: Record<string, number> = { PRESENSI_NOT_FOUND: 404, ALREADY_CHECKED_OUT: 409 };
      res.status(statusMap[msg] ?? 500).json({ success: false, error: msg, message: msg });
    }
  },

  /**
   * PATCH /presensi/mandiri/:id/deskripsi
   */
  updateDeskripsi: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user!.userId;
      const presensiId = req.params.id;
      const { deskripsiKegiatan } = req.body;

      const result = await presensiMandiriService.updateDeskripsi({ presensiId, studentId, deskripsiKegiatan });
      res.status(200).json({ success: true, message: "Deskripsi kegiatan berhasil diperbarui.", data: result });
    } catch (error: any) {
      const msg: string = error.message ?? "INTERNAL_ERROR";
      const errKey = msg.split(":")[0];
      const statusMap: Record<string, number> = { PRESENSI_NOT_FOUND: 404, DESKRIPSI_REQUIRED: 400, DESKRIPSI_TOO_LONG: 400 };
      res.status(statusMap[errKey] ?? 500).json({ success: false, error: errKey, message: msg });
    }
  },

  /**
   * GET /presensi/mandiri/saya
   */
  getRiwayatSaya: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await presensiMandiriService.getRiwayatSaya(studentId, { page, limit });
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  /**
   * GET /presensi/live-map
   */
  getLiveMap: async (req: Request, res: Response): Promise<void> => {
    try {
      const kelompokId = req.query.kelompokId as string | undefined;
      const result = await presensiMandiriService.getLiveMap({ kelompokId });
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  /**
   * GET /presensi/mandiri — admin/DPL list
   */
  getAll: async (req: Request, res: Response): Promise<void> => {
    try {
      const { kelompokId, tanggalMulai, tanggalAkhir, status, page, limit } = req.query;
      const result = await presensiMandiriService.getAll({
        kelompokId: kelompokId as string,
        tanggalMulai: tanggalMulai as string,
        tanggalAkhir: tanggalAkhir as string,
        status: status as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },
};
