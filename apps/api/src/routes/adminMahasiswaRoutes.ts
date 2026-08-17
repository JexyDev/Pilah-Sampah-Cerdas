import { Router } from "express";
import { adminMahasiswaController } from "../controllers/adminMahasiswaController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// Protect all routes within this router
router.use(authMiddleware);

router.get(
  "/",
  roleMiddleware([
    "DEVELOPER",
    "SUPER_USER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
    "DPL",
  ]),
  adminMahasiswaController.getAll
);

router.post(
  "/",
  roleMiddleware(["DEVELOPER", "SUPER_USER", "PANITIA_TASKFORCE"]),
  adminMahasiswaController.create
);

router.put(
  "/:id",
  roleMiddleware(["DEVELOPER", "SUPER_USER", "PANITIA_TASKFORCE"]),
  adminMahasiswaController.update
);

router.delete(
  "/:id",
  roleMiddleware(["DEVELOPER", "SUPER_USER", "PANITIA_TASKFORCE"]),
  adminMahasiswaController.delete
);

export default router;
