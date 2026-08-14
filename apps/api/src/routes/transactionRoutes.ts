/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { transactionController } from "../controllers/transactionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { uploadAvatarMiddleware } from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get(
  "/deposits",
  authMiddleware,
  roleMiddleware([
    "SUPER_USER",
    "ADMIN_DLH",
    "RW",
    "RT",
    "PETUGAS_RESIDU",
    "LURAH",
    "CAMAT",
    "MAHASISWA_KKN",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "DPL",
    "WARGA",
  ]),
  transactionController.getDeposits
);
/**
 * @swagger
 * /api/v1/transactions/my-deposits:
 *   get:
 *     summary: Mengambil riwayat poin dan transaksi setoran sampah milik Warga
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data transaksi Warga
 */
router.get(
  "/my-deposits",
  authMiddleware,
  roleMiddleware(["WARGA"]),
  transactionController.getMyDeposits
);

router.post(
  "/manual",
  authMiddleware,
  roleMiddleware(["PETUGAS_RESIDU", "SUPER_USER"]),
  uploadAvatarMiddleware.single("image"),
  transactionController.createManualDeposit
);

router.get(
  "/manual",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "RW", "RT", "PETUGAS_RESIDU"]),
  transactionController.getManualDeposits
);

router.get("/:id", authMiddleware, transactionController.getDepositDetails);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware([
    "PETUGAS_RESIDU",
    "SUPER_USER",
    "ADMIN_DLH",
    "DEVELOPER",
    "PANITIA_TASKFORCE",
    "RW",
    "RT",
  ]),
  transactionController.updateStatus
);

export default router;
