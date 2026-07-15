import { Request, Response } from "express";
import { scheduleService } from "../services/scheduleService.js";

export const scheduleController = {
  getAllSchedules: async (req: Request, res: Response) => {
    try {
      const schedules = await scheduleService.getAllSchedules();
      res.status(200).json({
        success: true,
        data: schedules
      });
    } catch (error) {
      console.error("[ScheduleController] getAllSchedules error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  createSchedule: async (req: Request, res: Response) => {
    try {
      const { title, date, time, category, location } = req.body;
      if (!title || !date || !category) {
        res.status(400).json({ success: false, error: "VALIDATION_ERROR", message: "Judul, tanggal, dan kategori kegiatan wajib diisi" });
        return;
      }

      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ success: false, error: "VALIDATION_ERROR", message: "Format tanggal tidak valid (harus ISO 8601 atau YYYY-MM-DD)" });
        return;
      }

      const schedule = await scheduleService.createSchedule({
        title,
        date: parsedDate,
        time,
        category,
        location
      });
      res.status(201).json({
        success: true,
        data: schedule
      });
    } catch (error) {
      console.error("[ScheduleController] createSchedule error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
};
