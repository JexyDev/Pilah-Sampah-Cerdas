import { Request, Response } from "express";
import { userService } from "../services/userService.js";

export const userController = {
  /**
   * Get all users with search and filtering
   */
  getAll: async (req: Request, res: Response): Promise<void> => {
    try {
      const { search, roleName, status, rw, rt } = req.query;

      const mapped = await userService.getAllUsers({
        search: search as string,
        roleName: roleName as string,
        status: status as string,
        rw: rw as string,
        rt: rt as string,
      });

      res.status(200).json({ success: true, data: mapped });
    } catch (error) {
      console.error("[UserController] getAll error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Gagal memuat data pengguna",
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

      await userService.deleteUser(id, currentUserId);

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
      } else {
        res.status(500).json({
          success: false,
          error: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus pengguna",
        });
      }
    }
  },

  /**
   * Create a new user (Admin only)
   */
  createUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, roleName, nik, status, rtRwId } = req.body;
      if (!name || !email || !password || !roleName) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "name, email, password, dan roleName wajib diisi",
        });
        return;
      }

      const newUser = await userService.createUser({
        name,
        email,
        password,
        roleName,
        nik,
        status,
        rtRwId,
      });

      res.status(201).json({
        success: true,
        data: newUser,
      });
    } catch (error: any) {
      console.error("[UserController] createUser error:", error);

      if (error.message === "ROLE_NOT_FOUND") {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: `Role '${req.body.roleName}' tidak ditemukan`,
        });
      } else if (error.message === "EMAIL_CONFLICT") {
        res
          .status(409)
          .json({ success: false, error: "CONFLICT", message: "Email sudah digunakan" });
      } else if (error.message === "NIK_CONFLICT") {
        res.status(409).json({ success: false, error: "CONFLICT", message: "NIK sudah digunakan" });
      } else {
        res.status(500).json({
          success: false,
          error: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat pengguna",
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
      const { name, email, password, roleName, nik, status, rtRwId } = req.body;

      const updatedUser = await userService.updateUser(id, {
        name,
        email,
        password,
        roleName,
        nik,
        status,
        rtRwId,
      });

      res.status(200).json({
        success: true,
        data: updatedUser,
      });
    } catch (error: any) {
      console.error("[UserController] updateUser error:", error);

      if (error.message === "USER_NOT_FOUND") {
        res
          .status(404)
          .json({ success: false, error: "NOT_FOUND", message: "Pengguna tidak ditemukan" });
      } else if (error.message === "ROLE_NOT_FOUND") {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: `Role '${req.body.roleName}' tidak ditemukan`,
        });
      } else {
        res.status(500).json({
          success: false,
          error: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui pengguna",
        });
      }
    }
  },
};
