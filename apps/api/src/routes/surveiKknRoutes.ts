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
router.get("/", roleMiddleware(["SUPER_USER", "DPL"]), surveiKknController.getAllSurveys);

/**
 * GET /api/v1/survei-kkn/:id
 * Ambil detail survei KKN.
 */
router.get("/:id", roleMiddleware(["SUPER_USER", "DPL"]), surveiKknController.getSurveyById);

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
