import { prisma } from "../lib/prisma.js";
import { Request, Response } from "express";

export const panduanController = {
  getAll: async (req: Request, res: Response): Promise<void> => {
    try {
      const kategoriRole = req.query.kategoriRole as string | undefined;
      const data = await prisma.panduan.findMany({
        where: kategoriRole && kategoriRole !== "ALL" ? { kategoriRole } : undefined,
        orderBy: { createdAt: "desc" },
      });
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[panduanController.getAll] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await prisma.panduan.findUnique({ where: { id } });
      if (!data) {
        res.status(404).json({ error: "NOT_FOUND", message: "Dokumen panduan tidak ditemukan" });
        return;
      }
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[panduanController.getById] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const { judul, kategoriRole, deskripsi, fileUrl, linkUrl } = req.body;
      if (!judul || !kategoriRole) {
        res
          .status(400)
          .json({ error: "BAD_REQUEST", message: "Judul dan kategori peran wajib diisi" });
        return;
      }

      const data = await prisma.panduan.create({
        data: {
          judul,
          kategoriRole,
          deskripsi: deskripsi || null,
          fileUrl: fileUrl || null,
          linkUrl: linkUrl || null,
        },
      });
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error("[panduanController.create] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { judul, kategoriRole, deskripsi, fileUrl, linkUrl } = req.body;

      const data = await prisma.panduan.update({
        where: { id },
        data: {
          ...(judul !== undefined ? { judul } : {}),
          ...(kategoriRole !== undefined ? { kategoriRole } : {}),
          ...(deskripsi !== undefined ? { deskripsi } : {}),
          ...(fileUrl !== undefined ? { fileUrl } : {}),
          ...(linkUrl !== undefined ? { linkUrl } : {}),
        },
      });
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[panduanController.update] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await prisma.panduan.delete({ where: { id } });
      res.json({ success: true, message: "Dokumen panduan berhasil dihapus" });
    } catch (error: any) {
      console.error("[panduanController.delete] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },
};
