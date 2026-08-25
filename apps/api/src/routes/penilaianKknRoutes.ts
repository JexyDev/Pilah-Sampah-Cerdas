/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Routes Penilaian KKN Mahasiswa (Komposisi Mitra/MPL 50% + DPL 50%)
 */

import { Router } from "express";
import { penilaianKknController } from "../controllers/penilaianKknController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/student/:studentId", authMiddleware, penilaianKknController.getStudentPenilaianData);
router.post("/save", authMiddleware, penilaianKknController.savePenilaian);
router.post("/finalize", authMiddleware, penilaianKknController.finalizePenilaian);
router.get("/rekap", authMiddleware, penilaianKknController.getRekapPenilaian);
router.get("/laporan-akhir", authMiddleware, penilaianKknController.getLaporanAkhirList);
router.post("/laporan-akhir/kelompok/:kelompokId/assess", authMiddleware, penilaianKknController.saveLaporanAkhirKelompokScore);
router.post("/laporan-akhir/:studentId/assess", authMiddleware, penilaianKknController.saveLaporanAkhirScore);

export default router;
