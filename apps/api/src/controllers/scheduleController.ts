/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { scheduleService } from "../services/scheduleService.js";

export const scheduleController = {
  getAllSchedules: async (req: Request, res: Response) => {
    try {
      const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(String(req.user?.role || "").toUpperCase());
      const dplUserId = isDpl ? (req.user?.userId || (req.user as any)?.id) : undefined;

      const schedules = await scheduleService.getAllSchedules(dplUserId);
      res.status(200).json({
        success: true,
        data: schedules,
      });
    } catch (error: any) {
      console.error("[ScheduleController] getAllSchedules error:", error);
      res.status(500).json({ success: false, message: error?.message || "Internal server error" });
    }
  },

  createSchedule: async (req: Request, res: Response) => {
    try {
      const { title, date, time, category, location, latitude, longitude, radius, polygon, kelompokId, isActive } =
        req.body;
      if (!title || !date || !category) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Judul, tanggal, dan kategori kegiatan wajib diisi",
        });
        return;
      }

      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Format tanggal tidak valid (harus ISO 8601 atau YYYY-MM-DD)",
        });
        return;
      }

      let resolvedKelompokId = kelompokId || undefined;
      const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(
        String(req.user?.role || "").toUpperCase()
      );
      if (isDpl && !resolvedKelompokId && req.user?.userId) {
        const { PrismaClient } = await import("@prisma/client");
        const prisma = new PrismaClient();
        const dplGroup = await prisma.kelompokKkn.findFirst({
          where: { OR: [{ dplId: req.user.userId }, { dpl: { id: req.user.userId } }] },
        });
        if (dplGroup) {
          resolvedKelompokId = dplGroup.id;
        }
      }

      const schedule = await scheduleService.createSchedule({
        title,
        date: parsedDate,
        time,
        category,
        location,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        radius: radius ? Number(radius) : undefined,
        polygon: polygon ? polygon : undefined,
        kelompokId: resolvedKelompokId,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      });
      res.status(201).json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      console.error("[ScheduleController] createSchedule error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  deleteSchedule: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await scheduleService.deleteSchedule(id);
      res.status(200).json({
        success: true,
        message: "Jadwal berhasil dihapus",
      });
    } catch (error) {
      console.error("[ScheduleController] deleteSchedule error:", error);
      res.status(500).json({ success: false, message: "Gagal menghapus jadwal" });
    }
  },

  updateSchedule: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, date, time, category, location, latitude, longitude, radius, polygon, kelompokId, isActive } =
        req.body;
      let parsedDate;
      if (date) {
        parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({
            success: false,
            error: "VALIDATION_ERROR",
            message: "Format tanggal tidak valid (harus ISO 8601 atau YYYY-MM-DD)",
          });
          return;
        }
      }

      const schedule = await scheduleService.updateSchedule(id, {
        title,
        date: parsedDate,
        time,
        category,
        location,
        latitude: latitude !== undefined ? Number(latitude) : undefined,
        longitude: longitude !== undefined ? Number(longitude) : undefined,
        radius: radius !== undefined ? Number(radius) : undefined,
        polygon: polygon !== undefined ? polygon : undefined,
        kelompokId: kelompokId !== undefined ? kelompokId : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      });

      res.status(200).json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      console.error("[ScheduleController] updateSchedule error:", error);
      res.status(500).json({ success: false, message: "Gagal mengupdate jadwal" });
    }
  },
};
