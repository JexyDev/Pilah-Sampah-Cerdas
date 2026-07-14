import { Router } from "express";
import { scheduleController } from "../controllers/scheduleController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Schedules
 *   description: Schedules API (Mock)
 */

router.get("/", authMiddleware, scheduleController.getSchedules);

export default router;
