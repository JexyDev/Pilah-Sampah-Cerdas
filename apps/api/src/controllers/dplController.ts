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

      if (!["APPROVED", "REJECTED"].includes(status)) {
        res
          .status(400)
          .json({ error: "BAD_REQUEST", message: "Status harus APPROVED atau REJECTED" });
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
};
