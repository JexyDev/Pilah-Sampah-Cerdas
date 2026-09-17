/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { kknExecutiveService } from "../services/kknExecutiveService.js";

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
router.get("/kpi", authMiddleware, dashboardController.getKpi);

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
router.get("/transactions", authMiddleware, dashboardController.getTransactions);

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
router.get("/analytics", authMiddleware, dashboardController.getAnalytics);

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
router.get("/export-dataset", authMiddleware, dashboardController.exportDataset);

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

/**
 * @swagger
 * /api/v1/dashboard/kkn-executive:
 *   get:
 *     summary: Mendapatkan Data Ringkasan Dashboard Eksekutif KKN untuk Role Pimpinan
 *     tags: [Executive & Monitoring (Camat, Lurah, Admin DLH), Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: kelurahan
 *         schema:
 *           type: string
 *         description: Filter nama kelurahan
 *       - in: query
 *         name: rw
 *         schema:
 *           type: string
 *         description: Filter RW
 *       - in: query
 *         name: periode
 *         schema:
 *           type: string
 *         description: Filter periode KKN
 *     responses:
 *       200:
 *         description: Data dashboard eksekutif KKN berhasil dimuat
 */
router.get(
  "/kkn-executive",
  authMiddleware,
  roleMiddleware([
    "PIMPINAN",
    "PEMIMPIN",
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "PANITIA_TASKFORCE",
    "DPL",
    "DOSEN_PEMBIMBING",
  ]),
  dashboardController.getKknExecutiveDashboard
);

/**
 * @swagger
 * /api/v1/dashboard/kkn-executive/export:
 *   get:
 *     summary: Mengunduh Laporan Spreadsheet Excel Dashboard Eksekutif KKN
 *     tags: [Executive & Monitoring (Camat, Lurah, Admin DLH), Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unduhan file spreadsheet Excel (.xlsx)
 */
router.get(
  "/kkn-executive/export",
  authMiddleware,
  roleMiddleware([
    "PIMPINAN",
    "PEMIMPIN",
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "PANITIA_TASKFORCE",
  ]),
  dashboardController.exportKknExecutiveReport
);

/**
 * GIS: Fasilitas Tata Kelola Sampah untuk peta
 * Mengembalikan semua fasilitas (bukan posko_kkn) dengan koordinat dan info kelurahan/RW
 */
router.get(
  "/kkn-executive/gis/facilities",
  authMiddleware,
  roleMiddleware(["PIMPINAN", "PEMIMPIN", "SUPER_USER", "DEVELOPER", "ADMIN_DLH", "DLH", "PANITIA_TASKFORCE"]),
  async (req, res) => {
    try {
      const { kelurahan, rw } = req.query as { kelurahan?: string; rw?: string };
      const data = await kknExecutiveService.getWasteFacilitiesGis({ kelurahan, rw });
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }
);

/**
 * GIS: Overlay Kepatuhan per Kelurahan
 * Menghitung persentase Bin aktif sebagai indikator kepatuhan per kelurahan
 */
router.get(
  "/kkn-executive/gis/compliance-overlay",
  authMiddleware,
  roleMiddleware(["PIMPINAN", "PEMIMPIN", "SUPER_USER", "DEVELOPER", "ADMIN_DLH", "DLH", "PANITIA_TASKFORCE"]),
  async (req, res) => {
    try {
      const { kelurahan, rw } = req.query as { kelurahan?: string; rw?: string };
      const data = await kknExecutiveService.getComplianceOverlay({ kelurahan, rw });
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }
);

/**
 * Tempat Sampah Teraktivasi
 * Mengembalikan daftar Bin dengan status ASSIGNED_TO_PIC atau ACTIVE_BOUND
 */
router.get(
  "/kkn-executive/waste/bins-activated",
  authMiddleware,
  roleMiddleware(["PIMPINAN", "PEMIMPIN", "SUPER_USER", "DEVELOPER", "ADMIN_DLH", "DLH", "PANITIA_TASKFORCE"]),
  async (req, res) => {
    try {
      const { kelurahan, rw } = req.query as { kelurahan?: string; rw?: string };
      const data = await kknExecutiveService.getActivatedBinsBreakdown({ kelurahan, rw });
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }
);

export default router;
