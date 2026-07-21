/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { kknController } from "../controllers/kknController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// Only MAHASISWA_KKN allowed
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.getDashboardStats
);
router.post(
  "/register-warga",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.registerWarga
);
router.get(
  "/warga",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.getRegisteredWarga
);
router.get(
  "/warga/:wargaId",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.getWargaDetail
);
router.get(
  "/unregistered",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.getUnregisteredHouses
);
router.get(
  "/activities",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.getActivityLog
);

export default router;
