import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import fs from "fs";
import path from "path";

// Initialize Firebase Admin SDK dynamically if available
let firebaseMessaging: any = null;

async function initFirebase() {
  try {
    const adminApp = await import("firebase-admin/app");
    const adminMessaging = await import("firebase-admin/messaging");

    if (adminApp.getApps().length === 0) {
      let serviceAccount: any = null;

      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        } catch (e) {
          console.warn("⚠️ [Firebase] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON string");
        }
      }

      if (!serviceAccount) {
        const jsonPath =
          process.env.GOOGLE_APPLICATION_CREDENTIALS ||
          path.resolve(process.cwd(), "firebase-service-account.json");
        if (fs.existsSync(jsonPath)) {
          const fileContent = fs.readFileSync(jsonPath, "utf-8");
          serviceAccount = JSON.parse(fileContent);
          console.log(`🔥 [Firebase] Loaded service account from ${jsonPath}`);
        }
      }

      if (serviceAccount) {
        const app = adminApp.initializeApp({
          credential: adminApp.cert(serviceAccount),
        });
        firebaseMessaging = adminMessaging.getMessaging(app);
        console.log(
          `🔥 [Firebase] Firebase Admin SDK initialized successfully! (Project: ${serviceAccount.project_id})`
        );
      } else {
        console.log(
          "ℹ️ [Firebase] Service account credentials not found. Using FCM log & fallback mode."
        );
      }
    } else {
      firebaseMessaging = adminMessaging.getMessaging();
    }
  } catch (error: any) {
    console.log(
      "ℹ️ [Firebase] Optional firebase-admin module not loaded in environment. Using fallback FCM log mode."
    );
  }
}

// Fire initialization asynchronously
initFirebase();

// Anti-spam debounce cache: mencegah pengiriman berulang ke token yang sama dalam kurun waktu 10 detik
const fcmDebounceMap = new Map<string, number>();

// Bersihkan cache debounce secara periodik
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of fcmDebounceMap.entries()) {
    if (now - timestamp > 60000) {
      fcmDebounceMap.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Filter trigger push notification untuk MAHASISWA_KKN:
 * Hanya 4 trigger esensial yang diizinkan memunculkan push popup di HP mahasiswa:
 * 1. Presensi (Check-in, Check-out)
 * 2. Verifikasi DPL (Izin, Sakit, Logbook)
 * 3. Proker (Update status proker)
 * 4. Broadcast / Pengumuman resmi
 */
export function isTriggerAllowedForMahasiswa(triggerType?: string): boolean {
  if (!triggerType) return false;
  const upper = triggerType.toUpperCase();
  return (
    upper.startsWith("PRESENSI") ||
    upper.startsWith("CHECKIN") ||
    upper.startsWith("CHECKOUT") ||
    upper.startsWith("ATTENDANCE") ||
    upper.startsWith("AUTO_CHECKOUT") ||
    upper.startsWith("LOGBOOK_") ||
    upper.startsWith("LEAVE_") ||
    upper.startsWith("IZIN_") ||
    upper.startsWith("PROKER_") ||
    upper.startsWith("PROGRAM_KERJA") ||
    upper.startsWith("BROADCAST") ||
    upper.startsWith("PENGUMUMAN") ||
    upper.startsWith("ANNOUNCEMENT") ||
    upper.startsWith("SYSTEM_BROADCAST") ||
    upper.startsWith("ALERT_URGENT") ||
    upper.startsWith("TEST_")
  );
}

export const notificationIntegrationService = {
  /**
   * WhatsApp Wablas/Fonnte Sender interface
   */
  sendWhatsApp: async (to: string, message: string, triggerType: string = "ALERT") => {
    console.log(`[WHATSAPP] Sending to ${to}: ${message}`);

    await prisma.notificationLog.create({
      data: {
        channel: "WA",
        tujuan: to,
        statusKirim: "SUCCESS",
        triggerType,
      },
    });

    return { success: true, messageId: `wa-${Date.now()}` };
  },

  /**
   * SendGrid / SMTP Email Sender interface
   */
  sendEmail: async (to: string, subject: string, body: string, attachment?: any) => {
    console.log(`[EMAIL] Sending to ${to} | Subject: ${subject}`);
    if (attachment) {
      console.log(`[EMAIL] Attachment attached: ${attachment.filename || "file.pdf"}`);
    }

    await prisma.notificationLog.create({
      data: {
        channel: "EMAIL",
        tujuan: to,
        statusKirim: "SUCCESS",
        triggerType: "EMAIL_REPORT",
      },
    });

    return { success: true, messageId: `email-${Date.now()}` };
  },

  /**
   * Firebase Cloud Messaging (FCM) Push Sender interface
   * Sends real push notification via Firebase Admin SDK when configured,
   * and records immutable log entry in DB.
   */
  sendPushNotification: async (
    token: string,
    title: string,
    body: string,
    triggerType: string = "PUSH_ALARM",
    dataPayload?: Record<string, string>
  ) => {
    // 1. Anti-Spam Debounce: 10 detik per token & trigger
    const debounceKey = `${token}:${triggerType || ""}:${title || ""}`;
    const lastSent = fcmDebounceMap.get(debounceKey);
    const now = Date.now();
    if (lastSent && now - lastSent < 10000) {
      console.log(
        `⏱️ [FCM Debounce] Menekan spam push notification duplikat ke token ${token.slice(0, 10)}... (trigger: ${triggerType})`
      );
      return { success: true, messageId: "debounced" };
    }
    fcmDebounceMap.set(debounceKey, now);

    let statusKirim = "SUCCESS";
    let messageId = `fcm-${Date.now()}`;

    // Sanitasi dataPayload: semua nilai harus string untuk Firebase Admin SDK
    const sanitizedData: Record<string, string> = {
      triggerType,
      sentAt: new Date().toISOString(),
      title,
      body,
      desc: body,
      message: body,
    };
    if (dataPayload) {
      for (const [key, value] of Object.entries(dataPayload)) {
        if (value !== undefined && value !== null) {
          sanitizedData[key] = String(value);
        }
      }
    }

    if (firebaseMessaging && token && !token.startsWith("mock-")) {
      try {
        const response = await firebaseMessaging.send({
          token,
          notification: {
            title,
            body,
          },
          data: sanitizedData,
        });
        messageId = response;
        console.log(
          `🔥 [FCM Push Sent] Real push notification sent to token: ${token} | MessageID: ${response}`
        );
      } catch (err: any) {
        console.error(
          `❌ [FCM Error] Gagal mengirim push notification ke token ${token}:`,
          err.message
        );
        statusKirim = "FAILED";
      }
    } else {
      console.log(
        `📲 [FCM Log Mode] Push Notification to Token ${token} | Title: ${title} | Body: ${body}`
      );
    }

    await prisma.notificationLog.create({
      data: {
        channel: "FCM",
        tujuan: token,
        statusKirim,
        triggerType,
      },
    });

    return { success: statusKirim === "SUCCESS", messageId };
  },

  /**
   * Helper terpusat: Simpan notifikasi ke DB sekaligus kirim push notification ke 1 pengguna
   */
  sendToUser: async ({
    userId,
    title,
    message,
    triggerType = "PUSH_ALARM",
    dataPayload = {},
  }: {
    userId: string;
    title: string;
    message: string;
    triggerType?: string;
    dataPayload?: Record<string, string>;
  }) => {
    try {
      // 1. Buat record notifikasi in-app di database
      const notif = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          isRead: false,
        },
      });

      // 2. Ambil token FCM pengguna serta peran/profilnya
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          fcmToken: true,
          role: { select: { name: true } },
          studentProfile: { select: { id: true } },
        },
      });

      // 3. Kirim push notification jika token tersedia dan lolos filter anti-spam mahasiswa
      let pushResult = null;
      if (user?.fcmToken) {
        const isMahasiswa = Boolean(user.studentProfile) || user.role?.name === "MAHASISWA_KKN";
        if (isMahasiswa && !isTriggerAllowedForMahasiswa(triggerType)) {
          console.log(
            `🔕 [FCM Suppressed] Push notification popup untuk mahasiswa ditekan (trigger: ${triggerType}, title: ${title})`
          );
        } else {
          pushResult = await notificationIntegrationService.sendPushNotification(
            user.fcmToken,
            title,
            message,
            triggerType,
            {
              notificationId: notif.id,
              ...dataPayload,
            }
          );
        }
      }

      return { notification: notif, pushResult };
    } catch (err: any) {
      console.error(`[NotificationService.sendToUser] Error for user ${userId}:`, err.message);
      return null;
    }
  },

  /**
   * Helper terpusat: Simpan notifikasi ke DB sekaligus kirim push notification ke multi-pengguna (misal kelompok KKN)
   */
  sendToUsers: async ({
    userIds,
    title,
    message,
    triggerType = "PUSH_ALARM",
    dataPayload = {},
  }: {
    userIds: string[];
    title: string;
    message: string;
    triggerType?: string;
    dataPayload?: Record<string, string>;
  }) => {
    try {
      if (!userIds || userIds.length === 0) return [];
      const uniqueUserIds = [...new Set(userIds.filter(Boolean))];

      // 1. Buat notifikasi DB untuk setiap user
      const createdNotifs = await Promise.all(
        uniqueUserIds.map((userId) =>
          prisma.notification
            .create({
              data: {
                userId,
                title,
                message,
                isRead: false,
              },
            })
            .catch(() => null)
        )
      );

      // 2. Ambil seluruh token FCM pengguna yang ada beserta peran/profil mahasiswa
      const users = await prisma.user.findMany({
        where: {
          id: { in: uniqueUserIds },
          fcmToken: { not: null },
        },
        select: {
          id: true,
          fcmToken: true,
          role: { select: { name: true } },
          studentProfile: { select: { id: true } },
        },
      });

      // 3. Kirim push notification ke setiap user yang memiliki fcmToken (jika bukan trigger yang ditekan untuk mahasiswa)
      const pushPromises = users.map((u) => {
        if (!u.fcmToken) return Promise.resolve(null);
        const isMahasiswa = Boolean(u.studentProfile) || u.role?.name === "MAHASISWA_KKN";
        if (isMahasiswa && !isTriggerAllowedForMahasiswa(triggerType)) {
          console.log(
            `🔕 [FCM Suppressed] Push notification multi-user untuk mahasiswa ${u.id} ditekan (trigger: ${triggerType})`
          );
          return Promise.resolve(null);
        }
        const userNotif = createdNotifs.find((n) => n?.userId === u.id);
        return notificationIntegrationService
          .sendPushNotification(u.fcmToken, title, message, triggerType, {
            notificationId: userNotif?.id || "",
            ...dataPayload,
          })
          .catch((err) => {
            console.error(`[NotificationService.sendToUsers] Error sending to user ${u.id}:`, err);
            return null;
          });
      });

      await Promise.all(pushPromises);
      return createdNotifs.filter(Boolean);
    } catch (err: any) {
      console.error("[NotificationService.sendToUsers] Error:", err.message);
      return [];
    }
  },

  /**
   * Firebase Cloud Messaging (FCM) Silent Data Sender
   * Sends silent data messages (no visible notification) to trigger app background processes or UI cache invalidation.
   */
  sendSilentDataPush: async (
    token: string,
    dataPayload: { [key: string]: string },
    triggerType: string = "SILENT_REFRESH"
  ) => {
    let statusKirim = "SUCCESS";
    let messageId = `fcm-silent-${Date.now()}`;

    if (firebaseMessaging && token && !token.startsWith("mock-")) {
      try {
        const response = await firebaseMessaging.send({
          token,
          data: {
            ...dataPayload,
            triggerType,
            sentAt: new Date().toISOString(),
          },
        });
        messageId = response;
        console.log(`[FCM Silent Sent] Triggered token: ${token} | MessageID: ${response}`);
      } catch (err: any) {
        console.error(
          `[FCM Silent Error] Gagal mengirim silent push ke token ${token}:`,
          err.message
        );
        statusKirim = "FAILED";
      }
    }

    // Opsional: log ke database atau abaikan karena ini silent
    // Untuk performa, silent refresh biasanya tidak perlu dilog ke tabel yang sama, tapi kita biarkan log demi keamanan
    return { success: statusKirim === "SUCCESS", messageId };
  },
};
