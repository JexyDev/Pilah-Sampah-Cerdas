/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { loginRateLimiter } from "../middlewares/rateLimiter.js";
import { uploadAvatarMiddleware } from "../middlewares/uploadMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication API (Login, Refresh, Logout)
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@pilahsampah.id
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized (Invalid credentials)
 */
router.post("/login", loginRateLimiter, authController.login);
router.post("/request-otp", loginRateLimiter, authController.requestOtp);
router.post("/verify-otp", loginRateLimiter, authController.verifyOtp);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh Access Token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", authController.refresh);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token to invalidate
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current authenticated user basic info
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Valid token
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authMiddleware, authController.getCurrentUser);

/**
 * @swagger
 * /api/v1/auth/upload-avatar:
 *   post:
 *     summary: Upload profile photo
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upload successful
 */
router.post(
  "/upload-avatar",
  authMiddleware,
  uploadAvatarMiddleware.single("avatar"),
  authController.uploadAvatar
);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   put:
 *     summary: Update current authenticated user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already in use
 */
router.put("/profile", authMiddleware, authController.updateProfile);

/**
 * @swagger
 * /api/v1/auth/password:
 *   put:
 *     summary: Update current authenticated user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized / Invalid current password
 *       404:
 *         description: User not found
 */
router.put("/password", authMiddleware, authController.updatePassword);

router.post(
  "/register/admin-dlh",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN"]),
  authController.registerAdminDlh
);

router.post(
  "/register/camat",
  authMiddleware,
  roleMiddleware(["ADMIN_DLH"]),
  authController.registerCamat
);

router.post(
  "/register/lurah",
  authMiddleware,
  roleMiddleware(["ADMIN_DLH"]),
  authController.registerLurah
);

router.post(
  "/register/rw",
  authMiddleware,
  roleMiddleware(["ADMIN_DLH"]),
  authController.registerRw
);

router.post(
  "/register/rt",
  authMiddleware,
  roleMiddleware(["RW", "ADMIN_DLH"]),
  authController.registerRt
);

router.post(
  "/register/dpl",
  authMiddleware,
  roleMiddleware(["ADMIN_DLH"]),
  authController.registerDpl
);

router.post("/register/petugas-residu", authController.registerPetugasResidu);

router.post("/register/warga", authController.registerWarga);

router.post("/register/mahasiswa-kkn", authController.registerKkn);

router.get(
  "/kkn/pending",
  authMiddleware,
  roleMiddleware(["ADMIN_DLH"]),
  authController.getKknPending
);

router.patch(
  "/kkn/whitelist/:id",
  authMiddleware,
  roleMiddleware(["ADMIN_DLH"]),
  authController.approveKkn
);

export default router;
