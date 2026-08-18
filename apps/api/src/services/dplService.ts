import { PrismaClient } from "@prisma/client";
import { configService } from "./configService.js";

const prisma = new PrismaClient();

async function getEligiblePastSchedulesCount(groupId?: string): Promise<number> {
  try {
    const configs = await configService.getRuleEngineConfigs();
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // If today is prior to KKN start date, no schedules are expected yet!
    if (configs.kknStartDate) {
      const kknStart = new Date(configs.kknStartDate);
      if (now < kknStart) {
        return 0;
      }
    }

    const whereSchedule: any = {
      date: {
        lte: todayEnd,
      },
    };
    if (configs.kknStartDate) {
      whereSchedule.date.gte = new Date(configs.kknStartDate);
    }
    if (groupId) {
      whereSchedule.OR = [{ kelompokId: groupId }, { kelompokId: null }];
    }

    const pastSchedules = await prisma.schedule.findMany({
      where: whereSchedule,
      select: { date: true },
    });

    let eligibleCount = 0;
    for (const s of pastSchedules) {
      const check = await configService.isDateKknHoliday(s.date);
      if (!check.isHoliday) {
        eligibleCount++;
      }
    }

    return eligibleCount;
  } catch (err) {
    console.warn("[dplService] Error calculating eligible schedules:", err);
    return 0;
  }
}

function getRoleString(role: any): string {
  if (!role) return "";
  if (typeof role === "object") return String(role.name || "").toUpperCase();
  return String(role).toUpperCase();
}

function getKelompokWhere(dplUserId: string, role?: any) {
  const normalizedRole = getRoleString(role);
  const isAdmin = [
    "DEVELOPER",
    "ADMIN_DLH",
    "DLH",
    "DLH_ADMIN",
    "SUPER_USER",
    "ADMIN",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
  ].some((r) => normalizedRole.includes(r));

  if (isAdmin) {
    return {};
  }

  if (normalizedRole.includes("MAHASISWA_KKN") || normalizedRole.includes("MAHASISWA")) {
    return {
      students: { some: { userId: dplUserId } }
    };
  }

  return {
    OR: [{ dplId: dplUserId }, { dpl: { id: dplUserId } }],
  };
}

export const dplService = {
  /**
   * 1. Ringkasan Kelompok Bimbingan (Murni scoped ke kelompok DPL sendiri)
   */
  getGroupSummary: async (dplUserId: string, role?: string) => {
    const groups = await prisma.kelompokKkn.findMany({
      where: getKelompokWhere(dplUserId, role),
      include: {
        students: {
          include: {
            user: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    });

    if (groups.length === 0) {
      return [];
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const configTargets = await dplService.getConfigTargets();

    const groupSummaries = await Promise.all(
      groups.map(async (grp) => {
        const studentUserIds = grp.students.map((s) => s.userId);
        const studentCount = grp.students.length;

        let activatedBinsCount = 0;
        if (studentUserIds.length > 0) {
          activatedBinsCount = await prisma.bin.count({
            where: {
              registeredByStudentId: { in: studentUserIds },
              status: "ACTIVE_BOUND",
            },
          });
        }

        if (activatedBinsCount === 0 && grp.kelurahan) {
          activatedBinsCount = await prisma.bin.count({
            where: {
              status: "ACTIVE_BOUND",
              rw: { kelurahan: { name: { contains: grp.kelurahan, mode: "insensitive" } } },
            },
          });
        }

        const totalAttendances = await prisma.activityAttendance.count({
          where:
            studentUserIds.length > 0
              ? { studentId: { in: studentUserIds } }
              : { id: "impossible-id" },
        });

        const activeTodayCount =
          studentUserIds.length > 0
            ? (
                await prisma.activityAttendance.groupBy({
                  by: ["studentId"],
                  where: {
                    studentId: { in: studentUserIds },
                    attendedAt: { gte: todayStart, lte: todayEnd },
                  },
                })
              ).length
            : 0;

        const attendancesWithDuration =
          studentUserIds.length > 0
            ? await prisma.activityAttendance.findMany({
                where: { studentId: { in: studentUserIds } },
                select: { attendedAt: true, checkOutAt: true },
              })
            : [];

        let actualHours = 0;
        for (const a of attendancesWithDuration) {
          if (a.checkOutAt && a.attendedAt) {
            const diff = (a.checkOutAt.getTime() - a.attendedAt.getTime()) / (1000 * 60 * 60);
            actualHours += Math.max(0.5, Math.min(8, diff));
          } else {
            actualHours += configTargets.targetHarianJam || 4.0;
          }
        }
        actualHours = Math.round(actualHours * 100) / 100;

        const totalSchedules = await getEligiblePastSchedulesCount(grp.id);
        const expectedAttendances = studentCount * totalSchedules;
        const avgAttendanceRate =
          totalSchedules === 0 || expectedAttendances === 0 || totalAttendances === 0
            ? 0
            : Math.min(100, Math.round((totalAttendances / expectedAttendances) * 100));

        const pointSum = await prisma.pointHistory.aggregate({
          where:
            studentUserIds.length > 0
              ? { userId: { in: studentUserIds } }
              : { id: "impossible-id" },
          _sum: { points: true },
        });

        const prokerList = await prisma.programKerjaKkn.findMany({
          where: { kelompokId: grp.id },
          orderBy: { createdAt: "desc" },
          take: 5,
        });

        return {
          id: grp.id,
          name: grp.name,
          kelurahan: grp.kelurahan || null,
          cakupanRw: grp.cakupanRw || [],
          studentCount,
          activeTodayCount,
          actualHours,
          targetHours: configTargets.targetTotalJam || 100,
          targetTotalKegiatan: configTargets.targetTotalKegiatan || 2000,
          activatedBinsCount,
          avgAttendanceRate,
          totalGroupPoints: pointSum._sum.points || 0,
          programKerja: prokerList.map((p) => ({
            id: p.id,
            nomor: p.nomor || 1,
            deskripsi: p.deskripsi,
            kebutuhanBiaya: Number(p.kebutuhanBiaya || 0),
            status: p.status,
            skorPenilaian: p.skorPenilaian !== null ? Number(p.skorPenilaian) : null,
          })),
        };
      })
    );

    return groupSummaries;
  },

  /**
   * 2. Detail per Mahasiswa Bimbingan DPL
   */
  getStudentDetails: async (dplUserId: string, groupId?: string, role?: string) => {
    const whereGroup: any = getKelompokWhere(dplUserId, role);
    if (groupId) whereGroup.id = groupId;

    const myGroups = await prisma.kelompokKkn.findMany({
      where: whereGroup,
      select: { id: true },
    });

    if (myGroups.length === 0) {
      return [];
    }

    const myGroupIds = myGroups.map((g) => g.id);

    const students = await prisma.studentKkn.findMany({
      where: { kelompokId: { in: myGroupIds } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            fotoProfil: true,
          },
        },
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const studentDetails = await Promise.all(
      students.map(async (st) => {
        const attendances = await prisma.activityAttendance.findMany({
          where: { studentId: st.userId },
          include: { schedule: true },
          orderBy: { attendedAt: "desc" },
        });

        const leaveRequests = await prisma.studentLeaveRequest.findMany({
          where: { studentId: st.userId },
          orderBy: { createdAt: "desc" },
        });

        const sickCount = leaveRequests.filter(
          (r) => r.type === "SAKIT" && r.status === "APPROVED"
        ).length;
        const izinCount = leaveRequests.filter(
          (r) => r.type === "IZIN" && r.status === "APPROVED"
        ).length;
        const rejectedAbsenceCount = leaveRequests.filter(
          (r) => r.status === "REJECTED"
        ).length;

        const totalSchedules = await getEligiblePastSchedulesCount(st.kelompokId || undefined);
        const attendedCount = attendances.length;
        // Alpha adalah sisa jadwal tanpa keterangan ditambah pengajuan ketidakhadiran yang ditolak
        const rawAlpha =
          totalSchedules > 0
            ? Math.max(0, totalSchedules - attendedCount - sickCount - izinCount)
            : 0;
        const alphaCount = Math.max(rawAlpha, rejectedAbsenceCount);

        const ruleConfigs = await configService.getRuleEngineConfigs();
        const baseScore = Number(st.assessmentScore || 0);
        const penaltyPerAlpha = ruleConfigs.alphaPenaltyScorePercent || 5.0;
        const finalCalculatedScore = Math.max(0, Math.round(baseScore - (alphaCount * penaltyPerAlpha)));

        const points = await prisma.pointHistory.aggregate({
          where: { userId: st.userId },
          _sum: { points: true },
        });
        const netPoints = Math.max(0, (points._sum.points || 0) - (alphaCount * (ruleConfigs.alphaPenaltyPoints || 10)));

        return {
          id: st.id,
          userId: st.userId,
          name: st.user?.name || "Mahasiswa KKN",
          phone: st.user?.phone || "-",
          nim: st.nim || "-",
          jurusan: st.jurusan || "-",
          fakultas: st.fakultas || "-",
          fotoProfil: st.user?.fotoProfil || null,
          isKetua: Boolean(st.isKetua),
          kelompokName: st.kelompok?.name || "-",
          assessmentScore: finalCalculatedScore,
          baseAssessmentScore: baseScore,
          individualPoints: netPoints,
          attendanceRate:
            totalSchedules === 0 || attendedCount === 0
              ? 0
              : Math.min(100, Math.round((attendedCount / totalSchedules) * 100)),
          attendedCount,
          sickCount,
          izinCount,
          alphaCount,
          statusKehadiranLabel: alphaCount > 0 ? `${alphaCount}x Tanpa Keterangan (Alpha)` : "Tertib Presensi",
          attendances: attendances.map((a) => ({
            id: a.id,
            scheduleTitle: a.schedule?.title || "Kegiatan KKN",
            attendedAt: a.attendedAt,
            status: a.status,
          })),
          leaveRequests: leaveRequests.map((l) => ({
            id: l.id,
            type: l.type,
            reason: l.reason,
            status: l.status,
            createdAt: l.createdAt,
          })),
        };
      })
    );

    return studentDetails;
  },

  /**
   * 3. Detail Warga yang Dibantu (w/ Waste Pattern)
   */
  getAssistedCitizens: async (dplUserId: string, studentId: string) => {
    const student = await prisma.studentKkn.findFirst({
      where: {
        OR: [{ id: studentId }, { userId: studentId }],
      },
      include: { user: true },
    });

    if (!student) {
      throw new Error("STUDENT_NOT_FOUND_OR_FORBIDDEN");
    }

    const bins = await prisma.bin.findMany({
      where: { registeredByStudentId: student.userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            createdAt: true,
          },
        },
        category: true,
        rw: true,
      },
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const citizenList = await Promise.all(
      bins.map(async (bin) => {
        const citizen = bin.user;
        const setoranLogs = citizen
          ? await prisma.setoranOtomatis.findMany({
              where: { wargaId: citizen.id },
              orderBy: { createdAt: "desc" },
            })
          : [];

        const recentSetoranCount = setoranLogs.filter((s) => s.createdAt >= sevenDaysAgo).length;
        const totalKg = setoranLogs.reduce((acc, curr) => acc + Number(curr.berat || 0), 0);
        const totalPoints = setoranLogs.reduce((acc, curr) => acc + Number(curr.poin || 0), 0);

        const polaBuangSampah =
          recentSetoranCount >= 3
            ? "RUTIN"
            : setoranLogs.length > 0
              ? "KURANG_RUTIN"
              : "BELUM_SETOR";

        return {
          binId: bin.id,
          qrCode: bin.qrCode,
          binStatus: bin.status,
          registeredAt: bin.createdAt,
          warga: citizen
            ? {
                id: citizen.id,
                nama: citizen.name,
                phone: citizen.phone,
                alamat: citizen.address || "-",
              }
            : null,
          totalSetoranCount: setoranLogs.length,
          recentSetoranCount,
          totalKg: Math.round(totalKg * 100) / 100,
          totalPoints,
          polaBuangSampah,
        };
      })
    );

    return {
      student: {
        id: student.id,
        name: student.user?.name || "Mahasiswa",
        jurusan: student.jurusan,
      },
      totalCitizensAssisted: citizenList.filter((c) => c.warga !== null).length,
      citizens: citizenList,
    };
  },

  /**
   * 4. Peta Sebaran (Hanya Wilayah & Kelompok DPL)
   */
  getMapCoverage: async (dplUserId: string, role?: string) => {
    const groups = await prisma.kelompokKkn.findMany({
      where: getKelompokWhere(dplUserId, role),
      select: {
        id: true,
        name: true,
        kelurahan: true,
        cakupanRw: true,
        students: { select: { userId: true } },
      },
    });

    if (groups.length === 0) {
      return { groups: [], rwAreas: [], bins: [] };
    }

    const allStudentUserIds = groups.flatMap((g) => g.students.map((s) => s.userId));

    const bins = await prisma.bin.findMany({
      where:
        allStudentUserIds.length > 0
          ? { registeredByStudentId: { in: allStudentUserIds } }
          : { id: "impossible-id" },
      take: 200,
      select: {
        id: true,
        qrCode: true,
        status: true,
        latitude: true,
        longitude: true,
        user: { select: { name: true, address: true } },
      },
    });

    const groupKelurahans = groups.map((g) => g.kelurahan).filter(Boolean) as string[];

    const rwAreas = await prisma.rw.findMany({
      where:
        groupKelurahans.length > 0
          ? { kelurahan: { name: { in: groupKelurahans, mode: "insensitive" } } }
          : {},
      include: { kelurahan: true },
    });

    return {
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        kelurahan: g.kelurahan || null,
        cakupanRw: g.cakupanRw,
      })),
      rwAreas: rwAreas.map((rw) => ({
        id: rw.id,
        name: rw.name,
        kelurahan: rw.kelurahan?.name || null,
        latitude: rw.latitude ? Number(rw.latitude) : null,
        longitude: rw.longitude ? Number(rw.longitude) : null,
      })),
      bins: bins.map((b) => ({
        id: b.id,
        qrCode: b.qrCode,
        status: b.status,
        latitude: b.latitude ? Number(b.latitude) : null,
        longitude: b.longitude ? Number(b.longitude) : null,
        wargaNama: b.user?.name || "Warga",
      })),
    };
  },

  /**
   * 5. Notifikasi / Alert DPL (Hanya Pengajuan Izin dari Mahasiswa Bimbingan DPL)
   */
  getAlerts: async (dplUserId: string, role?: string) => {
    // 1. Auto-eskalasi pengajuan izin yang PENDING lebih dari 48 jam (2x24 jam) ke Task Force
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    await prisma.studentLeaveRequest.updateMany({
      where: {
        status: "PENDING",
        createdAt: { lt: twoDaysAgo },
      },
      data: {
        status: "ESCALATED",
        rejectionReason: "Auto-eskalasi ke Panitia Task Force (Melewati batas respon 2x24 jam)",
      },
    });

    const groups = await prisma.kelompokKkn.findMany({
      where: getKelompokWhere(dplUserId, role),
      select: {
        id: true,
        students: { select: { userId: true, user: { select: { name: true } } } },
      },
    });

    if (groups.length === 0) {
      return { pendingApprovalsCount: 0, pendingRequests: [] };
    }

    const studentMap = new Map<string, string>();
    groups.forEach((g) =>
      g.students.forEach((s) => studentMap.set(s.userId, s.user?.name || "Mahasiswa"))
    );

    const studentUserIds = Array.from(studentMap.keys());
    if (studentUserIds.length === 0) {
      return { pendingApprovalsCount: 0, pendingRequests: [] };
    }

    const pendingRequests = await prisma.studentLeaveRequest.findMany({
      where: { studentId: { in: studentUserIds }, status: "PENDING" },
      include: {
        student: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      pendingApprovalsCount: pendingRequests.length,
      pendingRequests: pendingRequests.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: r.student?.name || "Mahasiswa",
        type: r.type,
        reason: r.reason,
        evidenceUrl: r.evidenceUrl,
        startDate: r.startDate,
        endDate: r.endDate,
        createdAt: r.createdAt,
      })),
    };
  },

  /**
   * 6. Riwayat Approval Log DPL (Hanya Riwayat Kelompok DPL)
   */
  getApprovalHistory: async (dplUserId: string, role?: any) => {
    const normalizedRole = getRoleString(role);
    const isAdmin = [
      "DEVELOPER",
      "ADMIN_DLH",
      "DLH",
      "DLH_ADMIN",
      "SUPER_USER",
      "ADMIN",
      "PANITIA_TASKFORCE",
      "PEMIMPIN",
    ].some((r) => normalizedRole.includes(r));

    const groups = await prisma.kelompokKkn.findMany({
      where: getKelompokWhere(dplUserId, role),
      select: { students: { select: { userId: true } } },
    });

    const studentUserIds = groups.flatMap((g) => g.students.map((s) => s.userId));

    const history = await prisma.studentLeaveRequest.findMany({
      where: isAdmin
        ? { reviewedAt: { not: null } }
        : {
            AND: [
              { studentId: { in: studentUserIds } },
              {
                OR: [
                  { reviewedById: dplUserId },
                  { status: { in: ["APPROVED", "REJECTED", "ESCALATED"] } },
                ],
              },
            ],
          },
      include: {
        student: { select: { name: true } },
      },
      orderBy: { reviewedAt: "desc" },
      take: 50,
    });

    return history.map((h) => ({
      id: h.id,
      studentName: h.student?.name || "Mahasiswa",
      type: h.type,
      reason: h.reason,
      status: h.status,
      startDate: h.startDate,
      endDate: h.endDate,
      reviewedAt: h.reviewedAt || h.updatedAt,
      rejectionReason: h.rejectionReason,
    }));
  },

  /**
   * 7. Form Penilaian Aktivitas Mahasiswa
   */
  assessStudent: async (dplUserId: string, studentId: string, score: number, note?: string) => {
    if (typeof score !== "number" || isNaN(score) || score < 0 || score > 100) {
      throw new Error("INVALID_SCORE_RANGE: Nilai asesmen harus berada di antara 0 sampai 100");
    }

    const student = await prisma.studentKkn.findFirst({
      where: {
        OR: [{ id: studentId }, { userId: studentId }],
      },
    });

    if (!student) {
      throw new Error("STUDENT_NOT_FOUND_OR_FORBIDDEN");
    }

    const updated = await prisma.studentKkn.update({
      where: { id: student.id },
      data: {
        assessmentScore: score,
      },
      include: { user: { select: { name: true } } },
    });

    return {
      success: true,
      studentId: updated.id,
      studentName: updated.user?.name || "Mahasiswa",
      assessmentScore: Number(updated.assessmentScore),
      note: note || "Penilaian berhasil disimpan",
    };
  },

  /**
   * Decide (Approve/Reject/Escalate) Leave Request
   * Saat APPROVED: otomatis mengupdate / meng-generate absensi SAKIT/IZIN pada jadwal terkait.
   */
  decideLeaveRequest: async (
    dplUserId: string,
    requestId: string,
    status: "APPROVED" | "REJECTED" | "ESCALATED",
    rejectionReason?: string
  ) => {
    const req = await prisma.studentLeaveRequest.findUnique({
      where: { id: requestId },
      include: {
        student: {
          include: {
            studentProfile: {
              include: { kelompok: true },
            },
          },
        },
      },
    });

    if (!req) {
      throw new Error("REQUEST_NOT_FOUND");
    }

    const updated = await prisma.studentLeaveRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedById: dplUserId,
        reviewedAt: new Date(),
        rejectionReason: status === "REJECTED" || status === "ESCALATED" ? rejectionReason : null,
      },
    });

    // Jika disetujui (APPROVED), sinkronkan presensi otomatis untuk jadwal kegiatan mahasiswa ybs
    if (status === "APPROVED") {
      const start = new Date(req.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.endDate || req.startDate);
      end.setHours(23, 59, 59, 999);

      const studentProfile = await prisma.studentKkn.findFirst({
        where: {
          OR: [{ userId: req.studentId }, { id: req.studentId }],
        },
      });

      const targetStudentId = studentProfile?.userId || req.studentId;

      const schedules = await prisma.schedule.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
          ...(studentProfile?.kelompokId
            ? { OR: [{ kelompokId: studentProfile.kelompokId }, { kelompokId: null }] }
            : {}),
        },
      });

      const attStatus = String(req.type || "")
        .toUpperCase()
        .includes("SAKIT")
        ? "SAKIT"
        : "IZIN";

      for (const sch of schedules) {
        const lat = sch.latitude ? Number(sch.latitude) : 0;
        const lng = sch.longitude ? Number(sch.longitude) : 0;
        await prisma.activityAttendance.upsert({
          where: {
            studentId_scheduleId: {
              studentId: targetStudentId,
              scheduleId: sch.id,
            },
          },
          create: {
            studentId: targetStudentId,
            scheduleId: sch.id,
            status: attStatus,
            method: "IZIN_DPL",
            latitude: lat,
            longitude: lng,
            attendedAt: new Date(),
          },
          update: {
            status: attStatus,
            method: "IZIN_DPL",
          },
        });
      }
    }

    return updated;
  },

  /**
   * 8. Program Kerja KKN - Get List
   */
  getProgramKerja: async (dplUserId: string, groupId?: string, role?: any) => {
    const whereGroup: any = getKelompokWhere(dplUserId, role);
    if (groupId) whereGroup.id = groupId;

    const groups = await prisma.kelompokKkn.findMany({
      where: whereGroup,
      select: { id: true, name: true, kelurahan: true, cakupanRw: true },
    });

    if (groups.length === 0) {
      return [];
    }

    const groupIds = groups.map((g) => g.id);
    const groupMap = new Map(groups.map((g) => [g.id, g]));

    const prokers = await prisma.programKerjaKkn.findMany({
      where: { kelompokId: { in: groupIds } },
      include: {
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ kelompokId: "asc" }, { nomor: "asc" }, { createdAt: "asc" }],
    });

    return prokers.map((p) => ({
      id: p.id,
      kelompokId: p.kelompokId,
      kelompokName: groupMap.get(p.kelompokId)?.name || "-",
      kelurahan: groupMap.get(p.kelompokId)?.kelurahan || "-",
      nomor: p.nomor || 1,
      deskripsi: p.deskripsi,
      kategori: p.kategori || "LAINNYA",
      sumber: p.sumber || "MAHASISWA",
      waktuPelaksanaan: p.waktuPelaksanaan || null,
      linkGoogleDrive: p.linkGoogleDrive || null,
      kebutuhanBiaya: Number(p.kebutuhanBiaya || 0),
      status: p.status,
      catatanDpl: p.catatanDpl,
      reviewedByName: p.reviewedBy?.name || null,
      reviewedAt: p.reviewedAt,
      skorPenilaian: p.skorPenilaian !== null ? Number(p.skorPenilaian) : null,
      evaluasiDpl: p.evaluasiDpl,
      createdAt: p.createdAt,
    }));
  },

  /**
   * 9. Program Kerja KKN - Create
   */
  createProgramKerja: async (
    dplUserId: string,
    role: any,
    data: {
      kelompokId: string;
      nomor?: number;
      deskripsi: string;
      kategori?: string;
      sumber?: string;
      waktuPelaksanaan?: string;
      linkGoogleDrive?: string;
      kebutuhanBiaya?: number;
    }
  ) => {
    const groups = await prisma.kelompokKkn.findMany({
      where: getKelompokWhere(dplUserId, role),
      select: { id: true },
    });
    const allowedGroupIds = groups.map(g => g.id);

    if (!allowedGroupIds.includes(data.kelompokId)) {
      throw new Error("FORBIDDEN_SCOPE");
    }

    const proker = await prisma.programKerjaKkn.create({
      data: {
        kelompokId: data.kelompokId,
        nomor: data.nomor || 1,
        deskripsi: data.deskripsi,
        kategori: data.kategori || "LAINNYA",
        sumber: data.sumber || "MAHASISWA",
        waktuPelaksanaan: data.waktuPelaksanaan || null,
        linkGoogleDrive: data.linkGoogleDrive || null,
        kebutuhanBiaya: data.kebutuhanBiaya || 0,
        status: "BELUM_DISETUJUI",
      },
    });
    return proker;
  },

  /**
   * 10. Program Kerja KKN - Update
   */
  updateProgramKerja: async (
    id: string,
    userId: string,
    role: any,
    data: {
      nomor?: number;
      deskripsi?: string;
      kategori?: string;
      sumber?: string;
      waktuPelaksanaan?: string;
      linkGoogleDrive?: string;
      kebutuhanBiaya?: number;
      status?: "BELUM_DISETUJUI" | "DITERIMA" | "DITOLAK" | "SEDANG_BERJALAN" | "SELESAI";
      catatanDpl?: string;
    }
  ) => {
    const prokerExisting = await prisma.programKerjaKkn.findUnique({ where: { id } });
    if (!prokerExisting) throw new Error("Program kerja tidak ditemukan");

    const groups = await prisma.kelompokKkn.findMany({
      where: getKelompokWhere(userId, role),
      select: { id: true },
    });
    const allowedGroupIds = groups.map(g => g.id);

    if (!allowedGroupIds.includes(prokerExisting.kelompokId)) {
      throw new Error("FORBIDDEN_SCOPE");
    }

    const updateData: any = {};
    if (data.nomor !== undefined) updateData.nomor = data.nomor;
    if (data.deskripsi !== undefined) updateData.deskripsi = data.deskripsi;
    if (data.kategori !== undefined) updateData.kategori = data.kategori;
    if (data.sumber !== undefined) updateData.sumber = data.sumber;
    if (data.waktuPelaksanaan !== undefined) updateData.waktuPelaksanaan = data.waktuPelaksanaan;
    if (data.linkGoogleDrive !== undefined) updateData.linkGoogleDrive = data.linkGoogleDrive;
    if (data.kebutuhanBiaya !== undefined) updateData.kebutuhanBiaya = data.kebutuhanBiaya;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.catatanDpl !== undefined) updateData.catatanDpl = data.catatanDpl;

    const proker = await prisma.programKerjaKkn.update({
      where: { id },
      data: updateData,
    });
    return proker;
  },

  /**
   * 11. Program Kerja KKN - Delete
   */
  deleteProgramKerja: async (id: string, userId: string, role: any) => {
    const prokerExisting = await prisma.programKerjaKkn.findUnique({ where: { id } });
    if (!prokerExisting) throw new Error("Program kerja tidak ditemukan");

    const groups = await prisma.kelompokKkn.findMany({
      where: getKelompokWhere(userId, role),
      select: { id: true },
    });
    const allowedGroupIds = groups.map(g => g.id);

    if (!allowedGroupIds.includes(prokerExisting.kelompokId)) {
      throw new Error("FORBIDDEN_SCOPE");
    }

    return await prisma.programKerjaKkn.delete({
      where: { id },
    });
  },

  /**
   * 12. Program Kerja KKN - Decision (Accept / Reject / Update Status)
   */
  decideProgramKerja: async (
    dplUserId: string,
    id: string,
    status: "DITERIMA" | "DITOLAK" | "SEDANG_BERJALAN" | "SELESAI" | "BELUM_DISETUJUI",
    catatanDpl?: string
  ) => {
    const proker = await prisma.programKerjaKkn.update({
      where: { id },
      data: {
        status,
        catatanDpl: catatanDpl || null,
        reviewedById: dplUserId,
        reviewedAt: new Date(),
      },
    });
    return proker;
  },

  /**
   * 13. Program Kerja KKN - Penilaian / Evaluasi Output Proker
   */
  assessProgramKerja: async (
    dplUserId: string,
    id: string,
    skorPenilaian: number,
    evaluasiDpl?: string
  ) => {
    if (skorPenilaian < 0 || skorPenilaian > 100) {
      throw new Error("Skor penilaian harus berada di rentang 0-100");
    }
    const proker = await prisma.programKerjaKkn.update({
      where: { id },
      data: {
        skorPenilaian,
        evaluasiDpl: evaluasiDpl || null,
        reviewedById: dplUserId,
        reviewedAt: new Date(),
      },
    });
    return proker;
  },

  /**
   * 14. Rekap Nilai Akhir & Lembar Penilaian KKN (Submenu 3)
   */
  getRekapNilaiAkhir: async (dplUserId: string, groupId?: string, role?: any) => {
    const whereGroup: any = getKelompokWhere(dplUserId, role);
    if (groupId) whereGroup.id = groupId;

    const groups = await prisma.kelompokKkn.findMany({
      where: whereGroup,
      include: {
        students: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        programKerja: true,
      },
    });

    if (groups.length === 0) {
      return { groups: [], students: [], stats: { totalStudents: 0, rerataNilai: 0, rerataKehadiran: 0 } };
    }

    const allStudentsList: any[] = [];
    let totalScoreSum = 0;
    let totalAttRateSum = 0;

    for (const grp of groups) {
      const totalSchedules = await getEligiblePastSchedulesCount(grp.id);
      const prokerCount = grp.programKerja.length;
      const prokerAccepted = grp.programKerja.filter((p) => p.status === "DITERIMA").length;
      const prokerAvgScore =
        prokerCount > 0
          ? grp.programKerja.reduce((acc, p) => acc + Number(p.skorPenilaian || 0), 0) / prokerCount
          : 0;

      for (const st of grp.students) {
        const attendancesCount = await prisma.activityAttendance.count({
          where: { studentId: st.userId },
        });

        const points = await prisma.pointHistory.aggregate({
          where: { userId: st.userId },
          _sum: { points: true },
        });

        const attRate =
          totalSchedules === 0 || attendancesCount === 0
            ? 0
            : Math.min(100, Math.round((attendancesCount / totalSchedules) * 100));

        const indivScore = Number(st.assessmentScore || 0);
        // Formula nilai akhir: 40% Kinerja Individu + 30% Output Proker Kelompok + 30% Disiplin & Presensi
        const finalScore =
          indivScore > 0 || prokerAvgScore > 0 || attRate > 0
            ? Math.round((indivScore * 0.4 + prokerAvgScore * 0.3 + attRate * 0.3) * 100) / 100
            : 0;

        let gradeLetter = "E";
        if (finalScore >= 85) gradeLetter = "A";
        else if (finalScore >= 75) gradeLetter = "B";
        else if (finalScore >= 65) gradeLetter = "C";
        else if (finalScore >= 55) gradeLetter = "D";

        totalScoreSum += finalScore;
        totalAttRateSum += attRate;

        allStudentsList.push({
          id: st.id,
          userId: st.userId,
          name: st.user?.name || "Mahasiswa",
          nim: st.nim || "-",
          jurusan: st.jurusan || "-",
          fakultas: st.fakultas || "-",
          kelompokId: grp.id,
          kelompokName: grp.name,
          kelurahan: grp.kelurahan || "-",
          isKetua: Boolean(st.isKetua),
          skorIndividu: indivScore,
          catatanIndividu: st.assessmentNote || "",
          skorProkerKelompok: Math.round(prokerAvgScore * 100) / 100,
          tingkatKehadiran: attRate,
          poinDampingan: points._sum.points || 0,
          nilaiAkhir: finalScore,
          hurufMutu: gradeLetter,
          statusLulus: finalScore >= 65 ? "LULUS" : "BELUM LULUS",
        });
      }
    }

    const totalStudents = allStudentsList.length;
    const rerataNilai =
      totalStudents > 0 ? Math.round((totalScoreSum / totalStudents) * 100) / 100 : 0;
    const rerataKehadiran =
      totalStudents > 0 ? Math.round((totalAttRateSum / totalStudents) * 100) / 100 : 0;

    return {
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        kelurahan: g.kelurahan || null,
        totalProker: g.programKerja.length,
        prokerDisetujui: g.programKerja.filter((p) => p.status === "DITERIMA").length,
      })),
      students: allStudentsList,
      stats: {
        totalStudents,
        rerataNilai,
        rerataKehadiran,
      },
    };
  },

  /**
   * 15. Target & Konfigurasi KKN (Fetch & Update Real DB SystemConfig)
   */
  getConfigTargets: async () => {
    const keys = [
      "kkn_target_total_kegiatan",
      "kkn_target_total_jam",
      "kkn_target_harian_jam",
      "kkn_target_harian_kegiatan",
      "kkn_hari_kerja",
      "kkn_jam_kerja",
      "kkn_target_pekan",
      "kkn_target_total_hari",
      "kkn_catatan_dpl",
      "attendance_min_duration_hours",
      "attendance_min_duration_minutes",
    ];

    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: keys } },
    });

    const configMap = new Map(configs.map((c) => [c.key, c.value]));

    const ruleHours = parseInt(configMap.get("attendance_min_duration_hours") || "2", 10);
    const ruleMins = parseInt(configMap.get("attendance_min_duration_minutes") || "0", 10);
    const targetHarianJamFromRule = ruleHours + (ruleMins / 60);

    return {
      targetTotalKegiatan: Number(configMap.get("kkn_target_total_kegiatan") || 2000),
      targetTotalJam: Number(configMap.get("kkn_target_total_jam") || 100),
      targetHarianJam: targetHarianJamFromRule || Number(configMap.get("kkn_target_harian_jam") || 2),
      targetHarianKegiatan: Number(configMap.get("kkn_target_harian_kegiatan") || 5),
      hariKerja: configMap.get("kkn_hari_kerja") || "Senin – Jumat",
      jamKerja: configMap.get("kkn_jam_kerja") || "08.00 – 16.00",
      targetPekan: Number(configMap.get("kkn_target_pekan") || 10),
      targetTotalHari: Number(configMap.get("kkn_target_total_hari") || 50),
      catatanDpl: configMap.get("kkn_catatan_dpl") || "Pastikan mahasiswa hadir minimal 4 jam per hari di lokasi kegiatan. Verifikasi lokasi melalui GPS dan unduh berita acara sebagai bukti validasi.",
    };
  },

  updateConfigTargets: async (data: {
    targetTotalKegiatan?: number;
    targetTotalJam?: number;
    targetHarianJam?: number;
    targetHarianKegiatan?: number;
    hariKerja?: string;
    jamKerja?: string;
    targetPekan?: number;
    targetTotalHari?: number;
    catatanDpl?: string;
    updatedBy?: string;
  }) => {
    const updates: { key: string; value: string; desc: string; tipe: string }[] = [];
    if (data.targetTotalKegiatan !== undefined) {
      updates.push({
        key: "kkn_target_total_kegiatan",
        value: String(data.targetTotalKegiatan),
        desc: "Target total seluruh kegiatan KKN",
        tipe: "NUMBER",
      });
    }
    if (data.targetTotalJam !== undefined) {
      updates.push({
        key: "kkn_target_total_jam",
        value: String(data.targetTotalJam),
        desc: "Target total jam kegiatan mahasiswa KKN",
        tipe: "NUMBER",
      });
    }
    if (data.targetHarianJam !== undefined) {
      updates.push({
        key: "kkn_target_harian_jam",
        value: String(data.targetHarianJam),
        desc: "Target minimum jam per hari mahasiswa KKN",
        tipe: "NUMBER",
      });
    }
    if (data.targetHarianKegiatan !== undefined) {
      updates.push({
        key: "kkn_target_harian_kegiatan",
        value: String(data.targetHarianKegiatan),
        desc: "Target minimum kegiatan per hari mahasiswa KKN",
        tipe: "NUMBER",
      });
    }
    if (data.hariKerja !== undefined) {
      updates.push({
        key: "kkn_hari_kerja",
        value: String(data.hariKerja),
        desc: "Hari kerja operasional KKN",
        tipe: "STRING",
      });
    }
    if (data.jamKerja !== undefined) {
      updates.push({
        key: "kkn_jam_kerja",
        value: String(data.jamKerja),
        desc: "Jam operasional kerja KKN",
        tipe: "STRING",
      });
    }
    if (data.targetPekan !== undefined) {
      updates.push({
        key: "kkn_target_pekan",
        value: String(data.targetPekan),
        desc: "Periode pekan kegiatan KKN",
        tipe: "NUMBER",
      });
    }
    if (data.targetTotalHari !== undefined) {
      updates.push({
        key: "kkn_target_total_hari",
        value: String(data.targetTotalHari),
        desc: "Total hari kegiatan KKN",
        tipe: "NUMBER",
      });
    }
    if (data.catatanDpl !== undefined) {
      updates.push({
        key: "kkn_catatan_dpl",
        value: String(data.catatanDpl),
        desc: "Catatan panduan presensi untuk DPL",
        tipe: "STRING",
      });
    }

    for (const u of updates) {
      await prisma.systemConfig.upsert({
        where: { key: u.key },
        create: {
          key: u.key,
          value: u.value,
          tipe: u.tipe,
          deskripsi: u.desc,
          updatedBy: data.updatedBy || "SYSTEM",
        },
        update: {
          value: u.value,
          updatedBy: data.updatedBy || "SYSTEM",
        },
      });
    }

    return await dplService.getConfigTargets();
  },
};
