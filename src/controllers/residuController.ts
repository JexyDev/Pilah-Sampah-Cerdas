/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { residuService } from "../services/residuService.js";

export class ResiduController {
  async recordViolation(req: Request, res: Response) {
    try {
      const petugasUserId = req.user!.userId;
      const result = await residuService.recordViolation(petugasUserId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[ResiduController] recordViolation error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getDashboardSummary(req: Request, res: Response) {
    try {
      const petugasUserId = req.user!.userId;
      const data = await residuService.getDashboardSummary(petugasUserId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[ResiduController] getDashboardSummary error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAnalytics(req: Request, res: Response) {
    try {
      const data = await residuService.getAnalytics();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[ResiduController] getAnalytics error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const residuController = new ResiduController();
