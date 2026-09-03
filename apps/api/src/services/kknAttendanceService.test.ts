/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateInZoneDurationMinutes,
  calculateLiveInZoneMinutes,
  calculateTotalJedaMinutes,
  formatDurasiMenitIndo,
  getScheduleTargetDurationMinutes,
  parseScheduleTimeString,
  parseScheduleTimeRange,
  KknAttendanceService,
} from "./kknAttendanceService.js";
import { prisma } from "../lib/prisma.js";
import { configService } from "./configService.js";
import { smartZoneService } from "./smartZoneService.js";

vi.mock("./smartZoneService.js", () => {
  return {
    smartZoneService: {
      isStudentInGroupZone: vi.fn().mockResolvedValue({
        isInside: false,
        matchedPosko: null,
        matchedPoskoId: null,
        matchedMethod: "NONE",
        distanceToNearest: 9999,
        nearestPoskoName: null,
        allPoskos: [],
        autoPolygonActive: false,
      }),
      updateGroupAutoPolygon: vi.fn().mockResolvedValue(undefined),
    },
  };
});

vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
      },
      studentKkn: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
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
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        count: vi.fn(),
      },
      poskoKkn: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      poskoKknMulti: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
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
      presensiMandiri: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      logbookKkn: {
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
      isDateKknHoliday: vi.fn().mockResolvedValue({ isHoliday: false }),
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
        { recordedAt: new Date("2026-08-19T08:02:00Z"), latitude: -6.95, longitude: 107.7 }, // far outside
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

      (prisma.activityAttendance.update as any).mockImplementation(async ({ data }: any) => {
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

      (prisma.activityAttendance.update as any).mockImplementation(async ({ data }: any) => {
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
      (prisma.activityAttendance.update as any).mockImplementation(async ({ data }: any) => {
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
      (prisma.activityAttendance.update as any).mockImplementation(async ({ data }: any) => {
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

  describe("Auto-Pause & Auto-Resume Geofence", () => {
    const studentId = "mhs-autoresume-1";
    const scheduleId = "sch-autoresume-1";

    it("should auto-resume when student returns inside zone after auto-pause (autoTriggered: true)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: studentId,
        name: "Mahasiswa AutoResume",
        role: { name: "MAHASISWA_KKN" },
      } as any);

      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        userId: studentId,
        nim: "130121003",
        jurusan: "Informatika",
        kelompokId: "kel-1",
      } as any);

      vi.mocked(prisma.studentLocation.create).mockResolvedValue({
        id: "loc-ar-1",
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

      const attendedAt = new Date(Date.now() - 30 * 60 * 1000);
      const mockAtt = {
        id: "att-ar-1",
        studentId,
        scheduleId,
        status: "TERJEDA",
        attendedAt,
        actualInZoneMinutes: 10,
        jedaLogs: [
          {
            alasan: "Keluar Zona Geofence (Otomatis)",
            waktuJeda: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            durasiSebelumJedaMenit: 10,
            autoTriggered: true,
          },
        ],
      };
      vi.mocked(prisma.activityAttendance.findUnique).mockResolvedValue(mockAtt as any);
      vi.mocked(prisma.activityAttendance.findFirst).mockResolvedValue({
        ...mockAtt,
        status: "BERLANGSUNG",
      } as any);

      const updates: any[] = [];
      (prisma.activityAttendance.update as any).mockImplementation(async ({ data }: any) => {
        updates.push(data);
        return {
          ...mockAtt,
          ...data,
        } as any;
      });

      // Ping inside the geofence radius
      const result = await service.pingLocation(studentId, -6.8915, 107.6107);

      expect(result.success).toBe(true);
      // Verify that status was updated to BERLANGSUNG and waktuResume was set
      const resumeUpdate = updates.find((u) => u.status === "BERLANGSUNG");
      expect(resumeUpdate).toBeDefined();
      expect(resumeUpdate.jedaLogs[0].waktuResume).toBeDefined();
      expect(mockAtt.status).toBe("BERLANGSUNG");
    });

    it("should NOT auto-resume when student is TERJEDA manually by user (autoTriggered: false/undefined)", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: studentId,
        name: "Mahasiswa ManualPause",
        role: { name: "MAHASISWA_KKN" },
      } as any);

      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        userId: studentId,
        nim: "130121003",
        jurusan: "Informatika",
        kelompokId: "kel-1",
      } as any);

      vi.mocked(prisma.studentLocation.create).mockResolvedValue({
        id: "loc-ar-2",
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

      const attendedAt = new Date(Date.now() - 30 * 60 * 1000);
      const mockAtt = {
        id: "att-ar-2",
        studentId,
        scheduleId,
        status: "TERJEDA",
        attendedAt,
        actualInZoneMinutes: 10,
        jedaLogs: [
          {
            alasan: "Istirahat Makan",
            waktuJeda: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            durasiSebelumJedaMenit: 10,
            // manual pause does not have autoTriggered: true
          },
        ],
      };
      vi.mocked(prisma.activityAttendance.findUnique).mockResolvedValue(mockAtt as any);
      vi.mocked(prisma.activityAttendance.findFirst).mockResolvedValue(mockAtt as any);

      const updates: any[] = [];
      (prisma.activityAttendance.update as any).mockImplementation(async ({ data }: any) => {
        updates.push(data);
        return {
          ...mockAtt,
          ...data,
        } as any;
      });

      // Ping inside the geofence radius
      const result = await service.pingLocation(studentId, -6.8915, 107.6107);

      expect(result.success).toBe(true);
      // Status should remain TERJEDA
      const resumeUpdate = updates.find((u) => u.status === "BERLANGSUNG");
      expect(resumeUpdate).toBeUndefined();
      expect(mockAtt.status).toBe("TERJEDA");
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
          time: "00:00 - 23:59",
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

    it("should return TIDAK_ADA_KEGIATAN status and skip metadata when activity is skipped", async () => {
      const studentId = "student-test-skip";
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        userId: studentId,
        nim: "12345678",
        kelompokId: "kelompok-1",
      } as any);

      const now = new Date();
      vi.mocked(prisma.schedule.findMany).mockResolvedValue([
        {
          id: "sch-skipped",
          title: "Kegiatan Harian Posko KKN Libur",
          date: now,
          time: "08:00 - 16:00",
          latitude: -6.8915,
          longitude: 107.6107,
          radius: 200,
          isActive: true,
          kelompok: { poskoKkn: null },
          attendances: [
            {
              id: "att-skip-1",
              studentId,
              scheduleId: "sch-skipped",
              status: "TIDAK_ADA_KEGIATAN",
              deskripsiKegiatan: "Libur nasional",
              attendedAt: now,
              jedaLogs: {
                skippedBy: "dpl-user-id",
                skippedAt: now.toISOString(),
                alasan: "Libur nasional",
              },
            },
          ],
          createdAt: now,
        } as any,
      ]);

      const result = await service.getKegiatanAktif(studentId);

      expect(result.length).toBe(1);
      expect(result[0].statusKehadiran).toBe("TIDAK_ADA_KEGIATAN");
      expect(result[0].statusDisplay).toBe("Tidak Ada Kegiatan");
      expect(result[0].keteranganSkip).toBe("Libur nasional");
      expect(result[0].skippedBy).toBe("dpl-user-id");
    });
  });

  describe("skipKegiatan", () => {
    const scheduleId = "sch-test-123";
    const kelompokId = "kelompok-kkn-1";

    it("should allow DPL to skip kegiatan and bulk update attendances for all group students", async () => {
      const dplUserId = "dpl-user-1";
      vi.mocked(prisma.schedule.findUnique).mockResolvedValue({
        id: scheduleId,
        title: "Kegiatan Harian KKN",
        kelompokId,
        latitude: -6.8915,
        longitude: 107.6107,
        kelompok: {
          id: kelompokId,
          dplId: dplUserId,
          students: [{ userId: "student-1" }, { userId: "student-2" }],
        },
        attendances: [],
      } as any);

      vi.mocked(prisma.studentKkn.findMany).mockResolvedValue([
        { userId: "student-1" },
        { userId: "student-2" },
      ] as any);

      vi.mocked(prisma.activityAttendance.upsert).mockResolvedValue({} as any);

      const result = await service.skipKegiatan(dplUserId, "DPL", scheduleId, {
        alasan: "Pembersihan posko mandiri",
      });

      expect(result.kegiatanId).toBe(scheduleId);
      expect(result.statusKegiatan).toBe("TIDAK_ADA_KEGIATAN");
      expect(result.totalMahasiswaTerdampak).toBe(2);
      expect(result.alasan).toBe("Pembersihan posko mandiri");
      expect(result.ditandaiOleh).toBe(dplUserId);
      expect(prisma.activityAttendance.upsert).toHaveBeenCalledTimes(2);
    });

    it("should allow Ketua Kelompok (isKetua = true) to skip kegiatan for their own group", async () => {
      const ketuaUserId = "student-ketua-1";
      vi.mocked(prisma.schedule.findUnique).mockResolvedValue({
        id: scheduleId,
        title: "Kegiatan Harian KKN",
        kelompokId,
        latitude: -6.8915,
        longitude: 107.6107,
        kelompok: {
          id: kelompokId,
          dplId: "dpl-1",
        },
        attendances: [],
      } as any);

      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        userId: ketuaUserId,
        isKetua: true,
        kelompokId,
      } as any);

      vi.mocked(prisma.studentKkn.findMany).mockResolvedValue([
        { userId: ketuaUserId },
        { userId: "student-member-2" },
      ] as any);

      vi.mocked(prisma.activityAttendance.upsert).mockResolvedValue({} as any);

      const result = await service.skipKegiatan(ketuaUserId, "MAHASISWA_KKN", scheduleId, {
        alasan: "Koordinasi eksternal",
      });

      expect(result.statusKegiatan).toBe("TIDAK_ADA_KEGIATAN");
      expect(result.totalMahasiswaTerdampak).toBe(2);
    });

    it("should reject regular student (isKetua = false) with FORBIDDEN", async () => {
      const regularUserId = "student-regular-1";
      vi.mocked(prisma.schedule.findUnique).mockResolvedValue({
        id: scheduleId,
        title: "Kegiatan Harian KKN",
        kelompokId,
        attendances: [],
      } as any);

      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        userId: regularUserId,
        isKetua: false,
        kelompokId,
      } as any);

      await expect(
        service.skipKegiatan(regularUserId, "MAHASISWA_KKN", scheduleId, {
          alasan: "Saya mau libur",
        })
      ).rejects.toThrow("FORBIDDEN: Anda tidak memiliki izin untuk melewati kegiatan ini.");
    });

    it("should reject skip if kegiatan is already BERLANGSUNG with CONFLICT", async () => {
      const dplUserId = "dpl-user-1";
      vi.mocked(prisma.schedule.findUnique).mockResolvedValue({
        id: scheduleId,
        title: "Kegiatan Harian KKN",
        kelompokId,
        kelompok: {
          id: kelompokId,
          dplId: dplUserId,
        },
        attendances: [
          {
            id: "att-1",
            studentId: "student-1",
            status: "BERLANGSUNG",
          },
        ],
      } as any);

      await expect(
        service.skipKegiatan(dplUserId, "DPL", scheduleId, {
          alasan: "Skip mendadak",
        })
      ).rejects.toThrow("CONFLICT: Tidak dapat skip kegiatan yang sudah dimulai.");
    });
  });

  describe("calculateLiveInZoneMinutes & calculateLiveInZoneSeconds", () => {
    it("should return 0 minutes for leave/sakit/izin/alpa status", () => {
      const result = calculateLiveInZoneMinutes({
        attendedAt: new Date(),
        status: "SAKIT",
      });
      expect(result).toBe(0);
    });

    it("should calculate correct live minutes without compounding inflation on resume", () => {
      // Attended 30 minutes ago, paused for 5 mins, resumed 10 minutes ago
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      const result = calculateLiveInZoneMinutes({
        attendedAt: thirtyMinutesAgo,
        status: "BERLANGSUNG",
        actualInZoneMinutes: 480, // Even if DB had corrupted 480
        jedaLogs: [
          {
            waktuJeda: fifteenMinutesAgo.toISOString(),
            durasiSebelumJedaMenit: 15,
          },
          {
            waktuResume: tenMinutesAgo.toISOString(),
            durasiSebelumResumeMenit: 15,
          },
        ],
      });

      // 15 mins before jeda + 10 mins elapsed since resume = 25 mins
      expect(result).toBe(25);
    });
  });

  describe("autoCheckOutEndedSchedules", () => {
    it("should skip auto-checkout if attendance session started less than 15 minutes ago", async () => {
      const checkOutSpy = vi.spyOn(service, "checkOutAttendance").mockResolvedValue({} as any);

      // Student attended 5 minutes ago
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      (prisma.activityAttendance.findMany as any) = vi.fn().mockResolvedValue([
        {
          id: "att-recent-1",
          studentId: "student-1",
          scheduleId: "sched-1",
          status: "BERLANGSUNG",
          attendedAt: fiveMinutesAgo,
          schedule: {
            id: "sched-1",
            title: "Kegiatan Pagi",
            time: "07:00 - 08:00",
            date: new Date(),
          },
          student: {
            name: "Muhammad Rizqi",
          },
        },
      ]);

      await service.autoCheckOutEndedSchedules();

      expect(checkOutSpy).not.toHaveBeenCalled();
    });

    it("should skip auto-checkout if schedule time range is invalid or overnight", async () => {
      const checkOutSpy = vi.spyOn(service, "checkOutAttendance").mockResolvedValue({} as any);

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      (prisma.activityAttendance.findMany as any) = vi.fn().mockResolvedValue([
        {
          id: "att-invalid-range",
          studentId: "student-1",
          scheduleId: "sched-2",
          status: "BERLANGSUNG",
          attendedAt: oneHourAgo,
          schedule: {
            id: "sched-2",
            title: "Kegiatan Format Salah",
            time: "08:00 - 08:00", // start === end -> invalid / overnight
            date: new Date(),
          },
          student: {
            name: "Muhammad Rizqi",
          },
        },
      ]);

      await service.autoCheckOutEndedSchedules();

      expect(checkOutSpy).not.toHaveBeenCalled();
    });
  });

  describe("calculateTotalJedaMinutes & formatDurasiMenitIndo", () => {
    it("should calculate total jeda minutes from jedaLogs array", () => {
      const att = {
        attendedAt: new Date("2026-09-01T08:00:00Z"),
        checkOutAt: new Date("2026-09-01T16:00:00Z"),
        actualInZoneMinutes: 420,
        jedaLogs: [
          {
            waktuJeda: "2026-09-01T10:00:00Z",
            waktuResume: "2026-09-01T10:30:00Z",
          },
          {
            waktuJeda: "2026-09-01T12:00:00Z",
            waktuResume: "2026-09-01T12:30:00Z",
          },
        ],
      };

      const jeda = calculateTotalJedaMinutes(att);
      expect(jeda).toBe(60); // 30 mins + 30 mins
      expect(formatDurasiMenitIndo(jeda)).toBe("1 Jam");
    });

    it("should format minutes cleanly in Indonesian", () => {
      expect(formatDurasiMenitIndo(0)).toBe("0 Menit");
      expect(formatDurasiMenitIndo(45)).toBe("45 Menit");
      expect(formatDurasiMenitIndo(60)).toBe("1 Jam");
      expect(formatDurasiMenitIndo(135)).toBe("2 Jam 15 Menit");
    });

    it("should return 0 jeda for permission or sick leaves", () => {
      const att = {
        attendedAt: new Date("2026-09-01T08:00:00Z"),
        status: "IZIN",
        jedaLogs: [{ waktuJeda: "2026-09-01T08:30:00Z", waktuResume: "2026-09-01T09:00:00Z" }],
      };
      expect(calculateTotalJedaMinutes(att)).toBe(0);
    });
  });

  describe("mulaiKegiatan - Multi-Posko & Geofence Fallback", () => {
    const studentUserId = "mhs-multiposko-1";
    const scheduleId = "sch-multiposko-1";
    const kelompokId = "kel-multiposko-1";

    const baseSchedule = {
      id: scheduleId,
      title: "Kegiatan Harian KKN",
      date: new Date(),
      time: "00:00 - 23:59",
      latitude: -6.8915,
      longitude: 107.6107,
      radius: 100,
      isActive: true,
      kelompokId,
    };

    const baseStudent = {
      userId: studentUserId,
      nim: "130121099",
      jurusan: "Informatika",
      kelompokId,
      user: {
        id: studentUserId,
        name: "Mahasiswa Multi Posko",
        phone: "08123456789",
      },
    };

    beforeEach(() => {
      vi.mocked(prisma.schedule.findUnique).mockResolvedValue(baseSchedule as any);
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue(baseStudent as any);
      vi.mocked(prisma.poskoKkn.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.activityAttendance.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.activityAttendance.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.activityAttendance.upsert).mockResolvedValue({
        id: "att-created-1",
        studentId: studentUserId,
        scheduleId,
        status: "BERLANGSUNG",
        attendedAt: new Date(),
      } as any);
      vi.mocked(prisma.studentLocation.create).mockResolvedValue({ id: "loc-1" } as any);
    });

    it("should succeed when student starts kegiatan inside primary posko geofence", async () => {
      const result = await service.mulaiKegiatan(studentUserId, scheduleId, {
        latitude: -6.8915,
        longitude: 107.6107,
        deviceInfo: "Android 14",
      });

      expect(result).toBeDefined();
      expect(result.attendanceStatus).toBe("BERLANGSUNG");
      expect(prisma.activityAttendance.upsert).toHaveBeenCalled();
    });

    it("should succeed with SmartZone fallback when student is at alternative multi-posko", async () => {
      // Koordinat di posko alternatif (misal 1 km dari posko utama)
      const altLat = -6.9;
      const altLng = 107.62;

      vi.mocked(smartZoneService.isStudentInGroupZone).mockResolvedValueOnce({
        isInside: true,
        matchedPosko: "Posko Cabang RW 05",
        matchedPoskoId: "posko-cabang-5",
        matchedMethod: "POSKO_MULTI",
        distanceToNearest: 10,
        nearestPoskoName: "Posko Cabang RW 05",
        allPoskos: [],
        autoPolygonActive: false,
      });

      const result = await service.mulaiKegiatan(studentUserId, scheduleId, {
        latitude: altLat,
        longitude: altLng,
        poskoId: "posko-cabang-5",
        deskripsiKegiatan: "Mulai piket posko alternatif",
      });

      expect(result).toBeDefined();
      expect(result.attendanceStatus).toBe("BERLANGSUNG");
      expect(smartZoneService.isStudentInGroupZone).toHaveBeenCalledWith(
        altLat,
        altLng,
        kelompokId,
        expect.any(Number)
      );
      expect(prisma.activityAttendance.upsert).toHaveBeenCalled();
    });

    it("should throw OUT_OF_GEOFENCE when student is outside primary posko and outside all multi-poskos", async () => {
      const farLat = -6.99;
      const farLng = 107.75;

      vi.mocked(smartZoneService.isStudentInGroupZone).mockResolvedValueOnce({
        isInside: false,
        matchedPosko: null,
        matchedPoskoId: null,
        matchedMethod: "NONE",
        distanceToNearest: 15000,
        nearestPoskoName: "Posko Utama",
        allPoskos: [],
        autoPolygonActive: false,
      });

      await expect(
        service.mulaiKegiatan(studentUserId, scheduleId, {
          latitude: farLat,
          longitude: farLng,
        })
      ).rejects.toThrow(/OUT_OF_GEOFENCE/);
    });
  });

  describe("processWeekdayAutoAlpha", () => {
    it("should bypass auto-alpha when date is Saturday or Sunday (Weekend)", async () => {
      // 2026-09-06 is Sunday
      const result = await service.processWeekdayAutoAlpha("2026-09-06");
      expect(result.success).toBe(true);
      expect(result.isWeekday).toBe(false);
      expect(result.totalMarkedAlpha).toBe(0);
      expect(result.reason).toContain("Akhir pekan");
    });

    it("should mark student as ALPA on a weekday when there is no activity, leave, or logbook", async () => {
      // 2026-09-01 is Tuesday (Weekday)
      const targetDate = "2026-09-01";
      const schedId = "sch-weekday-1";
      const studentId = "student-alpha-1";

      vi.mocked(prisma.schedule.findMany).mockResolvedValueOnce([
        {
          id: schedId,
          title: "Kegiatan Posko KKN Kelompok 1",
          latitude: -6.8915,
          longitude: 107.6107,
          isActive: true,
          attendances: [],
          kelompok: {
            id: "kel-1",
            name: "Kelompok 1",
            students: [{ userId: studentId, user: { id: studentId, name: "Mahasiswa Alpha" } }],
          },
        } as any,
      ]);

      vi.mocked(prisma.activityAttendance.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.presensiMandiri.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.studentLeaveRequest.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.logbookKkn.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.activityAttendance.upsert).mockResolvedValue({ id: "att-alpa-1" } as any);

      const result = await service.processWeekdayAutoAlpha(targetDate);
      expect(result.success).toBe(true);
      expect(result.isWeekday).toBe(true);
      expect(result.totalMarkedAlpha).toBe(1);
      expect(prisma.activityAttendance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            studentId_scheduleId: {
              studentId,
              scheduleId: schedId,
            },
          },
          create: expect.objectContaining({
            status: "ALPA",
            method: "ALPA_AUTO",
          }),
        })
      );
    });

    it("should bypass student when student submitted a logbook on that weekday", async () => {
      const targetDate = "2026-09-01";
      const schedId = "sch-weekday-2";
      const studentId = "student-logbook-1";

      vi.mocked(prisma.schedule.findMany).mockResolvedValueOnce([
        {
          id: schedId,
          title: "Kegiatan Posko KKN Kelompok 2",
          latitude: -6.8915,
          longitude: 107.6107,
          isActive: true,
          attendances: [],
          kelompok: {
            id: "kel-2",
            name: "Kelompok 2",
            students: [{ userId: studentId, user: { id: studentId, name: "Mahasiswa Logbook" } }],
          },
        } as any,
      ]);

      vi.mocked(prisma.activityAttendance.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.presensiMandiri.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.studentLeaveRequest.findFirst).mockResolvedValue(null);
      // Student has logbook:
      vi.mocked(prisma.logbookKkn.findFirst).mockResolvedValueOnce({
        id: "logbook-1",
        penulisId: studentId,
      } as any);

      const result = await service.processWeekdayAutoAlpha(targetDate);
      expect(result.success).toBe(true);
      expect(result.isWeekday).toBe(true);
      expect(result.totalMarkedAlpha).toBe(0);
      expect(result.totalBypassed).toBe(1);
    });
  });

  describe("getLaporanPresensi - Percentage Capping", () => {
    it("should cap rasioKehadiran at 100% even when actual minutes exceed target duration (e.g. 480 mins vs 240 mins target)", async () => {
      const studentId = "student-cap-1";
      vi.mocked(prisma.activityAttendance.count).mockResolvedValueOnce(1);
      vi.mocked(prisma.activityAttendance.findMany).mockResolvedValueOnce([
        {
          id: "att-cap-1",
          studentId,
          scheduleId: "sch-1",
          status: "HADIR_MEMENUHI",
          actualInZoneMinutes: 480, // 8 hours (double standard 4 hours target)
          attendedAt: new Date("2026-09-02T08:00:00+07:00"),
          checkOutAt: new Date("2026-09-02T16:00:00+07:00"),
          jedaLogs: [],
          schedule: {
            id: "sch-1",
            title: "Kegiatan Posko 1",
            date: new Date("2026-09-02"),
            time: "08:00 - 16:00",
            kelompok: { id: "kel-1", name: "Kelompok 1", kelurahan: "Dago" },
          },
          student: {
            id: studentId,
            name: "Mahasiswa Rajin",
            studentProfile: {
              nim: "12345678",
              jurusan: "Teknik Informatika",
              isKetua: false,
              kelompok: {
                id: "kel-1",
                name: "Kelompok 1",
                kelurahan: "Dago",
                dpl: { id: "dpl-1", name: "DPL 1" },
              },
            },
          },
        } as any,
      ]);
      vi.mocked(prisma.activityAttendance.findMany).mockResolvedValueOnce([]);

      const report = await service.getLaporanPresensi({
        kelompokId: "kel-1",
        startDate: "2026-09-02",
        endDate: "2026-09-02",
      });

      expect(report.items).toHaveLength(1);
      expect(report.items[0].durasiAktualMenit).toBe(480);
      expect(report.items[0].targetMinMenit).toBe(60);
      // Rasio Kehadiran MUST be capped at 100.0% instead of 800.0%
      expect(report.items[0].rasioKehadiran).toBe(100);
    });
  });
});

