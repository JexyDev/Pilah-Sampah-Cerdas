import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    const groupSummaries = await Promise.all(
      groups.map(async (grp, idx) => {
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

        const totalSchedules = await prisma.schedule.count();
        const expectedAttendances = studentCount * totalSchedules;
        const avgAttendanceRate =
          expectedAttendances > 0 && totalAttendances > 0
            ? Math.min(100, Math.round((totalAttendances / expectedAttendances) * 100))
            : 0;

        const pointSum = await prisma.pointHistory.aggregate({
          where:
            studentUserIds.length > 0
              ? { userId: { in: studentUserIds } }
              : { id: "impossible-id" },
          _sum: { points: true },
        });

        return {
          id: grp.id,
          name: grp.name,
          kelurahan: grp.kelurahan || null,
          cakupanRw: grp.cakupanRw || [],
          studentCount,
          activatedBinsCount,
          avgAttendanceRate,
          totalGroupPoints: pointSum._sum.points || 0,
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

        const totalSchedules = await prisma.schedule.count();
        const attendedCount = attendances.length;
        const alphaCount =
          totalSchedules > 0
            ? Math.max(0, totalSchedules - attendedCount - sickCount - izinCount)
            : 0;

        const points = await prisma.pointHistory.aggregate({
          where: { userId: st.userId },
          _sum: { points: true },
        });

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
          assessmentScore: Number(st.assessmentScore || 0),
          individualPoints: points._sum.points || 0,
          attendanceRate:
            totalSchedules > 0 && attendedCount > 0
              ? Math.round((attendedCount / totalSchedules) * 100)
              : 0,
          attendedCount,
          sickCount,
          izinCount,
          alphaCount,
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

    // Jika disetujui (APPROVED), sinkronkan presensi otomatis untuk seluruh jadwal kegiatan dalam rentang tanggal izin
    if (status === "APPROVED") {
      const start = new Date(req.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.endDate || req.startDate);
      end.setHours(23, 59, 59, 999);

      const schedules = await prisma.schedule.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
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
              studentId: req.studentId,
              scheduleId: sch.id,
            },
          },
          create: {
            studentId: req.studentId,
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
};
