/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { configController } from "../controllers/configController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH"]),
  configController.getAll
);
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH"]),
  configController.update
);

export default router;
