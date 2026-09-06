/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { userController } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { taskforceRoleGuard } from "../middlewares/taskforceRoleGuard.js";
import { authController } from "../controllers/authController.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (Admin only)
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware([
    "DEVELOPER",
    "SUPER_USER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "RT",
    "PETUGAS_RESIDU",
    "PENGANGKUT",
    "MAHASISWA_KKN",
    "WARGA",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "DPL",
  ]),
  userController.getAll
);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       SUPER_USER & PEMIMPIN bisa buat semua role.
 *       PANITIA_TASKFORCE hanya bisa buat DPL dan MAHASISWA_KKN.
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE"]),
  taskforceRoleGuard,
  userController.createUser
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE"]),
  userController.deleteUser
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE"]),
  taskforceRoleGuard,
  userController.updateUser
);

/**
 * @swagger
 * /api/v1/users/{id}/onboarding-status:
 *   get:
 *     summary: Get user onboarding status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put("/profile", authMiddleware, authController.updateProfile);
router.get("/:id/onboarding-status", authMiddleware, userController.getOnboardingStatus);

export default router;
