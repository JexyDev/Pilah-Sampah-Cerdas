/**
 * Project: TrashCare
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
      });

      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await pemanfaatanService.getAll();
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
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
}

export const pemanfaatanController = new PemanfaatanController();
