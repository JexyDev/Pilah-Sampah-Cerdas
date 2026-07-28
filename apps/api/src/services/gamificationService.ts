/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
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

      // Add to Social Feed
      await tx.socialFeed.create({
        data: {
          tipe: "RECYCLE_IDEA",
          deskripsi: `Ide daur ulang "${idea.judul}" telah disetujui untuk diimplementasikan!`,
          userId: idea.userId,
          entityId: idea.id,
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
            households: {
              include: {
                wasteLogs: {
                  select: { weightKg: true },
                },
              },
            },
          },
        },
      },
    });

    const kelurahanLeaderboard = kelurahans
      .map((k: any) => {
        let totalKg = 0;
        k.rtRwAreas.forEach((area: any) => {
          area.households.forEach((h: any) => {
            totalKg += h.wasteLogs.reduce((acc: number, cur: any) => acc + Number(cur.weightKg || 0), 0);
          });
        });
        return {
          kelurahanId: k.id,
          kelurahanName: k.name,
          totalPoints: totalKg, // Keeping totalPoints key for API compatibility, but it represents Kg now
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);

    // 3. RT/RW Leaderboard
    const rtRwAreas = await prisma.rtRwArea.findMany({
      include: {
        kelurahan: { select: { name: true } },
        households: {
          include: {
            wasteLogs: { select: { weightKg: true } },
          },
        },
      },
    });

    const rtRwLeaderboard = rtRwAreas
      .map((area: any) => {
        let totalKg = 0;
        area.households.forEach((h: any) => {
          totalKg += h.wasteLogs.reduce((acc: number, cur: any) => acc + Number(cur.weightKg || 0), 0);
        });
        return {
          rtRwId: area.id,
          rtRwName: area.name,
          kelurahanName: area.kelurahan.name,
          totalPoints: totalKg,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);

    // 4. Mahasiswa KKN Leaderboard
    const mahasiswaUsers = await prisma.user.findMany({
      where: { role: { name: "MAHASISWA_KKN" } },
      select: {
        id: true,
        name: true,
        studentProfile: {
          select: {
            assignedPolygon: {
              select: {
                name: true,
                kelurahan: { select: { name: true } }
              }
            }
          }
        },
        pointHistory: { select: { points: true } },
      },
    });

    const mahasiswaLeaderboard = mahasiswaUsers
      .map((m: any) => {
        // Points directly earned by Mahasiswa
        const ownPoints = m.pointHistory.reduce((acc: number, cur: any) => acc + cur.points, 0);
        
        // Points earned by their dampingan (warga in their rtRwArea)
        let dampinganPoints = 0;
        const area = m.studentProfile?.assignedPolygon;
        // Simplified: Since we don't eager-load users in the area to save queries, we only use ownPoints.
        // For a full implementation, we could sum points of all users in area.

        return {
          id: m.id,
          name: m.name,
          universityName: "Kampus N/A", // Not stored in StudentKkn currently
          wilayahDampingan: area ? `${area.name} (Kel. ${area.kelurahan?.name})` : "N/A",
          totalPoints: ownPoints,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);

    // 5. Pengangkut Leaderboard
    const petugasUsers = await prisma.user.findMany({
      where: { role: { name: "PETUGAS_RESIDU" } },
      select: {
        id: true,
        name: true,
        rtRw: { select: { name: true } },
        verifiedLogs: { select: { weightKg: true } },
      },
    });

    const pengangkutLeaderboard = petugasUsers
      .map((p: any) => {
        const totalKg = p.verifiedLogs.reduce((acc: number, cur: any) => acc + Number(cur.weightKg || 0), 0);
        return {
          id: p.id,
          name: p.name,
          wilayah: p.rtRw?.name || "Semua",
          totalPoints: totalKg,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);

    return {
      citizens: citizenLeaderboard,
      regions: kelurahanLeaderboard,
      rtRw: rtRwLeaderboard,
      mahasiswa: mahasiswaLeaderboard,
      pengangkut: pengangkutLeaderboard,
    };
  },
};
