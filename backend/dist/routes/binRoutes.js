import { Router } from "express";
import { binController } from "../controllers/binController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Bins
 *   description: Bin interactions and transactions
 */
/**
 * @swagger
 * /api/v1/bins:
 *   get:
 *     summary: Get all bins
 *     tags: [Bins]
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/", binController.getAllBins);
/**
 * @swagger
 * /api/v1/bins/scan:
 *   post:
 *     summary: Scan a QR code on a Bin to deposit waste
 *     tags: [Bins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrCode
 *               - detectedType
 *               - estimatedVolume
 *               - householdId
 *             properties:
 *               qrCode:
 *                 type: string
 *               detectedType:
 *                 type: string
 *                 example: ORGANIC
 *               estimatedVolume:
 *                 type: number
 *                 example: 3.5
 *               householdId:
 *                 type: string
 *                 format: uuid
 *               userLat:
 *                 type: number
 *                 format: float
 *               userLng:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Transaction processed
 *       400:
 *         description: Validation error, overflow, or location out of range
 *       404:
 *         description: Bin not found
 */
router.post("/scan", authMiddleware, roleMiddleware(["WARGA"]), binController.scan);
/**
 * @swagger
 * /api/v1/bins/{id}/status:
 *   get:
 *     summary: Get status of a bin
 *     tags: [Bins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/:id/status", binController.getStatus);
/**
 * @swagger
 * /api/v1/bins/{id}/empty:
 *   post:
 *     summary: Empty bin capacity
 *     tags: [Bins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post("/:id/empty", authMiddleware, roleMiddleware(["ADMIN", "PETUGAS_RT", "PETUGAS_RW", "PETUGAS_KELURAHAN"]), binController.emptyBin);
export default router;
