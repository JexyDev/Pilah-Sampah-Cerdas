/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { bankSampahController } from "../controllers/bankSampahController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.post(
  "/transactions",
  authMiddleware,
  roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "RW"]),
  bankSampahController.addTransaction
);

router.get(
  "/ledger/:userId",
  authMiddleware,
  bankSampahController.getLedger
);

export default router;
