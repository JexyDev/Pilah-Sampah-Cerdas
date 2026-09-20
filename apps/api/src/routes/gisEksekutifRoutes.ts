/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { gisEksekutifController } from "../controllers/gisEksekutifController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * Endpoint GIS Eksekutif Tata Kelola Sampah
 * Dilindungi oleh authMiddleware untuk memastikan sesi terverifikasi
 */
router.get("/overview", authMiddleware, (req, res) => gisEksekutifController.getOverview(req, res));
router.get("/facilities", authMiddleware, (req, res) => gisEksekutifController.getFacilities(req, res));
router.get("/export", authMiddleware, (req, res) => gisEksekutifController.exportCsv(req, res));

export default router;
