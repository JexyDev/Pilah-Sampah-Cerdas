/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { Router } from "express";
import { facilityController } from "../controllers/facilityController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { safeUploadSingleImage } from "../middlewares/uploadMiddleware.js";

const router = Router();

// Daftar fasilitas baru — MAHASISWA_KKN otomatis terisi kelompokId
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "MAHASISWA_KKN", "RW", "RT", "WARGA"]),
  safeUploadSingleImage("foto"),
  facilityController.createFacility
);

router.get("/jenis", authMiddleware, facilityController.getJenisFasilitas);
router.get("/", authMiddleware, facilityController.getFacilities);

// Input log produksi — MAHASISWA_KKN bisa input
router.post(
  "/:id/production",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "MAHASISWA_KKN", "RW", "RT"]),
  facilityController.recordProduction
);

// Verifikasi log produksi — RW/Petugas/Admin
router.put(
  "/production/:logId/verify",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "RW", "RT"]),
  facilityController.verifyProduction
);

router.post(
  "/farms",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH"]),
  facilityController.createFarm
);

router.get("/farms", authMiddleware, facilityController.getFarms);

router.post(
  "/maggot/distributions",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "RW", "RT"]),
  facilityController.distributeMaggot
);

export default router;
