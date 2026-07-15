import { Router } from "express";
import { categoryController } from "../controllers/categoryController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/", authMiddleware, categoryController.getAll);
router.post("/", authMiddleware, roleMiddleware(["ADMIN"]), categoryController.create);
router.put("/:id", authMiddleware, roleMiddleware(["ADMIN"]), categoryController.update);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), categoryController.delete);

export default router;
