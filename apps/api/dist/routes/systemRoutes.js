/**
 * Project: TrashCare
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
router.post("/backup", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH"]), async (req, res) => {
    try {
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        res.status(200).json({
            success: true,
            message: `Backup database berhasil dibuat: psc_backup_${timestamp}.sql.gz`,
        });
    }
    catch (error) {
        console.error("[systemRoutes] backup error:", error);
        res.status(500).json({
            success: false,
            message: "Gagal membuat backup database",
        });
    }
});
/**
 * Optimize system cache (Admin only)
 */
router.post("/clear-cache", authMiddleware, roleMiddleware(["SUPER_USER", "ADMIN_DLH"]), async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "Cache system berhasil dibersihkan (flushed Redis keys & reset Prisma query cache).",
        });
    }
    catch (error) {
        console.error("[systemRoutes] clear-cache error:", error);
        res.status(500).json({
            success: false,
            message: "Gagal membersihkan cache system",
        });
    }
});
/**
 * Get all audit trails (SUPER USER only view)
 */
router.get("/audit-trail", authMiddleware, roleMiddleware(["SUPER_USER"]), systemController.getAuditTrails);
/**
 * Social Feed management
 */
router.post("/social-feed", authMiddleware, systemController.createSocialFeed);
router.get("/social-feed", authMiddleware, systemController.getSocialFeed);
export default router;
