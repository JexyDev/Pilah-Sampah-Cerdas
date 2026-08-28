/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * MPL Controller — Mitra Pendamping Lapangan
 * Identik dengan dplController tapi memanggil mplService (scope by mplId/kelurahan)
 */

import { Request, Response } from "express";
import { mplService } from "../services/mplService.js";

function getUserId(req: Request): string {
  return req.user!.userId || (req.user as any).id;
}

export const mplController = {
  getGroupSummary: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const data = await mplService.getGroupSummary(mplUserId, userRole);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.getGroupSummary] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getStudentDetails: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const groupId = req.query.groupId as string | undefined;
      const search = req.query.search as string | undefined;
      const data = await mplService.getStudentDetails(mplUserId, groupId, userRole, search);
      res.json({ success: true, total: Array.isArray(data) ? data.length : 0, data });
    } catch (error: any) {
      console.error("[mplController.getStudentDetails] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getStudentCumulativeSummary: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const groupId = req.query.groupId as string | undefined;
      const search = req.query.search as string | undefined;
      const data = await mplService.getStudentCumulativeSummary(mplUserId, groupId, userRole, search);
      res.json({ success: true, total: Array.isArray(data) ? data.length : 0, data });
    } catch (error: any) {
      console.error("[mplController.getStudentCumulativeSummary] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getAssistedCitizens: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const studentId = req.params.studentId;
      const data = await mplService.getAssistedCitizens(mplUserId, studentId);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.getAssistedCitizens] error:", error);
      if (error.message === "STUDENT_NOT_FOUND_OR_FORBIDDEN") {
        res.status(403).json({ error: "FORBIDDEN", message: "Mahasiswa tidak ditemukan atau bukan dampingan Anda" });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getMapCoverage: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const data = await mplService.getMapCoverage(mplUserId, userRole);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.getMapCoverage] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getAlerts: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const data = await mplService.getAlerts(mplUserId, userRole);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.getAlerts] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getApprovalHistory: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const data = await mplService.getApprovalHistory(mplUserId, userRole);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.getApprovalHistory] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  assessStudent: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const studentId = req.params.studentId;
      const { score, note } = req.body;

      if (score === undefined || isNaN(Number(score))) {
        res.status(400).json({ error: "BAD_REQUEST", message: "Skor penilaian (score) wajib diisi angka" });
        return;
      }

      const data = await mplService.assessStudent(mplUserId, studentId, Number(score), note);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.assessStudent] error:", error);
      if (error.message === "STUDENT_NOT_FOUND_OR_FORBIDDEN") {
        res.status(403).json({ error: "FORBIDDEN", message: "Mahasiswa tidak ditemukan atau bukan dampingan Anda" });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  decideLeaveRequest: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const requestId = req.params.requestId;
      const { status, note } = req.body;

      if (!["APPROVED", "REJECTED", "ESCALATED"].includes(status)) {
        res.status(400).json({ error: "BAD_REQUEST", message: "Status harus APPROVED, REJECTED, atau ESCALATED" });
        return;
      }

      const data = await mplService.decideLeaveRequest(mplUserId, requestId, status, note);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.decideLeaveRequest] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  decideCancelLeaveRequest: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const { requestId } = req.params;
      const { action, note } = req.body;

      if (!["APPROVE_HADIR", "REJECT_CANCEL"].includes(action)) {
        res.status(400).json({
          error: "BAD_REQUEST",
          message: "Aksi harus 'APPROVE_HADIR' atau 'REJECT_CANCEL'",
        });
        return;
      }

      const data = await mplService.decideCancelLeaveRequest(mplUserId, requestId, action, note);
      res.json({
        success: true,
        message:
          action === "APPROVE_HADIR"
            ? "Permohonan pembatalan disetujui. Status presensi mahasiswa diubah menjadi Hadir."
            : "Permohonan pembatalan ditolak. Status izin tetap berlaku.",
        data,
      });
    } catch (error: any) {
      console.error("[mplController.decideCancelLeaveRequest] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getProgramKerja: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const groupId = req.query.groupId as string | undefined;
      const kategori = req.query.kategori as string | undefined;
      const statusUsulan = req.query.statusUsulan as string | undefined;
      const statusPelaksanaan = req.query.statusPelaksanaan as string | undefined;
      const statusPenilaian = req.query.statusPenilaian as string | undefined;
      const search = req.query.search as string | undefined;

      const data = await mplService.getProgramKerja(mplUserId, groupId, userRole, {
        kategori, statusUsulan, statusPelaksanaan, statusPenilaian, search,
      });
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.getProgramKerja] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  createProgramKerja: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const { kelompokId, nomor, deskripsi, kategori, sumber, waktuPelaksanaan, linkGoogleDrive, kebutuhanBiaya, status, statusUsulan, statusPelaksanaan } = req.body;

      if (!kelompokId || !deskripsi) {
        res.status(400).json({ error: "BAD_REQUEST", message: "kelompokId dan deskripsi wajib diisi" });
        return;
      }

      const data = await mplService.createProgramKerja(mplUserId, userRole, {
        kelompokId,
        nomor: nomor ? Number(nomor) : undefined,
        deskripsi,
        kategori,
        sumber,
        waktuPelaksanaan,
        linkGoogleDrive,
        kebutuhanBiaya: kebutuhanBiaya !== undefined ? Number(kebutuhanBiaya) : 0,
        status,
        statusUsulan,
        statusPelaksanaan,
      });
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.createProgramKerja] error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({ error: "FORBIDDEN_SCOPE", message: "Akses ditolak: Data ini bukan milik kelompok binaan Anda" });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  updateProgramKerja: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const data = await mplService.updateProgramKerja(id, mplUserId, userRole, req.body);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.updateProgramKerja] error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({ error: "FORBIDDEN_SCOPE", message: "Akses ditolak: Data ini bukan milik kelompok binaan Anda" });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  deleteProgramKerja: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      await mplService.deleteProgramKerja(id, mplUserId, userRole);
      res.json({ success: true, message: "Program kerja berhasil dihapus" });
    } catch (error: any) {
      console.error("[mplController.deleteProgramKerja] error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({ error: "FORBIDDEN_SCOPE", message: "Akses ditolak: Data ini bukan milik kelompok binaan Anda" });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  decideProgramKerja: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const id = req.params.id;
      const { status, statusUsulan, statusPelaksanaan, catatanDpl } = req.body;
      const effectiveStatus = status || statusUsulan || "DISETUJUI";
      const data = await mplService.decideProgramKerja(mplUserId, id, effectiveStatus as any, catatanDpl, userRole, statusPelaksanaan);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.decideProgramKerja] error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({ error: "FORBIDDEN_SCOPE", message: "Akses ditolak: Data ini bukan milik kelompok binaan Anda" });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  assessProgramKerja: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const id = req.params.id;
      const { skorPenilaian, evaluasiDpl, aspekPenilaian, predikat, statusPenilaian, statusPelaksanaan } = req.body;

      if (skorPenilaian === undefined || isNaN(Number(skorPenilaian))) {
        res.status(400).json({ error: "BAD_REQUEST", message: "skorPenilaian (angka 0-100) wajib diisi" });
        return;
      }

      const data = await mplService.assessProgramKerja(
        mplUserId, id, Number(skorPenilaian), evaluasiDpl, userRole,
        aspekPenilaian, predikat, statusPenilaian, statusPelaksanaan
      );
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.assessProgramKerja] error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({ error: "FORBIDDEN_SCOPE", message: "Akses ditolak" });
        return;
      }
      if (error.message === "PROKER_REJECTED") {
        res.status(400).json({ error: "BAD_REQUEST", message: "Program kerja yang ditolak tidak dapat dinilai" });
        return;
      }
      if (error.message === "PROKER_NOT_APPROVED") {
        res.status(400).json({ error: "BAD_REQUEST", message: "Hanya program kerja yang telah disetujui yang dapat dinilai" });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getProgramKerjaBukti: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const id = req.params.id;
      const data = await mplService.getProgramKerjaBukti(mplUserId, id, userRole);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.getProgramKerjaBukti] error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({ error: "FORBIDDEN_SCOPE", message: "Akses ditolak" });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getRekapNilaiAkhir: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const groupId = req.query.groupId as string | undefined;
      const data = await mplService.getRekapNilaiAkhir(mplUserId, groupId, userRole);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.getRekapNilaiAkhir] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getConfigTargets: async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await mplService.getConfigTargets();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.getConfigTargets] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  updateConfigTargets: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as any;
      const data = await mplService.updateConfigTargets({ ...req.body, updatedBy: user?.name || user?.userId || "MPL" });
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.updateConfigTargets] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getDplActivityLogs: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const { search, groupId, kategori, status, pekanKe, page, limit } = req.query;
      const data = await mplService.getDplActivityLogs(mplUserId, userRole, {
        search: search as string,
        groupId: groupId as string,
        kategori: kategori as string,
        status: status as string,
        pekanKe: pekanKe ? parseInt(pekanKe as string, 10) : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.getDplActivityLogs] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  createDplActivityLog: async (req: Request, res: Response): Promise<void> => {
    try {
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;

      let fotoBuktiUrl = req.body.fotoBuktiUrl || req.body.fotoUrl;
      if (req.file) {
        fotoBuktiUrl = `/uploads/${req.file.filename}`;
      } else if (req.files) {
        const filesObj = req.files as any;
        const f = filesObj.fotoBukti?.[0] || filesObj.fotoDokumentasi?.[0] || filesObj.image?.[0] || filesObj.foto?.[0] || filesObj.file?.[0];
        if (f) fotoBuktiUrl = `/uploads/${f.filename}`;
      }

      const data = await mplService.createDplActivityLog(mplUserId, userRole, { ...req.body, fotoBuktiUrl });
      res.status(201).json({
        success: true,
        message: req.body.status === "DRAF" ? "Draf aktivitas MPL berhasil disimpan" : "Aktivitas MPL berhasil dikirim",
        data,
      });
    } catch (error: any) {
      console.error("[mplController.createDplActivityLog] error:", error);
      res.status(400).json({ error: "BAD_REQUEST", message: error.message || "Gagal menyimpan aktivitas MPL" });
    }
  },

  updateDplActivityLog: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;

      let fotoBuktiUrl = req.body.fotoBuktiUrl || req.body.fotoUrl;
      if (req.file) {
        fotoBuktiUrl = `/uploads/${req.file.filename}`;
      } else if (req.files) {
        const filesObj = req.files as any;
        const f = filesObj.fotoBukti?.[0] || filesObj.fotoDokumentasi?.[0] || filesObj.image?.[0] || filesObj.foto?.[0] || filesObj.file?.[0];
        if (f) fotoBuktiUrl = `/uploads/${f.filename}`;
      }

      const data = await mplService.updateDplActivityLog(id, mplUserId, userRole, { ...req.body, fotoBuktiUrl });
      res.json({ success: true, message: "Aktivitas MPL berhasil diperbarui", data });
    } catch (error: any) {
      console.error("[mplController.updateDplActivityLog] error:", error);
      res.status(400).json({ error: "BAD_REQUEST", message: error.message || "Gagal memperbarui aktivitas MPL" });
    }
  },

  deleteDplActivityLog: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const mplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const data = await mplService.deleteDplActivityLog(id, mplUserId, userRole);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[mplController.deleteDplActivityLog] error:", error);
      res.status(400).json({ error: "BAD_REQUEST", message: error.message || "Gagal menghapus aktivitas MPL" });
    }
  },
};
