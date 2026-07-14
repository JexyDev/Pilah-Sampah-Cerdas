import { Request, Response } from "express";
import { userService } from "../services/userService.js";

export class UserController {
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json({
        message: "Berhasil mengambil data pengguna",
        data: users
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil data pengguna" });
    }
  }
}

export const userController = new UserController();
