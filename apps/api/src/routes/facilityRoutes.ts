/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
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
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "MAHASISWA_KKN", "RW", "RT"]),
  facilityController.createFacility
);

router.get("/jenis", authMiddleware, facilityController.getJenisFasilitas);
router.get("/", authMiddleware, facilityController.getFacilities);

router.post(
  "/:id/production",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "RW", "RT"]),
  facilityController.recordProduction
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
