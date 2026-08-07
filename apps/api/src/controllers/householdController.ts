/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { z } from "zod";
import { householdService } from "../services/householdService.js";

// Validation Schema for Registration
const registerSchema = z.object({
  address: z.string().min(5, "Alamat terlalu pendek"),
  rwId: z.number().int().positive("Area RT/RW tidak valid"),
  latitude: z.number().min(-90).max(90, "Latitude tidak valid"),
  longitude: z.number().min(-180).max(180, "Longitude tidak valid"),
});

export class HouseholdController {
  /**
   * Register a Household
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      // User payload is guaranteed to exist because of authMiddleware
      const userId = req.user!.userId;

      // 1. Validate Input
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "VALIDATION_ERROR", details: parsed.error.format() });
        return;
      }
      const { address, rwId, latitude, longitude } = parsed.data;

      // 2. Call Service
      const household = await householdService.registerHousehold(
        userId,
        address,
        rwId,
        latitude,
        longitude
      );

      // 3. Return response
      res.status(201).json({
        message: "Registrasi rumah tangga berhasil",
        data: household,
      });
    } catch (error: any) {
      if (error.message === "HOUSEHOLD_ALREADY_EXISTS") {
        res
          .status(409)
          .json({ error: "CONFLICT", message: "Anda sudah mendaftarkan rumah di area ini." });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mendaftarkan rumah tangga" });
      }
    }
  }

  /**
   * Get Current User's Households
   */
  async getMyHouseholds(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const households = await householdService.getHouseholdsByUser(userId);

      res.status(200).json({
        message: "Berhasil mengambil data",
        data: households,
      });
    } catch (error) {
      console.error("[HouseholdController] getMyHouseholds error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil data rumah tangga" });
    }
  }

  /**
   * Get all households in the system.
   */
  async getAllHouseholds(req: Request, res: Response): Promise<void> {
    try {
      const households = await householdService.getAllHouseholds();
      res.status(200).json({
        success: true,
        data: households,
      });
    } catch (error) {
      console.error("[HouseholdController] getAllHouseholds error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Gagal mengambil data rumah tangga",
      });
    }
  }

  /**
   * Get bins status summary for current user (Beranda Warga)
   */
  async getBinsSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const summary = await householdService.getBinsSummary(userId);

      res.status(200).json({
        success: true,
        message: "Berhasil mengambil ringkasan tempat sampah",
        data: summary,
      });
    } catch (error) {
      console.error("[HouseholdController] getBinsSummary error:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Gagal mengambil ringkasan tempat sampah",
      });
    }
  }
}

export const householdController = new HouseholdController();


