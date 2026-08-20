/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { facilityService } from "../services/facilityService.js";

export class FacilityController {
  /**
   * Create a new facility
   */
  async createFacility(req: Request, res: Response): Promise<void> {
    try {
      const { jenis, nama, pic, foto, kontak, kapasitas, latitude, longitude } = req.body;
      if (!jenis || !nama || !pic) {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "jenis, nama, dan pic wajib diisi",
        });
        return;
      }
      const facility = await facilityService.createFacility(
        jenis,
        nama,
        pic,
        foto,
        kontak,
        kapasitas,
        latitude,
        longitude
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
      const list = await facilityService.getFacilities(jenis as string);
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
