import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Wilayah routes — hierarki Provinsi → Kabupaten → Kecamatan → Kelurahan → RW → RT
 * Semua endpoint menggunakan relasi FK real di database.
 */

import { Router } from "express";
import { binController } from "../controllers/binController.js";
import { optionalAuthMiddleware } from "../middlewares/authMiddleware.js";

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
    let data = await prisma.provinsi.findMany({ orderBy: { name: "asc" } });
    if (data.length === 0) {
      await prisma.provinsi.create({
        data: { name: "Jawa Barat" },
      });
      data = await prisma.provinsi.findMany({ orderBy: { name: "asc" } });
    }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/provinsi", async (req, res) => {
  try {
    const { name, nama } = req.body;
    const provName = (name || nama || "").trim();
    if (!provName) {
      return res.status(400).json({ success: false, message: "Nama provinsi tidak boleh kosong" });
    }
    const existing = await prisma.provinsi.findFirst({
      where: { name: { equals: provName, mode: "insensitive" } },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: `Provinsi "${provName}" sudah ada` });
    }
    const data = await prisma.provinsi.create({
      data: { name: provName },
    });
    res.json({ success: true, message: `Berhasil menambahkan provinsi ${provName}`, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/provinsi/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nama } = req.body;
    const provName = (name || nama || "").trim();
    if (!provName) {
      return res.status(400).json({ success: false, message: "Nama provinsi tidak boleh kosong" });
    }
    const data = await prisma.provinsi.update({
      where: { id: Number(id) },
      data: { name: provName },
    });
    res.json({ success: true, message: "Provinsi berhasil diperbarui", data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/provinsi/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.provinsi.delete({
      where: { id: Number(id) },
    });
    res.json({ success: true, message: "Provinsi berhasil dihapus" });
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
    let data = await prisma.kabupaten.findMany({
      where,
      include: { provinsi: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });
    if (data.length === 0) {
      let jabar = await prisma.provinsi.findFirst({
        where: { name: { equals: "Jawa Barat", mode: "insensitive" } },
      });
      if (!jabar) {
        jabar = await prisma.provinsi.create({ data: { name: "Jawa Barat" } });
      }
      await prisma.kabupaten.create({
        data: {
          name: "Kota Bandung",
          provinsiId: jabar.id,
        },
      });
      data = await prisma.kabupaten.findMany({
        where,
        include: { provinsi: { select: { id: true, name: true } } },
        orderBy: { name: "asc" },
      });
    }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/kabupaten", async (req, res) => {
  try {
    const { name, nama, provinsiId, id_provinsi } = req.body;
    const kabName = (name || nama || "").trim();
    const pId = Number(provinsiId || id_provinsi);
    if (!kabName) {
      return res.status(400).json({ success: false, message: "Nama Kota/Kabupaten tidak boleh kosong" });
    }
    let targetProvId = pId;
    if (!targetProvId) {
      let jabar = await prisma.provinsi.findFirst({
        where: { name: { equals: "Jawa Barat", mode: "insensitive" } },
      });
      if (!jabar) {
        jabar = await prisma.provinsi.create({ data: { name: "Jawa Barat" } });
      }
      targetProvId = jabar.id;
    }
    const existing = await prisma.kabupaten.findFirst({
      where: {
        provinsiId: targetProvId,
        name: { equals: kabName, mode: "insensitive" },
      },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: `Kota/Kabupaten "${kabName}" sudah ada` });
    }
    const data = await prisma.kabupaten.create({
      data: {
        name: kabName,
        provinsiId: targetProvId,
      },
      include: { provinsi: { select: { id: true, name: true } } },
    });
    res.json({ success: true, message: `Berhasil menambahkan ${kabName}`, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/kabupaten/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nama, provinsiId, id_provinsi } = req.body;
    const kabName = (name || nama || "").trim();
    const updateData: any = {};
    if (kabName) updateData.name = kabName;
    if (provinsiId || id_provinsi) updateData.provinsiId = Number(provinsiId || id_provinsi);
    const data = await prisma.kabupaten.update({
      where: { id: Number(id) },
      data: updateData,
      include: { provinsi: { select: { id: true, name: true } } },
    });
    res.json({ success: true, message: "Kota/Kabupaten berhasil diperbarui", data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/kabupaten/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.kabupaten.delete({
      where: { id: Number(id) },
    });
    res.json({ success: true, message: "Kota/Kabupaten berhasil dihapus" });
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
    const { kabupatenId, kabupaten_id } = req.query;
    const kId = kabupatenId || kabupaten_id;
    const where: any = {};
    if (kId) where.kabupatenId = Number(kId);

    const data = await prisma.kecamatan.findMany({
      where,
      include: {
        kabupaten: {
          include: {
            provinsi: { select: { id: true, name: true } },
          },
        },
        kelurahans: {
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // Normalize: ensure every kecamatan name starts with "Kecamatan "
    const normalizeKecName = (n: string) => {
      if (!n) return "Kecamatan Coblong";
      const trimmed = n.trim();
      if (/^kecamatan\s+/i.test(trimmed)) return trimmed;
      if (trimmed.toLowerCase().includes("coblong")) return "Kecamatan Coblong";
      const clean = trimmed.replace(/^kec\.?\s+/i, "").trim();
      return `Kecamatan ${clean.charAt(0).toUpperCase()}${clean.slice(1)}`;
    };

    const normalized = data.map((d: any) => {
      const kelCount = d.kelurahans?.length || 0;
      return {
        ...d,
        name: normalizeKecName(d.name),
        totalKelurahan: kelCount,
        isConfigured: kelCount > 0,
        status: kelCount > 0 ? "CONFIGURED" : "BELUM_DIISI",
        statusLabel: kelCount > 0 ? "Aktif" : "Belum Ditambahkan",
      };
    });

    res.json({ success: true, data: normalized });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/kecamatan", async (req, res) => {
  try {
    const { name, nama, kabupatenId, id_kabupaten } = req.body;
    const kecName = (name || nama || "").trim();
    const kId = Number(kabupatenId || id_kabupaten);
    if (!kecName) {
      return res.status(400).json({ success: false, message: "Nama Kecamatan tidak boleh kosong" });
    }

    let targetKabId = kId;
    if (!targetKabId) {
      let bandung = await prisma.kabupaten.findFirst({
        where: { name: { equals: "Kota Bandung", mode: "insensitive" } },
      });
      if (!bandung) {
        let jabar = await prisma.provinsi.findFirst({
          where: { name: { equals: "Jawa Barat", mode: "insensitive" } },
        });
        if (!jabar) {
          jabar = await prisma.provinsi.create({ data: { name: "Jawa Barat" } });
        }
        bandung = await prisma.kabupaten.create({
          data: { name: "Kota Bandung", provinsiId: jabar.id },
        });
      }
      targetKabId = bandung.id;
    }

    const existing = await prisma.kecamatan.findFirst({
      where: {
        kabupatenId: targetKabId,
        name: { equals: kecName, mode: "insensitive" },
      },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: `Kecamatan "${kecName}" sudah ada` });
    }

    const data = await prisma.kecamatan.create({
      data: {
        name: kecName,
        kabupatenId: targetKabId,
      },
      include: {
        kabupaten: {
          include: { provinsi: { select: { id: true, name: true } } },
        },
      },
    });
    res.json({ success: true, message: `Berhasil menambahkan kecamatan ${kecName}`, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/kecamatan/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nama, kabupatenId, id_kabupaten } = req.body;
    const kecName = (name || nama || "").trim();
    const updateData: any = {};
    if (kecName) updateData.name = kecName;
    if (kabupatenId || id_kabupaten) updateData.kabupatenId = Number(kabupatenId || id_kabupaten);

    const data = await prisma.kecamatan.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        kabupaten: {
          include: { provinsi: { select: { id: true, name: true } } },
        },
      },
    });
    res.json({ success: true, message: "Kecamatan berhasil diperbarui", data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/kecamatan/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const kId = Number(id);

    const kelurahans = await prisma.kelurahan.findMany({
      where: { kecamatanId: kId },
      select: { id: true },
    });
    const kelIds = kelurahans.map((k) => k.id);

    await prisma.$transaction(async (tx) => {
      if (kelIds.length > 0) {
        const rws = await tx.rw.findMany({
          where: { kelurahanId: { in: kelIds } },
          select: { id: true },
        });
        const rwIds = rws.map((r) => r.id);

        await tx.bin.updateMany({
          where: { kelurahanId: { in: kelIds } },
          data: { kelurahanId: null },
        });

        if (rwIds.length > 0) {
          await tx.bin.updateMany({
            where: { rwId: { in: rwIds } },
            data: { rwId: null },
          });

          await tx.user.updateMany({
            where: { rwId: { in: rwIds } },
            data: { rwId: null },
          });

          await tx.rt.deleteMany({
            where: { rwId: { in: rwIds } },
          });

          await tx.rw.deleteMany({
            where: { kelurahanId: { in: kelIds } },
          });
        }

        await tx.kelurahan.deleteMany({
          where: { kecamatanId: kId },
        });
      }

      await tx.kecamatan.delete({
        where: { id: kId },
      });
    });

    res.json({ success: true, message: "Kecamatan berhasil dihapus" });
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
    const where: any = {};
    if (id) {
      where.kecamatanId = Number(id);
    }
    const data = await prisma.kelurahan.findMany({
      where,
      include: {
        kecamatan: {
          include: {
            kabupaten: {
              include: { provinsi: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // If filtered by kecamatanId and empty, check if kecamatan exists and return explicit status
    if (id) {
      const kec = await prisma.kecamatan.findUnique({
        where: { id: Number(id) },
        include: {
          kabupaten: {
            include: {
              provinsi: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (!kec) {
        return res.status(404).json({
          success: false,
          message: `Kecamatan dengan ID ${id} tidak ditemukan`,
        });
      }

      if (data.length === 0) {
        return res.json({
          success: true,
          data: [],
          meta: {
            kecamatanId: Number(id),
            kecamatanName: kec.name,
            totalKelurahan: 0,
            status: "BELUM_DIISI",
            message: "Data kelurahan belum ditambahkan untuk kecamatan ini",
          },
        });
      }
    }

    // Normalize kecamatan names inside kelurahan response
    const normalizeKecName2 = (n: string) => {
      if (!n) return "Kecamatan Coblong";
      const trimmed = n.trim();
      if (/^kecamatan\s+/i.test(trimmed)) return trimmed;
      if (trimmed.toLowerCase().includes("coblong")) return "Kecamatan Coblong";
      const clean = trimmed.replace(/^kec\.?\s+/i, "").trim();
      return `Kecamatan ${clean.charAt(0).toUpperCase()}${clean.slice(1)}`;
    };
    const normalized = data.map((d: any) => {
      if (d.kecamatan && d.kecamatan.name) {
        return { ...d, kecamatan: { ...d.kecamatan, name: normalizeKecName2(d.kecamatan.name) } };
      }
      return d;
    });

    res.json({ success: true, data: normalized });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/kelurahan", async (req, res) => {
  try {
    const { name, nama, kecamatanId, id_kecamatan } = req.body;
    const kelName = (name || nama || "").trim();
    const kId = Number(kecamatanId || id_kecamatan);
    if (!kelName) {
      return res.status(400).json({ success: false, message: "Nama Kelurahan tidak boleh kosong" });
    }

    let targetKecId = kId;
    if (!targetKecId) {
      let coblong = await prisma.kecamatan.findFirst({
        where: {
          OR: [
            { name: { equals: "Kecamatan Coblong", mode: "insensitive" } },
            { name: { equals: "Coblong", mode: "insensitive" } },
          ],
        },
      });
      if (!coblong) {
        let jabar = await prisma.provinsi.findFirst({
          where: { name: { equals: "Jawa Barat", mode: "insensitive" } },
        });
        if (!jabar) {
          jabar = await prisma.provinsi.create({ data: { name: "Jawa Barat" } });
        }
        let bandung = await prisma.kabupaten.findFirst({
          where: { name: { equals: "Kota Bandung", mode: "insensitive" } },
        });
        if (!bandung) {
          bandung = await prisma.kabupaten.create({
            data: { name: "Kota Bandung", provinsiId: jabar.id },
          });
        }
        coblong = await prisma.kecamatan.create({
          data: { name: "Kecamatan Coblong", kabupatenId: bandung.id },
        });
      }
      targetKecId = coblong.id;
    }

    const existing = await prisma.kelurahan.findFirst({
      where: { name: { equals: kelName, mode: "insensitive" } },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: `Kelurahan "${kelName}" sudah ada` });
    }

    const data = await prisma.kelurahan.create({
      data: {
        name: kelName,
        kecamatanId: targetKecId,
      },
      include: {
        kecamatan: {
          include: {
            kabupaten: {
              include: { provinsi: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });
    res.json({ success: true, message: `Berhasil menambahkan kelurahan ${kelName}`, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/kelurahan/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nama, kecamatanId, id_kecamatan } = req.body;
    const kelName = (name || nama || "").trim();
    const updateData: any = {};
    if (kelName) updateData.name = kelName;
    if (kecamatanId || id_kecamatan) updateData.kecamatanId = Number(kecamatanId || id_kecamatan);

    const data = await prisma.kelurahan.update({
      where: { id: String(id) },
      data: updateData,
      include: {
        kecamatan: {
          include: {
            kabupaten: {
              include: { provinsi: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });
    res.json({ success: true, message: "Kelurahan berhasil diperbarui", data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/kelurahan/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const kelId = String(id);

    const rws = await prisma.rw.findMany({
      where: { kelurahanId: kelId },
      select: { id: true },
    });
    const rwIds = rws.map((r) => r.id);

    await prisma.$transaction(async (tx) => {
      await tx.bin.updateMany({
        where: { kelurahanId: kelId },
        data: { kelurahanId: null },
      });

      if (rwIds.length > 0) {
        await tx.bin.updateMany({
          where: { rwId: { in: rwIds } },
          data: { rwId: null },
        });

        await tx.user.updateMany({
          where: { rwId: { in: rwIds } },
          data: { rwId: null },
        });

        await tx.rt.deleteMany({
          where: { rwId: { in: rwIds } },
        });

        await tx.rw.deleteMany({
          where: { kelurahanId: kelId },
        });
      }

      await tx.kelurahan.delete({
        where: { id: kelId },
      });
    });

    res.json({ success: true, message: "Kelurahan berhasil dihapus" });
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
      include: {
        kelurahan: {
          include: {
            kecamatan: {
              include: {
                kabupaten: {
                  include: {
                    provinsi: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    if (id) {
      const kel = await prisma.kelurahan.findUnique({
        where: { id: String(id) },
        include: { kecamatan: true },
      });

      if (!kel) {
        return res.status(404).json({
          success: false,
          message: `Kelurahan dengan ID ${id} tidak ditemukan`,
        });
      }

      if (data.length === 0) {
        return res.json({
          success: true,
          data: [],
          meta: {
            kelurahanId: String(id),
            kelurahanName: kel.name,
            totalRw: 0,
            status: "BELUM_DIISI",
            message: "Data RW belum ditambahkan untuk kelurahan ini",
          },
        });
      }
    }

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/rw", async (req, res) => {
  try {
    const { name, nama, kelurahanId, id_kelurahan } = req.body;
    const rwName = (name || nama || "").trim();
    const kId = String(kelurahanId || id_kelurahan || "");
    if (!rwName) {
      return res.status(400).json({ success: false, message: "Nama RW tidak boleh kosong" });
    }
    if (!kId) {
      return res.status(400).json({ success: false, message: "Kelurahan ID tidak boleh kosong" });
    }

    const names = rwName.split(",").map((s: string) => s.trim()).filter(Boolean);
    const createdList = [];
    for (const item of names) {
      const formattedName = item.toUpperCase().startsWith("RW") ? item : `RW ${item}`;
      const rw = await prisma.rw.upsert({
        where: { kelurahanId_name: { kelurahanId: kId, name: formattedName } },
        create: { name: formattedName, kelurahanId: kId },
        update: { name: formattedName },
        include: {
          kelurahan: {
            include: {
              kecamatan: {
                include: {
                  kabupaten: {
                    include: { provinsi: { select: { id: true, name: true } } },
                  },
                },
              },
            },
          },
        },
      });
      createdList.push(rw);
    }

    res.status(201).json({ success: true, data: createdList.length === 1 ? createdList[0] : createdList });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/rw/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nama, kelurahanId, id_kelurahan } = req.body;
    const rwName = (name || nama || "").trim();

    const data: any = {};
    if (rwName) {
      data.name = rwName.toUpperCase().startsWith("RW") ? rwName : `RW ${rwName}`;
    }
    if (kelurahanId || id_kelurahan) {
      data.kelurahanId = String(kelurahanId || id_kelurahan);
    }

    const updated = await prisma.rw.update({
      where: { id: Number(id) },
      data,
      include: {
        kelurahan: {
          include: {
            kecamatan: {
              include: {
                kabupaten: {
                  include: { provinsi: { select: { id: true, name: true } } },
                },
              },
            },
          },
        },
      },
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/rw/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const rwId = Number(id);

    await prisma.$transaction(async (tx) => {
      await tx.bin.updateMany({
        where: { rwId },
        data: { rwId: null },
      });

      await tx.user.updateMany({
        where: { rwId },
        data: { rwId: null },
      });

      await tx.rt.deleteMany({
        where: { rwId },
      });

      await tx.rw.delete({
        where: { id: rwId },
      });
    });

    res.json({ success: true, message: "Berhasil menghapus data RW" });
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
router.get("/rt-rw", optionalAuthMiddleware, binController.getAreas);

export default router;
