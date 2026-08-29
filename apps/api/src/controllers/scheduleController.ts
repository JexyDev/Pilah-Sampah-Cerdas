/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { scheduleService } from "../services/scheduleService.js";

function toWibDateString(d: Date): string {
  const wibDate = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return wibDate.toISOString().slice(0, 10);
}

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
          message: "Format tanggal tidak valid (harus ISO 8601 atau YYYY-MM-DD)",
        });
        return;
      }

      // Validasi waktu mulai tidak boleh di masa lalu (kurang dari hari ini dalam WIB)
      const now = new Date();
      const wibNowStr = toWibDateString(now);
      const wibActivityStr = toWibDateString(parsedDate);

      if (wibActivityStr < wibNowStr) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Waktu/tanggal mulai kegiatan tidak boleh pada hari sebelumnya (masa lalu)",
        });
        return;
      }

      let resolvedKelompokId = (kelompokId && kelompokId !== "ALL" && kelompokId !== "") ? kelompokId : undefined;
      const userRole = String(req.user?.role || "").toUpperCase();
      const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(userRole);
      const isMahasiswa = userRole === "MAHASISWA_KKN";

      if (isDpl) {
        res.status(403).json({
          success: false,
          error: "FORBIDDEN",
          message: "Role DPL hanya memiliki hak akses monitoring dan tidak dapat membuat kegiatan/agenda",
        });
        return;
      }

      if (req.user?.userId) {
        if (isMahasiswa && !resolvedKelompokId) {
          const studentProfile = await prisma.studentKkn.findUnique({
            where: { userId: req.user.userId },
            select: { kelompokId: true },
          });
          if (studentProfile?.kelompokId) {
            resolvedKelompokId = studentProfile.kelompokId;
          } else {
            res.status(403).json({
              success: false,
              message: "Mahasiswa tidak memiliki kelompok KKN, tidak dapat membuat jadwal",
            });
            return;
          }
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
      const userRole = String(req.user?.role || "").toUpperCase();
      const userId = req.user?.userId || (req.user as any)?.id;

      if (["DPL", "DOSEN_PEMBIMBING"].includes(userRole)) {
        res.status(403).json({
          success: false,
          error: "FORBIDDEN",
          message: "Role DPL hanya memiliki hak akses monitoring",
        });
        return;
      }

      if (userRole === "MAHASISWA_KKN") {
        const schedule = await prisma.schedule.findUnique({ where: { id } });
        if (!schedule) {
          res.status(404).json({ success: false, message: "Jadwal tidak ditemukan" });
          return;
        }
        if (!schedule.kelompokId) {
          res.status(403).json({
            success: false,
            message: "FORBIDDEN_SCOPE",
            error: "Tidak dapat menghapus jadwal acara bersama",
          });
          return;
        }
        // Verify ownership
        const studentProfile = await prisma.studentKkn.findUnique({ where: { userId } });
        if (schedule.kelompokId !== studentProfile?.kelompokId) {
          res.status(403).json({ success: false, message: "FORBIDDEN_SCOPE" });
          return;
        }
      }

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

      const userRole = String(req.user?.role || "").toUpperCase();
      const userId = req.user?.userId || (req.user as any)?.id;

      if (["DPL", "DOSEN_PEMBIMBING"].includes(userRole)) {
        res.status(403).json({
          success: false,
          error: "FORBIDDEN",
          message: "Role DPL hanya memiliki hak akses monitoring",
        });
        return;
      }

      if (userRole === "MAHASISWA_KKN") {
        const schedule = await prisma.schedule.findUnique({ where: { id } });
        if (!schedule) {
          res.status(404).json({ success: false, message: "Jadwal tidak ditemukan" });
          return;
        }
        if (!schedule.kelompokId) {
          res.status(403).json({
            success: false,
            message: "FORBIDDEN_SCOPE",
            error: "Tidak dapat mengedit jadwal acara bersama",
          });
          return;
        }
        // Verify ownership
        const studentProfile = await prisma.studentKkn.findUnique({ where: { userId } });
        if (schedule.kelompokId !== studentProfile?.kelompokId) {
          res.status(403).json({ success: false, message: "FORBIDDEN_SCOPE" });
          return;
        }
      }

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

        const now = new Date();
        const wibNowStr = toWibDateString(now);
        const wibActivityStr = toWibDateString(parsedDate);

        if (wibActivityStr < wibNowStr) {
          res.status(400).json({
            success: false,
            error: "VALIDATION_ERROR",
            message: "Waktu/tanggal mulai kegiatan tidak boleh pada hari sebelumnya (masa lalu)",
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

  syncDailySchedules: async (req: Request, res: Response) => {
    try {
      const { date } = req.body || {};
      const cleanResult = await scheduleService.cleanAllDuplicateSchedules().catch(() => ({ removedDuplicatesCount: 0 }));
      const result = await scheduleService.syncDailySchedulesForToday(date);
      res.status(200).json({
        success: true,
        message: `Berhasil sinkronisasi jadwal kegiatan harian untuk tanggal ${result.date}${cleanResult.removedDuplicatesCount > 0 ? ` (${cleanResult.removedDuplicatesCount} duplikat dibersihkan)` : ""}`,
        data: { ...result, totalDuplicatesCleaned: cleanResult.removedDuplicatesCount },
      });
    } catch (error: any) {
      console.error("[ScheduleController] syncDailySchedules error:", error);
      res.status(500).json({ success: false, message: error?.message || "Internal server error" });
    }
  },
};
