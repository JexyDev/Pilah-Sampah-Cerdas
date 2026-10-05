/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo.
 */

import { Router } from "express";
import { datasetKlasifikasiController } from "../controllers/datasetKlasifikasiController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// Semua rute dataset AI dan diagnostik metrik VPS dibatasi ketat khusus role DEVELOPER
const devGuard = [authMiddleware, roleMiddleware(["DEVELOPER"])];

// VPS & Server Health metrics endpoint (restricted to DEVELOPER)
router.get("/system/vps-health", ...devGuard, datasetKlasifikasiController.getVpsHealth);

// Dataset Classification CRUD & Export endpoints (restricted to DEVELOPER)
router.get("/dataset-klasifikasi", ...devGuard, datasetKlasifikasiController.getDatasetList);
router.get(
  "/dataset-klasifikasi/export",
  ...devGuard,
  datasetKlasifikasiController.exportDataset
);
router.post(
  "/dataset-klasifikasi/retrain-trigger",
  ...devGuard,
  datasetKlasifikasiController.triggerRetrainJob
);
router.put(
  "/dataset-klasifikasi/:id",
  ...devGuard,
  datasetKlasifikasiController.updateDatasetItem
);
router.delete(
  "/dataset-klasifikasi/:id",
  ...devGuard,
  datasetKlasifikasiController.deleteDatasetItem
);

export default router;
