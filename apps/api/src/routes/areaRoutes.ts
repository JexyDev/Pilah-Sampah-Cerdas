/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Wilayah routes — hierarki Provinsi → Kabupaten → Kecamatan → Kelurahan → RW → RT
 * Semua endpoint menggunakan relasi FK real di database.
 */

import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { binController } from "../controllers/binController.js";

const prisma = new PrismaClient();
const router = Router();

// ─────────────────────────────────────────────
// HIERARKI WILAYAH (cascading dropdown)
// ─────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Master Wilayah
 *   description: API Hierarki Master Wilayah (Provinsi, Kabupaten, Kecamatan, Kelurahan, RW, RT)
 */

/**
 * @swagger
 * /api/v1/areas/provinsi:
 *   get:
 *     summary: Mendapatkan daftar seluruh Provinsi
 *     tags: [Master Wilayah]
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar provinsi
 */
router.get("/provinsi", async (req, res) => {
  try {
    const data = await prisma.provinsi.findMany({ orderBy: { name: "asc" } });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/areas/kabupaten:
 *   get:
 *     summary: Mendapatkan daftar Kabupaten/Kota
 *     tags: [Master Wilayah]
 *     parameters:
 *       - in: query
 *         name: provinsiId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar kabupaten
 */
router.get("/kabupaten", async (req, res) => {
  try {
    const { provinsiId } = req.query;
    const where: any = {};
    if (provinsiId) where.provinsiId = Number(provinsiId);
    const data = await prisma.kabupaten.findMany({
      where,
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/areas/kecamatan:
 *   get:
 *     summary: Mendapatkan data Kecamatan Coblong beserta daftar kelurahannya
 *     tags: [Master Wilayah]
 *     responses:
 *       200:
 *         description: Berhasil mengambil data Kecamatan Coblong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                         example: Coblong
 *                       kelurahans:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 */
router.get("/kecamatan", async (req, res) => {
  try {
    const data = await prisma.kecamatan.findMany({
      where: {
        name: { equals: "Coblong", mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        kelurahans: {
          select: {
            id: true,
            name: true,
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/areas/kelurahan:
 *   get:
 *     summary: Mendapatkan daftar Kelurahan Kecamatan Coblong
 *     tags: [Master Wilayah]
 *     parameters:
 *       - in: query
 *         name: kecamatanId
 *         schema:
 *           type: integer
 *         description: Filter opsional berdasarkan ID kecamatan
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar kelurahan Coblong
 */
router.get("/kelurahan", async (req, res) => {
  try {
    const { kecamatanId, kecamatan_id } = req.query;
    const id = kecamatanId || kecamatan_id;
    const where: any = {
      // Selalu scope ke Kecamatan Coblong
      kecamatan: { name: { equals: "Coblong", mode: "insensitive" } },
    };
    if (id) {
      where.kecamatanId = Number(id);
    }
    const data = await prisma.kelurahan.findMany({
      where,
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/areas/rw:
 *   get:
 *     summary: Mendapatkan daftar RW (dengan opsi filter kelurahanId / kelurahan)
 *     tags: [Master Wilayah]
 *     parameters:
 *       - in: query
 *         name: kelurahanId
 *         schema:
 *           type: string
 *       - in: query
 *         name: kelurahan
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar RW
 */
router.get("/rw", async (req, res) => {
  try {
    const { kelurahanId, kelurahan_id, kelurahanName, kelurahan } = req.query;
    const id = (kelurahanId || kelurahan_id) as string | undefined;
    const name = (kelurahanName || kelurahan) as string | undefined;
    const where: any = {};
    if (id) {
      where.kelurahanId = String(id);
    } else if (name) {
      where.kelurahan = { name: { contains: String(name), mode: "insensitive" } };
    }
    const data = await prisma.rw.findMany({
      where,
      include: { kelurahan: { select: { name: true } } },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/areas/rt:
 *   get:
 *     summary: Mendapatkan daftar RT (dengan opsi filter rwId / rw)
 *     tags: [Master Wilayah]
 *     parameters:
 *       - in: query
 *         name: rwId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: rw
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar RT
 */
router.get("/rt", async (req, res) => {
  try {
    const { rwId, rw_id, rwName, rw } = req.query;
    const id = rwId || rw_id;
    const name = rwName || rw;
    const where: any = {};
    if (id) {
      where.rwId = Number(id);
    } else if (name) {
      where.rw = { name: { contains: String(name), mode: "insensitive" } };
    }
    const data = await prisma.rt.findMany({
      where,
      include: { rw: { select: { name: true } } },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/areas/rt-rw:
 *   get:
 *     summary: Alias legacy untuk mendapatkan ringkasan area RT/RW
 *     tags: [Master Wilayah]
 *     responses:
 *       200:
 *         description: Ringkasan data lokasi RT/RW
 */
router.get("/rt-rw", binController.getAreas);

export default router;
