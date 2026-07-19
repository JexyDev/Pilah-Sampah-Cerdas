import { pointRepository } from "../repositories/pointRepository.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
   * Get leaderboard
   */
  async getLeaderboard() {
    return pointRepository.getLeaderboard();
  }
}

export const pointService = new PointService();
