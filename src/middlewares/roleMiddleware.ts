/**
 * Project: Pilah Sampah Cerdas
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

      if (!allowedRoles.includes(user.role)) {
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
