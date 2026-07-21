/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { facilityController } from "../controllers/facilityController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "MAHASISWA_KKN", "RW"]),
  facilityController.createFacility
);

router.get(
  "/",
  authMiddleware,
  facilityController.getFacilities
);

router.post(
  "/:id/production",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "RW"]),
  facilityController.recordProduction
);

router.post(
  "/farms",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH"]),
  facilityController.createFarm
);

router.get(
  "/farms",
  authMiddleware,
  facilityController.getFarms
);

router.post(
  "/maggot/distributions",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "RW"]),
  facilityController.distributeMaggot
);

export default router;
