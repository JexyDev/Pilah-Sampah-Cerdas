import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { configService } from "./configService.js";
import { dplService } from "./dplService.js";
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

/**
 * Helper: Calculate total accumulated duration (minutes) spent inside geofence
 * from studentLocation records.
 */
export function calculateInZoneDurationMinutes(
  locations: { recordedAt: Date | string; latitude: any; longitude: any }[],
  geofence: { latitude: number; longitude: number; radius: number; polygon?: any },
  bufferMeters: number = 15
): number {
  if (!locations || locations.length < 2) return 0;

  // Filter locations strictly inside the activity geofence (using configurable buffer)
  const inZonePoints = locations.filter((loc) => {
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    if (isNaN(lat) || isNaN(lng)) return false;

    if (geofence.polygon && Array.isArray(geofence.polygon) && geofence.polygon.length >= 3) {
      const polyPoints = (geofence.polygon as any[]).map((p) => ({
        lat: Number(p[0]),
        lng: Number(p[1]),
      }));
      return isPointInPolygonWithBuffer({ lat, lng }, polyPoints, bufferMeters);
    } else {
      const dist = calculateDistance(lat, lng, geofence.latitude, geofence.longitude);
      return dist <= (geofence.radius + bufferMeters);
    }
  });

  if (inZonePoints.length < 2) return 0;

  // Sort ascending by time
  const sorted = [...inZonePoints].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  let totalMs = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const t1 = new Date(sorted[i].recordedAt).getTime();
    const t2 = new Date(sorted[i + 1].recordedAt).getTime();
    const diff = t2 - t1;
    // If consecutive in-zone pings are within 5 minutes, count the real elapsed time
    if (diff > 0 && diff <= 5 * 60 * 1000) {
      totalMs += diff;
    }
  }

  return Math.floor(totalMs / (60 * 1000));
}

/**
 * Helper: Determine required attendance duration (minutes) for a schedule activity.
 */
export async function getScheduleTargetDurationMinutes(schedule: { time?: string | null }): Promise<number> {
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
  const ruleTargetMinutes =
    ruleConfigs.attendanceMinDurationHours * 60 +
    ruleConfigs.attendanceMinDurationMinutes +
    Math.round(ruleConfigs.attendanceMinDurationSeconds / 60);

  if (ruleTargetMinutes > 0) {
    return ruleTargetMinutes;
  }
  if (scheduleDurationMinutes > 0) {
    return scheduleDurationMinutes;
  }
  return 120;
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

    // 1. Simpan lokasi ke studentLocation (GPS tracking log)
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

    // 2. Evaluasi Kondisi B (Otomatis): Hanya buat attendance jika akumulasi durasi in-zone >= durasiWajibMenit
    let autoAttendanceTriggered = false;
    let inZoneMinutes = 0;
    let isInsideZone = false;

    // Load geofence buffer from Rule Engine config (replaces hardcoded 15m)
    const ruleConfigs = await configService.getRuleEngineConfigs();
    const bufferMeters = (ruleConfigs as any).attendanceGeofenceBufferMeters ?? 15;
    const autoHadirOutsideZone = (ruleConfigs as any).attendanceAutoHadirOutsideZone !== false;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const activeSchedules = await prisma.schedule.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        isActive: true,
        ...(student?.kelompokId ? { OR: [{ kelompokId: student.kelompokId }, { kelompokId: null }] } : {}),
      },
    });

    if (activeSchedules.length > 0) {
      const todayLogs = await prisma.studentLocation.findMany({
        where: {
          studentId: userId,
          recordedAt: { gte: todayStart },
        },
        orderBy: { recordedAt: "asc" },
      });

      for (const sch of activeSchedules) {
        const existingAtt = await prisma.activityAttendance.findUnique({
          where: {
            studentId_scheduleId: {
              studentId: userId,
              scheduleId: sch.id,
            },
          },
        });

        // Skip HANYA jika kegiatan sudah checkout / selesai sepenuhnya
        if (existingAtt && (existingAtt.status === "SELESAI" || existingAtt.status === "SELESAI_TELAT" || existingAtt.checkOutAt !== null)) {
          continue;
        }

        const geofence = {
          latitude: sch.latitude ? Number(sch.latitude) : -6.8915,
          longitude: sch.longitude ? Number(sch.longitude) : 107.6107,
          radius: sch.radius ? Number(sch.radius) : 150,
          polygon: sch.polygon,
        };

        const durationInZone = calculateInZoneDurationMinutes(todayLogs, geofence, bufferMeters);
        inZoneMinutes = Math.max(inZoneMinutes, durationInZone);

        // Cek posisi saat ini menggunakan buffer dinamis
        if (geofence.polygon && Array.isArray(geofence.polygon) && geofence.polygon.length >= 3) {
          const polyPoints = (geofence.polygon as any[]).map((p) => ({
            lat: Number(p[0]),
            lng: Number(p[1]),
          }));
          isInsideZone = isPointInPolygonWithBuffer({ lat: latitude, lng: longitude }, polyPoints, bufferMeters);
        } else {
          const dist = calculateDistance(latitude, longitude, geofence.latitude, geofence.longitude);
          isInsideZone = dist <= (geofence.radius + bufferMeters);
        }

        const durasiWajibMenit = await getScheduleTargetDurationMinutes(sch);

        // Update / upsert actualInZoneMinutes so Web Dashboard and Mobile are 100% in sync
        // Catatan: Status tetap BERLANGSUNG sampai mahasiswa menekan tombol "Absen Sekarang"
        if (existingAtt) {
          if (existingAtt.status !== "SELESAI" && existingAtt.status !== "SELESAI_TELAT") {
            await prisma.activityAttendance.update({
              where: { id: existingAtt.id },
              data: { actualInZoneMinutes: durationInZone },
            });
          }
        } else if (durationInZone > 0) {
          try {
            await prisma.activityAttendance.create({
              data: {
                studentId: userId,
                scheduleId: sch.id,
                status: "BERLANGSUNG",
                method: "GPS_ACTIVITY",
                latitude,
                longitude,
                actualInZoneMinutes: durationInZone,
              },
            });
          } catch (_createErr) {
            // Continue if concurrent request created record
          }
        }
      }
    }

    return {
      success: true,
      message: "Lokasi berhasil dilacak",
      status: isInsideZone ? "LAPANGAN" : "DI_LUAR_ZONA",
      currentStatus: isInsideZone ? "LAPANGAN" : "DI_LUAR_ZONA",
      inZoneMinutes,
      autoAttendanceTriggered,
    };
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
   * Auto-attendance is ONLY triggered if cumulative in-zone duration reaches durasiWajibMenit.
   */
  async updateStudentLocationsBatch(
    studentId: string,
    locations: { latitude: number; longitude: number; timestamp?: string }[]
  ) {
    const savedLocations = [];
    let latestLoc: { latitude: number; longitude: number } | null = null;

    for (const loc of locations) {
      // 1. Save new location to studentLocation (GPS tracking log)
      const location = await prisma.studentLocation.create({
        data: {
          studentId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          recordedAt: loc.timestamp ? new Date(loc.timestamp) : new Date(),
        },
      });
      savedLocations.push(location);
      latestLoc = { latitude: loc.latitude, longitude: loc.longitude };
    }

    // Broadcast latest location via WebSocket
    if (latestLoc) {
      websocketService.broadcastStudentLocation({
        studentId,
        latitude: latestLoc.latitude,
        longitude: latestLoc.longitude,
        recordedAt: new Date().toISOString(),
      });
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
    }).catch(() => {});

    // 3. Evaluasi Kondisi B (Otomatis): Hitung akumulasi durasi in-zone dari tabel studentLocation
    const autoAttendanceTriggered: string[] = [];
    let inZoneMinutes = 0;
    let isInsideZone = false;

    // Load geofence buffer from Rule Engine config (replaces hardcoded 15m)
    const ruleConfigs = await configService.getRuleEngineConfigs();
    const bufferMeters = (ruleConfigs as any).attendanceGeofenceBufferMeters ?? 15;
    const autoHadirOutsideZone = (ruleConfigs as any).attendanceAutoHadirOutsideZone !== false;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const student = await prisma.studentKkn.findUnique({
      where: { userId: studentId },
    });

    const activeSchedules = await prisma.schedule.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        isActive: true,
        ...(student?.kelompokId ? { OR: [{ kelompokId: student.kelompokId }, { kelompokId: null }] } : {}),
      },
    });

    if (activeSchedules.length > 0 && latestLoc) {
      const todayLogs = await prisma.studentLocation.findMany({
        where: {
          studentId,
          recordedAt: { gte: todayStart },
        },
        orderBy: { recordedAt: "asc" },
      });

      for (const sch of activeSchedules) {
        const existingAtt = await prisma.activityAttendance.findUnique({
          where: {
            studentId_scheduleId: {
              studentId,
              scheduleId: sch.id,
            },
          },
        });

        // Skip jika sudah selesai / hadir / sudah checkout
        if (existingAtt && (existingAtt.status === "HADIR" || existingAtt.status === "SELESAI" || existingAtt.status === "SELESAI_TELAT" || existingAtt.checkOutAt !== null)) {
          continue;
        }

        const geofence = {
          latitude: sch.latitude ? Number(sch.latitude) : -6.8915,
          longitude: sch.longitude ? Number(sch.longitude) : 107.6107,
          radius: sch.radius ? Number(sch.radius) : 150,
          polygon: sch.polygon,
        };

        const durationInZone = calculateInZoneDurationMinutes(todayLogs, geofence, bufferMeters);
        inZoneMinutes = Math.max(inZoneMinutes, durationInZone);

        // Cek posisi saat ini menggunakan buffer dinamis
        if (geofence.polygon && Array.isArray(geofence.polygon) && geofence.polygon.length >= 3) {
          const polyPoints = (geofence.polygon as any[]).map((p) => ({
            lat: Number(p[0]),
            lng: Number(p[1]),
          }));
          isInsideZone = isPointInPolygonWithBuffer({ lat: latestLoc!.latitude, lng: latestLoc!.longitude }, polyPoints, bufferMeters);
        } else {
          const dist = calculateDistance(latestLoc!.latitude, latestLoc!.longitude, geofence.latitude, geofence.longitude);
          isInsideZone = dist <= (geofence.radius + bufferMeters);
        }

        const durasiWajibMenit = await getScheduleTargetDurationMinutes(sch);

        // Update actualInZoneMinutes pada attendance yang sedang BERLANGSUNG
        if (existingAtt && existingAtt.status === "BERLANGSUNG") {
          await prisma.activityAttendance.update({
            where: { id: existingAtt.id },
            data: { actualInZoneMinutes: durationInZone },
          });
        }

        // Catatan: Status tetap BERLANGSUNG sampai mahasiswa menekan tombol "Absen Sekarang" (manual check-in)
        // Lokasi GPS ping hanya memperbarui actualInZoneMinutes tanpa mengubah status ke HADIR secara otomatis
      }
    }

    return {
      success: true,
      locations: savedLocations,
      status: isInsideZone ? "LAPANGAN" : "DI_LUAR_ZONA",
      currentStatus: isInsideZone ? "LAPANGAN" : "DI_LUAR_ZONA",
      inZoneMinutes,
      autoAttendanceTriggered,
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
        const isFinished = attendance.checkOutAt !== null || attendance.status === "HADIR" || attendance.status === "SELESAI";
        isAttended = isFinished;
        attendanceStatus = isFinished
          ? (attendance.status === "SELESAI" ? "SELESAI" : "HADIR")
          : (attendance.status === "ALPA" ? "ALPA" : "LAPANGAN");
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
        // If already completed as HADIR or SELESAI, return existing
        if (existing.status === "HADIR" || existing.status === "SELESAI" || existing.checkOutAt !== null) {
          return existing;
        }

        // If was ongoing (BERLANGSUNG/DALAM_RADIUS), mark as HADIR (or ALPA)
        const updated = await tx.activityAttendance.update({
          where: { id: existing.id },
          data: {
            method: isAutoAlpa ? "ALPA_AUTO" : method,
            latitude,
            longitude,
            status: isAutoAlpa ? "ALPA" : "HADIR",
            attendedAt: existing.attendedAt || new Date(),
            checkOutAt: existing.checkOutAt,
          },
        });

        // Award points if not already awarded
        if (!isAutoAlpa) {
          const existingPoint = await tx.pointHistory.findFirst({
            where: {
              userId: studentId,
              description: { contains: scheduleId },
            },
          });
          if (!existingPoint) {
            await tx.pointHistory.create({
              data: {
                userId: studentId,
                points: 10,
                description: `Bonus kehadiran KKN: ${actLoc?.title || scheduleId} (${method})`,
                kategori: "PARTISIPASI_STREAK",
                redeemable: false,
              },
            });
          }
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

        return updated;
      }

      const record = await tx.activityAttendance.create({
        data: {
          studentId,
          scheduleId,
          method: isAutoAlpa ? "ALPA_AUTO" : method,
          latitude,
          longitude,
          status: isAutoAlpa ? "ALPA" : "BERLANGSUNG",
          checkOutAt: null,
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

    // Broadcast attendance check-in update via WebSocket
    websocketService.broadcastStudentAttendance({
      id: attendance.id,
      studentId,
      scheduleId,
      status: attendance.status,
      attendedAt: attendance.attendedAt,
      completedAt: (attendance as any).checkOutAt || null,
      method: attendance.method,
      latitude,
      longitude,
      student: {
        id: studentId,
        name: finalNama,
        phone: studentUser?.phone || "",
        studentProfile: {
          nim: finalNim,
          jurusan: studentUser?.studentProfile?.jurusan || "-",
          kelompok: studentUser?.studentProfile?.kelompok
            ? {
                id: studentUser.studentProfile.kelompok.id,
                name: studentUser.studentProfile.kelompok.name,
              }
            : undefined,
        },
      },
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
   * Record attendance check-out (waktu kepulangan / selesai sesi presensi)
   */
  async checkOutAttendance(params: {
    studentId: string;
    scheduleId?: string;
    latitude?: number;
    longitude?: number;
  }) {
    const { studentId, scheduleId, latitude, longitude } = params;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Find the latest active check-in today that has not checked out yet
    let attendance = await prisma.activityAttendance.findFirst({
      where: {
        studentId,
        ...(scheduleId ? { scheduleId } : {}),
        attendedAt: { gte: startOfDay },
        checkOutAt: null,
      },
      orderBy: { attendedAt: "desc" },
    });

    if (!attendance) {
      // Fallback: check if already checked out today
      attendance = await prisma.activityAttendance.findFirst({
        where: {
          studentId,
          ...(scheduleId ? { scheduleId } : {}),
          attendedAt: { gte: startOfDay },
        },
        orderBy: { attendedAt: "desc" },
      });
    }

    if (!attendance) {
      throw new Error("ATTENDANCE_NOT_FOUND: Belum ada data check-in hari ini untuk di-checkout.");
    }

    const checkOutTime = new Date();
    const attendedTime = new Date(attendance.attendedAt);
    const rawDurationMinutes = Math.max(0, Math.floor((checkOutTime.getTime() - attendedTime.getTime()) / (1000 * 60)));

    // Calculate actual in-zone duration from GPS logs (not simple time diff)
    const dayStart = new Date(attendance.attendedAt);
    dayStart.setHours(0, 0, 0, 0);
    const todayLogsForCheckout = await prisma.studentLocation.findMany({
      where: {
        studentId,
        recordedAt: { gte: dayStart },
      },
      orderBy: { recordedAt: "asc" },
    });

    const schedule = await prisma.schedule.findUnique({
      where: { id: attendance.scheduleId },
    });

    const checkoutRuleConfigs = await configService.getRuleEngineConfigs();
    const checkoutBufferMeters = (checkoutRuleConfigs as any).attendanceGeofenceBufferMeters ?? 15;

    let actualInZoneMins = rawDurationMinutes; // Fallback to raw if no schedule/logs
    let checkoutFinalStatus = "SELESAI";

    if (schedule && todayLogsForCheckout.length >= 2) {
      const checkoutGeofence = {
        latitude: schedule.latitude ? Number(schedule.latitude) : -6.8915,
        longitude: schedule.longitude ? Number(schedule.longitude) : 107.6107,
        radius: schedule.radius ? Number(schedule.radius) : 150,
        polygon: schedule.polygon,
      };
      actualInZoneMins = calculateInZoneDurationMinutes(todayLogsForCheckout, checkoutGeofence, checkoutBufferMeters);
    }

    // Determine final status: SELESAI or SELESAI_TELAT
    if (schedule) {
      const durasiWajibMenit = await getScheduleTargetDurationMinutes(schedule);
      if (durasiWajibMenit > 0 && actualInZoneMins < durasiWajibMenit) {
        checkoutFinalStatus = "SELESAI_TELAT";
      }
    }

    const durationMinutes = actualInZoneMins;

    const updated = await prisma.activityAttendance.update({
      where: { id: attendance.id },
      data: {
        checkOutAt: checkOutTime,
        status: checkoutFinalStatus,
        actualInZoneMinutes: actualInZoneMins,
        ...(latitude !== undefined && !isNaN(Number(latitude)) ? { latitude: Number(latitude) } : {}),
        ...(longitude !== undefined && !isNaN(Number(longitude)) ? { longitude: Number(longitude) } : {}),
      },
      include: {
        schedule: true,
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

    // Award +10 points to student on Check-Out (Kepulangan) if not already awarded today
    const existingCheckoutPoint = await prisma.pointHistory.findFirst({
      where: {
        userId: studentId,
        description: { contains: `(Check-Out)` },
        createdAt: { gte: startOfDay },
      },
    });

    if (!existingCheckoutPoint) {
      await prisma.pointHistory.create({
        data: {
          userId: studentId,
          points: 10,
          description: `Bonus kepulangan (Check-Out) presensi KKN: ${updated.schedule?.title || updated.scheduleId}`,
          kategori: "PARTISIPASI_STREAK",
          redeemable: false,
        },
      });
    }

    // Broadcast checkout event via WebSocket
    websocketService.broadcastStudentCheckout({
      attendanceId: updated.id,
      studentId,
      scheduleId: updated.scheduleId,
      attendedAt: updated.attendedAt,
      checkOutAt: updated.checkOutAt,
      durationMinutes,
      status: updated.status,
      student: updated.student,
    });

    // Broadcast attendance update via WebSocket
    websocketService.broadcastStudentAttendance({
      id: updated.id,
      studentId,
      scheduleId: updated.scheduleId,
      status: updated.status,
      attendedAt: updated.attendedAt,
      completedAt: updated.checkOutAt,
      totalMinutes: durationMinutes,
      method: updated.method,
      latitude: updated.latitude,
      longitude: updated.longitude,
      student: updated.student,
    });

    return {
      success: true,
      message: "Check-out presensi berhasil dicatat.",
      data: {
        attendanceId: updated.id,
        scheduleId: updated.scheduleId,
        attendedAt: updated.attendedAt,
        checkOutAt: updated.checkOutAt,
        durationMinutes,
        durationFormatted: `${Math.floor(durationMinutes / 60)} Jam ${durationMinutes % 60} Menit`,
        status: updated.status,
      },
    };
  }

  /**
   * Get all active student locations recorded in the last TTL minutes (default 5 minutes).
   * If dplUserId is provided, filters to students in DPL's assigned kelompok.
   */
  async getActiveStudentsLocations(dplUserId?: string, kelompokId?: string) {
    let ttlMinutes = 5;
    try {
      const ttlConfig = await configService.getConfig("attendance_active_location_ttl_minutes");
      if (ttlConfig && !isNaN(Number(ttlConfig)) && Number(ttlConfig) > 0) {
        ttlMinutes = Number(ttlConfig);
      }
    } catch (_err) {
      ttlMinutes = 5;
    }

    // Only fetch fresh locations from the last TTL minutes (default: 5 minutes)
    const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);

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

    let studentWhereCondition: any = { studentProfile: { isNot: null } };

    if (dplStudentUserIds && dplStudentUserIds.length > 0) {
      studentWhereCondition = {
        id: { in: dplStudentUserIds },
      };
    } else if (schedule?.kelompok?.students && schedule.kelompok.students.length > 0) {
      const groupUserIds = schedule.kelompok.students.map((s) => s.userId);
      studentWhereCondition = {
        id: { in: groupUserIds },
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

    // Load geofence buffer from Rule Engine config
    const attendanceListRuleConfigs = await configService.getRuleEngineConfigs();
    const attendanceListBufferMeters = (attendanceListRuleConfigs as any).attendanceGeofenceBufferMeters ?? 15;

    const locations = await this.getActiveStudentsLocations(dplUserId);
    const locMap = new Map(locations.map((l) => [l.studentId, l]));
    const scheduleLoc = await this.getActivityLocation(scheduleId);

    const attendedStudentIds = new Set<string>();

    const attendedList = list.map((att) => {
      attendedStudentIds.add(att.studentId);
      const latestLoc = locMap.get(att.studentId);
      const leave = leaveMap.get(att.studentId);

      const isFinished = att.checkOutAt !== null || att.status === "SELESAI";

      let currentStatus = "TERCATAT_ABSEN";
      let status = att.status;

      if (att.method === "IZIN_DPL" || String(att.status).toUpperCase().includes("IZIN") || String(att.status).toUpperCase().includes("SAKIT")) {
        currentStatus = "IZIN_DISETUJUI";
        status = String(att.status).toUpperCase().includes("SAKIT") ? "SAKIT" : "IZIN";
      } else if (att.method === "OVERRIDE_DPL" || String(att.status).toUpperCase().includes("OVERRIDE")) {
        currentStatus = "OVERRIDDEN_HADIR";
        status = "HADIR";
      } else if (isFinished) {
        currentStatus = "SELESAI";
        status = "SELESAI";
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
            attendanceListBufferMeters
          );
        } else {
          const dist = calculateDistance(
            Number(latestLoc.latitude),
            Number(latestLoc.longitude),
            scheduleLoc.latitude,
            scheduleLoc.longitude
          );
          isInside = dist <= scheduleLoc.radius + attendanceListBufferMeters;
        }
        currentStatus = isInside ? "MASIH_DI_LOKASI" : "SUDAH_MENINGGALKAN_RADIUS";
        status = att.status === "BERLANGSUNG" ? "BERLANGSUNG" : (isInside ? "HADIR" : "LEPAS_RADIUS");
      } else {
        currentStatus = "MASIH_DI_LOKASI";
        status = att.status === "BERLANGSUNG" ? "BERLANGSUNG" : "HADIR";
      }

      const isLeave = att.method === "IZIN_DPL" || String(att.status).toUpperCase().includes("IZIN") || String(att.status).toUpperCase().includes("SAKIT");
      return {
        ...att,
        status,
        currentStatus,
        statusDisplay: status === "HADIR" ? "Hadir" : status === "SELESAI" ? "Selesai" : status === "LEPAS_RADIUS" ? "Lepas Radius" : status,
        attendedAt: isLeave ? null : att.attendedAt,
        completedAt: isFinished ? (att.checkOutAt || (att as any).completedAt || null) : null,
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
          statusDisplay: attStatus === "SAKIT" ? "Sakit (Disetujui)" : "Izin (Disetujui)",
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
          statusDisplay: isSakit ? "Sakit (Menunggu)" : "Izin (Menunggu)",
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
          statusDisplay: "Batal Izin (Menunggu)",
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
          statusDisplay: "Hadir (Batal Izin)",
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
        let status = "BELUM_ABSEN";
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
              attendanceListBufferMeters
            );
          } else {
            const dist = calculateDistance(
              Number(latestLoc.latitude),
              Number(latestLoc.longitude),
              scheduleLoc.latitude,
              scheduleLoc.longitude
            );
            isInside = dist <= scheduleLoc.radius + attendanceListBufferMeters;
          }
          currentStatus = isInside ? "MASIH_DI_LOKASI" : "BELUM_ABSEN";
          status = isInside ? "LAPANGAN" : "BELUM_ABSEN";
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
          status,
          currentStatus,
          statusDisplay: status === "LAPANGAN" ? "Lapangan" : "Belum Absen",
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

    const config = await dplService.getConfigTargets();
    const TARGET_TOTAL_HOURS = config.targetTotalJam || 100;
    const TARGET_TOTAL_MINUTES = TARGET_TOTAL_HOURS * 60;
    const TARGET_HARIAN_HOURS = config.targetHarianJam || 2;
    const TARGET_HARIAN_MINUTES = Math.round(TARGET_HARIAN_HOURS * 60);

    const summary = students.map((s) => {
      let totalMinutes = 0;
      let validSessionsCount = 0;
      let fulfilledTargetDays = 0;

      const sessionDetails = s.user.attendances.map((att) => {
        let durationMins = 0;
        if ((att as any).actualInZoneMinutes !== null && (att as any).actualInZoneMinutes !== undefined) {
          // Prefer stored in-zone duration over simple time diff
          durationMins = Math.min(480, Math.max(0, (att as any).actualInZoneMinutes));
        } else if (att.checkOutAt) {
          const diffMs = att.checkOutAt.getTime() - att.attendedAt.getTime();
          // Cap max 8 hours (480 mins) per session
          durationMins = Math.min(480, Math.max(0, Math.floor(diffMs / (1000 * 60))));
        } else if (att.attendedAt) {
          const isToday = new Date(att.attendedAt).toDateString() === new Date().toDateString();
          if (isToday) {
            const diffMs = Date.now() - new Date(att.attendedAt).getTime();
            durationMins = Math.min(480, Math.max(0, Math.floor(diffMs / (1000 * 60))));
          }
        }
        totalMinutes += durationMins;
        if (durationMins > 0) validSessionsCount++;
        if (durationMins >= TARGET_HARIAN_MINUTES) fulfilledTargetDays++;

        return {
          id: att.id,
          scheduleId: att.scheduleId,
          scheduleTitle: att.schedule?.title || "Kegiatan KKN",
          attendedAt: att.attendedAt,
          checkOutAt: att.checkOutAt,
          durationMinutes: durationMins,
          durationFormatted: `${Math.floor(durationMins / 60)} Jam ${durationMins % 60} Menit`,
          isMinTargetMet: durationMins >= TARGET_HARIAN_MINUTES,
          status: att.status,
        };
      });

      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const progressPercentage = Math.round((totalMinutes / (TARGET_TOTAL_MINUTES || 1)) * 1000) / 10;

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
        targetHarianHours: TARGET_HARIAN_HOURS,
        progressPercentage,
        totalDaysAttended: sessionDetails.length,
        fulfilledTargetDays,
        isTargetFulfilled: totalMinutes >= TARGET_TOTAL_MINUTES,
        sessions: sessionDetails,
      };
    });

    return {
      targetRules: {
        hariKerja: config.hariKerja || "Senin – Jumat",
        jamOperasional: config.jamKerja || "08:00 – 16:00 WIB",
        targetHarianMinJam: TARGET_HARIAN_HOURS,
        targetTotalJam: TARGET_TOTAL_HOURS,
        targetTotalHari: config.targetTotalHari || 50,
        targetPekan: config.targetPekan || 10,
      },
      totalMahasiswa: summary.length,
      students: summary,
    };
  }
  /**
   * Mengambil daftar kegiatan KKN hari ini untuk mahasiswa yang sedang login.
   * Endpoint: GET /api/v1/kkn/kegiatan-aktif
   */
  async getKegiatanAktif(userId: string, targetTanggal?: string) {
    const student = await prisma.studentKkn.findUnique({
      where: { userId },
      include: {
        kelompok: true,
      },
    });

    const ruleConfigs = await configService.getRuleEngineConfigs();
    const durasiWajibMenit =
      ruleConfigs.attendanceMinDurationHours * 60 +
      ruleConfigs.attendanceMinDurationMinutes +
      Math.round(ruleConfigs.attendanceMinDurationSeconds / 60) || 120;

    let targetDate = new Date();
    if (targetTanggal) {
      const parsed = new Date(targetTanggal);
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
      }
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Cek pengajuan izin/sakit mahasiswa yang sudah disetujui pada tanggal ini
    const approvedLeave = await prisma.studentLeaveRequest.findFirst({
      where: {
        studentId: userId,
        status: "APPROVED",
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      },
    });

    // 2. Cari jadwal KKN yang berlaku untuk kelompok mahasiswa (atau jadwal global)
    const schedules = await prisma.schedule.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        isActive: true,
        ...(student?.kelompokId ? { OR: [{ kelompokId: student.kelompokId }, { kelompokId: null }] } : {}),
      },
      include: {
        kelompok: true,
        attendances: {
          where: { studentId: userId },
        },
      },
      orderBy: { date: "asc" },
    });

    const now = new Date();
    const currentHour = (now.getUTCHours() + 7) % 24;
    const currentMinute = now.getUTCMinutes();
    const currentMinutesTotal = currentHour * 60 + currentMinute;
    const isToday = targetDate.toDateString() === now.toDateString();

    const result = schedules.map((sch) => {
      let jamMulai = "08:00";
      let jamSelesai = "16:00";
      if (sch.time && sch.time.includes("-")) {
        const parts = sch.time.split("-");
        jamMulai = parts[0].trim();
        jamSelesai = parts[1].trim();
      }

      // Hitung menit mulai dan selesai
      const [startH, startM] = jamMulai.split(":").map(Number);
      const [endH, endM] = jamSelesai.split(":").map(Number);
      const startMinutesTotal = (startH || 8) * 60 + (startM || 0);
      const endMinutesTotal = (endH || 16) * 60 + (endM || 0);

      // Status waktu kegiatan
      let scheduleStatus = "AKTIF";
      if (isToday) {
        if (currentMinutesTotal < startMinutesTotal) {
          scheduleStatus = "BELUM_MULAI";
        } else if (currentMinutesTotal > endMinutesTotal) {
          scheduleStatus = "SELESAI";
        } else {
          scheduleStatus = "AKTIF";
        }
      } else if (targetDate > now) {
        scheduleStatus = "BELUM_MULAI";
      } else {
        scheduleStatus = "SELESAI";
      }

      // Status Kehadiran mahasiswa
      let statusKehadiran: string | null = null;
      if (approvedLeave) {
        statusKehadiran = approvedLeave.type.toUpperCase() === "SAKIT" ? "SAKIT" : "IZIN";
      } else if (sch.attendances && sch.attendances.length > 0) {
        const att = sch.attendances[0];
        if (att.status === "ALPA") {
          statusKehadiran = "ALPA";
        } else if (att.checkOutAt || att.status === "HADIR" || att.status === "SELESAI") {
          statusKehadiran = "HADIR";
        } else if (att.status === "BERLANGSUNG" || att.status === "DALAM_RADIUS" || att.status === "DI_ZONA") {
          statusKehadiran = "BERLANGSUNG";
        }
      } else if (scheduleStatus === "SELESAI") {
        statusKehadiran = "ALPA";
      }

      const latNum = sch.latitude ? Number(sch.latitude) : -6.8906;
      const lngNum = sch.longitude ? Number(sch.longitude) : 107.615;

      return {
        id: sch.id,
        namaKegiatan: sch.title,
        tanggal: targetDate.toISOString().slice(0, 10),
        jamMulai,
        jamSelesai,
        durasiWajibMenit,
        lokasi: {
          alamat: sch.location || "Lokasi Kegiatan KKN",
          latitude: latNum,
          longitude: lngNum,
          radiusMeter: sch.radius || 150,
          polygon: sch.polygon || null,
        },
        status: scheduleStatus,
        statusKehadiran,
        kelompok: {
          id: sch.kelompok?.id || student?.kelompok?.id || "KLP-001",
          nama: sch.kelompok?.name || student?.kelompok?.name || "Kelompok KKN",
        },
      };
    });

    return result;
  }

  /**
   * Konfirmasi mulai kegiatan dan start background GPS session
   * Endpoint: POST /api/v1/kkn/kegiatan/:id/mulai
   */
  async mulaiKegiatan(
    studentUserId: string,
    scheduleId: string,
    payload: { latitude: number; longitude: number; deviceInfo?: string }
  ) {
    const { latitude, longitude, deviceInfo } = payload;

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { kelompok: true },
    });

    if (!schedule || !schedule.isActive) {
      throw new Error("SCHEDULE_NOT_FOUND: Jadwal kegiatan KKN tidak ditemukan atau tidak aktif.");
    }

    const student = await prisma.studentKkn.findUnique({
      where: { userId: studentUserId },
      include: { kelompok: true, user: true },
    });

    if (!student) {
      throw new Error("STUDENT_NOT_FOUND: Profil mahasiswa KKN tidak ditemukan.");
    }

    // Validasi kepemilikan kelompok (jika jadwal memiliki kelompok spesifik)
    if (schedule.kelompokId && student.kelompokId && schedule.kelompokId !== student.kelompokId) {
      throw new Error("FORBIDDEN: Anda tidak terdaftar pada kelompok kegiatan ini.");
    }

    // Concurrency check: Pastikan tidak ada kegiatan lain yang sedang BERLANGSUNG hari ini
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const activeOtherSession = await prisma.activityAttendance.findFirst({
      where: {
        studentId: studentUserId,
        scheduleId: { not: scheduleId },
        attendedAt: { gte: startOfDay },
        checkOutAt: null,
        status: "BERLANGSUNG",
      },
      include: { schedule: true },
    });

    if (activeOtherSession) {
      throw new Error(
        `CONCURRENCY_CONFLICT: Selesaikan sesi kegiatan '${activeOtherSession.schedule?.title || "sebelumnya"}' terlebih dahulu sebelum memulai kegiatan baru.`
      );
    }

    // Upsert session di activityAttendance
    const attendance = await prisma.activityAttendance.upsert({
      where: {
        studentId_scheduleId: {
          studentId: studentUserId,
          scheduleId,
        },
      },
      update: {
        attendedAt: new Date(),
        status: "BERLANGSUNG",
        latitude,
        longitude,
        method: "GPS_ACTIVITY",
        checkOutAt: null,
      },
      create: {
        studentId: studentUserId,
        scheduleId,
        attendedAt: new Date(),
        status: "BERLANGSUNG",
        latitude,
        longitude,
        method: "GPS_ACTIVITY",
      },
    });

    // Simpan koordinat awal ke studentLocation
    await prisma.studentLocation.create({
      data: {
        studentId: studentUserId,
        latitude,
        longitude,
      },
    });

    // Broadcast lokasi via WebSocket
    websocketService.broadcastStudentLocation({
      studentId: studentUserId,
      latitude,
      longitude,
      recordedAt: new Date().toISOString(),
      student: {
        id: studentUserId,
        name: student.user.name,
        phone: student.user.phone,
        studentProfile: {
          nim: student.nim,
          jurusan: student.jurusan,
          kelompokId: student.kelompokId,
        },
      },
    });

    // Broadcast realtime attendance start event via WebSocket
    websocketService.broadcastStudentAttendance({
      id: attendance.id,
      studentId: studentUserId,
      scheduleId,
      status: attendance.status,
      attendedAt: attendance.attendedAt,
      completedAt: null,
      method: "GPS_ACTIVITY",
      latitude,
      longitude,
      student: {
        id: studentUserId,
        name: student.user.name,
        phone: student.user.phone,
        studentProfile: {
          nim: student.nim,
          jurusan: student.jurusan,
          kelompokId: student.kelompokId,
        },
      },
    });

    // Award +10 points to student on Check-In (Mulai Kegiatan) if not already awarded today
    const existingCheckInPoint = await prisma.pointHistory.findFirst({
      where: {
        userId: studentUserId,
        description: { contains: `(Check-In)` },
        createdAt: { gte: startOfDay },
      },
    });

    if (!existingCheckInPoint) {
      await prisma.pointHistory.create({
        data: {
          userId: studentUserId,
          points: 10,
          description: `Bonus kehadiran (Check-In) KKN: ${schedule.title || scheduleId}`,
          kategori: "PARTISIPASI_STREAK",
          redeemable: false,
        },
      });
    }

    const ruleConfigs = await configService.getRuleEngineConfigs();
    const durasiWajibMenit =
      ruleConfigs.attendanceMinDurationHours * 60 +
      ruleConfigs.attendanceMinDurationMinutes +
      Math.round(ruleConfigs.attendanceMinDurationSeconds / 60) || 120;

    let jamMulai = "08:00";
    let jamSelesai = "16:00";
    if (schedule.time && schedule.time.includes("-")) {
      const parts = schedule.time.split("-");
      jamMulai = parts[0].trim();
      jamSelesai = parts[1].trim();
    }

    return {
      sessionId: `SES-${schedule.id.slice(0, 8)}-${studentUserId.slice(-6)}`,
      scheduleId: schedule.id,
      namaKegiatan: schedule.title,
      jamMulai,
      jamSelesai,
      durasiWajibMenit,
      lokasi: {
        alamat: schedule.location || "Lokasi Kegiatan KKN",
        latitude: schedule.latitude ? Number(schedule.latitude) : latitude,
        longitude: schedule.longitude ? Number(schedule.longitude) : longitude,
        radiusMeter: schedule.radius || 150,
        polygon: schedule.polygon || null,
      },
      geofenceBufferMeters: (ruleConfigs as any).attendanceGeofenceBufferMeters ?? 15,
      invalidationHours: (ruleConfigs as any).attendanceGeofenceInvalidationHours ?? 2,
      serverTimestamp: new Date().toISOString(),
      attendanceId: attendance.id,
    };
  }

  /**
   * Mengakhiri sesi kegiatan / manual stop
   * Endpoint: POST /api/v1/kkn/kegiatan/:id/selesai
   */
  async selesaiKegiatan(
    studentUserId: string,
    scheduleId: string,
    payload?: { sessionId?: string; totalDurasiDalamZonaMenit?: number; alasan?: string }
  ) {
    return this.checkOutAttendance({
      studentId: studentUserId,
      scheduleId,
    });
  }

  /**
   * Catat pelanggaran keluar zona dengan pemotongan poin di ledger
   * Endpoint: POST /api/v1/kkn/out-of-zone-violation
   */
  async recordOutOfZoneViolation(
    studentUserId: string,
    payload: { scheduleId: string; outOfZoneMinutes: number }
  ) {
    const { scheduleId, outOfZoneMinutes } = payload;
    const ruleConfigs = await configService.getRuleEngineConfigs();

    if (!ruleConfigs.attendanceOutOfZonePenaltyActive) {
      return {
        success: true,
        message: "Penalti keluar zona saat ini dinonaktifkan oleh Rule Engine.",
        pointsDeducted: 0,
      };
    }

    const penaltyPoints = ruleConfigs.attendanceOutOfZonePenaltyPoints || 10;
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { kelompok: true },
    });

    const student = await prisma.studentKkn.findUnique({
      where: { userId: studentUserId },
      include: { user: true, kelompok: true },
    });

    const attendance = await prisma.activityAttendance.findFirst({
      where: {
        studentId: studentUserId,
        scheduleId,
      },
      orderBy: { attendedAt: "desc" },
    });

    // Catat ke buku besar point_history
    const pointRecord = await prisma.pointHistory.create({
      data: {
        userId: studentUserId,
        points: -Math.abs(penaltyPoints),
        kategori: "PENALTY_OUT_OF_ZONE",
        description: `Penalti keluar zona kegiatan '${schedule?.title || "KKN"}' (Kelompok: ${
          student?.kelompok?.name || schedule?.kelompok?.name || "Binaan"
        }) melebihi batas waktu toleransi (${outOfZoneMinutes || 5} menit).`,
        redeemable: false,
      },
    });

    return {
      success: true,
      message: `Pelanggaran tercatat. Poin KKN dipotong -${penaltyPoints} PTS.`,
      data: {
        pointId: pointRecord.id,
        pointsDeducted: penaltyPoints,
        scheduleId,
        kelompokId: student?.kelompokId || schedule?.kelompokId || null,
        attendanceId: attendance?.id || null,
        outOfZoneMinutes,
        recordedAt: pointRecord.createdAt,
      },
    };
  }
}

export const kknAttendanceService = new KknAttendanceService();
