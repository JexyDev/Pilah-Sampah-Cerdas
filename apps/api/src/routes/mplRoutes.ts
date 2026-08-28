/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * MPL Routes — /api/v1/mpl/*
 * Identik dengan dplRoutes tapi:
 * 1. roleMiddleware hanya untuk MPL (dan admin override)
 * 2. mplScopeMiddleware menggantikan dplScopeMiddleware
 * 3. Semua handler memanggil mplController (scope by mplId/kelurahan)
 */

import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { mplScopeMiddleware } from "../middlewares/mplScopeMiddleware.js";
import { safeUploadPemanfaatanImage } from "../middlewares/uploadMiddleware.js";
import { mplController } from "../controllers/mplController.js";

const router = Router();

// ─── Auth & Role Guard ─────────────────────────────────────────────────────────
// Semua route MPL hanya bisa diakses oleh MPL dan admin level atas
router.use(authMiddleware);
router.use(
  roleMiddleware([
    "MPL",
    "MITRA_PENDAMPING_LAPANGAN",
    "MITRA_PEMBIMBING_LAPANGAN",
    "MITRA_PENDAMPING",
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
  ])
);

/**
 * @swagger
 * tags:
 *   name: MPL
 *   description: API Monitoring & Evaluasi Mitra Pendamping Lapangan (MPL) — Scope per Kelurahan
 */

// ─── Groups ───────────────────────────────────────────────────────────────────
router.get("/groups", mplScopeMiddleware, mplController.getGroupSummary);
router.get("/group-summary", mplScopeMiddleware, mplController.getGroupSummary);

// ─── Students ─────────────────────────────────────────────────────────────────
router.get("/students", mplScopeMiddleware, mplController.getStudentDetails);
router.get("/students-cumulative-summary", mplScopeMiddleware, mplController.getStudentCumulativeSummary);
router.get("/students/:studentId/citizens", mplScopeMiddleware, mplController.getAssistedCitizens);
router.post("/students/:studentId/assess", mplScopeMiddleware, mplController.assessStudent);

// ─── Map Coverage ─────────────────────────────────────────────────────────────
router.get("/map-coverage", mplScopeMiddleware, mplController.getMapCoverage);

// ─── Alerts & Approvals ───────────────────────────────────────────────────────
router.get("/alerts", mplScopeMiddleware, mplController.getAlerts);
router.get("/approvals/history", mplScopeMiddleware, mplController.getApprovalHistory);
router.post("/approvals/:requestId/decide", mplScopeMiddleware, mplController.decideLeaveRequest);
router.post(
  [
    "/approvals/:requestId/cancel-decide",
    "/approvals/:requestId/decide-cancel",
    "/approvals/:requestId/override-hadir",
  ],
  mplScopeMiddleware,
  mplController.decideCancelLeaveRequest
);
router.put(
  [
    "/approvals/:requestId/cancel-decide",
    "/approvals/:requestId/decide-cancel",
    "/approvals/:requestId/override-hadir",
  ],
  mplScopeMiddleware,
  mplController.decideCancelLeaveRequest
);

// ─── Program Kerja ────────────────────────────────────────────────────────────
router.get("/program-kerja", mplScopeMiddleware, mplController.getProgramKerja);
router.post("/program-kerja", mplScopeMiddleware, mplController.createProgramKerja);
router.put("/program-kerja/:id", mplScopeMiddleware, mplController.updateProgramKerja);
router.delete("/program-kerja/:id", mplScopeMiddleware, mplController.deleteProgramKerja);
router.patch("/program-kerja/:id/decision", mplScopeMiddleware, mplController.decideProgramKerja);
router.patch("/program-kerja/:id/penilaian", mplScopeMiddleware, mplController.assessProgramKerja);
router.get("/program-kerja/:id/bukti", mplScopeMiddleware, mplController.getProgramKerjaBukti);

// ─── Penilaian & Rekap ────────────────────────────────────────────────────────
router.get("/penilaian/rekap", mplScopeMiddleware, mplController.getRekapNilaiAkhir);

// ─── Config Targets ───────────────────────────────────────────────────────────
router.get("/config-targets", mplController.getConfigTargets);
router.put(
  "/config-targets",
  roleMiddleware(["SUPER_USER", "DEVELOPER"]),
  mplController.updateConfigTargets
);

// ─── Log Aktivitas MPL ────────────────────────────────────────────────────────
router.get("/activity-logs", mplScopeMiddleware, mplController.getDplActivityLogs);
router.post(
  "/activity-logs",
  mplScopeMiddleware,
  safeUploadPemanfaatanImage,
  mplController.createDplActivityLog
);
router.put(
  "/activity-logs/:id",
  mplScopeMiddleware,
  safeUploadPemanfaatanImage,
  mplController.updateDplActivityLog
);
router.patch(
  "/activity-logs/:id",
  mplScopeMiddleware,
  safeUploadPemanfaatanImage,
  mplController.updateDplActivityLog
);
router.delete("/activity-logs/:id", mplScopeMiddleware, mplController.deleteDplActivityLog);

export default router;
