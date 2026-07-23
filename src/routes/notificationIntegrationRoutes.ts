/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { notificationIntegrationController } from "../controllers/notificationIntegrationController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.post(
  "/test-otp",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH"]),
  notificationIntegrationController.testOtp
);

router.post(
  "/test-alarm",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH"]),
  notificationIntegrationController.testAlarm
);

router.post(
  "/test-email",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH"]),
  notificationIntegrationController.testEmail
);

router.post(
  "/test-fcm",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH"]),
  notificationIntegrationController.testFcm
);

export default router;
