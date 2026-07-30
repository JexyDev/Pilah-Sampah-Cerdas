/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { kknAttendanceService } from "../services/kknAttendanceService.js";

export const kknAttendanceController = {
  updateLocation: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user!.userId;
      let locations = req.body.locations;

      if (!locations || !Array.isArray(locations)) {
        // Fallback to single ping
        const { latitude, longitude, lat, lng, timestamp } = req.body;
        const finalLat =
          latitude !== undefined
            ? parseFloat(latitude)
            : lat !== undefined
              ? parseFloat(lat)
              : null;
        const finalLng =
          longitude !== undefined
            ? parseFloat(longitude)
            : lng !== undefined
              ? parseFloat(lng)
              : null;

        if (finalLat === null || finalLng === null || isNaN(finalLat) || isNaN(finalLng)) {
          res.status(400).json({
            success: false,
            error: "VALIDATION_ERROR",
            message:
              "Payload locations (array) atau koordinat latitude dan longitude yang valid diperlukan",
          });
          return;
        }
        locations = [
          {
            latitude: finalLat,
            longitude: finalLng,
            timestamp: timestamp || new Date().toISOString(),
          },
        ];
      }

      const result = await kknAttendanceService.updateStudentLocationsBatch(studentId, locations);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] updateLocation error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memperbarui lokasi mahasiswa",
      });
    }
  },

  getActivityLocation: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "ID Kegiatan wajib diisi",
        });
        return;
      }

      const result = await kknAttendanceService.getActivityLocation(id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] getActivityLocation error:", error);
      const code = error.message === "SCHEDULE_NOT_FOUND" ? 404 : 500;
      res.status(code).json({
        success: false,
        error: error.message === "SCHEDULE_NOT_FOUND" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal mendapatkan lokasi kegiatan",
      });
    }
  },

  recordAttendance: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user!.userId;
      const { id } = req.params;
      const { latitude, longitude, lat, lng, method } = req.body;

      const finalLat =
        latitude !== undefined ? parseFloat(latitude) : lat !== undefined ? parseFloat(lat) : null;
      const finalLng =
        longitude !== undefined
          ? parseFloat(longitude)
          : lng !== undefined
            ? parseFloat(lng)
            : null;
      const finalMethod = method || "MANUAL";

      if (!id) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "ID Kegiatan wajib diisi",
        });
        return;
      }

      if (finalLat === null || finalLng === null || isNaN(finalLat) || isNaN(finalLng)) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Koordinat latitude dan longitude tidak valid untuk absensi",
        });
        return;
      }

      if (!["MANUAL", "OTOMATIS"].includes(finalMethod)) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Metode absensi harus MANUAL atau OTOMATIS",
        });
        return;
      }

      const result = await kknAttendanceService.recordAttendance({
        studentId,
        scheduleId: id,
        latitude: finalLat,
        longitude: finalLng,
        method: finalMethod as "MANUAL" | "OTOMATIS",
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] recordAttendance error:", error);
      const isOutOfRadius = error.message && error.message.includes("OUT_OF_RADIUS");
      const isAlreadyAttended = error.message === "ALREADY_ATTENDED";
      const isNotFound = error.message === "SCHEDULE_NOT_FOUND";

      const status = isOutOfRadius ? 400 : isAlreadyAttended ? 409 : isNotFound ? 404 : 500;

      res.status(status).json({
        success: false,
        error: isOutOfRadius
          ? "OUT_OF_RADIUS"
          : isAlreadyAttended
            ? "ALREADY_ATTENDED"
            : isNotFound
              ? "NOT_FOUND"
              : "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal melakukan absensi kegiatan",
      });
    }
  },

  getActiveStudentsLocations: async (req: Request, res: Response): Promise<void> => {
    try {
      // Read-only monitoring allowed for SUPER_ADMIN, ADMIN_DLH, CAMAT, LURAH, RW
      const result = await kknAttendanceService.getActiveStudentsLocations();
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] getActiveStudentsLocations error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Gagal mendapatkan lokasi aktif mahasiswa",
      });
    }
  },

  getAttendanceList: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "ID Kegiatan wajib diisi",
        });
        return;
      }

      const result = await kknAttendanceService.getAttendanceList(id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] getAttendanceList error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Gagal mendapatkan riwayat absensi kegiatan",
      });
    }
  },
};
