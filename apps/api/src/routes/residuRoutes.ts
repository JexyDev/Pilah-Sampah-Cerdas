/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { residuController } from "../controllers/residuController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

import { PrismaClient } from "@prisma/client";

import { uploadResiduImage } from "../middlewares/uploadMiddleware.js";

const router = Router();
const prisma = new PrismaClient();

const verifiedPetugasGuard = async (req: any, res: any, next: any) => {
  if (req.user?.role === "PETUGAS_RESIDU") {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { petugasProfile: true },
    });

    if (!user) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "Akun Petugas Residu tidak ditemukan.",
      });
    }

    const isApproved =
      user.status === "Aktif" ||
      user.status === "ACTIVE" ||
      user.petugasProfile?.whitelistStatus === "APPROVED";

    if (!isApproved) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "Akun Petugas Residu Anda belum diverifikasi oleh RW.",
      });
    }
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: Petugas Residu
 *   description: API Khusus Petugas Residu (Input Timbangan Manual & Web Monitoring Hilir)
 */

/**
 * @swagger
 * /api/v1/petugas-residu/pending-logs:
 *   get:
 *     summary: Mendapatkan antrian tempat sampah yang perlu ditimbang/diangkut
 *     tags: [Petugas Residu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan pending logs
 */
router.get(
  "/pending-logs",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  verifiedPetugasGuard,
  residuController.getPendingLogs
);

/**
 * @swagger
 * /api/v1/petugas-residu/jadwal-harian:
 *   get:
 *     summary: Mendapatkan jadwal penjemputan harian petugas residu
 *     tags: [Petugas Residu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan jadwal
 */
router.get(
  "/jadwal-harian",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  verifiedPetugasGuard,
  residuController.getJadwalHarian
);

/**
 * @swagger
 * /api/v1/petugas-residu/violation:
 *   post:
 *     summary: Melaporkan pelanggaran pemilahan sampah warga oleh petugas
 *     tags: [Petugas Residu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pelanggaran berhasil dilaporkan
 */
router.post(
  "/violation",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  verifiedPetugasGuard,
  uploadResiduImage,
  residuController.recordViolation
);

/**
 * @swagger
 * /api/v1/petugas-residu/submit-log:
 *   post:
 *     summary: Input manual hasil penimbangan residu industri/fisik
 *     tags: [Petugas Residu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Log timbulan residu berhasil disimpan
 */
router.post(
  "/submit-log",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  verifiedPetugasGuard,
  uploadResiduImage,
  residuController.submitLog
);

/**
 * @swagger
 * /api/v1/petugas-residu/dashboard:
 *   get:
 *     summary: Dashboard monitoring timbulan residu & penjemputan
 *     tags: [Petugas Residu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan dashboard summary
 */
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  verifiedPetugasGuard,
  residuController.getDashboardSummary
);

/**
 * @swagger
 * /api/v1/petugas-residu/analytics:
 *   get:
 *     summary: Analitik timbulan residu per wilayah
 *     tags: [Petugas Residu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan analytics
 */
router.get(
  "/analytics",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  verifiedPetugasGuard,
  residuController.getAnalytics
);

/**
 * @swagger
 * /api/v1/petugas-residu/riwayat:
 *   get:
 *     summary: Riwayat penimbangan & setoran residu
 *     tags: [Petugas Residu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan riwayat
 */
router.get(
  "/riwayat",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  verifiedPetugasGuard,
  residuController.getRiwayat
);

export default router;
