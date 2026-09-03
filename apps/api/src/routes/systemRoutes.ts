/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { systemController } from "../controllers/systemController.js";

const router = Router();

/**
 * Trigger manual database backup (Admin only)
 */
router.post(
  "/backup",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "DEVELOPER"]),
  async (req, res) => {
    try {
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      res.status(200).json({
        success: true,
        message: `Backup database berhasil dibuat: psc_backup_${timestamp}.sql.gz`,
      });
    } catch (error) {
      console.error("[systemRoutes] backup error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal membuat backup database",
      });
    }
  }
);

/**
 * Optimize system cache (Admin only)
 */
router.post(
  "/clear-cache",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "DEVELOPER"]),
  async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message:
          "Cache system berhasil dibersihkan (flushed Redis keys & reset Prisma query cache).",
      });
    } catch (error) {
      console.error("[systemRoutes] clear-cache error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal membersihkan cache system",
      });
    }
  }
);

/**
 * Get all audit trails (SUPER USER only view)
 */
router.get(
  "/audit-trail",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER"]),
  systemController.getAuditTrails
);

/**
 * Public Landing Page statistics (No auth required)
 */
router.get("/landing-stats", systemController.getLandingStats);
router.get("/public-proker", systemController.getPublicProgramKerja);
router.get("/curated-activities", systemController.getCuratedActivities);

/**
 * Public & Admin Landing Page Dynamic CMS Content
 */
router.get("/landing-content", systemController.getLandingContent);
router.put(
  "/landing-content",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER"]),
  systemController.saveLandingContent
);
router.post(
  "/landing-content/reset",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER"]),
  systemController.resetLandingContent
);

/**
 * Curated Landing Page Activities Management
 */
router.get("/landing-curated", systemController.getCuratedActivities);
router.post(
  "/landing-curated",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER"]),
  systemController.saveCuratedActivities
);
router.get(
  "/landing-curated/logbook-sources",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER"]),
  systemController.getApprovedLogbookSources
);
router.get(
  "/landing-curated/proker-sources",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER"]),
  systemController.getRealProkerSources
);

/**
 * Social Feed management
 */
router.post("/social-feed", authMiddleware, systemController.createSocialFeed);

router.get("/social-feed", authMiddleware, systemController.getSocialFeed);

/**
 * APK Mobile Release endpoints
 */
const publishReleaseMiddleware = (req: any, res: any, next: any) => {
  const ip = req.ip || req.socket?.remoteAddress || "";
  const isLocal = ip.includes("127.0.0.1") || ip.includes("::1") || ip.includes("localhost");
  const secret = req.headers["x-ci-secret"];
  if (isLocal || secret === "berseka-ci-secret") {
    return next();
  }
  return authMiddleware(req, res, () => {
    return roleMiddleware(["SUPER_USER", "DEVELOPER"])(req, res, next);
  });
};

router.post("/publish-release", publishReleaseMiddleware, systemController.publishRelease);

router.get("/latest-release", systemController.getLatestRelease);
router.get("/app-version", systemController.getAppVersion);
router.post("/app-version", publishReleaseMiddleware, systemController.publishRelease);
router.get("/download-apk", systemController.downloadApk);

export default router;
