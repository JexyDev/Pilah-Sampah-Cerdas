/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { Router } from "express";
import { pemanfaatanController } from "../controllers/pemanfaatanController.js";
import { kknController } from "../controllers/kknController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { readOnlyGuard } from "../middlewares/readOnlyGuard.js";
import { safeUploadPemanfaatanImage } from "../middlewares/uploadMiddleware.js";

const router = Router();

// Feedback / Kritik & Saran routes (must be placed before generic /:id route)
router.get("/feedback", authMiddleware, pemanfaatanController.getAllFeedback);
router.get("/feedbacks", authMiddleware, pemanfaatanController.getAllFeedback);
router.get("/kritik-saran", authMiddleware, pemanfaatanController.getAllFeedback);
router.get("/ulasan", authMiddleware, pemanfaatanController.getAllFeedback);
router.post(
  "/feedback",
  authMiddleware,
  safeUploadPemanfaatanImage,
  pemanfaatanController.createFeedback
);
router.post(
  "/kritik-saran",
  authMiddleware,
  safeUploadPemanfaatanImage,
  pemanfaatanController.createFeedback
);
router.put("/feedback/:id/tanggapan", authMiddleware, pemanfaatanController.respondFeedback);
router.delete("/feedback/:id", authMiddleware, readOnlyGuard, pemanfaatanController.deleteFeedback);

// Panen Hasil alias routes under /api/v1/pemanfaatan
router.post(
  ["/panen-hasil", "/panen-hasil/:id"],
  authMiddleware,
  safeUploadPemanfaatanImage,
  kknController.updatePanenHasil
);
router.put(
  "/panen-hasil/:id",
  authMiddleware,
  safeUploadPemanfaatanImage,
  kknController.updatePanenHasil
);
router.patch(
  "/panen-hasil/:id",
  authMiddleware,
  safeUploadPemanfaatanImage,
  kknController.updatePanenHasil
);
router.delete("/panen-hasil/:id", authMiddleware, kknController.deletePanenHasil);

// Pemanfaatan Program CRUD routes
router.post("/", authMiddleware, readOnlyGuard, pemanfaatanController.create);
router.get("/", authMiddleware, pemanfaatanController.getAll);
router.get("/:id", authMiddleware, pemanfaatanController.getById);
router.put("/:id", authMiddleware, readOnlyGuard, pemanfaatanController.update);
router.delete("/:id", authMiddleware, readOnlyGuard, pemanfaatanController.delete);

export default router;
