import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { evaluasiDampakController } from "../controllers/evaluasiDampakController.js";
const router = Router();
// Semua route dilindungi autentikasi
router.use(authMiddleware);
/**
 * @swagger
 * tags:
 *   name: Evaluasi Dampak
 *   description: API Evaluasi Dampak KKN — Baseline, Endline, dan Komparasi
 */
/**
 * @swagger
 * /api/v1/evaluasi-dampak/baseline:
 *   get:
 *     summary: Mengambil data baseline (Survei KKN awal) per kelurahan
 *     tags: [Evaluasi Dampak]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data baseline
 */
router.get("/baseline", roleMiddleware(["SUPER_USER", "DPL", "PANITIA_TASKFORCE", "PEMIMPIN"]), evaluasiDampakController.getBaselineData);
/**
 * @swagger
 * /api/v1/evaluasi-dampak/baseline/{kelurahanId}/validate:
 *   put:
 *     summary: Validasi atau revisi data baseline oleh DPL
 *     tags: [Evaluasi Dampak]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kelurahanId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [VALID, REVISI]
 *               catatan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Data baseline berhasil divalidasi
 */
router.put("/baseline/:kelurahanId/validate", roleMiddleware(["SUPER_USER", "DPL"]), evaluasiDampakController.validateBaseline);
/**
 * @swagger
 * /api/v1/evaluasi-dampak/endline:
 *   get:
 *     summary: Mengambil data endline (Survei KKN akhir) per kelurahan
 *     tags: [Evaluasi Dampak]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data endline
 */
router.get("/endline", roleMiddleware(["SUPER_USER", "DPL", "PANITIA_TASKFORCE", "PEMIMPIN"]), evaluasiDampakController.getEndlineData);
/**
 * @swagger
 * /api/v1/evaluasi-dampak/endline/{kelurahanId}/validate:
 *   put:
 *     summary: Validasi atau revisi data endline oleh DPL
 *     tags: [Evaluasi Dampak]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kelurahanId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Data endline berhasil divalidasi
 */
router.put("/endline/:kelurahanId/validate", roleMiddleware(["SUPER_USER", "DPL"]), evaluasiDampakController.validateEndline);
/**
 * @swagger
 * /api/v1/evaluasi-dampak/komparasi:
 *   get:
 *     summary: Mengambil data komparasi dampak (Baseline vs Endline)
 *     tags: [Evaluasi Dampak]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data komparasi
 */
router.get("/komparasi", roleMiddleware(["SUPER_USER", "DPL", "PANITIA_TASKFORCE", "PEMIMPIN"]), evaluasiDampakController.getKomparasiDampak);
export default router;
