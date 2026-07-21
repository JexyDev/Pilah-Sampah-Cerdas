/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { gamificationService } from "../services/gamificationService.js";
import { getScopingFilters } from "../utils/rbacScoping.js";

export class GamificationController {
  /**
   * Submit a recycle idea
   */
  async submitIdea(req: Request, res: Response): Promise<void> {
    try {
      const { judul, material, foto } = req.body;
      if (!judul || !material) {
        res.status(400).json({ success: false, code: "BAD_REQUEST", message: "judul dan material wajib diisi" });
        return;
      }
      const userId = req.user!.userId;
      const idea = await gamificationService.submitIdea(userId, judul, material, foto);
      res.status(201).json({ success: true, message: "Ide daur ulang berhasil diajukan", data: idea });
    } catch (error: any) {
      res.status(500).json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Get all recycle ideas based on scoping
   */
  async getIdeas(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const scoping = await getScopingFilters(user);
      const ideas = await gamificationService.getIdeas(scoping.userFilter);
      res.status(200).json({ success: true, data: ideas });
    } catch (error: any) {
      res.status(500).json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Approve a recycle idea (RW / Admin DLH)
   */
  async approveIdea(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminUserId = req.user!.userId;
      const idea = await gamificationService.approveIdea(id, adminUserId);
      res.status(200).json({ success: true, message: "Ide daur ulang disetujui, poin berhasil dikirim", data: idea });
    } catch (error: any) {
      res.status(400).json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Get gamification leaderboard (citizens and regions)
   */
  async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const leaderboard = await gamificationService.getLeaderboard();
      res.status(200).json({ success: true, data: leaderboard });
    } catch (error: any) {
      res.status(500).json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }
}

export const gamificationController = new GamificationController();
