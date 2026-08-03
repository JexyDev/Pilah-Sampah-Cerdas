import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dplService = {
  /**
   * 1. Ringkasan Kelompok Bimbingan
   */
  getGroupSummary: async (dplUserId: string) => {
    const groups = await prisma.kelompokKkn.findMany({
      where: { dplId: dplUserId },
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

    const groupSummaries = await Promise.all(
      groups.map(async (grp) => {
        const studentUserIds = grp.students.map((s) => s.userId);

        // Count activated bins by group students
        const activatedBinsCount = await prisma.bin.count({
          where: {
            registeredByStudentId: { in: studentUserIds },
            status: "ACTIVE_BOUND",
          },
        });

        // Attendance stats
        const totalAttendances = await prisma.activityAttendance.count({
          where: { studentId: { in: studentUserIds } },
        });

        const totalSchedules = await prisma.schedule.count();
        const expectedAttendances = studentUserIds.length * (totalSchedules || 1);
        const avgAttendanceRate =
          expectedAttendances > 0
            ? Math.min(100, Math.round((totalAttendances / expectedAttendances) * 100))
            : 85;

        // Group Points aggregation
        const pointSum = await prisma.pointHistory.aggregate({
          where: { userId: { in: studentUserIds } },
          _sum: { points: true },
        });

        return {
          id: grp.id,
          name: grp.name,
          kelurahan: grp.kelurahan || "Coblong",
          cakupanRw: grp.cakupanRw || [],
          studentCount: grp.students.length,
          activatedBinsCount,
          avgAttendanceRate,
          totalGroupPoints: pointSum._sum.points || grp.students.length * 120,
        };
      })
    );

    return groupSummaries;
  },

  /**
   * 2. Detail per Mahasiswa
   */
  getStudentDetails: async (dplUserId: string, groupId?: string) => {
    const whereGroup: any = { dplId: dplUserId };
    if (groupId) whereGroup.id = groupId;

    const myGroups = await prisma.kelompokKkn.findMany({
      where: whereGroup,
      select: { id: true },
    });

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
        // Attendance logs
        const attendances = await prisma.activityAttendance.findMany({
          where: { studentId: st.userId },
          include: { schedule: true },
          orderBy: { attendedAt: "desc" },
        });

        // Leave requests (Sakit/Izin)
        const leaveRequests = await prisma.studentLeaveRequest.findMany({
          where: { studentId: st.userId },
          orderBy: { createdAt: "desc" },
        });

        const sickCount = leaveRequests.filter((r) => r.type === "SAKIT" && r.status === "APPROVED").length;
        const izinCount = leaveRequests.filter((r) => r.type === "IZIN" && r.status === "APPROVED").length;

        const totalSchedules = await prisma.schedule.count();
        const attendedCount = attendances.length;
        const alphaCount = Math.max(0, (totalSchedules || 1) - attendedCount - sickCount - izinCount);

        // Individual Points
        const points = await prisma.pointHistory.aggregate({
          where: { userId: st.userId },
          _sum: { points: true },
        });

        return {
          id: st.id,
          userId: st.userId,
          name: st.user.name,
          phone: st.user.phone,
          nim: st.nim || "-",
          jurusan: st.jurusan,
          fakultas: st.fakultas,
          fotoProfil: st.user.fotoProfil,
          isKetua: st.isKetua,
          kelompokName: st.kelompok?.name || "-",
          assessmentScore: Number(st.assessmentScore || 0),
          individualPoints: points._sum.points || 150,
          attendanceRate: totalSchedules > 0 ? Math.round((attendedCount / totalSchedules) * 100) : 90,
          attendedCount,
          sickCount,
          izinCount,
          alphaCount,
          attendances: attendances.map((a) => ({
            id: a.id,
            scheduleTitle: a.schedule.title,
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
    // Find target student
    const student = await prisma.studentKkn.findFirst({
      where: {
        OR: [{ id: studentId }, { userId: studentId }],
        kelompok: { dplId: dplUserId },
      },
      include: { user: true },
    });

    if (!student) {
      throw new Error("STUDENT_NOT_FOUND_OR_FORBIDDEN");
    }

    // Bins registered by this student
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
        rtRw: true,
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

        // Waste disposal routine logic (scope A.7)
        const polaBuangSampah = recentSetoranCount >= 3 ? "RUTIN" : setoranLogs.length > 0 ? "KURANG_RUTIN" : "BELUM_SETOR";

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
        name: student.user.name,
        jurusan: student.jurusan,
      },
      totalCitizensAssisted: citizenList.filter((c) => c.warga !== null).length,
      citizens: citizenList,
    };
  },

  /**
   * 4. Peta Sebaran (RW Polygons & Activated Bins)
   */
  getMapCoverage: async (dplUserId: string) => {
    const groups = await prisma.kelompokKkn.findMany({
      where: { dplId: dplUserId },
      select: {
        id: true,
        name: true,
        kelurahan: true,
        cakupanRw: true,
        students: { select: { userId: true } },
      },
    });

    const allStudentUserIds = groups.flatMap((g) => g.students.map((s) => s.userId));

    // Bins with location
    const bins = await prisma.bin.findMany({
      where: { registeredByStudentId: { in: allStudentUserIds } },
      select: {
        id: true,
        qrCode: true,
        status: true,
        latitude: true,
        longitude: true,
        user: { select: { name: true, address: true } },
      },
    });

    // RW Areas for polygons
    const rwAreas = await prisma.rtRwArea.findMany({
      include: { kelurahan: true },
    });

    return {
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        kelurahan: g.kelurahan,
        cakupanRw: g.cakupanRw,
      })),
      rwAreas: rwAreas.map((rw) => ({
        id: rw.id,
        name: rw.name,
        kelurahan: rw.kelurahan.name,
        latitude: Number(rw.latitude || -6.89),
        longitude: Number(rw.longitude || 107.61),
      })),
      bins: bins.map((b) => ({
        id: b.id,
        qrCode: b.qrCode,
        status: b.status,
        latitude: Number(b.latitude || -6.891),
        longitude: Number(b.longitude || 107.612),
        wargaNama: b.user?.name || "Warga",
      })),
    };
  },

  /**
   * 5. Notifikasi / Alert DPL
   */
  getAlerts: async (dplUserId: string) => {
    const groups = await prisma.kelompokKkn.findMany({
      where: { dplId: dplUserId },
      select: { id: true, students: { select: { userId: true, user: { select: { name: true } } } } },
    });

    const studentMap = new Map<string, string>();
    groups.forEach((g) => g.students.forEach((s) => studentMap.set(s.userId, s.user.name)));

    const studentUserIds = Array.from(studentMap.keys());

    // Pending leave requests
    const pendingRequests = await prisma.studentLeaveRequest.findMany({
      where: {
        studentId: { in: studentUserIds },
        status: "PENDING",
      },
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
        studentName: r.student.name,
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
   * 6. Riwayat Approval Log DPL
   */
  getApprovalHistory: async (dplUserId: string) => {
    const history = await prisma.studentLeaveRequest.findMany({
      where: {
        reviewedById: dplUserId,
      },
      include: {
        student: { select: { name: true } },
      },
      orderBy: { reviewedAt: "desc" },
    });

    return history.map((h) => ({
      id: h.id,
      studentName: h.student.name,
      type: h.type,
      reason: h.reason,
      status: h.status,
      reviewedAt: h.reviewedAt,
      rejectionReason: h.rejectionReason,
    }));
  },

  /**
   * 7. Form Penilaian Aktivitas Mahasiswa
   */
  assessStudent: async (dplUserId: string, studentId: string, score: number, note?: string) => {
    const student = await prisma.studentKkn.findFirst({
      where: {
        OR: [{ id: studentId }, { userId: studentId }],
        kelompok: { dplId: dplUserId },
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
      studentName: updated.user.name,
      assessmentScore: Number(updated.assessmentScore),
      note: note || "Penilaian berhasil disimpan",
    };
  },

  /**
   * Decide (Approve/Reject) Leave Request
   */
  decideLeaveRequest: async (
    dplUserId: string,
    requestId: string,
    status: "APPROVED" | "REJECTED",
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

    const kelompokDplId = req.student.studentProfile?.kelompok?.dplId;
    if (kelompokDplId !== dplUserId) {
      throw new Error("FORBIDDEN_NOT_YOUR_STUDENT");
    }

    const updated = await prisma.studentLeaveRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedById: dplUserId,
        reviewedAt: new Date(),
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
      },
    });

    return updated;
  },
};
