/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Router } from "express";
import { historyController } from "../controllers/historyController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: History
 *   description: Non-destructive history exclusion management
 */

// Sembunyikan item riwayat (1-1 maupun multi-select)
router.post("/exclude", authMiddleware, historyController.excludeItems);

// Alias hapus 1-1 RESTful
router.delete("/exclude/:itemType/:itemId", authMiddleware, historyController.deleteItem);

export { router as historyRouter };
