import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { Request, Response } from "express";
import { pemanfaatanService } from "../services/pemanfaatanService.js";


export class PemanfaatanController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        rwId,
        programKerjaId,
        nomorCaraPemanfaatan,
        program,
        teknologi,
        bahanBaku,
        volumeBahanBaku,
        unitBahanBaku,
        hasil,
        unitHasil,
        fotoDokumentasiUrl,
        tanggalPencatatan,
        jenisKomoditas,
        luasLahanM2,
        volumePupukDipakaiKg,
        bibitTelurGram,
        hasilKasgotKg,
        volumeBioaktivatorLiter,
        masaFermentasiHari,
      } = req.body;

      if (
        !rwId ||
        !nomorCaraPemanfaatan ||
        !program ||
        !teknologi ||
        !bahanBaku ||
        !volumeBahanBaku ||
        !unitBahanBaku ||
        !hasil ||
        !unitHasil ||
        !fotoDokumentasiUrl ||
        !tanggalPencatatan
      ) {
        res.status(400).json({ success: false, message: "Semua field wajib diisi" });
        return;
      }

      const result = await pemanfaatanService.create({
        rwId: parseInt(rwId, 10),
        programKerjaId,
        nomorCaraPemanfaatan,
        program,
        teknologi,
        bahanBaku,
        volumeBahanBaku: parseFloat(volumeBahanBaku),
        unitBahanBaku,
        hasil: parseFloat(hasil),
        unitHasil,
        fotoDokumentasiUrl,
        tanggalPencatatan: new Date(tanggalPencatatan),
        jenisKomoditas,
        luasLahanM2: luasLahanM2 ? parseFloat(luasLahanM2) : undefined,
        volumePupukDipakaiKg: volumePupukDipakaiKg ? parseFloat(volumePupukDipakaiKg) : undefined,
        bibitTelurGram: bibitTelurGram ? parseFloat(bibitTelurGram) : undefined,
        hasilKasgotKg: hasilKasgotKg ? parseFloat(hasilKasgotKg) : undefined,
        volumeBioaktivatorLiter: volumeBioaktivatorLiter
          ? parseFloat(volumeBioaktivatorLiter)
          : undefined,
        masaFermentasiHari: masaFermentasiHari ? parseInt(masaFermentasiHari, 10) : undefined,
      });

      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await pemanfaatanService.getAll(req.user);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (id === "feedback" || id === "feedbacks" || id === "kritik-saran" || id === "ulasan") {
        return await this.getAllFeedback(req, res);
      }
      const result = await pemanfaatanService.getById(id);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await pemanfaatanService.update(id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await pemanfaatanService.delete(id);
      res.status(200).json({ success: true, message: "Program pemanfaatan berhasil dihapus" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ─────────────────────────────────────────────
  // KRITIK & SARAN / FEEDBACK CONTROLLERS
  // ─────────────────────────────────────────────

  async getAllFeedback(req: Request, res: Response): Promise<void> {
    try {
      const { status, kategori, search } = req.query;
      const result = await pemanfaatanService.getAllFeedback({
        status: status as string,
        kategori: kategori as string,
        search: search as string,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createFeedback(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const userId = user?.userId || user?.id;
      const { judul, isiKritikSaran, kategori, rating, rwId, programKerjaId, fotoBuktiUrl } = req.body;

      if (!judul || !isiKritikSaran) {
        res.status(400).json({ success: false, message: "Judul dan isi kritik/saran wajib diisi" });
        return;
      }

      let wargaNama = user?.name;
      let userRwId = user?.rwId || rwId;

      if (userId) {
        const dbU = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, rwId: true },
        });
        if (dbU) {
          if (!wargaNama) wargaNama = dbU.name;
          if (!userRwId && dbU.rwId) userRwId = dbU.rwId;
        }
      }

      const result = await pemanfaatanService.createFeedback({
        userId,
        wargaNama: wargaNama || "Warga BERSEKA",
        programKerjaId,
        kategori: kategori || "Pemanfaatan Sampah",
        judul,
        isiKritikSaran,
        rating: rating ? parseInt(rating, 10) : 5,
        rwId: userRwId ? parseInt(userRwId, 10) : undefined,
        fotoBuktiUrl,
      });

      res.status(201).json({ success: true, data: result, message: "Kritik & saran berhasil dikirim" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async respondFeedback(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const userId = user?.userId || user?.id;
      const { id } = req.params;
      const { tanggapan, status } = req.body;

      if (!tanggapan) {
        res.status(400).json({ success: false, message: "Tanggapan wajib diisi" });
        return;
      }

      let responderName = user?.name;
      if (!responderName && userId) {
        const dbU = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, role: { select: { name: true } } },
        });
        if (dbU) {
          responderName = `${dbU.name} (${dbU.role?.name || "Pengelola"})`;
        }
      }

      const result = await pemanfaatanService.respondFeedback(id, {
        tanggapan,
        ditanggapiOleh: responderName || "Pengelola BERSEKA",
        status: status || "SELESAI",
      });

      res.status(200).json({ success: true, data: result, message: "Tanggapan berhasil disimpan" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteFeedback(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      await pemanfaatanService.deleteFeedback(id, user);
      res.status(200).json({ success: true, message: "Kritik & saran berhasil dihapus" });
    } catch (error: any) {
      if (error.message === "FORBIDDEN_DELETE_FEEDBACK") {
        res.status(403).json({ success: false, message: "Anda tidak memiliki izin untuk menghapus kritik & saran ini" });
        return;
      }
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const pemanfaatanController = new PemanfaatanController();
