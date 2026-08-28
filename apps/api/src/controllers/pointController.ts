/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { pointService } from "../services/pointService.js";

export class PointController {
  /**
   * Get point ledger for the current user
   */
  async getMyLedger(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const ledger = await pointService.getLedger(userId);

      res.status(200).json({
        success: true,
        data: ledger,
      });
    } catch (error) {
      console.error("Point Ledger Error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil riwayat poin" });
    }
  }

  /**
   * Get point ledger for a specific user (Admin only)
   */
  async getUserLedger(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const ledger = await pointService.getLedger(userId as string);

      res.status(200).json({
        success: true,
        data: ledger,
      });
    } catch (error) {
      console.error("Point Ledger Error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil riwayat poin user" });
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const leaderboard = await pointService.getLeaderboard();
      res.status(200).json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      console.error("Point Leaderboard Error:", error);
      res
        .status(500)
        .json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil leaderboard" });
    }
  }

  /**
   * Adjust points manually
   */
  async adjustPoints(req: Request, res: Response): Promise<void> {
    try {
      const { userId, points, description } = req.body;
      if (!userId || points === undefined) {
        res
          .status(400)
          .json({ error: "VALIDATION_ERROR", message: "UserId dan jumlah poin wajib diisi" });
        return;
      }

      const result = await pointService.adjustPoints(userId, Number(points), description);
      res.status(200).json({
        success: true,
        data: result,
        message: "Poin berhasil disesuaikan",
      });
    } catch (error) {
      console.error("Point Adjust Error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal menyesuaikan poin" });
    }
  }

  /**
   * Convert user points to cash (Saldo E-Wallet)
   */
  async convertPoints(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      error: "NOT_IMPLEMENTED",
      message: "Fitur penukaran poin belum tersedia (ditangguhkan sesuai arahan dinas).",
    });
  }

  /**
   * [DEVELOPER ONLY] Get all users with points, filtering, and pagination
   */
  async getAdminUsersPoints(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, role, rwId, kelurahanId, sortBy, sortOrder, minPoints, maxPoints } = req.query;

      const data = await pointService.getAdminUsers({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        role: role as string,
        rwId: rwId ? Number(rwId) : undefined,
        kelurahanId: kelurahanId as string,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        minPoints: minPoints !== undefined && minPoints !== "" ? Number(minPoints) : undefined,
        maxPoints: maxPoints !== undefined && maxPoints !== "" ? Number(maxPoints) : undefined,
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Developer Get Users Points Error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil direktori poin pengguna" });
    }
  }

  /**
   * [DEVELOPER ONLY] Get overview stats of points in the system
   */
  async getAdminPointsStats(req: Request, res: Response): Promise<void> {
    try {
      const data = await pointService.getAdminStats();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Developer Get Points Stats Error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil ringkasan statistik poin" });
    }
  }

  /**
   * [DEVELOPER ONLY] Get global ledger transactions feed
   */
  async getAdminLedgerFeed(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, kategori, userId, type, startDate, endDate } = req.query;

      const data = await pointService.getAdminLedger({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        kategori: kategori as string,
        userId: userId as string,
        type: type as any,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Developer Get Ledger Feed Error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil riwayat buku besar poin" });
    }
  }

  /**
   * [DEVELOPER ONLY] Get single user ledger details
   */
  async getAdminUserLedger(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { page, limit } = req.query;

      const data = await pointService.getAdminUserLedger(
        userId as string,
        page ? Number(page) : 1,
        limit ? Number(limit) : 20
      );

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Developer Get User Ledger Error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mengambil rincian mutasi poin pengguna" });
    }
  }

  /**
   * [DEVELOPER ONLY] Adjust points for single user
   */
  async adjustPointsDeveloper(req: Request, res: Response): Promise<void> {
    try {
      const developerUserId = req.user!.userId;
      const { userId, points, kategori, description, sendNotification } = req.body;

      if (!userId || points === undefined) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "UserId dan nominal poin wajib diisi" });
        return;
      }

      if (!description || !description.trim()) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "Keterangan/alasan penyesuaian wajib diisi" });
        return;
      }

      const ipAddress = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "") as string;

      const result = await pointService.adjustPointsDeveloper({
        developerUserId,
        userId,
        points: Number(points),
        kategori,
        description: description.trim(),
        sendNotification: sendNotification !== false,
        ipAddress,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: `Poin pengguna berhasil disesuaikan (${Number(points) >= 0 ? "+" : ""}${Number(points)} poin)`,
      });
    } catch (error: any) {
      console.error("Developer Adjust Points Error:", error);
      const status = error.message === "USER_NOT_FOUND" ? 404 : 500;
      res.status(status).json({
        error: error.message === "USER_NOT_FOUND" ? "USER_NOT_FOUND" : "INTERNAL_SERVER_ERROR",
        message: error.message === "USER_NOT_FOUND" ? "Pengguna tidak ditemukan" : "Gagal menyesuaikan poin pengguna",
      });
    }
  }

  /**
   * [DEVELOPER ONLY] Set exact balance for a user
   */
  async setBalanceDeveloper(req: Request, res: Response): Promise<void> {
    try {
      const developerUserId = req.user!.userId;
      const { userId, targetBalance, description, sendNotification } = req.body;

      if (!userId || targetBalance === undefined || isNaN(Number(targetBalance))) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "UserId dan target saldo poin wajib diisi" });
        return;
      }

      const ipAddress = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "") as string;

      const result = await pointService.setBalanceDeveloper({
        developerUserId,
        userId,
        targetBalance: Number(targetBalance),
        description: description?.trim(),
        sendNotification: sendNotification !== false,
        ipAddress,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: `Saldo poin pengguna berhasil dikalibrasi menjadi ${Number(targetBalance)} poin`,
      });
    } catch (error: any) {
      console.error("Developer Set Balance Error:", error);
      const status = error.message === "USER_NOT_FOUND" ? 404 : 500;
      res.status(status).json({
        error: error.message === "USER_NOT_FOUND" ? "USER_NOT_FOUND" : "INTERNAL_SERVER_ERROR",
        message: error.message === "USER_NOT_FOUND" ? "Pengguna tidak ditemukan" : "Gagal mengatur saldo poin pengguna",
      });
    }
  }

  /**
   * [DEVELOPER ONLY] Bulk adjust points for multiple users
   */
  async bulkAdjustPointsDeveloper(req: Request, res: Response): Promise<void> {
    try {
      const developerUserId = req.user!.userId;
      const { userIds, points, kategori, description, sendNotification } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || points === undefined) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "Daftar ID pengguna dan nominal poin wajib diisi" });
        return;
      }

      if (!description || !description.trim()) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "Keterangan/alasan perubahan massal wajib diisi" });
        return;
      }

      const ipAddress = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "") as string;

      const result = await pointService.bulkAdjustPointsDeveloper({
        developerUserId,
        userIds,
        points: Number(points),
        kategori,
        description: description.trim(),
        sendNotification: sendNotification !== false,
        ipAddress,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: `Penyesuaian massal berhasil diterapkan pada ${result.processedCount} pengguna (${Number(points) >= 0 ? "+" : ""}${Number(points)} poin)`,
      });
    } catch (error) {
      console.error("Developer Bulk Adjust Points Error:", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal memproses penyesuaian poin massal" });
    }
  }

  /**
   * [DEVELOPER ONLY] Edit point transaction description or category
   */
  async updateTransactionDeveloper(req: Request, res: Response): Promise<void> {
    try {
      const developerUserId = req.user!.userId;
      const { id } = req.params;
      const { description, kategori } = req.body;

      const ipAddress = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "") as string;

      const result = await pointService.updateTransactionDeveloper({
        developerUserId,
        transactionId: id,
        description: description?.trim(),
        kategori: kategori?.trim(),
        ipAddress,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: "Data transaksi poin berhasil diperbarui",
      });
    } catch (error: any) {
      console.error("Developer Update Transaction Error:", error);
      const status = error.message === "TRANSACTION_NOT_FOUND" ? 404 : 500;
      res.status(status).json({
        error: error.message === "TRANSACTION_NOT_FOUND" ? "TRANSACTION_NOT_FOUND" : "INTERNAL_SERVER_ERROR",
        message: error.message === "TRANSACTION_NOT_FOUND" ? "Transaksi tidak ditemukan" : "Gagal memperbarui transaksi",
      });
    }
  }

  /**
   * [DEVELOPER ONLY] Void / Reversal a transaction
   */
  async voidTransactionDeveloper(req: Request, res: Response): Promise<void> {
    try {
      const developerUserId = req.user!.userId;
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        res.status(400).json({ error: "VALIDATION_ERROR", message: "Alasan pembatalan transaksi wajib disertakan" });
        return;
      }

      const ipAddress = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "") as string;

      const result = await pointService.voidTransactionDeveloper({
        developerUserId,
        transactionId: id,
        reason: reason.trim(),
        ipAddress,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: "Transaksi poin berhasil dibatalkan (reversal tercatat)",
      });
    } catch (error: any) {
      console.error("Developer Void Transaction Error:", error);
      const status = error.message === "TRANSACTION_NOT_FOUND" ? 404 : 500;
      res.status(status).json({
        error: error.message === "TRANSACTION_NOT_FOUND" ? "TRANSACTION_NOT_FOUND" : "INTERNAL_SERVER_ERROR",
        message: error.message === "TRANSACTION_NOT_FOUND" ? "Transaksi tidak ditemukan" : "Gagal membatalkan transaksi",
      });
    }
  }
}

export const pointController = new PointController();

