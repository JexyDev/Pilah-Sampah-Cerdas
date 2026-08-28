/**
 * Project: BERSEKA
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
        if (["SUPER_USER", "superUser", "SUPER USER"].includes(upper)) return "SUPER_USER";
        if (["DPL", "DOSEN_PEMBIMBING", "DOSEN PEMBIMBING", "DOSEN_PENDAMPING", "DOSEN PENDAMPING", "DOSEN_PENDAMPING_LAPANGAN", "DOSEN PENDAMPING LAPANGAN"].includes(upper)) return "DPL";
        if (["MPL", "MITRA_PENDAMPING_LAPANGAN", "MITRA PENDAMPING LAPANGAN", "MITRA_PEMBIMBING_LAPANGAN", "MITRA PEMBIMBING LAPANGAN", "MITRA"].includes(upper)) return "MPL";
        if (["PEMIMPIN", "PIMPINAN"].includes(upper)) return "PEMIMPIN";
        if (["PANITIA_TASKFORCE", "PANITIA", "TASKFORCE", "TASK_FORCE", "TASK FORCE"].includes(upper))
          return "TASK_FORCE";
        if (["MAHASISWA", "MAHASISWA_KKN", "MAHASISWA KKN"].includes(upper)) return "MAHASISWA_KKN";
        if (["WARGA", "MASYARAKAT"].includes(upper)) return "WARGA";
        return upper;
      };
      const userRole = normalizeRole(user.role);
      const normalizedAllowed = allowedRoles.map(normalizeRole);

      // Support legacy alias for TASK_FORCE
      if (userRole === "TASK_FORCE" && normalizedAllowed.includes("PANITIA_TASKFORCE")) {
        return next();
      }
      if (userRole === "PANITIA_TASKFORCE" && normalizedAllowed.includes("TASK_FORCE")) {
        return next();
      }

      if (userRole === "DEVELOPER" || userRole === "SUPER_USER") {
        return next();
      }

      if (!normalizedAllowed.includes(userRole)) {
        console.error(
          `[roleMiddleware 403 DUMP] URL: ${req.originalUrl} | userRole: ${userRole} | allowed: ${JSON.stringify(normalizedAllowed)}`
        );
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
