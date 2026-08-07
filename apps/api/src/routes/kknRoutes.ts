/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { kknController } from "../controllers/kknController.js";
import { kknAttendanceController } from "../controllers/kknAttendanceController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

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
  roleMiddleware(["MAHASISWA_KKN"]),
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
  roleMiddleware(["MAHASISWA_KKN"]),
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
router.get("/warga", authMiddleware, roleMiddleware(["MAHASISWA_KKN"]), kknController.getWargaList);

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
  roleMiddleware(["MAHASISWA_KKN"]),
  kknController.getWargaDetail
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
  roleMiddleware(["MAHASISWA_KKN"]),
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
 *     responses:
 *       200:
 *         description: Fasilitas berhasil di-input
 */
router.post(
  "/fasilitas/bantu-input",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
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
  roleMiddleware(["MAHASISWA_KKN"]),
  kknAttendanceController.updateLocation
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
  kknController.createPemanfaatanSampah
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

import { uploadSingleImage } from "../middlewares/uploadMiddleware.js";

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
  "/pengajuan-izin",
  authMiddleware,
  roleMiddleware(["MAHASISWA_KKN"]),
  uploadSingleImage.single("fotoBukti"),
  kknController.createLeaveRequest
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

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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

export default router;
