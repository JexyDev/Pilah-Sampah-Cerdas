/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { Router } from "express";
import { systemAnalysisController } from "../controllers/systemAnalysisController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

const ALLOWED_LEADERSHIP_ROLES = [
  "SUPER_USER",
  "DEVELOPER",
  "ADMIN_DLH",
  "PIMPINAN",
  "PEMIMPIN",
  "PANITIA_TASKFORCE",
];

router.get("/kkn", authMiddleware, roleMiddleware(ALLOWED_LEADERSHIP_ROLES), systemAnalysisController.getKknAnalysis);
router.get("/tata-kelola", authMiddleware, systemAnalysisController.getWasteGovernanceAnalysis);
router.post("/chat", authMiddleware, roleMiddleware(ALLOWED_LEADERSHIP_ROLES), systemAnalysisController.queryAiChat);

export default router;
