/**
 * Project: BERSEKA
 * Routes Berita/Konten KKN — CMS News
 *
 * Public endpoints (tanpa auth) — untuk landing page:
 *   GET  /api/v1/berita           → list berita published
 *   GET  /api/v1/berita/:slug     → detail berita by slug
 *
 * Admin endpoints (butuh auth + role):
 *   GET    /api/v1/berita/admin/list  → semua berita (semua status)
 *   GET    /api/v1/berita/admin/:id   → detail by ID
 *   POST   /api/v1/berita             → buat berita baru
 *   PUT    /api/v1/berita/:id         → update konten berita
 *   PATCH  /api/v1/berita/:id/status  → ubah status (publish/draft/archive)
 *   DELETE /api/v1/berita/:id         → hapus berita
 */

import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { safeUploadPemanfaatanImage } from "../middlewares/uploadMiddleware.js";
import { beritaController } from "../controllers/beritaController.js";

const router = Router();

// ─────────────────────────────────────────────
// PUBLIC — Tidak butuh auth (landing page)
// ─────────────────────────────────────────────
router.get("/", beritaController.getPublishedList);
router.get("/admin/list", authMiddleware, roleMiddleware(["DEVELOPER"]), beritaController.getAdminList);
router.get("/admin/:id", authMiddleware, roleMiddleware(["DEVELOPER"]), beritaController.getById);
router.get("/:slug", beritaController.getBySlug);

// ─────────────────────────────────────────────
// ADMIN — Butuh auth + role
// ─────────────────────────────────────────────
const adminRoles = ["DEVELOPER"];

router.post(
  "/",
  authMiddleware,
  roleMiddleware(adminRoles),
  safeUploadPemanfaatanImage,
  beritaController.create
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(adminRoles),
  safeUploadPemanfaatanImage,
  beritaController.update
);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware(adminRoles),
  beritaController.changeStatus
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["DEVELOPER"]),
  beritaController.delete
);

export default router;
