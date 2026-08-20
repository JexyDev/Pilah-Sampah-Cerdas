import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { pointRepository } from "../repositories/pointRepository.js";


export class PointService {
  /**
   * Fetch point history and calculate total points for a user
   */
  async getLedger(userId: string) {
    const [history, totalPoints] = await Promise.all([
      pointRepository.getHistoryByUserId(userId),
      pointRepository.getTotalPoints(userId),
    ]);

    return {
      totalPoints,
      history,
    };
  }

  /**
   * Get total points
   */
  async getTotalPoints(userId: string) {
    return pointRepository.getTotalPoints(userId);
  }

  /**
   * Convert points to cash
   */
  async convertPoints(userId: string, points: number, ewalletType: string, phone: string) {
    const amountRupiah = points * 100;

    return prisma.$transaction(async (tx) => {
      const history = await tx.pointHistory.create({
        data: {
          userId,
          points: -points,
          description: `Konversi ${points} Poin ke Saldo ${ewalletType} (${phone})`,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          title: "Penukaran Poin Berhasil",
          message: `Penukaran ${points} Poin menjadi Rp ${amountRupiah.toLocaleString("id-ID")} ke ${ewalletType} (${phone}) sukses.`,
        },
      });

      return history;
    });
  }

  /**
   * Adjust points manually by Admin / RW
   */
  async adjustPoints(userId: string, points: number, description: string) {
    return prisma.$transaction(async (tx) => {
      const history = await tx.pointHistory.create({
        data: {
          userId,
          points,
          description: description || "Penyesuaian Poin Manual oleh Admin",
        },
      });

      await tx.notification.create({
        data: {
          userId,
          title: "Penyesuaian Poin",
          message: `Poin Anda telah disesuaikan sebesar ${points >= 0 ? "+" : ""}${points} poin: ${description}`,
        },
      });

      return history;
    });
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard() {
    return pointRepository.getLeaderboard();
  }
}

export const pointService = new PointService();
