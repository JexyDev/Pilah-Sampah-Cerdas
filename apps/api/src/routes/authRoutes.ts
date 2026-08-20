/**
 * Project: BERSEKA
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
 *     summary: Login user menggunakan nomor telepon atau NIM dan password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 description: "Nomor HP (08xxx / +628xxx) atau NIM (8-12 digit angka murni)"
 *                 example: "10124095"
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login berhasil
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
 *         description: Validasi gagal
 *       401:
 *         description: Nomor HP / NIM atau password salah
 */
router.post("/login", loginRateLimiter, authController.login);

/**
 * @swagger
 * /api/v1/auth/request-otp:
 *   post:
 *     summary: Mengirimkan kode OTP via WhatsApp Fonnte ke nomor ponsel warga
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "08123456789"
 *     responses:
 *       200:
 *         description: Kode OTP berhasil dikirimkan via WhatsApp
 */
router.post("/request-otp", authController.requestOtp);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Memvalidasi kecocokan kode OTP WhatsApp
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "08123456789"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Verifikasi OTP berhasil
 */
router.post("/verify-otp", authController.verifyOtp);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Menyimpan password baru pasca-lupa password / reset OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - newPassword
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "08123456789"
 *               newPassword:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password berhasil diperbarui
 */
router.post("/reset-password", authController.resetPassword);

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
router.put("/me", authMiddleware, authController.updateCurrentUserProfile);
router.patch("/me", authMiddleware, authController.updateCurrentUserProfile);

/**
 * @swagger
 * /api/v1/auth/upload-avatar:
 *   post:
 *     summary: Upload profile photo
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
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

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Ubah kata sandi pengguna terotentikasi (Mobile Spec)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kata sandi berhasil diperbarui
 *       400:
 *         description: Kata sandi lama salah atau baru tidak valid
 */
router.post("/change-password", authMiddleware, authController.changePassword);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Kirim OTP lupa kata sandi via WhatsApp (Alias untuk Mobile Spec)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "08123456789"
 *     responses:
 *       200:
 *         description: OTP berhasil dikirim
 */
router.post("/forgot-password", authController.requestOtp);

router.post(
  "/register/admin-dlh",
  authMiddleware,
  roleMiddleware(["SUPER_USER"]),
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

/**
 * @swagger
 * /api/v1/auth/register/petugas-residu:
 *   post:
 *     summary: Pendaftaran akun baru Petugas Residu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, password, nip]
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               nip:
 *                 type: string
 *     responses:
 *       201:
 *         description: Akun Petugas Residu berhasil dibuat
 */
router.post("/register/petugas-residu", authController.registerPetugasResidu);

/**
 * @swagger
 * /api/v1/auth/register/warga:
 *   post:
 *     summary: Pendaftaran akun Warga baru (No HP +62 + Password)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, password, address, kelurahan, rtRw]
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               address:
 *                 type: string
 *               kelurahan:
 *                 type: string
 *               rtRw:
 *                 type: string
 *     responses:
 *       201:
 *         description: Akun Warga berhasil dibuat
 */
router.post("/register/warga", authController.registerWarga);
router.post("/register", authController.registerWarga);

/**
 * @swagger
 * /api/v1/auth/register/mahasiswa-kkn:
 *   post:
 *     summary: Pendaftaran akun Mahasiswa KKN baru
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, password, nim, universitas, kelurahan, rtRw]
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               nim:
 *                 type: string
 *               universitas:
 *                 type: string
 *               kelurahan:
 *                 type: string
 *               rtRw:
 *                 type: string
 *     responses:
 *       201:
 *         description: Akun Mahasiswa KKN berhasil terdaftar (status pending whitelist/approval)
 */
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

// Online users (real-time via RefreshToken) — SUPER_USER only
router.get(
  "/online-users",
  authMiddleware,
  roleMiddleware(["SUPER_USER"]),
  authController.getOnlineUsers
);
router.delete(
  "/online-users/:userId",
  authMiddleware,
  roleMiddleware(["SUPER_USER"]),
  authController.forceLogoutUser
);

export default router;
