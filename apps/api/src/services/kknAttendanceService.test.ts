// @ts-nocheck
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
  parseScheduleTimeString,
  parseScheduleTimeRange,
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
        findFirst: vi.fn(),
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
      studentLeaveRequest: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
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

  describe("parseScheduleTimeString & parseScheduleTimeRange helpers", () => {
    it("should parse standard 24-hour time strings correctly", () => {
      expect(parseScheduleTimeString("08:30")).toEqual([8, 30]);
      expect(parseScheduleTimeString("16.45")).toEqual([16, 45]);
      expect(parseScheduleTimeString("00:00")).toEqual([0, 0]);
    });

    it("should parse 12-hour AM/PM time strings correctly", () => {
      expect(parseScheduleTimeString("08:00 AM")).toEqual([8, 0]);
      expect(parseScheduleTimeString("08:05 AM")).toEqual([8, 5]);
      expect(parseScheduleTimeString("01:30 PM")).toEqual([13, 30]);
      expect(parseScheduleTimeString("12:00 PM")).toEqual([12, 0]);
      expect(parseScheduleTimeString("12:00 AM")).toEqual([0, 0]);
    });

    it("should parse full schedule time ranges with WIB / AM / PM / delimiters", () => {
      const r1 = parseScheduleTimeRange("08:00 AM - 08:05 AM");
      expect(r1.startH).toBe(8);
      expect(r1.startM).toBe(0);
      expect(r1.endH).toBe(8);
      expect(r1.endM).toBe(5);
      expect(r1.startMinutesTotal).toBe(480);
      expect(r1.endMinutesTotal).toBe(485);
      expect(r1.isOvernight).toBe(false);

      const r2 = parseScheduleTimeRange("08.00 WIB - 16.00 WIB");
      expect(r2.startMinutesTotal).toBe(480);
      expect(r2.endMinutesTotal).toBe(960);
      expect(r2.isOvernight).toBe(false);

      const r3 = parseScheduleTimeRange("22:00 - 04:00");
      expect(r3.isOvernight).toBe(true);
    });
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
          time: "00:00 - 23:59",
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
      const data = (result as any).data || result;
      expect(data.status).toBe("LAPANGAN");
      expect(data.inZoneMinutes).toBe(0);
      expect(data.autoAttendanceTriggered).toEqual([]);
      expect(recordAttendanceSpy).not.toHaveBeenCalled();
    });

    it("should calculate in-zone duration accurately and update active attendance record", async () => {
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
          time: "00:00 - 23:59",
          isActive: true,
        } as any,
      ]);

      // Simulate 60 minutes of consecutive in-zone logs
      const start = new Date();
      start.setHours(start.getHours() - 1);
      const logs = Array.from({ length: 31 }, (_, i) => ({
        id: `loc-log-${i}`,
        studentId,
        latitude: -6.8915,
        longitude: 107.6107,
        recordedAt: new Date(start.getTime() + i * 2 * 60 * 1000), // Every 2 minutes up to 60 min
      }));

      vi.mocked(prisma.studentLocation.findMany).mockResolvedValue(logs as any);
      vi.mocked(prisma.activityAttendance.findUnique).mockResolvedValue({
        id: "att-ongoing-1",
        studentId,
        scheduleId,
        status: "BERLANGSUNG",
        attendedAt: start,
        actualInZoneMinutes: 0,
      } as any);
      vi.mocked(prisma.activityAttendance.update).mockResolvedValue({
        id: "att-ongoing-1",
        studentId,
        scheduleId,
        status: "BERLANGSUNG",
        attendedAt: start,
        actualInZoneMinutes: 60,
      } as any);

      const result = await service.updateStudentLocationsBatch(studentId, [
        { latitude: -6.8915, longitude: 107.6107 },
      ]);

      expect(result.success).toBe(true);
      const data = (result as any).data || result;
      expect(data.inZoneMinutes).toBe(60);
      expect(data.status).toBe("LAPANGAN");
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
        time: "00:00 - 23:59",
        isActive: true,
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: studentId,
        name: "Mahasiswa KKN",
        studentProfile: { nim: "130121001", kelompok: { dpl: null } },
      } as any);

      vi.mocked(prisma.activityAttendance.findUnique).mockResolvedValue({
        id: "att-ongoing-1",
        studentId,
        scheduleId,
        status: "BERLANGSUNG",
        attendedAt: new Date(),
      } as any);
      vi.mocked(prisma.activityAttendance.update).mockResolvedValue({
        id: "att-rec-1",
        studentId,
        scheduleId,
        status: "HADIR_MEMENUHI",
        attendedAt: new Date(),
        checkOutAt: new Date(),
        method: "MANUAL",
      } as any);
      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue(null);
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
      expect(result.status).toBe("HADIR_MEMENUHI");
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

    it("should set status to HADIR_MEMENUHI when in-zone duration >= target duration", async () => {
      vi.mocked(prisma.activityAttendance.findFirst).mockResolvedValue({
        id: "att-rec-1",
        studentId,
        scheduleId,
        status: "BERLANGSUNG",
        attendedAt: new Date(Date.now() - 150 * 60 * 1000), // 150 minutes ago
        checkOutAt: null,
      } as any);

      vi.mocked(prisma.schedule.findUnique).mockResolvedValue({
        id: scheduleId,
        title: "Kegiatan Posko KKN",
        time: "08:00 - 10:00 WIB", // 120 minutes target
      } as any);

      vi.mocked(prisma.studentLocation.findMany).mockResolvedValue([]);

      vi.mocked(prisma.activityAttendance.update).mockImplementation(async ({ data }: any) => {
        return {
          id: "att-rec-1",
          studentId,
          scheduleId,
          status: data.status,
          attendedAt: new Date(Date.now() - 150 * 60 * 1000),
          checkOutAt: new Date(),
          schedule: { id: scheduleId, title: "Kegiatan Posko KKN" },
          student: { id: studentId, name: "Mahasiswa KKN", studentProfile: { nim: "130121001" } },
        } as any;
      });

      const result = await service.checkOutAttendance({
        studentId,
        scheduleId,
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe("HADIR_MEMENUHI");
      expect(result.data.statusDisplay).toBe("Hadir & Memenuhi");
      expect(result.data.isMemenuhiDurasi).toBe(true);
    });

    it("should set status to HADIR_TIDAK_MEMENUHI when in-zone duration < target duration", async () => {
      vi.mocked(prisma.activityAttendance.findFirst).mockResolvedValue({
        id: "att-rec-1",
        studentId,
        scheduleId,
        status: "BERLANGSUNG",
        attendedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        checkOutAt: null,
      } as any);

      vi.mocked(prisma.schedule.findUnique).mockResolvedValue({
        id: scheduleId,
        title: "Kegiatan Posko KKN",
        time: "08:00 - 10:00 WIB", // 120 minutes target
      } as any);

      vi.mocked(prisma.studentLocation.findMany).mockResolvedValue([]);

      vi.mocked(prisma.activityAttendance.update).mockImplementation(async ({ data }: any) => {
        return {
          id: "att-rec-1",
          studentId,
          scheduleId,
          status: data.status,
          attendedAt: new Date(Date.now() - 30 * 60 * 1000),
          checkOutAt: new Date(),
          schedule: { id: scheduleId, title: "Kegiatan Posko KKN" },
          student: { id: studentId, name: "Mahasiswa KKN", studentProfile: { nim: "130121001" } },
        } as any;
      });

      const result = await service.checkOutAttendance({
        studentId,
        scheduleId,
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe("HADIR_TIDAK_MEMENUHI");
      expect(result.data.statusDisplay).toBe("Hadir & Tidak Memenuhi");
      expect(result.data.isMemenuhiDurasi).toBe(false);
    });
  });

  describe("Backend SSOT Duration & Standardization (SPPB)", () => {
    const studentId = "mhs-ssot-1";
    const scheduleId = "sch-ssot-1";

    it("should ignore inZoneSeconds / accumulatedDuration from mobile payload in updateStudentLocationsBatch", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: studentId,
        role: { name: "MAHASISWA_KKN" },
      } as any);

      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        userId: studentId,
        kelompokId: "kel-1",
      } as any);

      vi.mocked(prisma.studentLocation.create).mockResolvedValue({
        id: "loc-ssot-1",
        studentId,
        latitude: -6.8915,
        longitude: 107.6107,
        recordedAt: new Date(),
      } as any);

      vi.mocked(prisma.schedule.findMany).mockResolvedValue([
        {
          id: scheduleId,
          title: "Kegiatan Posko KKN",
          latitude: -6.8915,
          longitude: 107.6107,
          radius: 200,
          time: "00:00 - 23:59",
          isActive: true,
        } as any,
      ]);

      // Attended 15 minutes ago
      const attendedAt = new Date(Date.now() - 15 * 60 * 1000);
      vi.mocked(prisma.activityAttendance.findUnique).mockResolvedValue({
        id: "att-ssot-1",
        studentId,
        scheduleId,
        status: "BERLANGSUNG",
        attendedAt,
        actualInZoneMinutes: 0,
        jedaLogs: [],
      } as any);

      let updatedData: any = null;
      vi.mocked(prisma.activityAttendance.update).mockImplementation(async ({ data }: any) => {
        updatedData = data;
        return {
          id: "att-ssot-1",
          studentId,
          scheduleId,
          status: "BERLANGSUNG",
          attendedAt,
          actualInZoneMinutes: data.actualInZoneMinutes,
        } as any;
      });

      // Mobile sends forged 9999 inZoneSeconds (approx 166 minutes)
      const result = await service.updateStudentLocationsBatch(studentId, [
        {
          latitude: -6.8915,
          longitude: 107.6107,
          inZoneSeconds: 9999,
          accumulatedDuration: 9999,
          accumulatedDurationSeconds: 9999,
        } as any,
      ]);

      expect(result.success).toBe(true);
      // Backend calculation for 15 minutes elapsed since attendedAt is 15 minutes
      expect(updatedData.actualInZoneMinutes).toBe(15);
      expect(result.data.actualInZoneMinutes).toBe(15);
      expect(result.data.actualInZoneSeconds).toBe(15 * 60);
    });

    it("should ignore accumulatedDurationSeconds parameter in pingLocation and return standardized response", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: studentId,
        name: "Mahasiswa SSOT",
        role: { name: "MAHASISWA_KKN" },
      } as any);

      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        userId: studentId,
        nim: "130121002",
        jurusan: "Informatika",
        kelompokId: "kel-1",
      } as any);

      vi.mocked(prisma.studentLocation.create).mockResolvedValue({
        id: "loc-ssot-2",
        studentId,
        latitude: -6.8915,
        longitude: 107.6107,
        recordedAt: new Date(),
      } as any);

      vi.mocked(prisma.studentLocation.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.studentLocation.findMany).mockResolvedValue([]);
      vi.mocked(prisma.schedule.findMany).mockResolvedValue([
        {
          id: scheduleId,
          title: "Kegiatan Posko KKN",
          date: new Date(),
          latitude: -6.8915,
          longitude: 107.6107,
          radius: 200,
          time: "00:00 - 23:59",
          isActive: true,
        } as any,
      ]);

      const attendedAt = new Date(Date.now() - 20 * 60 * 1000);
      const mockAtt = {
        id: "att-ssot-2",
        studentId,
        scheduleId,
        status: "BERLANGSUNG",
        attendedAt,
        actualInZoneMinutes: 0,
        jedaLogs: [],
      };
      vi.mocked(prisma.activityAttendance.findUnique).mockResolvedValue(mockAtt as any);
      vi.mocked(prisma.activityAttendance.findFirst).mockResolvedValue(mockAtt as any);

      let updatedData: any = null;
      vi.mocked(prisma.activityAttendance.update).mockImplementation(async ({ data }: any) => {
        updatedData = data;
        return {
          id: "att-ssot-2",
          studentId,
          scheduleId,
          status: "BERLANGSUNG",
          attendedAt,
          actualInZoneMinutes: data.actualInZoneMinutes,
        } as any;
      });

      // Mobile passes 10000 seconds
      const result = await service.pingLocation(studentId, -6.8915, 107.6107, 10000);

      expect(result.success).toBe(true);
      expect(updatedData.actualInZoneMinutes).toBe(20);
      expect(result.data.actualInZoneMinutes).toBe(20);
      // actualInZoneSeconds sekarang presisi detik dari calculateLiveInZoneSeconds(),
      // bukan lagi menit * 60. Nilai sekitar 1200 detik (20 menit) dengan toleransi
      // beberapa detik untuk waktu eksekusi test.
      expect(result.data.actualInZoneSeconds).toBeGreaterThanOrEqual(20 * 60);
      expect(result.data.actualInZoneSeconds).toBeLessThan(20 * 60 + 30);
      expect(result.data.inZoneMinutes).toBe(20);
    });
  });

  describe("getKegiatanAktif", () => {
    it("should return only today's schedule and filter out yesterday finished schedule", async () => {
      const studentId = "student-test-active";
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        userId: studentId,
        nim: "12345678",
        kelompokId: "kelompok-1",
      } as any);

      const now = new Date();
      const nowWib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      const todayStr = nowWib.toISOString().slice(0, 10);
      const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      vi.mocked(prisma.schedule.findMany).mockResolvedValue([
        {
          id: "sch-today",
          title: "Kegiatan Harian Posko KKN Hari Ini",
          date: now,
          time: "08:00 - 16:00",
          latitude: -6.8915,
          longitude: 107.6107,
          radius: 200,
          isActive: true,
          kelompok: { poskoKkn: null },
          attendances: [],
          createdAt: new Date(),
        } as any,
        {
          id: "sch-yesterday",
          title: "Kegiatan Harian Posko KKN Kemarin",
          date: yesterdayDate,
          time: "08:00 - 16:00",
          latitude: -6.8915,
          longitude: 107.6107,
          radius: 200,
          isActive: true,
          kelompok: { poskoKkn: null },
          attendances: [],
          createdAt: yesterdayDate,
        } as any,
      ]);

      const result = await service.getKegiatanAktif(studentId);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe("sch-today");
      expect(result[0].tanggal).toBe(todayStr);
      expect(result[0].status).toBe("AKTIF");
    });
  });
});

