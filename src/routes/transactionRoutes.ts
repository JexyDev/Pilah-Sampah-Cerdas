import { Router } from "express";
import { transactionController } from "../controllers/transactionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.get(
  "/deposits",
  authMiddleware,
  roleMiddleware(["ADMIN", "PETUGAS_RW", "PETUGAS_RT", "PETUGAS_KELURAHAN"]),
  transactionController.getDeposits
);
router.get(
  "/my-deposits",
  authMiddleware,
  roleMiddleware(["WARGA"]),
  transactionController.getMyDeposits
);

export default router;
