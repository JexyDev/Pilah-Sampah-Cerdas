/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";
import { configService } from "./configService.js";
import { isPointInPolygonWithBuffer } from "../utils/geoUtils.js";

const prisma = new PrismaClient();

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

    // Simpan lokasi
    await prisma.studentLocation.create({
      data: {
        studentId: userId,
        latitude,
        longitude,
      },
    });

    return { success: true, message: "Lokasi berhasil dilacak" };
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

    // 3. Auto-attendance check using the latest location from batch
    const latestLoc = savedLocations[savedLocations.length - 1];
    if (!latestLoc) return { locations: [], autoAttendanceTriggered: [] };

    const latitude = Number(latestLoc.latitude);
    const longitude = Number(latestLoc.longitude);

    // Find active schedule for today (overlapping with date)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const activeSchedules = await prisma.schedule.findMany({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    const triggerResults = [];
    for (const schedule of activeSchedules) {
      let isInside = false;
      if (schedule.polygon && Array.isArray(schedule.polygon) && schedule.polygon.length >= 3) {
        const polyPoints = (schedule.polygon as any[]).map((p) => ({
          lat: Number(p[0]),
          lng: Number(p[1]),
        }));
        isInside = isPointInPolygonWithBuffer({ lat: latitude, lng: longitude }, polyPoints, 15);
      } else if (schedule.latitude && schedule.longitude) {
        const dist = calculateDistance(
          latitude,
          longitude,
          Number(schedule.latitude),
          Number(schedule.longitude)
        );
        isInside = dist <= ((schedule.radius || 100) + 15);
      }

      if (isInside) {
        // Check if already attended
        const existingAttendance = await prisma.activityAttendance.findUnique({
          where: {
            studentId_scheduleId: {
              studentId,
              scheduleId: schedule.id,
            },
          },
        });

        if (!existingAttendance) {
          // Trigger Auto Attendance!
          try {
            const att = await this.recordAttendance({
              studentId,
              scheduleId: schedule.id,
              latitude,
              longitude,
              method: "OTOMATIS",
            });
            triggerResults.push({
              scheduleId: schedule.id,
              status: "AUTO_ATTEND_SUCCESS",
              data: att,
            });
          } catch (err: any) {
            triggerResults.push({
              scheduleId: schedule.id,
              status: "AUTO_ATTEND_FAILED",
              error: err.message,
            });
          }
        }
      }
    }

    return {
      locations: savedLocations,
      autoAttendanceTriggered: triggerResults,
    };
  }

  /**
   * Get location details for an activity, with default fallback if not configured.
   */
  async getActivityLocation(scheduleId: string) {
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

    return {
      scheduleId: schedule.id,
      title: schedule.title,
      latitude: schedule.latitude ? Number(schedule.latitude) : defaultLat,
      longitude: schedule.longitude ? Number(schedule.longitude) : defaultLng,
      radius: schedule.radius ? Number(schedule.radius) : defaultRadius,
      polygon: schedule.polygon,
      isConfigured: schedule.latitude !== null && schedule.longitude !== null,
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
  async getActiveStudentsLocations(dplUserId?: string) {
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);

    // If DPL, find student user IDs belonging to DPL's kelompok
    let targetStudentIds: string[] | null = null;
    if (dplUserId) {
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

    // Get active logged-in user IDs from RefreshToken
    const activeSessions = await prisma.refreshToken.findMany({
      where: {
        expiresAt: { gte: new Date() },
        ...(targetStudentIds ? { userId: { in: targetStudentIds } } : {}),
      },
      select: { userId: true },
    });
    const loggedInUserIds = new Set(activeSessions.map((s) => s.userId));

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
      if (
        !uniqueStudents.has(loc.studentId) &&
        (loggedInUserIds.size === 0 || loggedInUserIds.has(loc.studentId))
      ) {
        uniqueStudents.set(loc.studentId, loc);
      }
    }

    // Include registered Mahasiswa KKN who have real active attendance records today
    if (loggedInUserIds.size > 0) {
      const activeMahasiswaWithAbsen = await prisma.user.findMany({
        where: {
          role: { name: "MAHASISWA_KKN" },
          id: { in: Array.from(loggedInUserIds) },
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
    }

    return Array.from(uniqueStudents.values());
  }

  /**
   * Get list of attendances for a schedule
   * Get list of attendances for a schedule (Scoped to DPL kelompok if dplUserId provided)
   */
  async getAttendanceList(scheduleId: string, dplUserId?: string) {
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

    const attendanceWhere: any = { scheduleId };
    if (dplStudentUserIds) {
      attendanceWhere.studentId = { in: dplStudentUserIds };
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
              },
            },
          },
        },
      },
      orderBy: {
        attendedAt: "desc",
      },
    });

    const attendedStudentIds = new Set(list.map((a) => a.studentId));
    const locations = await this.getActiveStudentsLocations(dplUserId);
    const locMap = new Map(locations.map((l) => [l.studentId, l]));
    const scheduleLoc = await this.getActivityLocation(scheduleId);

    const attendedList = list.map((att) => {
      const latestLoc = locMap.get(att.studentId);
      let currentStatus = "TERCATAT_ABSEN";
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
        currentStatus = isInside ? "MASIH_DI_LOKASI" : "SUDAH_MENINGGALKAN_RADIUS";
      }

      return {
        ...att,
        currentStatus,
      };
    });

    // Fetch schedule to filter students strictly by assigned Kelompok KKN
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
          },
        },
      },
    });

    const unAttendedList = allStudents
      .filter((s) => !attendedStudentIds.has(s.id))
      .map((s) => {
        const latestLoc = locMap.get(s.id);
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

        return {
          id: `unattended-${s.id}`,
          studentId: s.id,
          scheduleId,
          attendedAt: null,
          method: "-",
          latitude: latestLoc ? latestLoc.latitude : scheduleLoc.latitude,
          longitude: latestLoc ? latestLoc.longitude : scheduleLoc.longitude,
          status: "BELUM_ABSEN",
          currentStatus,
          student: s,
        };
      });

    const combined = [...attendedList, ...unAttendedList];

    // Sort Ketua Kelompok (isKetua === true) to the VERY TOP (1st position)
    combined.sort((a: any, b: any) => {
      const aIsKetua = a.student?.studentProfile?.isKetua ? 1 : 0;
      const bIsKetua = b.student?.studentProfile?.isKetua ? 1 : 0;
      return bIsKetua - aIsKetua;
    });

    return combined;
  }
}

export const kknAttendanceService = new KknAttendanceService();
