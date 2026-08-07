/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwtUtils.js";

export const readOnlyGuard = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // 1. Read operations (GET, HEAD, OPTIONS) are ALWAYS permitted
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      return next();
    }

    // 2. Auth routes (/auth/*) are ALWAYS permitted for all users/roles
    const reqUrl = (req.originalUrl || req.url || req.path || "").toLowerCase();
    if (reqUrl.includes("/auth/") || reqUrl.endsWith("/auth")) {
      return next();
    }

    let token = "";

    // 1. Try to get token from HttpOnly Cookie (Web Client)
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // 2. Try to get token from Authorization header (Mobile App)
    else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // DEV BYPASS
    if (process.env.NODE_ENV === "development" && token === "MOCK_TOKEN_ADMIN") {
      // Mock admin is SUPER_USER, which has write access
      return next();
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const normalizeRole = (r: string) => {
          if (["DLH", "DLH_ADMIN", "Admin DLH"].includes(r)) return "ADMIN_DLH";
          if (["ADMIN_KECAMATAN", "Camat", "CAMAT_ADMIN"].includes(r)) return "CAMAT";
          if (["ADMIN_KELURAH", "Lurah", "LURAH_ADMIN"].includes(r)) return "LURAH";
          return r;
        };
        const role = normalizeRole(decoded.role);

        if (role === "CAMAT" || role === "LURAH" || role === "ADMIN_DLH") {
          const writeMethods = ["POST", "PUT", "DELETE", "PATCH"];
          if (writeMethods.includes(req.method)) {
            // Exception: ADMIN_DLH can resolve discrepancy
            const isResolveDiscrepancy =
              role === "ADMIN_DLH" &&
              req.method === "PUT" &&
              req.originalUrl.includes("/waste/logs/") &&
              req.originalUrl.endsWith("/resolve");

            // Exception: ADMIN_DLH can register staff (Camat, Lurah, RW, Petugas)
            const isRegisterStaff =
              role === "ADMIN_DLH" &&
              req.method === "POST" &&
              /\/api\/v1\/auth\/register\/(camat|lurah|rw|petugas-residu)/.test(req.originalUrl);

            // Exception: ADMIN_DLH can approve KKN whitelist
            const isKknApproval =
              role === "ADMIN_DLH" &&
              (req.method === "PATCH" || req.method === "PUT") &&
              req.originalUrl.includes("/auth/kkn/whitelist");

            // Exception: ADMIN_DLH can generate and assign QR batches
            const isQrBatchManagement =
              role === "ADMIN_DLH" &&
              (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") &&
              (req.originalUrl.includes("/bins/generate-qr") ||
                req.originalUrl.includes("/bins/qr-batch"));

            // Exception: Any user can manage their notification inbox & profile/password settings
            const isUserNotificationAction =
              req.originalUrl.includes("/notifications") ||
              req.originalUrl.includes("/auth/profile") ||
              req.originalUrl.includes("/auth/password") ||
              req.originalUrl.includes("/auth/change-password");

            if (
              !isResolveDiscrepancy &&
              !isRegisterStaff &&
              !isKknApproval &&
              !isQrBatchManagement &&
              !isUserNotificationAction
            ) {
              res.status(403).json({
                error: "FORBIDDEN",
                message: `Role ${role} hanya memiliki akses Read-Only. Operasi tulis ditolak.`,
              });
              return;
            }
          }
        }
      } catch {
        // Ignore token verification error here, authMiddleware will reject it with 401
      }
    }
  } catch (error) {
    console.error("[readOnlyGuard] error:", error);
  }

  next();
};
