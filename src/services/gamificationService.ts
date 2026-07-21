/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const gamificationService = {
  /**
   * Submit new recycle idea
   */
  submitIdea: async (userId: string, judul: string, material: string, foto?: string) => {
    return prisma.ideDaurUlang.create({
      data: {
        userId,
        judul,
        material,
        foto,
        statusApproval: "PENDING",
      },
    });
  },

  /**
   * Get all recycle ideas based on scoping
   */
  getIdeas: async (userFilter: any) => {
    return prisma.ideDaurUlang.findMany({
      where: userFilter ? { user: userFilter } : {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            rtRw: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Approve a recycle idea by RW/Admin DLH and award +50 points
   */
  approveIdea: async (ideaId: string, adminUserId: string) => {
    return prisma.$transaction(async (tx) => {
      const idea = await tx.ideDaurUlang.findUnique({
        where: { id: ideaId },
      });
      if (!idea) throw new Error("RECYCLE_IDEA_NOT_FOUND");
      if (idea.statusApproval !== "PENDING") {
        throw new Error("RECYCLE_IDEA_ALREADY_PROCESSED");
      }

      // Update idea status
      const updated = await tx.ideDaurUlang.update({
        where: { id: ideaId },
        data: {
          statusApproval: "APPROVED",
          approvedBy: adminUserId,
        },
      });

      // Award points (+50)
      const pointsConfig = await tx.systemConfig.findUnique({
        where: { key: "idea_approval_points" },
      });
      const pointsAmount = pointsConfig ? Number(pointsConfig.value) : 50;

      await tx.pointHistory.create({
        data: {
          userId: idea.userId,
          points: pointsAmount,
          description: `Bonus persetujuan ide daur ulang "${idea.judul}"`,
          kategori: "IDE_DAUR_ULANG",
        },
      });

      // Hook Audit Trail
      await tx.auditTrail.create({
        data: {
          action: "APPROVE_RECYCLE_IDEA",
          userId: adminUserId,
          oldValue: { statusApproval: "PENDING" },
          newValue: { statusApproval: "APPROVED" },
        },
      });

      return updated;
    });
  },

  /**
   * Get Leaderboards (Individual, Kelurahan, RT/RW)
   */
  getLeaderboard: async () => {
    // 1. Individual Warga Leaderboard
    const individualUsers = await prisma.user.findMany({
      where: {
        role: { name: "WARGA" },
      },
      select: {
        id: true,
        name: true,
        wargaSubtype: true,
        rtRw: {
          select: {
            name: true,
            kelurahan: {
              select: { name: true },
            },
          },
        },
        pointHistory: {
          select: {
            points: true,
          },
        },
      },
    });

    const citizenLeaderboard = individualUsers
      .map((u: any) => {
        const totalPoints = u.pointHistory.reduce((acc: number, cur: any) => acc + cur.points, 0);
        return {
          id: u.id,
          name: u.name,
          wargaSubtype: u.wargaSubtype,
          wilayah: u.rtRw ? `${u.rtRw.name} (Kel. ${u.rtRw.kelurahan.name})` : "N/A",
          totalPoints,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);

    // 2. Region-Based Leaderboard (Kelurahan)
    const kelurahans = await prisma.kelurahan.findMany({
      include: {
        rtRwAreas: {
          include: {
            users: {
              include: {
                pointHistory: {
                  select: { points: true },
                },
              },
            },
          },
        },
      },
    });

    const kelurahanLeaderboard = kelurahans
      .map((k: any) => {
        let total = 0;
        k.rtRwAreas.forEach((area: any) => {
          area.users.forEach((u: any) => {
            total += u.pointHistory.reduce((acc: number, cur: any) => acc + cur.points, 0);
          });
        });
        return {
          kelurahanId: k.id,
          kelurahanName: k.name,
          totalPoints: total,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);

    return {
      citizens: citizenLeaderboard,
      regions: kelurahanLeaderboard,
    };
  },
};
