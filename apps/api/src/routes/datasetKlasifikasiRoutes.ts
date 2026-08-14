/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo.
 */

import { Router } from "express";
import { datasetKlasifikasiController } from "../controllers/datasetKlasifikasiController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// VPS & Server Health metrics endpoint (authenticated)
router.get("/system/vps-health", authMiddleware, datasetKlasifikasiController.getVpsHealth);

// Dataset Classification CRUD & Export endpoints (authenticated)
router.get("/dataset-klasifikasi", authMiddleware, datasetKlasifikasiController.getDatasetList);
router.get("/dataset-klasifikasi/export", authMiddleware, datasetKlasifikasiController.exportDataset);
router.post("/dataset-klasifikasi/retrain-trigger", authMiddleware, datasetKlasifikasiController.triggerRetrainJob);
router.put("/dataset-klasifikasi/:id", authMiddleware, datasetKlasifikasiController.updateDatasetItem);
router.delete("/dataset-klasifikasi/:id", authMiddleware, datasetKlasifikasiController.deleteDatasetItem);

export default router;
