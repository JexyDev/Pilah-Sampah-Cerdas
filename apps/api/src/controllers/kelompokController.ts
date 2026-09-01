import { Request, Response } from "express";
import { kelompokService } from "../services/kelompokService.js";

export const kelompokController = {
  getAll: async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = req.query.limit !== undefined ? parseInt(req.query.limit as string) : 0;
      const search = (req.query.search as string) || "";
      const kelurahan = (req.query.kelurahan as string) || "";
      let dplUserId = "";
      const rawRole = (req as any).user?.role;
      const roleName = String(
        typeof rawRole === "object" ? rawRole?.name : rawRole || ""
      ).toUpperCase();
      if (roleName === "DPL" || roleName === "DOSEN_PEMBIMBING") {
        dplUserId = (req as any).user?.userId || (req as any).user?.id || "";
      }

      const result = await kelompokService.getAllKelompok(
        page,
        limit,
        search,
        kelurahan,
        dplUserId,
        (req as any).user
      );
      res.status(200).json({ success: true, ...result, data: result.groups });
    } catch (error) {
      console.error("[KelompokController] getAll error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await kelompokService.getKelompokById(id);
      if (!result) {
        res.status(404).json({ success: false, message: "Kelompok not found" });
        return;
      }
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error("[KelompokController] getById error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, dplId, kelurahan, cakupanRw } = req.body;
      if (!name) {
        res.status(400).json({ error: "BAD_REQUEST", message: "Nama kelompok wajib diisi" });
        return;
      }

      const result = await kelompokService.createKelompok({ name, dplId, kelurahan, cakupanRw });
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[KelompokController] create error:", error);
      res.status(500).json({
        success: false,
        message:
          error.code === "P2002"
            ? "Nama kelompok sudah digunakan"
            : error.message || "Failed to create kelompok",
      });
    }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, dplId, kelurahan, cakupanRw } = req.body;
      const result = await kelompokService.updateKelompok(id, {
        name,
        dplId,
        kelurahan,
        cakupanRw,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[KelompokController] update error:", error);
      res.status(500).json({
        success: false,
        message:
          error.code === "P2002"
            ? "Nama kelompok sudah digunakan"
            : error.message || "Failed to update kelompok",
      });
    }
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await kelompokService.deleteKelompok(id);
      res.status(200).json({ success: true, message: "Kelompok berhasil dihapus" });
    } catch (error: any) {
      console.error("[KelompokController] delete error:", error);
      res.status(500).json({
        success: false,
        message:
          error.message === "CANNOT_DELETE_KELOMPOK_WITH_STUDENTS"
            ? "Tidak dapat menghapus kelompok yang memiliki anggota mahasiswa"
            : "Failed to delete kelompok",
      });
    }
  },

  getDpls: async (req: Request, res: Response): Promise<void> => {
    try {
      const dpls = await kelompokService.getDplList();
      res.status(200).json({ success: true, data: dpls });
    } catch (error) {
      console.error("[KelompokController] getDpls error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  setLeader: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { studentId } = req.body;
      const targetId = studentId && studentId !== "NONE" ? studentId : null;
      const updated = await kelompokService.setLeader(id, targetId);
      res.status(200).json({
        success: true,
        message: targetId
          ? "Ketua kelompok berhasil diperbarui"
          : "Ketua kelompok berhasil dilepas",
        data: updated,
      });
    } catch (error: any) {
      console.error("[KelompokController] setLeader error:", error);
      res
        .status(500)
        .json({ success: false, message: error.message || "Gagal memperbarui ketua kelompok" });
    }
  },

  /**
   * PUT /:id/assign-dpl
   * Body: { dplId: string | null }
   * Tautkan 1 DPL ke kelompok. dplId null = lepas DPL.
   */
  assignDpl: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { dplId } = req.body;

      const result = await kelompokService.assignDpl(id, dplId || null);
      res.status(200).json({
        success: true,
        message: dplId
          ? "DPL berhasil ditautkan ke kelompok"
          : "DPL berhasil dilepas dari kelompok",
        data: result,
      });
    } catch (error: any) {
      console.error("[KelompokController] assignDpl error:", error);
      const msg =
        error.message === "DPL_NOT_FOUND"
          ? "User DPL tidak ditemukan atau bukan role DPL"
          : error.message || "Gagal menautkan DPL";
      res
        .status(error.message === "DPL_NOT_FOUND" ? 404 : 500)
        .json({ success: false, message: msg });
    }
  },

  /**
   * PUT /:id/assign-rw
   * Body: { rwIds: number[] }
   * Hubungkan 1 kelompok ke multi-RW.
   */
  assignRw: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { rwIds } = req.body;

      if (!Array.isArray(rwIds)) {
        res.status(400).json({ success: false, message: "rwIds harus berupa array of number" });
        return;
      }

      const result = await kelompokService.assignRw(id, rwIds);
      res.status(200).json({
        success: true,
        message: "Cakupan RW kelompok berhasil diperbarui",
        data: result,
      });
    } catch (error: any) {
      console.error("[KelompokController] assignRw error:", error);
      res.status(500).json({ success: false, message: error.message || "Gagal memperbarui RW" });
    }
  },

  /**
   * PATCH /:id/mahasiswa/:studentKknId/pindah
   * Body: { targetKelompokId: string }
   * Memindahkan mahasiswa dari kelompok lama ke kelompok baru.
   */
  pindahMahasiswa: async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentKknId } = req.params;
      const { targetKelompokId } = req.body;

      if (!targetKelompokId) {
        res.status(400).json({ success: false, message: "targetKelompokId wajib diisi" });
        return;
      }

      const result = await kelompokService.pindahMahasiswa(studentKknId, targetKelompokId);
      res.status(200).json({
        success: true,
        message: `Mahasiswa berhasil dipindahkan ke kelompok ${result.kelompok?.name}`,
        data: result,
      });
    } catch (error: any) {
      console.error("[KelompokController] pindahMahasiswa error:", error);
      const errorMap: Record<string, [number, string]> = {
        STUDENT_KKN_NOT_FOUND: [404, "Data mahasiswa KKN tidak ditemukan"],
        TARGET_KELOMPOK_NOT_FOUND: [404, "Kelompok tujuan tidak ditemukan"],
      };
      const [status, msg] = errorMap[error.message] || [
        500,
        error.message || "Gagal memindahkan mahasiswa",
      ];
      res.status(status).json({ success: false, message: msg });
    }
  },
};
