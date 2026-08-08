/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Executive & Monitoring (Camat, Lurah, Admin DLH)
 *     description: API Web Monitoring untuk Camat (Kecamatan), Lurah (Kelurahan), dan Admin DLH (Kota)
 *   - name: Dashboard
 *     description: Dashboard metrics and statistics
 */

/**
 * @swagger
 * /api/v1/dashboard/kpi:
 *   get:
 *     summary: Mendapatkan Statistik KPI Wilayah (Camat, Lurah, Admin DLH, RW)
 *     tags: [Executive & Monitoring (Camat, Lurah, Admin DLH), Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: wilayah
 *         schema:
 *           type: string
 *         description: Filter nama wilayah (contoh Dago, Sadang Serang, atau Kecamatan Coblong)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [harian, mingguan, bulanan, tahunan]
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  "/kpi",
  authMiddleware,
  roleMiddleware([
    "SUPER_USER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "RT",
    "PETUGAS_RESIDU",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "DPL",
    "MAHASISWA_KKN",
  ]),
  dashboardController.getKpi
);

/**
 * @swagger
 * /api/v1/dashboard/transactions:
 *   get:
 *     summary: Mendapatkan Transaksi Timbulan Sampah Real-time (Camat, Lurah, Admin DLH)
 *     tags: [Executive & Monitoring (Camat, Lurah, Admin DLH), Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  "/transactions",
  authMiddleware,
  roleMiddleware([
    "SUPER_USER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "RT",
    "PETUGAS_RESIDU",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "DPL",
  ]),
  dashboardController.getTransactions
);

/**
 * @swagger
 * /api/v1/dashboard/summary:
 *   get:
 *     summary: Ringkasan Personal Dashboard User Login
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/summary", authMiddleware, dashboardController.getSummary);

/**
 * @swagger
 * /api/v1/dashboard/analytics:
 *   get:
 *     summary: Data Analitik Komposisi & Akurasi Pemilahan Sampah (Camat, Lurah, DLH)
 *     tags: [Executive & Monitoring (Camat, Lurah, Admin DLH), Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  "/analytics",
  authMiddleware,
  roleMiddleware([
    "SUPER_USER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "RT",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "DPL",
  ]),
  dashboardController.getAnalytics
);

/**
 * @swagger
 * /api/v1/dashboard/export-dataset:
 *   get:
 *     summary: Ekspor Dataset Laporan Sampah CSV/Excel (Camat, Lurah, Admin DLH)
 *     tags: [Executive & Monitoring (Camat, Lurah, Admin DLH)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV/Excel dataset file download
 */
router.get(
  "/export-dataset",
  authMiddleware,
  roleMiddleware([
    "SUPER_USER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "RT",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "DPL",
  ]),
  dashboardController.exportDataset
);

/**
 * @swagger
 * /api/v1/dashboard/regions:
 *   get:
 *     summary: Mendapatkan Daftar Region / Kelurahan Wilayah Monitoring
 *     tags: [Executive & Monitoring (Camat, Lurah, Admin DLH)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/regions", authMiddleware, dashboardController.getRegions);

/**
 * @swagger
 * /api/v1/dashboard/trend:
 *   get:
 *     summary: Mendapatkan Grafik Tren Timbulan Sampah Berkelanjutan
 *     tags: [Executive & Monitoring (Camat, Lurah, Admin DLH)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/trend", authMiddleware, dashboardController.getTrend);

export default router;
