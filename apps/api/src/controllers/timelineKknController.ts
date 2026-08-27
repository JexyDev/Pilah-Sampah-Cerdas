/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { timelineKknService } from "../services/timelineKknService.js";

export const timelineKknController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const userRole = String(req.user?.role || "").toUpperCase();
      const userId = req.user?.userId || (req.user as any)?.id;

      const { kelompokId, kelurahan, bidangKegiatan, fase, statusPelaksanaan, search, startDate, endDate } = req.query;

      const items = await timelineKknService.getAll(
        {
          kelompokId: kelompokId ? String(kelompokId) : undefined,
          kelurahan: kelurahan ? String(kelurahan) : undefined,
          bidangKegiatan: bidangKegiatan ? String(bidangKegiatan) : undefined,
          fase: fase ? String(fase) : undefined,
          statusPelaksanaan: statusPelaksanaan ? String(statusPelaksanaan) : undefined,
          search: search ? String(search) : undefined,
          startDate: startDate ? String(startDate) : undefined,
          endDate: endDate ? String(endDate) : undefined,
        },
        userId,
        userRole
      );

      const activeItem = items.find((i: any) => i.statusPelaksanaan === "SEDANG_BERJALAN");

      res.status(200).json({
        success: true,
        data: items,
        activeWeek: activeItem ? activeItem.tahapMinggu : (items[0]?.tahapMinggu || "Minggu 1"),
        activeFase: activeItem ? activeItem.fase : (items[0]?.fase || "Tahap Pelaksanaan"),
      });
    } catch (error: any) {
      console.error("[timelineKknController.getAll] error:", error);
      res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
      });
    }
  },

  /**
   * Endpoint Terstruktur Mobile Mahasiswa: Linimasa dengan Rekomendasi Aksi & Pertanyaan Kritis
   */
  getTimelineMahasiswa: async (req: Request, res: Response) => {
    try {
      const userRole = String(req.user?.role || "").toUpperCase();
      const userId = req.user?.userId || (req.user as any)?.id;

      const { kelompokId, kelurahan, bidangKegiatan, fase, statusPelaksanaan, search, startDate, endDate } = req.query;

      const result = await timelineKknService.getTimelineMahasiswa(
        {
          kelompokId: kelompokId ? String(kelompokId) : undefined,
          kelurahan: kelurahan ? String(kelurahan) : undefined,
          bidangKegiatan: bidangKegiatan ? String(bidangKegiatan) : undefined,
          fase: fase ? String(fase) : undefined,
          statusPelaksanaan: statusPelaksanaan ? String(statusPelaksanaan) : undefined,
          search: search ? String(search) : undefined,
          startDate: startDate ? String(startDate) : undefined,
          endDate: endDate ? String(endDate) : undefined,
        },
        userId,
        userRole
      );

      res.status(200).json({
        success: true,
        message: "Berhasil memuat linimasa program KKN beserta rekomendasi dan pertanyaan kritis",
        summary: result.summary,
        fases: result.fases,
        data: result.data,
      });
    } catch (error: any) {
      console.error("[timelineKknController.getTimelineMahasiswa] error:", error);
      res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = await timelineKknService.getById(id);

      if (!item) {
        res.status(404).json({
          success: false,
          message: "Data kegiatan linimasa tidak ditemukan",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error: any) {
      console.error("[timelineKknController.getById] error:", error);
      res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
      });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const {
        tahapMinggu,
        tanggal,
        startDate,
        endDate,
        fase,
        kegiatanUtama,
        outputTarget,
        picKeterangan,
        statusPelaksanaan,
        kelompokId,
      } = req.body;

      if (!tahapMinggu || !kegiatanUtama || !fase) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Tahap/Minggu, Fase, dan Kegiatan Utama wajib diisi",
        });
        return;
      }

      let parsedStartDate: Date | null = null;
      let parsedEndDate: Date | null = null;

      if (startDate) {
        const d = new Date(startDate);
        if (!isNaN(d.getTime())) parsedStartDate = d;
      }
      if (endDate) {
        const d = new Date(endDate);
        if (!isNaN(d.getTime())) parsedEndDate = d;
      }

      const item = await timelineKknService.create({
        tahapMinggu,
        tanggal: tanggal || "Sesuai Jadwal",
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        fase,
        kegiatanUtama,
        outputTarget: outputTarget || "-",
        picKeterangan: picKeterangan || "-",
        statusPelaksanaan: statusPelaksanaan || "BELUM_DIMULAI",
        kelompokId: kelompokId || null,
      });

      res.status(201).json({
        success: true,
        message: "Kegiatan linimasa berhasil ditambahkan",
        data: item,
      });
    } catch (error: any) {
      console.error("[timelineKknController.create] error:", error);
      res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        tahapMinggu,
        tanggal,
        startDate,
        endDate,
        fase,
        kegiatanUtama,
        outputTarget,
        picKeterangan,
        statusPelaksanaan,
        kelompokId,
      } = req.body;

      let parsedStartDate: Date | null | undefined = undefined;
      let parsedEndDate: Date | null | undefined = undefined;

      if (startDate !== undefined) {
        if (startDate) {
          const d = new Date(startDate);
          parsedStartDate = !isNaN(d.getTime()) ? d : null;
        } else {
          parsedStartDate = null;
        }
      }

      if (endDate !== undefined) {
        if (endDate) {
          const d = new Date(endDate);
          parsedEndDate = !isNaN(d.getTime()) ? d : null;
        } else {
          parsedEndDate = null;
        }
      }

      const item = await timelineKknService.update(id, {
        tahapMinggu,
        tanggal,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        fase,
        kegiatanUtama,
        outputTarget,
        picKeterangan,
        statusPelaksanaan,
        kelompokId,
      });

      res.status(200).json({
        success: true,
        message: "Kegiatan linimasa berhasil diperbarui",
        data: item,
      });
    } catch (error: any) {
      console.error("[timelineKknController.update] error:", error);
      res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
      });
    }
  },

  updateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { statusPelaksanaan } = req.body;

      if (!statusPelaksanaan) {
        res.status(400).json({
          success: false,
          message: "Field statusPelaksanaan wajib diisi",
        });
        return;
      }

      const item = await timelineKknService.updateStatus(id, statusPelaksanaan);
      res.status(200).json({
        success: true,
        message: "Status kegiatan berhasil diperbarui",
        data: item,
      });
    } catch (error: any) {
      console.error("[timelineKknController.updateStatus] error:", error);
      res.status(400).json({
        success: false,
        message: error?.message || "Internal server error",
      });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await timelineKknService.delete(id);

      res.status(200).json({
        success: true,
        message: "Kegiatan linimasa berhasil dihapus",
      });
    } catch (error: any) {
      console.error("[timelineKknController.delete] error:", error);
      res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
      });
    }
  },

  bulkImport: async (req: Request, res: Response) => {
    try {
      const { items, mode, kelompokId } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Data items harus berupa array dan tidak boleh kosong",
        });
        return;
      }

      const result = await timelineKknService.bulkImport(
        items,
        mode === "REPLACE" ? "REPLACE" : "APPEND",
        kelompokId || null
      );

      res.status(200).json({
        success: true,
        message: `Berhasil mengimpor ${result.importedCount} kegiatan linimasa`,
        data: result,
      });
    } catch (error: any) {
      console.error("[timelineKknController.bulkImport] error:", error);
      res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
      });
    }
  },

  seedDefaults: async (req: Request, res: Response) => {
    try {
      const { forceReplace } = req.body;
      await timelineKknService.seedDefaultCoblong(Boolean(forceReplace));

      res.status(200).json({
        success: true,
        message: "Berhasil menyinkronkan data acuan resmi 12 pekan KKN",
      });
    } catch (error: any) {
      console.error("[timelineKknController.seedDefaults] error:", error);
      res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
      });
    }
  },
};
