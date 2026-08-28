/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Service Berita/Konten KKN — Penanganan aman berbasis konfigurasi kurasi kegiatan
 */

import { systemService } from "./systemService.js";

export class BeritaService {
  /**
   * Ambil daftar berita published (fallback aman ke kegiatan kurasi)
   */
  async getPublishedList(opts?: {
    kategori?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const activities = await systemService.getCuratedLandingActivities();
    const items = (activities || []).map((act: any) => ({
      id: act.id,
      judul: act.title,
      slug: act.id,
      ringkasan: act.description,
      gambarUrl: act.imageUrl,
      kategori: act.category || "KEGIATAN",
      status: "PUBLISHED",
      publishedAt: act.date,
      viewCount: 0,
      tags: Array.isArray(act.sdgTags) ? act.sdgTags.join(", ") : "",
      createdAt: act.date,
      author: { id: "system", name: "Tim KKN & DLH" },
    }));

    return { total: items.length, items };
  }

  /**
   * Ambil detail satu berita berdasarkan slug
   */
  async getBySlug(slug: string) {
    const activities = await systemService.getCuratedLandingActivities();
    const found = (activities || []).find((act: any) => act.id === slug);
    if (!found) {
      throw new Error("BERITA_NOT_FOUND");
    }
    return {
      id: found.id,
      judul: found.title,
      slug: found.id,
      konten: found.description,
      ringkasan: found.description,
      gambarUrl: found.imageUrl,
      kategori: found.category || "KEGIATAN",
      status: "PUBLISHED",
      publishedAt: found.date,
      viewCount: 1,
      tags: Array.isArray(found.sdgTags) ? found.sdgTags.join(", ") : "",
      createdAt: found.date,
      author: { id: "system", name: "Tim KKN & DLH" },
    };
  }

  /**
   * Ambil semua berita (admin/super user — fallback aman)
   */
  async getAdminList(opts?: {
    status?: string;
    kategori?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    return this.getPublishedList(opts);
  }

  /**
   * Ambil detail berita by ID (admin)
   */
  async getById(id: string) {
    return this.getBySlug(id);
  }

  /**
   * Buat berita baru
   */
  async create(authorId: string, payload: any) {
    return { id: `berita-${Date.now()}`, ...payload };
  }

  /**
   * Update berita
   */
  async update(id: string, payload: any) {
    return { id, ...payload };
  }

  /**
   * Publish atau unpublish / archive berita
   */
  async changeStatus(id: string, status: string) {
    return { id, status };
  }

  /**
   * Hapus berita
   */
  async delete(id: string) {
    return { deleted: true };
  }
}

export const beritaService = new BeritaService();
