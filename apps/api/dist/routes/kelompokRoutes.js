import { Router } from "express";
import { kelompokController } from "../controllers/kelompokController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
const router = Router();
// Protect all routes with auth
router.use(authMiddleware);
// Only SUPER_ADMIN can manage Kelompok CRUD
router.get("/dpls", kelompokController.getDpls);
router.get("/", kelompokController.getAll);
router.get("/:id", kelompokController.getById);
router.post("/", roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH"]), kelompokController.create);
router.put("/:id", roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH"]), kelompokController.update);
router.put("/:id/leader", roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "DPL"]), kelompokController.setLeader);
router.delete("/:id", roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH"]), kelompokController.delete);
export default router;
