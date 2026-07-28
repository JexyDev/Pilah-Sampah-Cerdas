/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { kknController } from "../controllers/kknController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// Only MAHASISWA_KKN allowed
router.post(
  "/validate-qr-master",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.validateQrMaster
);

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.getDashboardStats
);

router.post("/handover", authMiddleware, roleMiddleware(["MAHASISWA_KKN"]), kknController.handover);
router.post(
  "/fasilitas/bantu-input",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.inputFacility
);

export default router;
