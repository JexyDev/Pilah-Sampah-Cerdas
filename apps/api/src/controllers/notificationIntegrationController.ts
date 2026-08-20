/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { notificationIntegrationService } from "../services/notificationIntegrationService.js";

export class NotificationIntegrationController {
  async testOtp(req: Request, res: Response): Promise<void> {
    try {
      const { to, message } = req.body;
      if (!to || !message) {
        res
          .status(400)
          .json({ success: false, code: "BAD_REQUEST", message: "to dan message wajib diisi" });
        return;
      }
      const result = await notificationIntegrationService.sendWhatsApp(to, message, "OTP");
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  async testAlarm(req: Request, res: Response): Promise<void> {
    try {
      const { to, message } = req.body;
      if (!to || !message) {
        res
          .status(400)
          .json({ success: false, code: "BAD_REQUEST", message: "to dan message wajib diisi" });
        return;
      }
      const result = await notificationIntegrationService.sendWhatsApp(to, message, "PUSH_ALARM");
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  async testEmail(req: Request, res: Response): Promise<void> {
    try {
      const { to, subject, body } = req.body;
      if (!to || !subject || !body) {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "to, subject, dan body wajib diisi",
        });
        return;
      }
      const result = await notificationIntegrationService.sendEmail(to, subject, body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  async testFcm(req: Request, res: Response): Promise<void> {
    try {
      const { token, title, body } = req.body;
      if (!token || !title || !body) {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "token, title, dan body wajib diisi",
        });
        return;
      }
      const result = await notificationIntegrationService.sendPushNotification(token, title, body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }
}

export const notificationIntegrationController = new NotificationIntegrationController();
