/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

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
        const jsonPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(process.cwd(), "firebase-service-account.json");
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
        console.log(`🔥 [Firebase] Firebase Admin SDK initialized successfully! (Project: ${serviceAccount.project_id})`);
      } else {
        console.log("ℹ️ [Firebase] Service account credentials not found. Using FCM log & fallback mode.");
      }
    } else {
      firebaseMessaging = adminMessaging.getMessaging();
    }
  } catch (error: any) {
    console.log("ℹ️ [Firebase] Optional firebase-admin module not loaded in environment. Using fallback FCM log mode.");
  }
}

// Fire initialization asynchronously
initFirebase();

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
    triggerType: string = "PUSH_ALARM"
  ) => {
    let statusKirim = "SUCCESS";
    let messageId = `fcm-${Date.now()}`;

    if (firebaseMessaging && token && !token.startsWith("mock-")) {
      try {
        const response = await firebaseMessaging.send({
          token,
          notification: {
            title,
            body,
          },
          data: {
            triggerType,
            sentAt: new Date().toISOString(),
          },
        });
        messageId = response;
        console.log(`🔥 [FCM Push Sent] Real push notification sent to token: ${token} | MessageID: ${response}`);
      } catch (err: any) {
        console.error(`❌ [FCM Error] Gagal mengirim push notification ke token ${token}:`, err.message);
        statusKirim = "FAILED";
      }
    } else {
      console.log(`📲 [FCM Log Mode] Push Notification to Token ${token} | Title: ${title} | Body: ${body}`);
    }

    // Always record log entry in database
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
};
