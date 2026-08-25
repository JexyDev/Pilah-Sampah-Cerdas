/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { facilityService } from "../services/facilityService.js";
import { prisma } from "../lib/prisma.js";

export class FacilityController {
  /**
   * Create a new facility
   */
  async createFacility(req: Request, res: Response): Promise<void> {
    try {
      let { jenis, nama, pic, foto, kontak, kapasitas, latitude, longitude, alamat, rwId } = req.body;
      if (req.file) {
        foto = `/uploads/${req.file.filename}`;
      }
      const userId = (req as any).user?.userId;
      const peran = (req as any).user?.role;

      if (!jenis || !nama || !pic) {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "jenis, nama, dan pic wajib diisi",
        });
        return;
      }

      // Auto-resolve kelompokId & rwId jika MAHASISWA_KKN
      let kelompokId: string | undefined;
      let targetRwId: number | undefined =
        rwId !== undefined && !isNaN(Number(rwId)) && Number(rwId) > 0
          ? Number(rwId)
          : undefined;

      if (peran === "MAHASISWA_KKN" && userId) {
        const student = await prisma.studentKkn.findUnique({
          where: { userId },
          include: { kelompok: true, assignedRw: true },
        });
        kelompokId = student?.kelompokId ?? undefined;

        if (!targetRwId) {
          if (student?.assignedRwId) {
            targetRwId = student.assignedRwId;
          } else if (student?.kelompok?.cakupanRw) {
            try {
              const parsed =
                typeof student.kelompok.cakupanRw === "string"
                  ? JSON.parse(student.kelompok.cakupanRw)
                  : student.kelompok.cakupanRw;
              if (Array.isArray(parsed) && parsed.length > 0) targetRwId = Number(parsed[0]);
            } catch (_) {}
          }
        }
      }

      if (!targetRwId && (req as any).user?.rwId) {
        targetRwId = Number((req as any).user.rwId);
      }

      // Sanitasi input numerik agar tidak overflow pada database
      const safeKapasitas =
        kapasitas !== undefined && kapasitas !== null && kapasitas !== "" && !isNaN(Number(kapasitas))
          ? Math.min(Math.max(Number(kapasitas), 0), 99999999)
          : undefined;

      const safeLat = latitude !== undefined && !isNaN(Number(latitude)) ? Number(latitude) : 0.0;
      const safeLng = longitude !== undefined && !isNaN(Number(longitude)) ? Number(longitude) : 0.0;

      const facility = await facilityService.createFacility(
        jenis,
        nama,
        pic,
        foto,
        kontak,
        safeKapasitas,
        safeLat,
        safeLng,
        userId,
        kelompokId,
        alamat,
        targetRwId,
        "APPROVED"
      );
      res.status(201).json({ success: true, message: "Fasilitas berhasil dibuat", data: facility });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Get facilities list
   */
  async getFacilities(req: Request, res: Response): Promise<void> {
    try {
      const { jenis } = req.query;
      const user = (req as any).user;
      const list = await facilityService.getFacilities(jenis as string, user);
      res.status(200).json({ success: true, data: list });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Record production log
   */
  async recordProduction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { materialMasukKg, outputKg, jenisOutput, periode } = req.body;
      if (materialMasukKg === undefined || outputKg === undefined || !jenisOutput || !periode) {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "materialMasukKg, outputKg, jenisOutput, dan periode wajib diisi",
        });
        return;
      }
      const userId = (req as any).user?.userId;
      const log = await facilityService.recordProduction(
        id,
        Number(materialMasukKg),
        Number(outputKg),
        jenisOutput,
        periode,
        userId
      );
      res.status(201).json({ success: true, message: "Pencatatan produksi berhasil", data: log });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Verifikasi log produksi oleh RW/Petugas
   */
  async verifyProduction(req: Request, res: Response): Promise<void> {
    try {
      const { logId } = req.params;
      const verifiedByUserId = (req as any).user?.userId;
      const log = await facilityService.verifyProduction(logId, verifiedByUserId);
      res.status(200).json({ success: true, message: "Log produksi berhasil diverifikasi", data: log });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Create registered farm
   */
  async createFarm(req: Request, res: Response): Promise<void> {
    try {
      const { nama, pemilik, noWa, populasi, hasilPanenKg } = req.body;
      if (!nama || !pemilik || !noWa) {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "nama, pemilik, dan noWa wajib diisi",
        });
        return;
      }
      const farm = await facilityService.createFarm(nama, pemilik, noWa, populasi, hasilPanenKg);
      res
        .status(201)
        .json({ success: true, message: "Peternakan terdaftar berhasil dibuat", data: farm });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * List all registered farms
   */
  async getFarms(req: Request, res: Response): Promise<void> {
    try {
      const farms = await facilityService.getFarms();
      res.status(200).json({ success: true, data: farms });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }

  /**
   * Distribute maggot to farm
   */
  async distributeMaggot(req: Request, res: Response): Promise<void> {
    try {
      const { farmId, quantityKg } = req.body;
      if (!farmId || quantityKg === undefined) {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "farmId dan quantityKg wajib diisi",
        });
        return;
      }
      const log = await facilityService.distributeMaggot(farmId, Number(quantityKg));
      res
        .status(201)
        .json({ success: true, message: "Distribusi produk maggot berhasil dicatat", data: log });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }

  /**
   * Get master data jenis fasilitas
   */
  async getJenisFasilitas(req: Request, res: Response): Promise<void> {
    try {
      const data = await facilityService.getJenisFasilitas();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res
        .status(400)
        .json({ success: false, code: error.message || "BAD_REQUEST", message: error.message });
    }
  }
}

export const facilityController = new FacilityController();
