/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { prisma } from "../lib/prisma.js";

export enum HistoryScope {
  POINTS = "POINTS",
  WASTE_DEPOSITS = "WASTE_DEPOSITS",
  KKN_ACTIVITIES = "KKN_ACTIVITIES",
  PETUGAS_TASKS = "PETUGAS_TASKS",
}

export class HistoryCutoffService {
  /**
   * Set atau perbarui timestamp pembersihan riwayat untuk user tertentu
   */
  async setCutoff(userId: string, scope: HistoryScope): Promise<Date> {
    const now = new Date();
    try {
      if ((prisma as any).userHistoryCutoff) {
        await (prisma as any).userHistoryCutoff.upsert({
          where: {
            userId_scope: {
              userId,
              scope,
            },
          },
          update: {
            clearedAt: now,
          },
          create: {
            userId,
            scope,
            clearedAt: now,
          },
        });
      }
    } catch (e: any) {
      console.warn(`[HistoryCutoffService] Non-fatal setCutoff error for ${userId}:`, e?.message);
    }
    return now;
  }

  /**
   * Ambil waktu cutoff user untuk scope tertentu
   */
  async getCutoff(userId: string, scope: HistoryScope): Promise<Date | null> {
    try {
      if (!(prisma as any).userHistoryCutoff) return null;
      const record = await (prisma as any).userHistoryCutoff.findUnique({
        where: {
          userId_scope: {
            userId,
            scope,
          },
        },
        select: { clearedAt: true },
      });
      return record?.clearedAt || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Reset / Pulihkan riwayat kembali
   */
  async resetCutoff(userId: string, scope: HistoryScope): Promise<void> {
    try {
      if ((prisma as any).userHistoryCutoff) {
        await (prisma as any).userHistoryCutoff.deleteMany({
          where: { userId, scope },
        });
      }
    } catch (e: any) {
      console.warn(`[HistoryCutoffService] Non-fatal resetCutoff error for ${userId}:`, e?.message);
    }
  }

  /**
   * Normalisasi tipe item riwayat
   */
  normalizeItemType(type: string): string {
    const upper = (type || "").toUpperCase().trim();
    if (upper === "POINTS" || upper === "POINT") return "POINT";
    if (upper === "WASTE_DEPOSITS" || upper === "WASTE_DEPOSIT" || upper === "DEPOSIT") return "WASTE_DEPOSIT";
    if (upper === "KKN_ACTIVITIES" || upper === "KKN_ACTIVITY" || upper === "ACTIVITY") return "KKN_ACTIVITY";
    if (upper === "PETUGAS_TASKS" || upper === "PETUGAS_TASK" || upper === "TASK") return "PETUGAS_TASK";
    return upper;
  }

  /**
   * Sembunyikan item riwayat secara non-destructive server-side (1-1 atau multi-select)
   */
  async excludeItems(userId: string, itemType: string, itemIds: string[]): Promise<number> {
    if (!itemIds || itemIds.length === 0) return 0;
    const normalizedType = this.normalizeItemType(itemType);
    const validIds = [...new Set(itemIds.filter((id) => typeof id === "string" && id.trim().length > 0))];
    if (validIds.length === 0) return 0;

    let count = 0;
    for (const itemId of validIds) {
      try {
        if ((prisma as any).userHiddenHistoryItem) {
          await (prisma as any).userHiddenHistoryItem.upsert({
            where: {
              userId_itemType_itemId: {
                userId,
                itemType: normalizedType,
                itemId,
              },
            },
            update: {
              hiddenAt: new Date(),
            },
            create: {
              userId,
              itemType: normalizedType,
              itemId,
              hiddenAt: new Date(),
            },
          });
          count++;
        }
      } catch (err: any) {
        console.warn(`[HistoryCutoffService] excludeItem warning for ${userId}/${itemId}:`, err?.message);
      }
    }
    return count;
  }

  /**
   * Ambil daftar itemId yang dikecualikan/disembunyikan oleh user untuk kategori tertentu
   */
  async getExcludedItemIds(userId: string, itemType: string): Promise<string[]> {
    try {
      if (!(prisma as any).userHiddenHistoryItem) return [];
      const normalizedType = this.normalizeItemType(itemType);
      const rows = await (prisma as any).userHiddenHistoryItem.findMany({
        where: {
          userId,
          itemType: normalizedType,
        },
        select: { itemId: true },
      });
      return rows.map((r: any) => r.itemId);
    } catch {
      return [];
    }
  }
}

export const historyCutoffService = new HistoryCutoffService();
