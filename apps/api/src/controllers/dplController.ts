import { Request, Response } from "express";
import { dplService } from "../services/dplService.js";

function getUserId(req: Request): string {
  return req.user!.userId || (req.user as any).id;
}

export const dplController = {
  getGroupSummary: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const data = await dplService.getGroupSummary(dplUserId, userRole);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.getGroupSummary] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getStudentDetails: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const groupId = req.query.groupId as string | undefined;
      const data = await dplService.getStudentDetails(dplUserId, groupId, userRole);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.getStudentDetails] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getAssistedCitizens: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const studentId = req.params.studentId;
      const data = await dplService.getAssistedCitizens(dplUserId, studentId);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.getAssistedCitizens] error:", error);
      if (error.message === "STUDENT_NOT_FOUND_OR_FORBIDDEN") {
        res
          .status(403)
          .json({
            error: "FORBIDDEN",
            message: "Mahasiswa tidak ditemukan atau bukan bimbingan Anda",
          });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getMapCoverage: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const data = await dplService.getMapCoverage(dplUserId, userRole);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.getMapCoverage] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getAlerts: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const data = await dplService.getAlerts(dplUserId, userRole);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.getAlerts] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getApprovalHistory: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const data = await dplService.getApprovalHistory(dplUserId, userRole);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.getApprovalHistory] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  assessStudent: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const studentId = req.params.studentId;
      const { score, note } = req.body;

      if (score === undefined || isNaN(Number(score))) {
        res
          .status(400)
          .json({ error: "BAD_REQUEST", message: "Skor penilaian (score) wajib diisi angka" });
        return;
      }

      const data = await dplService.assessStudent(dplUserId, studentId, Number(score), note);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.assessStudent] error:", error);
      if (error.message === "STUDENT_NOT_FOUND_OR_FORBIDDEN") {
        res
          .status(403)
          .json({
            error: "FORBIDDEN",
            message: "Mahasiswa tidak ditemukan atau bukan bimbingan Anda",
          });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  decideLeaveRequest: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const requestId = req.params.requestId;
      const { status, note } = req.body;

      if (!["APPROVED", "REJECTED", "ESCALATED"].includes(status)) {
        res
          .status(400)
          .json({ error: "BAD_REQUEST", message: "Status harus APPROVED, REJECTED, atau ESCALATED" });
        return;
      }

      const data = await dplService.decideLeaveRequest(dplUserId, requestId, status, note);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.decideLeaveRequest] error:", error);
      if (error.message === "FORBIDDEN_NOT_YOUR_STUDENT") {
        res
          .status(403)
          .json({
            error: "FORBIDDEN",
            message: "Pengajuan izin ini bukan milik mahasiswa bimbingan Anda",
          });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getProgramKerja: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const groupId = req.query.groupId as string | undefined;
      const data = await dplService.getProgramKerja(dplUserId, groupId, userRole);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.getProgramKerja] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  createProgramKerja: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const { kelompokId, nomor, deskripsi, kategori, sumber, waktuPelaksanaan, linkGoogleDrive, kebutuhanBiaya } = req.body;
      if (!kelompokId || !deskripsi) {
        res.status(400).json({ error: "BAD_REQUEST", message: "kelompokId dan deskripsi wajib diisi" });
        return;
      }
      const data = await dplService.createProgramKerja(dplUserId, userRole, {
        kelompokId,
        nomor: nomor ? Number(nomor) : undefined,
        deskripsi,
        kategori,
        sumber,
        waktuPelaksanaan,
        linkGoogleDrive,
        kebutuhanBiaya: kebutuhanBiaya !== undefined ? Number(kebutuhanBiaya) : 0,
      });
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.createProgramKerja] error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({ error: "FORBIDDEN_SCOPE", message: "Program kerja ini bukan milik kelompok Anda" });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  updateProgramKerja: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const { nomor, deskripsi, kategori, sumber, waktuPelaksanaan, linkGoogleDrive, kebutuhanBiaya, status, catatanDpl } = req.body;
      const data = await dplService.updateProgramKerja(id, dplUserId, userRole, {
        nomor: nomor !== undefined ? Number(nomor) : undefined,
        deskripsi,
        kategori,
        sumber,
        waktuPelaksanaan,
        linkGoogleDrive,
        kebutuhanBiaya: kebutuhanBiaya !== undefined ? Number(kebutuhanBiaya) : undefined,
        status,
        catatanDpl,
      });
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.updateProgramKerja] error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({ error: "FORBIDDEN_SCOPE", message: "Program kerja ini bukan milik kelompok Anda" });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  deleteProgramKerja: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      await dplService.deleteProgramKerja(id, dplUserId, userRole);
      res.json({ success: true, message: "Program kerja berhasil dihapus" });
    } catch (error: any) {
      console.error("[dplController.deleteProgramKerja] error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({ error: "FORBIDDEN_SCOPE", message: "Program kerja ini bukan milik kelompok Anda" });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  decideProgramKerja: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const id = req.params.id;
      const { status, catatanDpl } = req.body;
      const validStatuses = ["DITERIMA", "DITOLAK", "SEDANG_BERJALAN", "SELESAI", "BELUM_DISETUJUI"];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          error: "BAD_REQUEST",
          message: `Status harus salah satu dari: ${validStatuses.join(", ")}`,
        });
        return;
      }
      const data = await dplService.decideProgramKerja(dplUserId, id, status as any, catatanDpl);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.decideProgramKerja] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  assessProgramKerja: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const id = req.params.id;
      const { skorPenilaian, evaluasiDpl } = req.body;
      if (skorPenilaian === undefined || isNaN(Number(skorPenilaian))) {
        res.status(400).json({ error: "BAD_REQUEST", message: "skorPenilaian (angka 0-100) wajib diisi" });
        return;
      }
      const data = await dplService.assessProgramKerja(
        dplUserId,
        id,
        Number(skorPenilaian),
        evaluasiDpl
      );
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.assessProgramKerja] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getRekapNilaiAkhir: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const groupId = req.query.groupId as string | undefined;
      const data = await dplService.getRekapNilaiAkhir(dplUserId, groupId, userRole);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.getRekapNilaiAkhir] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getConfigTargets: async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await dplService.getConfigTargets();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.getConfigTargets] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  updateConfigTargets: async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as any;
      const { targetTotalKegiatan, targetTotalJam, targetHarianJam, targetHarianKegiatan } = req.body;
      const data = await dplService.updateConfigTargets({
        targetTotalKegiatan: targetTotalKegiatan !== undefined ? Number(targetTotalKegiatan) : undefined,
        targetTotalJam: targetTotalJam !== undefined ? Number(targetTotalJam) : undefined,
        targetHarianJam: targetHarianJam !== undefined ? Number(targetHarianJam) : undefined,
        targetHarianKegiatan: targetHarianKegiatan !== undefined ? Number(targetHarianKegiatan) : undefined,
        updatedBy: user?.name || user?.userId || "DPL",
      });
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.updateConfigTargets] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },
};
