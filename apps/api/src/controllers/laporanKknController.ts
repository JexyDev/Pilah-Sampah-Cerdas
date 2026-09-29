/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Laporan Resmi KKN UNIKOM - Controller
 */

import { Request, Response } from "express";
import { laporanKknService } from "../services/laporanKknService.js";

export const laporanKknController = {
  /**
   * GET /api/v1/laporan/kkn/summary
   * Mengambil data agregat lengkap laporan resmi eksekutif KKN
   */
  getLaporanSummary: async (req: Request, res: Response) => {
    try {
      const { kelurahan, rw, periode, kelompok, startDate, endDate, hari, jamMulai, jamSelesai } = req.query;
      const data = await laporanKknService.getLaporanSummary({
        kelurahan: kelurahan as string,
        rw: rw as string,
        periode: periode as string,
        kelompok: kelompok as string,
        startDate: startDate as string,
        endDate: endDate as string,
        hari: hari as string,
        jamMulai: jamMulai as string,
        jamSelesai: jamSelesai as string,
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error("[LaporanKknController] getLaporanSummary error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Gagal memuat ringkasan laporan resmi KKN UNIKOM",
      });
    }
  },

  /**
   * GET /api/v1/laporan/kkn/export
   * Mengunduh Laporan Resmi KKN format Spreadsheet Excel (.xlsx) Multi-Sheet
   */
  exportLaporanExcel: async (req: Request, res: Response) => {
    try {
      const { kelurahan, rw, periode, kelompok } = req.query;
      const buffer = await laporanKknService.exportLaporanExcel({
        kelurahan: kelurahan as string,
        rw: rw as string,
        periode: periode as string,
        kelompok: kelompok as string,
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Laporan_Resmi_KKN_UNIKOM_${Date.now()}.xlsx`
      );
      res.status(200).send(buffer);
    } catch (error: any) {
      console.error("[LaporanKknController] exportLaporanExcel error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Gagal mengunduh spreadsheet laporan resmi KKN",
      });
    }
  },

  /**
   * GET /api/v1/laporan/kkn/export-csv
   * Mengunduh Matriks Kinerja Kelompok KKN dalam format CSV mentah
   */
  exportLaporanCsv: async (req: Request, res: Response) => {
    try {
      const { kelurahan, rw, periode, kelompok } = req.query;
      const csvData = await laporanKknService.exportLaporanCsv({
        kelurahan: kelurahan as string,
        rw: rw as string,
        periode: periode as string,
        kelompok: kelompok as string,
      });

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Matriks_Kinerja_KKN_${Date.now()}.csv`
      );
      res.status(200).send(csvData);
    } catch (error: any) {
      console.error("[LaporanKknController] exportLaporanCsv error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Gagal mengunduh CSV matriks kinerja KKN",
      });
    }
  },
};
