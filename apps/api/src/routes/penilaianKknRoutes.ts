/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Routes Penilaian KKN Mahasiswa (Komposisi Mitra/PL 70% + DPL 30%)
 */

import { Router } from "express";
import { penilaianKknController } from "../controllers/penilaianKknController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/student/:studentId", authMiddleware, penilaianKknController.getStudentPenilaianData);
router.post("/save", authMiddleware, penilaianKknController.savePenilaian);
router.post("/finalize", authMiddleware, penilaianKknController.finalizePenilaian);
router.get("/rekap", authMiddleware, penilaianKknController.getRekapPenilaian);

export default router;
