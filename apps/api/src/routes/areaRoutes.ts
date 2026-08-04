/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { binController } from "../controllers/binController.js";

const prisma = new PrismaClient();
const router = Router();

// Legacy route for drop-down list of RT/RW
router.get("/rt-rw", binController.getAreas);

// Cascading region dropdown endpoints for Mobile & Web
router.get("/kecamatan", async (req, res) => {
  try {
    res.json({
      success: true,
      data: [{ id: "coblong", name: "Kecamatan Coblong" }],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/kelurahan", async (req, res) => {
  try {
    const kelurahans = await prisma.kelurahan.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: kelurahans });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/rw", async (req, res) => {
  try {
    const { kelurahan_id } = req.query;
    const where: any = {};
    if (kelurahan_id) {
      where.kelurahanId = String(kelurahan_id);
    }
    const rwAreas = await prisma.rtRwArea.findMany({
      where,
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: rwAreas });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/rt", async (req, res) => {
  try {
    const { rw_id } = req.query;
    const where: any = {};
    if (rw_id) {
      where.id = Number(rw_id);
    }
    const rtAreas = await prisma.rtRwArea.findMany({
      where,
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: rtAreas });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
