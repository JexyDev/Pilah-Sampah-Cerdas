/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { Router } from "express";
import { systemAnalysisController } from "../controllers/systemAnalysisController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/kkn", authMiddleware, systemAnalysisController.getKknAnalysis);
router.get("/tata-kelola", authMiddleware, systemAnalysisController.getWasteGovernanceAnalysis);
router.post("/chat", authMiddleware, systemAnalysisController.queryAiChat);

export default router;
