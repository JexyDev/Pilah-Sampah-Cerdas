import { describe, it, expect, vi, beforeEach } from "vitest";
import { iotService } from "./iotService.js";
import { prisma } from "../lib/prisma.js";
import { CH4StatusLevel, IoTDeviceStatus } from "@prisma/client";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    ioTDevice: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    ioTSystemConfig: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    cH4Reading: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    kelurahan: {
      findUnique: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    notificationLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("./notificationIntegrationService.js", () => ({
  notificationIntegrationService: {
    sendToUsers: vi.fn().mockResolvedValue([]),
  },
}));

describe("iotService - Manajemen IoT & Sensor Metana (CH4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma as any).ioTSystemConfig.findFirst.mockResolvedValue({
      id: "config-1",
      ch4WarningThreshold: 1000,
      ch4DangerThreshold: 5000,
      heartbeatTimeoutMinutes: 10,
      isLiveStreamingActive: false,
    });
  });

  describe("calculateStatusLevel", () => {
    it("harus mengembalikan AMAN jika PPM di bawah 1.000", () => {
      expect(iotService.calculateStatusLevel(0)).toBe(CH4StatusLevel.AMAN);
      expect(iotService.calculateStatusLevel(450)).toBe(CH4StatusLevel.AMAN);
      expect(iotService.calculateStatusLevel(999.99)).toBe(CH4StatusLevel.AMAN);
    });

    it("harus mengembalikan WASPADA jika PPM antara 1.000 hingga 4.999", () => {
      expect(iotService.calculateStatusLevel(1000)).toBe(CH4StatusLevel.WASPADA);
      expect(iotService.calculateStatusLevel(2500)).toBe(CH4StatusLevel.WASPADA);
      expect(iotService.calculateStatusLevel(4999.99)).toBe(CH4StatusLevel.WASPADA);
    });

    it("harus mengembalikan BAHAYA jika PPM sama dengan atau di atas 5.000", () => {
      expect(iotService.calculateStatusLevel(5000)).toBe(CH4StatusLevel.BAHAYA);
      expect(iotService.calculateStatusLevel(7500.5)).toBe(CH4StatusLevel.BAHAYA);
      expect(iotService.calculateStatusLevel(20000)).toBe(CH4StatusLevel.BAHAYA);
    });
  });

  describe("ingestReading", () => {
    it("harus melempar error jika apiKey tidak valid atau perangkat tidak terdaftar", async () => {
      (prisma.ioTDevice.findUnique as any).mockResolvedValue(null);

      await expect(
        iotService.ingestReading({
          apiKey: "invalid-key",
          nilaiPpm: 500,
        })
      ).rejects.toThrow("Perangkat IoT tidak terdaftar");
    });

    it("harus otomatis mengaktifkan status perangkat menjadi ACTIVE saat menerima payload", async () => {
      (prisma.ioTDevice.findUnique as any).mockResolvedValue({
        id: "dev-1",
        status: IoTDeviceStatus.INACTIVE,
        useSensorGps: true,
      });

      (prisma.cH4Reading.create as any).mockResolvedValue({
        id: "reading-1",
        deviceId: "dev-1",
        nilaiPpm: 500,
      });

      await iotService.ingestReading({
        apiKey: "valid-key-inactive",
        nilaiPpm: 500,
      });

      expect(prisma.ioTDevice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "dev-1" },
          data: expect.objectContaining({
            status: IoTDeviceStatus.ACTIVE,
          }),
        })
      );
    });

    it("harus menyimpan telemetri CH4 dengan statusLevel yang tepat saat data valid", async () => {
      (prisma.ioTDevice.findUnique as any).mockResolvedValue({
        id: "dev-1",
        name: "Node 1",
        nodeCode: "NODE-01",
        locationName: "TPS Sadang Serang",
        status: IoTDeviceStatus.ACTIVE,
      });

      const mockSavedReading = {
        id: "reading-1",
        deviceId: "dev-1",
        nilaiPpm: 450,
        suhu: 28.5,
        kelembaban: 70,
        baterai: 95,
        latitude: null,
        longitude: null,
        rssi: null,
        statusLevel: CH4StatusLevel.AMAN,
        timestamp: new Date(),
        device: {
          id: "dev-1",
          name: "Node 1",
          nodeCode: "NODE-01",
          locationName: "TPS Sadang Serang",
          status: IoTDeviceStatus.ACTIVE,
        },
      };

      (prisma.cH4Reading.create as any).mockResolvedValue(mockSavedReading);

      const result = await iotService.ingestReading({
        apiKey: "valid-key",
        nilaiPpm: 450,
        suhu: 28.5,
        kelembaban: 70,
        baterai: 95,
      });

      expect(result).toEqual(mockSavedReading);
      expect(prisma.cH4Reading.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deviceId: "dev-1",
            nilaiPpm: 450,
            suhu: 28.5,
            kelembaban: 70,
            baterai: 95,
            statusLevel: CH4StatusLevel.AMAN,
          }),
        })
      );
    });
  });

  describe("getDashboardSummary", () => {
    it("harus menghitung KPI perangkat dan ringkasan telemetri", async () => {
      (prisma.cH4Reading.findMany as any).mockResolvedValue([]);
      (prisma.ioTDevice.findMany as any).mockResolvedValue([
        {
          id: "1",
          status: IoTDeviceStatus.ACTIVE,
          lastSeenAt: new Date(),
          readings: [{ statusLevel: CH4StatusLevel.AMAN, nilaiPpm: 300, timestamp: new Date() }],
        },
        {
          id: "2",
          status: IoTDeviceStatus.ACTIVE,
          lastSeenAt: new Date(),
          readings: [{ statusLevel: CH4StatusLevel.WASPADA, nilaiPpm: 1500, timestamp: new Date() }],
        },
        {
          id: "3",
          status: IoTDeviceStatus.INACTIVE,
          lastSeenAt: null,
          readings: [],
        },
      ]);

      const summary = await iotService.getDashboardSummary();

      expect(summary.totalDevices).toBe(3);
      expect(summary.activeDevices).toBe(2);
      expect(summary.offlineDevices).toBe(1);
      expect(summary.kpi).toEqual({
        totalDevices: 3,
        activeDevices: 2,
        inactiveDevices: 1,
        warningDevices: 1,
      });
    });
  });

  describe("cleanupOldReadings", () => {
    it("harus menghapus data pembacaan yang lebih tua dari batas hari yang ditentukan", async () => {
      (prisma.cH4Reading.deleteMany as any).mockResolvedValue({ count: 42 });

      const result = await iotService.cleanupOldReadings(30);

      expect(result.deletedCount).toBe(42);
      expect(prisma.cH4Reading.deleteMany).toHaveBeenCalledWith({
        where: {
          timestamp: { lt: expect.any(Date) },
        },
      });
    });
  });
});
