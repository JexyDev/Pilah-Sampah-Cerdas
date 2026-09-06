/**
 * Project: BERSEKA
 * Web Service: Berita / Konten KKN
 * Melayani public listing (landing page) dan CRUD admin (CMS)
 */

import api from "../utils/api";

export type BeritaStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type BeritaKategori = "KEGIATAN" | "PENGUMUMAN" | "PRESTASI" | "LINGKUNGAN" | "UMUM";

export interface BeritaItem {
  id: string;
  judul: string;
  slug: string;
  ringkasan?: string | null;
  konten?: string | null;
  gambarUrl?: string | null;
  kategori: BeritaKategori;
  tags?: string[];
  status: BeritaStatus;
  viewCount: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string; nim?: string | null } | null;
  kelompok?: { id: string; name: string } | null;
}

export interface BeritaListResponse {
  data: BeritaItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateBeritaPayload {
  judul: string;
  konten: string;
  ringkasan?: string;
  gambarUrl?: string;
  kategori?: BeritaKategori;
  tags?: string[];
  kelompokId?: string;
  status?: BeritaStatus;
}

export const beritaService = {
  /**
   * [PUBLIC] Ambil daftar berita published — untuk landing page
   */
  getPublishedList: async (params?: {
    limit?: number;
    offset?: number;
    kategori?: string;
    search?: string;
  }): Promise<BeritaListResponse> => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    if (params?.kategori) query.set("kategori", params.kategori);
    if (params?.search) query.set("search", params.search);

    const res = await api.get(`/berita?${query.toString()}`);
    return res.data;
  },

  /**
   * [PUBLIC] Ambil detail berita by slug
   */
  getBySlug: async (slug: string): Promise<BeritaItem> => {
    const res = await api.get(`/berita/${slug}`);
    return res.data.data;
  },

  /**
   * [ADMIN] Ambil semua berita (semua status) — untuk CMS
   */
  getAdminList: async (params?: {
    limit?: number;
    offset?: number;
    status?: string;
    kategori?: string;
    search?: string;
  }): Promise<BeritaListResponse> => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    if (params?.status) query.set("status", params.status);
    if (params?.kategori) query.set("kategori", params.kategori);
    if (params?.search) query.set("search", params.search);

    const res = await api.get(`/berita/admin/list?${query.toString()}`);
    return res.data;
  },

  /**
   * [ADMIN] Ambil detail berita by ID
   */
  getById: async (id: string): Promise<BeritaItem> => {
    const res = await api.get(`/berita/admin/${id}`);
    return res.data.data;
  },

  /**
   * [ADMIN] Buat berita baru
   */
  create: async (payload: CreateBeritaPayload): Promise<BeritaItem> => {
    const res = await api.post("/berita", payload);
    return res.data.data;
  },

  /**
   * [ADMIN] Update konten berita
   */
  update: async (id: string, payload: Partial<CreateBeritaPayload>): Promise<BeritaItem> => {
    const res = await api.put(`/berita/${id}`, payload);
    return res.data.data;
  },

  /**
   * [ADMIN] Ubah status: DRAFT → PUBLISHED → ARCHIVED
   */
  changeStatus: async (id: string, status: BeritaStatus): Promise<BeritaItem> => {
    const res = await api.patch(`/berita/${id}/status`, { status });
    return res.data.data;
  },

  /**
   * [ADMIN] Hapus berita
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/berita/${id}`);
  },
};
