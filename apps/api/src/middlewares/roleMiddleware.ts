/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response, NextFunction } from "express";

/**
 * Role-Based Access Control (RBAC) Middleware.
 * This should be placed AFTER `authMiddleware` so that `req.user` is available.
 *
 * @param allowedRoles Array of role names that are allowed to access the route
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: "UNAUTHORIZED", message: "User belum terotentikasi" });
        return;
      }

      const normalizeRole = (r: string) => {
        const upper = String(r || "").toUpperCase();
        if (["DLH", "DLH_ADMIN", "ADMIN_DLH", "ADMIN DLH"].includes(upper)) return "ADMIN_DLH";
        if (["ADMIN_KECAMATAN", "CAMAT", "CAMAT_ADMIN"].includes(upper)) return "CAMAT";
        if (["ADMIN_KELURAH", "LURAH", "LURAH_ADMIN"].includes(upper)) return "LURAH";
        if (["SUPER_ADMIN", "SUPERADMIN", "SUPER ADMIN"].includes(upper)) return "SUPER_ADMIN";
        if (["DPL", "DOSEN_PEMBIMBING", "DOSEN PEMBIMBING"].includes(upper)) return "DPL";
        return upper;
      };
      const userRole = normalizeRole(user.role);
      const normalizedAllowed = allowedRoles.map(normalizeRole);

      if (!normalizedAllowed.includes(userRole)) {
        res
          .status(403)
          .json({ error: "FORBIDDEN", message: "Anda tidak memiliki akses ke resource ini" });
        return;
      }

      next();
    } catch (error) {
      console.error("[roleMiddleware] error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memverifikasi role pengguna" });
    }
  };
};
