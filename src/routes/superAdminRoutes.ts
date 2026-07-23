/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { superAdminController } from "../controllers/superAdminController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { readOnlyGuard } from "../middlewares/readOnlyGuard.js";

const router = Router();

// Protect all routes within this router
router.use(authMiddleware);
router.use(roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH"]));
router.use(readOnlyGuard);

/**
 * @swagger
 * tags:
 *   name: SuperAdmin
 *   description: Administrative dashboard and full control endpoints
 */

router.get("/bins/inactive", superAdminController.getInactiveBins);
router.put("/bins/:id/reactivate", superAdminController.reactivateBin);
router.post("/kkn/handover", superAdminController.handoverKkn);
router.get("/kkn/handover-history", superAdminController.getKknHandoverHistory);
router.get("/bins/qr-master", superAdminController.getQrMaster);
router.post("/bins/generate-qr", superAdminController.generateQrBatch);
router.get("/audit-trail", superAdminController.getAuditTrail);
router.get("/dashboard", superAdminController.getAggregatedDashboard);

export default router;
