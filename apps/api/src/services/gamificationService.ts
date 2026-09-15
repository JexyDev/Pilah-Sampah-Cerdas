import { prisma } from "../lib/prisma.js";
import {
  calculateGroupPoints,
  calculateDplPoints,
  calculatePersonalPointsForUsers,
} from "./dplService.js";
import {
  isTestUser,
  isTestKelompok,
  isTestStudent,
  filterNonTestUsers,
  filterNonTestKelompok,
  filterNonTestStudents,
} from "../utils/filterTestingUtils.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

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
      .filter((u: any) => !isTestUser(u))
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
        kecamatan: { select: { name: true } },
        rws: {
          include: {
            users: {
              include: {
                setoranOtomatis: {
                  select: { berat: true },
                },
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
        let totalKg = 0;
        let totalPoints = 0;
        k.rws.forEach((area: any) => {
          area.users.forEach((u: any) => {
            if (isTestUser(u)) return;
            totalKg += (u.setoranOtomatis || []).reduce(
              (acc: number, cur: any) => acc + Number(cur.berat || 0),
              0
            );
            totalPoints += (u.pointHistory || []).reduce(
              (acc: number, cur: any) => acc + Number(cur.points || 0),
              0
            );
          });
        });
        return {
          kelurahanId: k.id,
          kelurahanName: k.name,
          kecamatanName: k.kecamatan?.name || "Coblong",
          totalRw: k.rws.length,
          totalPoints: totalPoints > 0 ? totalPoints : Math.round(totalKg * 10),
          totalKg: parseFloat(totalKg.toFixed(2)),
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
          if (isTestUser(u)) return;
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
        email: true,
        studentProfile: {
          select: {
            nim: true,
            assignedRw: {
              select: {
                name: true,
                kelurahan: { select: { name: true } },
              },
            },
            kelompok: {
              select: { name: true },
            },
          },
        },
        pointHistory: { select: { points: true } },
      },
    });

    const mahasiswaLeaderboard = mahasiswaUsers
      .filter((m: any) => !isTestUser(m) && !isTestStudent(m.studentProfile))
      .map((m: any) => {
        // Points directly earned by Mahasiswa
        const ownPoints = m.pointHistory.reduce((acc: number, cur: any) => acc + cur.points, 0);
        const area = m.studentProfile?.assignedRw;

        return {
          id: m.id,
          name: m.name,
          universityName: "Kampus N/A",
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
        email: true,
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
      .filter((p: any) => !isTestUser(p))
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
          avgSlaMinutes: parseFloat(avgSlaMinutes.toFixed(2)),
          successRatePercent: parseFloat((successRate * 100).toFixed(2)),
          totalPoints: parseFloat(compositeScore.toFixed(2)),
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
    const studentsRaw = await prisma.studentKkn.findMany({
      include: {
        user: {
          include: {
            registeredBins: true,
            attendances: true,
          },
        },
        kelompok: {
          include: {
            dpl: true,
          },
        },
      },
    });

    // 100% Data Aktual: Filter mahasiswa & user testing
    const students = studentsRaw.filter(
      (s: any) => !isTestStudent(s) && !isTestUser(s.user) && !isTestKelompok(s.kelompok)
    );

    const studentUserIds = students.map((s: any) => s.userId).filter(Boolean);
    const personalPointsMap = await calculatePersonalPointsForUsers(studentUserIds);

    const studentLeaderboard = students.map((s: any) => {
      let totalHours = 0;
      s.user?.attendances?.forEach((att: any) => {
        if (att.checkOutAt && att.attendedAt) {
          const diffMs = new Date(att.checkOutAt).getTime() - new Date(att.attendedAt).getTime();
          const diffHrs = diffMs / (1000 * 60 * 60);
          totalHours += diffHrs;
        }
      });

      const activeBinsCount = (s.user?.registeredBins || []).filter(
        (b: any) => b.status === "ACTIVE_BOUND"
      ).length;
      const dplScore = Number(s.assessmentScore || 0);
      const personalPoints = personalPointsMap.get(s.userId) ?? 0;

      return {
        id: s.id,
        name: s.user?.name || "Mahasiswa",
        nim: s.nim,
        kelompok: s.kelompok?.name || "Tanpa Kelompok",
        kelompokId: s.kelompokId,
        totalHours: parseFloat(totalHours.toFixed(2)),
        activeBins: activeBinsCount,
        dplScore,
        personalPoints,
        finalScore: personalPoints,
      };
    });

    studentLeaderboard.sort((a, b) => b.finalScore - a.finalScore);

    // 2. Kelompok KKN Leaderboard (Formula Resmi: Poin Kelompok = Poin Proker Utuh)
    const groupsRaw = await prisma.kelompokKkn.findMany({
      include: {
        dpl: {
          select: {
            id: true,
            name: true,
            email: true,
            nip: true,
          },
        },
        students: {
          select: {
            id: true,
            nim: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // 100% Data Aktual: Filter kelompok testing/dummy
    const groups = groupsRaw.filter((g: any) => !isTestKelompok(g));

    const kelompokLeaderboard = await Promise.all(
      groups.map(async (g: any) => {
        // Filter student list to non-test students
        const realStudents = (g.students || []).filter((s: any) => !isTestStudent(s));
        const studentUserIds = realStudents.map((s: any) => s.userId).filter(Boolean);
        const groupPointsData = await calculateGroupPoints(g.id, undefined, studentUserIds);
        const dplName = g.dpl?.name || g.dplNamaMentah || null;

        return {
          id: g.id,
          name: g.name,
          dplName: dplName
            ? dplName.toLowerCase().startsWith("dpl")
              ? dplName
              : `DPL: ${dplName}`
            : "DPL: Belum Ditugaskan",
          avgScore: groupPointsData.totalGroupPoints,
          poinProker: groupPointsData.poinProker,
          rataRataPoinAnggota: groupPointsData.rataRataPoinAnggota,
          membersCount: studentUserIds.length,
        };
      })
    );

    kelompokLeaderboard.sort((a, b) => b.avgScore - a.avgScore);

    // 3. DPL (Dosen Pembimbing Lapangan) Leaderboard (Formula Resmi: Poin DPL = (Logbook * 0.5) + (Poin Kelompok * 0.5))
    const dplUsersRaw = await prisma.user.findMany({
      where: { role: { name: "DPL" } },
      select: {
        id: true,
        name: true,
        email: true,
        nip: true,
        dplKelompok: {
          select: {
            id: true,
            name: true,
            kelurahan: true,
            students: {
              select: {
                id: true,
                nim: true,
                userId: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // 100% Data Aktual: Filter akun DPL testing/dummy
    const dplUsers = dplUsersRaw.filter((d: any) => !isTestUser(d));

    const dplLeaderboard = await Promise.all(
      dplUsers.map(async (d: any) => {
        let totalGroupPointsSum = 0;
        let totalStudentCount = 0;

        // Filter kelompok milik DPL dari kelompok testing
        const cleanKelompokList = (d.dplKelompok || []).filter((k: any) => !isTestKelompok(k));

        for (const kel of cleanKelompokList) {
          const realStudents = (kel.students || []).filter((s: any) => !isTestStudent(s));
          totalStudentCount += realStudents.length;
          const studentUserIds = realStudents.map((s: any) => s.userId).filter(Boolean);
          const grpRes = await calculateGroupPoints(kel.id, undefined, studentUserIds);
          totalGroupPointsSum += grpRes.totalGroupPoints;
        }

        const avgGroupPoints =
          cleanKelompokList.length > 0 ? totalGroupPointsSum / cleanKelompokList.length : 0;

        const dplPointsData = await calculateDplPoints(d.id, undefined, avgGroupPoints);

        return {
          id: d.id,
          name: d.name,
          points: dplPointsData.poinDpl,
          poinLogbook: dplPointsData.poinLogbookDpl,
          poinKelompok: dplPointsData.poinKelompok,
          hasLogbook: dplPointsData.hasLogbookDpl,
          logbookCount: dplPointsData.logbookCount || 0,
          totalGroups: cleanKelompokList.length,
          totalStudents: totalStudentCount,
        };
      })
    );

    dplLeaderboard.sort((a: any, b: any) => b.points - a.points);

    return {
      students: studentLeaderboard,
      groups: kelompokLeaderboard,
      dpl: dplLeaderboard,
    };
  },
};
