import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { dplScopeMiddleware } from "../middlewares/dplScopeMiddleware.js";
import { safeUploadPemanfaatanImage } from "../middlewares/uploadMiddleware.js";
import { dplController } from "../controllers/dplController.js";

const router = Router();

// Protect all DPL routes with authentication and role check
router.use(authMiddleware);
router.use(roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "DPL", "DOSEN_PEMBIMBING", "PEMIMPIN", "PANITIA_TASKFORCE", "MAHASISWA_KKN"]));

/**
 * @swagger
 * tags:
 *   name: DPL
 *   description: API Monitoring & Evaluasi Dosen Pembimbing Lapangan (DPL)
 */

/**
 * @swagger
 * /api/v1/dpl/groups:
 *   get:
 *     summary: Mendapatkan ringkasan kelompok KKN bimbingan DPL
 *     tags: [DPL]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan ringkasan kelompok
 */
router.get("/groups", dplScopeMiddleware, dplController.getGroupSummary);
router.get("/group-summary", dplScopeMiddleware, dplController.getGroupSummary);

/**
 * @swagger
 * /api/v1/dpl/students:
 *   get:
 *     summary: Mendapatkan daftar detail mahasiswa KKN bimbingan DPL
 *     tags: [DPL]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar mahasiswa
 */
router.get("/students", dplScopeMiddleware, dplController.getStudentDetails);

/**
 * @swagger
 * /api/v1/dpl/students-cumulative-summary:
 *   get:
 *     summary: Mendapatkan summary kumulatif jam aktual mahasiswa KKN terhadap minimal target
 *     tags: [DPL]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan summary mahasiswa
 */
router.get("/students-cumulative-summary", dplScopeMiddleware, dplController.getStudentCumulativeSummary);

/**
 * @swagger
 * /api/v1/dpl/students/{studentId}/citizens:
 *   get:
 *     summary: Mendapatkan daftar warga dampingan per mahasiswa
 *     tags: [DPL]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar warga
 */
router.get("/students/:studentId/citizens", dplScopeMiddleware, dplController.getAssistedCitizens);

/**
 * @swagger
 * /api/v1/dpl/map-coverage:
 *   get:
 *     summary: Mendapatkan peta sebaran polygon RW & titik koordinat Bins KKN
 *     tags: [DPL]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan data peta
 */
router.get("/map-coverage", dplScopeMiddleware, dplController.getMapCoverage);

/**
 * @swagger
 * /api/v1/dpl/alerts:
 *   get:
 *     summary: Mendapatkan daftar notifikasi & alert DPL
 *     tags: [DPL]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan alert
 */
router.get("/alerts", dplScopeMiddleware, dplController.getAlerts);

/**
 * @swagger
 * /api/v1/dpl/approvals/history:
 *   get:
 *     summary: Mendapatkan riwayat persetujuan logbook KKN
 *     tags: [DPL]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan riwayat approval
 */
router.get("/approvals/history", dplScopeMiddleware, dplController.getApprovalHistory);

/**
 * @swagger
 * /api/v1/dpl/students/{studentId}/assess:
 *   post:
 *     summary: Submit penilaian aktivitas mahasiswa KKN
 *     tags: [DPL]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Penilaian berhasil disimpan
 */
router.post("/students/:studentId/assess", dplScopeMiddleware, dplController.assessStudent);

/**
 * @swagger
 * /api/v1/dpl/approvals/{requestId}/decide:
 *   post:
 *     summary: Memberikan keputusan approval pengajuan izin mahasiswa
 *     tags: [DPL]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Keputusan berhasil disimpan
 */
router.post("/approvals/:requestId/decide", dplScopeMiddleware, dplController.decideLeaveRequest);
router.post(
  ["/approvals/:requestId/cancel-decide", "/approvals/:requestId/decide-cancel", "/approvals/:requestId/override-hadir"],
  dplScopeMiddleware,
  dplController.decideCancelLeaveRequest
);
router.put(
  ["/approvals/:requestId/cancel-decide", "/approvals/:requestId/decide-cancel", "/approvals/:requestId/override-hadir"],
  dplScopeMiddleware,
  dplController.decideCancelLeaveRequest
);

// ─────────────────────────────────────────────
// PROGRAM KERJA KKN
// ─────────────────────────────────────────────
// BUGFIX: Tambahkan dplScopeMiddleware ke semua route program kerja agar tidak bisa diakses sembarangan
router.get("/program-kerja", dplScopeMiddleware, dplController.getProgramKerja);
router.post("/program-kerja", dplScopeMiddleware, dplController.createProgramKerja);
router.put("/program-kerja/:id", dplScopeMiddleware, dplController.updateProgramKerja);
router.delete("/program-kerja/:id", dplScopeMiddleware, dplController.deleteProgramKerja);
router.patch("/program-kerja/:id/decision", dplScopeMiddleware, dplController.decideProgramKerja);
router.patch("/program-kerja/:id/penilaian", dplScopeMiddleware, dplController.assessProgramKerja);
router.get("/program-kerja/:id/bukti", dplScopeMiddleware, dplController.getProgramKerjaBukti);

// ─────────────────────────────────────────────
// PENILAIAN KKN & REKAP LEMBAR NILAI
// ─────────────────────────────────────────────
router.get("/penilaian/rekap", dplScopeMiddleware, dplController.getRekapNilaiAkhir);

// ─────────────────────────────────────────────
// TARGET & KONFIGURASI KKN
// ─────────────────────────────────────────────
router.get("/config-targets", dplController.getConfigTargets);
router.put("/config-targets", roleMiddleware(["SUPER_USER", "DEVELOPER"]), dplController.updateConfigTargets);

// ─────────────────────────────────────────────
// LOG AKTIVITAS DPL (WEB ENTRY & MONITORING)
// ─────────────────────────────────────────────
// BUGFIX: Tambahkan dplScopeMiddleware ke semua route activity logs
router.get("/activity-logs", dplScopeMiddleware, dplController.getDplActivityLogs);
router.post("/activity-logs", dplScopeMiddleware, safeUploadPemanfaatanImage, dplController.createDplActivityLog);
router.put("/activity-logs/:id", dplScopeMiddleware, safeUploadPemanfaatanImage, dplController.updateDplActivityLog);
router.patch("/activity-logs/:id", dplScopeMiddleware, safeUploadPemanfaatanImage, dplController.updateDplActivityLog);
router.delete("/activity-logs/:id", dplScopeMiddleware, dplController.deleteDplActivityLog);

export default router;
