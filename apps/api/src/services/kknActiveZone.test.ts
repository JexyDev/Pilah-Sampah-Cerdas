import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("../lib/prisma.js", () => ({
  prisma: {
    studentKkn: {
      findUnique: vi.fn(),
    },
    studentLeaveRequest: {
      findFirst: vi.fn(),
    },
    activityAttendance: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    schedule: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("./configService.js", () => ({
  configService: {
    getRuleEngineConfigs: vi.fn().mockResolvedValue({
      attendanceMinDurationHours: 4,
      attendanceMinDurationMinutes: 0,
      attendanceMinDurationSeconds: 0,
    }),
  },
}));

vi.mock("./notificationIntegrationService.js", () => ({
  notificationIntegrationService: {
    sendPushNotification: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("./websocketService.js", () => ({
  websocketService: {
    broadcastStudentAttendance: vi.fn(),
    broadcastStudentCheckout: vi.fn(),
  },
}));

vi.mock("./kknAttendanceService.js", () => ({
  calculateDistance: vi.fn().mockReturnValue(10),
  calculateLiveInZoneSeconds: vi.fn().mockReturnValue(7200),
  calculateLiveInZoneMinutes: vi.fn().mockReturnValue(120),
  kknAttendanceService: {
    checkOutAttendance: vi.fn(),
  },
}));

import { prisma } from "../lib/prisma.js";
import { kknService } from "./kknService.js";
import { kknAttendanceService } from "./kknAttendanceService.js";

describe("kknService.getActiveZone - 16:00 Hold & 18:00 Auto-Checkout Policy", () => {
  const userId = "student-user-1";
  const scheduleId = "sched-daily-1";

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
      id: "student-kkn-1",
      userId,
      kelompokId: "kelompok-1",
      assignedRw: {
        id: 1,
        rw: "01",
        kelurahan: { name: "Sekeloa" },
        latitude: -6.89,
        longitude: 107.61,
      },
    } as any);

    vi.mocked(prisma.schedule.findMany).mockResolvedValue([
      {
        id: scheduleId,
        title: "Kegiatan Harian",
        time: "08:00 - 16:00",
        date: new Date(),
        latitude: -6.89,
        longitude: 107.61,
        radius: 100,
        kelompokId: "kelompok-1",
        isActive: true,
      } as any,
    ]);

    vi.mocked(prisma.activityAttendance.findMany).mockResolvedValue([]);
    vi.mocked(prisma.studentLeaveRequest.findFirst).mockResolvedValue(null);
  });

  it("should NOT mark student as ALPA when time is past 16:00 (e.g. 16:30 WIB) and keep BERLANGSUNG", async () => {
    // Mock system time to 16:30 WIB (09:30 UTC)
    const mockNow = new Date("2026-09-03T09:30:00.000Z");
    vi.setSystemTime(mockNow);

    const activeAtt = {
      id: "att-1",
      studentId: userId,
      scheduleId,
      status: "BERLANGSUNG",
      attendedAt: new Date("2026-09-03T01:00:00.000Z"), // 08:00 WIB
      checkOutAt: null,
      actualInZoneMinutes: 120,
    };

    vi.mocked(prisma.activityAttendance.findFirst).mockResolvedValue(activeAtt as any);

    const result = await kknService.getActiveZone(userId, -6.89, 107.61);

    // Verify status is NOT alpa
    expect(result.attendanceStatus).not.toBe("alpa");
    expect(result.attendanceStatus).toBe("berlangsung");
    // Verify prisma update to ALPA was NEVER called
    expect(prisma.activityAttendance.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "ALPA" },
      })
    );

    vi.useRealTimers();
  });

  it("should auto-checkout session as HADIR_MEMENUHI when reaching 18:00 WIB (e.g. 18:05 WIB)", async () => {
    // Mock system time to 18:05 WIB (11:05 UTC)
    const mockNow = new Date("2026-09-03T11:05:00.000Z");
    vi.setSystemTime(mockNow);

    const activeAtt = {
      id: "att-1",
      studentId: userId,
      scheduleId,
      status: "BERLANGSUNG",
      attendedAt: new Date("2026-09-03T01:00:00.000Z"), // 08:00 WIB
      checkOutAt: null,
      actualInZoneMinutes: 240,
    };

    vi.mocked(prisma.activityAttendance.findFirst).mockResolvedValue(activeAtt as any);
    vi.mocked(kknAttendanceService.checkOutAttendance).mockResolvedValue({
      success: true,
      message: "Check-out presensi berhasil dicatat",
      data: {
        actualInZoneMinutes: 240,
        status: "HADIR_MEMENUHI",
      },
    } as any);

    const result = await kknService.getActiveZone(userId, -6.89, 107.61);

    // Verify auto-checkout was called with isAutoCheckout true
    expect(kknAttendanceService.checkOutAttendance).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: userId,
        scheduleId,
        isAutoCheckout: true,
      })
    );

    // Verify returned status is hadir_memenuhi (HADIR), NOT alpa!
    expect(result.attendanceStatus).toBe("hadir_memenuhi");

    vi.useRealTimers();
  });

  it("should NOT mutate database to ALPA if student is belum_absen past 16:00", async () => {
    // Mock system time to 16:30 WIB
    const mockNow = new Date("2026-09-03T09:30:00.000Z");
    vi.setSystemTime(mockNow);

    // No active attendance
    vi.mocked(prisma.activityAttendance.findFirst).mockResolvedValue(null);

    const result = await kknService.getActiveZone(userId, -6.89, 107.61);

    expect(result.attendanceStatus).toBe("belum_absen");
    expect(prisma.activityAttendance.update).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
