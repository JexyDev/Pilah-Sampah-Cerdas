/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { prisma } from "../lib/prisma.js";
import { configService } from "./configService.js";
import { dplService } from "./dplService.js";
import { isPointInPolygonWithBuffer } from "../utils/geoUtils.js";
import { websocketService } from "./websocketService.js";
import { validateCoordinate } from "../utils/geoValidation.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";

/**
 * Helper: Build unified geofence object with fallback to system defaults.
 * FEATURE 2: Ensures consistent geofence configuration across all location tracking methods.
 */
async function buildGeofence(schedule: any): Promise<{ latitude: number; longitude: number; radius: number; polygon?: any }> {
  // Load system defaults from config
  const configLatStr = await configService.getConfig("default_activity_latitude");
  const configLngStr = await configService.getConfig("default_activity_longitude");
  const configRadiusStr = await configService.getConfig("default_activity_radius");

  const defaultLat = configLatStr ? parseFloat(configLatStr) : -6.8915; // Bandung / Coblong
  const defaultLng = configLngStr ? parseFloat(configLngStr) : 107.6107;
  const defaultRadius = configRadiusStr ? parseInt(configRadiusStr, 10) : 100;

  return {
    latitude: schedule.latitude ? Number(schedule.latitude) : defaultLat,
    longitude: schedule.longitude ? Number(schedule.longitude) : defaultLng,
    radius: schedule.radius ? Number(schedule.radius) : defaultRadius,
    polygon: schedule.polygon,
  };
}

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
/**
 * Helper: Calculate live in-zone minutes based on check-in time and jedaLogs
 * without counting any time spent while paused/jeda.
 * Includes strict sanity check & max daily cap (max 8 hours / 480 mins)
 * to prevent runaway 24h+ zombie durations.
 */
export function calculateLiveInZoneMinutes(att: {
  attendedAt: Date | string;
  actualInZoneMinutes?: number | null;
  jedaLogs?: any;
  status?: string;
}): number {
  const storedMins = Math.max(0, att.actualInZoneMinutes ?? 0);
  if (!att.attendedAt) return storedMins;

  // Max daily limit cap (8 hours = 480 minutes) to prevent non-sensical multi-day accumulations
  const MAX_DAILY_MINUTES_CAP = 480;

  const attendedDate = new Date(att.attendedAt);
  const now = new Date();

  // If attendedAt is from a previous calendar day (in WIB +7), don't use live Date.now()
  const attendedWibDay = new Date(attendedDate.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const nowWibDay = new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const isPastDay = attendedWibDay < nowWibDay;

  // If session is from a past day or status is TERJEDA, use stored in-zone minutes (or capped value)
  if (isPastDay || att.status === "TERJEDA") {
    return Math.min(storedMins, MAX_DAILY_MINUTES_CAP);
  }

  const jedaLogsArray = (att.jedaLogs as any[]) || [];
  if (jedaLogsArray.length === 0) {
    const elapsed = Math.floor((now.getTime() - attendedDate.getTime()) / 60000);
    const computed = Math.max(storedMins, elapsed);
    return Math.min(computed, MAX_DAILY_MINUTES_CAP);
  }

  const lastLog = jedaLogsArray[jedaLogsArray.length - 1];
  if (!lastLog) return Math.min(storedMins, MAX_DAILY_MINUTES_CAP);

  if (lastLog.waktuResume) {
    const resumeTimeMs = new Date(lastLog.waktuResume).getTime();
    const baseMins = Number(lastLog.durasiSebelumResumeMenit) || storedMins;
    const elapsedSinceResume = Math.max(0, Math.floor((now.getTime() - resumeTimeMs) / 60000));
    return Math.min(Math.max(storedMins, baseMins + elapsedSinceResume), MAX_DAILY_MINUTES_CAP);
  }

  if (lastLog.waktuJeda) {
    const baseMins = Number(lastLog.durasiSebelumJedaMenit) || storedMins;
    return Math.min(Math.max(storedMins, baseMins), MAX_DAILY_MINUTES_CAP);
  }

  return Math.min(storedMins, MAX_DAILY_MINUTES_CAP);
}

export function calculateInZoneDurationMinutes(
  locations: { recordedAt: Date | string; latitude: any; longitude: any }[],
  geofence: { latitude: number; longitude: number; radius: number; polygon?: any },
  bufferMeters: number = 15,
  jedaLogs?: any[]
): number {
  if (!locations || locations.length < 1) return 0;

  // Filter locations strictly inside the activity geofence (using configurable buffer)
  const inZonePoints = locations.filter((loc) => {
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    if (isNaN(lat) || isNaN(lng)) return false;

    const dist = calculateDistance(lat, lng, geofence.latitude, geofence.longitude);

    if (geofence.polygon && Array.isArray(geofence.polygon) && geofence.polygon.length >= 3) {
      const polyPoints = (geofence.polygon as any[]).map((p) => {
        const val0 = Number(p[0]);
        const val1 = Number(p[1]);
        const pLat = Math.abs(val0) > 45 ? val1 : val0;
        const pLng = Math.abs(val0) > 45 ? val0 : val1;
        return { lat: pLat, lng: pLng };
      });
      const inPoly = isPointInPolygonWithBuffer({ lat, lng }, polyPoints, bufferMeters);
      return inPoly || (dist <= (geofence.radius + bufferMeters));
    } else {
      return dist <= (geofence.radius + bufferMeters);
    }
  });

  if (inZonePoints.length < 1) return 0;

  // Sort ascending by time
  const sorted = [...inZonePoints].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const tFirst = new Date(sorted[0].recordedAt).getTime();
  const tLast = new Date(sorted[sorted.length - 1].recordedAt).getTime();

  let totalMs = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const t1 = new Date(sorted[i].recordedAt).getTime();
    const t2 = new Date(sorted[i + 1].recordedAt).getTime();
    const diff = t2 - t1;

    let isJedaGap = false;
    if (jedaLogs && jedaLogs.length > 0) {
      for (const log of jedaLogs) {
        if (log.waktuJeda) {
          const jTime = new Date(log.waktuJeda).getTime();
          // Jika waktu jeda berada di antara t1 dan t2, berarti rentang waktu ini adalah masa jeda
          if (jTime >= t1 && jTime <= t2) {
            isJedaGap = true;
            break;
          }
        }
      }
    }

    if (!isJedaGap && diff > 0 && diff <= 5 * 60 * 1000) {
      totalMs += diff;
    }
  }

  // const overallSpan = Math.max(0, tLast - tFirst);
  // Pembulatan paksa ke 1 menit untuk durasi < 1 menit Dihapus 
  // agar sinkron persis dengan detik di mobile (menghindari bug web lebih cepat 30-45 detik)

  return Math.floor(totalMs / (60 * 1000));
}

/**
 * Universal robust time parser for schedule strings:
 * Supports formats: "08:00", "08.00", "08:00 AM", "08:00 WIB", "08:05 PM", "8:05", "13:00", etc.
 */
export function parseScheduleTimeString(timeStr: string, defaultH: number = 8, defaultM: number = 0): [number, number] {
  if (!timeStr) return [defaultH, defaultM];
  const cleaned = timeStr.replace(/\s*(WIB|WITA|WIT)\s*/gi, "").trim();
  const match = cleaned.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (cleaned.toLowerCase().includes("pm") && h < 12) h += 12;
    if (cleaned.toLowerCase().includes("am") && h === 12) h = 0;
    return [h, m];
  }
  const hourMatch = cleaned.match(/(\d{1,2})/);
  if (hourMatch) {
    let h = parseInt(hourMatch[1], 10);
    if (cleaned.toLowerCase().includes("pm") && h < 12) h += 12;
    if (cleaned.toLowerCase().includes("am") && h === 12) h = 0;
    return [h, 0];
  }
  return [defaultH, defaultM];
}

/**
 * Universal parser for schedule time range string (e.g. "08:00 - 16:00", "08:00 AM - 08:05 AM WIB")
 */
export function parseScheduleTimeRange(timeStr?: string | null): {
  jamMulai: string;
  jamSelesai: string;
  startH: number;
  startM: number;
  endH: number;
  endM: number;
  startMinutesTotal: number;
  endMinutesTotal: number;
  isOvernight: boolean;
} {
  let jamMulai = "08:00";
  let jamSelesai = "16:00";
  if (timeStr) {
    const normalized = timeStr
      .replace(/\s*(WIB|WITA|WIT)\s*/gi, "")
      .replace(/[\u2013\u2014~]|s\/d|sd/gi, "-")
      .trim();
    if (normalized.includes("-")) {
      const parts = normalized.split("-");
      jamMulai = parts[0].trim();
      jamSelesai = parts[1].trim();
    }
  }
  const [startH, startM] = parseScheduleTimeString(jamMulai, 8, 0);
  const [endH, endM] = parseScheduleTimeString(jamSelesai, 16, 0);
  const cleanStartH = startH === 24 ? 0 : startH;
  const cleanStartM = startM;
  const cleanEndH = endH === 24 ? 24 : endH;
  const cleanEndM = endM;
  const startMinutesTotal = cleanStartH * 60 + cleanStartM;
  const endMinutesTotal = cleanEndH * 60 + cleanEndM;
  const isOvernight = endMinutesTotal <= startMinutesTotal;

  return {
    jamMulai,
    jamSelesai,
    startH: cleanStartH,
    startM: cleanStartM,
    endH: cleanEndH,
    endM: cleanEndM,
    startMinutesTotal,
    endMinutesTotal,
    isOvernight,
  };
}

/**
 * Helper: Determine required attendance duration (minutes) for a schedule activity.
 */
export async function getScheduleTargetDurationMinutes(schedule: { time?: string | null }): Promise<number> {
  let scheduleDurationMinutes = 0;
  if (schedule?.time) {
    const range = parseScheduleTimeRange(schedule.time);
    if (range.endMinutesTotal > range.startMinutesTotal) {
      scheduleDurationMinutes = range.endMinutesTotal - range.startMinutesTotal;
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
  async pingLocation(userId: string, latitude: number, longitude: number, accumulatedDurationSeconds?: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new Error("USER_NOT_FOUND");

    const student = await prisma.studentKkn.findUnique({
      where: { userId },
    });

    // [KRITIAL FIX] Profil mahasiswa wajib lengkap sebelum GPS tracking diizinkan.
    // Jangan pernah auto-generate data dummy (NIM/jurusan palsu) — melanggar AGENTS.md Rule 11.
    if (!student) {
      throw new Error("STUDENT_PROFILE_INCOMPLETE");
    }

    // ─── Geo-validation pipeline ────────────────────────────────────────────────
    // Ambil lokasi terakhir mahasiswa untuk deteksi teleportasi
    const lastLocation = await prisma.studentLocation.findFirst({
      where: { studentId: userId },
      orderBy: { recordedAt: "desc" },
      select: { latitude: true, longitude: true, recordedAt: true },
    });

    const previousPoint = lastLocation
      ? {
          latitude: Number(lastLocation.latitude),
          longitude: Number(lastLocation.longitude),
          recordedAt: lastLocation.recordedAt,
        }
      : null;

    const geoCheck = validateCoordinate(latitude, longitude, previousPoint);
    if (!geoCheck.valid) {
      throw new Error(geoCheck.errorCode ?? "INVALID_COORDINATES");
    }
    // ────────────────────────────────────────────────────────────────────────────

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
      namaMahasiswa: user.name,
      nim: student.nim,
      jurusan: student.jurusan,
      kelompokId: student.kelompokId,
      student: {
        id: userId,
        name: user.name,
        phone: user.phone,
        studentProfile: {
          nim: student.nim,
          jurusan: student.jurusan,
          kelompokId: student.kelompokId,
        },
      },
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

    const nowForPing = new Date();
    const nowWibPing = new Date(nowForPing.getTime() + 7 * 60 * 60 * 1000);
    const todayWibStrPing = nowWibPing.toISOString().slice(0, 10);
    const todayStart = new Date(`${todayWibStrPing}T00:00:00+07:00`);
    const todayEnd = new Date(`${todayWibStrPing}T23:59:59.999+07:00`);
    const yesterdayWibStrPing = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000)
      .toISOString().slice(0, 10);
    const yesterdayStart = new Date(`${yesterdayWibStrPing}T00:00:00+07:00`);

    const activeSchedules = await prisma.schedule.findMany({
      where: {
        date: { gte: yesterdayStart, lte: todayEnd },
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
        if (existingAtt && (existingAtt.status === "SELESAI" || existingAtt.status === "SELESAI_TELAT" || existingAtt.status === "HADIR_MEMENUHI" || existingAtt.status === "HADIR_TIDAK_MEMENUHI" || existingAtt.status === "HADIR" || Boolean(existingAtt.checkOutAt))) {
          continue;
        }

        const geofence = await buildGeofence(sch);

        // Cek apakah jadwal kegiatan ini masih "AKAN_DATANG" (belum waktunya)
        const scheduleDateWibStrPing = new Date(sch.date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
        let isFutureDatePing = false;
        
        const timeRangePing = parseScheduleTimeRange(sch.time);
        const startMinutesTotal = timeRangePing.startMinutesTotal;
        const endMinutesTotal = timeRangePing.endMinutesTotal;
        const isOvernightPing = timeRangePing.isOvernight;
        let isExpiredDatePing = false;
        if (isOvernightPing) {
          if (scheduleDateWibStrPing === todayWibStrPing) {
             // Hari pertama overnight
          } else if (scheduleDateWibStrPing > todayWibStrPing) {
             isFutureDatePing = true;
          } else {
             const currentMinutesTotal = nowWibPing.getUTCHours() * 60 + nowWibPing.getUTCMinutes();
             if (currentMinutesTotal > endMinutesTotal) isExpiredDatePing = true;
          }
        } else {
          if (scheduleDateWibStrPing > todayWibStrPing) {
            isFutureDatePing = true;
          } else if (scheduleDateWibStrPing === todayWibStrPing) {
            const currentMinutesTotal = nowWibPing.getUTCHours() * 60 + nowWibPing.getUTCMinutes();
            if (currentMinutesTotal < startMinutesTotal) {
              isFutureDatePing = true;
            } else if (currentMinutesTotal > endMinutesTotal) {
              isExpiredDatePing = true;
            }
          } else {
            isExpiredDatePing = true;
          }
        }

        // 1. Cek posisi saat ini terhadap geofence kegiatan ini
        const dist = calculateDistance(latitude, longitude, geofence.latitude, geofence.longitude);
        let isCurrInside = false;
        if (geofence.polygon && Array.isArray(geofence.polygon) && geofence.polygon.length >= 3) {
          const polyPoints = (geofence.polygon as any[]).map((p) => {
            const val0 = Number(p[0]);
            const val1 = Number(p[1]);
            const pLat = Math.abs(val0) > 45 ? val1 : val0;
            const pLng = Math.abs(val0) > 45 ? val0 : val1;
            return { lat: pLat, lng: pLng };
          });
          const inPoly = isPointInPolygonWithBuffer({ lat: latitude, lng: longitude }, polyPoints, bufferMeters);
          isCurrInside = inPoly || (dist <= (geofence.radius + bufferMeters));
        } else {
          isCurrInside = dist <= (geofence.radius + bufferMeters);
        }
        isInsideZone = isCurrInside;

        const isAttFinished = existingAtt && (
          existingAtt.status === "SELESAI" ||
          existingAtt.status === "SELESAI_TELAT" ||
          existingAtt.status === "HADIR_MEMENUHI" ||
          existingAtt.status === "HADIR_TIDAK_MEMENUHI" ||
          existingAtt.status === "HADIR" ||
          Boolean(existingAtt.checkOutAt)
        );

        if (existingAtt && !isAttFinished) {
          const currentLogs = (existingAtt.jedaLogs as any[]) || [];
          let currentAttStatus = existingAtt.status;

          // Auto-Pause saat keluar zona
          if (!isCurrInside && currentAttStatus === "BERLANGSUNG") {
            currentLogs.push({
              alasan: "Keluar Zona Geofence (Otomatis)",
              waktuJeda: new Date().toISOString(),
              durasiSebelumJedaMenit: existingAtt.actualInZoneMinutes || 0,
              autoTriggered: true,
            });
            currentAttStatus = "TERJEDA";
            await prisma.activityAttendance.update({
              where: { id: existingAtt.id },
              data: {
                status: "TERJEDA",
                jedaLogs: currentLogs,
              },
            });
            existingAtt.status = "TERJEDA";
            existingAtt.jedaLogs = currentLogs as any;
            websocketService.broadcastStudentAttendance({
              id: existingAtt.id,
              studentId: existingAtt.studentId,
              scheduleId: existingAtt.scheduleId,
              status: "TERJEDA",
              currentStatus: "DI_LUAR_ZONA",
              attendedAt: existingAtt.attendedAt.toISOString(),
              actualInZoneMinutes: existingAtt.actualInZoneMinutes || 0,
            });
          }
          // Auto-Resume saat kembali masuk zona
          else if (isCurrInside && currentAttStatus === "TERJEDA") {
            currentLogs.push({
              waktuResume: new Date().toISOString(),
              durasiSebelumResumeMenit: existingAtt.actualInZoneMinutes || 0,
              autoTriggered: true,
            });
            currentAttStatus = "BERLANGSUNG";
            await prisma.activityAttendance.update({
              where: { id: existingAtt.id },
              data: {
                status: "BERLANGSUNG",
                jedaLogs: currentLogs,
              },
            });
            existingAtt.status = "BERLANGSUNG";
            existingAtt.jedaLogs = currentLogs as any;
            websocketService.broadcastStudentAttendance({
              id: existingAtt.id,
              studentId: existingAtt.studentId,
              scheduleId: existingAtt.scheduleId,
              status: "BERLANGSUNG",
              currentStatus: "MASIH_DI_LOKASI",
              attendedAt: existingAtt.attendedAt.toISOString(),
              actualInZoneMinutes: existingAtt.actualInZoneMinutes || 0,
            });
          }

          // Hitung durasi aktual hanya jika status BERLANGSUNG dan DI DALAM ZONA
          let durationInZone = existingAtt.actualInZoneMinutes ?? 0;
          if (isCurrInside && currentAttStatus === "BERLANGSUNG") {
            const liveCalculatedMins = calculateLiveInZoneMinutes(existingAtt);

            let durationFromMobile = 0;
            if (accumulatedDurationSeconds !== undefined && !isNaN(Number(accumulatedDurationSeconds))) {
              durationFromMobile = Math.max(0, Math.floor(Number(accumulatedDurationSeconds) / 60));
              if (durationFromMobile > liveCalculatedMins + 2) {
                durationFromMobile = liveCalculatedMins;
              }
            }

            durationInZone = Math.max(
              liveCalculatedMins,
              durationFromMobile,
              existingAtt.actualInZoneMinutes ?? 0
            );

            await prisma.activityAttendance.update({
              where: { id: existingAtt.id },
              data: { actualInZoneMinutes: durationInZone },
            });

            websocketService.broadcastStudentAttendance({
              id: existingAtt.id,
              studentId: existingAtt.studentId,
              scheduleId: existingAtt.scheduleId,
              status: existingAtt.status,
              attendedAt: existingAtt.attendedAt.toISOString(),
              actualInZoneMinutes: durationInZone,
            });
          }

          inZoneMinutes = Math.max(inZoneMinutes, durationInZone);
        }
      }
    }

    let currentScheduleId = activeSchedules.length > 0 ? activeSchedules[0].id : null;
    if (!currentScheduleId) {
      const activeAtt = await prisma.activityAttendance.findFirst({
        where: {
          studentId: userId,
          status: { in: ["BERLANGSUNG", "TERJEDA"] },
        },
      });
      if (activeAtt) {
        currentScheduleId = activeAtt.scheduleId;
      }
    }

    let attendanceStatus = "TIDAK_ADA_KEGIATAN";
    if (currentScheduleId) {
      const activeAtt = await prisma.activityAttendance.findFirst({
        where: {
          studentId: userId,
          scheduleId: currentScheduleId,
        },
        select: { status: true },
      });
      if (activeAtt) {
        attendanceStatus = activeAtt.status;
      }
    }

    return {
      success: true,
      message: "Lokasi berhasil dilacak",
      data: {
        activeScheduleId: currentScheduleId,
        status: isInsideZone ? "LAPANGAN" : "DI_LUAR_ZONA",
        currentStatus: isInsideZone ? "LAPANGAN" : "DI_LUAR_ZONA",
        attendanceStatus,
        inZoneMinutes,
        actualInZoneSeconds: inZoneMinutes * 60,
        actualInZoneMinutes: inZoneMinutes,
        autoAttendanceTriggered,
        poskoArea: null,
      },
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
        category: true,
        user: {
          include: { households: true },
        },
        setoranOtomatis: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    const usersMap = new Map<string, any>();
    
    for (const b of bins) {
      if (!b.user) continue;
      const userId = b.user.id;
      if (!usersMap.has(userId)) {
        usersMap.set(userId, {
          user: b.user,
          bins: [],
          recentLogs: []
        });
      }
      const u = usersMap.get(userId);
      u.bins.push(b);
      if (b.setoranOtomatis) {
        u.recentLogs.push(...b.setoranOtomatis);
      }
    }

    return Array.from(usersMap.values()).map((u: any) => {
      u.recentLogs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      const binOrganik = u.bins.find((b: any) => b.category?.name === "ORGANIC" || b.qrCode?.toLowerCase().includes("org") || b.qrCode?.toLowerCase().includes("1"));
      const binAnorganik = u.bins.find((b: any) => b.category?.name === "NON_ORGANIC" || b.qrCode?.toLowerCase().includes("anorg") || b.qrCode?.toLowerCase().includes("2"));
      const primaryBin = u.bins[0];

      return {
        binId: primaryBin?.qrCode || primaryBin?.id || "",
        binOrganikId: binOrganik?.qrCode || binOrganik?.id || null,
        binAnorganikId: binAnorganik?.qrCode || binAnorganik?.id || null,
        wargaName: u.user.name || "Unknown",
        address: u.user.households?.[0]?.address || "-",
        recentLogs: u.recentLogs.slice(0, 10).map((log: any) => ({
          ...log,
          weightKg: Number(log.berat || 0),
          category: (log.hasilKlasifikasiAi || "").toLowerCase() === "organik" ? "Organik" : "Anorganik"
        }))
      };
    });
  }

  /**
   * Save student's current locations in batch and perform auto-cleanup of logs older than 24h.
   * Auto-attendance is ONLY triggered if cumulative in-zone duration reaches durasiWajibMenit.
   */
  async updateStudentLocationsBatch(
    studentId: string,
    locations: { latitude: number; longitude: number; timestamp?: string; inZoneSeconds?: number }[]
  ) {
    const savedLocations: any[] = [];
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
    
    // Data tambahan untuk sinkronisasi UI real-time
    let activeScheduleId: string | null = null;
    let activeJamMasuk: string | null = null;
    let activeActualInZoneSeconds = 0;
    let activeTargetDurationMinutes = 0;

    // Load geofence buffer from Rule Engine config (replaces hardcoded 15m)
    const ruleConfigs = await configService.getRuleEngineConfigs();
    const bufferMeters = (ruleConfigs as any).attendanceGeofenceBufferMeters ?? 15;
    const autoHadirOutsideZone = (ruleConfigs as any).attendanceAutoHadirOutsideZone !== false;

    const nowForPing3 = new Date();
    const nowWibPing3 = new Date(nowForPing3.getTime() + 7 * 60 * 60 * 1000);
    const todayWibStrPing3 = nowWibPing3.toISOString().slice(0, 10);
    const todayStart = new Date(`${todayWibStrPing3}T00:00:00+07:00`);
    const todayEnd = new Date(`${todayWibStrPing3}T23:59:59.999+07:00`);
    const yesterdayWibStrBatch = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000)
      .toISOString().slice(0, 10);
    const yesterdayStartBatch = new Date(`${yesterdayWibStrBatch}T00:00:00+07:00`);

    const student = await prisma.studentKkn.findUnique({
      where: { userId: studentId },
    });

    const activeSchedules = await prisma.schedule.findMany({
      where: {
        date: { gte: yesterdayStartBatch, lte: todayEnd },
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

        // Hitung batas menit untuk mengetahui apakah jadwal ini sudah SELESAI
        const timeRangeBatch = parseScheduleTimeRange(sch.time);
        const startMinutesTotal = timeRangeBatch.startMinutesTotal;
        const endMinutesTotal = timeRangeBatch.endMinutesTotal;
        const isOvernight = timeRangeBatch.isOvernight;

        const now = new Date();
        const nowWib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const currentHour = nowWib.getUTCHours();
        const currentMinute = nowWib.getUTCMinutes();
        const currentMinutesTotal = currentHour * 60 + currentMinute;
        const todayStr = nowWib.toISOString().slice(0, 10);
        
        let schDateStr = todayStr;
        if (sch.date) {
          const schDateUtc = new Date(sch.date);
          const schDateWib = new Date(schDateUtc.getTime() + 7 * 60 * 60 * 1000);
          schDateStr = schDateWib.toISOString().slice(0, 10);
        }
        
        const isSchedDateToday = schDateStr === todayStr;
        const isFutureDate = schDateStr > todayStr;
        
        let isExpired = false;
        if (isOvernight) {
          if (isSchedDateToday) {
             // Masih hari pertama overnight
          } else if (isFutureDate) {
             // Masih di masa depan
          } else {
             isExpired = currentMinutesTotal > endMinutesTotal;
          }
        } else {
          if (isSchedDateToday) {
             isExpired = currentMinutesTotal > endMinutesTotal;
          } else if (!isFutureDate) {
             isExpired = true;
          }
        }

        // Jika sudah kadaluarsa (melewati jam pulang), abaikan GPS ping ini agar waktu tidak bertambah
        if (isExpired) {
           continue;
        }

        // Skip jika sudah selesai / hadir / sudah checkout
        if (existingAtt && (existingAtt.status === "HADIR" || existingAtt.status === "SELESAI" || existingAtt.status === "SELESAI_TELAT" || existingAtt.status === "HADIR_MEMENUHI" || existingAtt.status === "HADIR_TIDAK_MEMENUHI" || Boolean(existingAtt.checkOutAt))) {
          continue;
        }

        const geofence = await buildGeofence(sch);

        // 1. Cek posisi saat ini menggunakan buffer dinamis
        let isCurrInside = false;
        if (geofence.polygon && Array.isArray(geofence.polygon) && geofence.polygon.length >= 3) {
          const polyPoints = (geofence.polygon as any[]).map((p) => ({
            lat: Number(p[0]),
            lng: Number(p[1]),
          }));
          isCurrInside = isPointInPolygonWithBuffer({ lat: latestLoc!.latitude, lng: latestLoc!.longitude }, polyPoints, bufferMeters);
        } else {
          const dist = calculateDistance(latestLoc!.latitude, latestLoc!.longitude, geofence.latitude, geofence.longitude);
          isCurrInside = dist <= (geofence.radius + bufferMeters);
        }
        isInsideZone = isCurrInside;

        const durasiWajibMenit = await getScheduleTargetDurationMinutes(sch);

        const isAttFinished = existingAtt && (
          existingAtt.status === "SELESAI" ||
          existingAtt.status === "SELESAI_TELAT" ||
          existingAtt.status === "HADIR_MEMENUHI" ||
          existingAtt.status === "HADIR_TIDAK_MEMENUHI" ||
          existingAtt.status === "HADIR" ||
          Boolean(existingAtt.checkOutAt)
        );

        if (existingAtt && !isAttFinished) {
          activeScheduleId = existingAtt.scheduleId;
          activeJamMasuk = existingAtt.attendedAt.toISOString();
          activeTargetDurationMinutes = durasiWajibMenit;

          const currentLogs = (existingAtt.jedaLogs as any[]) || [];
          let currentAttStatus = existingAtt.status;

          // Auto-Pause saat keluar zona
          if (!isCurrInside && currentAttStatus === "BERLANGSUNG") {
            currentLogs.push({
              alasan: "Keluar Zona Geofence (Otomatis)",
              waktuJeda: new Date().toISOString(),
              durasiSebelumJedaMenit: existingAtt.actualInZoneMinutes || 0,
              autoTriggered: true,
            });
            currentAttStatus = "TERJEDA";
            await prisma.activityAttendance.update({
              where: { id: existingAtt.id },
              data: {
                status: "TERJEDA",
                jedaLogs: currentLogs,
              },
            });
            existingAtt.status = "TERJEDA";
            existingAtt.jedaLogs = currentLogs as any;
            websocketService.broadcastStudentAttendance({
              id: existingAtt.id,
              studentId: existingAtt.studentId,
              scheduleId: existingAtt.scheduleId,
              status: "TERJEDA",
              currentStatus: "DI_LUAR_ZONA",
              attendedAt: existingAtt.attendedAt.toISOString(),
              actualInZoneMinutes: existingAtt.actualInZoneMinutes || 0,
            });
          }
          // Auto-Resume saat kembali masuk zona
          else if (isCurrInside && currentAttStatus === "TERJEDA") {
            currentLogs.push({
              waktuResume: new Date().toISOString(),
              durasiSebelumResumeMenit: existingAtt.actualInZoneMinutes || 0,
              autoTriggered: true,
            });
            currentAttStatus = "BERLANGSUNG";
            await prisma.activityAttendance.update({
              where: { id: existingAtt.id },
              data: {
                status: "BERLANGSUNG",
                jedaLogs: currentLogs,
              },
            });
            existingAtt.status = "BERLANGSUNG";
            existingAtt.jedaLogs = currentLogs as any;
            websocketService.broadcastStudentAttendance({
              id: existingAtt.id,
              studentId: existingAtt.studentId,
              scheduleId: existingAtt.scheduleId,
              status: "BERLANGSUNG",
              currentStatus: "MASIH_DI_LOKASI",
              attendedAt: existingAtt.attendedAt.toISOString(),
              actualInZoneMinutes: existingAtt.actualInZoneMinutes || 0,
            });
          }

          let durationInZone = existingAtt.actualInZoneMinutes ?? 0;
          if (isCurrInside && currentAttStatus === "BERLANGSUNG") {
            const liveCalculatedMins = calculateLiveInZoneMinutes(existingAtt);
            durationInZone = Math.max(existingAtt.actualInZoneMinutes ?? 0, liveCalculatedMins);

            await prisma.activityAttendance.update({
              where: { id: existingAtt.id },
              data: { actualInZoneMinutes: durationInZone },
            });

            websocketService.broadcastStudentAttendance({
              id: existingAtt.id,
              studentId: existingAtt.studentId,
              scheduleId: existingAtt.scheduleId,
              status: "BERLANGSUNG",
              attendedAt: existingAtt.attendedAt.toISOString(),
              actualInZoneMinutes: durationInZone,
            });
          }

          activeActualInZoneSeconds = durationInZone * 60;
          inZoneMinutes = Math.max(inZoneMinutes, durationInZone);
        }

        // Catatan: Status tetap BERLANGSUNG sampai mahasiswa menekan tombol "Absen Sekarang" (manual check-in)
        // Lokasi GPS ping hanya memperbarui actualInZoneMinutes tanpa mengubah status ke HADIR secara otomatis
      }
    }

    // Determine attendance status
    const attendanceStatus = activeScheduleId ? "BERLANGSUNG" : "TIDAK_ADA_KEGIATAN";

    return {
      success: true,
      data: {
        locations: savedLocations,
        scheduleId: activeScheduleId || null,
        activeScheduleId: activeScheduleId || null,
        status: isInsideZone ? "LAPANGAN" : "DI_LUAR_ZONA",
        currentStatus: isInsideZone ? "LAPANGAN" : "DI_LUAR_ZONA",
        attendanceStatus: attendanceStatus,
        inZoneMinutes,
        actualInZoneSeconds: activeActualInZoneSeconds,
        actualInZoneMinutes: inZoneMinutes,
        autoAttendanceTriggered,
        jam_masuk: activeJamMasuk,
        targetDurationMinutes: activeTargetDurationMinutes,
        poskoArea: null,
        kelurahan: null,
        message: activeScheduleId ? "Tracking active" : "No active schedule, but tracking continues",
      },
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
    const defaultRadius = configRadiusStr ? parseInt(configRadiusStr, 10) : 200;
    
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
        const isFinished =
          Boolean(attendance.checkOutAt) ||
          attendance.status === "HADIR" ||
          attendance.status === "SELESAI" ||
          attendance.status === "SELESAI_TELAT" ||
          attendance.status === "HADIR_MEMENUHI" ||
          attendance.status === "HADIR_TIDAK_MEMENUHI";
        isAttended = isFinished;
        const actualMins = attendance.actualInZoneMinutes ?? 0;
        const isMemenuhi = actualMins >= targetDurationMinutes;
        attendanceStatus = isFinished
          ? (attendance.status === "HADIR_MEMENUHI" || attendance.status === "HADIR_TIDAK_MEMENUHI"
              ? attendance.status
              : (attendance.status === "SELESAI_TELAT"
                  ? "HADIR_TIDAK_MEMENUHI"
                  : (isMemenuhi ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI")))
          : (attendance.status === "ALPA"
              ? "ALPA"
              : attendance.status === "BERLANGSUNG"
                ? "BERLANGSUNG"
                : "BELUM_ABSEN");
        checkInTime = attendance.attendedAt;
        checkOutTime = attendance.checkOutAt;
        method = attendance.method;
      }
    }

    const isMemenuhiDurasi = isAttended && (attendanceStatus === "HADIR_MEMENUHI");

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
      statusKehadiran: attendanceStatus || "BELUM_ABSEN",
      statusDisplay: attendanceStatus === "HADIR_MEMENUHI"
        ? "Hadir & Memenuhi"
        : attendanceStatus === "HADIR_TIDAK_MEMENUHI"
        ? "Hadir & Tidak Memenuhi"
        : attendanceStatus,
      isMemenuhiDurasi,
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

    // 0. Validate operational hours berdasarkan jam jadwal (bukan hardcoded)
    if (!isAutoAlpa) {
      const nowMs = Date.now();
      const wibHours = ((new Date(nowMs).getUTCHours() + 7) % 24);
      const wibMinutes = new Date(nowMs).getUTCMinutes();
      const currentWibTotal = wibHours * 60 + wibMinutes;

      // Ambil jam jadwal dari DB untuk menentukan window yang valid
      let scheduleStartTotal = 0;       // default: 00:00
      let scheduleEndTotal = 24 * 60;   // default: 24:00 (allow all day)
      try {
        const sched = await prisma.schedule.findUnique({ where: { id: scheduleId }, select: { time: true } });
        if (sched?.time) {
          const range = parseScheduleTimeRange(sched.time);
          scheduleStartTotal = range.startMinutesTotal;
          scheduleEndTotal = range.endMinutesTotal;
        }
      } catch (_) { /* keep defaults */ }

      // Beri toleransi ±60 menit sebelum/sesudah jam jadwal
      const tolerance = 60;
      const windowStart = Math.max(0, scheduleStartTotal - tolerance);
      const windowEnd = Math.min(24 * 60, scheduleEndTotal + tolerance);

      if (currentWibTotal < windowStart || currentWibTotal > windowEnd) {
        const fmtStart = `${String(Math.floor(scheduleStartTotal / 60)).padStart(2, "0")}:${String(scheduleStartTotal % 60).padStart(2, "0")}`;
        const fmtEnd = `${String(Math.floor(scheduleEndTotal / 60)).padStart(2, "0")}:${String(scheduleEndTotal % 60).padStart(2, "0")}`;
        throw new Error(
          `OUT_OF_OPERATIONAL_HOURS: Presensi kegiatan KKN hanya dapat dilakukan pada jam ${fmtStart} - ${fmtEnd} WIB (±60 menit toleransi).`
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
        // If already completed as HADIR, SELESAI, HADIR_MEMENUHI, HADIR_TIDAK_MEMENUHI or checked out, return existing
        if (
          existing.status === "HADIR" ||
          existing.status === "SELESAI" ||
          existing.status === "HADIR_MEMENUHI" ||
          existing.status === "HADIR_TIDAK_MEMENUHI" ||
          Boolean(existing.checkOutAt)
        ) {
          return existing;
        }

        let recordStatus = isAutoAlpa ? "ALPA" : "HADIR_MEMENUHI";
        if (!isAutoAlpa && actLoc) {
          const targetMins = actLoc.targetDurationMinutes || 120;
          const actualMins = existing.actualInZoneMinutes ?? 0;
          if (targetMins > 0 && actualMins < targetMins) {
            recordStatus = "HADIR_TIDAK_MEMENUHI";
          }
        }

        // If was ongoing (BERLANGSUNG/DALAM_RADIUS), mark as HADIR_MEMENUHI / HADIR_TIDAK_MEMENUHI (or ALPA)
        const updated = await tx.activityAttendance.update({
          where: { id: existing.id },
          data: {
            method: isAutoAlpa ? "ALPA_AUTO" : method,
            latitude,
            longitude,
            status: recordStatus,
            checkOutAt: new Date(),
            attendedAt: existing.attendedAt || new Date(),
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

      if (!isAutoAlpa) {
        throw new Error("FORBIDDEN: Anda belum menekan tombol Mulai Kegiatan (Presensi Masuk). Selesaikan check-in terlebih dahulu sebelum melakukan check-out (Presensi Hadir).");
      }

      const record = await tx.activityAttendance.create({
        data: {
          studentId,
          scheduleId,
          method: "ALPA_AUTO",
          latitude,
          longitude,
          status: "ALPA",
          checkOutAt: new Date(),
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
    deskripsiKegiatan?: string;
    fotoUrl?: string;
  }) {
    const { studentId, scheduleId, latitude, longitude, deskripsiKegiatan, fotoUrl } = params;

    const nowForCheckout = new Date();
    const nowWibCheckout = new Date(nowForCheckout.getTime() + 7 * 60 * 60 * 1000);
    const todayWibStrCheckout = nowWibCheckout.toISOString().slice(0, 10);
    const startOfDay = new Date(`${todayWibStrCheckout}T00:00:00+07:00`);

    // Bug #2 fix: query juga handle attendedAt NULL (record dibuat tanpa attendedAt)
    // Pertama coba yang sudah punya attendedAt hari ini
    let attendance = await prisma.activityAttendance.findFirst({
      where: {
        studentId,
        ...(scheduleId ? { scheduleId } : {}),
        attendedAt: { gte: startOfDay },
        checkOutAt: null,
        status: { in: ["BERLANGSUNG", "HADIR"] },
      },
      orderBy: { attendedAt: "desc" },
    });

    // Fallback: cari record BERLANGSUNG yang attendedAt-nya NULL (dibuat dari mulaiKegiatan tanpa set attendedAt)
    if (!attendance) {
      attendance = await prisma.activityAttendance.findFirst({
        where: {
          studentId,
          ...(scheduleId ? { scheduleId } : {}),
          attendedAt: undefined,   // prisma will not filter on this field
          checkOutAt: null,
          status: { in: ["BERLANGSUNG", "HADIR"] },
        },
        orderBy: { id: "desc" },
      });
    }

    if (!attendance) {
      // Final fallback: check if already checked out today
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
    // Bug #8 fix: guard attendedAt null agar tidak kalkulasi dari epoch (1970)
    const attendedTime = attendance.attendedAt ? new Date(attendance.attendedAt) : checkOutTime;
    const rawDurationMinutes = Math.max(0, Math.floor((checkOutTime.getTime() - attendedTime.getTime()) / (1000 * 60)));

    // Calculate actual in-zone duration from GPS logs (not simple time diff)
    const sessionStart = attendance.attendedAt ? new Date(attendance.attendedAt) : new Date(checkOutTime);
    const todayLogsForCheckout = await prisma.studentLocation.findMany({
      where: {
        studentId,
        recordedAt: { gte: sessionStart },
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
        radius: schedule.radius ? Number(schedule.radius) : 200,
        polygon: schedule.polygon,
      };
      actualInZoneMins = calculateInZoneDurationMinutes(todayLogsForCheckout, checkoutGeofence, checkoutBufferMeters, (attendance.jedaLogs as any[]) || []);
    }

    // Determine final status: HADIR_MEMENUHI or HADIR_TIDAK_MEMENUHI
    let isMemenuhi = true;
    let durasiWajibMenit = 0;
    if (schedule) {
      durasiWajibMenit = await getScheduleTargetDurationMinutes(schedule);
      if (durasiWajibMenit > 0 && actualInZoneMins < durasiWajibMenit) {
        isMemenuhi = false;
      }
    }
    checkoutFinalStatus = isMemenuhi ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI";
    const statusDisplay = isMemenuhi ? "Hadir & Memenuhi" : "Hadir & Tidak Memenuhi";

    const durationMinutes = actualInZoneMins;

    const updated = await prisma.activityAttendance.update({
      where: { id: attendance.id },
      data: {
        checkOutAt: checkOutTime,
        status: checkoutFinalStatus,
        actualInZoneMinutes: actualInZoneMins,
        ...(latitude !== undefined && !isNaN(Number(latitude)) ? { latitude: Number(latitude) } : {}),
        ...(longitude !== undefined && !isNaN(Number(longitude)) ? { longitude: Number(longitude) } : {}),
        ...(deskripsiKegiatan ? { deskripsiKegiatan } : {}),
        ...(fotoUrl ? { fotoUrl } : {}),
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
      statusDisplay,
      statusKehadiran: updated.status,
      isMemenuhiDurasi: isMemenuhi,
      student: updated.student,
    });

    // Broadcast attendance update via WebSocket
    websocketService.broadcastStudentAttendance({
      id: updated.id,
      studentId,
      scheduleId: updated.scheduleId,
      status: updated.status,
      statusDisplay,
      statusKehadiran: updated.status,
      isMemenuhiDurasi: isMemenuhi,
      attendedAt: updated.attendedAt,
      completedAt: updated.checkOutAt,
      totalMinutes: durationMinutes,
      actualInZoneMinutes: actualInZoneMins,
      method: updated.method,
      latitude: updated.latitude,
      longitude: updated.longitude,
      student: updated.student,
    });

    return {
      success: true,
      message: `Check-out presensi berhasil dicatat (${statusDisplay}). GPS dinonaktifkan.`,
      data: {
        attendanceId: updated.id,
        scheduleId: updated.scheduleId,
        attendedAt: updated.attendedAt,
        checkOutAt: updated.checkOutAt,
        durationMinutes,
        durationFormatted: `${Math.floor(durationMinutes / 60)} Jam ${durationMinutes % 60} Menit`,
        status: updated.status,
        statusDisplay,
        statusKehadiran: updated.status,
        isMemenuhiDurasi: isMemenuhi,
        durasiWajibMenit,
        actualInZoneMinutes: actualInZoneMins,
        actualInZoneSeconds: actualInZoneMins * 60,
        gpsActive: false,
        statusGps: "INACTIVE",
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
    // Determine calendar date boundaries for this schedule in WIB (+07:00)
    const schedDate = schedule?.date ? new Date(schedule.date) : new Date();
    const schedWib = new Date(schedDate.getTime() + 7 * 60 * 60 * 1000);
    const schedWibStr = schedWib.toISOString().slice(0, 10);
    const startOfDay = new Date(`${schedWibStr}T00:00:00+07:00`);
    const endOfDay = new Date(`${schedWibStr}T23:59:59.999+07:00`);

    // Bug fix: jangan filter studentId di sini — tampilkan SEMUA record absen
    // untuk schedule ini, DAN sertakan juga record yang sedang BERLANGSUNG hari ini
    // agar jika mahasiswa mulaiKegiatan tapi di web sedang dipilih jadwal/kelompok berbeda,
    // data presensi aktifnya tetap muncul secara realtime.
    const list = await prisma.activityAttendance.findMany({
      where: { scheduleId },
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

      const isFinished =
        Boolean(att.checkOutAt) ||
        att.status === "SELESAI" ||
        att.status === "SELESAI_TELAT" ||
        att.status === "HADIR" ||
        att.status === "HADIR_MEMENUHI" ||
        att.status === "HADIR_TIDAK_MEMENUHI";

      let currentStatus = "TERCATAT_ABSEN";
      let status = att.status;
      let statusDisplay = att.status;
      let isMemenuhiDurasi = false;

      const durasiWajib = scheduleLoc?.targetDurationMinutes || 120;
      const actualMins = att.actualInZoneMinutes ?? 0;

      if (att.method === "IZIN_DPL" || String(att.status).toUpperCase().includes("IZIN") || String(att.status).toUpperCase().includes("SAKIT")) {
        currentStatus = "IZIN_DISETUJUI";
        status = String(att.status).toUpperCase().includes("SAKIT") ? "SAKIT" : "IZIN";
        statusDisplay = status === "SAKIT" ? "Sakit (Disetujui)" : "Izin (Disetujui)";
      } else if (att.method === "OVERRIDE_DPL" || String(att.status).toUpperCase().includes("OVERRIDE") || att.status === "OVERRIDDEN_HADIR") {
        currentStatus = "OVERRIDDEN_HADIR";
        status = "HADIR_MEMENUHI";
        statusDisplay = "Hadir (Batal Izin)";
        isMemenuhiDurasi = true;
      } else if (isFinished || att.status === "HADIR" || att.status === "SELESAI" || att.status === "HADIR_MEMENUHI" || att.status === "HADIR_TIDAK_MEMENUHI") {
        currentStatus = "TERCATAT_ABSEN";
        if (att.status === "HADIR_MEMENUHI") {
          status = "HADIR_MEMENUHI";
          statusDisplay = "Hadir & Memenuhi";
          isMemenuhiDurasi = true;
        } else if (att.status === "HADIR_TIDAK_MEMENUHI" || att.status === "SELESAI_TELAT") {
          status = "HADIR_TIDAK_MEMENUHI";
          statusDisplay = "Hadir & Tidak Memenuhi";
          isMemenuhiDurasi = false;
        } else {
          // Legacy HADIR or SELESAI
          const isDurMet = durasiWajib <= 0 || actualMins >= durasiWajib;
          status = isDurMet ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI";
          statusDisplay = isDurMet ? "Hadir & Memenuhi" : "Hadir & Tidak Memenuhi";
          isMemenuhiDurasi = isDurMet;
        }
      } else if (att.status === "BERLANGSUNG") {
        status = "BERLANGSUNG";
        currentStatus = "MASIH_DI_LOKASI";
        statusDisplay = "Sedang di Lapangan";
      } else if (att.status === "TERJEDA") {
        status = "TERJEDA";
        currentStatus = "TERJEDA";
        statusDisplay = "Terjeda";
      } else {
        status = att.status;
        statusDisplay = att.status;
      }

      const isLeave = att.method === "IZIN_DPL" || String(att.status).toUpperCase().includes("IZIN") || String(att.status).toUpperCase().includes("SAKIT");
      return {
        ...att,
        status,
        currentStatus,
        statusDisplay,
        isMemenuhiDurasi,
        actualInZoneMinutes: actualMins,
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

        // Bug #12 fix: ganti upsert tanpa syarat dengan conditional create/update
        // untuk menghindari side-effect write berbahaya pada setiap GET request
        try {
          const existingLeaveAtt = await prisma.activityAttendance.findUnique({
            where: { studentId_scheduleId: { studentId: s.id, scheduleId } },
          });
          if (!existingLeaveAtt) {
            await prisma.activityAttendance.create({
              data: {
                studentId: s.id,
                scheduleId,
                status: attStatus,
                method: "IZIN_DPL",
                latitude: lat,
                longitude: lng,
                attendedAt: schedule?.date || new Date(),
              },
            });
          } else if (
            existingLeaveAtt.status !== attStatus &&
            existingLeaveAtt.status !== "HADIR" &&
            existingLeaveAtt.status !== "SELESAI" &&
            existingLeaveAtt.status !== "SELESAI_TELAT" &&
            existingLeaveAtt.status !== "HADIR_MEMENUHI" &&
            existingLeaveAtt.status !== "HADIR_TIDAK_MEMENUHI"
          ) {
            await prisma.activityAttendance.update({
              where: { id: existingLeaveAtt.id },
              data: { status: attStatus, method: "IZIN_DPL" },
            });
          }
        } catch (_syncErr) {
          // Continue if sync fails
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
          status: "HADIR_MEMENUHI",
          currentStatus: "OVERRIDDEN_HADIR",
          statusDisplay: "Hadir (Batal Izin)",
          isMemenuhiDurasi: true,
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
    startDate?: string;
    endDate?: string;
  }) {
    const { kelompokId, dplUserId, studentId, startDate, endDate } = params;

    let attendanceDateFilter: any = undefined;
    if (startDate || endDate) {
      attendanceDateFilter = {};
      if (startDate) {
        attendanceDateFilter.gte = new Date(`${startDate}T00:00:00+07:00`);
      }
      if (endDate) {
        attendanceDateFilter.lte = new Date(`${endDate}T23:59:59.999+07:00`);
      }
    }

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
              where: attendanceDateFilter ? { attendedAt: attendanceDateFilter } : undefined,
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
        let storedMins = 0;
        if ((att as any).actualInZoneMinutes !== null && (att as any).actualInZoneMinutes !== undefined) {
          storedMins = Math.min(480, Math.max(0, (att as any).actualInZoneMinutes));
        }

        let timeDiffMins = 0;
        if (att.checkOutAt) {
          const diffMs = att.checkOutAt.getTime() - att.attendedAt.getTime();
          timeDiffMins = Math.min(480, Math.max(0, Math.floor(diffMs / (1000 * 60))));
        } else if (att.attendedAt) {
          const isToday = new Date(att.attendedAt).toDateString() === new Date().toDateString();
          if (isToday) {
            const diffMs = Date.now() - new Date(att.attendedAt).getTime();
            timeDiffMins = Math.min(480, Math.max(0, Math.floor(diffMs / (1000 * 60))));
          }
        }

        if (att.status === "BERLANGSUNG" || att.status === "DI_ZONA" || att.status === "DALAM_RADIUS") {
          durationMins = Math.max(storedMins, timeDiffMins);
        } else {
          durationMins = storedMins > 0 ? storedMins : timeDiffMins;
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

    // Hitung batas hari dalam WIB (UTC+7) agar jadwal tanggal hari ini di WIB selalu masuk window
    // targetDate adalah waktu sekarang (UTC). Konversi ke WIB dulu untuk mendapat tanggal WIB yang benar.
    const targetWib = new Date(targetDate.getTime() + 7 * 60 * 60 * 1000);
    const todayWibDateStr = targetWib.toISOString().slice(0, 10); // "YYYY-MM-DD" WIB

    // startOfDay = jam 00:00:00 WIB = jam 17:00:00 UTC hari sebelumnya
    const startOfDay = new Date(`${todayWibDateStr}T00:00:00+07:00`);
    const endOfDay = new Date(`${todayWibDateStr}T23:59:59.999+07:00`);
    const yesterdayWibDateStr = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000)
      .toISOString().slice(0, 10);
    const yesterdayStart = new Date(`${yesterdayWibDateStr}T00:00:00+07:00`);

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
    let schedules = await prisma.schedule.findMany({
      where: {
        date: { gte: yesterdayStart, lte: endOfDay },
        isActive: true,
        ...(student?.kelompokId ? { OR: [{ kelompokId: student.kelompokId }, { kelompokId: null }] } : {}),
      },
      include: {
        kelompok: true,
        attendances: {
          where: { studentId: userId },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (schedules.length === 0) {
      schedules = await prisma.schedule.findMany({
        where: {
          date: { gte: yesterdayStart, lte: endOfDay },
          isActive: true,
        },
        include: {
          kelompok: true,
          attendances: {
            where: { studentId: userId },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    const now = new Date();
    // Gunakan WIB (UTC+7) konsisten untuk semua perbandingan waktu
    const nowWib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const currentHour = nowWib.getUTCHours();
    const currentMinute = nowWib.getUTCMinutes();
    const currentMinutesTotal = currentHour * 60 + currentMinute;
    // todayStr dalam format YYYY-MM-DD WIB
    const todayStr = nowWib.toISOString().slice(0, 10);

    const result = schedules.map((sch) => {
      const timeRange = parseScheduleTimeRange(sch.time);
      const jamMulai = timeRange.jamMulai;
      const jamSelesai = timeRange.jamSelesai;
      const startMinutesTotal = timeRange.startMinutesTotal;
      const endMinutesTotal = timeRange.endMinutesTotal;
      const isOvernight = timeRange.isOvernight;

      // Normalize tanggal jadwal ke WIB untuk perbandingan string YYYY-MM-DD
      // sch.date dari Prisma adalah UTC. Kita harus convert ke WIB sebelum ambil date string.
      let schDateStr = todayStr;
      if (sch.date) {
        const schDateUtc = new Date(sch.date);
        // Tambah offset WIB (+7 jam)
        const schDateWib = new Date(schDateUtc.getTime() + 7 * 60 * 60 * 1000);
        schDateStr = schDateWib.toISOString().slice(0, 10);
      }
      const isSchedDateToday = schDateStr === todayStr;

      // Bandingkan apakah jadwal ada di masa depan (pakai string tanggal WIB)
      const isFutureDate = schDateStr > todayStr;

      // Status waktu kegiatan (dengan toleransi persiapan 60 menit sebelum mulai)
      let scheduleStatus = "AKTIF";
      if (isOvernight) {
        if (isSchedDateToday) {
          scheduleStatus = currentMinutesTotal >= (startMinutesTotal - 60) ? "AKTIF" : "AKAN_DATANG";
        } else if (isFutureDate) {
          scheduleStatus = "AKAN_DATANG";
        } else {
          scheduleStatus = currentMinutesTotal <= (endMinutesTotal + 180) ? "AKTIF" : "SELESAI";
        }
      } else {
        if (isSchedDateToday) {
          if (currentMinutesTotal < (startMinutesTotal - 60)) {
            scheduleStatus = "AKAN_DATANG";
          } else if (currentMinutesTotal > (endMinutesTotal + 180) && (!sch.attendances || sch.attendances.length === 0)) {
            scheduleStatus = "SELESAI";
          } else {
            scheduleStatus = "AKTIF";
          }
        } else if (isFutureDate) {
          // Jadwal masa depan (belum tiba tanggalnya)
          scheduleStatus = "AKAN_DATANG";
        } else {
          // Jadwal kemarin atau lebih lama
          scheduleStatus = "SELESAI";
        }
      }

      // Status Kehadiran mahasiswa
      let statusKehadiran: string | null = null;
      let isMemenuhiDurasi = false;
      if (approvedLeave) {
        statusKehadiran = approvedLeave.type.toUpperCase() === "SAKIT" ? "SAKIT" : "IZIN";
      } else if (sch.attendances && sch.attendances.length > 0) {
        const att = sch.attendances[0];
        const actualMins = att.actualInZoneMinutes ?? 0;
        const isMemenuhi = durasiWajibMenit <= 0 || actualMins >= durasiWajibMenit;
        if (att.status === "ALPA") {
          statusKehadiran = "ALPA";
        } else if (att.status === "HADIR_MEMENUHI") {
          statusKehadiran = "HADIR_MEMENUHI";
          isMemenuhiDurasi = true;
        } else if (att.status === "HADIR_TIDAK_MEMENUHI" || att.status === "SELESAI_TELAT") {
          statusKehadiran = "HADIR_TIDAK_MEMENUHI";
          isMemenuhiDurasi = false;
        } else if (att.checkOutAt || att.status === "HADIR" || att.status === "SELESAI") {
          statusKehadiran = isMemenuhi ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI";
          isMemenuhiDurasi = isMemenuhi;
        } else if (att.status === "BERLANGSUNG") {
          statusKehadiran = "BERLANGSUNG";
        } else if (att.status === "TERJEDA") {
          statusKehadiran = "TERJEDA";
        } else if (att.status === "DALAM_RADIUS" || att.status === "DI_ZONA") {
          statusKehadiran = "DI_ZONA";
        }
      } else if (scheduleStatus === "SELESAI") {
        statusKehadiran = "ALPA";
      }

      const latNum = sch.latitude ? Number(sch.latitude) : -6.8906;
      const lngNum = sch.longitude ? Number(sch.longitude) : 107.615;

      // Hitung actualInZoneSeconds real-time dari record attendance
      let actualInZoneSeconds = 0;
      let actualInZoneMinutes = 0;
      const att = sch.attendances?.[0];
      if (att && (att.status === "BERLANGSUNG" || att.status === "DALAM_RADIUS" || att.status === "DI_ZONA")) {
        actualInZoneMinutes = calculateLiveInZoneMinutes(att);
        actualInZoneSeconds = actualInZoneMinutes * 60;
      } else if (att && (att.status === "TERJEDA" || att.status === "HADIR" || att.status === "SELESAI" || att.status === "SELESAI_TELAT" || att.status === "HADIR_MEMENUHI" || att.status === "HADIR_TIDAK_MEMENUHI")) {
        // Sesi terjeda / selesai — gunakan nilai tersimpan di DB secara pasti tanpa penambahan elapsed time
        actualInZoneMinutes = att.actualInZoneMinutes ?? 0;
        actualInZoneSeconds = actualInZoneMinutes * 60;
      }

      const statusDisplay = statusKehadiran === "HADIR_MEMENUHI"
        ? "Hadir & Memenuhi"
        : statusKehadiran === "HADIR_TIDAK_MEMENUHI"
        ? "Hadir & Tidak Memenuhi"
        : statusKehadiran;

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
          radiusMeter: sch.radius || 200,
          polygon: sch.polygon || null,
        },
        status: scheduleStatus,
        statusKehadiran,
        attendanceStatus: statusKehadiran,
        statusDisplay,
        isMemenuhiDurasi,
        actualInZoneSeconds,
        actualInZoneMinutes,
        attendedAt: att?.attendedAt ? att.attendedAt.toISOString() : null,
        time: `${jamMulai} - ${jamSelesai}`,
        kelompok: {
          id: sch.kelompok?.id || student?.kelompok?.id || "KLP-001",
          nama: sch.kelompok?.name || student?.kelompok?.name || "Kelompok KKN",
        },
        createdAt: sch.createdAt.toISOString(),
      };
    });

    // Bug #4 fix: filter jadwal kemarin yang sudah SELESAI dan tidak ada attendance-nya
    // Jadwal kemarin hanya tampil jika: (1) overnight (masih aktif) ATAU (2) sudah ada statusKehadiran
    const filtered = result.filter((r) => {
      if (r.status === "SELESAI") {
        // Kegiatan sudah lewat — tampilkan hanya jika mahasiswa sudah punya catatan kehadiran
        return r.statusKehadiran !== null;
      }
      return true;
    });

    return filtered;
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

    const now = new Date();
    const nowWibCc = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const todayStr = nowWibCc.toISOString().slice(0, 10);
    const currentHour = nowWibCc.getUTCHours();
    const currentMinute = nowWibCc.getUTCMinutes();
    const currentMinutesTotal = currentHour * 60 + currentMinute;
    
    // Hitung menit mulai dan selesai untuk validasi akses
    const timeRange = parseScheduleTimeRange(schedule.time);
    const startMinutesTotal = timeRange.startMinutesTotal;
    const endMinutesTotal = timeRange.endMinutesTotal;
    const isOvernight = timeRange.isOvernight;

    let schDateStr = todayStr;
    if (schedule.date) {
      const schDateUtc = new Date(schedule.date);
      const schDateWib = new Date(schDateUtc.getTime() + 7 * 60 * 60 * 1000);
      schDateStr = schDateWib.toISOString().slice(0, 10);
    }
    const isSchedDateToday = schDateStr === todayStr;
    const isFutureDate = schDateStr > todayStr;

    let scheduleStatus = "AKTIF";
    if (isOvernight) {
      if (isSchedDateToday) {
        scheduleStatus = currentMinutesTotal >= (startMinutesTotal - 60) ? "AKTIF" : "AKAN_DATANG";
      } else if (isFutureDate) {
        scheduleStatus = "AKAN_DATANG";
      } else {
        scheduleStatus = currentMinutesTotal <= (endMinutesTotal + 180) ? "AKTIF" : "SELESAI";
      }
    } else {
      if (isSchedDateToday) {
        // Toleransi persiapan presensi 60 menit sebelum jam mulai
        if (currentMinutesTotal < (startMinutesTotal - 60)) {
          scheduleStatus = "AKAN_DATANG";
        } else {
          scheduleStatus = "AKTIF";
        }
      } else if (isFutureDate) {
        scheduleStatus = "AKAN_DATANG";
      } else {
        scheduleStatus = "SELESAI";
      }
    }

    if (scheduleStatus === "AKAN_DATANG") {
      throw new Error("FORBIDDEN: Jam mulai kegiatan belum bisa diakses (Mendatang).");
    } else if (scheduleStatus === "SELESAI") {
      throw new Error("FORBIDDEN: Kegiatan ini sudah selesai.");
    }

    // Pengecekan apakah user SUDAH menyelesaikan kegiatan ini (untuk mencegah overwrite status HADIR)
    const existingSession = await prisma.activityAttendance.findUnique({
      where: {
        studentId_scheduleId: {
          studentId: studentUserId,
          scheduleId,
        },
      },
    });

    if (
      existingSession &&
      (existingSession.status === "HADIR" ||
        existingSession.status === "SELESAI" ||
        existingSession.status === "SELESAI_TELAT" ||
        existingSession.status === "HADIR_MEMENUHI" ||
        existingSession.status === "HADIR_TIDAK_MEMENUHI" ||
        Boolean(existingSession.checkOutAt))
    ) {
      throw new Error("FORBIDDEN: Anda sudah menyelesaikan kegiatan ini (Hadir). Anda tidak dapat memulainya kembali.");
    }

    // Concurrency check: Pastikan tidak ada kegiatan lain yang sedang BERLANGSUNG
    const activeOtherSession = await prisma.activityAttendance.findFirst({
      where: {
        studentId: studentUserId,
        scheduleId: { not: scheduleId },
        checkOutAt: null,
        status: "BERLANGSUNG",
      },
      include: { schedule: true },
    });

    if (activeOtherSession) {
      const startOfDay = new Date(`${todayStr}T00:00:00+07:00`);
      if (new Date(activeOtherSession.attendedAt).getTime() < startOfDay.getTime()) {
        // Sesi tertinggal dari hari-hari sebelumnya di-checkout otomatis agar mahasiswa tidak terkunci
        await prisma.activityAttendance.update({
          where: { id: activeOtherSession.id },
          data: {
            checkOutAt: new Date(activeOtherSession.attendedAt.getTime() + 8 * 3600 * 1000),
            status: "SELESAI",
          },
        }).catch(() => {});
      } else {
        throw new Error(
          `CONCURRENCY_CONFLICT: Selesaikan sesi kegiatan '${activeOtherSession.schedule?.title || "sebelumnya"}' terlebih dahulu sebelum memulai kegiatan baru.`
        );
      }
    }

    // Upsert session di activityAttendance
    let attendance;
    if (existingSession && existingSession.status === "BERLANGSUNG") {
      // Jika statusnya sudah BERLANGSUNG (sedang resume dari Jeda),
      // JANGAN reset attendedAt dan actualInZoneMinutes
      attendance = await prisma.activityAttendance.update({
        where: { id: existingSession.id },
        data: {
          latitude,
          longitude,
          method: "GPS_ACTIVITY",
        },
      });
    } else {
      // Mulai kegiatan baru atau update dari status DI_ZONA/DALAM_RADIUS/TERJEDA
      const currentLogs = (existingSession?.jedaLogs as any[]) || [];
      if (existingSession?.status === "TERJEDA") {
        currentLogs.push({
          waktuResume: new Date().toISOString(),
          durasiSebelumResumeMenit: existingSession.actualInZoneMinutes || 0,
        });
      }

      attendance = await prisma.activityAttendance.upsert({
        where: {
          studentId_scheduleId: {
            studentId: studentUserId,
            scheduleId,
          },
        },
        update: {
          attendedAt: existingSession?.attendedAt || new Date(),
          status: "BERLANGSUNG",
          latitude,
          longitude,
          method: "GPS_ACTIVITY",
          checkOutAt: null,
          actualInZoneMinutes: existingSession?.actualInZoneMinutes || 0,
          jedaLogs: currentLogs,
        },
        create: {
          studentId: studentUserId,
          scheduleId,
          attendedAt: new Date(),
          status: "BERLANGSUNG",
          latitude,
          longitude,
          method: "GPS_ACTIVITY",
          jedaLogs: currentLogs,
        },
      });
    }

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
    const startOfDay = new Date(`${todayStr}T00:00:00+07:00`);
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

    return {
      sessionId: `SES-${schedule.id.slice(0, 8)}-${studentUserId.slice(-6)}`,
      scheduleId: schedule.id,
      namaKegiatan: schedule.title,
      jamMulai: timeRange.jamMulai,
      jamSelesai: timeRange.jamSelesai,
      durasiWajibMenit,
      attendedAt: attendance.attendedAt.toISOString(),
      lokasi: {
        alamat: schedule.location || "Lokasi Kegiatan KKN",
        latitude: schedule.latitude ? Number(schedule.latitude) : latitude,
        longitude: schedule.longitude ? Number(schedule.longitude) : longitude,
        radiusMeter: schedule.radius || 200,
        polygon: schedule.polygon || null,
      },
      geofenceBufferMeters: (ruleConfigs as any).attendanceGeofenceBufferMeters ?? 15,
      invalidationHours: (ruleConfigs as any).attendanceGeofenceInvalidationHours ?? 2,
      serverTimestamp: new Date().toISOString(),
      attendanceId: attendance.id,
      attendanceStatus: attendance.status,
      statusKehadiran: attendance.status,
      actualInZoneSeconds: 0,
      actualInZoneMinutes: 0,
      gpsActive: true,
      statusGps: "ACTIVE",
    };
  }

  /**
   * Mengakhiri sesi kegiatan / manual stop
   * Endpoint: POST /api/v1/kkn/kegiatan/:id/selesai
   */
  async selesaiKegiatan(
    studentUserId: string,
    scheduleId: string,
    payload?: {
      sessionId?: string;
      totalDurasiDalamZonaMenit?: number;
      alasan?: string;
      deskripsiKegiatan?: string;
      fotoUrl?: string;
      latitude?: number;
      longitude?: number;
    }
  ) {
    const result = await this.checkOutAttendance({
      studentId: studentUserId,
      scheduleId,
      latitude: payload?.latitude,
      longitude: payload?.longitude,
      deskripsiKegiatan: payload?.deskripsiKegiatan,
      fotoUrl: payload?.fotoUrl,
    });
    return {
      ...result,
      gpsActive: false,
      statusGps: "INACTIVE",
    };
  }

  /**
   * Menjeda sesi kegiatan
   * Endpoint: POST /api/v1/kkn/kegiatan/:id/jeda
   */
  async jedaKegiatan(
    studentUserId: string,
    scheduleId: string,
    payload: { alasan: string; totalDurasiDalamZonaMenit?: number; totalDurasiDalamZonaDetik?: number }
  ) {
    const existing = await prisma.activityAttendance.findUnique({
      where: {
        studentId_scheduleId: {
          studentId: studentUserId,
          scheduleId,
        },
      },
    });

    if (!existing) {
      throw new Error("Kegiatan aktif tidak ditemukan.");
    }

    if (
      existing.status === "SELESAI" ||
      existing.status === "HADIR" ||
      existing.status === "SELESAI_TELAT" ||
      existing.status === "HADIR_MEMENUHI" ||
      existing.status === "HADIR_TIDAK_MEMENUHI" ||
      Boolean(existing.checkOutAt)
    ) {
      throw new Error("Kegiatan sudah diselesaikan.");
    }

    const calculatedMins = payload.totalDurasiDalamZonaDetik
      ? Math.max(existing.actualInZoneMinutes || 0, Math.floor(payload.totalDurasiDalamZonaDetik / 60))
      : Math.max(existing.actualInZoneMinutes || 0, payload.totalDurasiDalamZonaMenit || 0);

    const currentLogs = (existing.jedaLogs as any[]) || [];
    currentLogs.push({
      alasan: payload.alasan,
      waktuJeda: new Date().toISOString(),
      durasiSebelumJedaMenit: calculatedMins,
      durasiSebelumJedaDetik: payload.totalDurasiDalamZonaDetik || (calculatedMins * 60),
    });

    const updated = await prisma.activityAttendance.update({
      where: { id: existing.id },
      data: {
        status: "TERJEDA",
        actualInZoneMinutes: calculatedMins,
        jedaLogs: currentLogs,
      },
    });

    try {
      websocketService.broadcastStudentAttendance({
        id: updated.id,
        studentId: studentUserId,
        scheduleId,
        status: "TERJEDA",
        currentStatus: "DI_LUAR_ZONA",
        actualInZoneMinutes: calculatedMins,
        attendedAt: updated.attendedAt.toISOString(),
      });
    } catch (_) {}

    return updated;
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

  /**
   * Cek semua presensi BERLANGSUNG, jika jadwalnya sudah lewat, checkout otomatis.
   */
  async autoCheckOutEndedSchedules() {
    try {
      const activeAttendances = await prisma.activityAttendance.findMany({
        where: {
          status: { in: ["BERLANGSUNG", "DI_ZONA"] },
          checkOutAt: null,
        },
        include: {
          schedule: true,
          student: true,
        },
      });

      const nowUtc = new Date();
      // WIB Time (+7)
      const nowWib = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000);
      const currentMins = nowWib.getUTCHours() * 60 + nowWib.getUTCMinutes();

      for (const att of activeAttendances) {
        if (!att.schedule || !att.schedule.time) continue;

        const timeRange = parseScheduleTimeRange(att.schedule.time);
        const endMins = timeRange.endMinutesTotal;

        // Jika waktu saat ini sudah lewat / sama dengan batas selesai jadwal
        if (currentMins >= endMins) {
          console.log(`[AutoCheckout] Melakukan checkout otomatis untuk Mahasiswa ${att.student.name} pada jadwal ${att.schedule.title}`);
          
          await this.checkOutAttendance({
            studentId: att.studentId,
            scheduleId: att.scheduleId,
          });

          // Notifikasi Database
          await prisma.notification.create({
            data: {
              userId: att.studentId,
              title: "Kegiatan Selesai ✅",
              message: `Kegiatan ${att.schedule.title} telah usai. Sistem telah mencatat jam kepulangan Anda secara otomatis.`,
            },
          });

          // Notifikasi Push FCM
          if (att.student.fcmToken) {
            await notificationIntegrationService.sendPushNotification(
              att.student.fcmToken,
              "Kegiatan Selesai ✅",
              `Kegiatan ${att.schedule.title} usai. Checkout berhasil otomatis.`
            );
          }
        }
      }
    } catch (e) {
      console.error("[AutoCheckout] Error pada autoCheckOutEndedSchedules:", e);
    }
  }

  /**
   * Ambil riwayat presensi kegiatan mahasiswa (jam masuk, jam pulang, durasi aktual, durasi target).
   * Digunakan oleh mobile untuk menampilkan data historis setelah GPS mati / presensi berhasil.
   * Endpoint: GET /api/v1/kkn/kegiatan/:id/presensi-history
   */
  async getPresensiHistory(studentUserId: string, scheduleId: string) {
    const attendance = await prisma.activityAttendance.findUnique({
      where: {
        studentId_scheduleId: {
          studentId: studentUserId,
          scheduleId,
        },
      },
      include: {
        schedule: {
          select: {
            id: true,
            title: true,
            time: true,
            date: true,
            location: true,
            latitude: true,
            longitude: true,
            radius: true,
          },
        },
      },
    });

    if (!attendance) {
      return null;
    }

    const targetDurationMinutes = attendance.schedule
      ? await getScheduleTargetDurationMinutes(attendance.schedule)
      : 120;

    const actualInZoneMinutes = Number(attendance.actualInZoneMinutes ?? 0);
    const jamMasuk = attendance.attendedAt;
    const jamPulang = attendance.checkOutAt;

    let durasiAktualMenit = actualInZoneMinutes;
    if (durasiAktualMenit === 0 && jamMasuk && jamPulang) {
      durasiAktualMenit = Math.round((jamPulang.getTime() - jamMasuk.getTime()) / 60000);
    }

    const isMemenuhiDurasi = durasiAktualMenit >= targetDurationMinutes;
    let finalStatus = attendance.status;
    let statusDisplay = attendance.status;

    if (attendance.status === "HADIR_MEMENUHI") {
      finalStatus = "HADIR_MEMENUHI";
      statusDisplay = "Hadir & Memenuhi";
    } else if (attendance.status === "HADIR_TIDAK_MEMENUHI" || attendance.status === "SELESAI_TELAT") {
      finalStatus = "HADIR_TIDAK_MEMENUHI";
      statusDisplay = "Hadir & Tidak Memenuhi";
    } else if (attendance.status === "HADIR" || attendance.status === "SELESAI" || Boolean(jamPulang)) {
      finalStatus = isMemenuhiDurasi ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI";
      statusDisplay = isMemenuhiDurasi ? "Hadir & Memenuhi" : "Hadir & Tidak Memenuhi";
    }

    return {
      scheduleId: attendance.scheduleId,
      attendanceId: attendance.id,
      status: finalStatus,
      statusDisplay,
      statusKehadiran: finalStatus,
      isMemenuhiDurasi,
      namaKegiatan: attendance.schedule?.title ?? "-",
      jamMasuk: jamMasuk?.toISOString() ?? null,
      jamPulang: jamPulang?.toISOString() ?? null,
      durasiAktualMenit,
      durasiTargetMenit: targetDurationMinutes,
      durasiAktualDetik: durasiAktualMenit * 60,
      durasiTargetDetik: targetDurationMinutes * 60,
      isHadir: ["HADIR", "SELESAI", "SELESAI_TELAT", "HADIR_MEMENUHI", "HADIR_TIDAK_MEMENUHI"].includes(attendance.status) || Boolean(jamPulang),
      isBerlangsung: attendance.status === "BERLANGSUNG",
      method: attendance.method,
    };
  }

  /**
   * Laporan Rekap Presensi Komprehensif (untuk Web Dashboard Admin & DPL)
   * Menyediakan filter lengkap, paginasi, pencarian, ringkasan capaian jam, foto bukti, dan deskripsi kegiatan.
   */
  async getLaporanPresensi(params: {
    kelompokId?: string;
    dplUserId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    // Filter DPL scope
    let dplStudentUserIds: string[] | undefined;
    if (params.dplUserId) {
      const dplGroups = await prisma.kelompokKkn.findMany({
        where: { OR: [{ dplId: params.dplUserId }, { dpl: { id: params.dplUserId } }] },
        include: { students: { select: { userId: true } } },
      });
      dplStudentUserIds = dplGroups.flatMap((g) => g.students.map((s) => s.userId));
    }

    const where: any = {};

    // 1. Filter Student IDs (by DPL or by Kelompok)
    if (dplStudentUserIds) {
      where.studentId = { in: dplStudentUserIds };
    }

    if (params.kelompokId && params.kelompokId !== "ALL") {
      const kelompokStudents = await prisma.studentKkn.findMany({
        where: { kelompokId: params.kelompokId },
        select: { userId: true },
      });
      const ids = kelompokStudents.map((s) => s.userId);
      if (where.studentId?.in) {
        where.studentId = { in: where.studentId.in.filter((id: string) => ids.includes(id)) };
      } else {
        where.studentId = { in: ids };
      }
    }

    // 2. Filter Tanggal (WIB)
    if (params.startDate || params.endDate) {
      where.attendedAt = {};
      if (params.startDate) {
        where.attendedAt.gte = new Date(`${params.startDate}T00:00:00+07:00`);
      }
      if (params.endDate) {
        where.attendedAt.lte = new Date(`${params.endDate}T23:59:59.999+07:00`);
      }
    }

    // 3. Filter Status
    if (params.status && params.status !== "ALL") {
      if (params.status === "HADIR_MEMENUHI") {
        where.status = { in: ["HADIR_MEMENUHI", "HADIR", "SELESAI"] };
      } else if (params.status === "HADIR_TIDAK_MEMENUHI") {
        where.status = { in: ["HADIR_TIDAK_MEMENUHI", "SELESAI_TELAT"] };
      } else if (params.status === "IZIN_SAKIT") {
        where.OR = [
          { status: { in: ["IZIN", "SAKIT"] } },
          { method: { in: ["IZIN_DPL", "SAKIT_DPL"] } },
        ];
      } else {
        where.status = params.status;
      }
    }

    // 4. Search Filter (Nama / NIM)
    if (params.search && params.search.trim().length > 0) {
      const q = params.search.trim();
      where.student = {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { studentProfile: { nim: { contains: q, mode: "insensitive" } } },
        ],
      };
    }

    const [total, records, allSummaryRecords] = await Promise.all([
      prisma.activityAttendance.count({ where }),
      prisma.activityAttendance.findMany({
        where,
        orderBy: { attendedAt: "desc" },
        skip,
        take: limit,
        include: {
          schedule: {
            select: {
              id: true,
              title: true,
              date: true,
              time: true,
              kelompok: { select: { id: true, name: true, kelurahan: true } },
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              phone: true,
              fotoProfil: true,
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
                      dpl: { select: { id: true, name: true, phone: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      // Query aggregated stats without pagination
      prisma.activityAttendance.findMany({
        where,
        select: {
          status: true,
          actualInZoneMinutes: true,
          attendedAt: true,
          checkOutAt: true,
        },
      }),
    ]);

    // Calculate aggregated summary
    let hadirMemenuhiCount = 0;
    let hadirKurangCount = 0;
    let berlangsungCount = 0;
    let terjedaCount = 0;
    let izinSakitCount = 0;
    let totalMenitKumulatif = 0;

    for (const r of allSummaryRecords) {
      const st = String(r.status || "").toUpperCase();
      const mins = Math.min(480, Math.max(0, r.actualInZoneMinutes ?? 0));
      totalMenitKumulatif += mins;

      if (st === "HADIR_MEMENUHI" || (st === "HADIR" && mins >= 120)) {
        hadirMemenuhiCount++;
      } else if (st === "HADIR_TIDAK_MEMENUHI" || st === "SELESAI_TELAT" || (st === "HADIR" && mins < 120)) {
        hadirKurangCount++;
      } else if (st === "BERLANGSUNG" || st === "DALAM_RADIUS" || st === "DI_ZONA") {
        berlangsungCount++;
      } else if (st === "TERJEDA") {
        terjedaCount++;
      } else if (st.includes("IZIN") || st.includes("SAKIT")) {
        izinSakitCount++;
      }
    }

    const items = records.map((att) => {
      const st = String(att.status || "").toUpperCase();
      let actualMins = Math.min(480, Math.max(0, att.actualInZoneMinutes ?? 0));

      if (st === "BERLANGSUNG" && !att.checkOutAt) {
        actualMins = calculateLiveInZoneMinutes(att);
      } else if (actualMins === 0 && att.attendedAt && att.checkOutAt) {
        const diff = Math.floor((att.checkOutAt.getTime() - att.attendedAt.getTime()) / 60000);
        actualMins = Math.min(480, Math.max(0, diff));
      }

      const isMemenuhi = st === "HADIR_MEMENUHI" || (["HADIR", "SELESAI"].includes(st) && actualMins >= 120);

      let statusDisplay = att.status;
      if (st === "HADIR_MEMENUHI") statusDisplay = "Hadir & Memenuhi";
      else if (st === "HADIR_TIDAK_MEMENUHI" || st === "SELESAI_TELAT") statusDisplay = "Hadir & Tidak Memenuhi";
      else if (st === "BERLANGSUNG") statusDisplay = "Sedang di Lapangan";
      else if (st === "TERJEDA") statusDisplay = "Terjeda";
      else if (st.includes("SAKIT")) statusDisplay = "Sakit (Disetujui)";
      else if (st.includes("IZIN")) statusDisplay = "Izin (Disetujui)";
      else if (st.includes("ALPA") || st.includes("ALPHA")) statusDisplay = "Tanpa Keterangan";

      const hours = Math.floor(actualMins / 60);
      const mins = actualMins % 60;
      const durasiFormatted = hours === 0 ? `${mins} Menit` : mins === 0 ? `${hours} Jam` : `${hours} Jam ${mins} Menit`;

      const kknGroup = att.student.studentProfile?.kelompok || att.schedule?.kelompok;

      return {
        id: att.id,
        studentId: att.studentId,
        namaMahasiswa: att.student.name,
        nim: att.student.studentProfile?.nim ?? "-",
        jurusan: att.student.studentProfile?.jurusan ?? "-",
        fotoProfil: att.student.fotoProfil ?? null,
        isKetua: att.student.studentProfile?.isKetua ?? false,
        kelompok: kknGroup ? {
          id: kknGroup.id,
          name: kknGroup.name,
          kelurahan: kknGroup.kelurahan,
          dplName: (kknGroup as any).dpl?.name ?? "-",
        } : null,
        scheduleId: att.scheduleId,
        namaKegiatan: att.schedule?.title ?? "Kegiatan Harian Lapangan",
        tanggal: att.attendedAt ? new Date(att.attendedAt.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10) : "-",
        jamMasuk: att.attendedAt ? new Date(att.attendedAt.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(11, 16) : "-",
        jamPulang: att.checkOutAt ? new Date(att.checkOutAt.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(11, 16) : "-",
        durasiMenit: actualMins,
        durasiFormatted,
        status: att.status,
        statusDisplay,
        isMemenuhiDurasi: isMemenuhi,
        deskripsiKegiatan: (att as any).deskripsiKegiatan ?? null,
        fotoUrl: (att as any).fotoUrl ?? null,
        latitude: att.latitude ? Number(att.latitude) : null,
        longitude: att.longitude ? Number(att.longitude) : null,
        method: att.method,
      };
    });

    return {
      summary: {
        totalPresensi: total,
        hadirMemenuhi: hadirMemenuhiCount,
        hadirKurang: hadirKurangCount,
        berlangsung: berlangsungCount,
        terjeda: terjedaCount,
        izinSakit: izinSakitCount,
        totalJamKumulatif: Math.round((totalMenitKumulatif / 60) * 10) / 10,
        totalMenitKumulatif,
      },
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const kknAttendanceService = new KknAttendanceService();
