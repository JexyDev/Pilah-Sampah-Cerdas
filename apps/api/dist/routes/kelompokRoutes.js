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
router.post("/", roleMiddleware(["SUPER_ADMIN"]), kelompokController.create);
router.put("/:id", roleMiddleware(["SUPER_ADMIN"]), kelompokController.update);
router.delete("/:id", roleMiddleware(["SUPER_ADMIN"]), kelompokController.delete);
export default router;
