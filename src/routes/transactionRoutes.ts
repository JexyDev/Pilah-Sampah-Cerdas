/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { transactionController } from "../controllers/transactionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { uploadAvatarMiddleware } from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get(
  "/deposits",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "RW", "PETUGAS_RESIDU", "LURAH", "CAMAT", "MAHASISWA_KKN"]),
  transactionController.getDeposits
);
router.get(
  "/my-deposits",
  authMiddleware,
  roleMiddleware(["WARGA"]),
  transactionController.getMyDeposits
);

router.post(
  "/manual",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU", "SUPER_ADMIN", "ADMIN_DLH"]),
  uploadAvatarMiddleware.single("image"),
  transactionController.createManualDeposit
);

router.post(
  "/residu",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  uploadAvatarMiddleware.single("image"),
  transactionController.createResiduDeposit
);

export default router;
