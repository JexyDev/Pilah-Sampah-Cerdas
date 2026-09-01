/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { Request, Response } from "express";
import { poskoKknService } from "../services/poskoKknService.js";
import { prisma } from "../lib/prisma.js";

export class PoskoKknController {
  /** GET /posko-kkn — semua posko */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const data = await poskoKknService.getAllPosko(user?.userId, user?.role);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res
        .status(500)
        .json({ success: false, message: err.message || "Gagal mengambil data posko" });
    }
  }

  /** GET /posko-kkn/me — posko milik kelompok user yg login */
  async getMyPosko(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const data = await poskoKknService.getPoskoByUserId(userId);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal mengambil posko" });
    }
  }

  /** POST /posko-kkn — daftar / update posko (upsert) */
  async upsert(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const peran = (req as any).user?.role;
      const {
        nama,
        alamat,
        latitude,
        longitude,
        fotoUrl,
        foto,
        keterangan,
        kelompokId: bodyKelompokId,
        radius,
        statusApproval,
      } = req.body;

      if (!nama || !alamat || latitude === undefined || longitude === undefined) {
        res
          .status(400)
          .json({ success: false, message: "nama, alamat, latitude, longitude wajib diisi" });
        return;
      }

      let targetKelompokId = bodyKelompokId;

      // MAHASISWA_KKN: auto-resolve kelompok dari data student
      if (peran === "MAHASISWA_KKN" && !targetKelompokId) {
        const student = await prisma.studentKkn.findUnique({
          where: { userId },
          select: { kelompokId: true, isKetua: true },
        });
        if (!student?.kelompokId) {
          res
            .status(400)
            .json({ success: false, message: "Mahasiswa belum terdaftar dalam kelompok KKN" });
          return;
        }
        if (!student.isKetua) {
          res.status(403).json({
            success: false,
            message: "Hanya Ketua Kelompok yang dapat mendaftarkan Posko KKN",
          });
          return;
        }
        targetKelompokId = student.kelompokId;
      }

      if (!targetKelompokId) {
        res.status(400).json({ success: false, message: "kelompokId wajib diisi" });
        return;
      }

      let resolvedFoto = fotoUrl || foto;
      if (req.file) {
        resolvedFoto = `/uploads/${req.file.filename}`;
      }

      const parsedRadius = radius != null && radius !== "" ? Number(radius) : undefined;

      const posko = await poskoKknService.upsertPosko(targetKelompokId, {
        nama,
        alamat,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius: parsedRadius,
        fotoUrl: resolvedFoto || undefined,
        keterangan: keterangan || undefined,
        statusApproval: statusApproval || undefined,
      });

      const resData = {
        ...posko,
        foto: posko.fotoUrl || null,
        fotoUrl: posko.fotoUrl || null,
        radius: Number((posko as any).radius) || 500,
        statusApproval: statusApproval || posko.keterangan || "APPROVED",
      };

      res
        .status(200)
        .json({ success: true, message: "Posko KKN berhasil disimpan", data: resData });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Gagal menyimpan posko" });
    }
  }

  /** DELETE /posko-kkn/:kelompokId */
  async deletePosko(req: Request, res: Response): Promise<void> {
    try {
      const { kelompokId } = req.params;
      await poskoKknService.deletePosko(kelompokId);
      res.status(200).json({ success: true, message: "Posko berhasil dihapus" });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || "Gagal menghapus posko" });
    }
  }
}

export const poskoKknController = new PoskoKknController();
