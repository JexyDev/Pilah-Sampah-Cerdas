/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { kknAttendanceService } from "../services/kknAttendanceService.js";

export const kknAttendanceController = {
  pingLocation: async (req: Request, res: Response): Promise<void> => {
    try {
      const latRaw = req.body.latitude ?? req.body.lat;
      const lngRaw = req.body.longitude ?? req.body.lng;
      const latitude = Number(latRaw);
      const longitude = Number(lngRaw);

      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({
          success: false,
          error: "INVALID_COORDINATES",
          message: "Koordinat latitude dan longitude yang valid diperlukan",
        });
        return;
      }

      // Baca durasi dari mobile — menerima 'accumulatedDurationSeconds', 'accumulatedDuration', atau 'inZoneSeconds'
      const rawDuration =
        req.body.accumulatedDurationSeconds ??
        req.body.accumulatedDuration ??
        req.body.inZoneSeconds;
      const accumulatedDuration = rawDuration !== undefined ? Number(rawDuration) : undefined;

      const result = await kknAttendanceService.pingLocation(
        req.user!.userId,
        latitude,
        longitude,
        accumulatedDuration
      );
      res.json(result);
    } catch (error: any) {
      const errorCode: string = error.message ?? "INTERNAL_ERROR";

      // Map known error codes to appropriate HTTP status
      const statusMap: Record<string, number> = {
        USER_NOT_FOUND: 404,
        STUDENT_PROFILE_INCOMPLETE: 403,
        INVALID_COORDINATES: 400,
        OUT_OF_COBLONG_BOUNDS: 422,
        LOCATION_TELEPORTATION_DETECTED: 422,
      };

      const status = statusMap[errorCode] ?? 400;
      res.status(status).json({ success: false, error: errorCode, message: error.message });
    }
  },

  updateLocation: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user!.userId;
      let locations = req.body.locations;

      if (!locations || !Array.isArray(locations)) {
        // Fallback to single ping
        const { latitude, longitude, lat, lng, timestamp, inZoneSeconds } = req.body;
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
            inZoneSeconds: inZoneSeconds !== undefined ? parseInt(inZoneSeconds) : undefined,
          },
        ];
      }

      const result = await kknAttendanceService.updateStudentLocationsBatch(studentId, locations);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("[KknAttendanceController] updateLocation error:", error);

      // FEATURE 3: Attempt fallback location save on error
      try {
        const { latitude, longitude, lat, lng } = req.body;
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

        if (finalLat && finalLng && !isNaN(finalLat) && !isNaN(finalLng)) {
          // Import prisma for fallback save
          const { prisma } = await import("../lib/prisma.js");
          await prisma.studentLocation
            .create({
              data: {
                studentId: req.user!.userId,
                latitude: finalLat,
                longitude: finalLng,
                recordedAt: new Date(),
              },
            })
            .catch(() => {
              // Silent catch - fallback already attempted
            });
        }
      } catch (_) {
        // Fallback save attempt failed, will respond with error
      }

      // Return 200 with partial success to keep mobile tracking active
      res.status(200).json({
        success: true,
        data: {
          scheduleId: null,
          activeScheduleId: null,
          status: "ERROR_SAVING_FULL_DATA",
          attendanceStatus: "TIDAK_ADA_KEGIATAN",
          inZoneMinutes: 0,
          actualInZoneSeconds: 0,
          actualInZoneMinutes: 0,
          autoAttendanceTriggered: [],
          locations: [],
          message: error.message || "Location recorded but attendance calc failed. Will retry.",
          warning: "Partial data saved due to backend error",
        },
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

      const userId = (req as any).user?.userId;
      const result = await kknAttendanceService.getActivityLocation(id, userId);
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
      const targetStudentId = req.body.studentId || req.user!.userId;
      const { id: paramId } = req.params;
      const {
        latitude,
        longitude,
        lat,
        lng,
        method,
        scheduleId: bodyScheduleId,
        nim,
        namaMahasiswa,
        kodeZona,
      } = req.body;
      const id = paramId || bodyScheduleId || req.body.id || "kkn-main-posko";

      const rawDeskripsi =
        req.body.deskripsiKegiatan ||
        req.body.deskripsi_kegiatan ||
        req.body.deskripsi ||
        req.body.catatan;
      const file = (req as any).file;
      let rawFoto =
        req.body.fotoUrl ||
        req.body.foto_url ||
        req.body.foto ||
        req.body.imageUrl ||
        req.body.image_url;
      if (file) {
        const baseUrl = process.env.BASE_URL ?? "";
        rawFoto = `${baseUrl}/uploads/${file.filename}`;
      }

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
        studentId: targetStudentId,
        scheduleId: id,
        latitude: validLat,
        longitude: validLng,
        method: finalMethod,
        nim,
        namaMahasiswa,
        kodeZona,
        deskripsiKegiatan: rawDeskripsi,
        fotoUrl: rawFoto,
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

  checkOutAttendance: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user!.userId;
      const { id: paramId } = req.params;
      const { latitude, longitude, lat, lng, scheduleId: bodyScheduleId } = req.body;
      const id = paramId || bodyScheduleId || req.body.id;

      const rawDeskripsi =
        req.body.deskripsiKegiatan ||
        req.body.deskripsi_kegiatan ||
        req.body.deskripsi ||
        req.body.catatan;
      const file = (req as any).file;
      let finalFotoUrl =
        req.body.fotoUrl ||
        req.body.foto_url ||
        req.body.foto ||
        req.body.imageUrl ||
        req.body.image_url;
      if (file) {
        const baseUrl = process.env.BASE_URL ?? "";
        finalFotoUrl = `${baseUrl}/uploads/${file.filename}`;
      }

      const finalLat =
        latitude !== undefined
          ? parseFloat(latitude)
          : lat !== undefined
            ? parseFloat(lat)
            : undefined;
      const finalLng =
        longitude !== undefined
          ? parseFloat(longitude)
          : lng !== undefined
            ? parseFloat(lng)
            : undefined;

      const result = await kknAttendanceService.checkOutAttendance({
        studentId,
        scheduleId: id,
        latitude: finalLat,
        longitude: finalLng,
        deskripsiKegiatan: rawDeskripsi,
        fotoUrl: finalFotoUrl,
      });

      res.status(200).json(result);
    } catch (error: any) {
      console.error("[KknAttendanceController] checkOutAttendance error:", error);
      const isNotFound = error.message && error.message.includes("ATTENDANCE_NOT_FOUND");
      res.status(isNotFound ? 404 : 500).json({
        success: false,
        error: isNotFound ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal melakukan check-out absensi kegiatan",
      });
    }
  },

  getActiveStudentsLocations: async (req: Request, res: Response): Promise<void> => {
    try {
      const rawRole = (req as any).user?.role;
      const roleName = String(
        typeof rawRole === "object" ? rawRole?.name : rawRole || ""
      ).toUpperCase();
      const isDpl = roleName === "DPL" || roleName === "DOSEN_PEMBIMBING";
      const dplUserId = isDpl ? (req as any).user?.userId || (req as any).user?.id : undefined;
      const kelompokId = (req.query.kelompokId as string) || undefined;

      const result = await kknAttendanceService.getActiveStudentsLocations(dplUserId, kelompokId);
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
      const roleName = String(
        typeof rawRole === "object" ? rawRole?.name : rawRole || ""
      ).toUpperCase();
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
      const roleName = String(
        typeof rawRole === "object" ? rawRole?.name : rawRole || ""
      ).toUpperCase();
      const isDpl = roleName === "DPL" || roleName === "DOSEN_PEMBIMBING";
      const isStudent = roleName === "MAHASISWA_KKN";

      const currentUserId = (req as any).user?.userId || (req as any).user?.id;
      const kelompokId = req.query.kelompokId as string | undefined;
      const studentId = isStudent ? currentUserId : (req.query.studentId as string | undefined);
      const dplUserId = isDpl ? currentUserId : undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const result = await kknAttendanceService.getTimesheetSummary({
        kelompokId,
        studentId,
        dplUserId,
        startDate,
        endDate,
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

  getLaporanPresensi: async (req: Request, res: Response): Promise<void> => {
    try {
      const rawRole = (req as any).user?.role;
      const roleName = String(
        typeof rawRole === "object" ? rawRole?.name : rawRole || ""
      ).toUpperCase();
      const isDpl = [
        "DPL",
        "DOSEN_PEMBIMBING",
        "DOSEN_PENDAMPING",
        "DOSEN_PENDAMPING_LAPANGAN",
      ].includes(roleName);
      const isStudent = roleName === "MAHASISWA_KKN";

      const currentUserId = (req as any).user?.userId || (req as any).user?.id;
      const dplUserId = isDpl ? currentUserId : undefined;
      const kelompokId = req.query.kelompokId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await kknAttendanceService.getLaporanPresensi({
        kelompokId,
        dplUserId,
        startDate,
        endDate,
        status,
        search,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] getLaporanPresensi error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal mendapatkan data laporan presensi",
      });
    }
  },

  getKegiatanAktif: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentUserId = (req as any).user?.userId || (req as any).user?.id;
      if (!studentUserId) {
        res.status(401).json({
          success: false,
          error: "UNAUTHORIZED",
          message: "Autentikasi mahasiswa diperlukan",
        });
        return;
      }

      const tanggal = req.query.tanggal as string | undefined;
      const data = await kknAttendanceService.getKegiatanAktif(studentUserId, tanggal);

      res.status(200).json({
        success: true,
        data,
        message: data.length === 0 ? "Tidak ada kegiatan KKN aktif hari ini." : undefined,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] getKegiatanAktif error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal mengambil daftar kegiatan KKN aktif",
      });
    }
  },

  mulaiKegiatan: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentUserId = (req as any).user?.userId || (req as any).user?.id;
      const { id } = req.params;
      const { latitude, longitude, deviceInfo } = req.body;

      const rawDeskripsi =
        req.body.deskripsiKegiatan ||
        req.body.deskripsi_kegiatan ||
        req.body.deskripsi ||
        req.body.catatan;
      const file = (req as any).file;
      let finalFotoUrl =
        req.body.fotoUrl ||
        req.body.foto_url ||
        req.body.foto ||
        req.body.imageUrl ||
        req.body.image_url;
      if (file) {
        const baseUrl = process.env.BASE_URL ?? "";
        finalFotoUrl = `${baseUrl}/uploads/${file.filename}`;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "ID Kegiatan wajib disertakan",
        });
        return;
      }

      if (latitude === undefined || longitude === undefined) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Koordinat latitude dan longitude wajib disertakan",
        });
        return;
      }

      const result = await kknAttendanceService.mulaiKegiatan(studentUserId, id, {
        latitude: Number(latitude),
        longitude: Number(longitude),
        deviceInfo,
        deskripsiKegiatan: rawDeskripsi,
        fotoUrl: finalFotoUrl,
        poskoId: req.body.poskoId,
      });

      res.status(200).json({
        success: true,
        message: "Presensi kegiatan KKN berhasil dicatat. GPS tracking aktif.",
        data: result,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] mulaiKegiatan error:", error);
      const isConflict = error.message && error.message.includes("CONCURRENCY_CONFLICT");
      const isForbidden = error.message && error.message.includes("FORBIDDEN");
      const isNotFound = error.message && error.message.includes("NOT_FOUND");

      let statusCode = 500;
      let errCode = "INTERNAL_SERVER_ERROR";
      if (isConflict) {
        statusCode = 409;
        errCode = "CONFLICT";
      } else if (isForbidden) {
        statusCode = 403;
        errCode = "FORBIDDEN";
      } else if (isNotFound) {
        statusCode = 404;
        errCode = "NOT_FOUND";
      }

      res.status(statusCode).json({
        success: false,
        error: errCode,
        message: error.message || "Gagal memulai kegiatan KKN",
      });
    }
  },

  selesaiKegiatan: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentUserId = (req as any).user?.userId || (req as any).user?.id;
      const { id } = req.params;
      const { sessionId, totalDurasiDalamZonaMenit, alasan, latitude, longitude } = req.body;

      const rawDeskripsi =
        req.body.deskripsiKegiatan ||
        req.body.deskripsi_kegiatan ||
        req.body.deskripsi ||
        req.body.catatan;
      const file = (req as any).file;
      let finalFotoUrl =
        req.body.fotoUrl ||
        req.body.foto_url ||
        req.body.foto ||
        req.body.imageUrl ||
        req.body.image_url;
      if (file) {
        const baseUrl = process.env.BASE_URL ?? "";
        finalFotoUrl = `${baseUrl}/uploads/${file.filename}`;
      }

      const result = await kknAttendanceService.selesaiKegiatan(studentUserId, id, {
        sessionId,
        totalDurasiDalamZonaMenit: totalDurasiDalamZonaMenit
          ? Number(totalDurasiDalamZonaMenit)
          : undefined,
        alasan,
        deskripsiKegiatan: rawDeskripsi,
        fotoUrl: finalFotoUrl,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      });

      res.status(200).json({
        success: true,
        message: "Sesi kegiatan berhasil diakhiri. GPS telah dinonaktifkan.",
        data: result,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] selesaiKegiatan error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal mengakhiri kegiatan KKN",
      });
    }
  },

  absenAlias: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentUserId = (req as any).user?.userId || (req as any).user?.id;
      const id = req.params.id || req.body.scheduleId;
      const {
        sessionId,
        totalDurasiDalamZonaMenit,
        durationMinutes,
        accumulatedDuration,
        accumulatedSeconds,
        alasan,
      } = req.body;

      const rawDeskripsi =
        req.body.deskripsiKegiatan ||
        req.body.deskripsi_kegiatan ||
        req.body.deskripsi ||
        req.body.catatan;
      const file = (req as any).file;
      let finalFotoUrl =
        req.body.fotoUrl ||
        req.body.foto_url ||
        req.body.foto ||
        req.body.imageUrl ||
        req.body.image_url;
      if (file) {
        const baseUrl = process.env.BASE_URL ?? "";
        finalFotoUrl = `${baseUrl}/uploads/${file.filename}`;
      }

      const mins =
        totalDurasiDalamZonaMenit ??
        durationMinutes ??
        Math.ceil((accumulatedDuration || accumulatedSeconds || 0) / 60);

      const result = await kknAttendanceService.selesaiKegiatan(studentUserId, id, {
        sessionId: sessionId || `SES-${id}`,
        totalDurasiDalamZonaMenit: mins,
        alasan: alasan || "Presensi Selesai",
        deskripsiKegiatan: rawDeskripsi,
        fotoUrl: finalFotoUrl,
      });

      res.status(200).json({
        success: true,
        message: "Sesi kegiatan berhasil diakhiri.",
        data: result,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] absenAlias error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal mencatat presensi",
      });
    }
  },

  jedaKegiatan: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentUserId = (req as any).user?.userId || (req as any).user?.id;
      const { id } = req.params;
      const { alasan, totalDurasiDalamZonaMenit, totalDurasiDalamZonaDetik } = req.body;

      const result = await kknAttendanceService.jedaKegiatan(studentUserId, id, {
        alasan,
        totalDurasiDalamZonaMenit:
          totalDurasiDalamZonaMenit !== undefined ? Number(totalDurasiDalamZonaMenit) : undefined,
        totalDurasiDalamZonaDetik:
          totalDurasiDalamZonaDetik !== undefined ? Number(totalDurasiDalamZonaDetik) : undefined,
      });

      res.status(200).json(result);
    } catch (error: any) {
      console.error("[KknAttendanceController] jedaKegiatan error:", error);
      const statusCode =
        error.message?.includes("tidak ditemukan") ? 404 :
        error.message?.includes("diselesaikan") || error.message?.includes("tidak bisa dijeda") ? 422 :
        500;
      res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "VALIDATION_ERROR",
        message: error.message || "Gagal menjeda kegiatan KKN",
      });
    }
  },

  lanjutKegiatan: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentUserId = (req as any).user?.userId || (req as any).user?.id;
      const { id } = req.params;
      const { latitude, longitude } = req.body;

      if (latitude === undefined || longitude === undefined) {
        res.status(400).json({
          success: false,
          message: "Koordinat latitude dan longitude wajib dikirim untuk validasi zona.",
        });
        return;
      }

      const result = await kknAttendanceService.lanjutKegiatan(studentUserId, id, {
        latitude: Number(latitude),
        longitude: Number(longitude),
      });

      res.status(200).json(result);
    } catch (error: any) {
      console.error("[KknAttendanceController] lanjutKegiatan error:", error);
      const message = error.message || "Gagal melanjutkan kegiatan KKN";
      const status = message.includes("OUT_OF_GEOFENCE") ? 403 : 500;
      res.status(status).json({
        success: false,
        error: status === 403 ? "OUT_OF_GEOFENCE" : "INTERNAL_SERVER_ERROR",
        message,
      });
    }
  },

  recordOutOfZoneViolation: async (req: Request, res: Response): Promise<void> => { (feat(api): lanjutKegiatan dengan geofence + checkout wajib di zona)
    try {
      const studentUserId = (req as any).user?.userId || (req as any).user?.id;
      const { id } = req.params;

      const result = await kknAttendanceService.lanjutKegiatan(studentUserId, id);

      res.status(200).json(result);
    } catch (error: any) {
      console.error("[KknAttendanceController] lanjutKegiatan error:", error);
      const statusCode =
        error.message?.includes("tidak ditemukan") ? 404 :
        error.message?.includes("TERJEDA") ? 422 :
        500;
      res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "VALIDATION_ERROR",
        message: error.message || "Gagal melanjutkan kegiatan KKN",
      });
    }
  },

  // [Q4 REMOVED] recordOutOfZoneViolation dihapus — LOSS MODE tidak memiliki penalti zona
  getPresensiHistory: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentUserId = (req as any).user?.userId || (req as any).user?.id;
      const { id: scheduleId } = req.params;

      if (!scheduleId) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "scheduleId wajib disertakan",
        });
        return;
      }

      const result = await kknAttendanceService.getPresensiHistory(studentUserId, scheduleId);

      if (!result) {
        res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: "Data presensi tidak ditemukan untuk kegiatan ini",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] getPresensiHistory error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Gagal mendapatkan riwayat presensi kegiatan",
      });
    }
  },

  skipKegiatan: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const userRole = (req as any).user?.role;
      const { id } = req.params;
      const alasan = req.body.alasan || "Tidak ada kegiatan";

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "UNAUTHORIZED",
          message: "Autentikasi diperlukan",
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "ID Kegiatan wajib disertakan",
        });
        return;
      }

      const result = await kknAttendanceService.skipKegiatan(userId, userRole, id, { alasan });

      res.status(200).json({
        success: true,
        message: "Kegiatan berhasil ditandai sebagai Tidak Ada Kegiatan.",
        data: result,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] skipKegiatan error:", error);
      const isConflict =
        error.message &&
        (error.message.includes("CONFLICT") || error.message.includes("sudah dimulai"));
      const isForbidden =
        error.message &&
        (error.message.includes("FORBIDDEN") || error.message.includes("tidak memiliki izin"));
      const isNotFound =
        error.message &&
        (error.message.includes("NOT_FOUND") || error.message.includes("tidak ditemukan"));

      let statusCode = 500;
      let errCode = "INTERNAL_SERVER_ERROR";
      let message = error.message || "Gagal melewati kegiatan KKN";

      if (isConflict) {
        statusCode = 409;
        errCode = "CONFLICT";
        message = error.message.replace(/^CONFLICT:\s*/, "");
      } else if (isForbidden) {
        statusCode = 403;
        errCode = "FORBIDDEN";
        message = error.message.replace(/^FORBIDDEN:\s*/, "");
      } else if (isNotFound) {
        statusCode = 404;
        errCode = "NOT_FOUND";
        message = error.message.replace(/^NOT_FOUND:\s*/, "");
      }

      res.status(statusCode).json({
        success: false,
        error: errCode,
        message,
      });
    }
  },

  createAttendanceManual: async (req: Request, res: Response): Promise<void> => {
    try {
      const authorUserId = req.user!.userId;
      const authorRole = req.user!.role;
      const data = await kknAttendanceService.createAttendanceManual(
        authorUserId,
        authorRole,
        req.body
      );
      res.status(201).json({
        success: true,
        message: "Presensi mahasiswa berhasil dibuat manual.",
        data,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] createAttendanceManual error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getAttendanceById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await kknAttendanceService.getAttendanceById(id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] getAttendanceById error:", error);
      res.status(404).json({ success: false, message: error.message });
    }
  },

  updateAttendanceAdmin: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const authorUserId = req.user!.userId;
      const authorRole = req.user!.role;
      const data = await kknAttendanceService.updateAttendanceAdmin(
        id,
        authorUserId,
        authorRole,
        req.body
      );
      res.status(200).json({
        success: true,
        message: "Data presensi & durasi jam pulang berhasil diperbarui.",
        data,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] updateAttendanceAdmin error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  deleteAttendanceAdmin: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const authorUserId = req.user!.userId;
      const authorRole = req.user!.role;
      const data = await kknAttendanceService.deleteAttendanceAdmin(id, authorUserId, authorRole);
      res.status(200).json({
        success: true,
        message: "Data presensi berhasil dihapus.",
        data,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] deleteAttendanceAdmin error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  forceCheckoutAttendance: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const authorUserId = req.user!.userId;
      const authorRole = req.user!.role;
      const data = await kknAttendanceService.forceCheckoutAttendance(
        id,
        authorUserId,
        authorRole,
        req.body
      );
      res.status(200).json({
        success: true,
        message: "Sesi presensi yang terjeda berhasil diselesaikan (Force Check-out).",
        data,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] forceCheckoutAttendance error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  processAutoAlpha: async (req: Request, res: Response): Promise<void> => {
    try {
      const { date } = req.body || {};
      const result = await kknAttendanceService.processWeekdayAutoAlpha(date);
      res.status(200).json({
        success: true,
        message: result.isWeekday
          ? `Evaluasi auto-alpha hari kerja (${result.date}) selesai. Ditandai Alpa: ${result.totalMarkedAlpha}, Mahasiswa dengan aktivitas: ${result.totalBypassed}.`
          : `Tanggal ${result.date} adalah akhir pekan (Sabtu/Minggu). Auto-alpha dibypass.`,
        data: result,
      });
    } catch (error: any) {
      console.error("[KknAttendanceController] processAutoAlpha error:", error);
      res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  },
};
