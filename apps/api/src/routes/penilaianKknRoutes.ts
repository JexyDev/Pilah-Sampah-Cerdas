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
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// Role yang boleh membaca data penilaian mahasiswa tertentu
const PENILAIAN_READ_ROLES = [
  "DEVELOPER",
  "SUPER_USER",
  "ADMIN_DLH",
  "DPL",
  "DOSEN_PEMBIMBING",
  "MPL",
  "PANITIA_TASKFORCE",
  "PEMIMPIN",
] as const;

// Role yang boleh menyimpan/memfinalisasi penilaian (tidak termasuk MAHASISWA_KKN)
const PENILAIAN_WRITE_ROLES = [
  "DEVELOPER",
  "SUPER_USER",
  "ADMIN_DLH",
  "DPL",
  "DOSEN_PEMBIMBING",
  "MPL",
  "PANITIA_TASKFORCE",
  "PEMIMPIN",
] as const;

router.get(
  "/student/:studentId",
  authMiddleware,
  roleMiddleware([...PENILAIAN_READ_ROLES]),
  penilaianKknController.getStudentPenilaianData
);

router.post(
  "/save",
  authMiddleware,
  roleMiddleware([...PENILAIAN_WRITE_ROLES]),
  penilaianKknController.savePenilaian
);

router.post(
  "/finalize",
  authMiddleware,
  roleMiddleware([...PENILAIAN_WRITE_ROLES]),
  penilaianKknController.finalizePenilaian
);

router.get(
  "/rekap",
  authMiddleware,
  roleMiddleware([...PENILAIAN_READ_ROLES]),
  penilaianKknController.getRekapPenilaian
);

router.get(
  "/laporan-akhir",
  authMiddleware,
  roleMiddleware([...PENILAIAN_READ_ROLES]),
  penilaianKknController.getLaporanAkhirList
);

router.post(
  "/laporan-akhir/kelompok/:kelompokId/assess",
  authMiddleware,
  roleMiddleware([...PENILAIAN_WRITE_ROLES]),
  penilaianKknController.saveLaporanAkhirKelompokScore
);

router.post(
  "/laporan-akhir/:studentId/assess",
  authMiddleware,
  roleMiddleware([...PENILAIAN_WRITE_ROLES]),
  penilaianKknController.saveLaporanAkhirScore
);

router.post(
  "/normalize",
  authMiddleware,
  roleMiddleware(["DEVELOPER", "SUPER_USER", "ADMIN_DLH", "PANITIA_TASKFORCE"]),
  penilaianKknController.normalizeAllAssessments
);

export default router;
