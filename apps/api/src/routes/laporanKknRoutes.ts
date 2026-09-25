/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Laporan Resmi KKN UNIKOM - Routes
 * Dikhususkan untuk role PIMPINAN, SUPER_USER, dan DEVELOPER
 */

import { Router } from "express";
import { laporanKknController } from "../controllers/laporanKknController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

const ALLOWED_ROLES = ["PIMPINAN", "PEMIMPIN", "SUPER_USER", "DEVELOPER"];

/**
 * @swagger
 * /api/v1/laporan/kkn/summary:
 *   get:
 *     summary: Mendapatkan data agregat lengkap Laporan Resmi KKN Eksekutif
 *     tags: [Laporan Resmi KKN Pimpinan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: kelurahan
 *         schema:
 *           type: string
 *         description: Filter Kelurahan
 *       - in: query
 *         name: rw
 *         schema:
 *           type: string
 *         description: Filter RW
 *       - in: query
 *         name: kelompok
 *         schema:
 *           type: string
 *         description: Filter Kelompok
 *       - in: query
 *         name: periode
 *         schema:
 *           type: string
 *         description: Filter Periode
 *     responses:
 *       200:
 *         description: Data laporan resmi KKN berhasil dimuat
 */
router.get("/summary", authMiddleware, roleMiddleware(ALLOWED_ROLES), laporanKknController.getLaporanSummary);

/**
 * @swagger
 * /api/v1/laporan/kkn/export:
 *   get:
 *     summary: Mengunduh Laporan Resmi KKN dalam format Spreadsheet Excel (.xlsx) Multi-Sheet
 *     tags: [Laporan Resmi KKN Pimpinan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File spreadsheet Excel (.xlsx)
 */
router.get("/export", authMiddleware, roleMiddleware(ALLOWED_ROLES), laporanKknController.exportLaporanExcel);

/**
 * @swagger
 * /api/v1/laporan/kkn/export-csv:
 *   get:
 *     summary: Mengunduh Matriks Kinerja Kelompok KKN dalam format CSV mentah
 *     tags: [Laporan Resmi KKN Pimpinan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File teks CSV
 */
router.get("/export-csv", authMiddleware, roleMiddleware(ALLOWED_ROLES), laporanKknController.exportLaporanCsv);

export default router;
