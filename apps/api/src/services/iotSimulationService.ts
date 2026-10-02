import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../lib/prisma.js";
import { iotService } from "./iotService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE_PATH = path.resolve(__dirname, "../../.iot-simulation-state.json");

export interface DevicePulseState {
  deviceId: string;
  nodeCode: string;
  deviceName: string;
  locationName: string;
  apiKey: string;
  latitude: number;
  longitude: number;
  currentPpm: number;
  currentBattery: number;
  currentRssi: number;
  currentTemp: number;
  currentHumidity: number;
  lastStatusLevel: string;
  lastReadingAt: string | null;
}

export interface SimulationState {
  isActive: boolean;
  isAllDevices: boolean;
  targetDeviceCount: number;
  deviceIds: string[];
  devices: DevicePulseState[];
  intervalMinutes: number;
  pulseCount: number;
  totalReadingsSent: number;
  lastPulseAt: string | null;
  nextPulseAt?: string | null;
  lastError: string | null;
  // Properti backward-compatibility untuk tampilan single node
  deviceId: string | null;
  nodeCode: string | null;
  deviceName: string | null;
  locationName: string | null;
  currentPpm: number;
  currentBattery: number;
  currentRssi: number;
  currentTemp: number;
  currentHumidity: number;
  lastStatusLevel: string | null;
}

class IoTSimulationService {
  private timer: NodeJS.Timeout | null = null;
  private activeDevices: Map<string, DevicePulseState> = new Map();
  private state: SimulationState = {
    isActive: false,
    isAllDevices: false,
    targetDeviceCount: 0,
    deviceIds: [],
    devices: [],
    intervalMinutes: 15,
    pulseCount: 0,
    totalReadingsSent: 0,
    lastPulseAt: null,
    nextPulseAt: null,
    lastError: null,
    deviceId: null,
    nodeCode: null,
    deviceName: null,
    locationName: null,
    currentPpm: 450,
    currentBattery: 95.0,
    currentRssi: -65,
    currentTemp: 28.5,
    currentHumidity: 72.0,
    lastStatusLevel: "AMAN",
  };

  /**
   * Mengambil status simulator background service saat ini
   */
  getStatus(): SimulationState {
    const devList = Array.from(this.activeDevices.values());
    const primary = devList[0];

    let nextPulseAt: string | null = null;
    if (this.state.isActive && this.state.lastPulseAt && this.state.intervalMinutes) {
      const nextMs = new Date(this.state.lastPulseAt).getTime() + this.state.intervalMinutes * 60 * 1000;
      nextPulseAt = new Date(nextMs).toISOString();
    }

    return {
      ...this.state,
      targetDeviceCount: devList.length,
      deviceIds: devList.map((d) => d.deviceId),
      devices: devList,
      nextPulseAt,
      deviceId: primary ? primary.deviceId : null,
      nodeCode: primary ? primary.nodeCode : null,
      deviceName: primary ? primary.deviceName : null,
      locationName: primary ? primary.locationName : null,
      currentPpm: primary ? primary.currentPpm : this.state.currentPpm,
      currentBattery: primary ? primary.currentBattery : this.state.currentBattery,
      currentRssi: primary ? primary.currentRssi : this.state.currentRssi,
      currentTemp: primary ? primary.currentTemp : this.state.currentTemp,
      currentHumidity: primary ? primary.currentHumidity : this.state.currentHumidity,
      lastStatusLevel: primary ? primary.lastStatusLevel : this.state.lastStatusLevel,
    };
  }

  /**
   * Menghasilkan nilai acak baru untuk sebuah perangkat dengan Brownian random walk independen
   */
  private generateNextDeviceValues(dev: DevicePulseState) {
    // 1. CH4 Ppm - Brownian walk dengan variasi dinamis nyata dan kemungkinan lonjakan biogenik
    const stepDirection = Math.random() > 0.48 ? 1 : -1;
    const baseVariation = stepDirection * (25 + Math.round(Math.random() * 85));
    const isSpike = Math.random() < 0.15;
    const spikeMagnitude = isSpike ? (Math.random() > 0.45 ? 1 : -1) * (300 + Math.round(Math.random() * 800)) : 0;

    let nextPpm = Math.round(dev.currentPpm + baseVariation + spikeMagnitude);
    // Batasi dalam rentang realistis Tempat Sampah (120 s/d 6800 ppm)
    if (nextPpm < 120) nextPpm = 120 + Math.round(Math.random() * 100);
    if (nextPpm > 6800) nextPpm = 6800 - Math.round(Math.random() * 900);
    dev.currentPpm = nextPpm;

    // 2. Baterai - variasi voltase natural dengan peluruhan halus
    const battDelta = (Math.random() - 0.55) * 0.25;
    let nextBatt = Math.round((dev.currentBattery + battDelta) * 10) / 10;
    if (nextBatt > 100) nextBatt = 100;
    if (nextBatt < 20) nextBatt = 85.0;
    dev.currentBattery = nextBatt;

    // 3. RSSI - fluktuasi radio lingkungan (-55 dBm s/d -85 dBm)
    const rssiNoise = Math.round((Math.random() - 0.5) * 8);
    dev.currentRssi = Math.max(-90, Math.min(-52, -66 + rssiNoise));

    // 4. Suhu ambient Tempat Sampah (25.0°C - 33.5°C)
    const tempNoise = (Math.random() - 0.5) * 1.0;
    dev.currentTemp = Math.round((28.5 + tempNoise) * 10) / 10;

    // 5. Kelembaban ambient (62% - 88%)
    const humNoise = (Math.random() - 0.5) * 2.5;
    dev.currentHumidity = Math.round((72.0 + humNoise) * 10) / 10;
  }

  /**
   * Menjalankan 1x denyut telemetri ke seluruh perangkat aktif dan menyimpannya ke database
   */
  async executePulse(): Promise<void> {
    if (this.activeDevices.size === 0) {
      this.stop();
      return;
    }

    try {
      for (const [, devState] of this.activeDevices.entries()) {
        // Generate fluktuasi acak baru untuk node ini
        this.generateNextDeviceValues(devState);

        // Ingest telemetri melalui iotService
        const reading = await iotService.ingestReading({
          apiKey: devState.apiKey,
          nilaiPpm: devState.currentPpm,
          suhu: devState.currentTemp,
          kelembaban: devState.currentHumidity,
          baterai: devState.currentBattery,
          rssi: devState.currentRssi,
          latitude: devState.latitude,
          longitude: devState.longitude,
          lokasiName: devState.locationName,
          timestamp: new Date(),
        });

        devState.lastStatusLevel = reading.statusLevel;
        devState.lastReadingAt = new Date().toISOString();
        this.state.totalReadingsSent += 1;

        console.log(
          `[IoT Simulation Service] Denyut multi-node terkirim untuk ${devState.nodeCode}: ${devState.currentPpm} ppm (${reading.statusLevel})`
        );
      }

      this.state.pulseCount += 1;
      this.state.lastPulseAt = new Date().toISOString();
      this.state.lastError = null;
    } catch (err: any) {
      console.error("[IoT Simulation Service] Gagal mengeksekusi denyut simulasi multi-perangkat:", err?.message);
      this.state.lastError = err?.message || "Gagal mengeksekusi simulasi telemetri";
    }
  }

  /**
   * Memulai Background Service Aliran Otomatis Telemetri Multi-Perangkat
   */
  async start(options: {
    deviceId?: string;
    deviceIds?: string[] | "all";
    intervalMinutes: number;
  }): Promise<SimulationState> {
    const { deviceId, deviceIds, intervalMinutes } = options;

    const safeIntervalMinutes = Math.max(0.1, Number(intervalMinutes) || 15);

    // Hentikan timer sebelumnya jika sedang berjalan
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.activeDevices.clear();

    const isAll = deviceIds === "all" || deviceId === "all";
    let targetDeviceList: any[] = [];

    if (isAll) {
      // Ambil seluruh perangkat yang terdaftar
      targetDeviceList = await prisma.ioTDevice.findMany({
        where: { status: { in: ["ACTIVE", "MAINTENANCE"] } },
        include: {
          readings: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
      });

      if (targetDeviceList.length === 0) {
        targetDeviceList = await prisma.ioTDevice.findMany({
          include: {
            readings: {
              orderBy: { timestamp: "desc" },
              take: 1,
            },
          },
        });
      }
    } else if (Array.isArray(deviceIds) && deviceIds.length > 0) {
      targetDeviceList = await prisma.ioTDevice.findMany({
        where: { id: { in: deviceIds } },
        include: {
          readings: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
      });
    } else if (deviceId) {
      const single = await prisma.ioTDevice.findUnique({
        where: { id: deviceId },
        include: {
          readings: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
      });
      if (single) targetDeviceList = [single];
    }

    if (targetDeviceList.length === 0) {
      throw new Error("Tidak ada perangkat yang ditemukan untuk menjalankan simulasi telemetri");
    }

    // Inisialisasi state per perangkat
    for (const dev of targetDeviceList) {
      if (!dev.apiKey) continue;
      const lastReading = dev.readings[0];
      const initialPpm = lastReading ? Number(lastReading.nilaiPpm) : 380 + Math.round(Math.random() * 200);
      const initialBatt = lastReading && lastReading.baterai ? Number(lastReading.baterai) : 94.0;
      const initialRssi = lastReading && lastReading.rssi ? Number(lastReading.rssi) : -65;

      this.activeDevices.set(dev.id, {
        deviceId: dev.id,
        nodeCode: dev.nodeCode,
        deviceName: dev.name,
        locationName: dev.locationName,
        apiKey: dev.apiKey,
        latitude: Number(dev.latitude) || -6.8722,
        longitude: Number(dev.longitude) || 107.5422,
        currentPpm: initialPpm,
        currentBattery: initialBatt,
        currentRssi: initialRssi,
        currentTemp: 28.5,
        currentHumidity: 72.0,
        lastStatusLevel: lastReading?.statusLevel || "AMAN",
        lastReadingAt: lastReading ? lastReading.timestamp.toISOString() : null,
      });
    }

    if (this.activeDevices.size === 0) {
      throw new Error("Perangkat yang dipilih belum memiliki API Key yang valid");
    }

    this.state = {
      isActive: true,
      isAllDevices: isAll,
      targetDeviceCount: this.activeDevices.size,
      deviceIds: Array.from(this.activeDevices.keys()),
      devices: Array.from(this.activeDevices.values()),
      intervalMinutes: safeIntervalMinutes,
      pulseCount: 0,
      totalReadingsSent: 0,
      lastPulseAt: null,
      nextPulseAt: null,
      lastError: null,
      deviceId: null,
      nodeCode: null,
      deviceName: null,
      locationName: null,
      currentPpm: 450,
      currentBattery: 95.0,
      currentRssi: -65,
      currentTemp: 28.5,
      currentHumidity: 72.0,
      lastStatusLevel: "AMAN",
    };

    // ponytail: in-memory Node.js timer holds for single-instance monolith. Upgrade to BullMQ/Redis if multi-worker cluster deployed.
    // Kirim denyut pertama segera
    await this.executePulse();

    // Jadwalkan interval berulang di server backend
    const intervalMs = Math.max(1000, Math.round(safeIntervalMinutes * 60 * 1000));
    this.timer = setInterval(() => {
      this.executePulse().catch((err) => {
        console.error("[IoT Simulation Service] Unhandled interval error:", err);
      });
    }, intervalMs);

    // Persist status aktif agar tetap bertahan saat proses server/PM2 direstart
    this.savePersistedState({
      isActive: true,
      isAllDevices: isAll,
      deviceIds: Array.from(this.activeDevices.keys()),
      deviceId: isAll ? undefined : (deviceId || targetDeviceList[0]?.id),
      intervalMinutes: safeIntervalMinutes,
    });

    return this.getStatus();
  }

  /**
   * Menghentikan Background Service Aliran Otomatis Telemetri
   */
  stop(): SimulationState {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.state.isActive = false;

    // Persist status nonaktif ke disk
    this.savePersistedState({
      isActive: false,
      intervalMinutes: this.state.intervalMinutes,
    });

    return this.getStatus();
  }

  /**
   * Menyimpan status aliran simulator ke disk lokal agar tahan restart server/PM2
   */
  private savePersistedState(data: {
    isActive: boolean;
    isAllDevices?: boolean;
    deviceIds?: string[];
    deviceId?: string;
    intervalMinutes: number;
  }) {
    try {
      fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (err: any) {
      console.warn("[IoT Simulation Service] Gagal menyimpan status simulator ke disk:", err?.message);
    }
  }

  /**
   * Memulihkan status aliran simulator dari disk lokal saat server booting
   */
  async restoreFromPersistence(): Promise<void> {
    try {
      if (!fs.existsSync(STATE_FILE_PATH)) {
        return;
      }
      const raw = fs.readFileSync(STATE_FILE_PATH, "utf-8");
      const saved = JSON.parse(raw);
      if (saved && saved.isActive === true) {
        console.log(
          `[IoT Simulation Service] Memulihkan aliran otomatis telemetri (interval: ${saved.intervalMinutes}m)...`
        );
        await this.start({
          deviceId: saved.deviceId,
          deviceIds: saved.isAllDevices ? "all" : saved.deviceIds,
          intervalMinutes: saved.intervalMinutes || 15,
        });
        console.log("[IoT Simulation Service] Aliran otomatis telemetri berhasil direstore dari konfigurasi persisten.");
      }
    } catch (err: any) {
      console.warn("[IoT Simulation Service] Gagal memulihkan status simulator:", err?.message);
    }
  }
}

export const iotSimulationService = new IoTSimulationService();
