/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { kknAttendanceController } from "../controllers/kknAttendanceController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { safeUploadSingleImage } from "../middlewares/uploadMiddleware.js";

const router = Router();

// In-memory rate limiting for GPS updates (1 request per 3s per student)
const lastRequestMap = new Map<string, number>();
const gpsRateLimiter = (req: any, res: any, next: any) => {
  const userId = req.user?.userId;
  if (!userId) {
    return next();
  }
  const now = Date.now();
  const lastRequest = lastRequestMap.get(userId) || 0;
  if (now - lastRequest < 3000) {
    // 3 seconds
    res.status(429).json({
      success: false,
      error: "TOO_MANY_REQUESTS",
      message: "Update lokasi terlalu cepat. Harap tunggu 3 detik.",
    });
    return;
  }
  lastRequestMap.set(userId, now);
  next();
};

// Student routes
router.post(
  "/mahasiswa/lokasi",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  gpsRateLimiter,
  kknAttendanceController.updateLocation
);

/**
 * @swagger
 * /api/v1/kegiatan/{id}/lokasi:
 *   get:
 *     summary: Mendapatkan lokasi spesifik kegiatan
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil mengambil lokasi kegiatan
 */
router.get(
  "/kegiatan/:id/lokasi",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "MAHASISWA_KKN"]),
  kknAttendanceController.getActivityLocation
);

/**
 * @swagger
 * /api/v1/kegiatan/{id}/absen:
 *   post:
 *     summary: Melakukan absensi (check-in) untuk kegiatan KKN
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               method:
 *                 type: string
 *                 description: "Metode absensi (misal: GPS, MANUAL, QR)"
 *     responses:
 *       200:
 *         description: Absen berhasil dicatat
 */
router.post(
  "/kegiatan/:id/absen",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("foto"),
  kknAttendanceController.recordAttendance
);

/**
 * @swagger
 * /api/v1/kegiatan/{id}/check-out:
 *   post:
 *     summary: Melakukan check-out (pulang/selesai) untuk kegiatan KKN
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Check-out berhasil dicatat
 */
router.post(
  ["/kegiatan/:id/check-out", "/kegiatan/:id/checkout"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("foto"),
  kknAttendanceController.checkOutAttendance
);

router.post(
  ["/kkn/attendance/check-out", "/kkn/attendance/checkout"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("foto"),
  kknAttendanceController.checkOutAttendance
);

/**
 * @swagger
 * /api/v1/mahasiswa/lokasi-aktif:
 *   get:
 *     summary: Mendapatkan lokasi aktif seluruh mahasiswa KKN
 *     tags: [Monitoring KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar lokasi mahasiswa
 */
router.get(
  "/mahasiswa/lokasi-aktif",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "DPL", "DOSEN_PEMBIMBING", "PANITIA_TASKFORCE", "PEMIMPIN"]),
  kknAttendanceController.getActiveStudentsLocations
);

/**
 * @swagger
 * /api/v1/kegiatan/{id}/absen:
 *   get:
 *     summary: Mendapatkan daftar absensi pada kegiatan tertentu
 *     tags: [Monitoring KKN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan data absensi
 */
router.get(
  "/kegiatan/:id/absen",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "DPL", "DOSEN_PEMBIMBING", "PANITIA_TASKFORCE", "PEMIMPIN"]),
  kknAttendanceController.getAttendanceList
);

router.get(
  "/timesheet/summary",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "DPL", "DOSEN_PEMBIMBING", "PANITIA_TASKFORCE", "PEMIMPIN", "MAHASISWA_KKN", "DEVELOPER"]),
  kknAttendanceController.getTimesheetSummary
);

// Canonical: /api/v1/kkn-attendance/kkn/attendance/laporan-rekap
// Alias /laporan-rekap dan /laporan-presensi dipertahankan untuk backward-compat.
router.get(
  ["/laporan-rekap", "/kkn/attendance/laporan-rekap", "/laporan-presensi"],
  authMiddleware,
  roleMiddleware(["DEVELOPER", "DPL", "DOSEN_PEMBIMBING"]),
  kknAttendanceController.getLaporanPresensi
);

import { KknAttendanceService } from "../services/kknAttendanceService.js";
const kknAttendanceServiceInstance = new KknAttendanceService();

router.get(
  ["/kkn/kegiatan-aktif", "/kegiatan-aktif"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER", "DPL"]),
  kknAttendanceController.getKegiatanAktif
);

router.post(
  ["/kkn/kegiatan/:id/mulai", "/kegiatan/:id/mulai"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("foto"),
  kknAttendanceController.mulaiKegiatan
);

router.post(
  ["/kkn/kegiatan/:id/jeda", "/kegiatan/:id/jeda"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknAttendanceController.jedaKegiatan
);

router.post(
  ["/kkn/kegiatan/:id/selesai", "/kegiatan/:id/selesai"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("foto"),
  kknAttendanceController.selesaiKegiatan
);

router.post(
  ["/kkn/out-of-zone-violation", "/out-of-zone-violation"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknAttendanceController.recordOutOfZoneViolation
);

router.get(
  ["/kkn/kegiatan/:id/presensi-history", "/kegiatan/:id/presensi-history"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER"]),
  kknAttendanceController.getPresensiHistory
);

// Canonical location-ping endpoint. /kkn/location-ping dipertahankan
// sebagai alias untuk backward-compat mobile client yang masih pakai prefix /kkn.
router.post(
  ["/location-ping", "/kkn/location-ping"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER"]),
  kknAttendanceController.pingLocation
);


router.get(
  "/warga-dampingan",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DPL", "DOSEN_PEMBIMBING"]),
  async (req, res) => {
    try {
      const result = await kknAttendanceServiceInstance.getWargaDampingan(
        req.user!.userId,
        req.user!.role
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * FEATURE 5: Debug endpoint for troubleshooting GPS tracking issues
 * Returns current active schedules, latest location, geofence status, and attendance records
 */
router.get(
  ["/location-ping/debug", "/kkn/location-ping/debug"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER"]),
  async (req, res) => {
    try {
      const { prisma } = await import("../lib/prisma.js");
      const userId = req.user!.userId;

      // Get latest location
      const latestLocation = await prisma.studentLocation.findFirst({
        where: { studentId: userId },
        orderBy: { recordedAt: "desc" },
        take: 1,
      });

      // Get active schedules
      const nowForDebug = new Date();
      const nowWibDebug = new Date(nowForDebug.getTime() + 7 * 60 * 60 * 1000);
      const todayWibStrDebug = nowWibDebug.toISOString().slice(0, 10);
      const todayStartDebug = new Date(`${todayWibStrDebug}T00:00:00+07:00`);
      const todayEndDebug = new Date(`${todayWibStrDebug}T23:59:59.999+07:00`);
      const yesterdayWibStrDebug = new Date(todayStartDebug.getTime() - 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000)
        .toISOString().slice(0, 10);
      const yesterdayStartDebug = new Date(`${yesterdayWibStrDebug}T00:00:00+07:00`);

      const student = await prisma.studentKkn.findUnique({
        where: { userId },
      });

      const activeSchedules = await prisma.schedule.findMany({
        where: {
          date: { gte: yesterdayStartDebug, lte: todayEndDebug },
          isActive: true,
          ...(student?.kelompokId ? { OR: [{ kelompokId: student.kelompokId }, { kelompokId: null }] } : {}),
        },
      });

      // Get current attendance status
      const activeAttendance = await prisma.activityAttendance.findFirst({
        where: {
          studentId: userId,
          status: "BERLANGSUNG",
        },
      });

      // Calculate geofence status if we have location
      let geofenceStatus = null;
      if (latestLocation && activeSchedules.length > 0) {
        const { calculateDistance } = await import("../services/kknAttendanceService.js");
        const firstSchedule = activeSchedules[0];
        const geofenceLat = firstSchedule.latitude ? Number(firstSchedule.latitude) : -6.8915;
        const geofenceLng = firstSchedule.longitude ? Number(firstSchedule.longitude) : 107.6107;
        const geofenceRadius = firstSchedule.radius ? Number(firstSchedule.radius) : 100;

        const distance = calculateDistance(Number(latestLocation.latitude), Number(latestLocation.longitude),
          geofenceLat,
          geofenceLng
        );

        geofenceStatus = {
          insideZone: distance <= geofenceRadius + 15,
          distance: Math.round(distance),
          bufferMeters: 15,
          geofenceRadius,
          geofenceLat,
          geofenceLng,
        };
      }

      res.json({
        success: true,
        data: {
          userId,
          latestLocation: latestLocation
            ? {
                lat: latestLocation.latitude,
                lng: latestLocation.longitude,
                recordedAt: latestLocation.recordedAt.toISOString(),
              }
            : null,
          activeSchedules: activeSchedules.map((s) => ({
            id: s.id,
            title: s.title,
            time: s.time,
            date: s.date.toISOString(),
            latitude: s.latitude,
            longitude: s.longitude,
            radius: s.radius,
            isActive: s.isActive,
          })),
          geofenceStatus,
          attendance: activeAttendance
            ? {
                id: activeAttendance.id,
                scheduleId: activeAttendance.scheduleId,
                status: activeAttendance.status,
                attendedAt: activeAttendance.attendedAt.toISOString(),
                checkOutAt: activeAttendance.checkOutAt?.toISOString() || null,
                inZoneMinutes: activeAttendance.actualInZoneMinutes,
              }
            : null,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "DEBUG_ENDPOINT_ERROR",
        message: error.message,
      });
    }
  }
);

export default router;
