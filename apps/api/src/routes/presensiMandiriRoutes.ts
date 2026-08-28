/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { Router } from "express";
import { presensiMandiriController } from "../controllers/presensiMandiriController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { safeUploadSingleImage } from "../middlewares/uploadMiddleware.js";

const router = Router();

const ADMIN_DPL_ROLES = ["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "DPL", "DOSEN_PEMBIMBING", "PANITIA_TASKFORCE", "PEMIMPIN"];

/**
 * @swagger
 * /api/v1/presensi/mandiri:
 *   post:
 *     summary: Check-in presensi mandiri (tanpa jadwal aktif)
 *     description: Mahasiswa melakukan presensi mandiri dengan foto bukti kegiatan (wajib) dan deskripsi kegiatan (max 500 karakter, wajib). Tidak memerlukan jadwal aktif.
 *     tags: [Presensi Mandiri]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [foto, deskripsiKegiatan, latitude, longitude]
 *             properties:
 *               foto:
 *                 type: string
 *                 format: binary
 *                 description: Foto bukti kegiatan (JPG/PNG/WEBP, maks 10MB)
 *               deskripsiKegiatan:
 *                 type: string
 *                 maxLength: 500
 *                 description: Deskripsi kegiatan yang dilakukan (wajib, max 500 karakter)
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Presensi mandiri berhasil dicatat
 *       400:
 *         description: Foto tidak diunggah / koordinat tidak valid / deskripsi kosong atau terlalu panjang
 *       409:
 *         description: Sudah ada presensi mandiri aktif hari ini
 */
router.post(
  "/mandiri",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("foto"),
  presensiMandiriController.checkIn
);

/**
 * @swagger
 * /api/v1/presensi/mandiri/{id}/checkout:
 *   patch:
 *     summary: Check-out presensi mandiri
 *     tags: [Presensi Mandiri]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deskripsiKegiatan:
 *                 type: string
 *                 maxLength: 500
 *                 description: Update deskripsi final saat checkout (opsional)
 *     responses:
 *       200:
 *         description: Check-out berhasil
 *       404:
 *         description: Data presensi tidak ditemukan
 *       409:
 *         description: Sudah check-out sebelumnya
 */
router.patch(
  "/mandiri/:id/checkout",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  presensiMandiriController.checkOut
);

/**
 * @swagger
 * /api/v1/presensi/mandiri/{id}/deskripsi:
 *   patch:
 *     summary: Update deskripsi kegiatan presensi mandiri
 *     tags: [Presensi Mandiri]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/mandiri/:id/deskripsi",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  presensiMandiriController.updateDeskripsi
);

/**
 * @swagger
 * /api/v1/presensi/mandiri/saya:
 *   get:
 *     summary: Riwayat presensi mandiri mahasiswa sendiri
 *     tags: [Presensi Mandiri]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Daftar riwayat presensi mandiri
 */
router.get(
  "/mandiri/saya",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  presensiMandiriController.getRiwayatSaya
);

/**
 * @swagger
 * /api/v1/presensi/live-map:
 *   get:
 *     summary: Live map seluruh mahasiswa aktif (semua kelompok)
 *     description: Mengembalikan semua mahasiswa yang sedang aktif presensi (mandiri maupun jadwal resmi), beserta lokasi GPS terakhir dan deskripsi kegiatan. Digunakan untuk peta monitoring web.
 *     tags: [Monitoring KKN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: kelompokId
 *         schema:
 *           type: string
 *         description: Filter by kelompok (opsional)
 *     responses:
 *       200:
 *         description: Data live map seluruh mahasiswa aktif
 */
router.get(
  "/live-map",
  authMiddleware,
  roleMiddleware(ADMIN_DPL_ROLES),
  presensiMandiriController.getLiveMap
);

/**
 * @swagger
 * /api/v1/presensi/mandiri:
 *   get:
 *     summary: List semua presensi mandiri (admin/DPL)
 *     tags: [Monitoring KKN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: kelompokId
 *         schema:
 *           type: string
 *       - in: query
 *         name: tanggalMulai
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: tanggalAkhir
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AKTIF, SELESAI]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List presensi mandiri
 */
router.get(
  "/mandiri",
  authMiddleware,
  roleMiddleware(ADMIN_DPL_ROLES),
  presensiMandiriController.getAll
);

export default router;
