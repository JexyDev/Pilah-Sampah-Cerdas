import { Request, Response } from "express";
import { adminMahasiswaService } from "../services/adminMahasiswaService.js";

export const adminMahasiswaController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";

      const result = await adminMahasiswaService.getAllMahasiswa(page, limit, search, (req as any).user);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      console.error("[AdminMahasiswa] getAll error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { nama_lengkap, nim, universitas, no_telepon, area_tugas, status_aktif } = req.body;
      if (!nama_lengkap || !nim || !no_telepon) {
        res.status(400).json({ success: false, message: "Nama, NIM, dan No Telepon wajib diisi" });
        return;
      }

      const result = await adminMahasiswaService.createMahasiswa({
        nama_lengkap,
        nim,
        universitas,
        no_telepon,
        area_tugas,
        status_aktif,
      });
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[AdminMahasiswa] create error:", error);
      res
        .status(500)
        .json({ success: false, message: error.message || "Failed to create mahasiswa" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const result = await adminMahasiswaService.updateMahasiswa(id, data);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[AdminMahasiswa] update error:", error);
      res
        .status(500)
        .json({ success: false, message: error.message || "Failed to update mahasiswa" });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await adminMahasiswaService.deleteMahasiswa(id);
      res.status(200).json({ success: true, message: "Mahasiswa berhasil dinonaktifkan" });
    } catch (error: any) {
      console.error("[AdminMahasiswa] delete error:", error);
      res
        .status(500)
        .json({ success: false, message: error.message || "Failed to delete mahasiswa" });
    }
  },
};
