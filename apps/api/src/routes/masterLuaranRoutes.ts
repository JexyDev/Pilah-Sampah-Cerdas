import { Router } from "express";
import { masterLuaranController } from "../controllers/masterLuaranController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// Read access for authenticated users
router.get("/", authMiddleware, masterLuaranController.getAll);
router.get("/:id", authMiddleware, masterLuaranController.getById);

// Write access for SUPER_USER, DEVELOPER, ADMIN_DLH
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  masterLuaranController.create
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  masterLuaranController.update
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["SUPER_USER", "DEVELOPER", "ADMIN_DLH"]),
  masterLuaranController.delete
);

export default router;
