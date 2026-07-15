import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const userController = {
  /**
   * Get all users with search and filtering
   */
  getAll: async (req: Request, res: Response) => {
    try {
      const { search, roleName, status, rw, rt } = req.query;

      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          { name: { contains: search as string, mode: "insensitive" } },
          { email: { contains: search as string, mode: "insensitive" } },
          { nik: { contains: search as string, mode: "insensitive" } },
        ];
      }

      if (roleName) {
        whereClause.role = { name: roleName as string };
      }

      if (status) {
        whereClause.status = status as string;
      }

      if (rw || rt) {
        const conditions: any[] = [];
        if (rw) {
          conditions.push({ name: { contains: `RW ${rw}`, mode: "insensitive" } });
        }
        if (rt) {
          conditions.push({ name: { contains: `RT ${rt}`, mode: "insensitive" } });
        }
        whereClause.OR = [
          { rtRw: { AND: conditions } },
          { households: { some: { rtRw: { AND: conditions } } } }
        ];
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        include: {
          role: true,
          rtRw: {
            include: { kelurahan: true }
          },
          households: {
            include: {
              rtRw: {
                include: { kelurahan: true }
              },
              wasteLogs: {
                select: { weightKg: true }
              }
            }
          },
          pointHistory: {
            select: { points: true }
          }
        },
        orderBy: { createdAt: "desc" },
      });

      const mapped = users.map((u) => {
        let wilayah = "-";
        if (u.rtRw) {
          wilayah = `${u.rtRw.name} (Kel. ${u.rtRw.kelurahan.name})`;
        } else if (u.households.length > 0 && u.households[0].rtRw) {
          wilayah = `${u.households[0].rtRw.name} (Kel. ${u.households[0].rtRw.kelurahan.name})`;
        }

        let totalSetoranKg = 0;
        u.households.forEach(h => {
          h.wasteLogs.forEach(w => {
            totalSetoranKg += Number(w.weightKg);
          });
        });

        const totalPoin = u.pointHistory.reduce((sum, p) => sum + p.points, 0);

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role.name,
          nik: u.nik ?? "-",
          status: u.status,
          wilayah,
          setoran: parseFloat(totalSetoranKg.toFixed(1)),
          totalPoin,
          createdAt: u.createdAt,
        };
      });

      res.status(200).json({ success: true, data: mapped });
    } catch (error) {
      console.error("[UserController] getAll error:", error);
      res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR", message: "Gagal memuat data pengguna" });
    }
  },

  /**
   * Delete a user by ID
   */
  deleteUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        res.status(404).json({ success: false, error: "NOT_FOUND", message: "Pengguna tidak ditemukan" });
        return;
      }

      if (req.user?.userId === id) {
        res.status(400).json({ success: false, error: "BAD_REQUEST", message: "Tidak bisa menghapus akun sendiri" });
        return;
      }

      await prisma.user.delete({ where: { id } });
      res.status(200).json({ success: true, message: "Pengguna berhasil dihapus" });
    } catch (error) {
      console.error("[UserController] deleteUser error:", error);
      res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR", message: "Gagal menghapus pengguna" });
    }
  },

  /**
   * Create a new user (Admin only)
   */
  createUser: async (req: Request, res: Response) => {
    try {
      const { name, email, password, roleName, nik, status, rtRwId } = req.body;
      if (!name || !email || !password || !roleName) {
        res.status(400).json({ success: false, error: "VALIDATION_ERROR", message: "name, email, password, dan roleName wajib diisi" });
        return;
      }

      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (!role) {
        res.status(400).json({ success: false, error: "VALIDATION_ERROR", message: `Role '${roleName}' tidak ditemukan` });
        return;
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({ success: false, error: "CONFLICT", message: "Email sudah digunakan" });
        return;
      }

      if (nik) {
        const existingNik = await prisma.user.findUnique({ where: { nik } });
        if (existingNik) {
          res.status(409).json({ success: false, error: "CONFLICT", message: "NIK sudah digunakan" });
          return;
        }
      }

      const { hashPassword } = await import("../utils/hashUtils.js");
      const passwordHash = await hashPassword(password);

      const newUser = await prisma.user.create({
        data: { 
          name, 
          email, 
          password: passwordHash, 
          roleId: role.id,
          nik: nik || null,
          status: status || "Aktif",
          rtRwId: rtRwId ? parseInt(rtRwId) : null
        },
        include: { role: { select: { name: true } } },
      });

      res.status(201).json({
        success: true,
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role.name,
        },
      });
    } catch (error) {
      console.error("[UserController] createUser error:", error);
      res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR", message: "Gagal membuat pengguna" });
    }
  },

  /**
   * Update an existing user (Admin only)
   */
  updateUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, email, password, roleName, nik, status, rtRwId } = req.body;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        res.status(404).json({ success: false, error: "NOT_FOUND", message: "Pengguna tidak ditemukan" });
        return;
      }

      let roleId = user.roleId;
      if (roleName) {
        const role = await prisma.role.findUnique({ where: { name: roleName } });
        if (!role) {
          res.status(400).json({ success: false, error: "VALIDATION_ERROR", message: `Role '${roleName}' tidak ditemukan` });
          return;
        }
        roleId = role.id;
      }

      const updateData: any = { name, email, roleId };
      if (password) {
        const { hashPassword } = await import("../utils/hashUtils.js");
        updateData.password = await hashPassword(password);
      }
      if (nik !== undefined) {
        updateData.nik = nik || null;
      }
      if (status !== undefined) {
        updateData.status = status;
      }
      if (rtRwId !== undefined) {
        updateData.rtRwId = rtRwId ? parseInt(rtRwId) : null;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        include: { role: { select: { name: true } } },
      });

      res.status(200).json({
        success: true,
        data: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role.name,
        },
      });
    } catch (error) {
      console.error("[UserController] updateUser error:", error);
      res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR", message: "Gagal memperbarui pengguna" });
    }
  },
};
