import { Request, Response } from "express";
import { dplService } from "../services/dplService.js";
import { extractUploadedFileUrls } from "../middlewares/uploadMiddleware.js";

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
      const search = req.query.search as string | undefined;
      const data = await dplService.getStudentDetails(dplUserId, groupId, userRole, search);
      res.json({ success: true, total: Array.isArray(data) ? data.length : 0, data });
    } catch (error: any) {
      console.error("[dplController.getStudentDetails] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getStudentCumulativeSummary: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const groupId = req.query.groupId as string | undefined;
      const search = req.query.search as string | undefined;
      const data = await dplService.getStudentCumulativeSummary(
        dplUserId,
        groupId,
        userRole,
        search
      );
      res.json({ success: true, total: Array.isArray(data) ? data.length : 0, data });
    } catch (error: any) {
      console.error("[dplController.getStudentCumulativeSummary] error:", error);
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
        res.status(403).json({
          error: "FORBIDDEN",
          message: "Mahasiswa tidak ditemukan atau bukan dampingan Anda",
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
        res.status(403).json({
          error: "FORBIDDEN",
          message: "Mahasiswa tidak ditemukan atau bukan dampingan Anda",
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
        res.status(400).json({
          error: "BAD_REQUEST",
          message: "Status harus APPROVED, REJECTED, atau ESCALATED",
        });
        return;
      }

      const data = await dplService.decideLeaveRequest(dplUserId, requestId, status, note);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.decideLeaveRequest] error:", error);
      if (error.message === "FORBIDDEN_NOT_YOUR_STUDENT") {
        res.status(403).json({
          error: "FORBIDDEN",
          message: "Pengajuan izin ini bukan milik mahasiswa dampingan Anda",
        });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  decideCancelLeaveRequest: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const { requestId } = req.params;
      const { action, note } = req.body;

      if (!["APPROVE_HADIR", "REJECT_CANCEL"].includes(action)) {
        res.status(400).json({
          error: "BAD_REQUEST",
          message:
            "Aksi harus 'APPROVE_HADIR' (setujui jadi hadir) atau 'REJECT_CANCEL' (tolak pembatalan)",
        });
        return;
      }

      const data = await dplService.decideCancelLeaveRequest(dplUserId, requestId, action, note);
      res.json({
        success: true,
        message:
          action === "APPROVE_HADIR"
            ? "Permohonan pembatalan izin disetujui. Status presensi mahasiswa telah diubah menjadi Hadir."
            : "Permohonan pembatalan izin ditolak. Status izin tetap berlaku.",
        data,
      });
    } catch (error: any) {
      console.error("[dplController.decideCancelLeaveRequest] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getProgramKerja: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const groupId = req.query.groupId as string | undefined;
      const kategori = req.query.kategori as string | undefined;
      const statusUsulan = req.query.statusUsulan as string | undefined;
      const statusPelaksanaan = req.query.statusPelaksanaan as string | undefined;
      const statusPenilaian = req.query.statusPenilaian as string | undefined;
      const search = req.query.search as string | undefined;

      const data = await dplService.getProgramKerja(dplUserId, groupId, userRole, {
        kategori,
        statusUsulan,
        statusPelaksanaan,
        statusPenilaian,
        search,
      });
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
      const {
        kelompokId,
        nomor,
        deskripsi,
        kategori,
        sumber,
        waktuPelaksanaan,
        linkGoogleDrive,
        kebutuhanBiaya,
        status,
        statusUsulan,
        statusPelaksanaan,
      } = req.body;
      if (!kelompokId || !deskripsi) {
        res
          .status(400)
          .json({ error: "BAD_REQUEST", message: "kelompokId dan deskripsi wajib diisi" });
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
        status,
        statusUsulan,
        statusPelaksanaan,
      });
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.createProgramKerja] error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({
          error: "FORBIDDEN_SCOPE",
          message: "Akses ditolak: Data ini bukan milik kelompok binaan Anda",
        });
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
      const {
        nomor,
        deskripsi,
        kategori,
        sumber,
        waktuPelaksanaan,
        linkGoogleDrive,
        kebutuhanBiaya,
        status,
        statusUsulan,
        statusPelaksanaan,
        catatanDpl,
      } = req.body;
      const data = await dplService.updateProgramKerja(id, dplUserId, userRole, {
        nomor: nomor !== undefined ? Number(nomor) : undefined,
        deskripsi,
        kategori,
        sumber,
        waktuPelaksanaan,
        linkGoogleDrive,
        kebutuhanBiaya: kebutuhanBiaya !== undefined ? Number(kebutuhanBiaya) : undefined,
        status,
        statusUsulan,
        statusPelaksanaan,
        catatanDpl,
      });
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.updateProgramKerja] error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({
          error: "FORBIDDEN_SCOPE",
          message: "Akses ditolak: Data ini bukan milik kelompok binaan Anda",
        });
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
        res.status(403).json({
          error: "FORBIDDEN_SCOPE",
          message: "Akses ditolak: Data ini bukan milik kelompok binaan Anda",
        });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  decideProgramKerja: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const id = req.params.id;
      const { status, statusUsulan, statusPelaksanaan, catatanDpl } = req.body;
      const effectiveStatus = status || statusUsulan || "DISETUJUI";
      const data = await dplService.decideProgramKerja(
        dplUserId,
        id,
        effectiveStatus as any,
        catatanDpl,
        userRole,
        statusPelaksanaan
      );
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.decideProgramKerja] error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({
          error: "FORBIDDEN_SCOPE",
          message: "Akses ditolak: Data ini bukan milik kelompok binaan Anda",
        });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  assessProgramKerja: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const id = req.params.id;
      const {
        skorPenilaian,
        evaluasiDpl,
        aspekPenilaian,
        predikat,
        statusPenilaian,
        statusPelaksanaan,
      } = req.body;
      if (skorPenilaian === undefined || isNaN(Number(skorPenilaian))) {
        res
          .status(400)
          .json({ error: "BAD_REQUEST", message: "skorPenilaian (angka 0-100) wajib diisi" });
        return;
      }
      const data = await dplService.assessProgramKerja(
        dplUserId,
        id,
        Number(skorPenilaian),
        evaluasiDpl,
        userRole,
        aspekPenilaian,
        predikat,
        statusPenilaian,
        statusPelaksanaan
      );
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.assessProgramKerja] error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({
          error: "FORBIDDEN_SCOPE",
          message: "Akses ditolak: Data ini bukan milik kelompok binaan Anda",
        });
        return;
      }
      if (error.message === "PROKER_REJECTED") {
        res.status(400).json({
          error: "BAD_REQUEST",
          message: "Program kerja yang ditolak tidak dapat dinilai",
        });
        return;
      }
      if (error.message === "PROKER_NOT_APPROVED") {
        res.status(400).json({
          error: "BAD_REQUEST",
          message: "Hanya program kerja yang telah disetujui yang dapat dinilai",
        });
        return;
      }
      if (error.message === "PROKER_NOT_STARTED") {
        res.status(400).json({
          error: "BAD_REQUEST",
          message:
            "Program kerja belum dimulai oleh mahasiswa. Penilaian hanya dapat dilakukan untuk program kerja yang sedang berjalan atau telah selesai.",
        });
        return;
      }
      if (error.message?.startsWith("PROKER_ATTACHMENT_REQUIRED")) {
        res.status(400).json({
          error: "BAD_REQUEST",
          message: error.message,
        });
        return;
      }
      if (error.message === "PROKER_NOT_COMPLETED") {
        res.status(400).json({
          error: "BAD_REQUEST",
          message: "Hanya program kerja yang telah selesai pelaksanaannya yang dapat dinilai",
        });
        return;
      }
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getProgramKerjaBukti: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const id = req.params.id;
      const data = await dplService.getProgramKerjaBukti(dplUserId, id, userRole);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.getProgramKerjaBukti] error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({
          error: "FORBIDDEN_SCOPE",
          message: "Akses ditolak: Data ini bukan milik kelompok binaan Anda",
        });
        return;
      }
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
      const {
        targetTotalKegiatan,
        targetTotalJam,
        targetHarianJam,
        targetHarianKegiatan,
        attendanceMinDurationHours,
        attendanceMinDurationMinutes,
        attendanceMinDurationSeconds,
        hariKerja,
        jamKerja,
        targetPekan,
        targetTotalHari,
        catatanDpl,
      } = req.body;
      const data = await dplService.updateConfigTargets({
        targetTotalKegiatan:
          targetTotalKegiatan !== undefined ? Number(targetTotalKegiatan) : undefined,
        targetTotalJam: targetTotalJam !== undefined ? Number(targetTotalJam) : undefined,
        targetHarianJam: targetHarianJam !== undefined ? Number(targetHarianJam) : undefined,
        targetHarianKegiatan:
          targetHarianKegiatan !== undefined ? Number(targetHarianKegiatan) : undefined,
        attendanceMinDurationHours:
          attendanceMinDurationHours !== undefined ? Number(attendanceMinDurationHours) : undefined,
        attendanceMinDurationMinutes:
          attendanceMinDurationMinutes !== undefined
            ? Number(attendanceMinDurationMinutes)
            : undefined,
        attendanceMinDurationSeconds:
          attendanceMinDurationSeconds !== undefined
            ? Number(attendanceMinDurationSeconds)
            : undefined,
        hariKerja: hariKerja !== undefined ? String(hariKerja) : undefined,
        jamKerja: jamKerja !== undefined ? String(jamKerja) : undefined,
        targetPekan: targetPekan !== undefined ? Number(targetPekan) : undefined,
        targetTotalHari: targetTotalHari !== undefined ? Number(targetTotalHari) : undefined,
        catatanDpl: catatanDpl !== undefined ? String(catatanDpl) : undefined,
        updatedBy: user?.name || user?.userId || "DPL",
      });
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.updateConfigTargets] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  // ─────────────────────────────────────────────
  // 12. LOG AKTIVITAS DPL (WEB ENTRY & MONITORING)
  // ─────────────────────────────────────────────
  getDplActivityLogs: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;
      const { search, groupId, kategori, status, pekanKe, page, limit } = req.query;

      const data = await dplService.getDplActivityLogs(dplUserId, userRole, {
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
      console.error("[dplController.getDplActivityLogs] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  createDplActivityLog: async (req: Request, res: Response): Promise<void> => {
    try {
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;

      const uploadedUrls = extractUploadedFileUrls(req);
      let fotoBuktiUrl: string | undefined = undefined;

      if (uploadedUrls.length > 0) {
        fotoBuktiUrl = uploadedUrls.length === 1 ? uploadedUrls[0] : uploadedUrls.join(",");
      } else {
        const bodyFoto =
          req.body.fotoBuktiUrl ||
          req.body.fotoUrl ||
          req.body.evidencePhotoUrl ||
          req.body.fotoDokumentasiUrl ||
          req.body.fileUrl ||
          req.body.buktiUrl;
        if (
          bodyFoto &&
          typeof bodyFoto === "string" &&
          bodyFoto.trim() !== "" &&
          bodyFoto !== "null"
        ) {
          fotoBuktiUrl = bodyFoto.trim();
        }
      }

      const {
        kelompokId,
        tanggal,
        pekanKe,
        waktuMulai,
        waktuSelesai,
        kategori,
        tempat,
        lokasi,
        programKerjaId,
        deskripsi,
        hasilTindakLanjut,
        arahanEvaluasi,
        simpanLokasi,
        status,
      } = req.body;

      const data = await dplService.createDplActivityLog(dplUserId, userRole, {
        kelompokId,
        tanggal: tanggal || new Date().toISOString().split("T")[0],
        pekanKe: pekanKe ? Number(pekanKe) : undefined,
        waktuMulai,
        waktuSelesai,
        kategori,
        tempat,
        lokasi,
        programKerjaId,
        deskripsi,
        hasilTindakLanjut,
        arahanEvaluasi,
        fotoBuktiUrl,
        simpanLokasi:
          simpanLokasi === undefined
            ? true
            : String(simpanLokasi) === "true" || simpanLokasi === true,
        status,
      });

      res.status(201).json({
        success: true,
        message:
          status === "DRAF"
            ? "Draf aktivitas DPL berhasil disimpan"
            : "Aktivitas DPL berhasil dikirim",
        data,
      });
    } catch (error: any) {
      console.error("[dplController.createDplActivityLog] error:", error);
      res
        .status(400)
        .json({ error: "BAD_REQUEST", message: error.message || "Gagal menyimpan aktivitas DPL" });
    }
  },

  updateDplActivityLog: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;

      const uploadedUrls = extractUploadedFileUrls(req);
      let fotoBuktiUrl: string | undefined = undefined;

      if (uploadedUrls.length > 0) {
        fotoBuktiUrl = uploadedUrls.length === 1 ? uploadedUrls[0] : uploadedUrls.join(",");
      } else if (req.body.fotoBuktiUrl !== undefined) {
        fotoBuktiUrl = req.body.fotoBuktiUrl ? String(req.body.fotoBuktiUrl).trim() : "";
      } else {
        const bodyFoto =
          req.body.fotoUrl ||
          req.body.evidencePhotoUrl ||
          req.body.fotoDokumentasiUrl ||
          req.body.fileUrl ||
          req.body.buktiUrl;
        if (
          bodyFoto &&
          typeof bodyFoto === "string" &&
          bodyFoto.trim() !== "" &&
          bodyFoto !== "null"
        ) {
          fotoBuktiUrl = bodyFoto.trim();
        }
      }

      const {
        kelompokId,
        tanggal,
        pekanKe,
        waktuMulai,
        waktuSelesai,
        kategori,
        tempat,
        lokasi,
        programKerjaId,
        deskripsi,
        hasilTindakLanjut,
        arahanEvaluasi,
        simpanLokasi,
        status,
      } = req.body;

      const data = await dplService.updateDplActivityLog(id, dplUserId, userRole, {
        kelompokId,
        tanggal,
        pekanKe: pekanKe !== undefined ? Number(pekanKe) : undefined,
        waktuMulai,
        waktuSelesai,
        kategori,
        tempat,
        lokasi,
        programKerjaId,
        deskripsi,
        hasilTindakLanjut,
        arahanEvaluasi,
        fotoBuktiUrl,
        simpanLokasi:
          simpanLokasi === undefined
            ? undefined
            : String(simpanLokasi) === "true" || simpanLokasi === true,
        status,
      });

      res.json({
        success: true,
        message: "Aktivitas DPL berhasil diperbarui",
        data,
      });
    } catch (error: any) {
      console.error("[dplController.updateDplActivityLog] error:", error);
      res.status(400).json({
        error: "BAD_REQUEST",
        message: error.message || "Gagal memperbarui aktivitas DPL",
      });
    }
  },

  deleteDplActivityLog: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const dplUserId = getUserId(req);
      const userRole = (req.user as any)?.role;

      const data = await dplService.deleteDplActivityLog(id, dplUserId, userRole);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[dplController.deleteDplActivityLog] error:", error);
      res
        .status(400)
        .json({ error: "BAD_REQUEST", message: error.message || "Gagal menghapus aktivitas DPL" });
    }
  },
};
