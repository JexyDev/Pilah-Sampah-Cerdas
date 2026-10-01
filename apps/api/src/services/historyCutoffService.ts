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
}

export const historyCutoffService = new HistoryCutoffService();
