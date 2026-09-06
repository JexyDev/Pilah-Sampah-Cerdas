import { prisma } from "../lib/prisma.js";
import { Router } from "express";
import { rwService } from "../services/rwService.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// Semua route di sini dilindungi authMiddleware dan khusus untuk role RW
router.use(authMiddleware);

// Middleware khusus RW & RT (serta role Eksekutif untuk audit/monitoring)
router.use(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Token tidak valid" });
  }

  const allowedRoles = ["RW", "RT", "SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: "FORBIDDEN",
      message: "Hanya pengurus wilayah yang dapat mengakses portal ini.",
    });
  }

  if (!req.user.rwId) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { rwId: true, name: true, address: true },
      });

      if (dbUser?.rwId) {
        req.user.rwId = dbUser.rwId;
      } else {
        // Auto-link RW user by matching name (e.g., "RW 06") or fallback to first RW area
        let matchedArea = null;
        if (dbUser?.name) {
          const match = dbUser.name.match(/RW\s*(\d+)/i);
          if (match) {
            const rwNum = match[1].padStart(2, "0");
            matchedArea = await prisma.rw.findFirst({
              where: { name: { contains: `RW ${rwNum}` } },
            });
          }
        }

        if (!matchedArea) {
          matchedArea = await prisma.rw.findFirst();
        }

        if (matchedArea && req.user) {
          req.user.rwId = matchedArea.id;
          await prisma.user.update({
            where: { id: req.user.userId },
            data: { rwId: matchedArea.id },
          });
        }
      }
    } catch (err) {
      console.error("[rwRoutes] Error auto-linking RW user:", err);
    }
  }

  if (!req.user.rwId) {
    return res.status(403).json({
      error: "FORBIDDEN",
      message: "Akun RW/RT Anda belum terikat dengan wilayah tugas di database.",
    });
  }

  next();
});

/**
 * @swagger
 * tags:
 *   name: Portal RW & RT
 *   description: API Portal Pengurus RT dan RW (Approval Tempat Sampah, Verifikasi Petugas, Ide Daur Ulang, & Fasilitas)
 */

/**
 * @swagger
 * /api/v1/rw/dashboard:
 *   get:
 *     summary: Dashboard ringkasan statistik wilayah RT/RW
 *     tags: [Portal RW & RT]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan data dashboard RW/RT
 */
router.get("/dashboard", async (req, res, next) => {
  try {
    const data = await rwService.getDashboard(req.user!.rwId!, req.user?.role);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/rw/bins/pending:
 *   get:
 *     summary: Daftar pengajuan aktivasi tempat sampah warga yang pending approval RW
 *     tags: [Portal RW & RT]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan data pending bins
 */
router.get("/bins/pending", async (req, res, next) => {
  try {
    const data = await rwService.getPendingBins(req.user!.rwId!, req.user?.role);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/rw/bins/{id}/approve:
 *   put:
 *     summary: Menyetujui pengajuan aktivasi tempat sampah warga oleh RW
 *     tags: [Portal RW & RT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bin berhasil diaktifkan
 */
router.put("/bins/:id/approve", async (req, res, next) => {
  try {
    const data = await rwService.approveBin(req.params.id, req.user!.rwId!, req.user?.role);
    res.json({ message: "Bin berhasil diaktifkan", data });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/rw/bins/{id}/reject:
 *   put:
 *     summary: Menolak pengajuan tempat sampah warga
 *     tags: [Portal RW & RT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pengajuan ditolak
 */
router.put("/bins/:id/reject", async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: "Reason is required" });
    const data = await rwService.rejectBin(req.params.id, reason, req.user!.rwId!, req.user?.role);
    res.json({ message: "Pengajuan bin ditolak", data });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/rw/bins/inactive:
 *   get:
 *     summary: Daftar tempat sampah inaktif (30 hari tanpa aktivitas) di wilayah RW
 *     tags: [Portal RW & RT]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan inactive bins
 */
router.get("/bins/inactive", async (req, res, next) => {
  try {
    const data = await rwService.getInactiveBins(req.user!.rwId!, req.user?.role);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/rw/bins/{id}/broken:
 *   put:
 *     summary: Menandai tempat sampah rusak fisik secara permanen (BROKEN)
 *     tags: [Portal RW & RT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bin berhasil ditandai rusak
 */
router.put("/bins/:id/broken", async (req, res, next) => {
  try {
    const data = await rwService.markBinBroken(
      req.params.id,
      req.user!.userId,
      req.user!.rwId!,
      req.user?.role
    );
    res.json({ message: "Bin ditandai rusak", data });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/rw/petugas/pending:
 *   get:
 *     summary: Daftar pengajuan verifikasi akun petugas residu
 *     tags: [Portal RW & RT]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar petugas pending
 */
router.get("/petugas/pending", async (req, res, next) => {
  try {
    const data = await rwService.getPendingPetugas(req.user!.rwId!, req.user?.role);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/rw/petugas/{id}/verify:
 *   put:
 *     summary: Verifikasi persetujuan / penolakan akun petugas residu oleh RW
 *     tags: [Portal RW & RT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verifikasi petugas berhasil
 */
router.put("/petugas/:id/verify", async (req, res, next) => {
  try {
    const { action } = req.body; // "APPROVED" or "REJECTED"
    if (!["APPROVED", "REJECTED"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }
    const data = await rwService.verifyPetugas(
      req.params.id,
      action as "APPROVED" | "REJECTED",
      req.user!.rwId!,
      req.user?.role
    );
    res.json({ message: "Verifikasi petugas berhasil", data });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/rw/ide:
 *   get:
 *     summary: Daftar pengajuan ide daur ulang warga
 *     tags: [Portal RW & RT]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar ide daur ulang
 */
router.get("/ide", async (req, res, next) => {
  try {
    const data = await rwService.getPendingIde(req.user!.rwId!, req.user?.role);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/rw/ide/{id}/verify:
 *   put:
 *     summary: Verifikasi ide daur ulang warga & penambahan +50 poin
 *     tags: [Portal RW & RT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ide berhasil diverifikasi
 */
router.put("/ide/:id/verify", async (req, res, next) => {
  try {
    const { action } = req.body; // "APPROVED" or "REJECTED"
    const data = await rwService.verifyIde(
      req.params.id,
      action as "APPROVED" | "REJECTED",
      req.user!.userId,
      req.user!.rwId!,
      req.user?.role
    );
    res.json({ message: "Ide diverifikasi", data });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/rw/facilities/pending:
 *   get:
 *     summary: Daftar pengajuan registrasi fasilitas daur ulang/kompos
 *     tags: [Portal RW & RT]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan pending fasilitas
 */
router.get("/facilities/pending", async (req, res, next) => {
  try {
    const data = await rwService.getPendingFacilities(req.user!.rwId!, req.user?.role);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/rw/facilities/{id}/verify:
 *   put:
 *     summary: Verifikasi pengajuan fasilitas daur ulang/kompos
 *     tags: [Portal RW & RT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fasilitas berhasil diverifikasi
 */
router.put("/facilities/:id/verify", async (req, res, next) => {
  try {
    const { action } = req.body;
    const data = await rwService.verifyFacility(
      req.params.id,
      action as "APPROVED" | "REJECTED",
      req.user!.rwId!,
      req.user?.role
    );
    res.json({ message: "Fasilitas diverifikasi", data });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/rw/facilities:
 *   get:
 *     summary: Daftar seluruh fasilitas (Loseda, Maggot, Bata Terawang, Bank Sampah) di RW
 *     tags: [Portal RW & RT]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar fasilitas
 */
router.get("/facilities", async (req, res, next) => {
  try {
    const data = await rwService.getFacilities(req.user!.rwId!, req.user?.role);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/rw/facilities/{id}/production:
 *   post:
 *     summary: Input laporan mingguan hasil panen & material masuk fasilitas
 *     tags: [Portal RW & RT]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Data produksi berhasil disimpan
 */
router.post("/facilities/:id/production", async (req, res, next) => {
  try {
    const { materialMasukKg, outputKg, jenisOutput, periode } = req.body;
    const data = await rwService.inputFacilityProduction(
      req.params.id,
      Number(materialMasukKg),
      Number(outputKg),
      jenisOutput,
      periode,
      req.user!.rwId!,
      req.user?.role
    );
    res.json({ message: "Data produksi berhasil disimpan", data });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/rw/residu-monitoring:
 *   get:
 *     summary: Monitoring hasil setoran residu petugas hilir yang terikat dengan 1 RW
 *     tags: [Portal RW & RT]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data monitoring residu petugas RW berhasil didapatkan
 */
router.get("/residu-monitoring", async (req, res, next) => {
  try {
    const data = await rwService.getResiduMonitoring(req.user!.rwId!, req.user?.role);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
