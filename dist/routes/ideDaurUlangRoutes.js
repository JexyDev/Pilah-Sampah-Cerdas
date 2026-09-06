import { Router } from "express";
import { ideDaurUlangController } from "../controllers/ideDaurUlangController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { uploadAvatarMiddleware } from "../middlewares/uploadMiddleware.js";
const router = Router();
// Endpoint for Warga and Admins to submit ide
router.post("/", authMiddleware, roleMiddleware(["WARGA", "SUPER_ADMIN", "ADMIN_DLH", "RW"]), uploadAvatarMiddleware.single("foto"), ideDaurUlangController.submitIde.bind(ideDaurUlangController));
// Endpoint for everyone to view all ideas (Social Feed)
router.get("/", authMiddleware, ideDaurUlangController.getIdeDaurUlang.bind(ideDaurUlangController));
// Endpoint for Warga to view their own ideas
router.get("/me", authMiddleware, roleMiddleware(["WARGA"]), ideDaurUlangController.getMyIde.bind(ideDaurUlangController));
// Endpoint for RW to approve ideas
router.put("/:id/approve", authMiddleware, roleMiddleware(["RW", "SUPER_ADMIN"]), ideDaurUlangController.approve.bind(ideDaurUlangController));
// Endpoint for RW to reject ideas
router.put("/:id/reject", authMiddleware, roleMiddleware(["RW", "SUPER_ADMIN"]), ideDaurUlangController.reject.bind(ideDaurUlangController));
// Endpoint for Admin to update ideas
router.put("/:id", authMiddleware, roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "RW"]), uploadAvatarMiddleware.single("foto"), ideDaurUlangController.updateIde.bind(ideDaurUlangController));
// Endpoint for Admin to delete ideas
router.delete("/:id", authMiddleware, roleMiddleware(["SUPER_ADMIN", "ADMIN_DLH", "RW"]), ideDaurUlangController.deleteIde.bind(ideDaurUlangController));
export default router;
