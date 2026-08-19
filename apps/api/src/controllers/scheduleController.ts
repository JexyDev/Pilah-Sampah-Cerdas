import { prisma } from "../lib/prisma.js";
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
      const userRole = String(req.user?.role || "").toUpperCase();
      const userId = req.user?.userId || (req.user as any)?.id;

      const schedules = await scheduleService.getAllSchedules(userId, userRole);
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

      const updatedSchedule = await scheduleService.updateSchedule(id, {
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
        data: updatedSchedule,
      });
    } catch (error) {
      console.error("[ScheduleController] updateSchedule error:", error);
      res.status(500).json({ success: false, message: "Gagal mengupdate jadwal" });
    }
  },
};
