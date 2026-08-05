/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
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
router.post("/register", authMiddleware, roleMiddleware(["WARGA", "SUPER_ADMIN", "ADMIN_DLH", "PETUGAS_RESIDU", "RW", "LURAH"]), householdController.register);
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
router.get("/me/bins/summary", authMiddleware, householdController.getBinsSummary);
router.get("/bins/summary", authMiddleware, householdController.getBinsSummary);
router.get("/", authMiddleware, roleMiddleware([
    "SUPER_ADMIN",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "RT",
    "PETUGAS_RESIDU",
    "PENGANGKUT",
    "MAHASISWA_KKN",
    "WARGA",
]), householdController.getAllHouseholds);
export default router;
