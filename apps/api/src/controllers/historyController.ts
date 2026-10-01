/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { Request, Response } from "express";
import { historyCutoffService } from "../services/historyCutoffService.js";

export const historyController = {
  /**
   * Sembunyikan item riwayat secara server-side (1-1 maupun multi-select)
   * POST /api/v1/history/exclude
   */
  async excludeItems(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: User ID tidak ditemukan dalam token",
        });
      }

      const { itemType, itemIds, itemId } = req.body;
      if (!itemType) {
        return res.status(400).json({
          success: false,
          message: "itemType wajib disertakan ('POINT' | 'WASTE_DEPOSIT' | 'KKN_ACTIVITY' | 'PETUGAS_TASK')",
        });
      }

      const targetIds: string[] = Array.isArray(itemIds)
        ? itemIds
        : itemId
        ? [itemId]
        : [];

      if (targetIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "itemIds (array) atau itemId (string) wajib disertakan",
        });
      }

      const excludedCount = await historyCutoffService.excludeItems(userId, itemType, targetIds);

      return res.status(200).json({
        success: true,
        message: `${excludedCount} item riwayat berhasil disembunyikan dari akun Anda`,
        data: {
          itemType: historyCutoffService.normalizeItemType(itemType),
          excludedCount,
        },
      });
    } catch (err: any) {
      console.error("[HistoryController.excludeItems] Error:", err);
      return res.status(500).json({
        success: false,
        message: "Gagal menyembunyikan item riwayat: " + err.message,
      });
    }
  },

  /**
   * Alias hapus 1-1 RESTful standard
   * DELETE /api/v1/history/exclude/:itemType/:itemId
   */
  async deleteItem(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: User ID tidak ditemukan dalam token",
        });
      }

      const { itemType, itemId } = req.params;
      if (!itemType || !itemId) {
        return res.status(400).json({
          success: false,
          message: "itemType dan itemId pada parameter rute wajib disertakan",
        });
      }

      await historyCutoffService.excludeItems(userId, itemType, [itemId]);

      return res.status(200).json({
        success: true,
        message: "Item riwayat berhasil disembunyikan",
      });
    } catch (err: any) {
      console.error("[HistoryController.deleteItem] Error:", err);
      return res.status(500).json({
        success: false,
        message: "Gagal menyembunyikan item riwayat: " + err.message,
      });
    }
  },
};
