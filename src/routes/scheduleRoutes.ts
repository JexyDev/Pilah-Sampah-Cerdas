/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { scheduleController } from "../controllers/scheduleController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/", authMiddleware, scheduleController.getAllSchedules);
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "LURAH", "RW", "PETUGAS_RESIDU"]),
  scheduleController.createSchedule
);

export default router;
