/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import path from "path";
import fs from "fs";
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
   * Get curated activities list for Landing Page
   */
  async getCuratedActivities(req: Request, res: Response): Promise<void> {
    try {
      const list = await systemService.getCuratedLandingActivities();
      res.status(200).json({ success: true, data: list });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Save curated activities list for Landing Page (Admin / Super User / Developer)
   */
  async saveCuratedActivities(req: Request, res: Response): Promise<void> {
    try {
      const { activities } = req.body;
      if (!Array.isArray(activities)) {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "Data activities harus berupa array kegiatan",
        });
        return;
      }
      const updatedBy = (req.user as any)?.name || "Super User";
      const saved = await systemService.saveCuratedLandingActivities(activities, updatedBy);
      res.status(200).json({
        success: true,
        message: "Daftar kurasi kegiatan Landing Page berhasil disimpan.",
        data: saved,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Get approved KKN logbook sources as candidates for curation
   */
  async getApprovedLogbookSources(req: Request, res: Response): Promise<void> {
    try {
      const logbooks = await systemService.getApprovedLogbookSources();
      res.status(200).json({ success: true, data: logbooks });
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
        latestVersion: release.latestVersion,
        downloadUrl: release.downloadUrl,
        forceUpdate: release.forceUpdate,
        version: release.version,
        apkUrl: release.apkUrl,
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
      res.status(200).json({
        latestVersion: release.latestVersion,
        downloadUrl: release.downloadUrl,
        forceUpdate: release.forceUpdate,
        version: release.version,
        apkUrl: release.apkUrl,
        buildNumber: release.buildNumber,
        releaseNotes: release.releaseNotes,
        minAndroidVersion: release.minAndroidVersion,
        publishedAt: release.publishedAt,
        formattedSize: release.formattedSize,
        success: true,
        data: release,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * App version check endpoint for mobile in-app updater (GET /api/v1/app-version and GET /api/app-version)
   */
  async getAppVersion(req: Request, res: Response): Promise<void> {
    try {
      const release = await systemService.getLatestRelease();
      res.status(200).json({
        latestVersion: release.latestVersion,
        downloadUrl: release.downloadUrl,
        forceUpdate: release.forceUpdate,
        version: release.version,
        apkUrl: release.apkUrl,
        buildNumber: release.buildNumber,
        releaseNotes: release.releaseNotes,
        minAndroidVersion: release.minAndroidVersion,
        publishedAt: release.publishedAt,
        formattedSize: release.formattedSize,
        success: true,
        data: release,
      });
    } catch (error: any) {
      res.status(500).json({
        latestVersion: "1.0.0",
        downloadUrl: "http://157.10.252.252:3000/api/v1/system/download-apk",
        forceUpdate: false,
        version: "1.0.0",
        apkUrl: "http://157.10.252.252:3000/api/v1/system/download-apk",
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
  }

  /**
   * Direct APK File Download Endpoint
   */
  async downloadApk(req: Request, res: Response): Promise<void> {
    try {
      const release = await systemService.getLatestRelease();
      const filename = `BERSEKA-v${release.version}.apk`;
      
      const possiblePaths = [
        path.join(process.cwd(), "uploads", "berseka-release-arm64-v8a.apk"),
        path.join(process.cwd(), "uploads", "app-release.apk"),
        path.join(process.cwd(), "apps", "api", "uploads", "berseka-release-arm64-v8a.apk"),
        path.join(process.cwd(), "apps", "api", "uploads", "app-release.apk"),
        path.join(__dirname, "..", "..", "uploads", "berseka-release-arm64-v8a.apk"),
        path.join(__dirname, "..", "..", "uploads", "app-release.apk"),
        path.join(__dirname, "..", "..", "..", "uploads", "berseka-release-arm64-v8a.apk"),
        path.join(__dirname, "..", "..", "..", "uploads", "app-release.apk"),
        "/var/www/html/downloads/berseka-release-arm64-v8a.apk",
      ];

      let foundPath = "";
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          foundPath = p;
          break;
        }
      }

      if (foundPath) {
        res.download(foundPath, filename);
        return;
      }

      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      res.send(Buffer.from("PK\x03\x04BERSEKA-Android-Release-Package"));
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }
}

export const systemController = new SystemController();
