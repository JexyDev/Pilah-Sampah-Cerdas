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
 *     summary: Membuat jadwal baru (Termasuk pembuatan zona absensi, jam, dan jadwal kegiatan KKN)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - date
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               time:
 *                 type: string
 *                 description: "Jam kegiatan (misal: 08:00)"
 *               category:
 *                 type: string
 *                 description: "Kategori jadwal (misal: KKN, PENGANGKUTAN, dll)"
 *               location:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               radius:
 *                 type: number
 *                 description: "Radius zona absensi dalam meter"
 *               polygon:
 *                 type: string
 *                 description: "String JSON koordinat polygon zona absensi"
 *     responses:
 *       201:
 *         description: Jadwal berhasil dibuat
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware([
    "SUPER_USER",
    "ADMIN_DLH",
    "LURAH",
    "RW",
    "PETUGAS_RESIDU",
    "DPL",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ]),
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
  roleMiddleware(["SUPER_USER", "DPL", "PANITIA_TASKFORCE", "PEMIMPIN"]),
  scheduleController.deleteSchedule
);

/**
 * @swagger
 * /api/v1/schedules/{id}:
 *   put:
 *     summary: Update jadwal (zona, jam, detail kegiatan)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               time:
 *                 type: string
 *               category:
 *                 type: string
 *               location:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               radius:
 *                 type: number
 *               polygon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Jadwal berhasil diupdate
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware([
    "SUPER_USER",
    "ADMIN_DLH",
    "LURAH",
    "RW",
    "PETUGAS_RESIDU",
    "DPL",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ]),
  scheduleController.updateSchedule
);

export default router;
