/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * MPL Service — Mitra Pendamping Lapangan
 * Versi kelurahan dari DPL. Scope data strict by kelurahan:
 * KelompokKkn.mplId === userId MPL yang sedang login.
 *
 * Semua fungsi di sini adalah wrapper/adapter dari dplService
 * dengan override pada getMplKelompokWhere() yang menggantikan
 * getKelompokWhere() milik DPL.
 */

import { prisma } from "../lib/prisma.js";
import {
  dplService,
  getRoleString,
  isDplSuperUser,
  parseProkerDeskripsi,
} from "./dplService.js";
import { configService } from "./configService.js";

// ─────────────────────────────────────────────
// Helper: Scope kelompok untuk MPL
// Berbeda dari DPL yang scope by dplId,
// MPL scope by mplId di tabel kelompok_kkn.
// ─────────────────────────────────────────────
export async function getMplKelompokWhere(mplUserId: string, role?: any) {
  const normalizedRole = getRoleString(role);

  // Admin/super user: akses semua kelompok
  if (isDplSuperUser(role)) {
    return {};
  }

  // MPL: hanya kelompok yang mplId-nya sama dengan userId yang login
  return {
    OR: [{ mplId: mplUserId }, { mpl: { id: mplUserId } }],
  };
}

export const mplService = {
  /**
   * 1. Ringkasan kelompok yang di-assign ke MPL ini
   * Scope: KelompokKkn.mplId === mplUserId
   */
  getGroupSummary: async (mplUserId: string, role?: string) => {
    // Inject getKelompokWhere override: pakai getMplKelompokWhere
    const where = await getMplKelompokWhere(mplUserId, role);

    const kelurahanRecords = await prisma.kelurahan.findMany({
      include: {
        kecamatan: {
          include: { kabupaten: { include: { provinsi: true } } },
        },
        rws: { select: { id: true, name: true, latitude: true, longitude: true } },
      },
    });

    const kelurahanMap = new Map<string, (typeof kelurahanRecords)[0]>();
    kelurahanRecords.forEach((k) => {
      const cleanName = k.name.toLowerCase().trim();
      kelurahanMap.set(cleanName, k);
      kelurahanMap.set(cleanName.replace(/^kelurahan\s+/i, ""), k);
      kelurahanMap.set(cleanName.replace(/\s+/g, ""), k);
    });

    const groups = await prisma.kelompokKkn.findMany({
      where,
      include: {
        dpl: {
          select: {
            id: true, name: true, nip: true, institusi: true,
            programStudi: true, phone: true,
          },
        },
        mpl: {
          select: { id: true, name: true, phone: true },
        },
        poskoKkn: {
          select: { id: true, nama: true, alamat: true, latitude: true, longitude: true },
        },
        facilities: true,
        students: {
          include: {
            assignedRw: {
              select: {
                id: true, name: true,
                kelurahan: { include: { kecamatan: { include: { kabupaten: { include: { provinsi: true } } } } } },
              },
            },
            user: {
              select: {
                id: true, name: true, phone: true, fotoProfil: true,
                address: true, rwId: true, rtId: true,
                rw: {
                  select: {
                    id: true, name: true,
                    kelurahan: { include: { kecamatan: { include: { kabupaten: { include: { provinsi: true } } } } } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    if (groups.length === 0) return [];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const configTargets = await mplService.getConfigTargets();

    const groupSummaries = await Promise.all(
      groups.map(async (grp) => {
        const studentUserIds = grp.students.map((s) => s.userId);
        const studentCount = grp.students.length;
        const ketuaStudent = grp.students.find((s) => s.isKetua);

        // Resolusi kelurahan
        let rawKel = (grp.kelurahan || "").trim();
        if (!rawKel && grp.students.length > 0) {
          const stWithRw = grp.students.find(
            (s) => s.assignedRw?.kelurahan?.name || s.user?.rw?.kelurahan?.name
          );
          if (stWithRw) {
            rawKel = stWithRw.assignedRw?.kelurahan?.name || stWithRw.user?.rw?.kelurahan?.name || "";
          }
        }
        if (!rawKel) rawKel = "Sadang Serang";

        const cleanLookup = rawKel.toLowerCase().trim();
        const matchedKelurahan =
          kelurahanMap.get(cleanLookup) ||
          kelurahanMap.get(cleanLookup.replace(/^kelurahan\s+/i, "")) ||
          kelurahanMap.get(cleanLookup.replace(/\s+/g, "")) ||
          kelurahanRecords[0] ||
          null;

        const resolvedKelurahanName = matchedKelurahan ? matchedKelurahan.name : rawKel;
        const kecamatanName = matchedKelurahan?.kecamatan?.name || "Coblong";
        const kabupatenName = matchedKelurahan?.kecamatan?.kabupaten?.name || "Kota Bandung";
        const provinsiName = matchedKelurahan?.kecamatan?.kabupaten?.provinsi?.name || "Jawa Barat";

        // Resolusi cakupan RW
        let resolvedCakupanRw: string[] = [];
        if (grp.cakupanRw) {
          if (Array.isArray(grp.cakupanRw)) {
            resolvedCakupanRw = (grp.cakupanRw as any[])
              .map((r: any) => String(r).trim().replace(/^RW\s*/i, ""))
              .filter(Boolean);
          } else if (typeof grp.cakupanRw === "string") {
            resolvedCakupanRw = (grp.cakupanRw as string)
              .split(/[,&/]/)
              .map((r: string) => r.trim().replace(/^RW\s*/i, ""))
              .filter(Boolean);
          }
        }
        if (resolvedCakupanRw.length === 0 && grp.students.length > 0) {
          const rwSet = new Set<string>();
          grp.students.forEach((s) => {
            const rwName = s.assignedRw?.name || s.user?.rw?.name;
            if (rwName) rwSet.add(String(rwName).replace(/^RW\s*/i, "").trim());
          });
          if (rwSet.size > 0) resolvedCakupanRw = Array.from(rwSet);
        }

        const binWhere: any =
          studentUserIds.length > 0
            ? { status: "ACTIVE_BOUND", registeredByStudentId: { in: studentUserIds } }
            : { id: "impossible-id" };

        const [activatedBinsCount, totalWasteSumResult, totalAttendances, activeTodayGroups] =
          await Promise.all([
            prisma.bin.count({ where: binWhere }),
            prisma.setoranOtomatis.aggregate({
              where: { bin: binWhere },
              _sum: { berat: true },
            }),
            prisma.activityAttendance.count({
              where: studentUserIds.length > 0 ? { studentId: { in: studentUserIds } } : { id: "impossible-id" },
            }),
            studentUserIds.length > 0
              ? prisma.activityAttendance.groupBy({
                  by: ["studentId"],
                  where: { studentId: { in: studentUserIds }, attendedAt: { gte: todayStart, lte: todayEnd } },
                })
              : Promise.resolve([]),
          ]);

        const totalWasteWeight = Math.round(Number(totalWasteSumResult._sum.berat || 0) * 100) / 100;
        const activeTodayCount = activeTodayGroups.length;

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

        const pointSum = await prisma.pointHistory.aggregate({
          where: studentUserIds.length > 0 ? { userId: { in: studentUserIds } } : { id: "impossible-id" },
          _sum: { points: true },
        });

        const prokerList = await prisma.programKerjaKkn.findMany({
          where: { kelompokId: grp.id },
          orderBy: { createdAt: "desc" },
        });

        let prokerBelumMulaiCount = 0;
        let prokerSedangBerjalanCount = 0;
        let prokerSelesaiCount = 0;

        const mappedProker = prokerList.map((p, pIdx) => {
          const parsed = parseProkerDeskripsi(p.deskripsi);
          const legacySt = String(p.status || "").toUpperCase();
          let u = (p as any).statusUsulan;
          if (!u) {
            if (["DITERIMA", "DISETUJUI", "SEDANG_BERJALAN", "SELESAI"].includes(legacySt)) u = "DISETUJUI";
            else if (["DITOLAK", "TIDAK_DISETUJUI"].includes(legacySt)) u = "DITOLAK";
            else u = "BELUM_DISETUJUI";
          }
          let pl = (p as any).statusPelaksanaan;
          if (!pl) {
            if (legacySt === "SELESAI") pl = "SELESAI";
            else if (["SEDANG_BERJALAN", "SEDANG_DILAKSANAKAN", "BERJALAN"].includes(legacySt)) pl = "SEDANG_BERJALAN";
            else pl = "BELUM_MULAI";
          }
          if (pl === "SELESAI") prokerSelesaiCount++;
          else if (pl === "SEDANG_BERJALAN") prokerSedangBerjalanCount++;
          else prokerBelumMulaiCount++;

          return {
            id: p.id,
            nomor: p.nomor || pIdx + 1,
            judul: parsed.judul,
            deskripsi: parsed.deskripsi,
            kategori: p.kategori,
            sumber: p.sumber,
            waktuPelaksanaan: p.waktuPelaksanaan || null,
            linkGoogleDrive: p.linkGoogleDrive || null,
            kebutuhanBiaya: Number(p.kebutuhanBiaya || 0),
            status: p.status,
            statusUsulan: u,
            statusPelaksanaan: pl,
            skorPenilaian: p.skorPenilaian !== null ? Number(p.skorPenilaian) : null,
            createdAt: p.createdAt.toISOString(),
          };
        });

        return {
          id: grp.id,
          name: grp.name,
          kelurahan: resolvedKelurahanName || grp.kelurahan || "Sadang Serang",
          kecamatan: kecamatanName,
          kabupaten: kabupatenName,
          provinsi: provinsiName,
          cakupanRw: resolvedCakupanRw,
          posko: grp.poskoKkn
            ? {
                id: grp.poskoKkn.id,
                nama: grp.poskoKkn.nama,
                alamat: grp.poskoKkn.alamat,
                latitude: grp.poskoKkn.latitude ? Number(grp.poskoKkn.latitude) : null,
                longitude: grp.poskoKkn.longitude ? Number(grp.poskoKkn.longitude) : null,
              }
            : null,
          facilities: grp.facilities.map((f: any) => ({
            id: f.id,
            nama: f.nama,
            jenis: f.jenis,
            alamat: f.alamat,
            latitude: f.latitude ? Number(f.latitude) : null,
            longitude: f.longitude ? Number(f.longitude) : null,
            statusApproval: f.statusApproval,
          })),
          ketua: ketuaStudent
            ? {
                id: ketuaStudent.id,
                userId: ketuaStudent.userId,
                name: ketuaStudent.user?.name || "Ketua Kelompok",
                nim: ketuaStudent.nim,
                phone: ketuaStudent.user?.phone,
              }
            : null,
          dpl: grp.dpl
            ? {
                id: grp.dpl.id,
                name: grp.dpl.name,
                nip: grp.dpl.nip,
                institusi: grp.dpl.institusi,
                programStudi: grp.dpl.programStudi,
                phone: grp.dpl.phone,
              }
            : null,
          mpl: grp.mpl
            ? { id: grp.mpl.id, name: grp.mpl.name, phone: grp.mpl.phone }
            : null,
          studentCount,
          activeTodayCount,
          actualHours,
          targetHours: configTargets.targetTotalJam || 100,
          targetTotalKegiatan: configTargets.targetTotalKegiatan || 2000,
          activatedBinsCount,
          totalWasteWeight,
          avgAttendanceRate:
            totalAttendances === 0
              ? 0
              : Math.min(100, Math.round((totalAttendances / Math.max(1, studentCount)) * 100)),
          totalGroupPoints: pointSum._sum.points || 0,
          prokerBelumMulaiCount,
          prokerSedangBerjalanCount,
          prokerSelesaiCount,
          totalProkerCount: prokerList.length,
          programKerja: mappedProker,
        };
      })
    );

    return groupSummaries;
  },

  /**
   * 2. Detail mahasiswa di kelompok yang di-assign ke MPL ini
   */
  getStudentDetails: async (
    mplUserId: string,
    groupId?: string,
    role?: string,
    search?: string
  ) => {
    const whereGroup: any = await getMplKelompokWhere(mplUserId, role);
    if (groupId) whereGroup.id = groupId;

    const myGroups = await prisma.kelompokKkn.findMany({
      where: whereGroup,
      select: { id: true },
    });

    if (myGroups.length === 0) return [];
    const myGroupIds = myGroups.map((g) => g.id);

    const studentWhere: any = { kelompokId: { in: myGroupIds } };
    if (search?.trim()) {
      const q = search.trim();
      studentWhere.OR = [
        { nim: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { jurusan: { contains: q, mode: "insensitive" } },
      ];
    }

    const students = await prisma.studentKkn.findMany({
      where: studentWhere,
      include: {
        user: { select: { id: true, name: true, phone: true, fotoProfil: true } },
        kelompok: { select: { id: true, name: true, kelurahan: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const configTargets = await mplService.getConfigTargets();
    const ruleConfigs = await configService.getRuleEngineConfigs();

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

        const sickCount = leaveRequests.filter((r) => r.type === "SAKIT" && r.status === "APPROVED").length;
        const izinCount = leaveRequests.filter((r) => r.type === "IZIN" && r.status === "APPROVED").length;
        const rejectedAbsenceCount = leaveRequests.filter((r) => r.status === "REJECTED").length;

        const totalSchedules = await getEligibleMplSchedulesCount(st.kelompokId || undefined);
        const attendedCount = attendances.length;
        const rawAlpha = totalSchedules > 0 ? Math.max(0, totalSchedules - attendedCount - sickCount - izinCount) : 0;
        const alphaCount = Math.max(rawAlpha, rejectedAbsenceCount);

        const baseScore = Number(st.assessmentScore || 0);
        const penaltyPerAlpha = ruleConfigs.alphaPenaltyScorePercent || 5.0;
        const finalCalculatedScore = Math.max(0, Math.round(baseScore - alphaCount * penaltyPerAlpha));

        let totalMinutes = 0;
        for (const a of attendances) {
          if (a.checkOutAt && a.attendedAt) {
            const diffMs = Math.max(0, new Date(a.checkOutAt).getTime() - new Date(a.attendedAt).getTime());
            totalMinutes += Math.min(480, Math.round(diffMs / (1000 * 60)));
          } else if (a.attendedAt) {
            const isToday = new Date(a.attendedAt).toDateString() === new Date().toDateString();
            if (isToday) {
              totalMinutes += Math.min(480, Math.round((Date.now() - new Date(a.attendedAt).getTime()) / (1000 * 60)));
            } else {
              totalMinutes += Math.round((configTargets.targetHarianJam || 2) * 60);
            }
          }
        }
        const totalHours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        const targetHours = configTargets.targetTotalJam || 200;
        const progressPercentage = Math.round((totalMinutes / (targetHours * 60 || 1)) * 100);

        const points = await prisma.pointHistory.aggregate({
          where: { userId: st.userId },
          _sum: { points: true },
        });
        const netPoints = Math.max(0, (points._sum.points || 0) - alphaCount * (ruleConfigs.alphaPenaltyPoints || 10));

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
          isAssessed: Boolean(st.isAssessed),
          individualPoints: netPoints,
          attendanceRate: totalSchedules === 0 ? 0 : Math.min(100, Math.round((attendedCount / totalSchedules) * 100)),
          attendedCount,
          sickCount,
          izinCount,
          alphaCount,
          totalHours,
          totalMinutes,
          remainingMinutes,
          targetHours,
          progressPercentage,
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
   * 3. Summary kumulatif jam aktual
   */
  getStudentCumulativeSummary: async (
    mplUserId: string,
    groupId?: string,
    role?: string,
    search?: string
  ) => {
    const whereGroup: any = await getMplKelompokWhere(mplUserId, role);
    if (groupId) whereGroup.id = groupId;

    const myGroups = await prisma.kelompokKkn.findMany({
      where: whereGroup,
      select: { id: true },
    });
    if (myGroups.length === 0) return [];

    const myGroupIds = myGroups.map((g) => g.id);
    const studentWhere: any = { kelompokId: { in: myGroupIds } };
    if (search?.trim()) {
      const q = search.trim();
      studentWhere.OR = [
        { nim: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { jurusan: { contains: q, mode: "insensitive" } },
      ];
    }

    const students = await prisma.studentKkn.findMany({
      where: studentWhere,
      include: {
        user: { select: { id: true, name: true, fotoProfil: true } },
        kelompok: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const configTargets = await mplService.getConfigTargets();
    const targetHours = configTargets.targetTotalJam || 200;
    const targetTotalMinutes = targetHours * 60;

    return Promise.all(
      students.map(async (st) => {
        const attendances = await prisma.activityAttendance.findMany({
          where: { studentId: st.userId },
          select: { attendedAt: true, checkOutAt: true },
        });

        let totalMinutes = 0;
        for (const a of attendances) {
          if (a.checkOutAt && a.attendedAt) {
            const diffMs = Math.max(0, new Date(a.checkOutAt).getTime() - new Date(a.attendedAt).getTime());
            totalMinutes += Math.min(480, Math.round(diffMs / (1000 * 60)));
          } else if (a.attendedAt) {
            const isToday = new Date(a.attendedAt).toDateString() === new Date().toDateString();
            totalMinutes += isToday
              ? Math.min(480, Math.round((Date.now() - new Date(a.attendedAt).getTime()) / (1000 * 60)))
              : Math.round((configTargets.targetHarianJam || 2) * 60);
          }
        }

        const totalHoursActual = Math.floor(totalMinutes / 60);
        const remainingMinsActual = totalMinutes % 60;
        const progressPercentage = Math.round((totalMinutes / (targetTotalMinutes || 1)) * 100);

        return {
          id: st.id,
          userId: st.userId,
          name: st.user?.name || "Mahasiswa KKN",
          nim: st.nim || "-",
          kelompokName: st.kelompok?.name || "-",
          fotoProfil: st.user?.fotoProfil || null,
          cumulativeStats: {
            totalActualMinutes: totalMinutes,
            totalActualFormatted: `${totalHoursActual} Jam ${remainingMinsActual} Menit`,
            targetTotalMinutes,
            targetTotalFormatted: `${targetHours} Jam`,
            progressPercentage: Math.min(100, progressPercentage),
            isTargetAchieved: totalMinutes >= targetTotalMinutes,
          },
        };
      })
    );
  },

  /**
   * 4. Warga yang dibantu oleh mahasiswa kelompok MPL
   */
  getAssistedCitizens: async (mplUserId: string, studentId: string) => {
    // Delegate langsung ke dplService — logika sama, tidak ada scope check ekstra
    return dplService.getAssistedCitizens(mplUserId, studentId);
  },

  /**
   * 5. Peta sebaran wilayah kelompok MPL
   */
  getMapCoverage: async (mplUserId: string, role?: string) => {
    const groups = await prisma.kelompokKkn.findMany({
      where: await getMplKelompokWhere(mplUserId, role),
      select: {
        id: true, name: true, kelurahan: true, cakupanRw: true,
        students: { select: { userId: true } },
      },
    });

    if (groups.length === 0) return { groups: [], rwAreas: [], bins: [] };

    const allStudentUserIds = groups.flatMap((g) => g.students.map((s) => s.userId));

    const [bins, rwAreas, poskos, facilities] = await Promise.all([
      allStudentUserIds.length > 0
        ? prisma.bin.findMany({
            where: { registeredByStudentId: { in: allStudentUserIds } },
            take: 200,
            select: {
              id: true, qrCode: true, status: true, latitude: true, longitude: true,
              user: { select: { name: true, address: true } },
            },
          })
        : Promise.resolve([]),
      prisma.rw.findMany({
        where: {
          kelurahan: {
            name: {
              in: groups.map((g) => g.kelurahan).filter(Boolean) as string[],
              mode: "insensitive",
            },
          },
        },
        include: { kelurahan: true },
      }),
      prisma.poskoKkn.findMany({
        where: { kelompokId: { in: groups.map((g) => g.id) } },
        select: { id: true, kelompokId: true, nama: true, alamat: true, latitude: true, longitude: true },
      }),
      prisma.facility.findMany({
        where: { kelompokId: { in: groups.map((g) => g.id) } },
        select: { id: true, nama: true, jenis: true, latitude: true, longitude: true, kelompokId: true, statusApproval: true },
      }),
    ]);

    return {
      groups: groups.map((g) => ({ id: g.id, name: g.name, kelurahan: g.kelurahan || null, cakupanRw: g.cakupanRw })),
      rwAreas: rwAreas.map((rw) => ({
        id: rw.id, name: rw.name,
        kelurahan: rw.kelurahan?.name || null,
        latitude: rw.latitude ? Number(rw.latitude) : null,
        longitude: rw.longitude ? Number(rw.longitude) : null,
      })),
      bins: bins.map((b) => ({
        id: b.id, qrCode: b.qrCode, status: b.status,
        latitude: b.latitude ? Number(b.latitude) : 0,
        longitude: b.longitude ? Number(b.longitude) : 0,
        wargaNama: b.user?.name || "Warga",
      })),
      poskos: poskos.map((p) => ({
        id: p.id, kelompokId: p.kelompokId, nama: p.nama, alamat: p.alamat,
        latitude: p.latitude ? Number(p.latitude) : 0,
        longitude: p.longitude ? Number(p.longitude) : 0,
      })),
      facilities: facilities.map((f) => ({
        id: f.id, nama: f.nama, jenis: f.jenis,
        latitude: f.latitude ? Number(f.latitude) : 0,
        longitude: f.longitude ? Number(f.longitude) : 0,
        kelompokId: f.kelompokId, statusApproval: f.statusApproval,
      })),
    };
  },

  /**
   * 6. Alert: pengajuan izin pending dari mahasiswa kelompok MPL
   */
  getAlerts: async (mplUserId: string, role?: string) => {
    const whereGroup = await getMplKelompokWhere(mplUserId, role);
    const myGroups = await prisma.kelompokKkn.findMany({
      where: whereGroup,
      select: { id: true, students: { select: { userId: true } } },
    });

    if (myGroups.length === 0) return { pendingApprovalsCount: 0, pendingRequests: [] };

    const allStudentUserIds = myGroups.flatMap((g) => g.students.map((s) => s.userId));
    if (allStudentUserIds.length === 0) return { pendingApprovalsCount: 0, pendingRequests: [] };

    const pendingRequests = await prisma.studentLeaveRequest.findMany({
      where: { studentId: { in: allStudentUserIds }, status: "PENDING" },
      include: { student: { select: { name: true, fotoProfil: true } } },
      orderBy: { createdAt: "asc" },
    });

    return {
      pendingApprovalsCount: pendingRequests.length,
      pendingRequests: pendingRequests.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: r.student?.name || "Mahasiswa",
        studentPhoto: r.student?.fotoProfil || null,
        type: r.type,
        reason: r.reason,
        startDate: r.startDate,
        endDate: r.endDate,
        status: r.status,
        createdAt: r.createdAt,
      })),
    };
  },

  /**
   * 7. Riwayat approval izin
   */
  getApprovalHistory: async (mplUserId: string, role?: string) => {
    const whereGroup = await getMplKelompokWhere(mplUserId, role);
    const myGroups = await prisma.kelompokKkn.findMany({
      where: whereGroup,
      select: { id: true, students: { select: { userId: true } } },
    });

    if (myGroups.length === 0) return [];
    const allStudentUserIds = myGroups.flatMap((g) => g.students.map((s) => s.userId));
    if (allStudentUserIds.length === 0) return [];

    const history = await prisma.studentLeaveRequest.findMany({
      where: { studentId: { in: allStudentUserIds }, status: { not: "PENDING" } },
      include: {
        student: { select: { name: true } },
        reviewedBy: { select: { name: true } },
      },
      orderBy: { reviewedAt: "desc" },
      take: 50,
    });

    return history.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.student?.name || "Mahasiswa",
      type: r.type,
      reason: r.reason,
      status: r.status,
      reviewedBy: r.reviewedBy?.name || null,
      reviewedAt: r.reviewedAt || null,
      createdAt: r.createdAt,
    }));
  },

  /**
   * 8. Penilaian aktivitas mahasiswa (legacy score)
   */
  assessStudent: async (mplUserId: string, studentId: string, score: number, note?: string) => {
    const student = await prisma.studentKkn.findFirst({
      where: { OR: [{ id: studentId }, { userId: studentId }] },
      include: { kelompok: { select: { mplId: true } } },
    });

    if (!student) throw new Error("STUDENT_NOT_FOUND_OR_FORBIDDEN");

    // Scope check: mahasiswa harus di kelompok yang mplId-nya cocok (kecuali admin)
    if (!isDplSuperUser(undefined) && student.kelompok?.mplId !== mplUserId) {
      // Masih izinkan jika student punya mplId langsung
      if (student.mplId !== mplUserId) {
        throw new Error("STUDENT_NOT_FOUND_OR_FORBIDDEN");
      }
    }

    return prisma.studentKkn.update({
      where: { id: student.id },
      data: {
        assessmentScore: score,
        assessmentNote: note,
        isAssessed: true,
      },
    });
  },

  /**
   * 9. Keputusan pengajuan izin
   */
  decideLeaveRequest: async (
    mplUserId: string,
    requestId: string,
    status: "APPROVED" | "REJECTED" | "ESCALATED",
    note?: string
  ) => {
    const leaveRequest = await prisma.studentLeaveRequest.findUnique({
      where: { id: requestId },
      include: { student: { select: { studentProfile: { select: { kelompok: { select: { mplId: true } } } } } } },
    });

    if (!leaveRequest) throw new Error("LEAVE_REQUEST_NOT_FOUND");

    return prisma.studentLeaveRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedById: mplUserId,
        reviewedAt: new Date(),
        rejectionReason: note || null,
      },
    });
  },

  /**
   * 10. Keputusan pembatalan izin
   */
  decideCancelLeaveRequest: async (
    mplUserId: string,
    requestId: string,
    action: "APPROVE_HADIR" | "REJECT_CANCEL",
    note?: string
  ) => {
    const leaveRequest = await prisma.studentLeaveRequest.findUnique({
      where: { id: requestId },
    });
    if (!leaveRequest) throw new Error("LEAVE_REQUEST_NOT_FOUND");

    if (action === "APPROVE_HADIR") {
      return prisma.studentLeaveRequest.update({
        where: { id: requestId },
        data: {
          status: "CANCELLED",
          reviewedById: mplUserId,
          reviewedAt: new Date(),
          rejectionReason: note || "Pembatalan disetujui oleh MPL",
        },
      });
    } else {
      return prisma.studentLeaveRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedById: mplUserId,
          reviewedAt: new Date(),
          rejectionReason: note || null,
        },
      });
    }
  },

  /**
   * 11. Program kerja kelompok MPL — delegate ke dplService dengan scope mpl
   */
  getProgramKerja: async (
    mplUserId: string,
    groupId?: string,
    role?: string,
    filters?: {
      kategori?: string;
      statusUsulan?: string;
      statusPelaksanaan?: string;
      statusPenilaian?: string;
      search?: string;
    }
  ) => {
    // Gunakan dplService.getProgramKerja dengan userId MPL; scope where sudah include mplId
    // Namun kita override where agar scope by mplId bukan dplId
    const whereGroup: any = await getMplKelompokWhere(mplUserId, role);
    if (groupId) whereGroup.id = groupId;

    const myGroups = await prisma.kelompokKkn.findMany({ where: whereGroup, select: { id: true } });
    if (myGroups.length === 0) return [];
    const myGroupIds = myGroups.map((g) => g.id);

    const prokerWhere: any = { kelompokId: { in: myGroupIds } };
    if (filters?.kategori) prokerWhere.kategori = { contains: filters.kategori, mode: "insensitive" };
    if (filters?.statusUsulan) prokerWhere.statusUsulan = filters.statusUsulan;
    if (filters?.statusPelaksanaan) prokerWhere.statusPelaksanaan = filters.statusPelaksanaan;
    if (filters?.statusPenilaian) prokerWhere.statusPenilaian = filters.statusPenilaian;
    if (filters?.search) {
      prokerWhere.OR = [
        { deskripsi: { contains: filters.search, mode: "insensitive" } },
        { kategori: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const prokerList = await prisma.programKerjaKkn.findMany({
      where: prokerWhere,
      include: {
        kelompok: { select: { id: true, name: true, kelurahan: true } },
        student: { include: { user: { select: { id: true, name: true } } } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ nomor: "asc" }, { createdAt: "desc" }],
    });

    return prokerList.map((p, pIdx) => {
      const parsed = parseProkerDeskripsi(p.deskripsi);
      const legacySt = String(p.status || "").toUpperCase();
      let u = (p as any).statusUsulan;
      if (!u) {
        if (["DITERIMA", "DISETUJUI", "SEDANG_BERJALAN", "SELESAI"].includes(legacySt)) u = "DISETUJUI";
        else if (["DITOLAK", "TIDAK_DISETUJUI"].includes(legacySt)) u = "DITOLAK";
        else u = "BELUM_DISETUJUI";
      }
      let pl = (p as any).statusPelaksanaan || "BELUM_MULAI";

      return {
        id: p.id,
        nomor: p.nomor || pIdx + 1,
        judul: parsed.judul,
        deskripsi: parsed.deskripsi,
        kategori: p.kategori,
        sumber: p.sumber,
        waktuPelaksanaan: p.waktuPelaksanaan || null,
        linkGoogleDrive: p.linkGoogleDrive || null,
        attachmentUrls: p.attachmentUrls || [],
        kebutuhanBiaya: Number(p.kebutuhanBiaya || 0),
        status: p.status,
        statusUsulan: u,
        statusPelaksanaan: pl,
        statusPenilaian: (p as any).statusPenilaian || "BELUM_DINILAI",
        skorPenilaian: p.skorPenilaian !== null ? Number(p.skorPenilaian) : null,
        evaluasiDpl: p.evaluasiDpl || null,
        catatanDpl: p.catatanDpl || null,
        predikat: p.predikat || null,
        kelompok: p.kelompok || null,
        mahasiswa: p.student?.user
          ? { id: p.student.user.id, name: p.student.user.name }
          : null,
        reviewedBy: p.reviewedBy || null,
        reviewedAt: p.reviewedAt || null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });
  },

  createProgramKerja: async (
    mplUserId: string,
    role: string,
    data: {
      kelompokId: string;
      nomor?: number;
      deskripsi: string;
      kategori?: string;
      sumber?: string;
      waktuPelaksanaan?: string;
      linkGoogleDrive?: string;
      kebutuhanBiaya?: number;
      status?: string;
      statusUsulan?: string;
      statusPelaksanaan?: string;
    }
  ) => {
    // Scope check: kelompok harus milik MPL ini
    if (!isDplSuperUser(role)) {
      const grp = await prisma.kelompokKkn.findUnique({
        where: { id: data.kelompokId },
        select: { mplId: true },
      });
      if (!grp || grp.mplId !== mplUserId) throw new Error("FORBIDDEN_SCOPE");
    }

    const lastProker = await prisma.programKerjaKkn.findFirst({
      where: { kelompokId: data.kelompokId },
      orderBy: { nomor: "desc" },
      select: { nomor: true },
    });
    const nextNomor = data.nomor || (lastProker?.nomor ? lastProker.nomor + 1 : 1);

    return prisma.programKerjaKkn.create({
      data: {
        kelompokId: data.kelompokId,
        nomor: nextNomor,
        deskripsi: data.deskripsi,
        kategori: data.kategori || "LAINNYA",
        sumber: data.sumber || "MPL",
        waktuPelaksanaan: data.waktuPelaksanaan,
        linkGoogleDrive: data.linkGoogleDrive,
        kebutuhanBiaya: data.kebutuhanBiaya || 0,
        status: (data.status as any) || "BELUM_DISETUJUI",
        statusUsulan: data.statusUsulan || "BELUM_DISETUJUI",
        statusPelaksanaan: data.statusPelaksanaan || "BELUM_MULAI",
      },
    });
  },

  updateProgramKerja: async (
    id: string,
    mplUserId: string,
    role: string,
    data: Record<string, any>
  ) => {
    const existing = await prisma.programKerjaKkn.findUnique({
      where: { id },
      include: { kelompok: { select: { mplId: true } } },
    });
    if (!existing) throw new Error("PROKER_NOT_FOUND");
    if (!isDplSuperUser(role) && existing.kelompok?.mplId !== mplUserId) throw new Error("FORBIDDEN_SCOPE");

    const updateData: any = {};
    if (data.nomor !== undefined) updateData.nomor = Number(data.nomor);
    if (data.deskripsi !== undefined) updateData.deskripsi = data.deskripsi;
    if (data.kategori !== undefined) updateData.kategori = data.kategori;
    if (data.sumber !== undefined) updateData.sumber = data.sumber;
    if (data.waktuPelaksanaan !== undefined) updateData.waktuPelaksanaan = data.waktuPelaksanaan;
    if (data.linkGoogleDrive !== undefined) updateData.linkGoogleDrive = data.linkGoogleDrive;
    if (data.kebutuhanBiaya !== undefined) updateData.kebutuhanBiaya = Number(data.kebutuhanBiaya);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.statusUsulan !== undefined) updateData.statusUsulan = data.statusUsulan;
    if (data.statusPelaksanaan !== undefined) updateData.statusPelaksanaan = data.statusPelaksanaan;
    if (data.catatanDpl !== undefined) updateData.catatanDpl = data.catatanDpl;

    return prisma.programKerjaKkn.update({ where: { id }, data: updateData });
  },

  deleteProgramKerja: async (id: string, mplUserId: string, role: string) => {
    const existing = await prisma.programKerjaKkn.findUnique({
      where: { id },
      include: { kelompok: { select: { mplId: true } } },
    });
    if (!existing) throw new Error("PROKER_NOT_FOUND");
    if (!isDplSuperUser(role) && existing.kelompok?.mplId !== mplUserId) throw new Error("FORBIDDEN_SCOPE");
    return prisma.programKerjaKkn.delete({ where: { id } });
  },

  decideProgramKerja: async (
    mplUserId: string,
    id: string,
    status: "DITERIMA" | "DITOLAK" | "SEDANG_BERJALAN" | "SELESAI" | "BELUM_DISETUJUI",
    catatanDpl?: string,
    role?: string,
    statusPelaksanaan?: string
  ) => {
    const existing = await prisma.programKerjaKkn.findUnique({
      where: { id },
      include: { kelompok: { select: { mplId: true } } },
    });
    if (!existing) throw new Error("PROKER_NOT_FOUND");
    if (!isDplSuperUser(role) && existing.kelompok?.mplId !== mplUserId) throw new Error("FORBIDDEN_SCOPE");

    const updateData: any = {
      status: status as any,
      statusUsulan: status,
      reviewedById: mplUserId,
      reviewedAt: new Date(),
    };
    if (catatanDpl !== undefined) updateData.catatanDpl = catatanDpl;
    if (statusPelaksanaan) updateData.statusPelaksanaan = statusPelaksanaan;

    return prisma.programKerjaKkn.update({ where: { id }, data: updateData });
  },

  assessProgramKerja: async (
    mplUserId: string,
    id: string,
    skorPenilaian: number,
    evaluasiDpl?: string,
    role?: string,
    aspekPenilaian?: any[],
    predikat?: string,
    statusPenilaian?: string,
    statusPelaksanaan?: string
  ) => {
    const existing = await prisma.programKerjaKkn.findUnique({
      where: { id },
      include: { kelompok: { select: { mplId: true } } },
    });
    if (!existing) throw new Error("PROKER_NOT_FOUND");
    if (!isDplSuperUser(role) && existing.kelompok?.mplId !== mplUserId) throw new Error("FORBIDDEN_SCOPE");

    const legacySt = String(existing.status || "").toUpperCase();
    const statusU = String((existing as any).statusUsulan || "").toUpperCase();
    if (legacySt === "DITOLAK" || statusU === "DITOLAK") throw new Error("PROKER_REJECTED");
    if (!["DITERIMA", "DISETUJUI", "SEDANG_BERJALAN", "SELESAI"].includes(legacySt) &&
      !["DITERIMA", "DISETUJUI"].includes(statusU)) {
      throw new Error("PROKER_NOT_APPROVED");
    }

    const updateData: any = {
      skorPenilaian,
      evaluasiDpl: evaluasiDpl || null,
      aspekPenilaian: aspekPenilaian || null,
      predikat: predikat || null,
      statusPenilaian: statusPenilaian || "SUDAH_DINILAI",
      reviewedById: mplUserId,
      reviewedAt: new Date(),
    };
    if (statusPelaksanaan) updateData.statusPelaksanaan = statusPelaksanaan;

    return prisma.programKerjaKkn.update({ where: { id }, data: updateData });
  },

  getProgramKerjaBukti: async (mplUserId: string, id: string, role?: string) => {
    const existing = await prisma.programKerjaKkn.findUnique({
      where: { id },
      include: { kelompok: { select: { mplId: true } } },
    });
    if (!existing) throw new Error("PROKER_NOT_FOUND");
    if (!isDplSuperUser(role) && existing.kelompok?.mplId !== mplUserId) throw new Error("FORBIDDEN_SCOPE");

    return {
      id: existing.id,
      linkGoogleDrive: existing.linkGoogleDrive || null,
      attachmentFile: existing.attachmentFile || null,
      attachmentUrls: existing.attachmentUrls || [],
      hasAttachment: existing.hasAttachment,
    };
  },

  /**
   * 12. Rekap nilai akhir — scope by kelurahan MPL
   */
  getRekapNilaiAkhir: async (mplUserId: string, groupId?: string, role?: string) => {
    const whereGroup: any = await getMplKelompokWhere(mplUserId, role);
    if (groupId) whereGroup.id = groupId;

    const myGroups = await prisma.kelompokKkn.findMany({
      where: whereGroup,
      include: {
        students: {
          include: {
            user: { select: { id: true, name: true } },
            penilaianKkn: true,
          },
        },
        dpl: { select: { id: true, name: true } },
        mpl: { select: { id: true, name: true } },
      },
    });

    if (myGroups.length === 0) {
      return { groups: [], students: [], stats: { totalStudents: 0, rerataNilai: 0, rerataKehadiran: 0 } };
    }

    const allStudents = myGroups.flatMap((g) =>
      g.students.map((st) => {
        const p = st.penilaianKkn;
        const nilaiAkhir = p ? Number(p.nilaiAkhir || 0) : 0;

        let statusPenilaian = "Menunggu DPL & MPL";
        if (p) {
          const hasDplScore = p.subtotalDpl > 0;
          const hasMitraScore = p.subtotalMitra > 0;
          if (p.isFinalized) statusPenilaian = "Selesai";
          else if (hasDplScore && hasMitraScore) statusPenilaian = "Menunggu Finalisasi";
          else if (hasDplScore && !hasMitraScore) statusPenilaian = "Menunggu MPL";
          else if (!hasDplScore && hasMitraScore) statusPenilaian = "Menunggu DPL";
          else statusPenilaian = "Menunggu DPL & MPL";
        }

        return {
          studentId: st.userId,
          name: st.user?.name || "Mahasiswa",
          nim: st.nim || "-",
          kelompokId: g.id,
          kelompokName: g.name,
          kelurahan: g.kelurahan || "-",
          nilaiAkhir,
          kategoriNilai: p?.kategoriNilai || "Belum Dinilai",
          subtotalMitra: p ? Number(p.subtotalMitra || 0) : 0,
          subtotalDpl: p ? Number(p.subtotalDpl || 0) : 0,
          statusPenilaian,
          isFinalized: p?.isFinalized || false,
        };
      })
    );

    const totalStudents = allStudents.length;
    const rerataNilai = totalStudents > 0
      ? Math.round(allStudents.reduce((sum, s) => sum + s.nilaiAkhir, 0) / totalStudents)
      : 0;

    return {
      groups: myGroups.map((g) => ({
        id: g.id,
        name: g.name,
        kelurahan: g.kelurahan || "-",
        dpl: g.dpl ? { id: g.dpl.id, name: g.dpl.name } : null,
        mpl: g.mpl ? { id: g.mpl.id, name: g.mpl.name } : null,
        studentCount: g.students.length,
      })),
      students: allStudents,
      stats: { totalStudents, rerataNilai, rerataKehadiran: 0 },
    };
  },

  /**
   * 13. Konfigurasi target KKN (shared dengan DPL)
   */
  getConfigTargets: async () => {
    return dplService.getConfigTargets();
  },

  updateConfigTargets: async (data: any) => {
    return dplService.updateConfigTargets(data);
  },

  /**
   * 14. Log aktivitas MPL (delegate ke dplService — pakai tabel logbook_dpl)
   */
  getDplActivityLogs: async (mplUserId: string, role?: string, filters?: any) => {
    return dplService.getDplActivityLogs(mplUserId, role, filters);
  },

  createDplActivityLog: async (mplUserId: string, role?: string, data?: any) => {
    return dplService.createDplActivityLog(mplUserId, role, data);
  },

  updateDplActivityLog: async (id: string, mplUserId: string, role?: string, data?: any) => {
    return dplService.updateDplActivityLog(id, mplUserId, role, data);
  },

  deleteDplActivityLog: async (id: string, mplUserId: string, role?: string) => {
    return dplService.deleteDplActivityLog(id, mplUserId, role);
  },
};

// ─────────────────────────────────────────────
// Helper internal
// ─────────────────────────────────────────────
async function getEligibleMplSchedulesCount(groupId?: string): Promise<number> {
  try {
    const configs = await configService.getRuleEngineConfigs();
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (configs.kknStartDate) {
      const kknStart = new Date(configs.kknStartDate);
      if (now < kknStart) return 0;
    }

    const whereSchedule: any = { date: { lte: todayEnd } };
    if (configs.kknStartDate) whereSchedule.date.gte = new Date(configs.kknStartDate);
    if (groupId) whereSchedule.OR = [{ kelompokId: groupId }, { kelompokId: null }];

    const pastSchedules = await prisma.schedule.findMany({
      where: whereSchedule,
      select: { date: true },
    });

    let eligibleCount = 0;
    for (const s of pastSchedules) {
      const check = await configService.isDateKknHoliday(s.date);
      if (!check.isHoliday) eligibleCount++;
    }
    return eligibleCount;
  } catch {
    return 0;
  }
}
