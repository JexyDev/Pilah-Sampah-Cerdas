import { Router } from "express";
import { householdController } from "../controllers/householdController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Households
 *   description: Household management and registration
 */
/**
 * @swagger
 * /api/v1/households/register:
 *   post:
 *     summary: Register a new household
 *     tags: [Households]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *               - rtRwId
 *               - latitude
 *               - longitude
 *             properties:
 *               address:
 *                 type: string
 *                 example: Jl. Titiran Dalam No. 10
 *               rtRwId:
 *                 type: integer
 *                 example: 1
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: -6.8912345
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: 107.6123456
 *     responses:
 *       201:
 *         description: Successfully registered
 *       400:
 *         description: Validation error
 *       409:
 *         description: Household already exists in this area
 */
// Only WARGA (or ADMIN/Staff) can register household
router.post("/register", authMiddleware, roleMiddleware(["WARGA", "ADMIN", "PETUGAS_RT", "PETUGAS_RW", "PETUGAS_KELURAHAN"]), householdController.register);
/**
 * @swagger
 * /api/v1/households/me:
 *   get:
 *     summary: Get all households for the authenticated user
 *     tags: [Households]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/me", authMiddleware, householdController.getMyHouseholds);
export default router;
