import { prisma } from "../lib/prisma.js";
import { CH4StatusLevel, IoTDeviceStatus } from "@prisma/client";
import crypto from "crypto";
import { notificationIntegrationService } from "./notificationIntegrationService.js";

// Cooldown Map untuk alert darurat status BAHAYA: 15 menit per node
const deviceEmergencyCooldown = new Map<string, number>();
const EMERGENCY_COOLDOWN_MS = 15 * 60 * 1000; // 15 menit

export interface IngestReadingInput {
  apiKey: string;
  nilaiPpm: number;
  suhu?: number | null;
  kelembaban?: number | null;
  baterai?: number | null;
  timestamp?: string | Date;
}

export interface CreateDeviceInput {
  name: string;
  nodeCode?: string;
  locationName: string;
  latitude: number;
  longitude: number;
  status?: IoTDeviceStatus;
  kelurahan?: string;
  kelurahanId?: string | null;
  rwId?: number | null;
  picUserId?: string | null;
}

export interface UpdateDeviceInput {
  name?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  status?: IoTDeviceStatus;
  kelurahan?: string;
  kelurahanId?: string | null;
  rwId?: number | null;
  picUserId?: string | null;
}

export const iotService = {
  /**
   * Menentukan tingkat status berdasarkan konsentrasi CH4 dalam satuan ppm:
   * - < 1.000 ppm     : AMAN
   * - 1.000 - 4.999 ppm : WASPADA
   * - >= 5.000 ppm    : BAHAYA
   */
  calculateStatusLevel(ppm: number): CH4StatusLevel {
    if (ppm >= 5000) {
      return CH4StatusLevel.BAHAYA;
    } else if (ppm >= 1000) {
      return CH4StatusLevel.WASPADA;
    }
    return CH4StatusLevel.AMAN;
  },

  /**
   * Ingest data telemetri dari perangkat sensor IoT (Agrisense Node)
   */
  async ingestReading(data: IngestReadingInput) {
    const { apiKey, nilaiPpm, suhu, kelembaban, baterai, timestamp } = data;

    if (!apiKey) {
      throw new Error("API Key perangkat tidak boleh kosong");
    }

    const device = await prisma.ioTDevice.findUnique({
      where: { apiKey },
      include: {
        picUser: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!device) {
      throw new Error("Perangkat IoT tidak terdaftar atau API Key tidak valid");
    }

    if (device.status === IoTDeviceStatus.INACTIVE) {
      throw new Error("Perangkat IoT saat ini berstatus NON-AKTIF");
    }

    const statusLevel = this.calculateStatusLevel(Number(nilaiPpm));
    const recordedTimestamp = timestamp ? new Date(timestamp) : new Date();

    const reading = await prisma.cH4Reading.create({
      data: {
        deviceId: device.id,
        nilaiPpm: Number(nilaiPpm),
        suhu: suhu !== undefined && suhu !== null ? Number(suhu) : null,
        kelembaban: kelembaban !== undefined && kelembaban !== null ? Number(kelembaban) : null,
        baterai: baterai !== undefined && baterai !== null ? Number(baterai) : null,
        statusLevel,
        timestamp: recordedTimestamp,
      },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            nodeCode: true,
            locationName: true,
            status: true,
          },
        },
      },
    });

    // Peringatan Dini Status BAHAYA dengan 15-Menit Cooldown
    if (statusLevel === CH4StatusLevel.BAHAYA) {
      const now = Date.now();
      const lastAlert = deviceEmergencyCooldown.get(device.id) || 0;

      if (now - lastAlert >= EMERGENCY_COOLDOWN_MS) {
        deviceEmergencyCooldown.set(device.id, now);

        try {
          // Cari pimpinan, super user, dan developer untuk menerima peringatan
          const targetAdmins = await prisma.user.findMany({
            where: {
              status: { in: ["Aktif", "ACTIVE"] },
              role: {
                name: { in: ["SUPER_USER", "DEVELOPER", "PIMPINAN", "PEMIMPIN"] },
              },
            },
            select: { id: true },
          });

          const recipientIds = targetAdmins.map((u) => u.id);
          if (device.picUserId && !recipientIds.includes(device.picUserId)) {
            recipientIds.push(device.picUserId);
          }

          const alertTitle = `🚨 PERINGATAN GAS METANA BAHAYA (${device.nodeCode})`;
          const alertMessage = `Konsentrasi gas metana terdeteksi kritis sebesar ${Number(nilaiPpm).toLocaleString("id-ID")} ppm di ${device.locationName}. Nilai melampaui batas bahaya (≥ 5.000 ppm). Segera lakukan mitigasi!`;

          await notificationIntegrationService.sendToUsers({
            userIds: recipientIds,
            title: alertTitle,
            message: alertMessage,
            triggerType: "ALERT_URGENT",
            dataPayload: {
              type: "IOT_EMERGENCY",
              deviceId: device.id,
              nodeCode: device.nodeCode,
              ppm: String(nilaiPpm),
              location: device.locationName,
            },
          });
        } catch (notifErr: any) {
          console.error("Gagal mendispatch notifikasi darurat IoT:", notifErr?.message || notifErr);
        }
      }
    }

    return reading;
  },

  /**
   * Mengambil semua daftar perangkat IoT beserta status pembacaan terakhir
   */
  async getAllDevices() {
    const devices = await prisma.ioTDevice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        kelurahanRef: { select: { id: true, name: true } },
        rwRef: { select: { id: true, name: true } },
        picUser: { select: { id: true, name: true, phone: true, email: true } },
        readings: {
          take: 1,
          orderBy: { timestamp: "desc" },
        },
        _count: {
          select: { readings: true },
        },
      },
    });

    return devices.map((d) => ({
      ...d,
      latestReading: d.readings[0] || null,
      readings: undefined, // Hilangkan array agar payload ringkas
    }));
  },

  /**
   * Mengambil detail satu perangkat IoT beserta 50 pembacaan terakhir
   */
  async getDeviceById(id: string) {
    const device = await prisma.ioTDevice.findUnique({
      where: { id },
      include: {
        kelurahanRef: { select: { id: true, name: true } },
        rwRef: { select: { id: true, name: true } },
        picUser: { select: { id: true, name: true, phone: true, email: true } },
        readings: {
          take: 50,
          orderBy: { timestamp: "desc" },
        },
        _count: {
          select: { readings: true },
        },
      },
    });

    if (!device) {
      throw new Error("Perangkat IoT tidak ditemukan");
    }

    return {
      ...device,
      latestReading: device.readings[0] || null,
    };
  },

  /**
   * Mendaftarkan perangkat IoT baru
   */
  async createDevice(data: CreateDeviceInput) {
    const nodeCode =
      data.nodeCode?.trim() ||
      `NODE-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const apiKey = `key_${crypto.randomBytes(16).toString("hex")}`;

    // Validasi kelurahanId jika diisi
    let kelurahanName = data.kelurahan || null;
    if (data.kelurahanId) {
      const kel = await prisma.kelurahan.findUnique({ where: { id: data.kelurahanId } });
      if (kel) kelurahanName = kel.name;
    }

    const device = await prisma.ioTDevice.create({
      data: {
        name: data.name,
        nodeCode,
        locationName: data.locationName,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status || IoTDeviceStatus.ACTIVE,
        apiKey,
        kelurahan: kelurahanName,
        kelurahanId: data.kelurahanId || null,
        rwId: data.rwId || null,
        picUserId: data.picUserId || null,
      },
      include: {
        kelurahanRef: { select: { id: true, name: true } },
        rwRef: { select: { id: true, name: true } },
        picUser: { select: { id: true, name: true, phone: true, email: true } },
      },
    });

    return device;
  },

  /**
   * Memperbarui informasi perangkat IoT
   */
  async updateDevice(id: string, data: UpdateDeviceInput) {
    let kelurahanName = data.kelurahan;
    if (data.kelurahanId) {
      const kel = await prisma.kelurahan.findUnique({ where: { id: data.kelurahanId } });
      if (kel) kelurahanName = kel.name;
    }

    const device = await prisma.ioTDevice.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.locationName && { locationName: data.locationName }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.status && { status: data.status }),
        ...(data.kelurahanId !== undefined && { kelurahanId: data.kelurahanId }),
        ...(kelurahanName !== undefined && { kelurahan: kelurahanName }),
        ...(data.rwId !== undefined && { rwId: data.rwId }),
        ...(data.picUserId !== undefined && { picUserId: data.picUserId }),
      },
      include: {
        kelurahanRef: { select: { id: true, name: true } },
        rwRef: { select: { id: true, name: true } },
        picUser: { select: { id: true, name: true, phone: true, email: true } },
      },
    });

    return device;
  },

  /**
   * Menghapus perangkat IoT beserta seluruh pembacaan riwayatnya
   */
  async deleteDevice(id: string) {
    return await prisma.ioTDevice.delete({
      where: { id },
    });
  },

  /**
   * Regenerasi API Key baru untuk perangkat
   */
  async regenerateApiKey(id: string) {
    const newApiKey = `key_${crypto.randomBytes(16).toString("hex")}`;
    const device = await prisma.ioTDevice.update({
      where: { id },
      data: { apiKey: newApiKey },
      select: {
        id: true,
        name: true,
        nodeCode: true,
        apiKey: true,
      },
    });
    return device;
  },

  /**
   * Mengambil riwayat pembacaan sensor suatu perangkat (time-series)
   */
  async getDeviceReadings(
    deviceId: string,
    options: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const limit = Math.min(Math.max(options.limit || 100, 1), 1000);
    const where: any = { deviceId };

    if (options.startDate || options.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp.gte = options.startDate;
      if (options.endDate) where.timestamp.lte = options.endDate;
    }

    return await prisma.cH4Reading.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  },

  /**
   * Mengambil ringkasan dashboard pemantauan IoT
   */
  async getDashboardSummary() {
    const totalDevices = await prisma.ioTDevice.count();
    const activeDevices = await prisma.ioTDevice.count({
      where: { status: IoTDeviceStatus.ACTIVE },
    });
    const maintenanceDevices = await prisma.ioTDevice.count({
      where: { status: IoTDeviceStatus.MAINTENANCE },
    });
    const inactiveDevices = await prisma.ioTDevice.count({
      where: { status: IoTDeviceStatus.INACTIVE },
    });
    const totalReadings = await prisma.cH4Reading.count();

    // Hitung status kondisi node saat ini berdasarkan pembacaan sensor terakhir
    const devices = await prisma.ioTDevice.findMany({
      where: { status: IoTDeviceStatus.ACTIVE },
      select: {
        id: true,
        readings: {
          take: 1,
          orderBy: { timestamp: "desc" },
          select: { statusLevel: true, nilaiPpm: true },
        },
      },
    });

    let countAman = 0;
    let countWaspada = 0;
    let countBahaya = 0;
    let countNoData = 0;

    for (const d of devices) {
      if (!d.readings || d.readings.length === 0) {
        countNoData++;
      } else {
        const level = d.readings[0].statusLevel;
        if (level === CH4StatusLevel.BAHAYA) countBahaya++;
        else if (level === CH4StatusLevel.WASPADA) countWaspada++;
        else countAman++;
      }
    }

    return {
      totalDevices,
      activeDevices,
      maintenanceDevices,
      inactiveDevices,
      totalReadings,
      statusBreakdown: {
        aman: countAman,
        waspada: countWaspada,
        bahaya: countBahaya,
        tanpaData: countNoData,
      },
    };
  },

  /**
   * Mengambil daftar pengguna aktif yang dapat ditugaskan sebagai PIC Petugas Lapangan
   */
  async getOfficers() {
    return await prisma.user.findMany({
      where: {
        status: { in: ["Aktif", "ACTIVE"] },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });
  },

  /**
   * Membersihkan data pembacaan riwayat lama untuk efisiensi penyimpanan
   */
  async cleanupOldReadings(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.cH4Reading.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    return {
      cutoffDate,
      deletedCount: result.count,
    };
  },
};
