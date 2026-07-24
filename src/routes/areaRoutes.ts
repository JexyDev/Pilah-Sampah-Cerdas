/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { Router } from "express";
import { binController } from "../controllers/binController.js";

const router = Router();

// Route for drop-down list of RT/RW
router.get("/rt-rw", binController.getAreas);

export default router;
