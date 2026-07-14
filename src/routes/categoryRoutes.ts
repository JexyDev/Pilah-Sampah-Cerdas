import { Router } from "express";
import { categoryController } from "../controllers/categoryController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Waste Categories API
 */

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Get all waste categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/", authMiddleware, categoryController.getAllCategories);

export default router;
