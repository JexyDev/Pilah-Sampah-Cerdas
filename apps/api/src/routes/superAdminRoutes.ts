/**
 * Project: TrashCare
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
router.get("/audit-trail", roleMiddleware(["SUPER_ADMIN"]), superAdminController.getAuditTrail);
router.get("/dashboard", superAdminController.getAggregatedDashboard);
router.put("/approvals/bins/:id/reject", superAdminController.rejectBin);
router.get("/approvals/petugas", superAdminController.getPendingPetugas);
router.put("/approvals/petugas/:id/verify", superAdminController.verifyPetugas);
router.put("/bins/:id/status", superAdminController.updateBinStatus);
router.post("/bins/:id/replace", superAdminController.replaceBrokenBin);
router.delete("/bins/:id", superAdminController.deleteBin);
router.post("/cleansing/purge-duplicates", roleMiddleware(["SUPER_ADMIN"]), superAdminController.purgeDuplicates);
router.get("/circular-economy", superAdminController.getCircularEconomyReport);

export default router;

