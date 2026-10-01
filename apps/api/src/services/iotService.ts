import { prisma } from "../lib/prisma.js";
import { CH4StatusLevel, IoTDeviceStatus } from "@prisma/client";
import crypto from "crypto";
import { notificationIntegrationService } from "./notificationIntegrationService.js";

// Cooldown Map untuk alert darurat status BAHAYA: 15 menit per node
const deviceEmergencyCooldown = new Map<string, number>();
const EMERGENCY_COOLDOWN_MS = 15 * 60 * 1000; // 15 menit

// Format data rekomendasi sistem
export interface SystemRecommendationData {
  statusLevel: "NORMAL" | "PERINGATAN" | "BAHAYA";
  confidenceScore: number;
  ringkasanKondisi: string;
  evaluasiFisikaKimia: string;
  langkahPenangananSop: string[];
  rekomendasiTeknis: string[];
  modelAnalisis: string;
  dianalisisPada: string;
  isCached: boolean;
  isAiIntegrated?: boolean;
  apiKeyConfigured?: boolean;
  targetDevice?: {
    id: string;
    name: string;
    nodeCode: string;
    locationName?: string | null;
  } | null;
}

// Cache rekomendasi analisis sistem per target (all atau deviceId)
interface CachedRecommendation {
  data: SystemRecommendationData;
  generatedAt: Date;
  wasAi: boolean;
}
const recommendationCacheMap = new Map<string, CachedRecommendation>();

function formatReading<T extends Record<string, any>>(r: T): T {
  if (!r) return r;
  return {
    ...r,
    nilaiPpm: Number(r.nilaiPpm),
    suhu: r.suhu !== null && r.suhu !== undefined ? Number(r.suhu) : null,
    kelembaban: r.kelembaban !== null && r.kelembaban !== undefined ? Number(r.kelembaban) : null,
    baterai: r.baterai !== null && r.baterai !== undefined ? Number(r.baterai) : null,
    rssi: r.rssi !== null && r.rssi !== undefined ? Number(r.rssi) : null,
    latitude: r.latitude !== null && r.latitude !== undefined ? Number(r.latitude) : null,
    longitude: r.longitude !== null && r.longitude !== undefined ? Number(r.longitude) : null,
  };
}

function formatDevice<T extends Record<string, any>>(d: T): T {
  if (!d) return d;
  return {
    ...d,
    latitude: d.latitude !== null && d.latitude !== undefined ? Number(d.latitude) : null,
    longitude: d.longitude !== null && d.longitude !== undefined ? Number(d.longitude) : null,
  };
}

export interface IngestReadingInput {
  apiKey: string;
  nilaiPpm: number;
  suhu?: number | null;
  kelembaban?: number | null;
  baterai?: number | null;
  rssi?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  lokasiName?: string | null;
  timestamp?: string | Date;
}

export interface CreateDeviceInput {
  name: string;
  nodeCode?: string;
  locationName: string;
  latitude: number;
  longitude: number;
  useSensorGps?: boolean;
  sensorRadius?: number;
  firmwareVersion?: string;
  status?: IoTDeviceStatus;
  kelurahan?: string;
  kelurahanId?: string | null;
  rwId?: number | null;
}

export interface UpdateDeviceInput {
  name?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  useSensorGps?: boolean;
  sensorRadius?: number;
  firmwareVersion?: string;
  status?: IoTDeviceStatus;
  kelurahan?: string;
  kelurahanId?: string | null;
  rwId?: number | null;
}

export const iotService = {
  /**
   * Mengambil konfigurasi sistem IoT atau membuat default jika belum ada
   */
  async getOrCreateSystemConfig() {
    let config = await prisma.ioTSystemConfig.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!config) {
      config = await prisma.ioTSystemConfig.create({
        data: {
          ch4WarningThreshold: 1000.0,
          ch4DangerThreshold: 5000.0,
          heartbeatTimeoutMinutes: 10,
          defaultSensorRadiusMeters: 50,
          mqttBrokerHost: "broker.emqx.io",
          mqttBrokerPort: 1883,
          mqttBrokerWsPort: 8083,
          mqttTopicTemplate: "berseka/iot/telemetry/#",
          geminiApiKey: process.env.GEMINI_API_KEY || null,
          geminiModel: "gemini-1.5-flash",
          cacheTtlSeconds: 300,
          roleAccessMonitoring: ["DEVELOPER", "SUPER_USER", "ADMIN_DLH", "PIMPINAN"],
          roleAccessDataSensor: ["DEVELOPER", "SUPER_USER", "ADMIN_DLH", "PIMPINAN"],
          roleAccessPerangkat: ["DEVELOPER", "SUPER_USER", "ADMIN_DLH"],
          roleAccessKonfigurasi: ["DEVELOPER", "SUPER_USER"],
        },
      });
    }

    return this.formatSystemConfig(config);
  },

  formatSystemConfig(config: any) {
    const warning = Number(config.ch4WarningThreshold ?? 1000);
    const danger = Number(config.ch4DangerThreshold ?? 5000);
    return {
      ...config,
      ch4WarningThreshold: warning,
      ch4DangerThreshold: danger,
      thresholdNormalMax: warning,
      thresholdWarningMax: danger,
      offlineTimeoutMinutes: Number(config.heartbeatTimeoutMinutes ?? 10),
      defaultSensorRadiusMeters: Number(config.defaultSensorRadiusMeters ?? 50),
      mqttBrokerUrl: `mqtt://${config.mqttBrokerHost || "broker.emqx.io"}:${config.mqttBrokerPort || 1883}`,
      mqttTopicCh4: config.mqttTopicTemplate || "berseka/iot/telemetry/#",
      geminiApiKey: config.geminiApiKey || null,
      geminiModel: config.geminiModel || "gemini-3.1-flash-lite",
      rbacPermissions: {
        iot_monitoring: Array.isArray(config.roleAccessMonitoring) ? config.roleAccessMonitoring : ["DEVELOPER", "SUPER_USER"],
        iot_data_sensor: Array.isArray(config.roleAccessDataSensor) ? config.roleAccessDataSensor : ["DEVELOPER", "SUPER_USER"],
        iot_perangkat: Array.isArray(config.roleAccessPerangkat) ? config.roleAccessPerangkat : ["DEVELOPER", "SUPER_USER"],
        iot_konfigurasi: Array.isArray(config.roleAccessKonfigurasi) ? config.roleAccessKonfigurasi : ["DEVELOPER", "SUPER_USER"],
      },
    };
  },

  /**
   * Memperbarui konfigurasi sistem IoT
   */
  async updateSystemConfig(data: {
    ch4WarningThreshold?: number;
    ch4DangerThreshold?: number;
    thresholdNormalMax?: number;
    thresholdWarningMax?: number;
    heartbeatTimeoutMinutes?: number;
    offlineTimeoutMinutes?: number;
    defaultSensorRadiusMeters?: number;
    mqttBrokerHost?: string;
    mqttBrokerPort?: number;
    mqttBrokerWsPort?: number;
    mqttTopicTemplate?: string;
    mqttBrokerUrl?: string;
    mqttTopicCh4?: string;
    mqttUsername?: string | null;
    mqttPassword?: string | null;
    geminiApiKey?: string | null;
    geminiModel?: string;
    cacheTtlSeconds?: number;
    roleAccessMonitoring?: string[];
    roleAccessDataSensor?: string[];
    roleAccessPerangkat?: string[];
    roleAccessKonfigurasi?: string[];
    rbacPermissions?: Record<string, string[]>;
  }) {
    const current = await prisma.ioTSystemConfig.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const currentId = current ? current.id : (await this.getOrCreateSystemConfig()).id;

    const ensureDeveloper = (roles?: string[]) => {
      if (!roles) return undefined;
      const set = new Set(roles);
      set.add("DEVELOPER");
      return Array.from(set);
    };

    const warningTh = data.ch4WarningThreshold !== undefined ? data.ch4WarningThreshold : data.thresholdNormalMax;
    const dangerTh = data.ch4DangerThreshold !== undefined ? data.ch4DangerThreshold : data.thresholdWarningMax;
    const heartbeatTimeout = data.heartbeatTimeoutMinutes !== undefined ? data.heartbeatTimeoutMinutes : data.offlineTimeoutMinutes;
    const topicTemplate = data.mqttTopicTemplate !== undefined ? data.mqttTopicTemplate : data.mqttTopicCh4;

    const roleMonitoring = data.roleAccessMonitoring || data.rbacPermissions?.iot_monitoring;
    const roleDataSensor = data.roleAccessDataSensor || data.rbacPermissions?.iot_data_sensor;
    const rolePerangkat = data.roleAccessPerangkat || data.rbacPermissions?.iot_perangkat;
    const roleKonfigurasi = data.roleAccessKonfigurasi || data.rbacPermissions?.iot_konfigurasi;

    const updated = await prisma.ioTSystemConfig.update({
      where: { id: currentId },
      data: {
        ...(warningTh !== undefined && {
          ch4WarningThreshold: warningTh,
        }),
        ...(dangerTh !== undefined && {
          ch4DangerThreshold: dangerTh,
        }),
        ...(heartbeatTimeout !== undefined && {
          heartbeatTimeoutMinutes: heartbeatTimeout,
        }),
        ...(data.defaultSensorRadiusMeters !== undefined && {
          defaultSensorRadiusMeters: data.defaultSensorRadiusMeters,
        }),
        ...(data.mqttBrokerHost !== undefined && { mqttBrokerHost: data.mqttBrokerHost }),
        ...(data.mqttBrokerPort !== undefined && { mqttBrokerPort: data.mqttBrokerPort }),
        ...(data.mqttBrokerWsPort !== undefined && { mqttBrokerWsPort: data.mqttBrokerWsPort }),
        ...(topicTemplate !== undefined && { mqttTopicTemplate: topicTemplate }),
        ...(data.mqttUsername !== undefined && { mqttUsername: data.mqttUsername }),
        ...(data.mqttPassword !== undefined && { mqttPassword: data.mqttPassword }),
        ...(data.geminiApiKey !== undefined && { geminiApiKey: data.geminiApiKey }),
        ...(data.geminiModel !== undefined && { geminiModel: data.geminiModel }),
        ...(data.cacheTtlSeconds !== undefined && { cacheTtlSeconds: data.cacheTtlSeconds }),
        ...(roleMonitoring && {
          roleAccessMonitoring: ensureDeveloper(roleMonitoring),
        }),
        ...(roleDataSensor && {
          roleAccessDataSensor: ensureDeveloper(roleDataSensor),
        }),
        ...(rolePerangkat && {
          roleAccessPerangkat: ensureDeveloper(rolePerangkat),
        }),
        ...(roleKonfigurasi && {
          roleAccessKonfigurasi: ensureDeveloper(roleKonfigurasi),
        }),
      },
    });

    recommendationCacheMap.clear();
    return this.formatSystemConfig(updated);
  },

  /**
   * Menentukan tingkat status berdasarkan konsentrasi CH4 dalam satuan ppm:
   */
  calculateStatusLevel(
    ppm: number,
    warningThreshold: number = 1000,
    dangerThreshold: number = 5000
  ): CH4StatusLevel {
    if (ppm >= dangerThreshold) {
      return CH4StatusLevel.BAHAYA;
    } else if (ppm >= warningThreshold) {
      return CH4StatusLevel.WASPADA;
    }
    return CH4StatusLevel.AMAN;
  },

  /**
   * Ingest data telemetri dari perangkat sensor IoT (Agrisense / LetSens Node)
   */
  async ingestReading(data: IngestReadingInput) {
    const {
      apiKey,
      nilaiPpm,
      suhu,
      kelembaban,
      baterai,
      rssi,
      latitude,
      longitude,
      lokasiName,
      timestamp,
    } = data;

    if (!apiKey) {
      throw new Error("API Key perangkat tidak boleh kosong");
    }

    const device = await prisma.ioTDevice.findUnique({
      where: { apiKey },
    });

    if (!device) {
      throw new Error("Perangkat IoT tidak terdaftar atau API Key tidak valid");
    }

    const config = await this.getOrCreateSystemConfig();
    const warningTh = Number(config.ch4WarningThreshold) || 1000;
    const dangerTh = Number(config.ch4DangerThreshold) || 5000;
    const statusLevel = this.calculateStatusLevel(Number(nilaiPpm), warningTh, dangerTh);
    const recordedTimestamp = timestamp ? new Date(timestamp) : new Date();

    const reading = await prisma.cH4Reading.create({
      data: {
        deviceId: device.id,
        nilaiPpm: Number(nilaiPpm),
        suhu: suhu !== undefined && suhu !== null ? Number(suhu) : null,
        kelembaban: kelembaban !== undefined && kelembaban !== null ? Number(kelembaban) : null,
        baterai: baterai !== undefined && baterai !== null ? Number(baterai) : null,
        rssi: rssi !== undefined && rssi !== null ? Number(rssi) : null,
        latitude:
          latitude !== undefined && latitude !== null
            ? Number(latitude)
            : Number(device.latitude),
        longitude:
          longitude !== undefined && longitude !== null
            ? Number(longitude)
            : Number(device.longitude),
        lokasiName: lokasiName || device.locationName,
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

    // Update heartbeat dan status otomatis (Aktif saat mengirim payload data)
    // Jika useSensorGps aktif, update koordinat master Tempat Sampah dari sensor payload GPS
    const deviceUpdateData: any = {
      lastSeenAt: recordedTimestamp,
      status: IoTDeviceStatus.ACTIVE,
    };
    if (
      device.useSensorGps &&
      latitude !== undefined &&
      latitude !== null &&
      longitude !== undefined &&
      longitude !== null
    ) {
      deviceUpdateData.latitude = Number(latitude);
      deviceUpdateData.longitude = Number(longitude);
      if (lokasiName) {
        deviceUpdateData.locationName = lokasiName;
      }
    }

    await prisma.ioTDevice.update({
      where: { id: device.id },
      data: deviceUpdateData,
    });

    // Peringatan Dini Status BAHAYA dengan 15-Menit Cooldown
    if (statusLevel === CH4StatusLevel.BAHAYA) {
      const now = Date.now();
      const lastAlert = deviceEmergencyCooldown.get(device.id) || 0;

      if (now - lastAlert >= EMERGENCY_COOLDOWN_MS) {
        deviceEmergencyCooldown.set(device.id, now);

        try {
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

          const alertTitle = `🚨 PERINGATAN GAS METANA BAHAYA (${device.nodeCode})`;
          const alertMessage = `Konsentrasi gas metana terdeteksi kritis sebesar ${Number(nilaiPpm).toLocaleString("id-ID")} ppm di ${device.locationName}. Nilai melampaui batas bahaya (≥ ${dangerTh.toLocaleString("id-ID")} ppm). Segera lakukan mitigasi!`;

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

    return formatReading(reading);
  },

  /**
   * Mengambil semua daftar perangkat IoT beserta status pembacaan terakhir
   */
  async getAllDevices() {
    const config = await this.getOrCreateSystemConfig();
    const timeoutMs = (config.heartbeatTimeoutMinutes || 10) * 60 * 1000;
    const now = Date.now();

    const devices = await prisma.ioTDevice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        kelurahanRef: { select: { id: true, name: true } },
        rwRef: { select: { id: true, name: true } },
        readings: {
          take: 1,
          orderBy: { timestamp: "desc" },
        },
        _count: {
          select: { readings: true },
        },
      },
    });

    return devices.map((d) => {
      const latest = d.readings[0] ? formatReading(d.readings[0]) : null;
      const lastActive = d.lastSeenAt || (latest ? latest.timestamp : null);
      const isOnline =
        lastActive !== null &&
        now - new Date(lastActive).getTime() <= timeoutMs;

      return formatDevice({
        ...d,
        isOnline,
        status: isOnline ? IoTDeviceStatus.ACTIVE : IoTDeviceStatus.INACTIVE,
        latestReading: latest,
        readings: undefined,
      });
    });
  },

  /**
   * Mengambil detail satu perangkat IoT beserta 50 pembacaan terakhir
   */
  async getDeviceById(id: string) {
    const config = await this.getOrCreateSystemConfig();
    const timeoutMs = (config.heartbeatTimeoutMinutes || 10) * 60 * 1000;

    const device = await prisma.ioTDevice.findUnique({
      where: { id },
      include: {
        kelurahanRef: { select: { id: true, name: true } },
        rwRef: { select: { id: true, name: true } },
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

    const latest = device.readings[0] ? formatReading(device.readings[0]) : null;
    const lastActive = device.lastSeenAt || (latest ? latest.timestamp : null);
    const isOnline =
      lastActive !== null &&
      Date.now() - new Date(lastActive).getTime() <= timeoutMs;

    return formatDevice({
      ...device,
      isOnline,
      status: isOnline ? IoTDeviceStatus.ACTIVE : IoTDeviceStatus.INACTIVE,
      latestReading: latest,
      readings: device.readings.map(formatReading),
    });
  },

  /**
   * Mendaftarkan perangkat IoT baru
   */
  async createDevice(data: CreateDeviceInput) {
    const nodeCode =
      data.nodeCode?.trim() ||
      `NODE-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const apiKey = `key_${crypto.randomBytes(16).toString("hex")}`;

    let kelurahanName = data.kelurahan || null;
    let validKelurahanId: string | null = null;
    if (data.kelurahanId && typeof data.kelurahanId === "string" && data.kelurahanId.trim() !== "") {
      const kel = await prisma.kelurahan.findUnique({ where: { id: data.kelurahanId.trim() } });
      if (kel) {
        kelurahanName = kel.name;
        validKelurahanId = kel.id;
      }
    }

    let validRwId: number | null = null;
    if (data.rwId !== undefined && data.rwId !== null) {
      const parsedRwId = typeof data.rwId === "number" ? data.rwId : parseInt(String(data.rwId), 10);
      if (!isNaN(parsedRwId)) {
        const rw = await prisma.rw.findUnique({ where: { id: parsedRwId } });
        if (rw) validRwId = rw.id;
      }
    }

    const device = await prisma.ioTDevice.create({
      data: {
        name: data.name,
        nodeCode,
        locationName: data.locationName,
        latitude: data.latitude,
        longitude: data.longitude,
        useSensorGps: data.useSensorGps !== undefined ? data.useSensorGps : false,
        sensorRadius: data.sensorRadius || 50,
        firmwareVersion: data.firmwareVersion || "1.0.0",
        status: data.status || IoTDeviceStatus.ACTIVE,
        apiKey,
        kelurahan: kelurahanName,
        kelurahanId: validKelurahanId,
        rwId: validRwId,
      },
      include: {
        kelurahanRef: { select: { id: true, name: true } },
        rwRef: { select: { id: true, name: true } },
      },
    });

    return formatDevice(device);
  },

  /**
   * Memperbarui informasi perangkat IoT
   */
  async updateDevice(id: string, data: UpdateDeviceInput) {
    let kelurahanName = data.kelurahan;
    let validKelurahanId: string | null | undefined = undefined;
    if (data.kelurahanId !== undefined) {
      if (data.kelurahanId && typeof data.kelurahanId === "string" && data.kelurahanId.trim() !== "") {
        const kel = await prisma.kelurahan.findUnique({ where: { id: data.kelurahanId.trim() } });
        if (kel) {
          kelurahanName = kel.name;
          validKelurahanId = kel.id;
        } else {
          validKelurahanId = null;
        }
      } else {
        validKelurahanId = null;
      }
    }

    let validRwId: number | null | undefined = undefined;
    if (data.rwId !== undefined) {
      if (data.rwId !== null) {
        const parsedRwId = typeof data.rwId === "number" ? data.rwId : parseInt(String(data.rwId), 10);
        if (!isNaN(parsedRwId)) {
          const rw = await prisma.rw.findUnique({ where: { id: parsedRwId } });
          validRwId = rw ? rw.id : null;
        } else {
          validRwId = null;
        }
      } else {
        validRwId = null;
      }
    }

    const device = await prisma.ioTDevice.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.locationName && { locationName: data.locationName }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.useSensorGps !== undefined && { useSensorGps: data.useSensorGps }),
        ...(data.sensorRadius !== undefined && { sensorRadius: data.sensorRadius }),
        ...(data.firmwareVersion !== undefined && { firmwareVersion: data.firmwareVersion }),
        ...(data.status && { status: data.status }),
        ...(validKelurahanId !== undefined && { kelurahanId: validKelurahanId }),
        ...(kelurahanName !== undefined && { kelurahan: kelurahanName }),
        ...(validRwId !== undefined && { rwId: validRwId }),
      },
      include: {
        kelurahanRef: { select: { id: true, name: true } },
        rwRef: { select: { id: true, name: true } },
      },
    });

    return formatDevice(device);
  },

  /**
   * Simulasi Over-The-Air (OTA) Firmware Update
   */
  async updateFirmwareOta(id: string, targetVersion: string) {
    if (!targetVersion || !targetVersion.trim()) {
      throw new Error("Target versi firmware wajib diisi");
    }

    const device = await prisma.ioTDevice.update({
      where: { id },
      data: {
        firmwareVersion: targetVersion.trim(),
      },
      select: {
        id: true,
        name: true,
        nodeCode: true,
        firmwareVersion: true,
        updatedAt: true,
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
    return await prisma.ioTDevice.update({
      where: { id },
      data: { apiKey: newApiKey },
      select: {
        id: true,
        name: true,
        nodeCode: true,
        apiKey: true,
      },
    });
  },

  /**
   * Mengambil riwayat pembacaan sensor dengan paginasi dan filter untuk Data Sensor View
   */
  async getReadings(options: {
    page?: number;
    limit?: number;
    deviceId?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = Math.max(Number(options.page) || 1, 1);
    const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.deviceId && options.deviceId !== "ALL") {
      where.deviceId = options.deviceId;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.device = {
        OR: [
          { nodeCode: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { locationName: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    if (options.startDate || options.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp.gte = options.startDate;
      if (options.endDate) where.timestamp.lte = options.endDate;
    }

    const [total, readings] = await Promise.all([
      prisma.cH4Reading.count({ where }),
      prisma.cH4Reading.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
        include: {
          device: {
            select: {
              id: true,
              name: true,
              nodeCode: true,
              locationName: true,
              kelurahan: true,
            },
          },
        },
      }),
    ]);

    return {
      data: readings.map(formatReading),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Mengambil seluruh data pembacaan sensor untuk ekspor CSV resmi
   */
  async getAllReadingsForExport(options: {
    deviceId?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (options.deviceId && options.deviceId !== "ALL") {
      where.deviceId = options.deviceId;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.device = {
        OR: [
          { nodeCode: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { locationName: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    if (options.startDate || options.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp.gte = options.startDate;
      if (options.endDate) where.timestamp.lte = options.endDate;
    }

    const readings = await prisma.cH4Reading.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 5000,
      include: {
        device: {
          select: {
            id: true,
            name: true,
            nodeCode: true,
            locationName: true,
            kelurahan: true,
          },
        },
      },
    });

    return readings.map((r) => {
      const dateObj = new Date(r.timestamp);
      const isoTime = dateObj.toISOString();
      const timePart = dateObj.toLocaleTimeString("id-ID", { hour12: false });
      const datePart = dateObj.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      return {
        id: r.id,
        waktuIso: isoTime,
        waktuJam: timePart,
        waktuTanggal: datePart,
        kodePerangkat: r.device.nodeCode,
        namaPerangkat: r.device.name,
        nilaiCh4Ppm: Number(r.nilaiPpm),
        tingkatStatus: r.statusLevel,
        latitude: r.latitude ? Number(r.latitude) : null,
        longitude: r.longitude ? Number(r.longitude) : null,
        bateraiPersen: r.baterai ? Number(r.baterai) : null,
        rssiDbm: r.rssi ? Number(r.rssi) : null,
        lokasi: r.lokasiName || r.device.locationName,
      };
    });
  },

  /**
   * Mengambil riwayat time-series perangkat untuk grafik
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
    const where: any = {};
    if (deviceId && deviceId !== "ALL") {
      where.deviceId = deviceId;
    }

    if (options.startDate || options.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp.gte = options.startDate;
      if (options.endDate) where.timestamp.lte = options.endDate;
    }

    const readings = await prisma.cH4Reading.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      include: {
        device: {
          select: { id: true, name: true, nodeCode: true },
        },
      },
    });

    return readings.map(formatReading);
  },

  /**
   * Mengambil ringkasan komprehensif dashboard pemantauan IoT (Monitoring View)
   */
  async getDashboardSummary(options: {
    deviceId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const config = await this.getOrCreateSystemConfig();
    const timeoutMs = (config.heartbeatTimeoutMinutes || 10) * 60 * 1000;
    const warningTh = Number(config.ch4WarningThreshold) || 1000;
    const dangerTh = Number(config.ch4DangerThreshold) || 5000;
    const now = Date.now();

    const allDevices = await prisma.ioTDevice.findMany({
      include: {
        readings: {
          take: 1,
          orderBy: { timestamp: "desc" },
        },
      },
    });

    let activeDevicesCount = 0;
    let inactiveDevicesCount = 0;
    let warningDevicesCount = 0;

    const devicesMap = allDevices.map((d) => {
      const latest = d.readings[0] || null;
      const lastActive = d.lastSeenAt || (latest ? latest.timestamp : null);
      const isOnline =
        d.status === IoTDeviceStatus.ACTIVE &&
        lastActive !== null &&
        now - new Date(lastActive).getTime() <= timeoutMs;

      if (isOnline) {
        activeDevicesCount++;
      } else {
        inactiveDevicesCount++;
      }

      let ch4Status: "NORMAL" | "PERINGATAN" | "BAHAYA" = "NORMAL";
      const currentPpm = latest ? Number(latest.nilaiPpm) : 0;
      if (currentPpm >= dangerTh) {
        ch4Status = "BAHAYA";
        warningDevicesCount++;
      } else if (currentPpm >= warningTh) {
        ch4Status = "PERINGATAN";
        warningDevicesCount++;
      }

      return {
        id: d.id,
        nodeCode: d.nodeCode,
        name: d.name,
        locationName: d.locationName,
        latitude: Number(d.latitude),
        longitude: Number(d.longitude),
        sensorRadius: d.sensorRadius || config.defaultSensorRadiusMeters || 50,
        firmwareVersion: d.firmwareVersion,
        isOnline,
        lastSeenAt: d.lastSeenAt,
        latestReading: latest
          ? {
              id: latest.id,
              nilaiPpm: Number(latest.nilaiPpm),
              baterai: latest.baterai ? Number(latest.baterai) : null,
              rssi: latest.rssi ? Number(latest.rssi) : null,
              timestamp: latest.timestamp,
              statusLevel: latest.statusLevel,
            }
          : null,
        ch4Status,
      };
    });

    const readingsWhere: any = {};
    if (options.deviceId && options.deviceId !== "ALL") {
      readingsWhere.deviceId = options.deviceId;
    }
    if (options.startDate || options.endDate) {
      readingsWhere.timestamp = {};
      if (options.startDate) readingsWhere.timestamp.gte = options.startDate;
      if (options.endDate) readingsWhere.timestamp.lte = options.endDate;
    }

    const recentReadings = await prisma.cH4Reading.findMany({
      where: readingsWhere,
      orderBy: { timestamp: "desc" },
      take: 60,
      include: {
        device: { select: { nodeCode: true, name: true } },
      },
    });

    const latestReading = recentReadings[0] || null;

    let currentCh4 = 0;
    let avgCh4 = 0;
    let minCh4 = 0;
    let maxCh4 = 0;
    let currentBattery = 0;
    let avgBattery = 0;
    let currentRssi = 0;
    let avgRssi = 0;

    if (recentReadings.length > 0) {
      currentCh4 = Number(recentReadings[0].nilaiPpm);
      currentBattery = recentReadings[0].baterai ? Number(recentReadings[0].baterai) : 100;
      currentRssi = recentReadings[0].rssi ? Number(recentReadings[0].rssi) : -65;

      let sumCh4 = 0;
      let sumBat = 0;
      let countBat = 0;
      let sumRssi = 0;
      let countRssi = 0;

      minCh4 = currentCh4;
      maxCh4 = currentCh4;

      for (const r of recentReadings) {
        const val = Number(r.nilaiPpm);
        sumCh4 += val;
        if (val < minCh4) minCh4 = val;
        if (val > maxCh4) maxCh4 = val;

        if (r.baterai !== null && r.baterai !== undefined) {
          sumBat += Number(r.baterai);
          countBat++;
        }
        if (r.rssi !== null && r.rssi !== undefined) {
          sumRssi += Number(r.rssi);
          countRssi++;
        }
      }

      avgCh4 = Number((sumCh4 / recentReadings.length).toFixed(1));
      avgBattery = countBat > 0 ? Number((sumBat / countBat).toFixed(0)) : currentBattery;
      avgRssi = countRssi > 0 ? Number((sumRssi / countRssi).toFixed(1)) : currentRssi;
    }

    let currentStatusLevel: "NORMAL" | "PERINGATAN" | "BAHAYA" = "NORMAL";
    if (currentCh4 >= dangerTh) {
      currentStatusLevel = "BAHAYA";
    } else if (currentCh4 >= warningTh) {
      currentStatusLevel = "PERINGATAN";
    }

    const historyPoints = [...recentReadings].reverse().map((r) => ({
      timestamp: r.timestamp,
      timeLabel: new Date(r.timestamp).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      ch4: Number(r.nilaiPpm),
      battery: r.baterai !== null ? Number(r.baterai) : null,
      rssi: r.rssi !== null ? Number(r.rssi) : null,
      nodeCode: r.device.nodeCode,
    }));

    let selectedNodeInfo: any = null;
    if (options.deviceId && options.deviceId !== "ALL") {
      const target = devicesMap.find((d) => d.id === options.deviceId);
      if (target) {
        selectedNodeInfo = {
          id: target.id,
          name: target.name,
          nodeCode: target.nodeCode,
          locationName: target.locationName,
          isOnline: target.isOnline,
          sensorRadius: target.sensorRadius,
        };
      }
    }

    return {
      // Flat properties compatible with IoTTelemetrySummary in web app
      totalDevices: allDevices.length,
      activeDevices: activeDevicesCount,
      offlineDevices: inactiveDevicesCount,
      latestReading: latestReading ? formatReading(latestReading) : null,
      avgCh4Ppm: avgCh4,
      maxCh4Ppm: maxCh4,
      minCh4Ppm: minCh4,
      statusCounts: {
        normal: allDevices.length - warningDevicesCount,
        warning: warningDevicesCount,
        danger: 0,
      },
      sparklines: historyPoints.map((h) => ({
        time: h.timeLabel,
        timestamp: typeof h.timestamp === "string" ? h.timestamp : new Date(h.timestamp).toISOString(),
        ch4Ppm: h.ch4,
        suhu: null,
        kelembaban: null,
        baterai: h.battery,
        rssi: h.rssi,
      })),
      devices: devicesMap,

      // Nested properties
      kpi: {
        totalDevices: allDevices.length,
        activeDevices: activeDevicesCount,
        inactiveDevices: inactiveDevicesCount,
        warningDevices: warningDevicesCount,
      },
      selectedNode: selectedNodeInfo,
      telemetry: {
        lastSentAt: latestReading ? latestReading.timestamp : null,
        ch4: {
          current: currentCh4,
          avg: avgCh4,
          min: minCh4,
          max: maxCh4,
          status: currentStatusLevel,
          unit: "ppm",
        },
        battery: {
          current: currentBattery,
          avg: avgBattery,
          unit: "%",
        },
        rssi: {
          current: currentRssi,
          avg: avgRssi,
          unit: "dBm",
        },
        history: historyPoints,
      },
      devicesMap,
      thresholds: {
        warning: warningTh,
        danger: dangerTh,
      },
    };
  },

  /**
   * Menghasilkan atau mengambil rekomendasi analisis sistem (Google Gemini dengan caching)
   */
  async getAiRecommendation(forceRefresh: boolean = false, deviceId?: string) {
    const config = await this.getOrCreateSystemConfig();
    const ttlMs = (config.cacheTtlSeconds || 300) * 1000;
    const now = Date.now();

    const cacheKey = deviceId && deviceId !== "all" ? `device_${deviceId}` : "all";
    const cached = recommendationCacheMap.get(cacheKey);

    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
    const hasApiKey = Boolean(apiKey && apiKey.trim().length > 10);
    const configuredModel = config.geminiModel || "gemini-3.1-flash-lite";

    if (!forceRefresh && cached) {
      const ageMs = now - cached.generatedAt.getTime();
      const canUseCache = ageMs < ttlMs && (!hasApiKey || cached.wasAi);
      if (canUseCache) {
        return {
          ...cached.data,
          isCached: true,
        };
      }
    }

    let targetDevice: any = null;
    if (deviceId && deviceId !== "all") {
      try {
        targetDevice = await prisma.ioTDevice.findUnique({
          where: { id: deviceId },
          select: {
            id: true,
            name: true,
            nodeCode: true,
            locationName: true,
          },
        });
      } catch (err) {
        console.warn("Gagal mengambil data perangkat spesifik untuk rekomendasi:", err);
      }
    }

    const summary = await this.getDashboardSummary(
      targetDevice ? { deviceId: targetDevice.id } : undefined
    );
    const ch4Val = summary.telemetry.ch4.current;
    const ch4Avg = summary.telemetry.ch4.avg;
    const ch4Max = summary.telemetry.ch4.max;
    const currentStatus = summary.telemetry.ch4.status;

    let ringkasanKondisi = "";
    let evaluasiFisikaKimia = "";
    let langkahPenangananSop: string[] = [];
    let rekomendasiTeknis: string[] = [];
    let confidenceScore = 95;

    if (currentStatus === "BAHAYA") {
      confidenceScore = 99;
      ringkasanKondisi = `Konsentrasi gas metana (CH₄) terdeteksi pada level kritis ${ch4Val.toLocaleString("id-ID")} ppm (melampaui ambang bahaya ≥ ${summary.thresholds.danger.toLocaleString("id-ID")} ppm). Segera lakukan tindakan penanganan darurat di lapangan.`;
      evaluasiFisikaKimia = `Dekomposisi anaerobik intensif menghasilkan gas metana dengan laju difusi tinggi. Mengacu pada baku mutu lingkungan dan hukum gas ideal, akumulasi CH₄ pada wadah penampungan meningkatkan risiko tekanan berlebih dan batas ledak bawah (LEL 5% vol atau 50.000 ppm).`;
      langkahPenangananSop = [
        "Buka seluruh ventilasi kompartemen dan aktifkan sirkulasi udara aktif untuk evakuasi gas metana.",
        "Lakukan pembalikan dan penguraian tumpukan sampah organik guna memfasilitasi proses aerasi oksigen.",
        "Sterilkan radius aman minimum 50 meter dari segala potensi sumber percikan api dan mesin pembakar.",
        "Tugaskan personel lapangan ber-APD lengkap untuk melakukan inspeksi berkala pada node sensor setiap 15 menit.",
      ];
      rekomendasiTeknis = [
        "Lakukan kalibrasi ulang titik nol (zero-point) sensor gas CH₄ setelah konsentrasi mereda.",
        "Periksa modul transmisi LoRa/GSM dan pastikan kontinuitas pengiriman telemetri.",
        "Tingkatkan frekuensi pembaruan telemetri perangkat menjadi mode prioritas tinggi.",
      ];
    } else if (currentStatus === "PERINGATAN") {
      confidenceScore = 94;
      ringkasanKondisi = `Konsentrasi gas metana (CH₄) berada pada rentang waspada sebesar ${ch4Val.toLocaleString("id-ID")} ppm (ambang waspada: ${summary.thresholds.warning.toLocaleString("id-ID")} ppm). Perlu tindakan mitigasi preventif sebelum mencapai ambang kritis.`;
      evaluasiFisikaKimia = `Terdeteksi laju pembentukan biogas awal akibat kepekatan timbunan materi organik basah. Rasio C/N yang belum seimbang mempercepat aktivitas bakteri metanogenik.`;
      langkahPenangananSop = [
        "Periksa kepadatan timbunan sampah dan pastikan sirkulasi ventilasi udara pada wadah penampungan tidak terhalang.",
        "Percepat proses pemilahan fraksi sampah organik basah untuk dialihkan ke pengolahan komposting TPS3R.",
        "Pantau tren kurva telemetri secara berkelanjutan guna mengantisipasi lonjakan konsentrasi eksponensial.",
        "Pastikan penutup tempat sampah berada pada posisi ventilasi terbuka teratur.",
      ];
      rekomendasiTeknis = [
        "Lakukan inspeksi fisik node sensor dari kemungkinan terkena cipratan cairan lindi atau kotoran.",
        "Pastikan kapasitas baterai perangkat tetap di atas ambang batas operasional minimum (> 40%).",
        "Verifikasi keakuratan pembacaan sensor gas dan stabilitas konektivitas nirkabel sekitar tempat sampah.",
      ];
    } else {
      confidenceScore = 97;
      ringkasanKondisi = `Kondisi atmosfer di seluruh titik pemantauan sensor CH₄ berada dalam status Normal (rata-rata ${ch4Avg.toLocaleString("id-ID")} ppm, konsentrasi terkini ${ch4Val.toLocaleString("id-ID")} ppm). Kualitas udara dan ventilasi terpantau stabil.`;
      evaluasiFisikaKimia = `Tingkat konsentrasi metana berada jauh di bawah ambang batas regulasi baku mutu lingkungan. Difusi gas berlangsung seimbang dengan sirkulasi udara alami pada titik penempatan sensor.`;
      langkahPenangananSop = [
        "Pertahankan jadwal pengangkutan sampah terpilah secara teratur sesuai standar operasional yang berlaku.",
        "Jaga kebersihan kompartemen penampungan dan lakukan pembersihan berkala dari residu sampah organik.",
        "Dukung pemilahan sampah organik dan anorganik dari sumber timbulan oleh masyarakat.",
      ];
      rekomendasiTeknis = [
        "Jaga jadwal pemeliharaan rutin perangkat sensor setiap 30 hari kalender.",
        "Pastikan integritas enclosure tahan cuaca (IP65) perangkat sensor tetap kedap air.",
        "Pertahankan konektivitas jaringan transmisi data agar tetap prima di atas -85 dBm.",
      ];
    }

    let isAiProcessed = false;
    let usedModelName = configuredModel;

    if (hasApiKey) {
      const modelCandidates = [
        configuredModel,
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash",
        "gemini-3.5-flash",
        "gemini-flash-latest",
      ].filter((m, i, arr) => m && arr.indexOf(m) === i);

      const targetPromptContext = targetDevice
        ? `- Target Perangkat: ${targetDevice.name} (${targetDevice.nodeCode})\n- Lokasi TPS: ${targetDevice.locationName || "-"}\n- Kategori: ${targetDevice.category || "TPS"}\n`
        : "- Target: Seluruh Jaringan TPS & Sensor Pemantauan Terpasang\n";

      const prompt = `Anda adalah asisten pakar lingkungan hidup dan tata kelola emisi gas metana (CH₄) pada sistem Internet of Things BERSEKA.
Data telemetri real-time terkini:
${targetPromptContext}- Konsentrasi CH₄: ${ch4Val} ppm
- Nilai Rata-rata: ${ch4Avg} ppm
- Nilai Puncak: ${ch4Max} ppm
- Status Kondisi: ${currentStatus} (Ambang Waspada: ${summary.thresholds.warning} ppm, Ambang Bahaya: ${summary.thresholds.danger} ppm)

Tugas: Hasilkan evaluasi dan rekomendasi tindakan dalam format JSON murni dengan skema berikut:
{
  "ringkasanKondisi": "1-2 kalimat ringkasan kondisi atmosfer dan emisi metana saat ini",
  "evaluasiFisikaKimia": "1 paragraf evaluasi ilmiah mengenai dekomposisi organik, akumulasi gas, difusi udara, dan baku mutu",
  "langkahPenangananSop": [
    "Langkah SOP 1",
    "Langkah SOP 2",
    "Langkah SOP 3",
    "Langkah SOP 4"
  ],
  "rekomendasiTeknis": [
    "Tindakan teknis 1",
    "Tindakan teknis 2",
    "Tindakan teknis 3"
  ]
}

Aturan Penting:
1. Bahasa baku Indonesia formal dan saintifik.
2. DILARANG menggunakan kata 'tong' atau 'tong sampah'. Gunakan 'tempat sampah' atau 'TPS'.
3. Berikan saran realistis dan aplikatif bagi petugas lapangan dan pengawas lingkungan.`;

      for (const candModel of modelCandidates) {
        try {
          const cleanModel = candModel.trim().replace(/^models\//, "");
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey!.trim()}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 1000,
                  responseMimeType: "application/json",
                },
              }),
            }
          );

          if (response.ok) {
            const json: any = await response.json();
            const candidateText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText && candidateText.trim()) {
              let cleanJson = candidateText.trim();
              if (cleanJson.startsWith("```")) {
                cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
              }
              try {
                const parsed = JSON.parse(cleanJson);
                if (parsed.ringkasanKondisi) ringkasanKondisi = parsed.ringkasanKondisi;
                if (parsed.evaluasiFisikaKimia) evaluasiFisikaKimia = parsed.evaluasiFisikaKimia;
                if (Array.isArray(parsed.langkahPenangananSop) && parsed.langkahPenangananSop.length > 0) {
                  langkahPenangananSop = parsed.langkahPenangananSop;
                }
                if (Array.isArray(parsed.rekomendasiTeknis) && parsed.rekomendasiTeknis.length > 0) {
                  rekomendasiTeknis = parsed.rekomendasiTeknis;
                }
                isAiProcessed = true;
                usedModelName = cleanModel;
                break;
              } catch {
                evaluasiFisikaKimia = cleanJson;
                isAiProcessed = true;
                usedModelName = cleanModel;
                break;
              }
            }
          } else {
            const errBody = await response.text();
            console.warn(`Model Gemini [${cleanModel}] status ${response.status}: ${errBody.slice(0, 120)}`);
          }
        } catch (err: any) {
          console.warn(`Gagal memanggil candidate model [${candModel}]:`, err?.message || err);
        }
      }
    }

    const resultData: SystemRecommendationData = {
      statusLevel: currentStatus,
      confidenceScore,
      ringkasanKondisi,
      evaluasiFisikaKimia,
      langkahPenangananSop,
      rekomendasiTeknis,
      modelAnalisis: isAiProcessed ? usedModelName : "Standar Baku Mutu",
      dianalisisPada: new Date().toISOString(),
      isCached: false,
      isAiIntegrated: isAiProcessed,
      apiKeyConfigured: hasApiKey,
      targetDevice: targetDevice
        ? {
            id: targetDevice.id,
            name: targetDevice.name,
            nodeCode: targetDevice.nodeCode,
            locationName: targetDevice.locationName,
          }
        : null,
    };

    recommendationCacheMap.set(cacheKey, {
      data: resultData,
      generatedAt: new Date(),
      wasAi: isAiProcessed,
    });

    return resultData;
  },

  /**
   * Mengambil daftar pengguna aktif yang dapat ditugaskan sebagai PIC Petugas Lapangan
   */
  async getOfficers() {
    const users = await prisma.user.findMany({
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

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      role: typeof u.role === "object" && u.role ? u.role.name : (u.role || "Petugas"),
    }));
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

  /**
   * Memvalidasi Google Gemini API Key dan mengambil daftar model yang tersedia
   */
  async validateAndListGeminiModels(apiKey: string) {
    const trimmedKey = (apiKey || "").trim();
    if (!trimmedKey) {
      throw new Error("API Key Google Gemini tidak boleh kosong");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmedKey)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      let errorMsg = `Google Gemini API error (HTTP ${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson?.error?.message) {
          errorMsg = errJson.error.message;
        }
      } catch {
        // ignore json parse error
      }
      throw new Error(errorMsg);
    }

    const data: any = await response.json();
    const rawModels: any[] = Array.isArray(data.models) ? data.models : [];

    // Filter hanya model teks yang mendukung generateContent dan bukan multimodal non-teks
    const nonTextKeywords = ["tts", "image", "audio", "transcribe", "embedding", "banana", "clip", "veo", "robotics", "computer-use"];
    const validModels = rawModels
      .filter((m) => {
        const methods = m.supportedGenerationMethods || [];
        const isGenContent = Array.isArray(methods) && methods.includes("generateContent");
        if (!isGenContent) return false;
        const nameLower = (m.name || "").toLowerCase();
        return !nonTextKeywords.some((kw) => nameLower.includes(kw));
      })
      .map((m) => {
        const cleanName = (m.name || "").replace(/^models\//, "");

        let recommendationLabel = "";
        let isRecommended = false;
        let priority = 100;

        if (cleanName === "gemini-3.1-flash-lite") {
          isRecommended = true;
          recommendationLabel = "Rekomendasi Utama (Respons Tercepat & Kuota Hemat)";
          priority = 1;
        } else if (cleanName === "gemini-3.8-flash") {
          isRecommended = true;
          recommendationLabel = "Generasi Terbaru Flash (Cerdas & Seimbang)";
          priority = 2;
        } else if (cleanName === "gemini-3.5-flash") {
          recommendationLabel = "Flash Cepat & Stabil";
          priority = 3;
        } else if (cleanName === "gemini-flash-latest") {
          recommendationLabel = "Flash Otomatis Terkini";
          priority = 4;
        } else if (cleanName.includes("pro")) {
          priority = 20;
          recommendationLabel = "Penalaran Mendalam";
        } else if (cleanName.includes("flash")) {
          priority = 10;
        }

        return {
          id: cleanName,
          name: m.name,
          displayName: m.displayName || cleanName,
          description: m.description || "",
          inputTokenLimit: m.inputTokenLimit,
          outputTokenLimit: m.outputTokenLimit,
          isRecommended,
          recommendationLabel,
          priority,
        };
      })
      .sort((a, b) => a.priority - b.priority);

    // Tentukan model terbaik yang disarankan
    const bestModel =
      validModels.find((m) => m.id === "gemini-3.1-flash-lite")?.id ||
      validModels.find((m) => m.id === "gemini-3.8-flash")?.id ||
      validModels.find((m) => m.id === "gemini-3.5-flash")?.id ||
      validModels[0]?.id ||
      "gemini-3.1-flash-lite";

    return {
      valid: true,
      totalModels: validModels.length,
      recommendedModel: bestModel,
      models: validModels,
    };
  },
};

