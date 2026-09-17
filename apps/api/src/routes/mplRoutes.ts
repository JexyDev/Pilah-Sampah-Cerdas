/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Route MPL (Mitra Pembimbing Lapangan) — INDEPENDENT dari DPL.
 * Base path: /api/v1/mpl
 */

import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { mplService } from "../services/mplService.js";

const router = Router();

/**
 * Role yang diizinkan untuk semua endpoint MPL (GET).
 * POST /penilaian/assess hanya untuk role MPL murni.
 */
const MPL_ROLES = [
  "MPL",
  "MITRA_PEMBIMBING_LAPANGAN",
  "MITRA_PENDAMPING_LAPANGAN",
  "SUPER_USER",
  "DEVELOPER",
];

const MPL_ONLY_ROLES = [
  "MPL",
  "MITRA_PEMBIMBING_LAPANGAN",
  "MITRA_PENDAMPING_LAPANGAN",
];

// ---------------------------------------------------------------------------
// GET /api/v1/mpl/dashboard
// Ringkasan kelurahan, total kelompok, total anggota.
// TIDAK menampilkan tingkat presensi (sesuai notulensi).
// ---------------------------------------------------------------------------
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(MPL_ROLES),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId as string;
      const data = await mplService.getDashboard(userId);
      return res.json({ success: true, data });
    } catch (e: any) {
      console.error("[MPL] getDashboard error:", e.message);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/v1/mpl/groups
// Daftar kelompok dalam scope MPL.
// Query params: ?kelurahan=<nama>&rw=<nama>
// ---------------------------------------------------------------------------
router.get(
  "/groups",
  authMiddleware,
  roleMiddleware(MPL_ROLES),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId as string;
      const kelurahan = req.query.kelurahan as string | undefined;
      const rw = req.query.rw as string | undefined;
      const data = await mplService.getKelompok(userId, { kelurahan, rw });
      return res.json({ success: true, data });
    } catch (e: any) {
      console.error("[MPL] getKelompok error:", e.message);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/v1/mpl/program-kerja
// Program kerja dalam scope MPL (READ-ONLY).
// Query params: ?kelurahan=<nama>&rw=<nama>&kelompokId=<id>
// ---------------------------------------------------------------------------
router.get(
  "/program-kerja",
  authMiddleware,
  roleMiddleware(MPL_ROLES),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId as string;
      const kelurahan = req.query.kelurahan as string | undefined;
      const rw = req.query.rw as string | undefined;
      const kelompokId = req.query.kelompokId as string | undefined;
      const data = await mplService.getProgramKerja(userId, { kelurahan, rw, kelompokId });
      return res.json({ success: true, data });
    } catch (e: any) {
      console.error("[MPL] getProgramKerja error:", e.message);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/v1/mpl/monitoring
// Monitoring presensi mahasiswa dalam scope MPL (READ-ONLY, tanpa verifikasi).
// Query params: ?kelurahan=<nama>
// ---------------------------------------------------------------------------
router.get(
  "/monitoring",
  authMiddleware,
  roleMiddleware(MPL_ROLES),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId as string;
      const kelurahan = req.query.kelurahan as string | undefined;
      const data = await mplService.getMonitoring(userId, { kelurahan });
      return res.json({ success: true, data });
    } catch (e: any) {
      console.error("[MPL] getMonitoring error:", e.message);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/v1/mpl/penilaian
// Daftar mahasiswa & status penilaian MPL dalam scope.
// Query params: ?kelompokId=<id>
// ---------------------------------------------------------------------------
router.get(
  "/penilaian",
  authMiddleware,
  roleMiddleware(MPL_ROLES),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId as string;
      const kelompokId = req.query.kelompokId as string | undefined;
      const data = await mplService.getPenilaianMahasiswaList(userId, kelompokId);
      return res.json({ success: true, data });
    } catch (e: any) {
      console.error("[MPL] getPenilaianMahasiswaList error:", e.message);
      return res.status(500).json({ success: false, message: e.message });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/v1/mpl/penilaian/assess
// Simpan penilaian 8 aspek Mitra oleh MPL — INDEPENDENT dari endpoint DPL.
//
// Body: {
//   studentId: string,
//   skorMitraKehadiran: number (0-100),
//   skorMitraWargaBinaan: number,
//   skorMitraProker: number,
//   skorMitraKomunikasi: number,
//   skorMitraTanggungJawab: number,
//   skorMitraBuktiKegiatan: number,
//   skorMitraDampak: number,
//   skorMitraInisiatif: number,
//   catatanMitra?: string
// }
//
// Hanya untuk role MPL murni (bukan SUPER_USER/DEVELOPER).
// ---------------------------------------------------------------------------
router.post(
  "/penilaian/assess",
  authMiddleware,
  roleMiddleware(MPL_ONLY_ROLES),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId as string;
      const {
        studentId,
        skorMitraKehadiran,
        skorMitraWargaBinaan,
        skorMitraProker,
        skorMitraKomunikasi,
        skorMitraTanggungJawab,
        skorMitraBuktiKegiatan,
        skorMitraDampak,
        skorMitraInisiatif,
        catatanMitra,
      } = req.body;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: "studentId wajib diisi.",
        });
      }

      const result = await mplService.assessMahasiswaByMpl({
        mplUserId: userId,
        studentId,
        skorMitraKehadiran: Number(skorMitraKehadiran ?? 0),
        skorMitraWargaBinaan: Number(skorMitraWargaBinaan ?? 0),
        skorMitraProker: Number(skorMitraProker ?? 0),
        skorMitraKomunikasi: Number(skorMitraKomunikasi ?? 0),
        skorMitraTanggungJawab: Number(skorMitraTanggungJawab ?? 0),
        skorMitraBuktiKegiatan: Number(skorMitraBuktiKegiatan ?? 0),
        skorMitraDampak: Number(skorMitraDampak ?? 0),
        skorMitraInisiatif: Number(skorMitraInisiatif ?? 0),
        catatanMitra: catatanMitra as string | undefined,
      });

      return res.json({
        success: true,
        data: result,
        message: "Penilaian MPL berhasil disimpan.",
      });
    } catch (e: any) {
      console.error("[MPL] assessMahasiswaByMpl error:", e.message);

      if (e.message === "PENILAIAN_DPL_BELUM_SELESAI") {
        return res.status(422).json({
          success: false,
          message:
            "Penilaian DPL belum selesai. MPL baru bisa menilai setelah DPL menyelesaikan penilaian.",
        });
      }

      if (e.message === "AKSES_DITOLAK") {
        return res.status(403).json({
          success: false,
          message:
            "Akses ditolak: mahasiswa bukan dalam cakupan wilayah MPL Anda.",
        });
      }

      if (e.message === "MAHASISWA_TIDAK_DITEMUKAN") {
        return res.status(404).json({
          success: false,
          message: "Data mahasiswa tidak ditemukan.",
        });
      }

      return res.status(500).json({ success: false, message: e.message });
    }
  }
);

export default router;
