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
      const { id: paramId } = req.params;
      const { latitude, longitude, lat, lng, method, scheduleId: bodyScheduleId, nim, namaMahasiswa, kodeZona } = req.body;
      const id = paramId || bodyScheduleId || req.body.id || "kkn-main-posko";

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

      const defaultLat = -6.975412;
      const defaultLng = 107.632145;
      const validLat = finalLat !== null && !isNaN(finalLat) ? finalLat : defaultLat;
      const validLng = finalLng !== null && !isNaN(finalLng) ? finalLng : defaultLng;

      const result = await kknAttendanceService.recordAttendance({
        studentId,
        scheduleId: id,
        latitude: validLat,
        longitude: validLng,
        method: finalMethod,
        nim,
        namaMahasiswa,
        kodeZona,
      });

      res.status(200).json({
        success: true,
        message: "Absensi kegiatan KKN berhasil dicatat.",
        data: {
          attendanceId: result.id || `att-kkn-${Date.now().toString().slice(-4)}`,
          earnedPoints: 50,
          ...result,
        },
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
      const rawRole = (req as any).user?.role;
      const roleName = String(typeof rawRole === "object" ? rawRole?.name : rawRole || "").toUpperCase();
      const isDpl = roleName === "DPL" || roleName === "DOSEN_PEMBIMBING";
      const dplUserId = isDpl ? ((req as any).user?.userId || (req as any).user?.id) : undefined;

      const result = await kknAttendanceService.getActiveStudentsLocations(dplUserId);
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

      const rawRole = (req as any).user?.role;
      const roleName = String(typeof rawRole === "object" ? rawRole?.name : rawRole || "").toUpperCase();
      let dplUserId: string | undefined = undefined;
      if (roleName === "DPL" || roleName === "DOSEN_PEMBIMBING") {
        dplUserId = (req as any).user?.userId || (req as any).user?.id;
      }

      const result = await kknAttendanceService.getAttendanceList(id, dplUserId);
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

  getTimesheetSummary: async (req: Request, res: Response): Promise<void> => {
    try {
      const rawRole = (req as any).user?.role;
      const roleName = String(typeof rawRole === "object" ? rawRole?.name : rawRole || "").toUpperCase();
      const isDpl = roleName === "DPL" || roleName === "DOSEN_PEMBIMBING";
      const isStudent = roleName === "MAHASISWA_KKN";

      const currentUserId = (req as any).user?.userId || (req as any).user?.id;
      const kelompokId = req.query.kelompokId as string | undefined;
      const studentId = isStudent ? currentUserId : (req.query.studentId as string | undefined);
      const dplUserId = isDpl ? currentUserId : undefined;

      const result = await kknAttendanceService.getTimesheetSummary({
        kelompokId,
        studentId,
        dplUserId,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] getTimesheetSummary error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Gagal mendapatkan data rekap timesheet presensi",
      });
    }
  },
};

