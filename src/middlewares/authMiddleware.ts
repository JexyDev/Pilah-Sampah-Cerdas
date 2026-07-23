/**
 * Project: Pilah Sampah Cerdas
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwtUtils.js";

// Extend Express Request object to include the user payload
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = "";

    // 1. Try to get token from HttpOnly Cookie (Web Client)
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // 2. Try to get token from Authorization header (Mobile App)
    else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Token otentikasi tidak ditemukan" });
      return;
    }

    // DEV BYPASS
    if (process.env.NODE_ENV === "development" && token === "MOCK_TOKEN_ADMIN") {
      req.user = { userId: "mock-admin-id", role: "SUPER_ADMIN" };
      return next();
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Validate User Status in DB
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { status: true },
    });

    if (!dbUser || (dbUser.status !== "Aktif" && dbUser.status !== "ACTIVE")) {
      res
        .status(401)
        .json({ error: "UNAUTHORIZED", message: "Akun Anda tidak aktif atau belum disetujui" });
      return;
    }

    // Enforce Time-Bound Mahasiswa KKN read-only status
    if (decoded.role === "MAHASISWA_KKN") {
      const student = await prisma.studentKkn.findUnique({
        where: { userId: decoded.userId },
        select: { endDate: true },
      });
      if (student) {
        const now = new Date();
        if (now > student.endDate) {
          // If expired and not a safe read operation, block
          if (req.method !== "GET") {
            res.status(403).json({
              error: "FORBIDDEN",
              message: "Masa tugas KKN Anda telah berakhir. Akses diubah menjadi Read-Only.",
            });
            return;
          }
        }
      }
    }

    // Enforce CAMAT and LURAH read-only restriction
    if (decoded.role === "CAMAT" || decoded.role === "LURAH") {
      const writeMethods = ["POST", "PUT", "DELETE", "PATCH"];
      if (writeMethods.includes(req.method)) {
        res.status(403).json({
          error: "FORBIDDEN",
          message: `Role ${decoded.role} hanya memiliki akses Read-Only. Operasi tulis ditolak.`,
        });
        return;
      }
    }

    req.user = decoded; // Attach user payload to request
    next();
  } catch {
    res
      .status(401)
      .json({ error: "UNAUTHORIZED", message: "Token tidak valid atau sudah kadaluarsa" });
  }
};
