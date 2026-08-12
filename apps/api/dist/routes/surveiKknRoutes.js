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
// Seluruh endpoint dilindungi autentikasi + role SUPER_USER
router.use(authMiddleware);
router.use(roleMiddleware(["SUPER_USER"]));
/**
 * GET /api/v1/survei-kkn/
 * Ambil daftar survei KKN.
 */
router.get("/", surveiKknController.getAllSurveys);
/**
 * GET /api/v1/survei-kkn/:id
 * Ambil detail survei KKN.
 */
router.get("/:id", surveiKknController.getSurveyById);
/**
 * POST /api/v1/survei-kkn/import
 * Upload dan impor file XLSX survei KKN ke database.
 * Content-Type: multipart/form-data, field "file"
 */
router.post("/import", uploadXlsx.single("file"), surveiKknController.importSurveiKkn);
/**
 * GET /api/v1/survei-kkn/import/history
 * Riwayat impor survei KKN.
 */
router.get("/import/history", surveiKknController.getImportHistory);
/**
 * GET /api/v1/survei-kkn/template
 * Download file template XLSX survei KKN.
 */
router.get("/template", surveiKknController.downloadTemplate);
export default router;
