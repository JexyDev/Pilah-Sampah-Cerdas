import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { pointRepository } from "../repositories/pointRepository.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";

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

      // Coba kirim silent push jika user punya fcmToken
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true, role: { select: { name: true } } },
      });
      if (user?.fcmToken) {
        const eventType =
          user.role.name === "WARGA" ? "REFRESH_POIN_WARGA" : "REFRESH_POIN_MAHASISWA";
        try {
          await notificationIntegrationService.sendSilentDataPush(user.fcmToken, {
            event: eventType,
            poinTambahan: points.toString(),
          });
        } catch (e) {
          console.warn("[adjustPoints] FCM failed", e);
        }
      }

      return history;
    });
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard() {
    return pointRepository.getLeaderboard();
  }

  /**
   * Get developer admin user points list
   */
  async getAdminUsers(params: any) {
    return pointRepository.getAdminUsersPoints(params);
  }

  /**
   * Get developer admin points overview stats
   */
  async getAdminStats() {
    return pointRepository.getAdminPointsStats();
  }

  /**
   * Get developer admin global ledger feed
   */
  async getAdminLedger(params: any) {
    return pointRepository.getAdminLedgerFeed(params);
  }

  /**
   * Get developer admin single user ledger detail
   */
  async getAdminUserLedger(userId: string, page = 1, limit = 20) {
    return pointRepository.getAdminUserLedger(userId, page, limit);
  }

  /**
   * Developer Adjust Points for a single user
   */
  async adjustPointsDeveloper(opts: {
    developerUserId: string;
    userId: string;
    points: number;
    kategori?: string;
    description: string;
    sendNotification?: boolean;
    ipAddress?: string;
  }) {
    const {
      developerUserId,
      userId,
      points,
      kategori,
      description,
      sendNotification = true,
      ipAddress,
    } = opts;

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, fcmToken: true, role: { select: { name: true } } },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      // Calculate old points
      const oldPointsAgg = await tx.pointHistory.aggregate({
        where: { userId },
        _sum: { points: true },
      });
      const oldPoints = oldPointsAgg._sum.points || 0;
      const newPoints = oldPoints + points;

      const history = await tx.pointHistory.create({
        data: {
          userId,
          points,
          kategori: kategori || "MANUAL_ADJUSTMENT",
          description:
            description || `Penyesuaian poin developer (${points >= 0 ? "+" : ""}${points})`,
        },
      });

      if (sendNotification) {
        await tx.notification.create({
          data: {
            userId,
            title: points >= 0 ? "Poin Tambahan Diterima" : "Pengurangan Poin",
            message: `Poin Anda telah ${points >= 0 ? "ditambahkan" : "dikurangi"} sebesar ${Math.abs(points)} poin: ${description}`,
          },
        });
      }

      // Audit Trail
      await tx.auditTrail.create({
        data: {
          action: "DEVELOPER_ADJUST_POINTS",
          userId: developerUserId,
          roleName: "DEVELOPER",
          featureCategory: "MANAJEMEN_POIN",
          endpoint: "/api/v1/points/admin/adjust",
          ipAddress: ipAddress || null,
          oldValue: {
            targetUserId: userId,
            targetUserName: user.name,
            totalPointsBefore: oldPoints,
          },
          newValue: {
            targetUserId: userId,
            targetUserName: user.name,
            adjustedPoints: points,
            totalPointsAfter: newPoints,
            description,
            kategori,
          },
        },
      });

      // FCM Silent Push
      if (user.fcmToken) {
        const eventType =
          user.role.name === "WARGA" ? "REFRESH_POIN_WARGA" : "REFRESH_POIN_MAHASISWA";
        try {
          await notificationIntegrationService.sendSilentDataPush(user.fcmToken, {
            event: eventType,
            poinTambahan: points.toString(),
          });
        } catch (e) {
          console.warn("[adjustPointsDeveloper] FCM failed", e);
        }
      }

      return {
        history,
        oldPoints,
        newPoints,
      };
    });
  }

  /**
   * Developer Set Exact Balance (Calculates delta automatically)
   */
  async setBalanceDeveloper(opts: {
    developerUserId: string;
    userId: string;
    targetBalance: number;
    description?: string;
    sendNotification?: boolean;
    ipAddress?: string;
  }) {
    const {
      developerUserId,
      userId,
      targetBalance,
      description,
      sendNotification = true,
      ipAddress,
    } = opts;

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, fcmToken: true, role: { select: { name: true } } },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      // Calculate old points
      const oldPointsAgg = await tx.pointHistory.aggregate({
        where: { userId },
        _sum: { points: true },
      });
      const oldPoints = oldPointsAgg._sum.points || 0;
      const delta = targetBalance - oldPoints;

      if (delta === 0) {
        return {
          message: "Saldo sudah sesuai, tidak ada perubahan yang diperlukan.",
          oldPoints,
          newPoints: oldPoints,
          delta: 0,
        };
      }

      const note =
        description ||
        `Kalibrasi saldo poin pasti dari ${oldPoints} ke ${targetBalance} poin oleh Developer`;

      const history = await tx.pointHistory.create({
        data: {
          userId,
          points: delta,
          kategori: "SET_BALANCE",
          description: note,
        },
      });

      if (sendNotification) {
        await tx.notification.create({
          data: {
            userId,
            title: "Pembaruan Saldo Poin",
            message: `Saldo poin Anda telah disesuaikan menjadi ${targetBalance} poin. Catatan: ${note}`,
          },
        });
      }

      // Audit Trail
      await tx.auditTrail.create({
        data: {
          action: "DEVELOPER_SET_BALANCE",
          userId: developerUserId,
          roleName: "DEVELOPER",
          featureCategory: "MANAJEMEN_POIN",
          endpoint: "/api/v1/points/admin/set-balance",
          ipAddress: ipAddress || null,
          oldValue: {
            targetUserId: userId,
            targetUserName: user.name,
            totalPointsBefore: oldPoints,
          },
          newValue: {
            targetUserId: userId,
            targetUserName: user.name,
            targetBalance,
            deltaApplied: delta,
            description: note,
          },
        },
      });

      // FCM Silent Push
      if (user.fcmToken) {
        const eventType =
          user.role.name === "WARGA" ? "REFRESH_POIN_WARGA" : "REFRESH_POIN_MAHASISWA";
        try {
          await notificationIntegrationService.sendSilentDataPush(user.fcmToken, {
            event: eventType,
            poinTambahan: delta.toString(),
          });
        } catch (e) {
          console.warn("[setBalanceDeveloper] FCM failed", e);
        }
      }

      return {
        history,
        oldPoints,
        newPoints: targetBalance,
        delta,
      };
    });
  }

  /**
   * Developer Bulk Adjust Points for multiple users
   */
  async bulkAdjustPointsDeveloper(opts: {
    developerUserId: string;
    userIds: string[];
    points: number;
    kategori?: string;
    description: string;
    sendNotification?: boolean;
    ipAddress?: string;
  }) {
    const {
      developerUserId,
      userIds,
      points,
      kategori,
      description,
      sendNotification = true,
      ipAddress,
    } = opts;

    if (!userIds || userIds.length === 0) {
      throw new Error("EMPTY_USER_IDS");
    }

    return prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, fcmToken: true, role: { select: { name: true } } },
      });

      const results = [];

      for (const u of users) {
        const history = await tx.pointHistory.create({
          data: {
            userId: u.id,
            points,
            kategori: kategori || "BULK_ADJUSTMENT",
            description:
              description || `Penyesuaian massal poin (${points >= 0 ? "+" : ""}${points})`,
          },
        });

        if (sendNotification) {
          await tx.notification.create({
            data: {
              userId: u.id,
              title: points >= 0 ? "Bonus Poin Diterima" : "Penyesuaian Poin",
              message: `Poin Anda telah ${points >= 0 ? "ditambahkan" : "dikurangi"} sebesar ${Math.abs(points)} poin: ${description}`,
            },
          });
        }

        results.push({ userId: u.id, historyId: history.id });

        // FCM silent push (async without blocking)
        if (u.fcmToken) {
          const eventType =
            u.role.name === "WARGA" ? "REFRESH_POIN_WARGA" : "REFRESH_POIN_MAHASISWA";
          notificationIntegrationService
            .sendSilentDataPush(u.fcmToken, { event: eventType, poinTambahan: points.toString() })
            .catch(() => {});
        }
      }

      // Record Audit Trail
      await tx.auditTrail.create({
        data: {
          action: "DEVELOPER_BULK_ADJUST_POINTS",
          userId: developerUserId,
          roleName: "DEVELOPER",
          featureCategory: "MANAJEMEN_POIN",
          endpoint: "/api/v1/points/admin/bulk-adjust",
          ipAddress: ipAddress || null,
          oldValue: { userCount: userIds.length },
          newValue: {
            userCount: users.length,
            userIds,
            pointsApplied: points,
            description,
            kategori,
          },
        },
      });

      return {
        processedCount: users.length,
        pointsPerUser: points,
        results,
      };
    });
  }

  /**
   * Developer Edit Transaction Metadata
   */
  async updateTransactionDeveloper(opts: {
    developerUserId: string;
    transactionId: string;
    description?: string;
    kategori?: string;
    ipAddress?: string;
  }) {
    const { developerUserId, transactionId, description, kategori, ipAddress } = opts;

    return prisma.$transaction(async (tx) => {
      const old = await tx.pointHistory.findUnique({
        where: { id: transactionId },
        include: { user: { select: { name: true } } },
      });

      if (!old) throw new Error("TRANSACTION_NOT_FOUND");

      const updated = await tx.pointHistory.update({
        where: { id: transactionId },
        data: {
          description: description !== undefined ? description : old.description,
          kategori: kategori !== undefined ? kategori : old.kategori,
        },
      });

      await tx.auditTrail.create({
        data: {
          action: "DEVELOPER_UPDATE_POINT_TRANSACTION",
          userId: developerUserId,
          roleName: "DEVELOPER",
          featureCategory: "MANAJEMEN_POIN",
          endpoint: `/api/v1/points/admin/transaction/${transactionId}`,
          ipAddress: ipAddress || null,
          oldValue: {
            description: old.description,
            kategori: old.kategori,
            points: old.points,
            userId: old.userId,
          },
          newValue: {
            description: updated.description,
            kategori: updated.kategori,
            points: updated.points,
          },
        },
      });

      return updated;
    });
  }

  /**
   * Developer Void / Reversal of a Transaction
   */
  async voidTransactionDeveloper(opts: {
    developerUserId: string;
    transactionId: string;
    reason: string;
    ipAddress?: string;
  }) {
    const { developerUserId, transactionId, reason, ipAddress } = opts;

    return prisma.$transaction(async (tx) => {
      const target = await tx.pointHistory.findUnique({
        where: { id: transactionId },
        include: {
          user: {
            select: { id: true, name: true, fcmToken: true, role: { select: { name: true } } },
          },
        },
      });

      if (!target) throw new Error("TRANSACTION_NOT_FOUND");

      // Inverse points for reversal
      const inversePoints = -target.points;
      const reversalDesc = `[REVERSAL / PEMBATALAN] Transaksi (${target.description}): ${reason || "Dibatalkan oleh Developer"}`;

      const reversalHistory = await tx.pointHistory.create({
        data: {
          userId: target.userId,
          points: inversePoints,
          kategori: "REVERSAL",
          description: reversalDesc,
        },
      });

      // Notification
      await tx.notification.create({
        data: {
          userId: target.userId,
          title: "Pembatalan Transaksi Poin",
          message: `Transaksi sebesar ${target.points} poin telah dibatalkan (${reversalDesc}).`,
        },
      });

      // Audit Trail
      await tx.auditTrail.create({
        data: {
          action: "DEVELOPER_VOID_POINT_TRANSACTION",
          userId: developerUserId,
          roleName: "DEVELOPER",
          featureCategory: "MANAJEMEN_POIN",
          endpoint: `/api/v1/points/admin/transaction/${transactionId}`,
          ipAddress: ipAddress || null,
          oldValue: {
            originalTransactionId: target.id,
            points: target.points,
            description: target.description,
            userId: target.userId,
          },
          newValue: { reversalTransactionId: reversalHistory.id, inversePoints, reason },
        },
      });

      // Silent push
      if (target.user?.fcmToken) {
        const eventType =
          target.user.role?.name === "WARGA" ? "REFRESH_POIN_WARGA" : "REFRESH_POIN_MAHASISWA";
        notificationIntegrationService
          .sendSilentDataPush(target.user.fcmToken, {
            event: eventType,
            poinTambahan: inversePoints.toString(),
          })
          .catch(() => {});
      }

      return {
        reversalHistory,
        originalTransaction: target,
      };
    });
  }
}

export const pointService = new PointService();
