import { Request, Response } from "express";
import { iotService } from "../services/iotService.js";
import { iotSimulationService } from "../services/iotSimulationService.js";

export class IoTController {
  /**
   * Ingest telemetri dari node sensor IoT (Agrisense / LetSens Node)
   * Mendukung otentikasi via header `x-api-key` atau body `apiKey`.
   */
  async ingestReading(req: Request, res: Response): Promise<void> {
    try {
      const apiKey = (req.headers["x-api-key"] as string) || req.body.apiKey;
      const {
        nilaiPpm,
        suhu,
        kelembaban,
        baterai,
        rssi,
        latitude,
        longitude,
        lokasiName,
        timestamp,
      } = req.body;

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
        rssi: rssi !== undefined && rssi !== null ? Number(rssi) : null,
        latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
        longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
        lokasiName: lokasiName || null,
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
        useSensorGps,
        sensorRadius,
        firmwareVersion,
        status,
        kelurahan,
        kelurahanId,
        rwId,
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
        useSensorGps: useSensorGps !== undefined ? Boolean(useSensorGps) : true,
        sensorRadius: sensorRadius ? Number(sensorRadius) : 50,
        firmwareVersion: firmwareVersion || "1.0.0",
        status,
        kelurahan,
        kelurahanId: kelurahanId || null,
        rwId: rwId ? Number(rwId) : null,
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
        useSensorGps,
        sensorRadius,
        firmwareVersion,
        status,
        kelurahan,
        kelurahanId,
        rwId,
      } = req.body;

      const device = await iotService.updateDevice(id, {
        name,
        locationName,
        latitude: latitude !== undefined ? Number(latitude) : undefined,
        longitude: longitude !== undefined ? Number(longitude) : undefined,
        useSensorGps: useSensorGps !== undefined ? Boolean(useSensorGps) : undefined,
        sensorRadius: sensorRadius !== undefined ? Number(sensorRadius) : undefined,
        firmwareVersion: firmwareVersion !== undefined ? String(firmwareVersion) : undefined,
        status,
        kelurahan,
        kelurahanId: kelurahanId !== undefined ? kelurahanId : undefined,
        rwId: rwId !== undefined ? (rwId ? Number(rwId) : null) : undefined,
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
   * OTA Firmware Update
   */
  async updateFirmwareOta(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { targetVersion } = req.body;

      if (!targetVersion) {
        res.status(400).json({
          success: false,
          message: "Field 'targetVersion' wajib diisi",
        });
        return;
      }

      const result = await iotService.updateFirmwareOta(id, targetVersion);
      res.json({
        success: true,
        message: `Firmware perangkat ${result.nodeCode} berhasil diperbarui ke versi ${result.firmwareVersion}`,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || "Gagal melakukan pembaruan firmware",
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
   * Mengambil riwayat pembacaan sensor dengan paginasi dan filter
   */
  async getReadings(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, deviceId, search, startDate, endDate } = req.query;

      const result = await iotService.getReadings({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        deviceId: deviceId ? String(deviceId) : undefined,
        search: search ? String(search) : undefined,
        startDate: startDate ? new Date(String(startDate)) : undefined,
        endDate: endDate ? new Date(String(endDate)) : undefined,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || "Gagal memuat riwayat data sensor",
      });
    }
  }

  /**
   * Ekspor data sensor ke file CSV resmi
   */
  async exportReadingsCsv(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId, search, startDate, endDate } = req.query;

      const rows = await iotService.getAllReadingsForExport({
        deviceId: deviceId ? String(deviceId) : undefined,
        search: search ? String(search) : undefined,
        startDate: startDate ? new Date(String(startDate)) : undefined,
        endDate: endDate ? new Date(String(endDate)) : undefined,
      });

      const header = [
        "WAKTU_LENGKAP",
        "WAKTU_JAM",
        "WAKTU_TANGGAL",
        "KODE_PERANGKAT",
        "NAMA_PERANGKAT",
        "CH4_PPM",
        "STATUS",
        "LATITUDE",
        "LONGITUDE",
        "BATERAI_PERSEN",
        "RSSI_DBM",
        "LOKASI",
      ].join(",");

      const csvLines = rows.map((r) =>
        [
          `"${r.waktuIso}"`,
          `"${r.waktuJam}"`,
          `"${r.waktuTanggal}"`,
          `"${r.kodePerangkat}"`,
          `"${(r.namaPerangkat || "").replace(/"/g, '""')}"`,
          r.nilaiCh4Ppm,
          `"${r.tingkatStatus}"`,
          r.latitude !== null ? r.latitude : "",
          r.longitude !== null ? r.longitude : "",
          r.bateraiPersen !== null ? r.bateraiPersen : "",
          r.rssiDbm !== null ? r.rssiDbm : "",
          `"${(r.lokasi || "").replace(/"/g, '""')}"`,
        ].join(",")
      );

      const csvContent = "\uFEFF" + [header, ...csvLines].join("\r\n");

      // Timestamp format YYYYMMDD_HHmmss
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const isoStamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const filename = `laporan_sensor_ch4_${isoStamp}.csv`;

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (error: any) {
      console.error("Gagal ekspor data CSV:", error);
      res.status(500).json({
        success: false,
        message: "Gagal menghasilkan berkas ekspor CSV",
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
      const { deviceId, startDate, endDate } = req.query;
      const summary = await iotService.getDashboardSummary({
        deviceId: deviceId ? String(deviceId) : undefined,
        startDate: startDate ? new Date(String(startDate)) : undefined,
        endDate: endDate ? new Date(String(endDate)) : undefined,
      });
      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error("Gagal memuat ringkasan IoT:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memuat ringkasan IoT",
      });
    }
  }

  /**
   * Mengambil rekomendasi analisis sistem (Google Gemini / Baku Mutu)
   */
  async getAiRecommendation(req: Request, res: Response): Promise<void> {
    try {
      const force = req.query.force === "true";
      const deviceId = typeof req.query.deviceId === "string" && req.query.deviceId.trim() ? req.query.deviceId.trim() : undefined;
      const result = await iotService.getAiRecommendation(force, deviceId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Gagal memuat rekomendasi sistem:", error);
      res.status(500).json({
        success: false,
        message: "Gagal menghasilkan rekomendasi sistem",
      });
    }
  }

  /**
   * Mengambil konfigurasi sistem IoT
   */
  async getSystemConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = await iotService.getOrCreateSystemConfig();
      res.json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal memuat konfigurasi IoT",
      });
    }
  }

  /**
   * Memperbarui konfigurasi sistem IoT
   */
  async updateSystemConfig(req: Request, res: Response): Promise<void> {
    try {
      const updated = await iotService.updateSystemConfig(req.body);
      res.json({
        success: true,
        message: "Konfigurasi sistem IoT berhasil diperbarui",
        data: updated,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || "Gagal memperbarui konfigurasi sistem IoT",
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

  /**
   * Memvalidasi API Key Gemini dan mengambil daftar model resmi
   */
  async validateGeminiApiKey(req: Request, res: Response): Promise<void> {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        res.status(400).json({
          success: false,
          message: "API Key Google Gemini wajib disertakan",
        });
        return;
      }

      const result = await iotService.validateAndListGeminiModels(apiKey);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || "Gagal memvalidasi API Key Google Gemini",
      });
    }
  }

  /**
   * Mengambil status simulator background service
   */
  async getSimulatorStatus(_req: Request, res: Response): Promise<void> {
    try {
      const status = iotSimulationService.getStatus();
      res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal memuat status simulator background service",
      });
    }
  }

  /**
   * Memulai simulator streaming background service di server
   */
  async startSimulator(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId, deviceIds, intervalMinutes } = req.body;
      if (!deviceId && !deviceIds) {
        res.status(400).json({
          success: false,
          message: "Parameter deviceId atau deviceIds wajib disertakan",
        });
        return;
      }

      const status = await iotSimulationService.start({
        deviceId,
        deviceIds,
        intervalMinutes: Number(intervalMinutes) || 60,
      });

      res.json({
        success: true,
        message: `Simulator background service berhasil dimulai untuk ${status.targetDeviceCount} node perangkat setiap ${status.intervalMinutes} menit`,
        data: status,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error?.message || "Gagal memulai simulator background service",
      });
    }
  }

  /**
   * Menghentikan simulator streaming background service di server
   */
  async stopSimulator(_req: Request, res: Response): Promise<void> {
    try {
      const status = iotSimulationService.stop();
      res.json({
        success: true,
        message: "Simulator background service berhasil dihentikan",
        data: status,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal menghentikan simulator background service",
      });
    }
  }
}

export const iotController = new IoTController();
