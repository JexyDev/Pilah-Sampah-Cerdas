import { prisma } from "../lib/prisma.js";
import { Request, Response } from "express";

export const masterKegiatanController = {
  getAll: async (req: Request, res: Response): Promise<void> => {
    try {
      const kategori = req.query.kategori as string | undefined;
      const statusAktif =
        req.query.statusAktif === "true"
          ? true
          : req.query.statusAktif === "false"
            ? false
            : undefined;

      const data = await prisma.masterKegiatanSampah.findMany({
        where: {
          ...(kategori && kategori !== "ALL" ? { kategori } : {}),
          ...(statusAktif !== undefined ? { statusAktif } : {}),
        },
        orderBy: { createdAt: "desc" },
      });
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[masterKegiatanController.getAll] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = await prisma.masterKegiatanSampah.findUnique({ where: { id } });
      if (!data) {
        res.status(404).json({ error: "NOT_FOUND", message: "Master kegiatan tidak ditemukan" });
        return;
      }
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[masterKegiatanController.getById] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const { nama, kategori, deskripsi, statusAktif } = req.body;
      if (!nama || !kategori) {
        res
          .status(400)
          .json({ error: "BAD_REQUEST", message: "Nama dan kategori kegiatan wajib diisi" });
        return;
      }

      const existing = await prisma.masterKegiatanSampah.findUnique({ where: { nama } });
      if (existing) {
        res
          .status(409)
          .json({ error: "CONFLICT", message: "Nama kegiatan ini sudah ada di master data" });
        return;
      }

      const data = await prisma.masterKegiatanSampah.create({
        data: {
          nama,
          kategori,
          deskripsi: deskripsi || null,
          statusAktif: statusAktif !== undefined ? Boolean(statusAktif) : true,
        },
      });
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error("[masterKegiatanController.create] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { nama, kategori, deskripsi, statusAktif } = req.body;

      const data = await prisma.masterKegiatanSampah.update({
        where: { id },
        data: {
          ...(nama !== undefined ? { nama } : {}),
          ...(kategori !== undefined ? { kategori } : {}),
          ...(deskripsi !== undefined ? { deskripsi } : {}),
          ...(statusAktif !== undefined ? { statusAktif: Boolean(statusAktif) } : {}),
        },
      });
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[masterKegiatanController.update] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await prisma.masterKegiatanSampah.delete({ where: { id } });
      res.json({ success: true, message: "Master kegiatan berhasil dihapus" });
    } catch (error: any) {
      console.error("[masterKegiatanController.delete] error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  },
};
