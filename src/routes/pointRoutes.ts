import { Router } from "express";
import { pointController } from "../controllers/pointController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Points
 *   description: Point history and ledger management
 */

/**
 * @swagger
 * /api/v1/points/me:
 *   get:
 *     summary: Get point history and total points for current user
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  "/me",
  authMiddleware,
  pointController.getMyLedger
);

/**
 * @swagger
 * /api/v1/points/history/{userId}:
 *   get:
 *     summary: Get point history for a specific user (Admin only)
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  "/history/:userId",
  authMiddleware,
  roleMiddleware(["ADMIN", "PETUGAS_KELURAHAN"]),
  pointController.getUserLedger
);

/**
 * @swagger
 * /api/v1/points/leaderboard:
 *   get:
 *     summary: Get leaderboard of users based on points
 *     tags: [Points]
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  "/leaderboard",
  pointController.getLeaderboard
);

export default router;
