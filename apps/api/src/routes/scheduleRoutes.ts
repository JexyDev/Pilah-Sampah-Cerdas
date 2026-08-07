/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { scheduleController } from "../controllers/scheduleController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Schedules
 *   description: API Manajemen Jadwal (Absensi KKN, Pengangkutan, dll)
 */

/**
 * @swagger
 * /api/v1/schedules:
 *   get:
 *     summary: Mendapatkan semua jadwal
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan list jadwal
 */
router.get("/", authMiddleware, scheduleController.getAllSchedules);

/**
 * @swagger
 * /api/v1/schedules:
 *   post:
 *     summary: Membuat jadwal baru
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Jadwal berhasil dibuat
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "LURAH", "RW", "PETUGAS_RESIDU"]),
  scheduleController.createSchedule
);

/**
 * @swagger
 * /api/v1/schedules/{id}:
 *   delete:
 *     summary: Menghapus jadwal
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Jadwal berhasil dihapus
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER"]),
  scheduleController.deleteSchedule
);

/**
 * @swagger
 * /api/v1/schedules/{id}:
 *   put:
 *     summary: Update jadwal
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Jadwal berhasil diupdate
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "ADMIN_DLH", "LURAH", "RW", "PETUGAS_RESIDU"]),
  scheduleController.updateSchedule
);

export default router;
