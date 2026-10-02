import { describe, it, expect, vi, beforeEach } from "vitest";
import { cronService } from "./cronService.js";
import { notificationIntegrationService, isTriggerAllowedForMahasiswa } from "./notificationIntegrationService.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      systemConfig: {
        findUnique: vi.fn(),
      },
      user: {
        findMany: vi.fn(),
      },
      notification: {
        createMany: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

vi.mock("./notificationIntegrationService.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./notificationIntegrationService.js")>();
  return {
    ...actual,
    notificationIntegrationService: {
      ...actual.notificationIntegrationService,
      sendToUsers: vi.fn(),
    },
  };
});

describe("CronService - Mahasiswa KKN Morning Reminder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should pass anti-spam filter for PRESENSI_MORNING_REMINDER", () => {
    expect(isTriggerAllowedForMahasiswa("PRESENSI_MORNING_REMINDER")).toBe(true);
    expect(isTriggerAllowedForMahasiswa("PRESENSI_PAGI")).toBe(true);
    expect(isTriggerAllowedForMahasiswa("RANDOM_SPAM_TRIGGER")).toBe(false);
  });

  it("should send morning reminder to active Mahasiswa KKN", async () => {
    (prisma.systemConfig.findUnique as any).mockResolvedValue(null);
    (prisma.user.findMany as any).mockResolvedValue([
      { id: "mhs-1", fcmToken: "token-1", name: "Mahasiswa 1" },
      { id: "mhs-2", fcmToken: "token-2", name: "Mahasiswa 2" },
    ]);
    (notificationIntegrationService.sendToUsers as any).mockResolvedValue([]);

    await cronService.triggerMahasiswaMorningReminder();

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        role: { name: "MAHASISWA_KKN" },
        status: "Aktif",
      },
      select: {
        id: true,
        fcmToken: true,
        name: true,
      },
    });

    expect(notificationIntegrationService.sendToUsers).toHaveBeenCalledWith({
      userIds: ["mhs-1", "mhs-2"],
      title: "🌅 Semangat Pagi! Waktunya Presensi KKN",
      message: "Jangan lupa lakukan check-in presensi di Posko hari ini dan catat progres logbook kegiatan Anda!",
      triggerType: "PRESENSI_MORNING_REMINDER",
      dataPayload: {
        route: "/kkn/presensi",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    });
  });

  it("should respect systemConfig when kkn_morning_reminder_enabled is false", async () => {
    (prisma.systemConfig.findUnique as any).mockResolvedValue({
      key: "kkn_morning_reminder_enabled",
      value: "false",
    });

    await cronService.triggerMahasiswaMorningReminder();

    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(notificationIntegrationService.sendToUsers).not.toHaveBeenCalled();
  });

  it("should handle empty mahasiswa list gracefully", async () => {
    (prisma.systemConfig.findUnique as any).mockResolvedValue(null);
    (prisma.user.findMany as any).mockResolvedValue([]);

    await cronService.triggerMahasiswaMorningReminder();

    expect(prisma.user.findMany).toHaveBeenCalled();
    expect(notificationIntegrationService.sendToUsers).not.toHaveBeenCalled();
  });
});
