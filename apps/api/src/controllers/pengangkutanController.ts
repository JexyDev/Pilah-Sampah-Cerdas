/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { Request, Response } from "express";
import { pengangkutanService } from "../services/pengangkutanService.js";

export class PengangkutanController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      let rwId: number | undefined;

      // Restrict to user's RW area if they are RT/RW
      if (user && (user.role === "RW" || user.role === "RT")) {
        rwId = user.rwId;
      } else if (req.query.rwId) {
        rwId = parseInt(req.query.rwId as string, 10);
      }

      const status = req.query.status as string | undefined;

      const tasks = await pengangkutanService.getAll({ status, rwId });
      res.status(200).json({ success: true, data: tasks });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memuat data pengangkutan",
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const task = await pengangkutanService.getById(id);
      res.status(200).json({ success: true, data: task });
    } catch (error: any) {
      const status = error.message === "DISPATCH_TASK_NOT_FOUND" ? 404 : 500;
      res.status(status).json({
        success: false,
        code: error.message || "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memuat data detail pengangkutan",
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { binId, status, claimedByUserId } = req.body;
      if (!binId) {
        res.status(400).json({
          success: false,
          code: "VALIDATION_ERROR",
          message: "ID tempat sampah (binId) wajib diisi",
        });
        return;
      }

      const task = await pengangkutanService.create({ binId, status, claimedByUserId });
      res.status(201).json({
        success: true,
        message: "Tugas pengangkutan berhasil dicatat",
        data: task,
      });
    } catch (error: any) {
      const status =
        error.message === "BIN_NOT_FOUND" || error.message === "USER_NOT_FOUND" ? 400 : 500;
      res.status(status).json({
        success: false,
        code: error.message || "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal mencatat tugas pengangkutan",
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, claimedByUserId } = req.body;

      const task = await pengangkutanService.update(id, { status, claimedByUserId });
      res.status(200).json({
        success: true,
        message: "Tugas pengangkutan berhasil diperbarui",
        data: task,
      });
    } catch (error: any) {
      const status =
        error.message === "DISPATCH_TASK_NOT_FOUND" || error.message === "USER_NOT_FOUND"
          ? 400
          : 500;
      res.status(status).json({
        success: false,
        code: error.message || "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memperbarui tugas pengangkutan",
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await pengangkutanService.delete(id);
      res.status(200).json({
        success: true,
        message: "Tugas pengangkutan berhasil dihapus",
      });
    } catch (error: any) {
      const status = error.message === "DISPATCH_TASK_NOT_FOUND" ? 404 : 500;
      res.status(status).json({
        success: false,
        code: error.message || "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal menghapus tugas pengangkutan",
      });
    }
  }
}

export const pengangkutanController = new PengangkutanController();
