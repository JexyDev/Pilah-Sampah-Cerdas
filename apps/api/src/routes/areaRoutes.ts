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

// Legacy route for drop-down list of RT/RW combined
router.get("/rt-rw", binController.getAreas);

// 1. GET /api/v1/wilayah/kecamatan
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

// 2. GET /api/v1/wilayah/kelurahan
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

// 3. GET /api/v1/wilayah/rw (Kusus RW)
router.get("/rw", async (req, res) => {
  try {
    const { kelurahan_id, kelurahan_name } = req.query;
    const where: any = {};
    if (kelurahan_id) {
      where.kelurahanId = String(kelurahan_id);
    } else if (kelurahan_name) {
      where.kelurahan = { name: { contains: String(kelurahan_name), mode: "insensitive" } };
    }

    const areas = await prisma.rtRwArea.findMany({
      where,
      include: { kelurahan: true },
      orderBy: { name: "asc" },
    });

    const rwMap = new Map();
    for (const area of areas) {
      const match = area.name.match(/RW\s*(\d+)/i);
      const rwNum = match ? match[1].padStart(2, "0") : null;
      const rwLabel = rwNum ? `RW ${rwNum}` : area.name;
      
      if (!rwMap.has(rwLabel)) {
        rwMap.set(rwLabel, {
          id: area.id,
          rw: rwLabel,
          name: area.name,
          kelurahanId: area.kelurahanId,
          kelurahanName: area.kelurahan?.name || "",
        });
      }
    }

    res.json({
      success: true,
      data: Array.from(rwMap.values()),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. GET /api/v1/wilayah/rt (Khusus RT)
router.get("/rt", async (req, res) => {
  try {
    const { rw_id, rw_name } = req.query;
    let baseArea = null;

    if (rw_id) {
      baseArea = await prisma.rtRwArea.findUnique({ where: { id: Number(rw_id) } });
    } else if (rw_name) {
      baseArea = await prisma.rtRwArea.findFirst({
        where: { name: { contains: String(rw_name), mode: "insensitive" } },
      });
    }

    const rtList = Array.from({ length: 10 }, (_, i) => {
      const rtNum = String(i + 1).padStart(2, "0");
      return {
        id: baseArea ? baseArea.id : i + 1,
        rt: `RT ${rtNum}`,
        name: `RT ${rtNum}`,
        rwId: baseArea ? baseArea.id : null,
        rwName: baseArea ? baseArea.name : (rw_name ? String(rw_name) : "RW"),
      };
    });

    res.json({
      success: true,
      data: rtList,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
