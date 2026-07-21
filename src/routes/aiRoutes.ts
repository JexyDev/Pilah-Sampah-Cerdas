/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { aiController } from "../controllers/aiController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { uploadAvatarMiddleware } from "../middlewares/uploadMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI Waste Detection
 */

/**
 * @swagger
 * /api/v1/waste/detect-mock:
 *   post:
 *     summary: Simulasi Deteksi Gambar Sampah AI
 *     description: Mengirim gambar sampah untuk dideteksi kategorinya secara otomatis menggunakan antrian Redis FIFO dengan limitasi kuota harian.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL gambar sampah yang diunggah
 *                 example: "http://mock-storage/waste.jpg"
 *     responses:
 *       200:
 *         description: Deteksi berhasil
 *       400:
 *         description: Bad Request (Missing parameter)
 *       422:
 *         description: Gambar buram atau jenis sampah tidak teridentifikasi
 *       429:
 *         description: Quota Exceeded (Batas harian terlampaui)
 *       408:
 *         description: AI Timeout (Proses deteksi melebihi 2 detik)
 */
router.post(
  "/detect-mock",
  authMiddleware,
  roleMiddleware(["WARGA"]), // REKAP-01 FIX: Only WARGA can submit waste for detection
  aiController.detect
);

router.post(
  "/upload",
  authMiddleware,
  roleMiddleware(["WARGA"]),
  uploadAvatarMiddleware.single("image"),
  aiController.uploadWastePhoto
);

/**
 * @swagger
 * /api/v1/waste/detect:
 *   post:
 *     summary: Upload dan Deteksi Sampah AI (Untuk Mobile App)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deteksi berhasil
 */
router.post(
  "/detect",
  authMiddleware,
  roleMiddleware(["WARGA"]),
  uploadAvatarMiddleware.single("image"),
  aiController.detectCombined
);

router.post(
  "/logs/:id/report",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "PETUGAS_RESIDU"]),
  aiController.submitReport
);

router.put(
  "/logs/:id/resolve",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH"]),
  aiController.resolveDiscrepancy
);

router.get(
  "/compliance/:userId",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW"]),
  aiController.getComplianceScore
);

router.get("/emissions", authMiddleware, aiController.getCo2eStats);

router.post(
  "/estimate-volume",
  authMiddleware,
  uploadAvatarMiddleware.single("image"),
  aiController.estimateVolume
);

export default router;
