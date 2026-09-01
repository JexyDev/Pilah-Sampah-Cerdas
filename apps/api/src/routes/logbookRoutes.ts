/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Route Logbook KKN (Mahasiswa & DPL)
 */

import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { uploadPemanfaatanImage } from "../middlewares/uploadMiddleware.js";
import { logbookController } from "../controllers/logbookController.js";
import { kknController } from "../controllers/kknController.js";

const router = Router();

// Protect all logbook routes with authentication
router.use(authMiddleware);

/**
 * ─────────────────────────────────────────────
 * LOGBOOK MAHASISWA & AKTIVITAS KELOMPOK
 * ─────────────────────────────────────────────
 */

// Mengambil daftar logbook (Tabular) - Mahasiswa, DPL, Super User
router.get(
  "/mahasiswa",
  roleMiddleware([
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "MAHASISWA_KKN",
  ]),
  logbookController.getMahasiswaLogbooks
);

// Mengambil detail satu logbook aktivitas mahasiswa berdasarkan ID
router.get(
  "/mahasiswa/:id",
  roleMiddleware([
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "MAHASISWA_KKN",
  ]),
  logbookController.getMahasiswaLogbookById
);

// Submit logbook aktivitas baru oleh Mahasiswa (Mendukung upload bukti foto via kamera)
router.post(
  "/mahasiswa",
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER"]),
  uploadPemanfaatanImage,
  logbookController.createMahasiswaLogbook
);

// Persetujuan / Penolakan Logbook oleh Ketua Kelompok
router.patch(
  "/mahasiswa/:id/approve-ketua",
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER"]),
  logbookController.approveByKetua
);

// Verifikasi & Feedback Logbook oleh DPL (Single)
router.patch(
  "/mahasiswa/:id/verifikasi-dpl",
  roleMiddleware(["DPL", "DOSEN_PEMBIMBING", "SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  logbookController.verifikasiByDpl
);

// Batch Verifikasi Logbook oleh DPL
router.post(
  "/mahasiswa/batch-verifikasi-dpl",
  roleMiddleware(["DPL", "DOSEN_PEMBIMBING", "SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  logbookController.batchVerifikasiByDpl
);

// Update / Koreksi Logbook Aktivitas Mahasiswa (Mahasiswa, Developer, DPL, Super User)
router.put(
  "/mahasiswa/:id",
  roleMiddleware(["MAHASISWA_KKN", "DEVELOPER", "SUPER_USER", "DPL", "DOSEN_PEMBIMBING"]),
  uploadPemanfaatanImage,
  logbookController.updateMahasiswaLogbook
);

// Hapus Logbook Aktivitas Mahasiswa (Developer, Super User, DPL, Penulis)
router.delete(
  "/mahasiswa/:id",
  roleMiddleware([
    "DEVELOPER",
    "SUPER_USER",
    "DPL",
    "DOSEN_PEMBIMBING",
    "ADMIN_DLH",
    "MAHASISWA_KKN",
  ]),
  logbookController.deleteMahasiswaLogbook
);

// Update Logbook Aktivitas Mahasiswa (Developer/Admin)
router.patch(
  "/mahasiswa/:id",
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  uploadPemanfaatanImage,
  logbookController.updateMahasiswaLogbook
);

/**
 * ─────────────────────────────────────────────
 * LOGBOOK MONITORING MINGGUAN DPL
 * ─────────────────────────────────────────────
 */

// Mengambil riwayat logbook monitoring DPL
router.get(
  "/dpl",
  roleMiddleware([
    "DPL",
    "DOSEN_PEMBIMBING",
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
  ]),
  logbookController.getDplLogbooks
);

// Submit logbook monitoring mingguan DPL
router.post(
  "/dpl",
  roleMiddleware(["DPL", "DOSEN_PEMBIMBING", "SUPER_USER", "DEVELOPER"]),
  uploadPemanfaatanImage,
  logbookController.createDplLogbook
);

// Update Logbook Supervisi DPL (Developer/Admin atau DPL)
router.patch(
  "/dpl/:id",
  roleMiddleware(["DPL", "DOSEN_PEMBIMBING", "SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  uploadPemanfaatanImage,
  logbookController.updateDplLogbook
);

// Hapus Logbook Supervisi DPL (Developer/Admin atau DPL)
router.delete(
  "/dpl/:id",
  roleMiddleware(["DPL", "DOSEN_PEMBIMBING", "SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  logbookController.deleteDplLogbook
);

/**
 * ─────────────────────────────────────────────
 * STATISTIK & KONFIGURASI TOLERANSI
 * ─────────────────────────────────────────────
 */

// Statistik kepatuhan & skor logbook per kelompok
router.get(
  "/kepatuhan/:kelompokId",
  roleMiddleware([
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "MAHASISWA_KKN",
  ]),
  logbookController.getComplianceScore
);

// Mendapatkan konfigurasi toleransi backdate
router.get("/config/toleransi", logbookController.getToleranceConfig);

// Mengubah konfigurasi toleransi backdate (developer & super user)
router.patch(
  "/config/toleransi",
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  logbookController.updateToleranceConfig
);

/**
 * ─────────────────────────────────────────────
 * ALIAS PROGRAM KERJA (PROKER) DI ROUTE LOGBOOK
 * ─────────────────────────────────────────────
 */
router.get(
  ["/program-kerja", "/proker"],
  roleMiddleware([
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "MAHASISWA_KKN",
  ]),
  kknController.getProgramKerja
);

router.get(
  ["/program-kerja/:id", "/proker/:id"],
  roleMiddleware([
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "MAHASISWA_KKN",
  ]),
  kknController.getProgramKerjaById
);

router.post(
  ["/program-kerja", "/proker"],
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER", "DPL"]),
  uploadPemanfaatanImage,
  kknController.createProgramKerja
);

router.put(
  ["/program-kerja/:id", "/proker/:id"],
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER", "DPL"]),
  uploadPemanfaatanImage,
  kknController.updateProgramKerja
);

router.patch(
  ["/program-kerja/:id", "/proker/:id"],
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER", "DPL"]),
  uploadPemanfaatanImage,
  kknController.updateProgramKerja
);

router.delete(
  ["/program-kerja/:id", "/proker/:id"],
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER", "DPL", "ADMIN_DLH"]),
  kknController.deleteProgramKerja
);

export default router;
