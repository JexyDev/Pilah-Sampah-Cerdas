import { Router } from "express";
import { ideDaurUlangController } from "../controllers/ideDaurUlangController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
import { uploadAvatarMiddleware } from "../middlewares/uploadMiddleware.js";

const router = Router();

// Submit ide — WARGA + MAHASISWA_KKN + Admin (Dicek via Dynamic Permission)
router.post(
  "/",
  authMiddleware,
  requirePermission("ide_daur_ulang", "canCreate", [
    "WARGA",
    "MAHASISWA_KKN",
    "SUPER_USER",
    "ADMIN_DLH",
    "RW",
    "RT",
  ]),
  uploadAvatarMiddleware.single("foto"),
  ideDaurUlangController.submitIde.bind(ideDaurUlangController)
);

// Social feed — diproteksi canView
router.get(
  "/",
  authMiddleware,
  requirePermission("ide_daur_ulang", "canView", [
    "WARGA",
    "MAHASISWA_KKN",
    "SUPER_USER",
    "ADMIN_DLH",
    "RW",
    "RT",
  ]),
  ideDaurUlangController.getIdeDaurUlang.bind(ideDaurUlangController)
);

// Ide milik user sendiri
router.get(
  "/me",
  authMiddleware,
  roleMiddleware(["WARGA", "MAHASISWA_KKN"]),
  ideDaurUlangController.getMyIde.bind(ideDaurUlangController)
);

// RW approve ide dari WARGA (+50 poin)
router.put(
  "/:id/approve",
  authMiddleware,
  requirePermission("rw_approval", "canEdit", ["RW", "RT", "SUPER_USER", "ADMIN_DLH"]),
  ideDaurUlangController.approve.bind(ideDaurUlangController)
);

// DPL approve ide dari MAHASISWA_KKN (+30 poin)
router.put(
  "/:id/approve-dpl",
  authMiddleware,
  roleMiddleware(["DPL", "DOSEN_PEMBIMBING", "SUPER_USER"]),
  ideDaurUlangController.approveDpl.bind(ideDaurUlangController)
);

// RW / Admin reject ide
router.put(
  "/:id/reject",
  authMiddleware,
  roleMiddleware(["RW", "RT", "SUPER_USER", "ADMIN_DLH", "DPL", "DOSEN_PEMBIMBING"]),
  ideDaurUlangController.reject.bind(ideDaurUlangController)
);

// Update ide
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "RW", "RT"]),
  uploadAvatarMiddleware.single("foto"),
  ideDaurUlangController.updateIde.bind(ideDaurUlangController)
);

// Hapus ide
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "RW", "RT"]),
  ideDaurUlangController.deleteIde.bind(ideDaurUlangController)
);

export default router;
