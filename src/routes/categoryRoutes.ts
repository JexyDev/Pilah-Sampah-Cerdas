/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { categoryController } from "../controllers/categoryController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/", authMiddleware, categoryController.getAll);
router.post("/", authMiddleware, roleMiddleware(["ADMIN"]), categoryController.create);
router.put("/:id", authMiddleware, roleMiddleware(["ADMIN"]), categoryController.update);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), categoryController.delete);

export default router;
