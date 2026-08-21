/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { Router } from "express";
import { poskoKknController } from "../controllers/poskoKknController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// Semua role authenticated bisa lihat daftar posko
router.get("/", authMiddleware, poskoKknController.getAll.bind(poskoKknController));

// Mahasiswa cek posko kelompoknya sendiri
router.get(
  "/me",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  poskoKknController.getMyPosko.bind(poskoKknController)
);

// Daftar / update posko — Ketua KKN, Admin, Developer
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "ADMIN_DLH", "DEVELOPER"]),
  poskoKknController.upsert.bind(poskoKknController)
);

// Hapus posko — Admin & Developer saja
router.delete(
  "/:kelompokId",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "DEVELOPER"]),
  poskoKknController.deletePosko.bind(poskoKknController)
);

export default router;
