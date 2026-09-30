import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class UniversitasController {
  /**
   * Get all Universitas Mitra (Auto-seed UNIKOM if empty)
   */
  async getUniversitas(req: Request, res: Response): Promise<void> {
    try {
      let data = await prisma.universitasMitra.findMany({
        orderBy: { name: "asc" },
      });

      // Auto-initialize UNIKOM as primary university partner if empty
      if (data.length === 0) {
        try {
          const defaultUni = await prisma.universitasMitra.create({
            data: {
              name: "Universitas Komputer Indonesia (UNIKOM)",
            },
          });
          data = [defaultUni];
        } catch {
          data = await prisma.universitasMitra.findMany({
            orderBy: { name: "asc" },
          });
        }
      }

      const formatted = data.map((u) => ({
        id: u.id,
        name: u.name,
        nama: u.name,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));

      res.status(200).json({ success: true, data: formatted });
    } catch (error: any) {
      console.error("[getUniversitas Error]", error);
      res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
    }
  }

  /**
   * Create a new Universitas Mitra
   */
  async createUniversitas(req: Request, res: Response): Promise<void> {
    try {
      const name = (req.body.name || req.body.nama || "").trim();
      if (!name) {
        res.status(400).json({ success: false, message: "Nama universitas tidak boleh kosong" });
        return;
      }

      // Check for duplicate (case-insensitive)
      const existing = await prisma.universitasMitra.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
      });

      if (existing) {
        res.status(400).json({ success: false, message: "Universitas sudah terdaftar" });
        return;
      }

      const newData = await prisma.universitasMitra.create({
        data: { name },
      });

      res.status(201).json({
        success: true,
        message: "Universitas berhasil ditambahkan",
        data: {
          id: newData.id,
          name: newData.name,
          nama: newData.name,
          createdAt: newData.createdAt,
          updatedAt: newData.updatedAt,
        },
      });
    } catch (error: any) {
      console.error("[createUniversitas Error]", error);
      res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
    }
  }

  /**
   * Update a Universitas Mitra
   */
  async updateUniversitas(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const name = (req.body.name || req.body.nama || "").trim();

      if (!name) {
        res.status(400).json({ success: false, message: "Nama universitas tidak boleh kosong" });
        return;
      }

      // Check duplicate on different ID
      const duplicate = await prisma.universitasMitra.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          NOT: { id },
        },
      });

      if (duplicate) {
        res.status(400).json({ success: false, message: "Nama universitas sudah digunakan" });
        return;
      }

      const updated = await prisma.universitasMitra.update({
        where: { id },
        data: { name },
      });

      res.status(200).json({
        success: true,
        message: "Universitas berhasil diperbarui",
        data: {
          id: updated.id,
          name: updated.name,
          nama: updated.name,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        res.status(404).json({ success: false, message: "Universitas tidak ditemukan" });
        return;
      }
      console.error("[updateUniversitas Error]", error);
      res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
    }
  }

  /**
   * Delete a Universitas Mitra
   */
  async deleteUniversitas(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Check if it's being used by any user / DPL / Mahasiswa
      const usedBy = await prisma.user.findFirst({
        where: { universitasId: id },
      });

      if (usedBy) {
        res.status(400).json({
          success: false,
          message: "Universitas tidak dapat dihapus karena masih digunakan oleh DPL / Mahasiswa",
        });
        return;
      }

      await prisma.universitasMitra.delete({
        where: { id },
      });

      res.status(200).json({ success: true, message: "Universitas berhasil dihapus" });
    } catch (error: any) {
      if (error.code === "P2025") {
        res.status(404).json({ success: false, message: "Universitas tidak ditemukan" });
        return;
      }
      console.error("[deleteUniversitas Error]", error);
      res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
    }
  }
}

export const universitasController = new UniversitasController();
