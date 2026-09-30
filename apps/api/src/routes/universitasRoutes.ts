import { Router } from "express";
import { universitasController } from "../controllers/universitasController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

const ALLOWED_ADMIN_ROLES = [
  "ADMIN_DLH",
  "SUPER_USER",
  "DEVELOPER",
  "PANITIA_TASKFORCE",
  "TASK_FORCE",
  "PEMIMPIN",
];

router.get("/", authMiddleware, universitasController.getUniversitas);
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ALLOWED_ADMIN_ROLES),
  universitasController.createUniversitas
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(ALLOWED_ADMIN_ROLES),
  universitasController.updateUniversitas
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ALLOWED_ADMIN_ROLES),
  universitasController.deleteUniversitas
);

export default router;
