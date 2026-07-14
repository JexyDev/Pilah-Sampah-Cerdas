import { Router } from "express";
import { transactionController } from "../controllers/transactionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transactions API for UI views
 */

router.get("/leaderboard", authMiddleware, transactionController.getLeaderboard);
router.get("/deposits", authMiddleware, transactionController.getDeposits);

export default router;
