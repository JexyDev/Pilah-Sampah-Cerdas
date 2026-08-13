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
            phone: true,
            rw: true,
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
        rw: {
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
          wilayah: u.rw ? `${u.rw.name} (Kel. ${u.rw.kelurahan.name})` : "N/A",
          totalPoints,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);

    // 2. Region-Based Leaderboard (Kelurahan)
    const kelurahans = await prisma.kelurahan.findMany({
      include: {
        rws: {
          include: {
            users: {
              include: {
                setoranOtomatis: {
                  select: { berat: true },
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
        k.rws.forEach((area: any) => {
          area.users.forEach((u: any) => {
            totalKg += u.setoranOtomatis.reduce(
              (acc: number, cur: any) => acc + Number(cur.berat || 0),
              0
            );
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
    const rws = await prisma.rw.findMany({
      include: {
        kelurahan: { select: { name: true } },
        users: {
          include: {
            setoranOtomatis: { select: { berat: true } },
            pointHistory: { select: { points: true } },
          },
        },
      },
    });

    const rtRwLeaderboard = rws
      .map((area: any) => {
        let totalKg = 0;
        let totalPoin = 0;
        area.users.forEach((u: any) => {
          totalKg += (u.setoranOtomatis || []).reduce(
            (acc: number, cur: any) => acc + Number(cur.berat || 0),
            0
          );
          totalPoin += (u.pointHistory || []).reduce(
            (acc: number, cur: any) => acc + Number(cur.points || 0),
            0
          );
        });
        return {
          rwId: area.id,
          rtRwName: area.name,
          kelurahanName: area.kelurahan?.name || "Coblong",
          totalPoints: totalPoin > 0 ? totalPoin : totalKg,
          totalKg,
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
            assignedRw: {
              select: {
                name: true,
                kelurahan: { select: { name: true } },
              },
            },
          },
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
        const area = m.studentProfile?.assignedRw;
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

    // 5. Pengangkut Leaderboard (Opsi D: Composite Formula — Kuantitas + SLA Kecepatan + Akurasi)
    const petugasUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: { name: "PETUGAS_RESIDU" } },
          { role: { name: "PENGANGKUT" } },
          { claimedTasks: { some: {} } },
        ],
      },
      select: {
        id: true,
        name: true,
        rw: { select: { name: true } },
        setoranManual: { select: { berat: true } },
        claimedTasks: {
          select: {
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const pengangkutLeaderboard = petugasUsers
      .map((p: any) => {
        const completedTasks = p.claimedTasks.filter((t: any) => t.status === "COMPLETED");
        const totalCompleted = completedTasks.length;
        const totalClaimed = p.claimedTasks.length;

        // SLA Responsivitas (menit)
        let totalDurationMinutes = 0;
        completedTasks.forEach((t: any) => {
          const duration =
            (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60);
          totalDurationMinutes += Math.max(1, duration);
        });
        const avgSlaMinutes = totalCompleted > 0 ? totalDurationMinutes / totalCompleted : 0;
        const slaScore = totalCompleted > 0 ? Math.max(0, 100 - avgSlaMinutes) : 0;

        // Akurasi/Tingkat keberhasilan penjemputan tanpa batal/escalated
        const successRate = totalClaimed > 0 ? totalCompleted / totalClaimed : 1;

        // Opsi D: Skor Komposit seimbang & minim error
        const compositeScore = 0.5 * totalCompleted + 0.3 * slaScore + 0.2 * successRate * 100;

        const totalKg = p.setoranManual.reduce(
          (acc: number, cur: any) => acc + Number(cur.berat || 0),
          0
        );

        return {
          id: p.id,
          name: p.name,
          wilayah: p.rw?.name || "Semua Area",
          totalCompleted,
          avgSlaMinutes: parseFloat(avgSlaMinutes.toFixed(1)),
          successRatePercent: parseFloat((successRate * 100).toFixed(1)),
          totalPoints: parseFloat(compositeScore.toFixed(1)),
          totalKgHandled: totalKg,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);

    return {
      citizens: citizenLeaderboard,
      regions: kelurahanLeaderboard,
      rw: rtRwLeaderboard,
      rtRw: rtRwLeaderboard,
      mahasiswa: mahasiswaLeaderboard,
      pengangkut: pengangkutLeaderboard,
    };
  },

  getLeaderboardKkn: async () => {
    const students = await prisma.studentKkn.findMany({
      include: {
        user: {
          include: {
            registeredBins: true,
            attendances: true,
          },
        },
        kelompok: true,
      },
    });

    const studentLeaderboard = students.map((s: any) => {
      let totalHours = 0;
      s.user.attendances.forEach((att: any) => {
        if (att.checkOutAt && att.attendedAt) {
          const diffMs = new Date(att.checkOutAt).getTime() - new Date(att.attendedAt).getTime();
          const diffHrs = diffMs / (1000 * 60 * 60);
          totalHours += diffHrs;
        }
      });

      const activeBinsCount = s.user.registeredBins.filter(
        (b: any) => b.status === "ACTIVE_BOUND"
      ).length;
      const dplScore = Number(s.assessmentScore || 0);

      const finalScore = totalHours * 0.4 + activeBinsCount * 0.3 + dplScore * 0.3;

      return {
        id: s.id,
        name: s.user.name,
        nim: s.nim,
        kelompok: s.kelompok?.name || "Tanpa Kelompok",
        kelompokId: s.kelompokId,
        totalHours: parseFloat(totalHours.toFixed(1)),
        activeBins: activeBinsCount,
        dplScore,
        finalScore: parseFloat(finalScore.toFixed(2)),
      };
    });

    studentLeaderboard.sort((a, b) => b.finalScore - a.finalScore);

    const kelompokMap: Record<string, { id: string; name: string; scores: number[] }> = {};
    studentLeaderboard.forEach((student) => {
      if (student.kelompokId) {
        if (!kelompokMap[student.kelompokId]) {
          kelompokMap[student.kelompokId] = {
            id: student.kelompokId,
            name: student.kelompok,
            scores: [],
          };
        }
        kelompokMap[student.kelompokId].scores.push(student.finalScore);
      }
    });

    const kelompokLeaderboard = Object.values(kelompokMap).map((k) => {
      const totalScore = k.scores.reduce((sum, s) => sum + s, 0);
      const avgScore = k.scores.length ? totalScore / k.scores.length : 0;
      return {
        id: k.id,
        name: k.name,
        avgScore: parseFloat(avgScore.toFixed(2)),
        membersCount: k.scores.length,
      };
    });

    kelompokLeaderboard.sort((a, b) => b.avgScore - a.avgScore);

    // 3. DPL (Dosen Pembimbing Lapangan) Leaderboard
    const dplUsers = await prisma.user.findMany({
      where: { role: { name: "DPL" } },
      select: {
        id: true,
        name: true,
        dplKelompok: {
          select: {
            id: true,
            name: true,
            students: {
              select: {
                id: true,
                assessmentScore: true,
                user: {
                  select: {
                    registeredBins: { select: { status: true } },
                    attendances: { select: { attendedAt: true, checkOutAt: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const dplLeaderboard = dplUsers
      .map((d: any) => {
        let totalScoreSum = 0;
        let totalStudentCount = 0;
        d.dplKelompok.forEach((kel: any) => {
          kel.students.forEach((s: any) => {
            totalStudentCount++;
            let totalHours = 0;
            s.user.attendances.forEach((att: any) => {
              if (att.checkOutAt && att.attendedAt) {
                const diffMs =
                  new Date(att.checkOutAt).getTime() - new Date(att.attendedAt).getTime();
                totalHours += diffMs / (1000 * 60 * 60);
              }
            });
            const activeBins = s.user.registeredBins.filter(
              (b: any) => b.status === "ACTIVE_BOUND"
            ).length;
            const score =
              totalHours * 0.4 + activeBins * 0.3 + Number(s.assessmentScore || 0) * 0.3;
            totalScoreSum += score;
          });
        });

        const avgDplScore = totalStudentCount > 0 ? totalScoreSum / totalStudentCount : 0;
        return {
          id: d.id,
          name: d.name,
          points: parseFloat(avgDplScore.toFixed(2)),
          totalGroups: d.dplKelompok.length,
          totalStudents: totalStudentCount,
        };
      })
      .sort((a: any, b: any) => b.points - a.points);

    return {
      students: studentLeaderboard,
      groups: kelompokLeaderboard,
      dpl: dplLeaderboard,
    };
  },
};
