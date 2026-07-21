/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { kknService } from "../services/kknService.js";

export class KknController {
  async getDashboardStats(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const data = await kknService.getDashboardStats(kknUserId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getDashboardStats error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async registerWarga(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const result = await kknService.registerWarga(kknUserId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error("[KknController] registerWarga error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getRegisteredWarga(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const rtRwId = req.query.rtRwId ? parseInt(req.query.rtRwId as string, 10) : undefined;
      const search = req.query.search as string | undefined;

      const data = await kknService.getRegisteredWarga(kknUserId, { rtRwId, search });
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getRegisteredWarga error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getWargaDetail(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const { wargaId } = req.params;
      const data = await kknService.getWargaDetail(kknUserId, wargaId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getWargaDetail error:", error);
      const code = error.message === "UNAUTHORIZED_ACCESS_SCOPE" ? 403 : 500;
      res.status(code).json({ success: false, message: error.message });
    }
  }

  async getUnregisteredHouses(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const data = await kknService.getUnregisteredHouses(kknUserId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getUnregisteredHouses error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getActivityLog(req: Request, res: Response) {
    try {
      const kknUserId = req.user!.userId;
      const data = await kknService.getActivityLog(kknUserId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error("[KknController] getActivityLog error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const kknController = new KknController();
