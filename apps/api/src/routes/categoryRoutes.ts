/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { categoryController } from "../controllers/categoryController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/", authMiddleware, categoryController.getAll);
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH"]),
  categoryController.create
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH"]),
  categoryController.update
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH"]),
  categoryController.delete
);

export default router;
