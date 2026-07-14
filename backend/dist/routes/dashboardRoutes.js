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
router.get("/kpi", authMiddleware, roleMiddleware(["ADMIN", "PETUGAS_KELURAHAN", "PETUGAS_RW", "PETUGAS_RT"]), dashboardController.getKpi);
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
router.get("/transactions", authMiddleware, roleMiddleware(["ADMIN", "PETUGAS_KELURAHAN", "PETUGAS_RW", "PETUGAS_RT"]), dashboardController.getTransactions);
export default router;
