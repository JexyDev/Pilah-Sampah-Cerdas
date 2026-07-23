/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { z } from "zod";
import { authService } from "../services/authService.js";

/**
 * Normalize phone: 08xxx → +628xxx, 628xxx → +628xxx
 */
function normalizePhone(phone: string): string {
  let p = phone.trim();
  if (p.startsWith("08")) p = "+62" + p.slice(1);
  else if (p.startsWith("62") && !p.startsWith("+")) p = "+" + p;
  return p;
}

// Validation Schemas
const loginSchema = z.object({
  phone: z.string().min(1, "Nomor HP diperlukan"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token diperlukan"),
});

const requestOtpSchema = z.object({
  phone: z.string().regex(/^\+62\d{8,15}$/, "Format nomor HP tidak valid (harus diawali +62 dan 9-16 digit)"),
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+62\d{8,15}$/, "Format nomor HP tidak valid"),
  otp: z.string().length(6, "OTP harus 6 digit"),
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

const registerStaffSchema = z.object({
  name: z.string().min(1, "Nama diperlukan"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  nik: z.string().optional(),
  phone: z.string().min(1, "No. Telfon diperlukan"),
  address: z.string().optional(),
});

const registerWargaSchema = z.object({
  name: z.string().min(1, "Nama diperlukan").optional(),
  nama: z.string().min(1).optional(), // alias for name (mobile compat)
  email: z.string().email("Format email tidak valid").optional(),
  password: z.string().min(6, "Password minimal 6 karakter"),
  nik: z.string().optional(),
  phone: z.string().min(1, "No. Telfon diperlukan"),
  noWa: z.string().optional(), // alias for phone whatsapp
  address: z.string().optional(),
  qrCode: z.string().optional(),
  wargaSubtype: z.enum(["UTAMA", "TAMBAHAN"]).optional(),
  rtRwId: z.number().int().optional(),
  rtRw: z.string().optional(), // string "01/02" from mobile
  kelurahan: z.string().optional(), // kelurahan name from mobile
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const registerKknSchema = registerStaffSchema.extend({
  nim: z.string().min(1, "NIM diperlukan"),
  jurusan: z.string().min(1, "Jurusan diperlukan"),
  fakultas: z.string().min(1, "Fakultas diperlukan"),
  noWa: z.string().min(1, "WhatsApp diperlukan"),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Format tanggal mulai tidak valid"),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Format tanggal selesai tidak valid"),
  assignedPolygonId: z.number().int().optional(),
});

const registerPetugasSchema = registerStaffSchema.extend({
  noWa: z.string().min(1, "WhatsApp diperlukan"),
  assignedZone: z.string().optional(),
});

export class AuthController {
  /**
   * Handle User Login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Normalize phone before validation
      if (req.body?.phone) {
        req.body.phone = normalizePhone(req.body.phone);
      }

      // 1. Validate Input
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          code: "VALIDATION_ERROR",
          message: "Format nomor HP atau password tidak valid",
          fields: parsed.error.format(),
        });
        return;
      }
      const { phone, password } = parsed.data;

      // 2. Call Service
      const result = await authService.login(phone, password);

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
      const phoneLog = req.body?.phone || "unknown";
      console.warn(
        `[Login Failed] IP: ${ip} | Phone: ${phoneLog} | Reason: ${error.message || error.name}`
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
      } else if (error.message === "USER_INACTIVE") {
        res.status(403).json({
          success: false,
          code: "USER_INACTIVE",
          message: "Akun Anda belum aktif atau telah dinonaktifkan",
        });
      } else {
        console.error("[Login Error Detail]", error);
        res.status(500).json({
          success: false,
          code: "INTERNAL_SERVER_ERROR",
          message: "Terjadi kesalahan pada server",
        });
      }
    }
  }

  async requestOtp(req: Request, res: Response): Promise<void> {
    try {
      const parsed = requestOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          code: "VALIDATION_ERROR",
          message: "Format nomor HP tidak valid",
          fields: parsed.error.format(),
        });
        return;
      }
      
      const { phone } = parsed.data;
      const result = await authService.requestOtp(phone);
      
      res.status(200).json({
        success: true,
        message: "OTP berhasil dikirim",
        data: result
      });
    } catch (error: any) {
      if (error.message === "USER_NOT_FOUND") {
        res.status(404).json({ success: false, code: "USER_NOT_FOUND", message: "Nomor HP tidak terdaftar" });
      } else {
        res.status(500).json({ success: false, code: "INTERNAL_SERVER_ERROR", message: "Gagal meminta OTP" });
      }
    }
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const parsed = verifyOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          code: "VALIDATION_ERROR",
          message: "Format nomor HP atau OTP tidak valid",
          fields: parsed.error.format(),
        });
        return;
      }
      
      const { phone, otp } = parsed.data;
      const result = await authService.verifyOtp(phone, otp);
      
      // Set HttpOnly Cookie for Web (Access Token)
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.status(200).json({
        success: true,
        message: "Login berhasil",
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error: any) {
      if (error.message === "INVALID_OTP") {
        res.status(401).json({ success: false, code: "INVALID_OTP", message: "OTP salah atau sudah kedaluwarsa" });
      } else {
        res.status(500).json({ success: false, code: "INTERNAL_SERVER_ERROR", message: "Gagal memverifikasi OTP" });
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
    } catch {
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
      await authService.updateProfile(
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

  /**
   * Register Admin DLH
   */
  async registerAdminDlh(req: Request, res: Response): Promise<void> {
    try {
      const parsed = registerStaffSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ success: false, code: "VALIDATION_ERROR", details: parsed.error.format() });
        return;
      }
      const user = await authService.registerStaff(parsed.data, "ADMIN_DLH");
      res
        .status(201)
        .json({ success: true, data: { id: user.id, name: user.name, email: user.email } });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Register Camat
   */
  async registerCamat(req: Request, res: Response): Promise<void> {
    try {
      const parsed = registerStaffSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ success: false, code: "VALIDATION_ERROR", details: parsed.error.format() });
        return;
      }
      const user = await authService.registerStaff(parsed.data, "CAMAT");
      res
        .status(201)
        .json({ success: true, data: { id: user.id, name: user.name, email: user.email } });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Register Lurah
   */
  async registerLurah(req: Request, res: Response): Promise<void> {
    try {
      const parsed = registerStaffSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ success: false, code: "VALIDATION_ERROR", details: parsed.error.format() });
        return;
      }
      const user = await authService.registerStaff(parsed.data, "LURAH");
      res
        .status(201)
        .json({ success: true, data: { id: user.id, name: user.name, email: user.email } });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Register RW
   */
  async registerRw(req: Request, res: Response): Promise<void> {
    try {
      const rwParsed = z
        .object({
          name: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(6),
          nik: z.string().optional(),
          phone: z.string().min(1),
          address: z.string().optional(),
          rtRwId: z.number().int(),
        })
        .safeParse(req.body);

      if (!rwParsed.success) {
        res
          .status(400)
          .json({ success: false, code: "VALIDATION_ERROR", details: rwParsed.error.format() });
        return;
      }
      const user = await authService.registerStaff(rwParsed.data, "RW");
      res
        .status(201)
        .json({ success: true, data: { id: user.id, name: user.name, email: user.email } });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Register Warga
   */
  async registerWarga(req: Request, res: Response): Promise<void> {
    try {
      // Normalize phone before validation
      if (req.body?.phone) req.body.phone = normalizePhone(req.body.phone);
      if (req.body?.noWa) req.body.noWa = normalizePhone(req.body.noWa);
      // Accept 'nama' as alias for 'name'
      if (!req.body?.name && req.body?.nama) req.body.name = req.body.nama;

      const parsed = registerWargaSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ success: false, code: "VALIDATION_ERROR", details: parsed.error.format() });
        return;
      }
      const { qrCode, wargaSubtype, rtRwId, rtRw, kelurahan, latitude, longitude, nama, noWa, ...userData } = parsed.data;

      // Resolve rtRwId from string if needed
      let resolvedRtRwId = rtRwId;
      if (!resolvedRtRwId && (rtRw || kelurahan)) {
        resolvedRtRwId = await authService.resolveRtRwId(rtRw, kelurahan);
      }

      const householdData = {
        address: userData.address || "",
        rtRwId: resolvedRtRwId || 1, // fallback to first area
        latitude: latitude || 0,
        longitude: longitude || 0,
      };

      // Generate dummy email from phone if not provided
      if (!userData.email) {
        userData.email = userData.phone.replace("+", "") + "@pilahsampah.id";
      }

      let token = "";
      if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
      } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
      }

      let scannerUser: any = null;
      if (token) {
        try {
          const { verifyAccessToken } = await import("../utils/jwtUtils.js");
          scannerUser = verifyAccessToken(token);
        } catch {}
      }

      const result = await authService.registerWarga(
        userData,
        householdData,
        qrCode || undefined,
        wargaSubtype,
        scannerUser
      );
      res
        .status(201)
        .json({
          success: true,
          data: {
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          },
        });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Register Mahasiswa KKN
   */
  async registerKkn(req: Request, res: Response): Promise<void> {
    try {
      // Normalize phone before validation
      if (req.body?.phone) req.body.phone = normalizePhone(req.body.phone);
      if (req.body?.noWa) req.body.noWa = normalizePhone(req.body.noWa);
      if (!req.body?.name && req.body?.nama) req.body.name = req.body.nama;
      // Generate dummy email from phone if not provided
      if (!req.body?.email && req.body?.phone) {
        req.body.email = normalizePhone(req.body.phone).replace("+", "") + "@pilahsampah.id";
      }

      const parsed = registerKknSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ success: false, code: "VALIDATION_ERROR", details: parsed.error.format() });
        return;
      }
      const { nim, jurusan, fakultas, noWa, startDate, endDate, assignedPolygonId, ...userData } =
        parsed.data;
      const kknData = {
        nim,
        jurusan,
        fakultas,
        noWa,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        assignedPolygonId,
      };

      const result = await authService.registerKkn(userData, kknData);
      res.status(201).json({
        success: true,
        data: { id: result.user.id, name: result.user.name, status: result.user.status },
      });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Register Petugas Residu
   */
  async registerPetugasResidu(req: Request, res: Response): Promise<void> {
    try {
      // Normalize phone before validation
      if (req.body?.phone) req.body.phone = normalizePhone(req.body.phone);
      if (req.body?.noWa) req.body.noWa = normalizePhone(req.body.noWa);
      if (!req.body?.name && req.body?.nama) req.body.name = req.body.nama;
      if (!req.body?.email && req.body?.phone) {
        req.body.email = normalizePhone(req.body.phone).replace("+", "") + "@pilahsampah.id";
      }

      const parsed = registerPetugasSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ success: false, code: "VALIDATION_ERROR", details: parsed.error.format() });
        return;
      }
      const { noWa, assignedZone, ...userData } = parsed.data;
      const petugasData = {
        nama: userData.name,
        noWa,
        assignedZone,
      };

      const result = await authService.registerPetugasResidu(userData, petugasData);
      res.status(201).json({ success: true, data: { id: result.user.id, name: result.user.name } });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Get KKN pending list
   */
  async getKknPending(req: Request, res: Response): Promise<void> {
    try {
      const list = await authService.getKknPendingList();
      res.status(200).json({ success: true, data: list });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Approve KKN whitelist
   */
  async approveKkn(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body; // APPROVED or REJECTED
      if (status !== "APPROVED" && status !== "REJECTED") {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "status harus APPROVED atau REJECTED",
        });
        return;
      }
      const adminUserId = req.user!.userId;
      const user = await authService.updateKknWhitelistStatus(id, status, adminUserId);
      res.status(200).json({
        success: true,
        message: `Status whitelist mahasiswa KKN berhasil diperbarui ke ${status}`,
        data: { id: user.id, status: user.status },
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }
}

export const authController = new AuthController();
