/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { residuController } from "../controllers/residuController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

const verifiedPetugasGuard = async (req: any, res: any, next: any) => {
  if (req.user?.role === "PETUGAS_RESIDU") {
    const profile = await prisma.petugasResidu.findUnique({
      where: { userId: req.user.userId },
    });
    if (!profile || profile.whitelistStatus !== "APPROVED") {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "Akun Petugas Residu Anda belum diverifikasi oleh RW.",
      });
    }
  }
  next();
};

// Only PETUGAS_RESIDU allowed
router.get(
  "/pending-logs",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  verifiedPetugasGuard,
  residuController.getPendingLogs
);
router.get(
  "/jadwal-harian",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  verifiedPetugasGuard,
  residuController.getJadwalHarian
);
router.post(
  "/violation",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  verifiedPetugasGuard,
  residuController.recordViolation
);
router.post(
  "/submit-log",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  verifiedPetugasGuard,
  residuController.submitLog
);
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  verifiedPetugasGuard,
  residuController.getDashboardSummary
);
router.get(
  "/analytics",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU"]),
  verifiedPetugasGuard,
  residuController.getAnalytics
);

export default router;
