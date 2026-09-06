/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export const notificationIntegrationService = {
    /**
     * Mock WhatsApp Wablas/Fonnte Sender interface
     */
    sendWhatsApp: async (to, message, triggerType = "ALERT") => {
        console.log(`[MOCK WHATSAPP] Sending to ${to}: ${message}`);
        // Create log in DB
        await prisma.notificationLog.create({
            data: {
                channel: "WA",
                tujuan: to,
                statusKirim: "SUCCESS",
                triggerType,
            },
        });
        return { success: true, messageId: `wa-mock-${Date.now()}` };
    },
    /**
     * Mock SendGrid Email Sender interface
     */
    sendEmail: async (to, subject, body, attachment) => {
        console.log(`[MOCK EMAIL] Sending to ${to} | Subject: ${subject}`);
        if (attachment) {
            console.log(`[MOCK EMAIL] Attachment attached: ${attachment.filename || "file.pdf"}`);
        }
        // Create log in DB
        await prisma.notificationLog.create({
            data: {
                channel: "EMAIL",
                tujuan: to,
                statusKirim: "SUCCESS",
                triggerType: "EMAIL_REPORT",
            },
        });
        return { success: true, messageId: `email-mock-${Date.now()}` };
    },
    /**
     * Mock Firebase Cloud Messaging (FCM) Push Sender interface
     */
    sendPushNotification: async (token, title, body, triggerType = "PUSH_ALARM") => {
        console.log(`[MOCK FCM] Sending to Token ${token} | Title: ${title} | Body: ${body}`);
        // Create log in DB
        await prisma.notificationLog.create({
            data: {
                channel: "FCM",
                tujuan: token,
                statusKirim: "SUCCESS",
                triggerType,
            },
        });
        return { success: true, messageId: `fcm-mock-${Date.now()}` };
    },
};
