import { Router } from "express";
import { scheduleController } from "../controllers/scheduleController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, scheduleController.getAllSchedules);
router.post("/", authMiddleware, scheduleController.createSchedule);

export default router;
