import { Router } from "express";
import { universitasController } from "../controllers/universitasController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/", authMiddleware, universitasController.getUniversitas);
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN_DLH"]),
  universitasController.createUniversitas
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN_DLH"]),
  universitasController.deleteUniversitas
);

export default router;
