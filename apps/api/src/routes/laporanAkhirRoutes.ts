/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { safeUploadPdfLaporanAkhir } from "../middlewares/uploadMiddleware.js";
import { laporanAkhirController } from "../controllers/laporanAkhirController.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: LaporanAkhir
 *   description: Modul Laporan Akhir KKN Mahasiswa (Per-Individu)
 */

/**
 * POST /api/v1/kkn/laporan-akhir
 * Unggah berkas PDF Laporan Akhir KKN (Mahasiswa Individu)
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER"]),
  safeUploadPdfLaporanAkhir("filePdf"),
  laporanAkhirController.submitLaporanAkhir
);

/**
 * GET /api/v1/kkn/laporan-akhir/me
 * Mengambil status & nilai Laporan Akhir milik mahasiswa yang sedang login
 */
router.get(
  "/me",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER"]),
  laporanAkhirController.getLaporanAkhirMe
);

/**
 * GET /api/v1/kkn/laporan-akhir/history
 * Mengambil riwayat pengajuan Laporan Akhir mahasiswa
 */
router.get(
  "/history",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER"]),
  laporanAkhirController.getLaporanAkhirHistory
);

/**
 * GET /api/v1/kkn/laporan-akhir/dpl/kelompok/:kelompokId
 * Matriks progres Laporan Akhir seluruh anggota kelompok untuk DPL
 */
router.get(
  "/dpl/kelompok/:kelompokId",
  authMiddleware,
  roleMiddleware([
    "DPL",
    "DOSEN_PEMBIMBING",
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "PEMIMPIN",
    "PIMPINAN",
  ]),
  laporanAkhirController.getLaporanAkhirDplMatrix
);

export default router;
