/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { Request, Response } from "express";
import { systemAnalysisService } from "../services/systemAnalysisService.js";

export const systemAnalysisController = {
  async getKknAnalysis(req: Request, res: Response) {
    try {
      const kelompokId = req.query.kelompokId ? String(req.query.kelompokId) : undefined;
      const data = await systemAnalysisService.getKknAnalysis(kelompokId);
      return res.status(200).json({
        status: "success",
        data,
      });
    } catch (error: any) {
      console.error("Error in getKknAnalysis:", error);
      return res.status(500).json({
        status: "error",
        message: error?.message || "Terjadi kesalahan pada analitik KKN",
      });
    }
  },

  async getWasteGovernanceAnalysis(req: Request, res: Response) {
    try {
      const data = await systemAnalysisService.getWasteGovernanceAnalysis();
      return res.status(200).json({
        status: "success",
        data,
      });
    } catch (error: any) {
      console.error("Error in getWasteGovernanceAnalysis:", error);
      return res.status(500).json({
        status: "error",
        message: error?.message || "Terjadi kesalahan pada analitik tata kelola sampah",
      });
    }
  },

  async queryAiChat(req: Request, res: Response) {
    try {
      const { prompt, contextType, kelompokId } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({
          status: "error",
          message: "Prompt pertanyaan wajib diisi.",
        });
      }

      const result = await systemAnalysisService.queryAiChat(
        prompt,
        contextType === "tata-kelola" ? "tata-kelola" : "kkn",
        kelompokId ? String(kelompokId) : undefined
      );

      return res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error: any) {
      console.error("Error in queryAiChat:", error);
      return res.status(500).json({
        status: "error",
        message: error?.message || "Gagal memproses analitik AI",
      });
    }
  },
};

