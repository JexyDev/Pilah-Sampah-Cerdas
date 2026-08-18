/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { surveiKknService } from "../services/surveiKknService.js";

export class SurveiKknController {
  /**
   * POST /api/v1/survei-kkn/import
   * Upload dan impor file XLSX survei KKN ke database.
   */
  async importSurveiKkn(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "File tidak ditemukan. Silakan upload file .xlsx",
        });
        return;
      }

      // 1. Parse workbook
      const data = surveiKknService.parseWorkbook(req.file.buffer);

      // 2. Validasi data
      const errors = surveiKknService.validateData(data);
      if (errors.length) {
        res.status(422).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Validasi data gagal",
          errors,
        });
        return;
      }

      // 3. Import ke database
      const userId = req.user!.userId;
      const filename = req.file.originalname;
      const surveyType = ((req.query.type || req.query.tipe) as string) || "BASELINE";
      const result = await surveiKknService.importToDatabase(data, userId, filename, surveyType);

      res.status(200).json({
        success: true,
        message: `Impor data survei KKN (${surveyType}) berhasil`,
        data: {
          importLogId: result.importLogId,
          summary: result.summary,
        },
      });
    } catch (error: any) {
      console.error("[surveiKknController] importSurveiKkn error:", error);

      if (error.message?.includes("Sheet tidak ditemukan")) {
        res.status(422).json({
          success: false,
          error: "INVALID_FORMAT",
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal mengimpor data survei KKN",
      });
    }
  }

  /**
   * GET /api/v1/survei-kkn/import/history
   * Ambil riwayat impor survei KKN.
   */
  async getImportHistory(_req: Request, res: Response): Promise<void> {
    try {
      const history = await surveiKknService.getImportHistory();
      res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      console.error("[surveiKknController] getImportHistory error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memuat riwayat impor",
      });
    }
  }

  /**
   * GET /api/v1/survei-kkn/template
   * Download file template XLSX survei KKN.
   */
  async downloadTemplate(_req: Request, res: Response): Promise<void> {
    try {
      // Cari template di beberapa lokasi yang mungkin
      const possiblePaths = [
        path.resolve("docs/raw_data_terbaru.xlsx"),
        path.resolve("../../docs/raw_data_terbaru.xlsx"),
        path.resolve("docs/raw_new_data.xlsx"),
        path.resolve("../../docs/raw_new_data.xlsx"),
      ];

      let templatePath: string | null = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          templatePath = p;
          break;
        }
      }

      if (!templatePath) {
        res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: "File template tidak ditemukan di server",
        });
        return;
      }

      res.download(templatePath, "template_survei_kkn.xlsx", (err) => {
        if (err) {
          console.error("[surveiKknController] downloadTemplate error:", err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: "INTERNAL_SERVER_ERROR",
              message: "Gagal mengunduh file template",
            });
          }
        }
      });
    } catch (error: any) {
      console.error("[surveiKknController] downloadTemplate error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal mengunduh template",
      });
    }
  }

  /**
   * GET /api/v1/survei-kkn/
   * Ambil daftar survei dengan paginasi dan pencarian.
   */
  async getAllSurveys(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";

      const role = req.user?.role;
      const userId = req.user?.userId;

      const result = await surveiKknService.getAllSurveys(page, limit, search, role, userId);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error: any) {
      console.error("[surveiKknController] getAllSurveys error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memuat data survei",
      });
    }
  }

  /**
   * GET /api/v1/survei-kkn/:id
   * Ambil detail survei beserta relasinya berdasarkan ID kelurahan.
   */
  async getSurveyById(req: Request, res: Response): Promise<void> {
    try {
      const kelurahanId = parseInt(req.params.id);
      if (isNaN(kelurahanId)) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "ID Kelurahan tidak valid",
        });
        return;
      }

      const role = (req as any).user?.role;
      const userId = (req as any).user?.userId || (req as any).user?.id;

      const survey = await surveiKknService.getSurveyById(kelurahanId, role, userId);

      if (!survey) {
        res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: "Data survei tidak ditemukan",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: survey,
      });
    } catch (error: any) {
      console.error("[surveiKknController] getSurveyById error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({
          success: false,
          error: "FORBIDDEN",
          message: "Anda tidak memiliki hak akses untuk melihat data survei kelurahan di luar wilayah binaan Anda",
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memuat detail survei",
      });
    }
  }

  /**
   * GET /api/v1/survei-kkn/mahasiswa/my-survei
   * Ambil data survei kelurahan berdasarkan kelurahan yang di-assign ke Mahasiswa KKN.
   */
  async getMySurvey(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: "UNAUTHORIZED",
          message: "Akses ditolak, user tidak valid",
        });
        return;
      }

      const survey = await surveiKknService.getMySurvey(userId);

      if (!survey) {
        res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: "Data survei tidak ditemukan untuk wilayah penugasan Anda",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: survey,
      });
    } catch (error: any) {
      console.error("[surveiKknController] getMySurvey error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memuat detail survei mahasiswa",
      });
    }
  }

  /**
   * PUT /api/v1/survei-kkn/:id
   * Update data survei kelurahan beserta seluruh relasinya
   */
  async updateSurvey(req: Request, res: Response): Promise<void> {
    try {
      const kelurahanId = parseInt(req.params.id);
      if (isNaN(kelurahanId)) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "ID Kelurahan tidak valid",
        });
        return;
      }

      const role = req.user?.role;
      const userId = req.user?.userId;
      const payload = req.body;

      const updated = await surveiKknService.updateSurvey(kelurahanId, payload, role, userId);

      res.status(200).json({
        success: true,
        message: "Data survei berhasil diperbarui",
        data: updated,
      });
    } catch (error: any) {
      console.error("[surveiKknController] updateSurvey error:", error);
      if (error.message === "FORBIDDEN_SCOPE") {
        res.status(403).json({ success: false, message: "Akses ditolak: Survei ini bukan milik kelompok KKN Anda." });
        return;
      }
      if (error.message === "NOT_FOUND") {
        res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: "Data survei kelurahan tidak ditemukan",
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memperbarui data survei",
      });
    }
  }

  async updateSurveyById(req: Request, res: Response): Promise<void> {
    return this.updateSurvey(req, res);
  }
}

export const surveiKknController = new SurveiKknController();
