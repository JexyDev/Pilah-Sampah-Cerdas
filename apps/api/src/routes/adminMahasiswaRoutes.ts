import { Router } from "express";
import { adminMahasiswaController } from "../controllers/adminMahasiswaController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// Protect all routes within this router
router.use(authMiddleware);
router.use(roleMiddleware(["SUPER_ADMIN"])); // Only Super Admin

router.get("/", adminMahasiswaController.getAll);
router.post("/", adminMahasiswaController.create);
router.put("/:id", adminMahasiswaController.update);
router.delete("/:id", adminMahasiswaController.delete);

export default router;
