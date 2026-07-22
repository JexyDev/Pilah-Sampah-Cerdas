/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response, NextFunction } from "express";

export const readOnlyGuard = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;

  if (user && (user.role === "CAMAT" || user.role === "LURAH" || user.role === "ADMIN_DLH")) {
    const writeMethods = ["POST", "PUT", "DELETE", "PATCH"];
    if (writeMethods.includes(req.method)) {
      res.status(403).json({
        error: "FORBIDDEN",
        message: `Role ${user.role} hanya memiliki akses Read-Only. Operasi tulis ditolak.`,
      });
      return;
    }
  }

  next();
};
