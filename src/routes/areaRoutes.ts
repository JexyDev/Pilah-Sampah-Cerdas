/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 */

import { Router } from "express";
import { binController } from "../controllers/binController.js";

const router = Router();

// Route for drop-down list of RT/RW
router.get("/rt-rw", binController.getAreas);

export default router;
