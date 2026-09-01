/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { userService } from "../services/userService.js";

export const userController = {
  /**
   * Get all users with search and filtering
   */
  getAll: async (req: Request, res: Response): Promise<void> => {
    try {
      const { search, roleName, status, rw, rt } = req.query;

      const mapped = await userService.getAllUsers(
        {
          search: search as string,
          roleName: roleName as string,
          status: status as string,
          rw: rw as string,
          rt: rt as string,
        },
        req.user!
      );

      res.status(200).json({ success: true, data: mapped });
    } catch (error: any) {
      console.error("[UserController] getAll uncaught error STACK:", error?.stack || error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error?.message
          ? `Gagal memuat data pengguna: ${error.message}`
          : "Gagal memuat data pengguna",
      });
    }
  },

  /**
   * Delete a user by ID
   */
  deleteUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.userId;
      const currentUserRole = req.user?.role;

      await userService.deleteUser(id, currentUserId, currentUserRole);

      res.status(200).json({ success: true, message: "Pengguna berhasil dihapus" });
    } catch (error: any) {
      console.error("[UserController] deleteUser error:", error);

      if (error.message === "USER_NOT_FOUND") {
        res
          .status(404)
          .json({ success: false, error: "NOT_FOUND", message: "Pengguna tidak ditemukan" });
      } else if (error.message === "DELETE_SELF") {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message: "Tidak bisa menghapus akun sendiri",
        });
      } else if (error.message === "FORBIDDEN_DEVELOPER_MUTATION") {
        res.status(403).json({
          success: false,
          error: "FORBIDDEN",
          message: "Hanya Developer yang dapat mengelola atau menghapus akun Developer",
        });
      } else if (error.message === "FORBIDDEN_ROLE_DELETE") {
        res.status(403).json({
          success: false,
          error: "FORBIDDEN",
          message: "Anda tidak memiliki izin untuk menghapus akun dengan peran ini",
        });
      } else {
        res.status(500).json({
          success: false,
          error: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus pengguna",
        });
      }
    }
  },

  createUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, phone, password, roleName } = req.body;
      if (!name || !phone || !password || !roleName) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "name, phone, password, dan roleName wajib diisi",
        });
        return;
      }

      const newUser = await userService.createUser(req.body, req.user!);

      res.status(201).json({
        success: true,
        data: newUser,
      });
    } catch (error: any) {
      console.error("[UserController] createUser error:", error);

      if (error.message === "FORBIDDEN_DEVELOPER_MUTATION") {
        res.status(403).json({
          success: false,
          error: "FORBIDDEN",
          message: "Hanya akun Developer yang dapat membuat akun Developer",
        });
      } else if (error.message === "FORBIDDEN_ROLE_CREATION") {
        res.status(403).json({
          success: false,
          error: "FORBIDDEN",
          message: "Anda tidak memiliki izin untuk membuat akun dengan peran ini",
        });
      } else if (
        error.message === "NIM_CONFLICT" ||
        (error.code === "P2002" && String(error.meta?.target || "").includes("nim"))
      ) {
        res.status(409).json({
          success: false,
          error: "CONFLICT",
          message: "NIM (Nomor Induk Mahasiswa) sudah terdaftar di sistem BERSEKA",
        });
      } else if (
        error.message === "PHONE_CONFLICT" ||
        (error.code === "P2002" &&
          (String(error.meta?.target || "").includes("phone") ||
            String(error.meta?.target || "").includes("no_telepon")))
      ) {
        res.status(409).json({
          success: false,
          error: "CONFLICT",
          message: "Nomor telepon (+62) sudah terdaftar di sistem BERSEKA",
        });
      } else if (error.message === "PHONE_REQUIRED") {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Nomor telepon wajib diisi",
        });
      } else if (error.message === "RW_ALREADY_HAS_PETUGAS_RESIDU") {
        res.status(409).json({
          success: false,
          error: "CONFLICT",
          message: "Wilayah RW ini sudah memiliki Petugas Pemilah yang terdaftar",
        });
      } else if (error.message === "ROLE_NOT_FOUND") {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: `Role '${req.body.roleName}' tidak ditemukan`,
        });
      } else if (error.message === "EMAIL_CONFLICT") {
        res
          .status(409)
          .json({ success: false, error: "CONFLICT", message: "Email sudah digunakan" });
      } else {
        res.status(500).json({
          success: false,
          error: "INTERNAL_SERVER_ERROR",
          message: error.message
            ? `Gagal membuat pengguna: ${error.message}`
            : "Gagal membuat pengguna",
        });
      }
    }
  },

  /**
   * Update an existing user (Admin only)
   */
  updateUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const updatedUser = await userService.updateUser(id, req.body, req.user!);

      res.status(200).json({
        success: true,
        data: updatedUser,
      });
    } catch (error: any) {
      console.error("[UserController] updateUser error:", error);

      if (error.message === "CANNOT_DEACTIVATE_SELF") {
        res.status(400).json({
          success: false,
          error: "BAD_REQUEST",
          message:
            "Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang terhubung ke sistem.",
        });
      } else if (error.message === "FORBIDDEN_DEVELOPER_MUTATION") {
        res.status(403).json({
          success: false,
          error: "FORBIDDEN",
          message: "Hanya akun Developer yang dapat memodifikasi akun Developer",
        });
      } else if (error.message === "FORBIDDEN_ROLE_UPDATE") {
        res.status(403).json({
          success: false,
          error: "FORBIDDEN",
          message: "Anda tidak memiliki izin untuk memodifikasi akun dengan peran ini",
        });
      } else if (error.message === "USER_NOT_FOUND") {
        res
          .status(404)
          .json({ success: false, error: "NOT_FOUND", message: "Pengguna tidak ditemukan" });
      } else if (error.message === "ROLE_NOT_FOUND") {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: `Role '${req.body.roleName}' tidak ditemukan`,
        });
      } else if (error.message === "NIM_ALREADY_REGISTERED") {
        res.status(400).json({
          success: false,
          code: "VALIDATION_ERROR",
          message: "NIM (Nomor Induk Mahasiswa) sudah terdaftar di sistem BERSEKA",
        });
      } else if (
        error.message === "PHONE_CONFLICT" ||
        (error.code === "P2002" &&
          (String(error.meta?.target || "").includes("phone") ||
            String(error.meta?.target || "").includes("no_telepon")))
      ) {
        res.status(409).json({
          success: false,
          error: "CONFLICT",
          message: "Nomor telepon sudah terdaftar di sistem",
        });
      } else if (error.message === "RW_ALREADY_HAS_PETUGAS_RESIDU") {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Wilayah RW tersebut sudah memiliki Petugas Residu aktif",
        });
      } else {
        res.status(500).json({
          success: false,
          error: "INTERNAL_SERVER_ERROR",
          message: error.message || "Gagal memperbarui pengguna",
        });
      }
    }
  },

  getOnboardingStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const status = await userService.getOnboardingStatus(id);
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      console.error("Error in getOnboardingStatus:", error);
      if (error.message === "USER_NOT_FOUND") {
        res
          .status(404)
          .json({ success: false, error: "NOT_FOUND", message: "Pengguna tidak ditemukan" });
      } else {
        res.status(500).json({
          success: false,
          error: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil status onboarding",
        });
      }
    }
  },
};
