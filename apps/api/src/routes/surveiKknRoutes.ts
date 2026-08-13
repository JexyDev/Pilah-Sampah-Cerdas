/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { surveiKknController } from "../controllers/surveiKknController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { uploadXlsx } from "../middlewares/xlsxUploadMiddleware.js";

const router = Router();

// Seluruh endpoint dilindungi autentikasi
router.use(authMiddleware);

/**
 * GET /api/v1/survei-kkn/
 * Ambil daftar survei KKN.
 */
router.get("/", roleMiddleware(["SUPER_USER", "DPL", "PANITIA_TASKFORCE"]), surveiKknController.getAllSurveys);

/**
 * @swagger
 * /api/v1/survei-kkn/mahasiswa/my-survei:
 *   get:
 *     summary: Ambil detail survei KKN khusus untuk mahasiswa login sesuai kelurahan penugasannya
 *     description: Endpoint ini hanya dapat diakses oleh role "Mahasiswa KKN". Endpoint ini akan secara otomatis mendeteksi kelurahan mahasiswa berdasarkan ID penggunanya dan mengembalikan detail lengkap survei KKN untuk kelurahan tersebut, termasuk data karakteristik wilayah, bank sampah, pemilahan, key players, dan kesimpulan.
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan data survei KKN untuk kelurahan tersebut
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Detail lengkap SurveiKelurahan beserta relasinya (karakteristikWilayah, pemilahanSampah, bankSampahPengolahan, keyPlayers, volumeSampah, catatanKesimpulan)
 *       401:
 *         description: Akses ditolak (token tidak valid atau tidak memiliki akses)
 *       404:
 *         description: Data survei tidak ditemukan untuk wilayah penugasan mahasiswa tersebut
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.get("/mahasiswa/my-survei", roleMiddleware(["MAHASISWA_KKN"]), surveiKknController.getMySurvey);

/**
 * GET /api/v1/survei-kkn/:id
 * Ambil detail survei KKN.
 */
router.get("/:id", roleMiddleware(["SUPER_USER", "DPL", "PANITIA_TASKFORCE"]), surveiKknController.getSurveyById);

/**
 * PUT /api/v1/survei-kkn/:id
 * Update detail survei KKN (beserta relasinya).
 */
router.put("/:id", roleMiddleware(["SUPER_USER", "PANITIA_TASKFORCE"]), surveiKknController.updateSurveyById);

/**
 * POST /api/v1/survei-kkn/import
 * Upload dan impor file XLSX survei KKN ke database.
 * Content-Type: multipart/form-data, field "file"
 */
router.post("/import", roleMiddleware(["SUPER_USER"]), uploadXlsx.single("file"), surveiKknController.importSurveiKkn);

/**
 * GET /api/v1/survei-kkn/import/history
 * Riwayat impor survei KKN.
 */
router.get("/import/history", roleMiddleware(["SUPER_USER"]), surveiKknController.getImportHistory);

/**
 * GET /api/v1/survei-kkn/template
 * Download file template XLSX survei KKN.
 */
router.get("/template", roleMiddleware(["SUPER_USER"]), surveiKknController.downloadTemplate);

export default router;
