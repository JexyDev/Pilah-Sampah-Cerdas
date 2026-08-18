import { prisma } from "../lib/prisma.js";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { configService } from "./configService.js";
import { isPointInPolygonWithBuffer } from "../utils/geoUtils.js";
import { websocketService } from "./websocketService.js";


// Helper: Haversine Formula (meters)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export class KknAttendanceService {
  async pingLocation(userId: string, latitude: number, longitude: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new Error("USER_NOT_FOUND");

    let student = await prisma.studentKkn.findUnique({
      where: { userId },
    });

    if (!student && user.role?.name === "MAHASISWA_KKN") {
      student = await prisma.studentKkn.create({
        data: {
          userId,
          nim: `3273${Date.now().toString().slice(-6)}`,
          jurusan: "Teknik Lingkungan",
          fakultas: "Fakultas Teknik",
          noWa: user.phone || "08123456789",
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // 1. Simpan lokasi
    const newLocation = await prisma.studentLocation.create({
      data: {
        studentId: userId,
        latitude,
        longitude,
      },
    });

    // Broadcast realtime GPS via WebSocket
    websocketService.broadcastStudentLocation({
      id: newLocation.id,
      studentId: userId,
      latitude,
      longitude,
      recordedAt: newLocation.recordedAt,
    });

    // Cleanup student locations older than 24 hours
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.studentLocation.deleteMany({
      where: {
        studentId: userId,
        recordedAt: { lt: cutoff24h },
      },
    }).catch(() => {});

    // 2. Trigger auto check-in check removed: check-in is dynamic and recorded via client or scheduler
    let autoAttendanceTriggered = false;

    return { success: true, message: "Lokasi berhasil dilacak", autoAttendanceTriggered };
  }

  async getWargaDampingan(userId: string, role?: string) {
    let whereCondition: any = { registeredByStudentId: userId };

    if (role === "DPL" || role === "DOSEN_PEMBIMBING") {
      const groups = await prisma.kelompokKkn.findMany({
        where: { dplId: userId },
        include: {
          students: {
            select: { userId: true },
          },
        },
      });
      const studentIds = groups.flatMap((g) => g.students.map((s) => s.userId));
      whereCondition = { registeredByStudentId: { in: studentIds } };
    }

    // Ambil warga yang di-register oleh mahasiswa kelompok binaan DPL / mahasiswa ybs
    const bins = await prisma.bin.findMany({
      where: whereCondition,
      include: {
        user: {
          include: { households: true },
        },
        setoranOtomatis: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    return bins.map((b: any) => ({
      binId: b.id,
      wargaName: b.user?.name || "Unknown",
      address: b.user?.households?.[0]?.address || "-",
      recentLogs: b.setoranOtomatis,
    }));
  }

  /**
   * Save student's current locations in batch and perform auto-cleanup of logs older than 24h.
   * If student is inside active activity radius, trigger auto-attendance.
   */
  async updateStudentLocationsBatch(
    studentId: string,
    locations: { latitude: number; longitude: number; timestamp?: string }[]
  ) {
    const savedLocations = [];
    for (const loc of locations) {
      // 1. Save new location
      const location = await prisma.studentLocation.create({
        data: {
          studentId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          recordedAt: loc.timestamp ? new Date(loc.timestamp) : new Date(),
        },
      });
      savedLocations.push(location);
    }

    // 2. Cleanup older than 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.studentLocation.deleteMany({
      where: {
        studentId,
        recordedAt: {
          lt: cutoff,
        },
      },
    });

    // 3. Auto-attendance check removed: check-in is dynamic and recorded via client or scheduler
    return {
      locations: savedLocations,
      autoAttendanceTriggered: [],
    };
  }

  /**
   * Get location details for an activity, with default fallback if not configured.
   */
  async getActivityLocation(scheduleId: string, studentId?: string) {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new Error("SCHEDULE_NOT_FOUND");
    }

    // Default configuration from system configs or fallback
    const configLatStr = await configService.getConfig("default_activity_latitude");
    const configLngStr = await configService.getConfig("default_activity_longitude");
    const configRadiusStr = await configService.getConfig("default_activity_radius");

    const defaultLat = configLatStr ? parseFloat(configLatStr) : -6.8915; // Bandung / Coblong
    const defaultLng = configLngStr ? parseFloat(configLngStr) : 107.6107;
    const defaultRadius = configRadiusStr ? parseInt(configRadiusStr, 10) : 100;
    
    // Always fetch target duration from Rule Engine or schedule duration as the single source of truth!
    let scheduleDurationMinutes = 0;
    if (schedule?.time && schedule.time.includes("-")) {
      const parts = schedule.time.split("-");
      const startParts = parts[0].trim().replace(".", ":").split(":");
      const endParts = parts[1].trim().replace(".", ":").split(":");
      if (startParts.length >= 2 && endParts.length >= 2) {
        const startMins = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
        const endMins = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);
        if (endMins > startMins) {
          scheduleDurationMinutes = endMins - startMins;
        }
      }
    }

    const ruleConfigs = await configService.getRuleEngineConfigs();
    const ruleTargetMinutes = (ruleConfigs.attendanceMinDurationHours * 60) + ruleConfigs.attendanceMinDurationMinutes + (ruleConfigs.attendanceMinDurationSeconds / 60);
    const targetDurationMinutes = ruleTargetMinutes > 0 ? ruleTargetMinutes : 2;

    let isAttended = false;
    let attendanceStatus: string | null = null;
    let checkInTime: Date | null = null;
    let checkOutTime: Date | null = null;
    let method: string | null = null;

    if (studentId) {
      const attendance = await prisma.activityAttendance.findUnique({
        where: {
          studentId_scheduleId: {
            studentId,
            scheduleId,
          },
        },
      });

      if (attendance) {
        isAttended = true;
        attendanceStatus = (attendance.status === "DALAM_RADIUS" || attendance.status === "LEPAS_RADIUS") ? "HADIR" : attendance.status;
        checkInTime = attendance.attendedAt;
        checkOutTime = attendance.checkOutAt;
        method = attendance.method;
      }
    }

    return {
      scheduleId: schedule.id,
      title: schedule.title,
      latitude: schedule.latitude ? Number(schedule.latitude) : defaultLat,
      longitude: schedule.longitude ? Number(schedule.longitude) : defaultLng,
      radius: schedule.radius ? Number(schedule.radius) : defaultRadius,
      targetDurationMinutes,
      durationMinutes: targetDurationMinutes,
      polygon: schedule.polygon,
      isConfigured: schedule.latitude !== null && schedule.longitude !== null,
      isAttended,
      attendanceStatus: attendanceStatus || "BELUM_ABSEN",
      status: attendanceStatus || "BELUM_ABSEN",
      checkInTime,
      checkOutTime,
      method,
    };
  }

  /**
   * Record attendance (either manual, automatic trigger, or ALPA_AUTO).
   * Verifies coordinates and radius on backend.
   * Forwards notification to DPL dashboard with nim, namaMahasiswa, and kodeZona.
   */
  async recordAttendance(params: {
    studentId: string;
    scheduleId: string;
    latitude: number;
    longitude: number;
    method: string;
    nim?: string;
    namaMahasiswa?: string;
    kodeZona?: string;
  }) {
    const { studentId, scheduleId, latitude, longitude, method, nim: inputNim, namaMahasiswa: inputNama, kodeZona: inputKodeZona } = params;
    const isAutoAlpa = method?.toUpperCase() === "ALPA_AUTO" || method?.toUpperCase() === "ALPA";

    // 0. Validate operational hours (05:00 - 23:59 WIB)
    if (!isAutoAlpa) {
      const now = new Date();
      // WIB is UTC + 7
      const utcHours = now.getUTCHours();
      const wibHours = (utcHours + 7) % 24;
      if (wibHours < 5 || wibHours >= 24) {
        throw new Error(
          "OUT_OF_OPERATIONAL_HOURS: Presensi kegiatan KKN hanya dapat dilakukan pada jam operasional 05:00 - 23:59 WIB."
        );
      }
    }

    // 1. Get activity location configuration if exists
    let actLoc: any = null;
    try {
      actLoc = await this.getActivityLocation(scheduleId);
    } catch (e) {
      actLoc = null;
    }

    // 2. Validate radius on backend if configured (skip for ALPA_AUTO)
    let isInside = true;
    if (!isAutoAlpa && actLoc && actLoc.isConfigured) {
      if (actLoc.polygon && Array.isArray(actLoc.polygon) && actLoc.polygon.length >= 3) {
        const polyPoints = (actLoc.polygon as any[]).map((p) => ({
          lat: Number(p[0]),
          lng: Number(p[1]),
        }));
        isInside = isPointInPolygonWithBuffer({ lat: latitude, lng: longitude }, polyPoints, 15);
      } else {
        const distance = calculateDistance(latitude, longitude, actLoc.latitude, actLoc.longitude);
        isInside = distance <= (actLoc.radius + 15);
      }
    }

    if (!isAutoAlpa && !isInside) {
      throw new Error(`OUT_OF_RADIUS: Mahasiswa tidak berada di dalam area kegiatan.`);
    }

    // Resolve student info for DPL notification
    const studentUser = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: {
          include: {
            kelompok: {
              include: { dpl: true },
            },
          },
        },
      },
    });

    const finalNama = inputNama || studentUser?.name || "Mahasiswa KKN";
    const finalNim = inputNim || studentUser?.studentProfile?.nim || "1301210000";
    const finalKodeZona = inputKodeZona || actLoc?.title || scheduleId;
    const statusText = isAutoAlpa ? "Alpa (Tanpa Keterangan)" : "Hadir (Dalam Radius)";

    // 3. Create or update attendance record
    const attendance = await prisma.$transaction(async (tx) => {
      // Check if already attended
      const existing = await tx.activityAttendance.findUnique({
        where: {
          studentId_scheduleId: {
            studentId,
            scheduleId,
          },
        },
      });

      if (existing) {
        if (existing.checkOutAt) {
          throw new Error("ALREADY_ATTENDED_AND_CHECKED_OUT");
        }

        // This is a checkout
        const record = await tx.activityAttendance.update({
          where: { id: existing.id },
          data: {
            checkOutAt: new Date(),
            status: isAutoAlpa ? "ALPA" : "LEPAS_RADIUS",
          },
        });

        return record;
      }

      const record = await tx.activityAttendance.create({
        data: {
          studentId,
          scheduleId,
          method: isAutoAlpa ? "ALPA_AUTO" : method,
          latitude,
          longitude,
          status: isAutoAlpa ? "ALPA" : "DALAM_RADIUS",
        },
      });

      // Award +10 points to student on Check-In if NOT ALPA
      if (!isAutoAlpa) {
        await tx.pointHistory.create({
          data: {
            userId: studentId,
            points: 10,
            description: `Bonus kehadiran (Check-In) KKN: ${actLoc?.title || scheduleId} (${method})`,
            kategori: "PARTISIPASI_STREAK",
            redeemable: false,
          },
        });
      }

      // Forward notification to DPL dashboard
      const dplUser = studentUser?.studentProfile?.kelompok?.dpl;
      if (dplUser) {
        await tx.notification.create({
          data: {
            userId: dplUser.id,
            title: `Laporan Presensi KKN (${finalNama})`,
            message: `Mahasiswa ${finalNama} (${finalNim}) pada zona ${finalKodeZona} berstatus: ${statusText}.`,
            isRead: false,
          },
        });
      }

      return record;
    });

    return {
      ...attendance,
      namaMahasiswa: finalNama,
      nim: finalNim,
      kodeZona: finalKodeZona,
      statusDisplay: statusText,
    };
  }

  /**
   * Get all student locations recorded in the last 24 hours.
   * If dplUserId is provided, filters to students in DPL's assigned kelompok.
   */
  async getActiveStudentsLocations(dplUserId?: string, kelompokId?: string) {
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);

    // If DPL or specific kelompokId provided, find student user IDs
    let targetStudentIds: string[] | null = null;
    if (kelompokId && kelompokId !== "ALL") {
      const students = await prisma.studentKkn.findMany({
        where: { kelompokId },
        select: { userId: true },
      });
      targetStudentIds = students.map((s) => s.userId);
    } else if (dplUserId) {
      const kelompokBinaan = await prisma.kelompokKkn.findMany({
        where: { OR: [{ dplId: dplUserId }, { dpl: { id: dplUserId } }] },
        select: { id: true },
      });
      const kelompokIds = kelompokBinaan.map((k) => k.id);
      const students = await prisma.studentKkn.findMany({
        where: { kelompokId: { in: kelompokIds } },
        select: { userId: true },
      });
      targetStudentIds = students.map((s) => s.userId);
    }

    // Group by student to get the latest position of each active student
    const locations = await prisma.studentLocation.findMany({
      where: {
        recordedAt: {
          gte: cutoff,
        },
        ...(targetStudentIds ? { studentId: { in: targetStudentIds } } : {}),
      },
      orderBy: {
        recordedAt: "desc",
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            phone: true,
            studentProfile: {
              select: {
                nim: true,
                jurusan: true,
              },
            },
          },
        },
      },
    });

    // Deduplicate to only keep the latest location per student
    const uniqueStudents = new Map<string, (typeof locations)[0]>();
    for (const loc of locations) {
      if (!uniqueStudents.has(loc.studentId)) {
        uniqueStudents.set(loc.studentId, loc);
      }
    }

    // Include registered Mahasiswa KKN who have active attendance coordinates today if no direct location ping exists
    const activeMahasiswaWithAbsen = await prisma.user.findMany({
      where: {
        role: { name: "MAHASISWA_KKN" },
        ...(targetStudentIds ? { id: { in: targetStudentIds } } : {}),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        studentProfile: {
          select: {
            nim: true,
            jurusan: true,
          },
        },
        attendances: {
          where: {
            attendedAt: { gte: cutoff },
          },
          orderBy: { attendedAt: "desc" },
          take: 1,
          select: {
            latitude: true,
            longitude: true,
            attendedAt: true,
          },
        },
      },
    });

    for (const mhs of activeMahasiswaWithAbsen) {
      if (!uniqueStudents.has(mhs.id) && mhs.attendances.length > 0) {
        const latestAbsen = mhs.attendances[0];
        if (latestAbsen.latitude && latestAbsen.longitude) {
          uniqueStudents.set(mhs.id, {
            id: `absen-${mhs.id}`,
            studentId: mhs.id,
            latitude: latestAbsen.latitude as any,
            longitude: latestAbsen.longitude as any,
            recordedAt: latestAbsen.attendedAt,
            student: {
              id: mhs.id,
              name: mhs.name,
              email: mhs.phone,
              phone: mhs.phone,
              studentProfile: mhs.studentProfile
                ? {
                    nim: mhs.studentProfile.nim,
                    jurusan: mhs.studentProfile.jurusan,
                  }
                : undefined,
            },
          } as any);
        }
      }
    }

    return Array.from(uniqueStudents.values());
  }

  /**
   * Get list of attendances for a schedule
   * Get list of attendances for a schedule (Scoped to DPL kelompok if dplUserId provided)
   */
  async getAttendanceList(scheduleId: string, dplUserId?: string) {
    // 1. Fetch schedule to filter students strictly by assigned Kelompok KKN and get date range
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        kelompok: {
          include: {
            students: {
              select: { userId: true },
            },
          },
        },
      },
    });

    let dplStudentUserIds: string[] | undefined;
    if (dplUserId) {
      const dplGroups = await prisma.kelompokKkn.findMany({
        where: { OR: [{ dplId: dplUserId }, { dpl: { id: dplUserId } }] },
        include: {
          students: {
            select: { userId: true },
          },
        },
      });
      dplStudentUserIds = dplGroups.flatMap((g) => g.students.map((s) => s.userId));
    }

    let studentWhereCondition: any = { role: { name: "MAHASISWA_KKN" } };

    if (dplStudentUserIds) {
      studentWhereCondition = {
        id: { in: dplStudentUserIds },
        role: { name: "MAHASISWA_KKN" },
      };
    } else if (schedule?.kelompok?.students && schedule.kelompok.students.length > 0) {
      const groupUserIds = schedule.kelompok.students.map((s) => s.userId);
      studentWhereCondition = {
        id: { in: groupUserIds },
        role: { name: "MAHASISWA_KKN" },
      };
    } else if (schedule?.title) {
      const groups = await prisma.kelompokKkn.findMany({
        include: {
          students: {
            select: { userId: true },
          },
        },
      });

      // Sort groups by name length descending so "Kelompok 10" matches before "Kelompok 1"
      const sortedGroups = [...groups].sort((a, b) => b.name.length - a.name.length);
      const matchedGroup = sortedGroups.find((g) =>
        schedule.title.toLowerCase().includes(g.name.toLowerCase())
      );

      if (matchedGroup && matchedGroup.students.length > 0) {
        const groupUserIds = matchedGroup.students.map((s) => s.userId);
        studentWhereCondition = {
          id: { in: groupUserIds },
          role: { name: "MAHASISWA_KKN" },
        };
      }
    }

    const allStudents = await prisma.user.findMany({
      where: studentWhereCondition,
      select: {
        id: true,
        name: true,
        phone: true,
        studentProfile: {
          select: {
            nim: true,
            jurusan: true,
            isKetua: true,
            kelompok: {
              select: {
                id: true,
                name: true,
                kelurahan: true,
              },
            },
          },
        },
      },
    });

    const allStudentUserIds = allStudents.map((s) => s.id);

    const attendanceWhere: any = { scheduleId };
    if (allStudentUserIds.length > 0) {
      attendanceWhere.studentId = { in: allStudentUserIds };
    }

    const list = await prisma.activityAttendance.findMany({
      where: attendanceWhere,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            phone: true,
            studentProfile: {
              select: {
                nim: true,
                jurusan: true,
                isKetua: true,
                kelompok: {
                  select: {
                    id: true,
                    name: true,
                    kelurahan: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        attendedAt: "desc",
      },
    });

    // Determine calendar date boundaries for this schedule
    const schedDate = schedule?.date ? new Date(schedule.date) : new Date();
    const startOfDay = new Date(schedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(schedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Query active & historical leave requests for all relevant students during this schedule's timeframe
    const leaveRequests = allStudentUserIds.length > 0
      ? await prisma.studentLeaveRequest.findMany({
          where: {
            studentId: { in: allStudentUserIds },
            startDate: { lte: endOfDay },
            endDate: { gte: startOfDay },
            status: { in: ["PENDING", "APPROVED", "CANCEL_REQUESTED", "OVERRIDDEN_HADIR"] },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const leaveMap = new Map<string, typeof leaveRequests[0]>();
    for (const lr of leaveRequests) {
      if (!leaveMap.has(lr.studentId)) {
        leaveMap.set(lr.studentId, lr);
      }
    }

    const locations = await this.getActiveStudentsLocations(dplUserId);
    const locMap = new Map(locations.map((l) => [l.studentId, l]));
    const scheduleLoc = await this.getActivityLocation(scheduleId);

    const attendedStudentIds = new Set<string>();

    const attendedList = list.map((att) => {
      attendedStudentIds.add(att.studentId);
      const latestLoc = locMap.get(att.studentId);
      const leave = leaveMap.get(att.studentId);

      let currentStatus = "TERCATAT_ABSEN";
      if (att.method === "IZIN_DPL" || String(att.status).toUpperCase().includes("IZIN") || String(att.status).toUpperCase().includes("SAKIT")) {
        currentStatus = "IZIN_DISETUJUI";
      } else if (att.method === "OVERRIDE_DPL" || String(att.status).toUpperCase().includes("OVERRIDE")) {
        currentStatus = "OVERRIDDEN_HADIR";
      } else if (latestLoc) {
        let isInside = false;
        if (
          scheduleLoc.polygon &&
          Array.isArray(scheduleLoc.polygon) &&
          scheduleLoc.polygon.length >= 3
        ) {
          const polyPoints = (scheduleLoc.polygon as any[]).map((p) => ({
            lat: Number(p[0]),
            lng: Number(p[1]),
          }));
          isInside = isPointInPolygonWithBuffer(
            { lat: Number(latestLoc.latitude), lng: Number(latestLoc.longitude) },
            polyPoints,
            15
          );
        } else {
          const dist = calculateDistance(
            Number(latestLoc.latitude),
            Number(latestLoc.longitude),
            scheduleLoc.latitude,
            scheduleLoc.longitude
          );
          isInside = dist <= scheduleLoc.radius + 15;
        }
        currentStatus = isInside ? "MASIH_DI_LOKASI" : "SUDAH_MENINGGALKAN_RADIUS";
      }

      const isLeave = att.method === "IZIN_DPL" || String(att.status).toUpperCase().includes("IZIN") || String(att.status).toUpperCase().includes("SAKIT");
      return {
        ...att,
        attendedAt: isLeave ? null : att.attendedAt,
        completedAt: att.checkOutAt || (att as any).completedAt || null,
        currentStatus,
        leaveRequest: leave
          ? {
              id: leave.id,
              type: leave.type,
              reason: leave.reason,
              evidenceUrl: leave.evidenceUrl,
              status: leave.status,
            }
          : undefined,
      };
    });

    const unAttendedList: any[] = [];

    for (const s of allStudents) {
      if (attendedStudentIds.has(s.id)) continue;

      const latestLoc = locMap.get(s.id);
      const leave = leaveMap.get(s.id);

      if (leave && leave.status === "APPROVED") {
        const attStatus = String(leave.type || "").toUpperCase().includes("SAKIT") ? "SAKIT" : "IZIN";
        const lat = scheduleLoc.latitude ? Number(scheduleLoc.latitude) : 0;
        const lng = scheduleLoc.longitude ? Number(scheduleLoc.longitude) : 0;

        // Auto-synchronize ActivityAttendance in DB for approved leaves
        try {
          await prisma.activityAttendance.upsert({
            where: {
              studentId_scheduleId: {
                studentId: s.id,
                scheduleId,
              },
            },
            create: {
              studentId: s.id,
              scheduleId,
              status: attStatus,
              method: "IZIN_DPL",
              latitude: lat,
              longitude: lng,
              attendedAt: schedule?.date || new Date(),
            },
            update: {
              status: attStatus,
              method: "IZIN_DPL",
            },
          });
        } catch (_syncErr) {
          // Continue if already exists
        }

        unAttendedList.push({
          id: `leave-approved-${s.id}`,
          studentId: s.id,
          scheduleId,
          attendedAt: null,
          completedAt: null,
          method: "IZIN_DPL",
          latitude: lat,
          longitude: lng,
          status: attStatus,
          currentStatus: "IZIN_DISETUJUI",
          student: s,
          leaveRequest: {
            id: leave.id,
            type: leave.type,
            reason: leave.reason,
            evidenceUrl: leave.evidenceUrl,
            status: leave.status,
          },
        });
      } else if (leave && leave.status === "PENDING") {
        const isSakit = String(leave.type || "").toUpperCase().includes("SAKIT");
        unAttendedList.push({
          id: `leave-pending-${s.id}`,
          studentId: s.id,
          scheduleId,
          attendedAt: null,
          completedAt: null,
          method: "PENGAJUAN_IZIN",
          latitude: latestLoc ? latestLoc.latitude : scheduleLoc.latitude,
          longitude: latestLoc ? latestLoc.longitude : scheduleLoc.longitude,
          status: isSakit ? "SAKIT_PENDING" : "IZIN_PENDING",
          currentStatus: "MENUNGGU_PERSETUJUAN_IZIN",
          student: s,
          leaveRequest: {
            id: leave.id,
            type: leave.type,
            reason: leave.reason,
            evidenceUrl: leave.evidenceUrl,
            status: leave.status,
          },
        });
      } else if (leave && leave.status === "CANCEL_REQUESTED") {
        unAttendedList.push({
          id: `leave-cancel-${s.id}`,
          studentId: s.id,
          scheduleId,
          attendedAt: null,
          completedAt: null,
          method: "PEMBATALAN_IZIN",
          latitude: latestLoc ? latestLoc.latitude : scheduleLoc.latitude,
          longitude: latestLoc ? latestLoc.longitude : scheduleLoc.longitude,
          status: "CANCEL_REQUESTED",
          currentStatus: "PENGAJUAN_BATAL_IZIN",
          student: s,
          leaveRequest: {
            id: leave.id,
            type: leave.type,
            reason: leave.reason,
            evidenceUrl: leave.evidenceUrl,
            status: leave.status,
          },
        });
      } else if (leave && leave.status === "OVERRIDDEN_HADIR") {
        unAttendedList.push({
          id: `leave-override-${s.id}`,
          studentId: s.id,
          scheduleId,
          attendedAt: (schedule?.date || new Date()).toISOString(),
          completedAt: null,
          method: "OVERRIDE_DPL",
          latitude: latestLoc ? latestLoc.latitude : scheduleLoc.latitude,
          longitude: latestLoc ? latestLoc.longitude : scheduleLoc.longitude,
          status: "HADIR",
          currentStatus: "OVERRIDDEN_HADIR",
          student: s,
          leaveRequest: {
            id: leave.id,
            type: leave.type,
            reason: leave.reason,
            evidenceUrl: leave.evidenceUrl,
            status: leave.status,
          },
        });
      } else {
        let currentStatus = "BELUM_ABSEN";
        if (latestLoc) {
          let isInside = false;
          if (
            scheduleLoc.polygon &&
            Array.isArray(scheduleLoc.polygon) &&
            scheduleLoc.polygon.length >= 3
          ) {
            const polyPoints = (scheduleLoc.polygon as any[]).map((p) => ({
              lat: Number(p[0]),
              lng: Number(p[1]),
            }));
            isInside = isPointInPolygonWithBuffer(
              { lat: Number(latestLoc.latitude), lng: Number(latestLoc.longitude) },
              polyPoints,
              15
            );
          } else {
            const dist = calculateDistance(
              Number(latestLoc.latitude),
              Number(latestLoc.longitude),
              scheduleLoc.latitude,
              scheduleLoc.longitude
            );
            isInside = dist <= scheduleLoc.radius + 15;
          }
          currentStatus = isInside ? "DI_LOKASI_BELUM_ABSEN" : "BELUM_ABSEN";
        }

        unAttendedList.push({
          id: `unattended-${s.id}`,
          studentId: s.id,
          scheduleId,
          attendedAt: null,
          completedAt: null,
          method: "-",
          latitude: latestLoc ? latestLoc.latitude : scheduleLoc.latitude,
          longitude: latestLoc ? latestLoc.longitude : scheduleLoc.longitude,
          status: "BELUM_ABSEN",
          currentStatus,
          student: s,
        });
      }
    }

    const combined = [...attendedList, ...unAttendedList];

    // Sort Ketua Kelompok (isKetua === true) to the VERY TOP (1st position)
    combined.sort((a: any, b: any) => {
      const aIsKetua = a.student?.studentProfile?.isKetua ? 1 : 0;
      const bIsKetua = b.student?.studentProfile?.isKetua ? 1 : 0;
      return bIsKetua - aIsKetua;
    });

    return combined;
  }

  /**
   * Get timesheet summary (accumulated work hours vs 100h target) for students.
   */
  async getTimesheetSummary(params: {
    kelompokId?: string;
    dplUserId?: string;
    studentId?: string;
  }) {
    const { kelompokId, dplUserId, studentId } = params;

    let whereStudent: any = {};
    if (studentId) {
      whereStudent.userId = studentId;
    } else if (kelompokId && kelompokId !== "ALL") {
      whereStudent.kelompokId = kelompokId;
    } else if (dplUserId) {
      const kelompokBinaan = await prisma.kelompokKkn.findMany({
        where: { OR: [{ dplId: dplUserId }, { dpl: { id: dplUserId } }] },
        select: { id: true },
      });
      whereStudent.kelompokId = { in: kelompokBinaan.map((k) => k.id) };
    }

    const students = await prisma.studentKkn.findMany({
      where: whereStudent,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            attendances: {
              include: {
                schedule: {
                  select: { id: true, title: true, date: true },
                },
              },
              orderBy: { attendedAt: "desc" },
            },
          },
        },
        kelompok: {
          select: { id: true, name: true, kelurahan: true, cakupanRw: true },
        },
        assignedRw: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ isKetua: "desc" }, { user: { name: "asc" } }],
    });

    const TARGET_TOTAL_HOURS = 100;
    const TARGET_TOTAL_MINUTES = TARGET_TOTAL_HOURS * 60; // 6000 mins

    const summary = students.map((s) => {
      let totalMinutes = 0;
      let validSessionsCount = 0;
      let fulfilledTargetDays = 0;

      const sessionDetails = s.user.attendances.map((att) => {
        let durationMins = 0;
        if (att.checkOutAt) {
          const diffMs = att.checkOutAt.getTime() - att.attendedAt.getTime();
          // Cap max 8 hours (480 mins) per session
          durationMins = Math.min(480, Math.max(0, Math.floor(diffMs / (1000 * 60))));
        }
        totalMinutes += durationMins;
        if (durationMins > 0) validSessionsCount++;
        if (durationMins >= 240) fulfilledTargetDays++; // >= 4 hours

        return {
          id: att.id,
          scheduleId: att.scheduleId,
          scheduleTitle: att.schedule?.title || "Kegiatan KKN",
          attendedAt: att.attendedAt,
          checkOutAt: att.checkOutAt,
          durationMinutes: durationMins,
          durationFormatted: `${Math.floor(durationMins / 60)} Jam ${durationMins % 60} Menit`,
          isMinTargetMet: durationMins >= 240,
          status: att.status,
        };
      });

      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const progressPercentage = Math.min(
        100,
        Math.round((totalMinutes / TARGET_TOTAL_MINUTES) * 1000) / 10
      );

      return {
        studentId: s.userId,
        studentName: s.user.name,
        nim: s.nim || "-",
        phone: s.user.phone,
        jurusan: s.jurusan,
        fakultas: s.fakultas,
        isKetua: s.isKetua,
        kelompokId: s.kelompokId,
        kelompokName: s.kelompok?.name || "Tanpa Kelompok",
        kelurahan: s.kelompok?.kelurahan || "-",
        assignedRwName: s.assignedRw?.name || "-",
        totalMinutes,
        totalHours: hours,
        remainingMinutes: mins,
        totalFormatted: `${hours} Jam ${mins} Menit`,
        targetTotalHours: TARGET_TOTAL_HOURS,
        progressPercentage,
        totalDaysAttended: sessionDetails.length,
        fulfilledTargetDays,
        isTargetFulfilled: totalMinutes >= TARGET_TOTAL_MINUTES,
        sessions: sessionDetails,
      };
    });

    return {
      targetRules: {
        hariKerja: "Senin – Jumat",
        jamOperasional: "08:00 – 16:00 WIB (Toleransi 06:00 – 18:00 WIB)",
        targetHarianMinJam: 4,
        targetTotalJam: TARGET_TOTAL_HOURS,
        durasiBulan: 2.5,
      },
      totalMahasiswa: summary.length,
      students: summary,
    };
  }
}

export const kknAttendanceService = new KknAttendanceService();

