import { Request, Response } from "express";
import { transactionService } from "../services/transactionService.js";

export class TransactionController {
  async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const data = await transactionService.getLeaderboard();
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to get leaderboard" });
    }
  }

  async getDeposits(req: Request, res: Response): Promise<void> {
    try {
      const data = await transactionService.getDeposits();
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to get deposits" });
    }
  }
}

export const transactionController = new TransactionController();
