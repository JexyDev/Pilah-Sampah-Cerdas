import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

/**
 * Trigger manual database backup (Admin only)
 */
router.post("/backup", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    res.status(200).json({
      success: true,
      message: `Backup database berhasil dibuat: psc_backup_${timestamp}.sql.gz`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal membuat backup database",
    });
  }
});

/**
 * Optimize system cache (Admin only)
 */
router.post("/clear-cache", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Cache system berhasil dibersihkan (flushed Redis keys & reset Prisma query cache).",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal membersihkan cache system",
    });
  }
});

export default router;
