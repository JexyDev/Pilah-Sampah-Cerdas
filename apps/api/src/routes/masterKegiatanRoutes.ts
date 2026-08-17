import { Router } from "express";
import { masterKegiatanController } from "../controllers/masterKegiatanController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// Read access for authenticated users
router.get("/", authMiddleware, masterKegiatanController.getAll);
router.get("/:id", authMiddleware, masterKegiatanController.getById);

// Write access for SUPER_USER, DEVELOPER, ADMIN_DLH
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  masterKegiatanController.create
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  masterKegiatanController.update
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  masterKegiatanController.delete
);

export default router;
