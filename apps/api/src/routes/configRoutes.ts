/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { configController } from "../controllers/configController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/rule-engine", authMiddleware, configController.getRuleEngine);
router.post(
  "/rule-engine",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "DEVELOPER", "PEMIMPIN"]),
  configController.updateRuleEngine
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "DEVELOPER"]),
  configController.getAll
);
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "DEVELOPER"]),
  configController.update
);

export default router;
