/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { kknAttendanceController } from "../controllers/kknAttendanceController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// In-memory rate limiting for GPS updates (1 request per 15s per student)
const lastRequestMap = new Map<string, number>();
const gpsRateLimiter = (req: any, res: any, next: any) => {
  const userId = req.user?.userId;
  if (!userId) {
    return next();
  }
  const now = Date.now();
  const lastRequest = lastRequestMap.get(userId) || 0;
  if (now - lastRequest < 15000) {
    // 15 seconds
    res.status(429).json({
      success: false,
      error: "TOO_MANY_REQUESTS",
      message: "Update lokasi terlalu cepat. Harap tunggu 15 detik.",
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

router.get(
  "/kegiatan/:id/lokasi",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "MAHASISWA_KKN"]),
  kknAttendanceController.getActivityLocation
);

router.post(
  "/kegiatan/:id/absen",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknAttendanceController.recordAttendance
);

// Monitoring routes
router.get(
  "/mahasiswa/lokasi-aktif",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW"]),
  kknAttendanceController.getActiveStudentsLocations
);

router.get(
  "/kegiatan/:id/absen",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW"]),
  kknAttendanceController.getAttendanceList
);


import { KknAttendanceService } from "../services/kknAttendanceService.js";
const kknAttendanceServiceInstance = new KknAttendanceService();

router.post('/location-ping', authMiddleware, roleMiddleware(['MAHASISWA_KKN']), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const result = await kknAttendanceServiceInstance.pingLocation(req.user!.userId, latitude, longitude);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/warga-dampingan', authMiddleware, roleMiddleware(['MAHASISWA_KKN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const result = await kknAttendanceServiceInstance.getWargaDampingan(req.user!.userId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
export default router;
