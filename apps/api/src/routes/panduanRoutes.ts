import { Router } from "express";
import { panduanController } from "../controllers/panduanController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// Public / Authenticated read access
router.get("/", authMiddleware, panduanController.getAll);
router.get("/:id", authMiddleware, panduanController.getById);

// Super User / Developer write access
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  panduanController.create
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  panduanController.update
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  panduanController.delete
);

export default router;
