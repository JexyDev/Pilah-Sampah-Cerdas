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

const router = Router();

router.get(
  "/deposits",
  authMiddleware,
  roleMiddleware(["ADMIN", "PETUGAS_RW", "PETUGAS_RT", "PETUGAS_KELURAHAN"]),
  transactionController.getDeposits
);
router.get(
  "/my-deposits",
  authMiddleware,
  roleMiddleware(["WARGA"]),
  transactionController.getMyDeposits
);

export default router;
