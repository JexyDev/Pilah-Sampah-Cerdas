import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { kknController } from "../controllers/kknController.js";
import { kknAttendanceController } from "../controllers/kknAttendanceController.js";
import { logbookController } from "../controllers/logbookController.js";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import {
  uploadSingleImage,
  safeUploadSingleImage,
  uploadPemanfaatanImage,
  upload,
} from "../middlewares/uploadMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Mahasiswa KKN
 *   description: API Khusus Mobile App Mahasiswa KKN (Pendaftaran Warga, Activasi Bin, Scan QR, Location Ping, Pengajuan Izin)
 */

/**
 * @swagger
 * /api/v1/kkn/validate-qr-master:
 *   post:
 *     summary: Validasi QR Code Master oleh Mahasiswa KKN saat serah terima
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR Master valid
 */
router.post(
  "/validate-qr-master",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.validateQrMaster
);

/**
 * @swagger
 * /api/v1/kkn/dashboard:
 *   get:
 *     summary: Dashboard statistik & progress penugasan Mahasiswa KKN
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan dashboard stats
 */
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
  ]),
  kknController.getDashboardStats
);

/**
 * @swagger
 * /api/v1/kkn/handover:
 *   post:
 *     summary: Serah terima wilayah & aset KKN antar gelombang/mahasiswa
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Handover berhasil dicatat
 */
router.post("/handover", authMiddleware, roleMiddleware(["MAHASISWA_KKN"]), kknController.handover);

/**
 * @swagger
 * /api/v1/kkn/warga-dampingan:
 *   get:
 *     summary: Daftar warga dampingan Mahasiswa KKN di wilayah tugas
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar warga dampingan
 */
router.get(
  "/warga-dampingan",
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
  ]),
  kknController.getRegisteredWarga
);

/**
 * @swagger
 * /api/v1/kkn/warga:
 *   get:
 *     summary: List seluruh warga di wilayah tugas KKN
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan list warga
 */
router.get(
  "/warga",
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
  ]),
  kknController.getWargaList
);

/**
 * @swagger
 * /api/v1/kkn/warga/activate-by-scan:
 *   post:
 *     summary: "Aktivasi tempat sampah warga via scan QR oleh Mahasiswa KKN (Merekam GPS & Langsung Otomatis ACTIVE_BOUND)"
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bin berhasil di-scan & diajukan aktivasi
 */
router.post(
  "/warga/activate-by-scan",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.activateByScan
);

/**
 * @swagger
 * /api/v1/kkn/warga/activate-bin:
 *   post:
 *     summary: Pendaftaran & aktivasi bin warga oleh Mahasiswa KKN
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aktivasi bin berhasil
 */
router.post(
  "/warga/activate-bin",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.activateBin
);

/**
 * @swagger
 * /api/v1/kkn/warga/{wargaId}:
 *   get:
 *     summary: Detail profil & status bin warga dampingan
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wargaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detail warga ditemukan
 */
router.get(
  "/warga/:wargaId",
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
  ]),
  kknController.getWargaDetail
);

/**
 * @swagger
 * /api/v1/kkn/warga/{wargaId}/claim:
 *   post:
 *     summary: Mahasiswa KKN mengklaim warga mandiri menjadi warga dampingannya
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wargaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Warga yang akan diklaim
 *     responses:
 *       200:
 *         description: Berhasil mengklaim warga
 *       400:
 *         description: Warga belum memiliki tempat sampah aktif atau sudah didampingi mahasiswa lain
 *       404:
 *         description: Warga tidak ditemukan
 */
router.post(
  "/warga/:wargaId/claim",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.claimWargaMandiri
);

/**
 * @swagger
 * /api/v1/kkn/activity-log:
 *   get:
 *     summary: Logbook riwayat aktivitas lapangan Mahasiswa KKN
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan logbook
 */
router.get(
  "/activity-log",
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
  ]),
  kknController.getActivityLog
);

/**
 * @swagger
 * /api/v1/kkn/fasilitas/bantu-input:
 *   post:
 *     summary: Pendataan & input fasilitas daur ulang warga oleh Mahasiswa KKN
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - rwId
 *               - nama
 *               - jenis
 *               - latitude
 *               - longitude
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID User Warga (penanggung jawab/pemilik fasilitas)
 *                 example: "11111111-1111-1111-1111-111111111101"
 *               rwId:
 *                 type: integer
 *                 description: ID RW lokasi fasilitas
 *                 example: 1
 *               nama:
 *                 type: string
 *                 description: Nama fasilitas
 *                 example: "Loseda Berkah RT 02"
 *               jenis:
 *                 type: string
 *                 enum: [loseda, bata_terawang, rumah_maggot, bank_sampah, tps, buruan_sae, poc]
 *                 description: Jenis fasilitas pengolahan sampah
 *                 example: "rumah_maggot"
 *               latitude:
 *                 type: number
 *                 format: float
 *                 description: Titik koordinat latitude
 *                 example: -6.89060000
 *               longitude:
 *                 type: number
 *                 format: float
 *                 description: Titik koordinat longitude
 *                 example: 107.61500000
 *               foto:
 *                 type: string
 *                 description: URL foto fasilitas (opsional)
 *                 example: "https://example.com/foto-maggot.jpg"
 *     responses:
 *       201:
 *         description: Fasilitas berhasil di-input (+5 Poin Mahasiswa)
 *       400:
 *         description: Data input tidak valid
 */
router.get("/fasilitas/jenis", authMiddleware, kknController.getJenisFasilitas);

router.post(
  "/fasilitas/bantu-input",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "ADMIN_DLH"]),
  safeUploadSingleImage("foto"),
  kknController.inputFacility
);

/**
 * @swagger
 * /api/v1/kkn/location-ping:
 *   post:
 *     summary: Presensi & ping lokasi GPS real-time Mahasiswa KKN di lapangan
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lokasi GPS berhasil dicatat
 */
router.post(
  "/location-ping",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER"]),
  kknAttendanceController.pingLocation
);

/**
 * @swagger
 * /api/v1/kkn/qr/claim:
 *   post:
 *     summary: Klaim batch QR Code oleh Mahasiswa KKN saat diterjunkan
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR Code berhasil diklaim
 */
router.post("/qr/claim", authMiddleware, roleMiddleware(["MAHASISWA_KKN"]), kknController.claimQr);

/**
 * @swagger
 * /api/v1/kkn/kelompok/me:
 *   get:
 *     summary: Info kelompok KKN, anggota tim, & DPL pendamping
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detail kelompok ditemukan
 */
router.get(
  "/kelompok/me",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.getMyGroup
);

/**
 * @swagger
 * /api/v1/kkn/posko/register:
 *   post:
 *     summary: Pendaftaran / perbarui lokasi Posko KKN (Khusus Ketua Kelompok KKN)
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               nama:
 *                 type: string
 *                 description: Nama posko (opsional, default 'Posko KKN [Nama Kelompok]')
 *                 example: "Posko KKN Kelompok 12 Dago"
 *               alamat:
 *                 type: string
 *                 description: Alamat fisik posko
 *                 example: "Jl. Dago Asri No. 12 RT 03 / RW 08"
 *               rwId:
 *                 type: integer
 *                 description: ID RW lokasi posko (opsional, default sesuai assigned RW)
 *                 example: 3
 *               latitude:
 *                 type: number
 *                 format: float
 *                 description: Titik koordinat latitude lokasi posko
 *                 example: -6.8851234
 *               longitude:
 *                 type: number
 *                 format: float
 *                 description: Titik koordinat longitude lokasi posko
 *                 example: 107.6134567
 *               foto:
 *                 type: string
 *                 description: URL foto posko (opsional)
 *                 example: "https://example.com/posko.jpg"
 *     responses:
 *       201:
 *         description: Posko KKN berhasil didaftarkan (Menunggu approval RW)
 *       400:
 *         description: Koordinat tidak valid atau bentrok radius < 30m dengan posko lain
 *       403:
 *         description: Ditolak karena bukan Ketua Kelompok
 */
router.post(
  "/posko/register",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("foto"),
  kknController.registerPosko
);

/**
 * @swagger
 * /api/v1/kkn/posko/me:
 *   get:
 *     summary: Mendapatkan data Posko KKN kelompok saat ini
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detail posko KKN ditemukan
 */
router.get(
  "/posko/me",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "DPL", "SUPER_USER"]),
  kknController.getMyPosko
);

/**
 * @swagger
 * /api/v1/kkn/posko/me:
 *   put:
 *     summary: Pembaruan data Posko KKN kelompok (Khusus Ketua Kelompok)
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data Posko KKN berhasil diperbarui
 *       400:
 *         description: Koordinat tidak valid atau bentrok radius < 30m dengan posko lain
 *       403:
 *         description: Ditolak karena bukan Ketua Kelompok
 *       404:
 *         description: Posko belum terdaftar
 */
router.put(
  "/posko/me",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("foto"),
  kknController.updateMyPosko
);

/**
 * @swagger
 * /api/v1/kkn/posko/update:
 *   put:
 *     summary: Alias pembaruan data Posko KKN kelompok (Khusus Ketua Kelompok)
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data Posko KKN berhasil diperbarui
 *       400:
 *         description: Koordinat tidak valid atau bentrok radius < 30m dengan posko lain
 *       403:
 *         description: Ditolak karena bukan Ketua Kelompok
 *       404:
 *         description: Posko belum terdaftar
 */
router.put(
  "/posko/update",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("foto"),
  kknController.updateMyPosko
);

/**
 * @swagger
 * /api/v1/kkn/posko:
 *   get:
 *     summary: Mendapatkan seluruh daftar Posko KKN di seluruh kelurahan
 *     tags: [Monitoring KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil memuat daftar seluruh posko KKN
 */
router.get("/posko", authMiddleware, kknController.getAllPosko);

router.post(
  "/posko",
  authMiddleware,
  roleMiddleware([
    "DEVELOPER",
    "SUPER_USER",
    "ADMIN_DLH",
    "DLH_ADMIN",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
    "DPL",
  ]),
  safeUploadSingleImage("foto"),
  kknController.createPosko
);

router.put(
  "/posko/:id",
  authMiddleware,
  roleMiddleware([
    "DEVELOPER",
    "SUPER_USER",
    "ADMIN_DLH",
    "DLH_ADMIN",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
    "DPL",
  ]),
  safeUploadSingleImage("foto"),
  kknController.updatePosko
);

router.delete(
  "/posko/:id",
  authMiddleware,
  roleMiddleware([
    "DEVELOPER",
    "SUPER_USER",
    "ADMIN_DLH",
    "DLH_ADMIN",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ]),
  kknController.deletePosko
);

/**
 * @swagger
 * /api/v1/kkn/active-zone:
 *   get:
 *     summary: Batas wilayah penugasan (Polygon RW & RT) Mahasiswa KKN
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Zona aktif ditemukan
 */
router.get(
  "/active-zone",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.getActiveZone
);

/**
 * @swagger
 * /api/v1/kkn/kegiatan-aktif:
 *   get:
 *     summary: Mendapatkan daftar kegiatan aktif KKN mahasiswa hari ini
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar kegiatan aktif
 */
router.get(
  "/kegiatan-aktif",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER", "DPL"]),
  kknAttendanceController.getKegiatanAktif
);

router.post(
  "/kegiatan/:id/mulai",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("foto"),
  kknAttendanceController.mulaiKegiatan
);

router.post(
  "/kegiatan/:id/jeda",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknAttendanceController.jedaKegiatan
);

router.post(
  "/kegiatan/:id/selesai",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("foto"),
  kknAttendanceController.selesaiKegiatan
);

router.post(
  ["/absen", "/kegiatan/:id/absen"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("foto"),
  kknAttendanceController.absenAlias
);

router.post(
  "/out-of-zone-violation",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknAttendanceController.recordOutOfZoneViolation
);

router.get(
  "/kegiatan/:id/presensi-history",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER"]),
  kknAttendanceController.getPresensiHistory
);

/**
 * @swagger
 * /api/v1/kkn/pemanfaatan-sampah:
 *   post:
 *     summary: Pencatatan pemanfaatan sampah (Loseda/Maggot/Kompos) oleh Mahasiswa KKN
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pemanfaatan sampah berhasil disimpan
 */
router.post(
  "/pemanfaatan-sampah",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  uploadPemanfaatanImage,
  kknController.createLogbookPemanfaatan
);

/**
 * @swagger
 * /api/v1/kkn/pemanfaatan-sampah/{id}:
 *   put:
 *     summary: Pembaruan logbook pemanfaatan sampah KKN (Murni edit data tanpa mengubah riwayat poin)
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Logbook pemanfaatan sampah berhasil diperbarui
 */
router.put(
  "/pemanfaatan-sampah/:id",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER"]),
  uploadPemanfaatanImage,
  kknController.updateLogbookPemanfaatan
);

router.patch(
  "/pemanfaatan-sampah/:id",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER"]),
  uploadPemanfaatanImage,
  kknController.updateLogbookPemanfaatan
);

/**
 * @swagger
 * /api/v1/kkn/pemanfaatan-sampah/{id}:
 *   delete:
 *     summary: Menghapus logbook pemanfaatan sampah KKN (Menarik kembali riwayat poin dari seluruh anggota kelompok)
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Laporan pemanfaatan sampah berhasil dihapus
 */
router.delete(
  "/pemanfaatan-sampah/:id",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  kknController.deleteLogbookPemanfaatan
);

router.get(
  "/pemanfaatan-sampah/unharvested",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.getUnharvestedLogbooks
);

// ──────────────────────────────────────────────────────────
// PROGRAM KERJA (PROKER) MAHASISWA KKN
// ──────────────────────────────────────────────────────────

router.post(
  ["/program-kerja", "/proker"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER", "DPL"]),
  uploadPemanfaatanImage,
  kknController.createProgramKerja
);

router.put(
  "/program-kerja/:id",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER", "DPL"]),
  upload.single("filePdf"),
  kknController.updateProgramKerja
);

router.get(
  ["/program-kerja", "/proker"],
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "DPL",
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
  ]),
  kknController.getProgramKerja
);

router.get(
  ["/program-kerja/:id", "/proker/:id"],
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "DPL",
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
  ]),
  kknController.getProgramKerjaById
);

router.put(
  ["/program-kerja/:id", "/proker/:id"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER", "DPL", "DOSEN_PEMBIMBING"]),
  uploadPemanfaatanImage,
  kknController.updateProgramKerja
);

router.patch(
  ["/program-kerja/:id", "/proker/:id"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER", "DPL", "DOSEN_PEMBIMBING"]),
  uploadPemanfaatanImage,
  kknController.updateProgramKerja
);

router.delete(
  ["/program-kerja/:id", "/proker/:id"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER", "DPL", "ADMIN_DLH"]),
  kknController.deleteProgramKerja
);

// ──────────────────────────────────────────────────────────
// LOGBOOK MAHASISWA (ALIAS UNDER /api/v1/kkn)
// ──────────────────────────────────────────────────────────

router.get(
  ["/logbook", "/logbook-aktivitas"],
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "DEVELOPER",
    "DPL",
    "ADMIN_DLH",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
  ]),
  logbookController.getMahasiswaLogbooks
);

router.get(
  ["/logbook/:id", "/logbook-aktivitas/:id"],
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "DEVELOPER",
    "DPL",
    "ADMIN_DLH",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
  ]),
  logbookController.getMahasiswaLogbookById
);

router.post(
  ["/logbook", "/logbook-aktivitas"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER"]),
  uploadPemanfaatanImage,
  logbookController.createMahasiswaLogbook
);

router.put(
  ["/logbook/:id", "/logbook-aktivitas/:id"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER", "DPL", "DOSEN_PEMBIMBING"]),
  uploadPemanfaatanImage,
  logbookController.updateMahasiswaLogbook
);

router.patch(
  ["/logbook/:id", "/logbook-aktivitas/:id"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER", "DPL", "DOSEN_PEMBIMBING"]),
  uploadPemanfaatanImage,
  logbookController.updateMahasiswaLogbook
);

router.delete(
  ["/logbook/:id", "/logbook-aktivitas/:id"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER", "DPL", "ADMIN_DLH"]),
  logbookController.deleteMahasiswaLogbook
);
/**
 * @swagger
 * /api/v1/kkn/panen-hasil:
 *   post:
 *     summary: Pencatatan hasil panen (Pilar 3) oleh Mahasiswa KKN
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Hasil panen berhasil dicatat (+25 Poin untuk seluruh anggota kelompok)
 */
router.post(
  ["/panen-hasil", "/panen-hasil/:id"],
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ]),
  uploadPemanfaatanImage,
  kknController.updatePanenHasil
);

router.post(
  "/panen-hasil",
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ]),
  uploadPemanfaatanImage,
  kknController.createPanenHasil
);

/**
 * @swagger
 * /api/v1/kkn/panen-hasil/{id}:
 *   put:
 *     summary: Pembaruan data hasil panen KKN (Murni edit data tanpa mengubah riwayat poin)
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hasil panen berhasil diperbarui
 */
router.put(
  "/panen-hasil/:id",
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ]),
  uploadPemanfaatanImage,
  kknController.updatePanenHasil
);

router.patch(
  "/panen-hasil/:id",
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ]),
  uploadPemanfaatanImage,
  kknController.updatePanenHasil
);

/**
 * @swagger
 * /api/v1/kkn/panen-hasil/{id}:
 *   delete:
 *     summary: Menghapus hasil panen KKN (Menarik kembali riwayat poin panen seluruh anggota kelompok)
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hasil panen berhasil dihapus dan poin ditarik kembali
 */
router.delete(
  "/panen-hasil/:id",
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "DEVELOPER",
    "ADMIN_DLH",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ]),
  kknController.deletePanenHasil
);

/**
 * @swagger
 * /api/v1/kkn/register-warga:
 *   post:
 *     summary: "Membantu pendaftaran akun Warga baru di lapangan (Auth: No HP +62)"
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Warga berhasil didaftarkan (+10 Poin Mahasiswa & Warga)
 */
router.post(
  "/register-warga",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.registerWarga
);

/**
 * @swagger
 * /api/v1/kkn/pengajuan-izin:
 *   post:
 *     summary: Pengajuan izin/sakit Mahasiswa KKN disertai unggah foto bukti
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pengajuan izin berhasil dikirim ke DPL
 */
router.post(
  ["/pengajuan-izin", "/students/leave-request", "/leave-request"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  safeUploadSingleImage("fotoBukti"),
  kknController.createLeaveRequest
);

router.get(
  ["/pengajuan-izin", "/students/leave-request", "/leave-request"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.getLeaveRequests
);

router.put(
  ["/pengajuan-izin/:id/batal", "/pengajuan-izin/:id/cancel"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.cancelLeaveRequest
);

router.post(
  ["/pengajuan-izin/:id/batal", "/pengajuan-izin/:id/cancel"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.cancelLeaveRequest
);

// Alias routes matching exact Mahasiswa KKN spec
/**
 * @swagger
 * /api/v1/kkn/attendance/check-in:
 *   post:
 *     summary: Absensi check-in KKN (Alternatif)
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil check-in
 */
router.post(
  ["/attendance/check-in", "/attendance/checkin"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknAttendanceController.recordAttendance
);

router.post(
  ["/attendance/check-out", "/attendance/checkout"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknAttendanceController.checkOutAttendance
);

/**
 * @swagger
 * /api/v1/kkn/history:
 *   get:
 *     summary: Riwayat aktivitas lapangan
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logbook kegiatan
 */
router.get(
  "/history",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.getActivityLog
);

/**
 * @swagger
 * /api/v1/kkn/kegiatan/{id}/lokasi:
 *   get:
 *     summary: Mendapatkan lokasi kegiatan (Target Lokasi)
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lokasi target kegiatan
 */
router.get(
  ["/kegiatan/:id/lokasi", "/target-lokasi"],
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW"]),
  kknAttendanceController.getActivityLocation
);

router.get(
  "/notifications",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  async (req, res) => {
    try {
      const userId = req.user!.userId;
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      const formatted = notifications.map((n) => ({
        id: n.id,
        title: n.title,
        desc: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
      }));

      res.json({ success: true, data: formatted });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

import { scheduleController } from "../controllers/scheduleController.js";

/**
 * @swagger
 * /api/v1/kkn/schedules:
 *   get:
 *     summary: Mendapatkan daftar jadwal KKN (Alias Mobile Spec)
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil list jadwal KKN
 */
router.get("/schedules", authMiddleware, scheduleController.getAllSchedules);

/**
 * @swagger
 * /api/v1/kkn/dampak-rw:
 *   get:
 *     summary: Statistik riil dampak pemilahan di wilayah RW binaan Mahasiswa KKN
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistik dampak RW
 */
router.get(
  "/dampak-rw",
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "ADMIN_DLH",
    "DPL",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
  ]),
  kknController.getDampakRw
);

/**
 * @swagger
 * /api/v1/kkn/dampak-kelurahan:
 *   get:
 *     summary: Statistik riil dampak pemilahan di tingkat Kelurahan
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistik dampak Kelurahan
 */
router.get(
  "/dampak-kelurahan",
  authMiddleware,
  roleMiddleware([
    "MAHASISWA_KKN",
    "SUPER_USER",
    "ADMIN_DLH",
    "DPL",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
  ]),
  kknController.getDampakKelurahan
);

/**
 * @swagger
 * /api/v1/kkn/timeline/active:
 *   get:
 *     summary: Mengambil HANYA tahapan linimasa KKN yang sedang berlangsung (Active Stage) untuk widget mobile
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil memuat tahapan yang sedang berlangsung beserta rekomendasi aksi & pertanyaan kritis
 */
router.get(
  ["/timeline/active", "/timeline/aktif", "/linimasa/active", "/linimasa/aktif"],
  optionalAuthMiddleware,
  kknController.getActiveTimelineMahasiswa
);

/**
 * @swagger
 * /api/v1/kkn/timeline:
 *   get:
 *     summary: Linimasa resmi KKN Mahasiswa beserta Rekomendasi Aksi & Pertanyaan Kritis
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fase
 *         schema:
 *           type: string
 *         description: Filter fase KKN (e.g. Pra-Kegiatan, Fase 1, Fase 2, Fase 3, Fase 4)
 *       - in: query
 *         name: statusPelaksanaan
 *         schema:
 *           type: string
 *         description: Filter status pelaksanaan (BELUM_DIMULAI, SEDANG_BERJALAN, SELESAI)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pencarian teks kegiatan atau rekomendasi
 *     responses:
 *       200:
 *         description: Berhasil memuat linimasa KKN, rekomendasi aksi, dan pertanyaan kritis
 */
router.get(["/timeline", "/linimasa"], optionalAuthMiddleware, kknController.getTimelineMahasiswa);

/**
 * @swagger
 * /api/v1/kkn/wilayah-kelompok:
 *   get:
 *     summary: Mengambil data batas geografis (Polygon/Radius) serta titik pusat posko dari kelompok KKN mahasiswa yang sedang login
 *     tags: [Mahasiswa KKN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil memuat wilayah kelompok
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Hanya untuk Mahasiswa KKN
 *       404:
 *         description: Data kelompok KKN mahasiswa tidak ditemukan
 */
router.get(
  "/wilayah-kelompok",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN", "SUPER_USER", "DEVELOPER"]),
  kknController.getWilayahKelompok
);

export default router;
