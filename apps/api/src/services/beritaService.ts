/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Service Berita/Konten KKN — Sinkronisasi otomatis dengan Landing Page CMS & Kurasi Kegiatan
 */

import { systemService } from "./systemService.js";

/**
 * Normalisasi item berita agar mendukung format Landing Page (English)
 * sekaligus format CMS Manajemen Berita Web (Indonesia).
 */
function normalizeNewsItem(item: any) {
  const id = String(item.id || `news-${Date.now()}`);
  const title = item.title || item.judul || "Tanpa Judul";
  const slug = item.slug || item.id || id;
  const summary = item.summary || item.ringkasan || item.description || "";
  const content = item.content || item.konten || item.description || summary;
  const imageUrl = item.imageUrl || item.gambarUrl || "/image/activity-1.webp";
  const category = item.category || item.kategori || "KEGIATAN";
  const date = item.date || item.publishedAt || item.createdAt || new Date().toISOString();
  const readTime = item.readTime || "3 min baca";
  const location = item.location || "Kecamatan Coblong, Kota Bandung";
  const authorName =
    typeof item.author === "string"
      ? item.author
      : item.author?.name || "Tim Humas KKN UNIKOM";
  const author =
    typeof item.author === "object" && item.author !== null
      ? item.author
      : { id: "system", name: authorName };
  const isPublished =
    item.isPublished !== undefined
      ? Boolean(item.isPublished)
      : item.status
      ? item.status === "PUBLISHED"
      : true;
  const status = isPublished ? "PUBLISHED" : item.status || "DRAFT";
  const tags = Array.isArray(item.tags)
    ? item.tags.join(", ")
    : typeof item.tags === "string"
    ? item.tags
    : Array.isArray(item.sdgTags)
    ? item.sdgTags.join(", ")
    : "";

  return {
    id,
    slug,
    // Format Bahasa Indonesia (Kompatibilitas Web CMS & Manajemen Berita)
    judul: title,
    ringkasan: summary,
    konten: content,
    gambarUrl: imageUrl,
    kategori: category,
    status,
    publishedAt: date,
    viewCount: typeof item.viewCount === "number" ? item.viewCount : 0,
    tags,
    createdAt: item.createdAt || date,
    updatedAt: item.updatedAt || date,
    author,

    // Format Bahasa Inggris / Landing Page (Kompatibilitas Langsung Mobile & Landing Page)
    title,
    summary,
    content,
    imageUrl,
    category,
    date,
    readTime,
    location,
    isPublished,
    authorName,
  };
}

export class BeritaService {
  /**
   * Mengambil raw news items dari landing_cms_content dengan fallback ke kurasi default
   */
  private async getRawNews(): Promise<any[]> {
    try {
      const landingContent = await systemService.getLandingContent();
      if (Array.isArray(landingContent?.newsItems) && landingContent.newsItems.length > 0) {
        return landingContent.newsItems;
      }
    } catch (err) {
      console.warn("[BeritaService] Gagal membaca landing content, fallback ke curated activities:", err);
    }

    const fallback = await systemService.getCuratedLandingActivities();
    return (fallback || []).map((act: any) => ({
      id: act.id,
      title: act.title,
      summary: act.description,
      content: act.description,
      imageUrl: act.imageUrl,
      category: act.category || "KEGIATAN",
      date: act.date,
      isPublished: true,
      sdgTags: act.sdgTags,
    }));
  }

  /**
   * Ambil daftar berita published (Publik untuk Mobile & Landing Page)
   */
  async getPublishedList(opts?: {
    kategori?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const rawList = await this.getRawNews();
    let normalized = rawList.map(normalizeNewsItem);

    // Filter hanya yang dipublikasikan
    normalized = normalized.filter((item) => item.isPublished === true || item.status === "PUBLISHED");

    // Filter kategori jika diberikan
    if (opts?.kategori && opts.kategori !== "Semua") {
      const katLower = opts.kategori.toLowerCase();
      normalized = normalized.filter(
        (item) => item.category.toLowerCase() === katLower || item.kategori.toLowerCase() === katLower
      );
    }

    // Filter pencarian teks
    if (opts?.search && opts.search.trim() !== "") {
      const q = opts.search.toLowerCase().trim();
      normalized = normalized.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          item.authorName.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q)
      );
    }

    const total = normalized.length;
    const offset = opts?.offset || 0;
    const limit = opts?.limit || 12;
    const items = normalized.slice(offset, offset + limit);

    return { total, items };
  }

  /**
   * Ambil detail satu berita berdasarkan slug atau ID
   */
  async getBySlug(slug: string) {
    const rawList = await this.getRawNews();
    const found = rawList.find(
      (item: any) =>
        String(item.id) === slug ||
        String(item.slug) === slug ||
        (item.title && item.title.toLowerCase() === slug.toLowerCase()) ||
        (item.judul && item.judul.toLowerCase() === slug.toLowerCase())
    );

    if (!found) {
      throw new Error("BERITA_NOT_FOUND");
    }

    const normalized = normalizeNewsItem(found);
    normalized.viewCount = (normalized.viewCount || 0) + 1;
    return normalized;
  }

  /**
   * Ambil semua berita (Admin / CMS)
   */
  async getAdminList(opts?: {
    status?: string;
    kategori?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const rawList = await this.getRawNews();
    let normalized = rawList.map(normalizeNewsItem);

    if (opts?.status && opts.status !== "ALL") {
      normalized = normalized.filter((item) => item.status === opts.status);
    }

    if (opts?.kategori && opts.kategori !== "Semua") {
      const katLower = opts.kategori.toLowerCase();
      normalized = normalized.filter(
        (item) => item.category.toLowerCase() === katLower || item.kategori.toLowerCase() === katLower
      );
    }

    if (opts?.search && opts.search.trim() !== "") {
      const q = opts.search.toLowerCase().trim();
      normalized = normalized.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.authorName.toLowerCase().includes(q)
      );
    }

    const total = normalized.length;
    const offset = opts?.offset || 0;
    const limit = opts?.limit || 20;
    const items = normalized.slice(offset, offset + limit);

    return { total, items };
  }

  /**
   * Ambil detail berita by ID (Admin)
   */
  async getById(id: string) {
    return this.getBySlug(id);
  }

  /**
   * Buat berita baru dan simpan ke landing_cms_content
   */
  async create(authorId: string, payload: any) {
    const landingContent = await systemService.getLandingContent();
    const currentNews = Array.isArray(landingContent?.newsItems) ? [...landingContent.newsItems] : [];

    const newId = `news-${Date.now()}`;
    const newItem = {
      id: newId,
      title: payload.judul || payload.title || "Berita Baru",
      category: payload.kategori || payload.category || "KEGIATAN",
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      readTime: payload.readTime || "3 min baca",
      location: payload.location || "Kecamatan Coblong, Kota Bandung",
      imageUrl: payload.gambarUrl || payload.imageUrl || "/image/activity-1.webp",
      summary: payload.ringkasan || payload.summary || "",
      content: payload.konten || payload.content || "",
      author: payload.author || "Tim Humas KKN UNIKOM",
      isPublished: payload.status !== "DRAFT",
    };

    currentNews.unshift(newItem);
    await systemService.saveLandingContent(
      { ...landingContent, newsItems: currentNews },
      authorId || "Admin Berita"
    );

    return normalizeNewsItem(newItem);
  }

  /**
   * Update berita di landing_cms_content
   */
  async update(id: string, payload: any) {
    const landingContent = await systemService.getLandingContent();
    const currentNews = Array.isArray(landingContent?.newsItems) ? [...landingContent.newsItems] : [];

    const idx = currentNews.findIndex((n: any) => String(n.id) === String(id));
    if (idx === -1) {
      throw new Error("BERITA_NOT_FOUND");
    }

    const updated = {
      ...currentNews[idx],
      title: payload.judul ?? payload.title ?? currentNews[idx].title,
      category: payload.kategori ?? payload.category ?? currentNews[idx].category,
      imageUrl: payload.gambarUrl ?? payload.imageUrl ?? currentNews[idx].imageUrl,
      summary: payload.ringkasan ?? payload.summary ?? currentNews[idx].summary,
      content: payload.konten ?? payload.content ?? currentNews[idx].content,
      location: payload.location ?? currentNews[idx].location,
      author: payload.author ?? currentNews[idx].author,
      isPublished:
        payload.status !== undefined
          ? payload.status === "PUBLISHED"
          : currentNews[idx].isPublished,
    };

    currentNews[idx] = updated;
    await systemService.saveLandingContent(
      { ...landingContent, newsItems: currentNews },
      "Admin Berita"
    );

    return normalizeNewsItem(updated);
  }

  /**
   * Publish atau unpublish / archive berita
   */
  async changeStatus(id: string, status: string) {
    const landingContent = await systemService.getLandingContent();
    const currentNews = Array.isArray(landingContent?.newsItems) ? [...landingContent.newsItems] : [];

    const idx = currentNews.findIndex((n: any) => String(n.id) === String(id));
    if (idx === -1) {
      throw new Error("BERITA_NOT_FOUND");
    }

    currentNews[idx].isPublished = status === "PUBLISHED";
    await systemService.saveLandingContent(
      { ...landingContent, newsItems: currentNews },
      "Admin Berita"
    );

    return normalizeNewsItem(currentNews[idx]);
  }

  /**
   * Hapus berita dari landing_cms_content
   */
  async delete(id: string) {
    const landingContent = await systemService.getLandingContent();
    const currentNews = Array.isArray(landingContent?.newsItems) ? [...landingContent.newsItems] : [];

    const filtered = currentNews.filter((n: any) => String(n.id) !== String(id));
    await systemService.saveLandingContent(
      { ...landingContent, newsItems: filtered },
      "Admin Berita"
    );

    return { deleted: true };
  }
}

export const beritaService = new BeritaService();

