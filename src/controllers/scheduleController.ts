import { Request, Response } from "express";

export class ScheduleController {
  async getSchedules(req: Request, res: Response): Promise<void> {
    try {
      // Mock data for schedules since there is no table in the DB yet
      const schedules = [
        {
          id: "1",
          jenis: "Pengangkutan",
          nama: "Pengangkutan RW 04",
          waktu: "08:00 - 10:00",
          tanggal: "5 Oktober 2026",
          lokasi: "Kawasan RW 04",
          color: "bg-green-100 text-green-700"
        },
        {
          id: "2",
          jenis: "Sosialisasi",
          nama: "Sosialisasi Warga",
          waktu: "13:00 - 15:00",
          tanggal: "5 Oktober 2026",
          lokasi: "Balai Desa",
          color: "bg-orange-100 text-orange-700"
        },
        {
          id: "3",
          jenis: "Workshop",
          nama: "Workshop Kompos",
          waktu: "09:00 - 12:00",
          tanggal: "3 Oktober 2026",
          lokasi: "Taman Kota",
          color: "bg-blue-100 text-blue-700"
        }
      ];
      res.status(200).json({ success: true, data: schedules });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to get schedules" });
    }
  }
}

export const scheduleController = new ScheduleController();
