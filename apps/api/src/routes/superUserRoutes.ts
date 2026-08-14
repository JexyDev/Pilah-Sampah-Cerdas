/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { superUserController } from "../controllers/superUserController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { readOnlyGuard } from "../middlewares/readOnlyGuard.js";

const router = Router();

// Protect all routes within this router
router.use(authMiddleware);
router.use(roleMiddleware(["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH"]));
router.use(readOnlyGuard);

/**
 * @swagger
 * tags:
 *   name: superUser
 *   description: Administrative dashboard and full control endpoints
 */

router.get("/bins/inactive", superUserController.getInactiveBins);
router.put("/bins/:id/reactivate", superUserController.reactivateBin);
router.post("/kkn/handover", superUserController.handoverKkn);
router.get("/kkn/handover-history", superUserController.getKknHandoverHistory);
router.get("/bins/qr-master", superUserController.getQrMaster);
router.post("/bins/generate-qr", superUserController.generateQrBatch);
router.get("/audit-trail", roleMiddleware(["SUPER_USER", "DEVELOPER"]), superUserController.getAuditTrail);
router.get("/dashboard", superUserController.getAggregatedDashboard);
router.put("/approvals/bins/:id/reject", superUserController.rejectBin);
router.get("/approvals/petugas", superUserController.getPendingPetugas);
router.put("/approvals/petugas/:id/verify", superUserController.verifyPetugas);
router.put("/bins/:id/status", superUserController.updateBinStatus);
router.post("/bins/:id/replace", superUserController.replaceBrokenBin);
router.delete("/bins/:id", superUserController.deleteBin);
router.post(
  "/cleansing/purge-duplicates",
  roleMiddleware(["SUPER_USER"]),
  superUserController.purgeDuplicates
);
router.get("/circular-economy", superUserController.getCircularEconomyReport);

export default router;
