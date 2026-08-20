/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { configService } from "../services/configService.js";

export class ConfigController {
  /**
   * Get all configs
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const configs = await configService.getAllConfigs();
      res.status(200).json({ success: true, data: configs });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Update a config
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { key, value } = req.body;
      if (!key || value === undefined) {
        res
          .status(400)
          .json({ success: false, code: "BAD_REQUEST", message: "key dan value wajib diisi" });
        return;
      }
      const updated = await configService.updateConfig(key, String(value));
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }
  /**
   * Get Rule Engine structured configs
   */
  async getRuleEngine(req: Request, res: Response): Promise<void> {
    try {
      const data = await configService.getRuleEngineConfigs();
      res.status(200).json({ success: true, message: "Berhasil mengambil aturan Rule Engine", data });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Update Rule Engine structured configs in batch
   */
  async updateRuleEngine(req: Request, res: Response): Promise<void> {
    try {
      const updated = await configService.updateRuleEngineConfigs(req.body);
      res.status(200).json({ success: true, message: "Berhasil memperbarui aturan Rule Engine", data: updated });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }
}

export const configController = new ConfigController();
