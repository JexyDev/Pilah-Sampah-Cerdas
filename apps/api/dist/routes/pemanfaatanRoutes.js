/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */
import { Router } from "express";
import { pemanfaatanController } from "../controllers/pemanfaatanController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { readOnlyGuard } from "../middlewares/readOnlyGuard.js";
const router = Router();
router.post("/", authMiddleware, readOnlyGuard, pemanfaatanController.create);
router.get("/", authMiddleware, pemanfaatanController.getAll);
router.get("/:id", authMiddleware, pemanfaatanController.getById);
router.put("/:id", authMiddleware, readOnlyGuard, pemanfaatanController.update);
router.delete("/:id", authMiddleware, readOnlyGuard, pemanfaatanController.delete);
export default router;
