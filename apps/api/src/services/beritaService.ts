/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Service Berita/Konten KKN — CMS untuk mengelola berita kegiatan mahasiswa
 * yang tampil secara real-time di landing page.
 */

import { prisma } from "../lib/prisma.js";

function generateSlug(judul: string): string {
  const base = judul
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);
  return `${base}-${Date.now()}`;
}

export class BeritaService {
  /**
   * Ambil daftar berita published (untuk landing page — public)
   */
  async getPublishedList(opts: {
    kategori?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const { kategori, limit = 12, offset = 0, search } = opts;

    const where: any = { status: "PUBLISHED" };

    if (kategori && kategori !== "ALL") {
      where.kategori = kategori;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { judul: { contains: q, mode: "insensitive" } },
        { ringkasan: { contains: q, mode: "insensitive" } },
        { tags: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.beritaKonten.count({ where }),
      prisma.beritaKonten.findMany({
        where,
        select: {
          id: true,
          judul: true,
          slug: true,
          ringkasan: true,
          gambarUrl: true,
          kategori: true,
          status: true,
          publishedAt: true,
          viewCount: true,
          tags: true,
          createdAt: true,
          author: { select: { id: true, name: true } },
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
      }),
    ]);

    return { total, items };
  }

  /**
   * Ambil detail satu berita berdasarkan slug (increment view count)
   */
  async getBySlug(slug: string) {
    const berita = await prisma.beritaKonten.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, name: true, fotoProfil: true } },
      },
    });

    if (!berita || berita.status !== "PUBLISHED") {
      throw new Error("BERITA_NOT_FOUND");
    }

    // Increment view count (fire-and-forget, tidak blocking)
    prisma.beritaKonten
      .update({
        where: { id: berita.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    return berita;
  }

  /**
   * Ambil semua berita (admin/super user — semua status)
   */
  async getAdminList(opts: {
    status?: string;
    kategori?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const { status, kategori, limit = 20, offset = 0, search } = opts;

    const where: any = {};

    if (status && status !== "ALL") where.status = status;
    if (kategori && kategori !== "ALL") where.kategori = kategori;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { judul: { contains: q, mode: "insensitive" } },
        { ringkasan: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.beritaKonten.count({ where }),
      prisma.beritaKonten.findMany({
        where,
        include: {
          author: { select: { id: true, name: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        take: limit,
        skip: offset,
      }),
    ]);

    return { total, items };
  }

  /**
   * Ambil detail berita by ID (admin)
   */
  async getById(id: string) {
    const berita = await prisma.beritaKonten.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true } } },
    });
    if (!berita) throw new Error("BERITA_NOT_FOUND");
    return berita;
  }

  /**
   * Buat berita baru
   */
  async create(
    authorId: string,
    payload: {
      judul: string;
      konten: string;
      ringkasan?: string;
      gambarUrl?: string;
      kategori?: string;
      tags?: string;
      kelompokId?: string;
      status?: string; // DRAFT | PUBLISHED
    }
  ) {
    if (!payload.judul?.trim()) throw new Error("Judul berita wajib diisi");
    if (!payload.konten?.trim()) throw new Error("Konten berita wajib diisi");

    const slug = generateSlug(payload.judul.trim());
    const status = payload.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
    const publishedAt = status === "PUBLISHED" ? new Date() : null;

    return prisma.beritaKonten.create({
      data: {
        judul: payload.judul.trim(),
        slug,
        konten: payload.konten.trim(),
        ringkasan: payload.ringkasan?.trim() || null,
        gambarUrl: payload.gambarUrl || null,
        kategori: payload.kategori || "KKN",
        tags: payload.tags || null,
        kelompokId: payload.kelompokId || null,
        status,
        publishedAt,
        authorId,
      },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  /**
   * Update berita (partial update — hanya field yang dikirim)
   */
  async update(
    id: string,
    payload: {
      judul?: string;
      konten?: string;
      ringkasan?: string;
      gambarUrl?: string;
      kategori?: string;
      tags?: string;
      kelompokId?: string;
    }
  ) {
    await this.getById(id); // guard — throws if not found

    const data: any = {};
    if (payload.judul !== undefined) data.judul = payload.judul.trim();
    if (payload.konten !== undefined) data.konten = payload.konten.trim();
    if (payload.ringkasan !== undefined) data.ringkasan = payload.ringkasan.trim() || null;
    if (payload.gambarUrl !== undefined) data.gambarUrl = payload.gambarUrl || null;
    if (payload.kategori !== undefined) data.kategori = payload.kategori;
    if (payload.tags !== undefined) data.tags = payload.tags || null;
    if (payload.kelompokId !== undefined) data.kelompokId = payload.kelompokId || null;

    return prisma.beritaKonten.update({
      where: { id },
      data,
      include: { author: { select: { id: true, name: true } } },
    });
  }

  /**
   * Publish atau unpublish / archive berita
   */
  async changeStatus(id: string, status: "PUBLISHED" | "DRAFT" | "ARCHIVED") {
    await this.getById(id);

    const data: any = { status };
    if (status === "PUBLISHED") {
      data.publishedAt = new Date();
    } else if (status === "ARCHIVED") {
      // tetap simpan publishedAt asli
    } else {
      data.publishedAt = null;
    }

    return prisma.beritaKonten.update({ where: { id }, data });
  }

  /**
   * Hapus berita
   */
  async delete(id: string) {
    await this.getById(id);
    await prisma.beritaKonten.delete({ where: { id } });
    return { deleted: true };
  }
}

export const beritaService = new BeritaService();
