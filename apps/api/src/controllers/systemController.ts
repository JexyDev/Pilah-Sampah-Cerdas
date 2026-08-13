/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { systemService } from "../services/systemService.js";

export class SystemController {
  /**
   * Get all audit trails (SUPER USER only)
   */
  async getAuditTrails(req: Request, res: Response): Promise<void> {
    try {
      const logs = await systemService.getAuditTrails();
      res.status(200).json({ success: true, data: logs });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Create a new social feed entry
   */
  async createSocialFeed(req: Request, res: Response): Promise<void> {
    try {
      const { tipe, deskripsi, entityId } = req.body;
      if (!tipe || !deskripsi) {
        res
          .status(400)
          .json({ success: false, code: "BAD_REQUEST", message: "tipe dan deskripsi wajib diisi" });
        return;
      }
      const userId = req.user!.userId;
      const entry = await systemService.createSocialFeed(userId, tipe, deskripsi, entityId);
      res.status(201).json({
        success: true,
        message: "Aktivitas berhasil ditambahkan ke feed sosial",
        data: entry,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Get public social feed list
   */
  async getSocialFeed(req: Request, res: Response): Promise<void> {
    try {
      const list = await systemService.getSocialFeed();
      res.status(200).json({ success: true, data: list });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Get public landing page aggregated statistics
   */
  async getLandingStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await systemService.getLandingStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Publish new APK release (SUPER_USER only)
   */
  async publishRelease(req: Request, res: Response): Promise<void> {
    try {
      const publisherName = (req.user as any)?.name || "Developer";
      const release = await systemService.publishRelease(publisherName, req.body);
      res.status(201).json({
        success: true,
        message: `Rilis APK versi ${release.version} berhasil dipublikasikan.`,
        data: release,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Get latest public APK release info
   */
  async getLatestRelease(req: Request, res: Response): Promise<void> {
    try {
      const release = await systemService.getLatestRelease();
      res.status(200).json({ success: true, data: release });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Direct APK File Download Endpoint
   */
  async downloadApk(req: Request, res: Response): Promise<void> {
    try {
      const release = await systemService.getLatestRelease();
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="TrashCare-v${release.version}.apk"`
      );
      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      // Responds with dummy APK binary header or file stream
      res.send(Buffer.from("PK\x03\x04TrashCare-Android-Release-Package"));
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }
}

export const systemController = new SystemController();
