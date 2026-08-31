/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { Router } from "express";
import { poskoKknController } from "../controllers/poskoKknController.js";
import { smartZoneController } from "../controllers/smartZoneController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { safeUploadSingleImage } from "../middlewares/uploadMiddleware.js";

const router = Router();

// ─── Posko Utama (Existing) ──────────────────────────────────────────────────

// Semua role authenticated bisa lihat daftar posko
router.get("/", authMiddleware, poskoKknController.getAll.bind(poskoKknController));

// Mahasiswa cek posko kelompoknya sendiri (primary)
router.get("/me", authMiddleware, roleMiddleware(["MAHASISWA_KKN"]), poskoKknController.getMyPosko.bind(poskoKknController));

// Daftar / update posko - Ketua KKN, Admin, Developer
router.post("/", authMiddleware, roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "ADMIN_DLH", "DEVELOPER"]), safeUploadSingleImage("foto"), poskoKknController.upsert.bind(poskoKknController));

// Hapus posko utama - Admin & Developer saja
router.delete("/:kelompokId", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH", "DEVELOPER"]), poskoKknController.deletePosko.bind(poskoKknController));

// ─── SMART ZONE: Endpoint Sinkronisasi Zona Lengkap (Mobile) ────────────────

/**
 * [MOBILE PRIMARY] GET /posko-kkn/me/all-zones
 * Endpoint utama mobile mahasiswa: semua posko + auto-polygon kelompok sendiri.
 * Panggil saat login dan saat menerima FCM event MULTI_POSKO_UPDATED.
 */
router.get("/me/all-zones", authMiddleware, roleMiddleware(["MAHASISWA_KKN"]), smartZoneController.getMyGroupAllZones);

/**
 * [MOBILE / ADMIN] GET /posko-kkn/kelompok/:kelompokId/all-zones
 * Endpoint zona lengkap untuk kelompok tertentu (admin, DPL, portal).
 */
router.get("/kelompok/:kelompokId/all-zones", authMiddleware, smartZoneController.getGroupAllZones);

/**
 * GET /posko-kkn/kelompok/:kelompokId/multi
 * List posko tambahan (multi) untuk kelompok tertentu.
 */
router.get("/kelompok/:kelompokId/multi", authMiddleware, smartZoneController.getMultiPoskos);

// ─── Multi-Posko CRUD ────────────────────────────────────────────────────────

/**
 * POST /posko-kkn/multi
 * Daftar posko tambahan. Ketua KKN bisa tambah posko untuk kelompoknya.
 */
router.post("/multi", authMiddleware, roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "ADMIN_DLH", "DEVELOPER"]), smartZoneController.addMultiPosko);

/**
 * PUT /posko-kkn/multi/:poskoId
 * Update posko tambahan.
 */
router.put("/multi/:poskoId", authMiddleware, roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "ADMIN_DLH", "DEVELOPER"]), smartZoneController.updateMultiPosko);

/**
 * DELETE /posko-kkn/multi/:poskoId
 * Hapus posko tambahan.
 */
router.delete("/multi/:poskoId", authMiddleware, roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "ADMIN_DLH", "DEVELOPER"]), smartZoneController.deleteMultiPosko);

// ─── Smart Zone Admin Endpoints ──────────────────────────────────────────────

/**
 * GET /posko-kkn/smart-zone/:kelompokId/preview
 * Preview auto-polygon untuk portal peta admin.
 */
router.get("/smart-zone/:kelompokId/preview", authMiddleware, smartZoneController.getZonePreview);

/**
 * POST /posko-kkn/smart-zone/:kelompokId/regenerate
 * Force regenerate polygon (admin/developer action).
 */
router.post("/smart-zone/:kelompokId/regenerate", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH", "DEVELOPER"]), smartZoneController.forceRegeneratePolygon);

/**
 * POST /posko-kkn/smart-zone/check-position
 * Debug endpoint: cek apakah posisi masuk zona kelompok.
 */
router.post("/smart-zone/check-position", authMiddleware, smartZoneController.checkPosition);

export default router;
