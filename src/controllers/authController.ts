/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { z } from "zod";
import { authService } from "../services/authService.js";

// Validation Schemas
const loginSchema = z.object({
  email: z.string().refine(
    (val) => {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      const isNik = /^\d{16}$/.test(val);
      return isEmail || isNik;
    },
    {
      message: "Format email atau NIK tidak valid",
    }
  ),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token diperlukan"),
});

const updateProfileSchema = z.object({
  name: z.string().min(1, "Nama diperlukan").optional(),
  email: z.string().email("Format email tidak valid").optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  fotoProfil: z.string().optional().nullable(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Password lama diperlukan"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
});

export class AuthController {
  /**
   * Handle User Login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // 1. Validate Input
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          code: "VALIDATION_ERROR",
          message: "Format email atau password tidak valid",
          fields: parsed.error.format(),
        });
        return;
      }
      const { email: emailOrNik, password } = parsed.data;

      // 2. Call Service
      const result = await authService.login(emailOrNik, password);

      // 3. Set HttpOnly Cookie for Web (Access Token)
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      // 4. Return response (Include refresh token in body for Mobile client to store securely)
      res.status(200).json({
        message: "Login berhasil",
        data: {
          user: result.user,
          accessToken: result.accessToken, // For Mobile client
          refreshToken: result.refreshToken, // Mobile & Web client use this to refresh
        },
      });
    } catch (error: any) {
      const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
      const emailLog = req.body?.email || "unknown";
      console.warn(
        `[Login Failed] IP: ${ip} | Email/NIK: ${emailLog} | Reason: ${error.message || error.name}`
      );

      if (
        error.name === "DatabaseUnavailableError" ||
        error.message?.includes("DatabaseUnavailable")
      ) {
        res.status(503).json({
          success: false,
          code: "SERVICE_UNAVAILABLE",
          message: "Server sedang bermasalah, coba lagi nanti",
        });
      } else if (error.message === "USER_NOT_FOUND") {
        res.status(401).json({
          success: false,
          code: "USER_NOT_FOUND",
          message: "User tidak ditemukan",
        });
      } else if (error.message === "WRONG_PASSWORD") {
        res.status(401).json({
          success: false,
          code: "WRONG_PASSWORD",
          message: "Password salah",
        });
      } else {
        res.status(500).json({
          success: false,
          code: "INTERNAL_SERVER_ERROR",
          message: "Terjadi kesalahan pada server",
        });
      }
    }
  }

  /**
   * Handle Token Refresh
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      // Accept refresh token from body
      const parsed = refreshSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "Refresh token diperlukan" });
        return;
      }
      const { refreshToken } = parsed.data;

      const result = await authService.refresh(refreshToken);

      // Set new Access Token Cookie
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.status(200).json({
        message: "Token berhasil diperbarui",
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error: any) {
      if (error.message === "INVALID_TOKEN" || error.message === "TOKEN_EXPIRED") {
        res
          .status(401)
          .json({ error: "UNAUTHORIZED", message: "Refresh token tidak valid atau kadaluarsa" });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan pada server" });
      }
    }
  }

  /**
   * Handle User Logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      // Clear cookie
      res.clearCookie("accessToken");

      res.status(200).json({ message: "Logout berhasil" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan saat logout" });
    }
  }
  /**
   * Handle Update Profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "UNAUTHORIZED", message: "Tidak memiliki akses" });
        return;
      }

      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.format() });
        return;
      }
      const { name, email, phone, address, fotoProfil } = parsed.data;

      const updatedUser = await authService.updateProfile(
        req.user.userId,
        name,
        email,
        phone ?? undefined,
        address ?? undefined,
        fotoProfil ?? undefined
      );

      res.status(200).json({
        message: "Profil berhasil diperbarui",
        data: {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: (updatedUser as any).phone,
            address: (updatedUser as any).address,
            fotoProfil: (updatedUser as any).fotoProfil,
          },
        },
      });
    } catch (error: any) {
      if (error.message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "NOT_FOUND", message: "User tidak ditemukan" });
      } else if (error.message === "EMAIL_ALREADY_IN_USE") {
        res
          .status(409)
          .json({ error: "CONFLICT", message: "Email sudah digunakan oleh akun lain" });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan pada server" });
      }
    }
  }

  /**
   * Handle Update Password
   */
  async updatePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "UNAUTHORIZED", message: "Tidak memiliki akses" });
        return;
      }

      const parsed = updatePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.format() });
        return;
      }
      const { currentPassword, newPassword } = parsed.data;

      await authService.updatePassword(req.user.userId, currentPassword, newPassword);

      res.status(200).json({ message: "Password berhasil diperbarui" });
    } catch (error: any) {
      if (error.message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "NOT_FOUND", message: "User tidak ditemukan" });
      } else if (error.message === "INVALID_CREDENTIALS") {
        res.status(401).json({ error: "UNAUTHORIZED", message: "Password lama salah" });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan pada server" });
      }
    }
  }

  /**
   * Get Current Authenticated User Profile
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "UNAUTHORIZED", message: "Tidak memiliki akses" });
        return;
      }

      const user = await authService.getCurrentUser(req.user.userId);
      res.status(200).json({
        success: true,
        message: "Authenticated",
        user,
      });
    } catch (error: any) {
      if (error.message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "NOT_FOUND", message: "User tidak ditemukan" });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan pada server" });
      }
    }
  }

  /**
   * Handle Profile Picture Upload
   */
  async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "UNAUTHORIZED", message: "Tidak memiliki akses" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "BAD_REQUEST", message: "File gambar tidak ditemukan" });
        return;
      }

      const filePath = `/uploads/${req.file.filename}`;
      const updatedUser = await authService.updateProfile(
        req.user.userId,
        undefined,
        undefined,
        undefined,
        undefined,
        filePath
      );

      res.status(200).json({
        success: true,
        message: "Foto profil berhasil diunggah",
        data: {
          fotoProfil: filePath,
        },
      });
    } catch (error: any) {
      if (error.message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "NOT_FOUND", message: "User tidak ditemukan" });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengunggah foto profil" });
      }
    }
  }
}

export const authController = new AuthController();
