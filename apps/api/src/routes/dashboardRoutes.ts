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
 *   name: Dashboard
 *   description: Dashboard metrics and statistics
 */

/**
 * @swagger
 * /api/v1/dashboard/kpi:
 *   get:
 *     summary: Get dashboard KPI statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  "/kpi",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "PETUGAS_RESIDU"]),
  dashboardController.getKpi
);

/**
 * @swagger
 * /api/v1/dashboard/transactions:
 *   get:
 *     summary: Get recent transactions for the dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  "/transactions",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "PETUGAS_RESIDU"]),
  dashboardController.getTransactions
);

/**
 * @swagger
 * /api/v1/dashboard/summary:
 *   get:
 *     summary: Get user-specific dashboard summary
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
 *     summary: Get technical analytics data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  "/analytics",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "CAMAT"]),
  dashboardController.getAnalytics
);
router.get(
  "/export-dataset",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "CAMAT"]),
  dashboardController.exportDataset
);
router.get("/regions", authMiddleware, dashboardController.getRegions);
router.get("/trend", authMiddleware, dashboardController.getTrend);

export default router;
