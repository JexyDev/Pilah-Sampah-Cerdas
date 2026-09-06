/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { timelineKknController } from "../controllers/timelineKknController.js";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

const ALLOWED_MANAGERS = ["SUPER_USER", "DEVELOPER", "PANITIA_TASKFORCE"];

/**
 * @swagger
 * tags:
 *   name: TimelineKKN
 *   description: Manajemen Rencana Kerja & Linimasa Program KKN
 */

// Read endpoints
router.get(
  ["/active", "/aktif"],
  optionalAuthMiddleware,
  timelineKknController.getActiveTimelineMahasiswa
);
router.get("/mahasiswa", optionalAuthMiddleware, timelineKknController.getTimelineMahasiswa);
router.get("/", optionalAuthMiddleware, timelineKknController.getAll);
router.get("/:id", optionalAuthMiddleware, timelineKknController.getById);

// Write endpoints (Restricted to Developer, Super User, Panitia Taskforce)
router.post("/", authMiddleware, roleMiddleware(ALLOWED_MANAGERS), timelineKknController.create);

router.put("/:id", authMiddleware, roleMiddleware(ALLOWED_MANAGERS), timelineKknController.update);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware(ALLOWED_MANAGERS),
  timelineKknController.updateStatus
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ALLOWED_MANAGERS),
  timelineKknController.delete
);

router.post(
  "/bulk-import",
  authMiddleware,
  roleMiddleware(ALLOWED_MANAGERS),
  timelineKknController.bulkImport
);

router.post(
  "/seed-defaults",
  authMiddleware,
  roleMiddleware(ALLOWED_MANAGERS),
  timelineKknController.seedDefaults
);

export default router;
