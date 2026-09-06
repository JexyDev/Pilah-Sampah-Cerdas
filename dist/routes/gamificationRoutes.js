/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { Router } from "express";
import { gamificationController } from "../controllers/gamificationController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
const router = Router();
router.post("/recycle-ideas", authMiddleware, roleMiddleware(["WARGA"]), gamificationController.submitIdea);
router.get("/recycle-ideas", authMiddleware, gamificationController.getIdeas);
router.put("/recycle-ideas/:id/approve", authMiddleware, roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "RW"]), gamificationController.approveIdea);
router.get("/leaderboard", authMiddleware, gamificationController.getLeaderboard);
router.get("/leaderboard/all", authMiddleware, gamificationController.getLeaderboard);
export default router;
