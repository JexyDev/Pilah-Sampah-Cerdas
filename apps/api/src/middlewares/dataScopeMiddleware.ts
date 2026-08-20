import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response, NextFunction } from "express";


/**
 * Middleware untuk mencegah Horizontal Privilege Escalation.
 * Memastikan setiap user (RW, Lurah, Camat, Warga) hanya dapat mengakses atau memanipulasi
 * resource (tempat sampah, warga, reset request, area) yang berada di bawah wewenang wilayahnya.
 */
export const dataScopeMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      return next();
    }

    const normalizeRole = (r: string) => {
      if (["DLH", "DLH_ADMIN", "Admin DLH"].includes(r)) return "ADMIN_DLH";
      if (["ADMIN_KECAMATAN", "Camat", "CAMAT_ADMIN"].includes(r)) return "CAMAT";
      if (["ADMIN_KELURAH", "Lurah", "LURAH_ADMIN"].includes(r)) return "LURAH";
      return r;
    };

    const role = normalizeRole(user.role);

    // Global / Super roles bypass ID boundary checking
    if (["DEVELOPER", "SUPER_USER", "PEMIMPIN", "PANITIA_TASKFORCE"].includes(role)) {
      return next();
    }

    // Ambil metadata wilayah user jika RW, Lurah, Camat, atau Warga
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        rwId: true,
        rw: {
          select: {
            id: true,
            kelurahanId: true,
            kelurahan: {
              select: {
                id: true,
                kecamatanId: true,
              },
            },
          },
        },
      },
    });

    if (!dbUser) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "User tidak ditemukan" });
      return;
    }

    // 1. RW Strict Scope Verification
    if (role === "RW" || role === "RT") {
      const userRwId = dbUser.rwId;
      if (!userRwId) {
        res.status(403).json({
          error: "FORBIDDEN",
          message: "Akun RW Anda belum terasosiasi dengan wilayah RW manapun.",
        });
        return;
      }

      // Validasi body jika mengandung rwId
      if (req.body && req.body.rwId && Number(req.body.rwId) !== userRwId) {
        res.status(403).json({
          error: "HORIZONTAL_PRIVILEGE_ESCALATION_DENIED",
          message: "Dilarang memanipulasi data di luar wilayah RW Anda.",
        });
        return;
      }

      // Validasi route parameter jika target adalah binId atau qrCode
      const binIdentifier = req.params.id || req.params.binId || req.params.qrCode;
      if (
        binIdentifier &&
        (req.baseUrl.includes("/bins") || req.originalUrl.includes("/bins/"))
      ) {
        const bin = await prisma.bin.findFirst({
          where: {
            OR: [{ id: binIdentifier }, { qrCode: binIdentifier }],
          },
          select: { rwId: true },
        });

        if (bin && bin.rwId !== userRwId) {
          res.status(403).json({
            error: "HORIZONTAL_PRIVILEGE_ESCALATION_DENIED",
            message: "Akses ditolak: Tempat sampah ini bukan berada di wilayah RW Anda.",
          });
          return;
        }
      }
    }

    // 2. Lurah Strict Scope Verification
    if (role === "LURAH") {
      const userKelurahanId = dbUser.rw?.kelurahanId;
      if (!userKelurahanId) {
        res.status(403).json({
          error: "FORBIDDEN",
          message: "Akun Lurah Anda belum terasosiasi dengan Kelurahan manapun.",
        });
        return;
      }

      const binIdentifier = req.params.id || req.params.binId || req.params.qrCode;
      if (
        binIdentifier &&
        (req.baseUrl.includes("/bins") || req.originalUrl.includes("/bins/"))
      ) {
        const bin = await prisma.bin.findFirst({
          where: {
            OR: [{ id: binIdentifier }, { qrCode: binIdentifier }],
          },
          select: { kelurahanId: true, rw: { select: { kelurahanId: true } } },
        });

        const targetKelurahan = bin?.kelurahanId || bin?.rw?.kelurahanId;
        if (targetKelurahan && targetKelurahan !== userKelurahanId) {
          res.status(403).json({
            error: "HORIZONTAL_PRIVILEGE_ESCALATION_DENIED",
            message: "Akses ditolak: Resource bukan berada di Kelurahan Anda.",
          });
          return;
        }
      }
    }

    // 3. Camat Strict Scope Verification
    if (role === "CAMAT") {
      const userKecamatanId = dbUser.rw?.kelurahan?.kecamatanId;
      if (!userKecamatanId) {
        res.status(403).json({
          error: "FORBIDDEN",
          message: "Akun Camat Anda belum terasosiasi dengan Kecamatan manapun.",
        });
        return;
      }

      const binIdentifier = req.params.id || req.params.binId || req.params.qrCode;
      if (
        binIdentifier &&
        (req.baseUrl.includes("/bins") || req.originalUrl.includes("/bins/"))
      ) {
        const bin = await prisma.bin.findFirst({
          where: {
            OR: [{ id: binIdentifier }, { qrCode: binIdentifier }],
          },
          select: {
            kelurahan: { select: { kecamatanId: true } },
            rw: { select: { kelurahan: { select: { kecamatanId: true } } } },
          },
        });

        const targetKecamatan =
          bin?.kelurahan?.kecamatanId || bin?.rw?.kelurahan?.kecamatanId;
        if (targetKecamatan && targetKecamatan !== userKecamatanId) {
          res.status(403).json({
            error: "HORIZONTAL_PRIVILEGE_ESCALATION_DENIED",
            message: "Akses ditolak: Resource bukan berada di Kecamatan Anda.",
          });
          return;
        }
      }
    }

    next();
  } catch (error) {
    console.error("[dataScopeMiddleware] error:", error);
    res
      .status(500)
      .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memverifikasi batasan data wilayah" });
  }
};
