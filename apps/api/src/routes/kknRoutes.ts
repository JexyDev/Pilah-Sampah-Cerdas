/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { kknController } from "../controllers/kknController.js";
import { kknAttendanceController } from "../controllers/kknAttendanceController.js";
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

// Monitoring Warga
router.get(
  "/warga-dampingan",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.getRegisteredWarga
);
router.get("/warga", authMiddleware, roleMiddleware(["MAHASISWA_KKN"]), kknController.getWargaList);
router.post(
  "/warga/activate-by-scan",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.activateByScan
);
router.post(
  "/warga/activate-bin",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.activateBin
);
router.get(
  "/warga/:wargaId",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.getWargaDetail
);
router.get(
  "/activity-log",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.getActivityLog
);

router.post(
  "/fasilitas/bantu-input",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.inputFacility
);

router.post(
  "/location-ping",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknAttendanceController.updateLocation
);

router.post("/qr/claim", authMiddleware, roleMiddleware(["MAHASISWA_KKN"]), kknController.claimQr);

router.get(
  "/kelompok/me",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.getMyGroup
);

router.post(
  "/pemanfaatan-sampah",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.createPemanfaatanSampah
);

router.post(
  "/register-warga",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.registerWarga
);

router.post(
  "/warga/notify-status",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.notifyWargaStatus
);

export default router;
