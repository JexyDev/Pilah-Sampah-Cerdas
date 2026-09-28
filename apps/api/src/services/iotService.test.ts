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

    it("harus melempar error jika perangkat berstatus INACTIVE", async () => {
      (prisma.ioTDevice.findUnique as any).mockResolvedValue({
        id: "dev-1",
        status: IoTDeviceStatus.INACTIVE,
      });

      await expect(
        iotService.ingestReading({
          apiKey: "valid-key-inactive",
          nilaiPpm: 500,
        })
      ).rejects.toThrow("Perangkat IoT saat ini berstatus NON-AKTIF");
    });

    it("harus menyimpan telemetri CH4 dengan statusLevel yang tepat saat data valid", async () => {
      (prisma.ioTDevice.findUnique as any).mockResolvedValue({
        id: "dev-1",
        name: "Node 1",
        nodeCode: "NODE-01",
        locationName: "TPS Sadang Serang",
        status: IoTDeviceStatus.ACTIVE,
        picUserId: null,
      });

      const mockSavedReading = {
        id: "reading-1",
        deviceId: "dev-1",
        nilaiPpm: 450,
        suhu: 28.5,
        kelembaban: 70,
        baterai: 95,
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
    it("harus menghitung total node, status operasional, dan breakdown status gas", async () => {
      (prisma.ioTDevice.count as any)
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(4) // active
        .mockResolvedValueOnce(1) // maintenance
        .mockResolvedValueOnce(0); // inactive
      (prisma.cH4Reading.count as any).mockResolvedValueOnce(120);

      (prisma.ioTDevice.findMany as any).mockResolvedValue([
        { id: "1", readings: [{ statusLevel: CH4StatusLevel.AMAN, nilaiPpm: 300 }] },
        { id: "2", readings: [{ statusLevel: CH4StatusLevel.WASPADA, nilaiPpm: 1500 }] },
        { id: "3", readings: [{ statusLevel: CH4StatusLevel.BAHAYA, nilaiPpm: 5500 }] },
        { id: "4", readings: [] },
      ]);

      const summary = await iotService.getDashboardSummary();

      expect(summary.totalDevices).toBe(5);
      expect(summary.activeDevices).toBe(4);
      expect(summary.maintenanceDevices).toBe(1);
      expect(summary.inactiveDevices).toBe(0);
      expect(summary.totalReadings).toBe(120);
      expect(summary.statusBreakdown).toEqual({
        aman: 1,
        waspada: 1,
        bahaya: 1,
        tanpaData: 1,
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
