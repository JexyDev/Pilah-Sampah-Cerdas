import { Request, Response } from "express";
import { kelompokService } from "../services/kelompokService.js";

export const kelompokController = {
  getAll: async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = req.query.limit !== undefined ? parseInt(req.query.limit as string) : 0;
      const search = (req.query.search as string) || "";
      const kelurahan = (req.query.kelurahan as string) || "";

      const result = await kelompokService.getAllKelompok(page, limit, search, kelurahan);
      res.status(200).json({ success: true, ...result });
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
      if (!studentId) {
        res.status(400).json({ success: false, message: "studentId wajib diisi" });
        return;
      }
      const updated = await kelompokService.setLeader(id, studentId);
      res
        .status(200)
        .json({ success: true, message: "Ketua kelompok berhasil diperbarui", data: updated });
    } catch (error: any) {
      console.error("[KelompokController] setLeader error:", error);
      res
        .status(500)
        .json({ success: false, message: error.message || "Gagal memperbarui ketua kelompok" });
    }
  },
};
