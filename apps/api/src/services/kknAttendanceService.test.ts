/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateInZoneDurationMinutes,
  getScheduleTargetDurationMinutes,
  calculateDistance,
  KknAttendanceService,
} from "./kknAttendanceService.js";
import { prisma } from "../lib/prisma.js";
import { configService } from "./configService.js";

vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
      },
      studentKkn: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      studentLocation: {
        create: vi.fn(),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        findMany: vi.fn(),
      },
      schedule: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      activityAttendance: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      pointHistory: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      notification: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => cb(prisma)),
    },
  };
});

vi.mock("./configService.js", () => {
  return {
    configService: {
      getRuleEngineConfigs: vi.fn().mockResolvedValue({
        attendanceMinDurationHours: 4,
        attendanceMinDurationMinutes: 0,
        attendanceMinDurationSeconds: 0,
      }),
      getConfig: vi.fn(),
    },
  };
});

vi.mock("./websocketService.js", () => {
  return {
    websocketService: {
      broadcastStudentLocation: vi.fn(),
      broadcastStudentAttendance: vi.fn(),
      broadcastStudentCheckout: vi.fn(),
    },
  };
});

describe("kknAttendanceService - Auto-Attendance & Duration Verification", () => {
  let service: KknAttendanceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new KknAttendanceService();
  });

  describe("calculateInZoneDurationMinutes helper", () => {
    const geofence = {
      latitude: -6.8915,
      longitude: 107.6107,
      radius: 100,
    };

    it("should return 0 minutes if less than 2 location logs exist", () => {
      const logs = [
        {
          recordedAt: new Date("2026-08-19T08:00:00Z"),
          latitude: -6.8915,
          longitude: 107.6107,
        },
      ];
      const duration = calculateInZoneDurationMinutes(logs, geofence);
      expect(duration).toBe(0);
    });

    it("should accumulate actual minutes between in-zone pings within 5 minutes interval", () => {
      const logs = [
        { recordedAt: new Date("2026-08-19T08:00:00Z"), latitude: -6.8915, longitude: 107.6107 },
        { recordedAt: new Date("2026-08-19T08:15:00Z"), latitude: -6.8915, longitude: 107.6107 },
        { recordedAt: new Date("2026-08-19T08:30:00Z"), latitude: -6.8915, longitude: 107.6107 },
      ];
      // Note: Gap between 08:00 and 08:15 is 15 min (>5 min), so skipped.
      // Gap between 08:15 and 08:30 is 15 min (>5 min), so skipped.
      expect(calculateInZoneDurationMinutes(logs, geofence)).toBe(0);

      const consecutiveLogs = [
        { recordedAt: new Date("2026-08-19T08:00:00Z"), latitude: -6.8915, longitude: 107.6107 },
        { recordedAt: new Date("2026-08-19T08:02:00Z"), latitude: -6.8915, longitude: 107.6107 },
        { recordedAt: new Date("2026-08-19T08:05:00Z"), latitude: -6.8915, longitude: 107.6107 },
      ];
      // 2 min + 3 min = 5 min
      expect(calculateInZoneDurationMinutes(consecutiveLogs, geofence)).toBe(5);
    });

    it("should ignore out-of-zone location points", () => {
      const logs = [
        { recordedAt: new Date("2026-08-19T08:00:00Z"), latitude: -6.8915, longitude: 107.6107 }, // inside
        { recordedAt: new Date("2026-08-19T08:02:00Z"), latitude: -6.9500, longitude: 107.7000 }, // far outside
        { recordedAt: new Date("2026-08-19T08:05:00Z"), latitude: -6.8915, longitude: 107.6107 }, // inside (5 min gap from t1)
      ];
      // Inside points: 08:00 and 08:05 (diff = 5 min)
      expect(calculateInZoneDurationMinutes(logs, geofence)).toBe(5);
    });
  });

  describe("getScheduleTargetDurationMinutes helper", () => {
    it("should prioritize Rule Engine config if set", async () => {
      vi.mocked(configService.getRuleEngineConfigs).mockResolvedValueOnce({
        attendanceMinDurationHours: 4,
        attendanceMinDurationMinutes: 0,
        attendanceMinDurationSeconds: 0,
      } as any);

      const duration = await getScheduleTargetDurationMinutes({ time: "08:00 - 12:00" });
      expect(duration).toBe(240);
    });

    it("should fallback to schedule time range when rule engine is 0", async () => {
      vi.mocked(configService.getRuleEngineConfigs).mockResolvedValueOnce({
        attendanceMinDurationHours: 0,
        attendanceMinDurationMinutes: 0,
        attendanceMinDurationSeconds: 0,
      } as any);

      const duration = await getScheduleTargetDurationMinutes({ time: "08:00 - 10:30" });
      expect(duration).toBe(150);
    });
  });

  describe("updateStudentLocationsBatch - Anti Premature Auto-Attendance", () => {
    const studentId = "mhs-1";
    const scheduleId = "sch-1";

    it("should NOT trigger auto-attendance on first ping and return status LAPANGAN", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: studentId,
        role: { name: "MAHASISWA_KKN" },
      } as any);

      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        userId: studentId,
        kelompokId: "kel-1",
      } as any);

      vi.mocked(prisma.studentLocation.create).mockResolvedValue({
        id: "loc-1",
        studentId,
        latitude: -6.8915,
        longitude: 107.6107,
        recordedAt: new Date(),
      } as any);

      vi.mocked(prisma.schedule.findMany).mockResolvedValue([
        {
          id: scheduleId,
          title: "Kegiatan KKN",
          latitude: -6.8915,
          longitude: 107.6107,
          radius: 150,
          time: "08:00 - 12:00",
          isActive: true,
        } as any,
      ]);

      vi.mocked(prisma.studentLocation.findMany).mockResolvedValue([
        {
          id: "loc-1",
          studentId,
          latitude: -6.8915,
          longitude: 107.6107,
          recordedAt: new Date(),
        } as any,
      ]);

      vi.mocked(prisma.activityAttendance.findUnique).mockResolvedValue(null);

      const recordAttendanceSpy = vi.spyOn(service, "recordAttendance");

      const result = await service.updateStudentLocationsBatch(studentId, [
        { latitude: -6.8915, longitude: 107.6107 },
      ]);

      expect(result.success).toBe(true);
      expect(result.status).toBe("LAPANGAN");
      expect(result.inZoneMinutes).toBe(0);
      expect(result.autoAttendanceTriggered).toEqual([]);
      expect(recordAttendanceSpy).not.toHaveBeenCalled();
    });

    it("should trigger auto-attendance ONLY when accumulated in-zone duration reaches durasiWajibMenit", async () => {
      vi.mocked(configService.getRuleEngineConfigs).mockResolvedValue({
        attendanceMinDurationHours: 1,
        attendanceMinDurationMinutes: 0,
        attendanceMinDurationSeconds: 0,
      } as any);

      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        userId: studentId,
        kelompokId: "kel-1",
      } as any);

      vi.mocked(prisma.studentLocation.create).mockResolvedValue({
        id: "loc-2",
        studentId,
        latitude: -6.8915,
        longitude: 107.6107,
        recordedAt: new Date(),
      } as any);

      vi.mocked(prisma.schedule.findMany).mockResolvedValue([
        {
          id: scheduleId,
          title: "Kegiatan KKN",
          latitude: -6.8915,
          longitude: 107.6107,
          radius: 150,
          time: "08:00 - 09:00",
          isActive: true,
        } as any,
      ]);

      // Simulate 60 minutes of consecutive in-zone logs
      const start = new Date("2026-08-19T08:00:00Z");
      const logs = Array.from({ length: 31 }, (_, i) => ({
        id: `loc-log-${i}`,
        studentId,
        latitude: -6.8915,
        longitude: 107.6107,
        recordedAt: new Date(start.getTime() + i * 2 * 60 * 1000), // Every 2 minutes up to 60 min
      }));

      vi.mocked(prisma.studentLocation.findMany).mockResolvedValue(logs as any);
      vi.mocked(prisma.activityAttendance.findUnique).mockResolvedValue(null);

      const recordAttendanceSpy = vi.spyOn(service, "recordAttendance").mockResolvedValue({
        id: "att-1",
        studentId,
        scheduleId,
        status: "HADIR",
      } as any);

      const result = await service.updateStudentLocationsBatch(studentId, [
        { latitude: -6.8915, longitude: 107.6107 },
      ]);

      expect(result.success).toBe(true);
      expect(result.inZoneMinutes).toBe(60);
      expect(result.autoAttendanceTriggered).toContain(scheduleId);
      expect(recordAttendanceSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId,
          scheduleId,
          method: "OTOMATIS",
        })
      );
    });
  });

  describe("Attendance Points Reward (Check-In & Check-Out)", () => {
    const studentId = "mhs-point-1";
    const scheduleId = "sch-point-1";

    it("should award +10 points when student checks in within valid zone and operational hours", async () => {
      vi.mocked(prisma.schedule.findUnique).mockResolvedValue({
        id: scheduleId,
        title: "Kegiatan Posko KKN",
        latitude: -6.8915,
        longitude: 107.6107,
        radius: 150,
        isActive: true,
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: studentId,
        name: "Mahasiswa KKN",
        studentProfile: { nim: "130121001", kelompok: { dpl: null } },
      } as any);

      vi.mocked(prisma.activityAttendance.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.activityAttendance.create).mockResolvedValue({
        id: "att-rec-1",
        studentId,
        scheduleId,
        status: "HADIR",
        attendedAt: new Date(),
        method: "MANUAL",
      } as any);
      vi.mocked(prisma.pointHistory.create).mockResolvedValue({ id: "pt-att-1" } as any);

      const result = await service.recordAttendance({
        studentId,
        scheduleId,
        latitude: -6.8915,
        longitude: 107.6107,
        method: "MANUAL",
      });

      expect(prisma.pointHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: studentId,
          points: 10,
          kategori: "PARTISIPASI_STREAK",
        }),
      });
      expect(result.status).toBe("HADIR");
    });

    it("should award +10 points when student checks out (kepulangan)", async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      vi.mocked(prisma.activityAttendance.findFirst).mockResolvedValue({
        id: "att-rec-1",
        studentId,
        scheduleId,
        status: "HADIR",
        attendedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        checkOutAt: null,
      } as any);

      vi.mocked(prisma.activityAttendance.update).mockResolvedValue({
        id: "att-rec-1",
        studentId,
        scheduleId,
        status: "SELESAI",
        attendedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        checkOutAt: new Date(),
        schedule: { id: scheduleId, title: "Kegiatan Posko KKN" },
        student: { id: studentId, name: "Mahasiswa KKN", studentProfile: { nim: "130121001" } },
      } as any);

      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.pointHistory.create).mockResolvedValue({ id: "pt-out-1" } as any);

      const result = await service.checkOutAttendance({
        studentId,
        scheduleId,
        latitude: -6.8915,
        longitude: 107.6107,
      });

      expect(result.success).toBe(true);
      expect(prisma.pointHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: studentId,
          points: 10,
          description: expect.stringContaining("(Check-Out)"),
          kategori: "PARTISIPASI_STREAK",
        }),
      });
    });

    it("should NOT duplicate check-out points if already awarded today", async () => {
      vi.mocked(prisma.activityAttendance.findFirst).mockResolvedValue({
        id: "att-rec-1",
        studentId,
        scheduleId,
        status: "SELESAI",
        attendedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        checkOutAt: new Date(),
      } as any);

      vi.mocked(prisma.activityAttendance.update).mockResolvedValue({
        id: "att-rec-1",
        studentId,
        scheduleId,
        status: "SELESAI",
        attendedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        checkOutAt: new Date(),
        schedule: { id: scheduleId, title: "Kegiatan Posko KKN" },
        student: { id: studentId, name: "Mahasiswa KKN", studentProfile: { nim: "130121001" } },
      } as any);

      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue({ id: "pt-already-given" } as any);

      await service.checkOutAttendance({
        studentId,
        scheduleId,
      });

      expect(prisma.pointHistory.create).not.toHaveBeenCalled();
    });
  });
});
