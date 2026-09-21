/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { gisEksekutifService } from "../services/gisEksekutifService.js";

export class GisEksekutifController {
  /**
   * GET /api/v1/gis-eksekutif/overview
   * Mengembalikan seluruh data ringkasan eksekutif, KPI, grafik, fasilitas, dan sensor
   */
  async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const { kelurahan, rw, periode, jenisFasilitas, search } = req.query;

      const data = await gisEksekutifService.getOverview({
        kelurahan: kelurahan as string | undefined,
        rw: rw as string | undefined,
        periode: periode as string | undefined,
        jenisFasilitas: jenisFasilitas as string | undefined,
        search: search as string | undefined,
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error("[GisEksekutifController] getOverview error:", error);
      const fallback = gisEksekutifService.getBaselineOverview({}, error?.message);
      res.status(200).json({
        success: true,
        data: fallback,
      });
    }
  }

  /**
   * GET /api/v1/gis-eksekutif/facilities
   * Mengembalikan daftar fasilitas yang telah difilter
   */
  async getFacilities(req: Request, res: Response): Promise<void> {
    try {
      const { kelurahan, rw, jenisFasilitas, search } = req.query;

      const overview = await gisEksekutifService.getOverview({
        kelurahan: kelurahan as string | undefined,
        rw: rw as string | undefined,
        jenisFasilitas: jenisFasilitas as string | undefined,
        search: search as string | undefined,
      });

      res.status(200).json({
        success: true,
        data: overview.titikFasilitas,
      });
    } catch (error: any) {
      console.error("[GisEksekutifController] getFacilities error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal memuat fasilitas GIS",
      });
    }
  }

  /**
   * GET /api/v1/gis-eksekutif/export
   * Menghasilkan file ekspor CSV ringkasan kelurahan atau fasilitas
   */
  async exportCsv(req: Request, res: Response): Promise<void> {
    try {
      const { type = "kelurahan", kelurahan, rw, periode } = req.query;
      const overview = await gisEksekutifService.getOverview({
        kelurahan: kelurahan as string | undefined,
        rw: rw as string | undefined,
        periode: periode as string | undefined,
      });

      let csv = "";
      let filename = "";

      if (type === "fasilitas") {
        filename = `fasilitas-coblong-${Date.now()}.csv`;
        const headers = ["ID", "Nama Fasilitas", "Tipe", "Kelurahan", "RW", "Latitude", "Longitude", "PIC", "Kontak", "Kapasitas"];
        const rows = overview.titikFasilitas.map((f) => [
          `"${f.id}"`,
          `"${f.nama}"`,
          `"${f.tipe}"`,
          `"${f.kel}"`,
          `"${f.rw}"`,
          f.lat,
          f.lng,
          `"${f.pic || ""}"`,
          `"${f.kontak || ""}"`,
          f.kapasitas || "",
        ]);
        csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      } else {
        filename = `ringkasan-kepatuhan-coblong-${Date.now()}.csv`;
        const headers = ["Kelurahan", "Kepatuhan (%)", "Volume Sampah (m3/bln)", "Total Fasilitas Terdata", "Status"];
        const rows = overview.kepatuhanPerKelurahan.map((k) => [
          `"${k.nama}"`,
          k.kepatuhan,
          k.volume,
          k.totalFasilitas,
          k.kepatuhan >= 70 ? "Baik" : k.kepatuhan >= 60 ? "Sedang" : "Perlu Perhatian",
        ]);
        csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      }

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (error: any) {
      console.error("[GisEksekutifController] exportCsv error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Gagal mengekspor data CSV",
      });
    }
  }
}

export const gisEksekutifController = new GisEksekutifController();
