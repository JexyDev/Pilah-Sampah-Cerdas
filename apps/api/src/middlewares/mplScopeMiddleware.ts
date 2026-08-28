/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * mplScopeMiddleware — Memastikan hanya MPL (Mitra Pendamping Lapangan),
 * SUPER_USER, dan DEVELOPER yang dapat mengakses endpoint /mpl/*.
 * Berbeda dari dplScopeMiddleware, middleware ini scope-nya per kelurahan,
 * bukan per kecamatan seperti DPL.
 */

import { Request, Response, NextFunction } from "express";

const MPL_ALLOWED_ROLES = [
  "MPL",
  "MITRA_PENDAMPING_LAPANGAN",
  "MITRA_PEMBIMBING_LAPANGAN",
  "MITRA_PENDAMPING",
  "MITRA",
  "DEVELOPER",
  "SUPER_USER",
  "superUser",
  "PEMIMPIN",
  "PIMPINAN",
  "PANITIA_TASKFORCE",
  "PANITIA",
  "TASKFORCE",
  "ADMIN_DLH",
];

export const mplScopeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "User belum terotentikasi" });
      return;
    }

    const roleName = String(user.role || "").toUpperCase();
    const isAllowed = MPL_ALLOWED_ROLES.some((r) => roleName.includes(r.toUpperCase()));

    if (!isAllowed) {
      res.status(403).json({
        error: "FORBIDDEN",
        message: "Akses endpoint MPL hanya untuk Mitra Pendamping Lapangan (MPL) dan Administrator",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("[mplScopeMiddleware] error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memverifikasi hak akses MPL" });
  }
};
