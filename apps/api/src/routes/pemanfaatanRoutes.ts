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
import { requirePermission } from "../middlewares/permissionMiddleware.js";

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

// Pemanfaatan Program CRUD routes (Protected via Dynamic RBAC)
router.post(
  "/",
  authMiddleware,
  readOnlyGuard,
  requirePermission("pemanfaatan", "canCreate", ["SUPER_USER", "ADMIN_DLH", "DEVELOPER"]),
  pemanfaatanController.create
);
router.get(
  "/",
  authMiddleware,
  requirePermission("pemanfaatan", "canView", [
    "SUPER_USER",
    "ADMIN_DLH",
    "DEVELOPER",
    "RW",
    "PETUGAS_RESIDU",
    "MAHASISWA_KKN",
    "PIMPINAN",
    "PEMIMPIN",
    "DPL",
    "DOSEN_PEMBIMBING",
    "CAMAT",
    "LURAH",
    "PANITIA_TASKFORCE",
  ]),
  pemanfaatanController.getAll
);
router.get(
  "/:id",
  authMiddleware,
  requirePermission("pemanfaatan", "canView", [
    "SUPER_USER",
    "ADMIN_DLH",
    "DEVELOPER",
    "RW",
    "PETUGAS_RESIDU",
    "MAHASISWA_KKN",
    "PIMPINAN",
    "PEMIMPIN",
    "DPL",
    "DOSEN_PEMBIMBING",
    "CAMAT",
    "LURAH",
    "PANITIA_TASKFORCE",
  ]),
  pemanfaatanController.getById
);
router.put(
  "/:id",
  authMiddleware,
  readOnlyGuard,
  requirePermission("pemanfaatan", "canEdit", ["SUPER_USER", "ADMIN_DLH", "DEVELOPER"]),
  pemanfaatanController.update
);
router.delete(
  "/:id",
  authMiddleware,
  readOnlyGuard,
  requirePermission("pemanfaatan", "canDelete", ["SUPER_USER", "ADMIN_DLH", "DEVELOPER"]),
  pemanfaatanController.delete
);

export default router;
