/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { prisma } from "../lib/prisma.js";
import { HistoryScope } from "@prisma/client";

export class HistoryCutoffService {
  /**
   * Set atau perbarui timestamp pembersihan riwayat untuk user tertentu
   */
  async setCutoff(userId: string, scope: HistoryScope): Promise<Date> {
    const now = new Date();
    await prisma.userHistoryCutoff.upsert({
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
    return now;
  }

  /**
   * Ambil waktu cutoff user untuk scope tertentu
   */
  async getCutoff(userId: string, scope: HistoryScope): Promise<Date | null> {
    try {
      const record = await prisma.userHistoryCutoff.findUnique({
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
      console.warn(`[HistoryCutoffService] Failed to get cutoff for ${userId} - ${scope}:`, error);
      return null;
    }
  }

  /**
   * Reset / Pulihkan riwayat kembali
   */
  async resetCutoff(userId: string, scope: HistoryScope): Promise<void> {
    await prisma.userHistoryCutoff.deleteMany({
      where: { userId, scope },
    });
  }
}

export const historyCutoffService = new HistoryCutoffService();
