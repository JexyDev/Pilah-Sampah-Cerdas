import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("../lib/prisma.js", () => ({
  prisma: {
    schedule: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    studentKkn: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    kelompokKkn: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("./configService.js", () => ({
  configService: {
    getRuleEngineConfigs: vi.fn().mockResolvedValue({ attendanceGeofenceBufferMeters: 50 }),
  },
}));

vi.mock("./notificationIntegrationService.js", () => ({
  notificationIntegrationService: {
    sendSilentDataPush: vi.fn().mockResolvedValue(undefined),
  },
}));

import { prisma } from "../lib/prisma.js";
import { scheduleService } from "./scheduleService.js";
import { isPolygonEffective } from "./kknAttendanceService.js";

describe("ScheduleService & QC-36 effective_month Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("scheduleService.createSchedule", () => {
    it("should pass effectiveMonth into prisma.schedule.create", async () => {
      const mockSchedule = {
        id: "sch-1",
        title: "Pembersihan Sampah Polygon",
        date: new Date("2026-10-01"),
        category: "Pengangkutan",
        effectiveMonth: "2026-10",
        polygon: [
          [-6.89, 107.61],
          [-6.89, 107.62],
          [-6.90, 107.61],
        ],
        radius: 500,
      };

      (prisma.schedule.create as any).mockResolvedValue(mockSchedule);
      (prisma.studentKkn.findMany as any).mockResolvedValue([]);

      const result = await scheduleService.createSchedule({
        title: "Pembersihan Sampah Polygon",
        date: new Date("2026-10-01"),
        category: "Pengangkutan",
        effectiveMonth: "2026-10",
        polygon: [
          [-6.89, 107.61],
          [-6.89, 107.62],
          [-6.90, 107.61],
        ],
      });

      expect(prisma.schedule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Pembersihan Sampah Polygon",
            effectiveMonth: "2026-10",
          }),
        })
      );
      expect(result.effectiveMonth).toBe("2026-10");
    });
  });

  describe("scheduleService.updateSchedule", () => {
    it("should update effectiveMonth in prisma.schedule.update", async () => {
      const updatedMock = {
        id: "sch-1",
        title: "Jadwal Updated",
        effectiveMonth: "2026-11",
      };

      (prisma.schedule.update as any).mockResolvedValue(updatedMock);

      const result = await scheduleService.updateSchedule("sch-1", {
        effectiveMonth: "2026-11",
      });

      expect(prisma.schedule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sch-1" },
          data: expect.objectContaining({
            effectiveMonth: "2026-11",
          }),
        })
      );
      expect(result.effectiveMonth).toBe("2026-11");
    });

    it("should allow resetting effectiveMonth to null when switched to circle mode", async () => {
      (prisma.schedule.update as any).mockResolvedValue({
        id: "sch-1",
        effectiveMonth: null,
      });

      const result = await scheduleService.updateSchedule("sch-1", {
        effectiveMonth: null,
      });

      expect(prisma.schedule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sch-1" },
          data: expect.objectContaining({
            effectiveMonth: null,
          }),
        })
      );
      expect(result.effectiveMonth).toBeNull();
    });
  });

  describe("isPolygonEffective helper (QC-36 Advance Scheduling)", () => {
    const fixedNowSept = new Date("2026-09-22T02:00:00.000Z"); // September 2026 WIB

    it("should return true when effectiveMonth is not specified (null/undefined/empty)", () => {
      expect(isPolygonEffective(null, fixedNowSept)).toBe(true);
      expect(isPolygonEffective(undefined, fixedNowSept)).toBe(true);
      expect(isPolygonEffective("", fixedNowSept)).toBe(true);
      expect(isPolygonEffective("   ", fixedNowSept)).toBe(true);
    });

    it("should return true when effectiveMonth is the current month or past month", () => {
      expect(isPolygonEffective("2026-09", fixedNowSept)).toBe(true);
      expect(isPolygonEffective("2026-08", fixedNowSept)).toBe(true);
      expect(isPolygonEffective("2025-12", fixedNowSept)).toBe(true);
    });

    it("should return false when effectiveMonth is in the future (advance schedule)", () => {
      expect(isPolygonEffective("2026-10", fixedNowSept)).toBe(false);
      expect(isPolygonEffective("2026-11", fixedNowSept)).toBe(false);
      expect(isPolygonEffective("2027-01", fixedNowSept)).toBe(false);
    });
  });
});
