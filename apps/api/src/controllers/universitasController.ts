import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class UniversitasController {
  /**
   * Get all Universitas Mitra
   */
  async getUniversitas(req: Request, res: Response): Promise<void> {
    try {
      const data = await prisma.universitasMitra.findMany({
        orderBy: { name: "asc" },
      });
      res.status(200).json({ success: true, data });
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
      const { name } = req.body;
      if (!name || name.trim() === "") {
        res.status(400).json({ success: false, message: "Nama universitas tidak boleh kosong" });
        return;
      }

      // Check for duplicate
      const existing = await prisma.universitasMitra.findUnique({
        where: { name: name.trim() },
      });

      if (existing) {
        res.status(400).json({ success: false, message: "Universitas sudah terdaftar" });
        return;
      }

      const newData = await prisma.universitasMitra.create({
        data: { name: name.trim() },
      });

      res.status(201).json({ success: true, message: "Universitas berhasil ditambahkan", data: newData });
    } catch (error: any) {
      console.error("[createUniversitas Error]", error);
      res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
    }
  }

  /**
   * Delete a Universitas Mitra
   */
  async deleteUniversitas(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Check if it's being used by any DPL
      const usedBy = await prisma.user.findFirst({
        where: { universitasId: id }
      });

      if (usedBy) {
        res.status(400).json({ success: false, message: "Universitas tidak dapat dihapus karena masih digunakan oleh DPL" });
        return;
      }

      await prisma.universitasMitra.delete({
        where: { id },
      });

      res.status(200).json({ success: true, message: "Universitas berhasil dihapus" });
    } catch (error: any) {
      if (error.code === 'P2025') {
        res.status(404).json({ success: false, message: "Universitas tidak ditemukan" });
        return;
      }
      console.error("[deleteUniversitas Error]", error);
      res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
    }
  }
}

export const universitasController = new UniversitasController();
