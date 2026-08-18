import { prisma } from "../lib/prisma.js";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PointHistory } from "@prisma/client";


export class PointRepository {
  /**
   * Get point history by user ID, ordered by newest
   */
  async getHistoryByUserId(userId: string): Promise<PointHistory[]> {
    return prisma.pointHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get total accumulated points by user ID
   */
  async getTotalPoints(userId: string): Promise<number> {
    const aggregate = await prisma.pointHistory.aggregate({
      where: { userId },
      _sum: {
        points: true,
      },
    });
    return aggregate._sum.points || 0;
  }

  /**
   * Get leaderboard of Warga based on total points
   */
  async getLeaderboard(): Promise<any[]> {
    const users = await prisma.user.findMany({
      where: { role: { name: "WARGA" } },
      select: {
        id: true,
        name: true,
        fotoProfil: true,
        households: {
          select: {
            rw: { select: { name: true } },
          },
          take: 1,
        },
        pointHistory: {
          select: { points: true },
        },
      },
    });

    const leaderboard = users
      .map((u) => ({
        id: u.id,
        nama: u.name,
        fotoProfil: u.fotoProfil,
        rw: u.households.length > 0 ? u.households[0].rw.name : "RT/RW",
        poin: u.pointHistory.reduce((sum, p) => sum + p.points, 0),
      }))
      .sort((a, b) => b.poin - a.poin)
      .map((u, i) => ({
        rank: i + 1,
        ...u,
        bg: i === 0 ? "bg-green-100" : "bg-surface-container",
        color: i === 0 ? "text-green-700" : "text-on-surface",
      }));

    return leaderboard;
  }
}

export const pointRepository = new PointRepository();
