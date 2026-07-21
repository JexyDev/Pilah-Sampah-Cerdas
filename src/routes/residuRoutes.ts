/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { residuController } from "../controllers/residuController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// Only PETUGAS_RESIDU allowed
router.post(
  "/violation",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  residuController.recordViolation
);
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  residuController.getDashboardSummary
);
router.get(
  "/analytics",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  residuController.getAnalytics
);

export default router;
