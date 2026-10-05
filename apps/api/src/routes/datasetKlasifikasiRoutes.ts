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
router.use(authMiddleware, roleMiddleware(["DEVELOPER"]));

// VPS & Server Health metrics endpoint (restricted to DEVELOPER)
router.get("/system/vps-health", datasetKlasifikasiController.getVpsHealth);

// Dataset Classification CRUD & Export endpoints (restricted to DEVELOPER)
router.get("/dataset-klasifikasi", datasetKlasifikasiController.getDatasetList);
router.get(
  "/dataset-klasifikasi/export",
  datasetKlasifikasiController.exportDataset
);
router.post(
  "/dataset-klasifikasi/retrain-trigger",
  datasetKlasifikasiController.triggerRetrainJob
);
router.put(
  "/dataset-klasifikasi/:id",
  datasetKlasifikasiController.updateDatasetItem
);
router.delete(
  "/dataset-klasifikasi/:id",
  datasetKlasifikasiController.deleteDatasetItem
);

export default router;
