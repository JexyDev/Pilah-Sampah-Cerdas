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
/** GET /api/v1/wilayah/provinsi */
router.get("/provinsi", async (req, res) => {
    try {
        const data = await prisma.provinsi.findMany({ orderBy: { name: "asc" } });
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
/** GET /api/v1/wilayah/kabupaten?provinsiId= */
router.get("/kabupaten", async (req, res) => {
    try {
        const { provinsiId } = req.query;
        const where = {};
        if (provinsiId)
            where.provinsiId = Number(provinsiId);
        const data = await prisma.kabupaten.findMany({
            where,
            orderBy: { name: "asc" },
        });
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
/** GET /api/v1/wilayah/kecamatan?kabupatenId= */
router.get("/kecamatan", async (req, res) => {
    try {
        const { kabupatenId } = req.query;
        const where = {};
        if (kabupatenId)
            where.kabupatenId = Number(kabupatenId);
        const data = await prisma.kecamatan.findMany({
            where,
            orderBy: { name: "asc" },
        });
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
/** GET /api/v1/wilayah/kelurahan?kecamatanId= */
router.get("/kelurahan", async (req, res) => {
    try {
        const { kecamatanId } = req.query;
        const where = {};
        if (kecamatanId)
            where.kecamatanId = Number(kecamatanId);
        const data = await prisma.kelurahan.findMany({
            where,
            include: { kecamatan: { select: { name: true } } },
            orderBy: { name: "asc" },
        });
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
/** GET /api/v1/wilayah/rw?kelurahanId= */
router.get("/rw", async (req, res) => {
    try {
        const { kelurahanId, kelurahan_id } = req.query;
        const id = (kelurahanId || kelurahan_id);
        const where = {};
        if (id)
            where.kelurahanId = id;
        const data = await prisma.rw.findMany({
            where,
            include: { kelurahan: { select: { name: true } } },
            orderBy: { name: "asc" },
        });
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
/** GET /api/v1/wilayah/rt?rwId= */
router.get("/rt", async (req, res) => {
    try {
        const { rwId, rw_id } = req.query;
        const id = (rwId || rw_id);
        if (!id) {
            res.status(400).json({ success: false, message: "Parameter rwId diperlukan" });
            return;
        }
        const data = await prisma.rt.findMany({
            where: { rwId: Number(id) },
            include: { rw: { select: { name: true } } },
            orderBy: { name: "asc" },
        });
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
// Legacy alias — untuk backward compat komponen lama yang pakai /rt-rw
router.get("/rt-rw", binController.getAreas);
export default router;
