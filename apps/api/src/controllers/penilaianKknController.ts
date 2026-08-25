/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Controller Penilaian KKN Mahasiswa (Komposisi Mitra/MPL 50% + DPL 50%)
 */

import { Request, Response } from "express";
import { penilaianKknService } from "../services/penilaianKknService.js";

export const penilaianKknController = {
  /**
   * Mengambil data penilaian aktif seorang mahasiswa beserta profil & rekap kehadiran riil
   */
  getStudentPenilaianData: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      if (!studentId) {
        res.status(400).json({ success: false, message: "ID Mahasiswa (studentId) wajib disertakan" });
        return;
      }

      const evaluatorId = req.user?.userId || (req.user as any)?.id || "";
      const evaluatorRole = String(req.user?.role || "").toUpperCase();

      const data = await penilaianKknService.getStudentPenilaianData(studentId, evaluatorId, evaluatorRole);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error("[penilaianKknController] getStudentPenilaianData error:", error);
      res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  },

  /**
   * Menyimpan form penilaian (Draft / Tersimpan)
   */
  savePenilaian: async (req: Request, res: Response) => {
    try {
      const { studentId, ...payload } = req.body;
      if (!studentId) {
        res.status(400).json({ success: false, message: "ID Mahasiswa (studentId) wajib disertakan" });
        return;
      }

      const evaluatorId = req.user?.userId || (req.user as any)?.id || "";
      const evaluatorRole = String(req.user?.role || "").toUpperCase();

      const result = await penilaianKknService.savePenilaian(
        studentId,
        evaluatorId,
        evaluatorRole,
        { ...payload, isFinalizeAction: false }
      );

      res.status(200).json({
        success: true,
        message: "Penilaian mahasiswa berhasil disimpan sebagai draft",
        data: result,
      });
    } catch (error: any) {
      console.error("[penilaianKknController] savePenilaian error:", error);
      res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  },

  /**
   * Mengunci & Finalisasi Penilaian KKN
   */
  finalizePenilaian: async (req: Request, res: Response) => {
    try {
      const { studentId, ...payload } = req.body;
      if (!studentId) {
        res.status(400).json({ success: false, message: "ID Mahasiswa (studentId) wajib disertakan" });
        return;
      }

      const evaluatorId = req.user?.userId || (req.user as any)?.id || "";
      const evaluatorRole = String(req.user?.role || "").toUpperCase();

      const result = await penilaianKknService.savePenilaian(
        studentId,
        evaluatorId,
        evaluatorRole,
        { ...payload, isFinalizeAction: true }
      );

      res.status(200).json({
        success: true,
        message: "Penilaian mahasiswa berhasil difinalisasi dan dikunci resmi",
        data: result,
      });
    } catch (error: any) {
      console.error("[penilaianKknController] finalizePenilaian error:", error);
      res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  },

  /**
   * Mengambil Rekapitulasi Penilaian KKN (Untuk Tabel / Export CSV / Dropdown Mahasiswa)
   */
  getRekapPenilaian: async (req: Request, res: Response) => {
    try {
      const groupId = req.query.groupId as string | undefined;
      const evaluatorRole = String(req.user?.role || "").toUpperCase();
      const evaluatorId = req.user?.userId || (req.user as any)?.id;

      const data = await penilaianKknService.getRekapPenilaian(groupId, evaluatorId, evaluatorRole);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error("[penilaianKknController] getRekapPenilaian error:", error);
      res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  },

  /**
   * Mengambil List Laporan Akhir Mahasiswa KKN
   */
  getLaporanAkhirList: async (req: Request, res: Response) => {
    try {
      const groupId = req.query.groupId as string | undefined;
      const evaluatorRole = String(req.user?.role || "").toUpperCase();
      const evaluatorId = req.user?.userId || (req.user as any)?.id;

      const data = await penilaianKknService.getLaporanAkhirList(groupId, evaluatorId, evaluatorRole);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error("[penilaianKknController] getLaporanAkhirList error:", error);
      res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  },

  /**
   * Menyimpan Penilaian Laporan Akhir Berbasis Kelompok
   */
  saveLaporanAkhirKelompokScore: async (req: Request, res: Response) => {
    try {
      const { kelompokId } = req.params;
      const { statusTelaah, rubrikScores, catatanBab, catatanUmum, judulLaporan, fileUrl } = req.body;

      if (!kelompokId) {
        res.status(400).json({ success: false, message: "ID Kelompok (kelompokId) wajib disertakan" });
        return;
      }

      if (!rubrikScores || typeof rubrikScores !== "object") {
        res.status(400).json({ success: false, message: "Objek rubrikScores wajib disertakan" });
        return;
      }

      const evaluatorId = req.user?.userId || (req.user as any)?.id || "";
      const evaluatorRole = String(req.user?.role || "").toUpperCase();

      const result = await penilaianKknService.saveLaporanAkhirKelompokScore(
        kelompokId,
        evaluatorId,
        evaluatorRole,
        {
          statusTelaah: statusTelaah || "DISETUJUI",
          rubrikScores,
          catatanBab,
          catatanUmum,
          judulLaporan,
          fileUrl,
        }
      );

      res.status(200).json({
        success: true,
        message: "Penilaian laporan akhir kelompok KKN berhasil disimpan dan disinkronkan ke seluruh anggota",
        data: result,
      });
    } catch (error: any) {
      console.error("[penilaianKknController] saveLaporanAkhirKelompokScore error:", error);
      res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  },

  /**
   * Menyimpan Penilaian Laporan Akhir Mahasiswa (Fallback Individual)
   */
  saveLaporanAkhirScore: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const { score, catatan } = req.body;

      if (!studentId) {
        res.status(400).json({ success: false, message: "ID Mahasiswa (studentId) wajib disertakan" });
        return;
      }

      if (score === undefined || score === null || isNaN(Number(score))) {
        res.status(400).json({ success: false, message: "Nilai laporan akhir (score) wajib diisi angka" });
        return;
      }

      const evaluatorId = req.user?.userId || (req.user as any)?.id || "";
      const evaluatorRole = String(req.user?.role || "").toUpperCase();

      const result = await penilaianKknService.saveLaporanAkhirScore(
        studentId,
        evaluatorId,
        evaluatorRole,
        Number(score),
        catatan
      );

      res.status(200).json({
        success: true,
        message: "Penilaian laporan akhir berhasil disimpan",
        data: result,
      });
    } catch (error: any) {
      console.error("[penilaianKknController] saveLaporanAkhirScore error:", error);
      res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  },
};
