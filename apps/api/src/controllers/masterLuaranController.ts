import { prisma } from "../lib/prisma.js";
import { Request, Response } from "express";

export const masterLuaranController = {
  getAll: async (req: Request, res: Response): Promise<void> => {
    try {
      const kategori = req.query.kategori as string | undefined;
      const isActive =
        req.query.isActive === "true"
          ? true
          : req.query.isActive === "false"
            ? false
            : undefined;

      const data = await prisma.masterLuaranSampah.findMany({
        where: {
          ...(kategori && kategori !== "ALL" ? { kategori } : {}),
          ...(isActive !== undefined ? { isActive } : {}),
        },
        orderBy: { id: "asc" },
      });
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[masterLuaranController.getAll] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: "BAD_REQUEST", message: "ID tidak valid" });
        return;
      }

      const data = await prisma.masterLuaranSampah.findUnique({ where: { id } });
      if (!data) {
        res.status(404).json({ error: "NOT_FOUND", message: "Master luaran tidak ditemukan" });
        return;
      }
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[masterLuaranController.getById] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const { nama, kategori, satuanDefault, deskripsi, isActive } = req.body;
      if (!nama || typeof nama !== "string" || !nama.trim()) {
        res.status(400).json({ error: "BAD_REQUEST", message: "Nama produk luaran wajib diisi" });
        return;
      }

      const existing = await prisma.masterLuaranSampah.findUnique({
        where: { nama: nama.trim() },
      });
      if (existing) {
        res.status(409).json({ error: "CONFLICT", message: "Nama produk luaran ini sudah terdaftar" });
        return;
      }

      const data = await prisma.masterLuaranSampah.create({
        data: {
          nama: nama.trim(),
          kategori: kategori || "ORGANIK",
          satuanDefault: satuanDefault || "Kg",
          deskripsi: deskripsi || null,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error("[masterLuaranController.create] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: "BAD_REQUEST", message: "ID tidak valid" });
        return;
      }

      const { nama, kategori, satuanDefault, deskripsi, isActive } = req.body;
      const existing = await prisma.masterLuaranSampah.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: "NOT_FOUND", message: "Master luaran tidak ditemukan" });
        return;
      }

      const data = await prisma.masterLuaranSampah.update({
        where: { id },
        data: {
          ...(nama ? { nama: nama.trim() } : {}),
          ...(kategori ? { kategori } : {}),
          ...(satuanDefault ? { satuanDefault } : {}),
          ...(deskripsi !== undefined ? { deskripsi } : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        },
      });
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[masterLuaranController.update] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: "BAD_REQUEST", message: "ID tidak valid" });
        return;
      }

      await prisma.masterLuaranSampah.delete({ where: { id } });
      res.json({ success: true, message: "Master luaran berhasil dihapus" });
    } catch (error: any) {
      console.error("[masterLuaranController.delete] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },
};
