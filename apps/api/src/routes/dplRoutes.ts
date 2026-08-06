import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { dplScopeMiddleware } from "../middlewares/dplScopeMiddleware.js";
import { dplController } from "../controllers/dplController.js";

const router = Router();

// Protect all DPL routes with authentication and role check
router.use(authMiddleware);
router.use(roleMiddleware(["DPL", "DOSEN_PEMBIMBING", "ADMIN_DLH", "SUPERADMIN", "SUPER_ADMIN", "PEMIMPIN", "PANITIA_TASKFORCE"]));

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

export default router;
