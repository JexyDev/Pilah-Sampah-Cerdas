/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
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
  roleMiddleware(["ADMIN", "PETUGAS_KELURAHAN", "PETUGAS_RW", "PETUGAS_RT"]),
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
  roleMiddleware(["ADMIN", "PETUGAS_KELURAHAN", "PETUGAS_RW", "PETUGAS_RT"]),
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
  roleMiddleware(["ADMIN"]),
  dashboardController.getAnalytics
);
router.get("/regions", authMiddleware, dashboardController.getRegions);
router.get("/trend", authMiddleware, dashboardController.getTrend);

export default router;
