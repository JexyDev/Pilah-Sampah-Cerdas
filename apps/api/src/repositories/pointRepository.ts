import { prisma } from "../lib/prisma.js";
const db = prisma as any;
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PointHistory } from "@prisma/client";


export interface GetAdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  rwId?: number;
  kelurahanId?: string;
  sortBy?: "totalPoints" | "name" | "createdAt" | "lastTransactionAt";
  sortOrder?: "asc" | "desc";
  minPoints?: number;
  maxPoints?: number;
}

export interface GetAdminLedgerParams {
  page?: number;
  limit?: number;
  search?: string;
  kategori?: string;
  userId?: string;
  type?: "all" | "positive" | "negative";
  startDate?: string;
  endDate?: string;
}

export class PointRepository {
  /**
   * Get point history by user ID, ordered by newest
   */
  async getHistoryByUserId(userId: string): Promise<PointHistory[]> {
    return db.pointHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get total accumulated points by user ID
   */
  async getTotalPoints(userId: string): Promise<number> {
    const aggregate = await db.pointHistory.aggregate({
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
    const users = await db.user.findMany({
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
      .map((u: any) => ({
        id: u.id,
        nama: u.name,
        fotoProfil: u.fotoProfil,
        rw: u.households?.length > 0 ? u.households[0].rw?.name : "RT/RW",
        poin: (u.pointHistory || []).reduce((sum: number, p: any) => sum + p.points, 0),
      }))
      .sort((a: any, b: any) => b.poin - a.poin)
      .map((u: any, i: number) => ({
        rank: i + 1,
        ...u,
        bg: i === 0 ? "bg-green-100" : "bg-surface-container",
        color: i === 0 ? "text-green-700" : "text-on-surface",
      }));

    return leaderboard;
  }

  /**
   * Get developer admin user points list with filtering, search, and pagination
   */
  async getAdminUsersPoints(params: GetAdminUsersParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 10));
    const search = params.search?.trim();
    const roleFilter = params.role?.trim();
    const rwId = params.rwId ? Number(params.rwId) : undefined;
    const kelurahanId = params.kelurahanId?.trim();
    const sortBy = params.sortBy || "totalPoints";
    const sortOrder = params.sortOrder === "asc" ? "asc" : "desc";

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (roleFilter && roleFilter !== "ALL") {
      whereClause.role = { name: roleFilter };
    }

    if (rwId) {
      whereClause.rwId = rwId;
    }

    if (kelurahanId) {
      whereClause.rw = { kelurahanId };
    }

    // Fetch users with their point histories and profile details
    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        phone: true,
        fotoProfil: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
        rw: {
          select: {
            id: true,
            name: true,
            kelurahan: { select: { id: true, name: true } },
          },
        },
        studentProfile: {
          select: {
            nim: true,
            jurusan: true,
            fakultas: true,
            kelompok: { select: { id: true, name: true } },
          },
        },
        pointHistory: {
          select: {
            id: true,
            points: true,
            description: true,
            kategori: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Map each user to calculate totalPoints, transactionCount, and lastTransactionAt
    let processedUsers = users.map((u: any) => {
      const ph = u.pointHistory || [];
      const totalPoints = ph.reduce((sum: number, item: any) => sum + item.points, 0);
      const transactionCount = ph.length;
      const lastTransactionAt = ph.length > 0 ? ph[0].createdAt : null;

      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        fotoProfil: u.fotoProfil,
        createdAt: u.createdAt,
        role: u.role?.name || "UNKNOWN",
        roleId: u.role?.id,
        rw: u.rw ? u.rw.name : null,
        rwId: u.rw?.id || null,
        kelurahan: u.rw?.kelurahan?.name || null,
        kelurahanId: u.rw?.kelurahan?.id || null,
        nim: u.studentProfile?.nim || null,
        jurusan: u.studentProfile?.jurusan || null,
        kelompok: u.studentProfile?.kelompok?.name || null,
        totalPoints,
        transactionCount,
        lastTransactionAt,
      };
    });

    // Min / Max point filter
    if (params.minPoints !== undefined && !isNaN(Number(params.minPoints))) {
      processedUsers = processedUsers.filter((u: any) => u.totalPoints >= Number(params.minPoints));
    }
    if (params.maxPoints !== undefined && !isNaN(Number(params.maxPoints))) {
      processedUsers = processedUsers.filter((u: any) => u.totalPoints <= Number(params.maxPoints));
    }

    // Sort users
    processedUsers.sort((a: any, b: any) => {
      if (sortBy === "totalPoints") {
        return sortOrder === "asc" ? a.totalPoints - b.totalPoints : b.totalPoints - a.totalPoints;
      }
      if (sortBy === "name") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortBy === "lastTransactionAt") {
        const timeA = a.lastTransactionAt ? new Date(a.lastTransactionAt).getTime() : 0;
        const timeB = b.lastTransactionAt ? new Date(b.lastTransactionAt).getTime() : 0;
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });

    const total = processedUsers.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedUsers = processedUsers.slice(startIndex, startIndex + limit);

    return {
      users: paginatedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get developer admin stats for points circulation
   */
  async getAdminPointsStats() {
    const allHistory = await db.pointHistory.findMany({
      select: {
        points: true,
        userId: true,
        createdAt: true,
      },
    });

    const totalUsersCount = await db.user.count();

    let totalPointsInCirculation = 0;
    let totalPositivePoints = 0;
    let totalNegativePoints = 0;
    const userPointsMap: Record<string, number> = {};

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let last30DaysTransactions = 0;
    let last30DaysPoints = 0;

    for (const h of allHistory) {
      totalPointsInCirculation += h.points;
      if (h.points > 0) {
        totalPositivePoints += h.points;
      } else {
        totalNegativePoints += Math.abs(h.points);
      }

      userPointsMap[h.userId] = (userPointsMap[h.userId] || 0) + h.points;

      if (new Date(h.createdAt) >= thirtyDaysAgo) {
        last30DaysTransactions += 1;
        last30DaysPoints += h.points;
      }
    }

    const uniqueUsersWithPoints = Object.keys(userPointsMap).length;
    const averagePointsPerUser =
      uniqueUsersWithPoints > 0
        ? Math.round((totalPointsInCirculation / uniqueUsersWithPoints) * 10) / 10
        : 0;

    // Find top user
    let topUserId: string | null = null;
    let topUserPoints = -Infinity;
    for (const [uid, pts] of Object.entries(userPointsMap)) {
      if (pts > topUserPoints) {
        topUserPoints = pts;
        topUserId = uid;
      }
    }

    let topUser: any = null;
    if (topUserId && topUserPoints > -Infinity) {
      const u = await db.user.findUnique({
        where: { id: topUserId },
        select: { id: true, name: true, role: { select: { name: true } } },
      });
      if (u) {
        topUser = {
          id: u.id,
          name: u.name,
          role: u.role?.name,
          points: topUserPoints,
        };
      }
    }

    return {
      totalPointsInCirculation,
      totalPositivePoints,
      totalNegativePoints,
      totalTransactions: allHistory.length,
      totalUsersCount,
      uniqueUsersWithPoints,
      averagePointsPerUser,
      last30DaysTransactions,
      last30DaysPoints,
      topUser,
    };
  }

  /**
   * Get global point ledger transactions feed
   */
  async getAdminLedgerFeed(params: GetAdminLedgerParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 15));
    const search = params.search?.trim();
    const kategori = params.kategori?.trim();
    const userId = params.userId?.trim();
    const type = params.type;

    const whereClause: any = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (kategori && kategori !== "ALL") {
      whereClause.kategori = kategori;
    }

    if (type === "positive") {
      whereClause.points = { gt: 0 };
    } else if (type === "negative") {
      whereClause.points = { lt: 0 };
    }

    if (params.startDate || params.endDate) {
      whereClause.createdAt = {};
      if (params.startDate) {
        whereClause.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    if (search) {
      whereClause.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { phone: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, transactions] = await Promise.all([
      db.pointHistory.count({ where: whereClause }),
      db.pointHistory.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              role: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      transactions: transactions.map((t: any) => ({
        id: t.id,
        userId: t.userId,
        userName: t.user?.name || "Pengguna Dihapus",
        userPhone: t.user?.phone || null,
        userRole: t.user?.role?.name || "UNKNOWN",
        points: t.points,
        description: t.description,
        kategori: t.kategori,
        redeemable: t.redeemable,
        createdAt: t.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get ledger history of a specific user with summary
   */
  async getAdminUserLedger(userId: string, page = 1, limit = 20) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        fotoProfil: true,
        createdAt: true,
        role: { select: { name: true } },
        rw: { select: { name: true, kelurahan: { select: { name: true } } } },
        studentProfile: { select: { nim: true, jurusan: true, kelompok: { select: { id: true, name: true } } } },
      },
    });

    if (!user) throw new Error("USER_NOT_FOUND");

    const [total, totalPointsAgg, transactions] = await Promise.all([
      db.pointHistory.count({ where: { userId } }),
      db.pointHistory.aggregate({
        where: { userId },
        _sum: { points: true },
      }),
      db.pointHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPoints = totalPointsAgg._sum.points || 0;

    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        fotoProfil: user.fotoProfil,
        role: user.role?.name || "UNKNOWN",
        rw: user.rw?.name || null,
        kelurahan: user.rw?.kelurahan?.name || null,
        nim: user.studentProfile?.nim || null,
        jurusan: user.studentProfile?.jurusan || null,
        kelompok: user.studentProfile?.kelompok?.name || null,
        createdAt: user.createdAt,
        totalPoints,
        totalTransactions: total,
      },
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Update transaction metadata/description
   */
  async updateTransaction(id: string, data: { description?: string; kategori?: string }) {
    return db.pointHistory.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete / Void transaction
   */
  async deleteTransaction(id: string) {
    return db.pointHistory.delete({
      where: { id },
    });
  }
}

export const pointRepository = new PointRepository();

