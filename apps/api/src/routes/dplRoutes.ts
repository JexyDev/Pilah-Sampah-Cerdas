import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { dplScopeMiddleware } from "../middlewares/dplScopeMiddleware.js";
import { dplController } from "../controllers/dplController.js";

const router = Router();

// Protect all DPL routes with authentication and role check
router.use(authMiddleware);
router.use(roleMiddleware(["DPL", "DOSEN_PEMBIMBING", "ADMIN_DLH", "SUPERADMIN"]));

// 1. Ringkasan Kelompok Bimbingan
router.get("/groups", dplScopeMiddleware, dplController.getGroupSummary);

// 2. Detail per Mahasiswa
router.get("/students", dplScopeMiddleware, dplController.getStudentDetails);

// 3. Detail Warga yang Dibantu (drill-down dari mahasiswa)
router.get("/students/:studentId/citizens", dplScopeMiddleware, dplController.getAssistedCitizens);

// 4. Peta Sebaran (Polygon RW & Bin Coordinates)
router.get("/map-coverage", dplScopeMiddleware, dplController.getMapCoverage);

// 5. Notifikasi / Alert DPL
router.get("/alerts", dplScopeMiddleware, dplController.getAlerts);

// 6. Riwayat Approval Log
router.get("/approvals/history", dplScopeMiddleware, dplController.getApprovalHistory);

// 7. Form Penilaian Aktivitas Mahasiswa & Deciding Leave
router.post("/students/:studentId/assess", dplScopeMiddleware, dplController.assessStudent);
router.post("/approvals/:requestId/decide", dplScopeMiddleware, dplController.decideLeaveRequest);

export default router;
