/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

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
router.get("/me", authMiddleware, pointController.getMyLedger);

router.post("/convert", authMiddleware, pointController.convertPoints);

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
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "LURAH"]),
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
router.post(
  "/adjust",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "RW"]),
  pointController.adjustPoints
);

router.get("/leaderboard", pointController.getLeaderboard);

// ─────────────────────────────────────────────
// DEVELOPER ONLY: CRUD & MANAGEMENT POIN PENGGUNA
// ─────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/points/admin/users:
 *   get:
 *     summary: [DEVELOPER ONLY] Get all users with points ledger, search, filter, and server pagination
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/admin/users",
  authMiddleware,
  roleMiddleware(["DEVELOPER"]),
  pointController.getAdminUsersPoints
);

/**
 * @swagger
 * /api/v1/points/admin/stats:
 *   get:
 *     summary: [DEVELOPER ONLY] Get system-wide points summary statistics
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/admin/stats",
  authMiddleware,
  roleMiddleware(["DEVELOPER"]),
  pointController.getAdminPointsStats
);

/**
 * @swagger
 * /api/v1/points/admin/ledger:
 *   get:
 *     summary: [DEVELOPER ONLY] Get global ledger transactions feed with pagination
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/admin/ledger",
  authMiddleware,
  roleMiddleware(["DEVELOPER"]),
  pointController.getAdminLedgerFeed
);

/**
 * @swagger
 * /api/v1/points/admin/user/{userId}:
 *   get:
 *     summary: [DEVELOPER ONLY] Get single user ledger details
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/admin/user/:userId",
  authMiddleware,
  roleMiddleware(["DEVELOPER"]),
  pointController.getAdminUserLedger
);

/**
 * @swagger
 * /api/v1/points/admin/adjust:
 *   post:
 *     summary: [DEVELOPER ONLY] Adjust (+/-) points for single user
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/admin/adjust",
  authMiddleware,
  roleMiddleware(["DEVELOPER"]),
  pointController.adjustPointsDeveloper
);

/**
 * @swagger
 * /api/v1/points/admin/set-balance:
 *   post:
 *     summary: [DEVELOPER ONLY] Set exact balance for a user with auto-calculated delta
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/admin/set-balance",
  authMiddleware,
  roleMiddleware(["DEVELOPER"]),
  pointController.setBalanceDeveloper
);

/**
 * @swagger
 * /api/v1/points/admin/bulk-adjust:
 *   post:
 *     summary: [DEVELOPER ONLY] Bulk adjust points for multiple users
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/admin/bulk-adjust",
  authMiddleware,
  roleMiddleware(["DEVELOPER"]),
  pointController.bulkAdjustPointsDeveloper
);

/**
 * @swagger
 * /api/v1/points/admin/transaction/{id}:
 *   put:
 *     summary: [DEVELOPER ONLY] Edit point transaction description or category
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/admin/transaction/:id",
  authMiddleware,
  roleMiddleware(["DEVELOPER"]),
  pointController.updateTransactionDeveloper
);

/**
 * @swagger
 * /api/v1/points/admin/transaction/{id}:
 *   delete:
 *     summary: [DEVELOPER ONLY] Void / Reversal a transaction
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/admin/transaction/:id",
  authMiddleware,
  roleMiddleware(["DEVELOPER"]),
  pointController.voidTransactionDeveloper
);

export default router;

