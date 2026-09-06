/**
 * Project: BERSEKA
 * Controller Berita/Konten KKN — CMS News Management
 */

import { Request, Response } from "express";
import { beritaService } from "../services/beritaService.js";

function getUserId(req: Request): string {
  return req.user?.userId || (req.user as any)?.id || "";
}

export const beritaController = {
  /**
   * [PUBLIC] GET /api/v1/berita
   * Daftar berita published — untuk landing page
   */
  getPublishedList: async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 12, 50);
      const offset = parseInt(req.query.offset as string) || 0;
      const { kategori, search } = req.query;

      const data = await beritaService.getPublishedList({
        kategori: kategori as string,
        limit,
        offset,
        search: search as string,
      });

      res.json({ success: true, ...data });
    } catch (error: any) {
      console.error("[beritaController.getPublishedList]", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * [PUBLIC] GET /api/v1/berita/:slug
   * Detail berita by slug — increment view count
   */
  getBySlug: async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await beritaService.getBySlug(req.params.slug);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error.message === "BERITA_NOT_FOUND") {
        res.status(404).json({ success: false, message: "Berita tidak ditemukan" });
        return;
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * [ADMIN] GET /api/v1/berita/admin/list
   * Semua berita (semua status) — untuk dashboard admin
   */
  getAdminList: async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      const { status, kategori, search } = req.query;

      const data = await beritaService.getAdminList({
        status: status as string,
        kategori: kategori as string,
        limit,
        offset,
        search: search as string,
      });

      res.json({ success: true, ...data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * [ADMIN] GET /api/v1/berita/admin/:id
   * Detail berita by ID — untuk form edit
   */
  getById: async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await beritaService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error.message === "BERITA_NOT_FOUND") {
        res.status(404).json({ success: false, message: "Berita tidak ditemukan" });
        return;
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * [ADMIN] POST /api/v1/berita
   * Buat berita baru
   */
  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const authorId = getUserId(req);

      // Handle optional file upload for gambar
      let gambarUrl = req.body.gambarUrl || null;
      if (req.file) {
        gambarUrl = `/uploads/${req.file.filename}`;
      }

      const data = await beritaService.create(authorId, {
        judul: req.body.judul,
        konten: req.body.konten,
        ringkasan: req.body.ringkasan,
        gambarUrl,
        kategori: req.body.kategori,
        tags: req.body.tags,
        kelompokId: req.body.kelompokId,
        status: req.body.status,
      });

      res.status(201).json({
        success: true,
        message: `Berita berhasil ${data.status === "PUBLISHED" ? "diterbitkan" : "disimpan sebagai draft"}.`,
        data,
      });
    } catch (error: any) {
      console.error("[beritaController.create]", error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * [ADMIN] PUT /api/v1/berita/:id
   * Update konten berita
   */
  update: async (req: Request, res: Response): Promise<void> => {
    try {
      let gambarUrl = req.body.gambarUrl;
      if (req.file) {
        gambarUrl = `/uploads/${req.file.filename}`;
      }

      const data = await beritaService.update(req.params.id, {
        judul: req.body.judul,
        konten: req.body.konten,
        ringkasan: req.body.ringkasan,
        gambarUrl,
        kategori: req.body.kategori,
        tags: req.body.tags,
        kelompokId: req.body.kelompokId,
      });

      res.json({ success: true, message: "Berita berhasil diperbarui.", data });
    } catch (error: any) {
      if (error.message === "BERITA_NOT_FOUND") {
        res.status(404).json({ success: false, message: "Berita tidak ditemukan" });
        return;
      }
      res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * [ADMIN] PATCH /api/v1/berita/:id/status
   * Ubah status: DRAFT → PUBLISHED, PUBLISHED → ARCHIVED, dst.
   */
  changeStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.body;

      if (!["PUBLISHED", "DRAFT", "ARCHIVED"].includes(status)) {
        res.status(400).json({
          success: false,
          message: "Status harus PUBLISHED, DRAFT, atau ARCHIVED",
        });
        return;
      }

      const data = await beritaService.changeStatus(req.params.id, status);

      const msg =
        status === "PUBLISHED"
          ? "Berita berhasil diterbitkan dan tampil di landing page."
          : status === "ARCHIVED"
            ? "Berita berhasil diarsipkan."
            : "Berita dikembalikan ke draft.";

      res.json({ success: true, message: msg, data });
    } catch (error: any) {
      if (error.message === "BERITA_NOT_FOUND") {
        res.status(404).json({ success: false, message: "Berita tidak ditemukan" });
        return;
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * [ADMIN] DELETE /api/v1/berita/:id
   * Hapus berita permanen
   */
  delete: async (req: Request, res: Response): Promise<void> => {
    try {
      await beritaService.delete(req.params.id);
      res.json({ success: true, message: "Berita berhasil dihapus." });
    } catch (error: any) {
      if (error.message === "BERITA_NOT_FOUND") {
        res.status(404).json({ success: false, message: "Berita tidak ditemukan" });
        return;
      }
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
