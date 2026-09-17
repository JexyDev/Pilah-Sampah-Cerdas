import { describe, it, expect, vi, beforeEach } from "vitest";

const mockNotificationCreate = vi.fn();
const mockNotificationLogCreate = vi.fn();
const mockUserFindUnique = vi.fn();
const mockUserFindMany = vi.fn();

vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      notification: {
        create: (...args: any[]) => mockNotificationCreate(...args),
      },
      notificationLog: {
        create: (...args: any[]) => mockNotificationLogCreate(...args),
      },
      user: {
        findUnique: (...args: any[]) => mockUserFindUnique(...args),
        findMany: (...args: any[]) => mockUserFindMany(...args),
      },
    },
  };
});

import { notificationIntegrationService } from "./notificationIntegrationService.js";

describe("Notification Integration Service - Push Notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sendPushNotification should log FCM dispatch into notificationLog", async () => {
    const res = await notificationIntegrationService.sendPushNotification(
      "test-fcm-token-123",
      "Kegiatan Disetujui!",
      "Logbook Anda telah disetujui DPL.",
      "LOGBOOK_APPROVED",
      {
        event: "REFRESH_KEGIATAN_MAHASISWA",
        type: "KEGIATAN_DISETUJUI",
        logbookId: "logbook-1",
      }
    );

    expect(res.success).toBe(true);
    expect(mockNotificationLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          channel: "FCM",
          tujuan: "test-fcm-token-123",
          statusKirim: "SUCCESS",
          triggerType: "LOGBOOK_APPROVED",
        }),
      })
    );
  });

  it("sendToUser should create in-app notification and send FCM push if token exists", async () => {
    mockNotificationCreate.mockResolvedValueOnce({
      id: "notif-uuid-1",
      userId: "user-mhs-1",
      title: "Kegiatan Disetujui DPL! 🎉",
      message: "Logbook Anda telah diverifikasi dan disetujui resmi oleh DPL.",
      isRead: false,
    });

    mockUserFindUnique.mockResolvedValueOnce({
      id: "user-mhs-1",
      fcmToken: "fcm-mhs-device-token",
    });

    const result = await notificationIntegrationService.sendToUser({
      userId: "user-mhs-1",
      title: "Kegiatan Disetujui DPL! 🎉",
      message: "Logbook Anda telah diverifikasi dan disetujui resmi oleh DPL.",
      triggerType: "LOGBOOK_APPROVED",
      dataPayload: {
        event: "REFRESH_KEGIATAN_MAHASISWA",
        type: "KEGIATAN_DISETUJUI",
        entityId: "logbook-123",
      },
    });

    expect(mockNotificationCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-mhs-1",
        title: "Kegiatan Disetujui DPL! 🎉",
        message: "Logbook Anda telah diverifikasi dan disetujui resmi oleh DPL.",
        isRead: false,
      },
    });
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { id: "user-mhs-1" },
      select: {
        fcmToken: true,
        role: { select: { name: true } },
        studentProfile: { select: { id: true } },
      },
    });
    expect(mockNotificationLogCreate).toHaveBeenCalled();
    expect(result?.notification.id).toBe("notif-uuid-1");
  });

  it("sendToUsers should broadcast in-app notifications and FCM pushes to multiple students", async () => {
    mockNotificationCreate
      .mockResolvedValueOnce({ id: "notif-1", userId: "mhs-1" })
      .mockResolvedValueOnce({ id: "notif-2", userId: "mhs-2" });

    mockUserFindMany.mockResolvedValueOnce([
      { id: "mhs-1", fcmToken: "token-mhs-1" },
      { id: "mhs-2", fcmToken: "token-mhs-2" },
    ]);

    const res = await notificationIntegrationService.sendToUsers({
      userIds: ["mhs-1", "mhs-2"],
      title: "Program Kerja Disetujui! 🎯",
      message: "Program kerja kelompok Anda telah disetujui oleh DPL.",
      triggerType: "PROKER_APPROVED",
      dataPayload: {
        event: "REFRESH_PROKER_MAHASISWA",
        type: "PROKER_DISETUJUI",
        prokerId: "proker-789",
      },
    });

    expect(mockNotificationCreate).toHaveBeenCalledTimes(2);
    expect(mockUserFindMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["mhs-1", "mhs-2"] },
        fcmToken: { not: null },
      },
      select: {
        id: true,
        fcmToken: true,
        role: { select: { name: true } },
        studentProfile: { select: { id: true } },
      },
    });
    expect(mockNotificationLogCreate).toHaveBeenCalledTimes(2);
    expect(res).toHaveLength(2);
  });

  it("sendPushNotification should debounce rapid duplicate push notifications within 10s window", async () => {
    const res1 = await notificationIntegrationService.sendPushNotification(
      "debounce-token-xyz",
      "Check-In Sukses",
      "Presensi masuk berhasil dicatat.",
      "CHECKIN_SUCCESS"
    );
    expect(res1.success).toBe(true);
    expect(res1.messageId).not.toBe("debounced");

    // Immediate second call should be debounced
    const res2 = await notificationIntegrationService.sendPushNotification(
      "debounce-token-xyz",
      "Check-In Sukses",
      "Presensi masuk berhasil dicatat.",
      "CHECKIN_SUCCESS"
    );
    expect(res2.success).toBe(true);
    expect(res2.messageId).toBe("debounced");
  });

  it("sendToUser should suppress FCM push for Mahasiswa when trigger is non-essential (e.g. GPS alarm)", async () => {
    mockNotificationCreate.mockResolvedValueOnce({
      id: "notif-uuid-gps",
      userId: "user-mhs-spam",
      title: "GPS Alert",
      message: "Anda berada di luar zona posko.",
      isRead: false,
    });

    mockUserFindUnique.mockResolvedValueOnce({
      id: "user-mhs-spam",
      fcmToken: "fcm-mhs-gps-token",
      role: { name: "MAHASISWA_KKN" },
      studentProfile: { id: "student-123" },
    });

    const result = await notificationIntegrationService.sendToUser({
      userId: "user-mhs-spam",
      title: "GPS Alert",
      message: "Anda berada di luar zona posko.",
      triggerType: "GPS_OUT_OF_BOUNDS",
    });

    // In-app notification created in DB
    expect(mockNotificationCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-mhs-spam",
        title: "GPS Alert",
        message: "Anda berada di luar zona posko.",
        isRead: false,
      },
    });
    // But FCM push is suppressed (null)
    expect(result?.pushResult).toBeNull();
  });
});
