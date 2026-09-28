import { Request, Response } from "express";
import { iotService } from "../services/iotService.js";

export class IoTController {
  /**
   * Ingest telemetri dari node sensor IoT (Agrisense Node)
   * Mendukung otentikasi via header `x-api-key` atau body `apiKey`.
   */
  async ingestReading(req: Request, res: Response): Promise<void> {
    try {
      const apiKey = (req.headers["x-api-key"] as string) || req.body.apiKey;
      const { nilaiPpm, suhu, kelembaban, baterai, timestamp } = req.body;

      if (!apiKey) {
        res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "API Key perangkat wajib disertakan pada header x-api-key atau body",
        });
        return;
      }

      if (nilaiPpm === undefined || nilaiPpm === null || isNaN(Number(nilaiPpm))) {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "Field 'nilaiPpm' wajib disertakan berupa angka numerik valid",
        });
        return;
      }

      const reading = await iotService.ingestReading({
        apiKey,
        nilaiPpm: Number(nilaiPpm),
        suhu: suhu !== undefined && suhu !== null ? Number(suhu) : null,
        kelembaban: kelembaban !== undefined && kelembaban !== null ? Number(kelembaban) : null,
        baterai: baterai !== undefined && baterai !== null ? Number(baterai) : null,
        timestamp,
      });

      res.status(201).json({
        success: true,
        message: "Data telemetri sensor CH4 berhasil disimpan",
        data: reading,
      });
    } catch (error: any) {
      console.error("Gagal ingest telemetri IoT:", error?.message || error);
      res.status(error.message?.includes("tidak terdaftar") ? 401 : 500).json({
        success: false,
        message: error?.message || "Terjadi kesalahan internal saat menyimpan telemetri",
      });
    }
  }

  /**
   * Mengambil daftar semua perangkat IoT
   */
  async getAllDevices(req: Request, res: Response): Promise<void> {
    try {
      const devices = await iotService.getAllDevices();
      res.json({
        success: true,
        data: devices,
      });
    } catch (error: any) {
      console.error("Gagal mengambil daftar perangkat IoT:", error?.message || error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil daftar perangkat IoT",
      });
    }
  }

  /**
   * Mengambil detail satu perangkat IoT
   */
  async getDeviceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const device = await iotService.getDeviceById(id);
      res.json({
        success: true,
        data: device,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error?.message || "Perangkat IoT tidak ditemukan",
      });
    }
  }

  /**
   * Mendaftarkan perangkat IoT baru
   */
  async createDevice(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        nodeCode,
        locationName,
        latitude,
        longitude,
        status,
        kelurahan,
        kelurahanId,
        rwId,
        picUserId,
      } = req.body;

      if (!name || !locationName || latitude === undefined || longitude === undefined) {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "Field 'name', 'locationName', 'latitude', dan 'longitude' wajib diisi",
        });
        return;
      }

      const device = await iotService.createDevice({
        name,
        nodeCode,
        locationName,
        latitude: Number(latitude),
        longitude: Number(longitude),
        status,
        kelurahan,
        kelurahanId: kelurahanId || null,
        rwId: rwId ? Number(rwId) : null,
        picUserId: picUserId || null,
      });

      res.status(201).json({
        success: true,
        message: "Perangkat IoT berhasil didaftarkan",
        data: device,
      });
    } catch (error: any) {
      console.error("Gagal mendaftarkan perangkat IoT:", error?.message || error);
      res.status(500).json({
        success: false,
        message: error?.message || "Gagal mendaftarkan perangkat IoT",
      });
    }
  }

  /**
   * Memperbarui informasi perangkat IoT
   */
  async updateDevice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        locationName,
        latitude,
        longitude,
        status,
        kelurahan,
        kelurahanId,
        rwId,
        picUserId,
      } = req.body;

      const device = await iotService.updateDevice(id, {
        name,
        locationName,
        latitude: latitude !== undefined ? Number(latitude) : undefined,
        longitude: longitude !== undefined ? Number(longitude) : undefined,
        status,
        kelurahan,
        kelurahanId: kelurahanId !== undefined ? kelurahanId : undefined,
        rwId: rwId !== undefined ? (rwId ? Number(rwId) : null) : undefined,
        picUserId: picUserId !== undefined ? picUserId : undefined,
      });

      res.json({
        success: true,
        message: "Informasi perangkat IoT berhasil diperbarui",
        data: device,
      });
    } catch (error: any) {
      console.error("Gagal memperbarui perangkat IoT:", error?.message || error);
      res.status(500).json({
        success: false,
        message: error?.message || "Gagal memperbarui perangkat IoT",
      });
    }
  }

  /**
   * Menghapus perangkat IoT
   */
  async deleteDevice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await iotService.deleteDevice(id);
      res.json({
        success: true,
        message: "Perangkat IoT berhasil dihapus",
      });
    } catch (error: any) {
      console.error("Gagal menghapus perangkat IoT:", error?.message || error);
      res.status(500).json({
        success: false,
        message: error?.message || "Gagal menghapus perangkat IoT",
      });
    }
  }

  /**
   * Regenerasi API Key baru untuk perangkat
   */
  async regenerateApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await iotService.regenerateApiKey(id);
      res.json({
        success: true,
        message: "API Key baru berhasil diterbitkan",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || "Gagal meregenerasi API Key",
      });
    }
  }

  /**
   * Mengambil riwayat pembacaan sensor suatu perangkat (time-series)
   */
  async getDeviceReadings(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { limit, startDate, endDate } = req.query;

      const readings = await iotService.getDeviceReadings(id, {
        limit: limit ? Number(limit) : undefined,
        startDate: startDate ? new Date(String(startDate)) : undefined,
        endDate: endDate ? new Date(String(endDate)) : undefined,
      });

      res.json({
        success: true,
        data: readings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil riwayat pembacaan sensor",
      });
    }
  }

  /**
   * Mengambil ringkasan statistik monitoring IoT
   */
  async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await iotService.getDashboardSummary();
      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal memuat ringkasan IoT",
      });
    }
  }

  /**
   * Mengambil daftar pengguna aktif yang dapat dijadikan PIC Petugas Lapangan
   */
  async getOfficers(req: Request, res: Response): Promise<void> {
    try {
      const officers = await iotService.getOfficers();
      res.json({
        success: true,
        data: officers,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal memuat daftar petugas lapangan",
      });
    }
  }

  /**
   * Membersihkan data pembacaan riwayat lama
   */
  async cleanupOldReadings(req: Request, res: Response): Promise<void> {
    try {
      const days = req.query.days ? Number(req.query.days) : 30;
      const result = await iotService.cleanupOldReadings(days);
      res.json({
        success: true,
        message: `Pembersihan berhasil. Sebanyak ${result.deletedCount} data riwayat lebih dari ${days} hari telah dihapus.`,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal membersihkan data pembacaan sensor lama",
      });
    }
  }
}

export const iotController = new IoTController();
