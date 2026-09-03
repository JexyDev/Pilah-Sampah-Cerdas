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
import { isOrganikBin, isAnorganikBin } from "./kknService.js";
import { auditTrailService } from "./auditTrailService.js";
// SMART ZONE: Multi-Posko adaptive geofence engine
import { smartZoneService, type ZoneCheckResult } from "./smartZoneService.js";
import { evaluateSortingStatus } from "../utils/sortingEvaluation.js";

/**
 * Helper: Build unified geofence object with fallback to system defaults.
 * FEATURE 2: Ensures consistent geofence configuration across all location tracking methods.
 */
async function buildGeofence(
  schedule: any
): Promise<{ latitude: number; longitude: number; radius: number; polygon?: any }> {
  // 1. Prioritas Utama: Titik Posko KKN resmi milik kelompok (Primary Posko / Multi-Posko)
  if (schedule.kelompokId) {
    try {
      // a. Cek poskoKkn utama
      const posko = await prisma.poskoKkn.findUnique({
        where: { kelompokId: schedule.kelompokId },
      });
      if (posko && posko.latitude && posko.longitude) {
        const pRadius = Number((posko as any).radius) || Number(schedule.radius) || 500;
        return {
          latitude: Number(posko.latitude),
          longitude: Number(posko.longitude),
          radius: Math.max(50, pRadius),
          polygon: schedule.polygon,
        };
      }

      // b. Cek poskoKknMulti jika posko utama belum dibuat
      const multiPosko = await (prisma as any).poskoKknMulti.findFirst({
        where: { kelompokId: schedule.kelompokId },
        orderBy: [{ isUtama: "desc" }, { createdAt: "asc" }],
      });
      if (multiPosko && multiPosko.latitude && multiPosko.longitude) {
        const mRadius = Number(multiPosko.radius) || Number(schedule.radius) || 500;
        return {
          latitude: Number(multiPosko.latitude),
          longitude: Number(multiPosko.longitude),
          radius: Math.max(50, mRadius),
          polygon: schedule.polygon,
        };
      }

      // c. Cek facility posko_kkn
      const facPosko = await prisma.facility.findFirst({
        where: { kelompokId: schedule.kelompokId, jenis: "posko_kkn" },
        orderBy: { createdAt: "desc" },
      });
      if (facPosko && facPosko.latitude && facPosko.longitude) {
        return {
          latitude: Number(facPosko.latitude),
          longitude: Number(facPosko.longitude),
          radius: Math.max(50, Number(schedule.radius) || 500),
          polygon: schedule.polygon,
        };
      }
    } catch {
      // Ignored
    }
  }

  // 2. Prioritas Kedua: Koordinat langsung pada Jadwal Kegiatan
  if (schedule.latitude && schedule.longitude) {
    return {
      latitude: Number(schedule.latitude),
      longitude: Number(schedule.longitude),
      radius: Math.max(50, Number(schedule.radius) || 500),
      polygon: schedule.polygon,
    };
  }

  // 3. Fallback: Default sistem dari Rule Engine / Config
  const configLatStr = await configService.getConfig("default_activity_latitude");
  const configLngStr = await configService.getConfig("default_activity_longitude");
  const configRadiusStr = await configService.getConfig("default_activity_radius");

  const defaultLat = configLatStr ? parseFloat(configLatStr) : -6.8915; // Bandung / Coblong
  const defaultLng = configLngStr ? parseFloat(configLngStr) : 107.6107;
  const defaultRadius = configRadiusStr ? parseInt(configRadiusStr, 10) : 500;

  return {
    latitude: defaultLat,
    longitude: defaultLng,
    radius: Math.max(50, Number(schedule.radius) || defaultRadius),
    polygon: schedule.polygon,
  };
}

/**
 * Helper: Ambil seluruh posko yang terdaftar pada kelompok (Posko Utama + seluruh Multi-Posko).
 * Digunakan untuk validasi multi-posko yang komprehensif pada presensi KKN.
 */
export async function getGroupPoskoList(kelompokId: string): Promise<
  Array<{
    id: string;
    nama: string;
    alamat: string;
    latitude: number;
    longitude: number;
    radius: number;
    isUtama: boolean;
    type: "POSKO_UTAMA" | "POSKO_MULTI";
    fotoUrl?: string | null;
  }>
> {
  const [primary, multi, facilities] = await Promise.all([
    prisma.poskoKkn.findUnique({
      where: { kelompokId },
    }),
    (prisma as any).poskoKknMulti
      .findMany({
        where: { kelompokId },
        orderBy: [{ isUtama: "desc" }, { createdAt: "asc" }],
      })
      .catch(() => []),
    prisma.facility
      .findMany({
        where: { kelompokId, jenis: "posko_kkn" },
      })
      .catch(() => []),
  ]);

  const list: Array<{
    id: string;
    nama: string;
    alamat: string;
    latitude: number;
    longitude: number;
    radius: number;
    isUtama: boolean;
    type: "POSKO_UTAMA" | "POSKO_MULTI";
    fotoUrl?: string | null;
  }> = [];

  if (primary && primary.latitude && primary.longitude) {
    list.push({
      id: primary.id,
      nama: primary.nama,
      alamat: primary.alamat || "-",
      latitude: Number(primary.latitude),
      longitude: Number(primary.longitude),
      radius: Math.max(50, Number((primary as any).radius) || 500),
      isUtama: true,
      type: "POSKO_UTAMA",
      fotoUrl: primary.fotoUrl || null,
    });
  }

  if (Array.isArray(multi)) {
    for (const m of multi) {
      if (m.latitude && m.longitude) {
        list.push({
          id: m.id,
          nama: m.nama,
          alamat: m.alamat || "-",
          latitude: Number(m.latitude),
          longitude: Number(m.longitude),
          radius: Math.max(50, Number(m.radius) || 500),
          isUtama: m.isUtama || false,
          type: "POSKO_MULTI",
          fotoUrl: m.fotoUrl || null,
        });
      }
    }
  }

  if (Array.isArray(facilities)) {
    for (const f of facilities) {
      if (f.latitude && f.longitude && !list.some((existing) => existing.id === f.id)) {
        list.push({
          id: f.id,
          nama: f.nama,
          alamat: f.alamat || "-",
          latitude: Number(f.latitude),
          longitude: Number(f.longitude),
          radius: Math.max(50, Number((f as any).radius) || 500),
          isUtama: false,
          type: "POSKO_MULTI",
          fotoUrl: f.foto || null,
        });
      }
    }
  }

  return list;
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

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE DURATION HELPERS — LOSS MODE + MANUAL JEDA
//
// Model Kalkulasi:
//   Gross Duration  = checkOutAt/now − attendedAt
//   Jeda Duration   = Σ(waktuResume[i] − waktuJeda[i]) untuk tiap jeda manual
//   Durasi Aktual   = Gross − Jeda
//
// Aturan:
//   - GPS keluar zona TIDAK mempengaruhi durasi
//   - Hanya tombol JEDA (manual mahasiswa) yang menghentikan timer
//   - Hanya tombol LANJUT (manual mahasiswa) yang melanjutkan timer
//   - Tidak ada auto-pause, grace period, atau PENDING_PAUSE
//   - Daily cap: 8 jam = 480 menit = 28800 detik
// ─────────────────────────────────────────────────────────────────────────────

/** Hitung total durasi pause (ms) dari jedaLogs manual */
function calcTotalPauseMs(jedaLogs: any[], sessionEndMs: number): number {
  let totalMs = 0;
  for (const log of jedaLogs) {
    if (!log || typeof log !== "object" || log.mode === "LOSS_MODE_INFO_ONLY") continue;
    if (!log.waktuJeda) continue;
    const pStart = new Date(log.waktuJeda).getTime();
    if (isNaN(pStart)) continue;
    if (log.waktuResume) {
      const pEnd = new Date(log.waktuResume).getTime();
      if (!isNaN(pEnd) && pEnd > pStart) totalMs += pEnd - pStart;
    } else {
      // Jeda masih aktif (belum di-resume): gunakan snapshot durasiSebelumJedaMenit
      // agar durasi jeda tidak terus bertambah (fix: freeze jeda saat paused)
      if (log.durasiSebelumJedaMenit != null) {
        totalMs += (log.durasiSebelumJedaMenit || 0) * 60000;
      } else if (sessionEndMs > pStart) {
        totalMs += sessionEndMs - pStart;
      }
    }
  }
  return totalMs;
}

/**
 * Hitung durasi aktif presensi dalam MENIT.
 * Durasi Aktual = (checkOutAt/now − attendedAt) − total_waktu_jeda_manual
 * Daily cap: 480 menit (8 jam).
 */
export function calculateLiveInZoneMinutes(att: {
  attendedAt: Date | string;
  actualInZoneMinutes?: number | null;
  checkOutAt?: Date | string | null;
  jedaLogs?: any;
  status?: string;
}): number {
  if (!att?.attendedAt) return 0;

  const statusUpper = String(att.status ?? "").toUpperCase();
  const nonActiveStatuses = [
    "SAKIT",
    "IZIN",
    "ALPA",
    "ALPHA",
    "TIDAK_ADA_KEGIATAN",
    "SKIP_KEGIATAN",
  ];
  if (nonActiveStatuses.some((s) => statusUpper.includes(s))) return 0;

  const MAX_CAP = 480; // menit
  const attendedDate = new Date(att.attendedAt);
  const now = new Date();

  // Sesi dari hari sebelumnya (WIB +7) → gunakan nilai tersimpan
  const toWibDay = (d: Date) => new Date(d.getTime() + 7 * 3600000).toISOString().slice(0, 10);
  if (toWibDay(attendedDate) < toWibDay(now)) {
    return Math.min(Math.max(0, att.actualInZoneMinutes ?? 0), MAX_CAP);
  }

  // Batas Cutoff Jam 18:00:00 WIB pada tanggal kegiatan (18:00 WIB = 11:00 UTC)
  const attendedWib = new Date(attendedDate.getTime() + 7 * 3600000);
  const cutoff18Wib = new Date(
    Date.UTC(
      attendedWib.getUTCFullYear(),
      attendedWib.getUTCMonth(),
      attendedWib.getUTCDate(),
      11,
      0,
      0,
      0
    )
  );

  const rawEndMs = att.checkOutAt ? new Date(att.checkOutAt).getTime() : now.getTime();
  const sessionEndMs = Math.min(rawEndMs, cutoff18Wib.getTime());
  const grossMs = Math.max(0, sessionEndMs - attendedDate.getTime());
  const pauseMs = calcTotalPauseMs((att.jedaLogs as any[]) || [], sessionEndMs);
  const netMins = Math.max(0, Math.floor((grossMs - pauseMs) / 60000));

  return Math.min(netMins, MAX_CAP);
}

/**
 * Hitung durasi aktif presensi dalam DETIK (presisi per-detik untuk timer mobile).
 * Daily cap: 28800 detik (8 jam) dan batas cutoff jam 18:00 WIB.
 */
export function calculateLiveInZoneSeconds(att: {
  attendedAt: Date | string;
  actualInZoneMinutes?: number | null;
  checkOutAt?: Date | string | null;
  jedaLogs?: any;
  status?: string;
}): number {
  if (!att?.attendedAt) return 0;

  const statusUpper = String(att.status ?? "").toUpperCase();
  const nonActiveStatuses = [
    "SAKIT",
    "IZIN",
    "ALPA",
    "ALPHA",
    "TIDAK_ADA_KEGIATAN",
    "SKIP_KEGIATAN",
  ];
  if (nonActiveStatuses.some((s) => statusUpper.includes(s))) return 0;

  const MAX_CAP = 28800; // detik (8 jam)
  const attendedDate = new Date(att.attendedAt);
  const now = new Date();

  // Sesi dari hari sebelumnya (WIB +7) → gunakan nilai tersimpan
  const toWibDay = (d: Date) => new Date(d.getTime() + 7 * 3600000).toISOString().slice(0, 10);
  if (toWibDay(attendedDate) < toWibDay(now)) {
    return Math.min(Math.max(0, (att.actualInZoneMinutes ?? 0) * 60), MAX_CAP);
  }

  // Batas Cutoff Jam 18:00:00 WIB pada tanggal kegiatan (18:00 WIB = 11:00 UTC)
  const attendedWib = new Date(attendedDate.getTime() + 7 * 3600000);
  const cutoff18Wib = new Date(
    Date.UTC(
      attendedWib.getUTCFullYear(),
      attendedWib.getUTCMonth(),
      attendedWib.getUTCDate(),
      11,
      0,
      0,
      0
    )
  );

  const rawEndMs = att.checkOutAt ? new Date(att.checkOutAt).getTime() : now.getTime();
  const sessionEndMs = Math.min(rawEndMs, cutoff18Wib.getTime());
  const grossMs = Math.max(0, sessionEndMs - attendedDate.getTime());
  const pauseMs = calcTotalPauseMs((att.jedaLogs as any[]) || [], sessionEndMs);
  const netSecs = Math.max(0, Math.floor((grossMs - pauseMs) / 1000));

  return Math.min(netSecs, MAX_CAP);
}

/**
 * Hitung total durasi jeda manual dalam MENIT (untuk transparansi UI).
 * Gross = Aktif + Jeda.
 */
export function calculateTotalJedaMinutes(att: {
  attendedAt?: Date | string | null;
  checkOutAt?: Date | string | null;
  jedaLogs?: any;
  status?: string;
  actualInZoneMinutes?: number | null;
}): number {
  if (!att?.attendedAt) return 0;
  const statusUpper = String(att.status ?? "").toUpperCase();
  const nonActiveStatuses = [
    "SAKIT",
    "IZIN",
    "ALPA",
    "ALPHA",
    "TIDAK_ADA_KEGIATAN",
    "SKIP_KEGIATAN",
  ];
  if (nonActiveStatuses.some((s) => statusUpper.includes(s))) return 0;

  const sessionEndMs = att.checkOutAt ? new Date(att.checkOutAt).getTime() : Date.now();
  const pauseMs = calcTotalPauseMs((att.jedaLogs as any[]) || [], sessionEndMs);
  return Math.max(0, Math.floor(pauseMs / 60000));
}

/**
 * Helper: Format menit ke representasi teks yang ramah (contoh: "45 Menit", "1 Jam 15 Menit")
 */
export function formatDurasiMenitIndo(minutes: number): string {
  if (isNaN(minutes) || minutes <= 0) return "0 Menit";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} Menit`;
  if (mins === 0) return `${hours} Jam`;
  return `${hours} Jam ${mins} Menit`;
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
      return inPoly || dist <= geofence.radius + bufferMeters;
    } else {
      return dist <= geofence.radius + bufferMeters;
    }
  });

  if (inZonePoints.length < 1) return 0;

  // Sort ascending by time
  const sorted = [...inZonePoints].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

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
export function parseScheduleTimeString(
  timeStr: string,
  defaultH: number = 8,
  defaultM: number = 0
): [number, number] {
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
  let jamSelesai = "19:00";
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
  const [endH, endM] = parseScheduleTimeString(jamSelesai, 19, 0);
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
export async function getScheduleTargetDurationMinutes(schedule: {
  time?: string | null;
}): Promise<number> {
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
  return 240;
}

export class KknAttendanceService {
  /**
   * GPS Location Ping — LOSS MODE
   *
   * Simpan lokasi mahasiswa ke studentLocation untuk monitoring DPL.
   * Tidak ada geofence check, tidak ada auto-pause, tidak ada auto-resume.
   * Jika ada sesi BERLANGSUNG, update durasi wall-clock.
   * Jika sesi TERJEDA (manual), durasi TIDAK bertambah.
   *
   * Endpoint: POST /api/v1/kkn/location-ping
   */
  async pingLocation(
    userId: string,
    latitude: number,
    longitude: number,
    _accumulatedDurationSeconds?: number
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new Error("USER_NOT_FOUND");

    const student = await prisma.studentKkn.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new Error("STUDENT_PROFILE_INCOMPLETE");
    }

    // Geo-validation dasar (koordinat valid, bukan teleportasi ekstrem)
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

    // 1. Simpan lokasi ke studentLocation (untuk peta DPL)
    const newLocation = await prisma.studentLocation.create({
      data: { studentId: userId, latitude, longitude },
    });

    // Broadcast realtime GPS via WebSocket ke dashboard DPL
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

    // Cleanup lokasi > 24 jam (non-blocking)
    prisma.studentLocation
      .deleteMany({
        where: {
          studentId: userId,
          recordedAt: { lt: new Date(Date.now() - 86400000) },
        },
      })
      .catch(() => {});

    // 2. Update durasi wall-clock jika ada sesi BERLANGSUNG
    //    Sesi TERJEDA (manual jeda) → durasi TIDAK bertambah
    const activeAtt = await prisma.activityAttendance.findFirst({
      where: {
        studentId: userId,
        checkOutAt: null,
        status: "BERLANGSUNG",
      },
      orderBy: { attendedAt: "desc" },
    });

    let currentScheduleId: string | null = null;
    let attendanceStatus = "TIDAK_ADA_KEGIATAN";
    let inZoneMinutes = 0;
    let activeAttendanceForSeconds: any = null;

    if (activeAtt) {
      currentScheduleId = activeAtt.scheduleId;
      // Update durasi wall-clock
      const liveMins = calculateLiveInZoneMinutes(activeAtt);
      await prisma.activityAttendance.update({
        where: { id: activeAtt.id },
        data: { actualInZoneMinutes: liveMins },
      });

      websocketService.broadcastStudentAttendance({
        id: activeAtt.id,
        studentId: userId,
        scheduleId: activeAtt.scheduleId,
        status: "BERLANGSUNG",
        attendedAt: activeAtt.attendedAt.toISOString(),
        actualInZoneMinutes: liveMins,
      });

      activeAtt.actualInZoneMinutes = liveMins;
      activeAttendanceForSeconds = activeAtt;
      inZoneMinutes = liveMins;
      attendanceStatus = "BERLANGSUNG";
    } else {
      // Cari sesi TERJEDA untuk info status
      const jedaAtt = await prisma.activityAttendance.findFirst({
        where: {
          studentId: userId,
          checkOutAt: null,
          status: "TERJEDA",
        },
        orderBy: { attendedAt: "desc" },
      });
      if (jedaAtt) {
        currentScheduleId = jedaAtt.scheduleId;
        attendanceStatus = "TERJEDA";
        inZoneMinutes = jedaAtt.actualInZoneMinutes ?? 0;
        activeAttendanceForSeconds = jedaAtt;
      } else {
        // Cari schedule aktif hari ini untuk info UI
        const nowWib = new Date(Date.now() + 7 * 3600000);
        const todayStr = nowWib.toISOString().slice(0, 10);
        const todayStart = new Date(`${todayStr}T00:00:00+07:00`);
        const todayEnd = new Date(`${todayStr}T23:59:59.999+07:00`);
        const todaySch = await prisma.schedule.findFirst({
          where: {
            date: { gte: todayStart, lte: todayEnd },
            isActive: true,
            ...(student.kelompokId
              ? { OR: [{ kelompokId: student.kelompokId }, { kelompokId: null }] }
              : {}),
          },
        });

        if (todaySch) {
          currentScheduleId = todaySch.id;
          attendanceStatus = "BELUM_MULAI";
        }
      }
    }

    // 3. Cek apakah mahasiswa berada di dalam zona/posko kelompok untuk validasi tombol mobile
    let isInsideRadius = false;
    let distanceToTarget = 0;
    let matchedPoskoName: string | null = null;

    if (student.kelompokId) {
      try {
        const groupPoskos = await getGroupPoskoList(student.kelompokId);
        let minDistance = 999999;
        for (const gp of groupPoskos) {
          const d = calculateDistance(latitude, longitude, gp.latitude, gp.longitude);
          if (d < minDistance) {
            minDistance = d;
            matchedPoskoName = gp.nama;
          }
          if (d <= gp.radius + 25) {
            isInsideRadius = true;
          }
        }
        distanceToTarget = Math.round(minDistance);
        if (!isInsideRadius) {
          const szCheck = await smartZoneService.isStudentInGroupZone(
            latitude,
            longitude,
            student.kelompokId,
            25
          );
          if (szCheck.isInside) {
            isInsideRadius = true;
            matchedPoskoName = szCheck.matchedPosko || matchedPoskoName;
          }
        }
      } catch {
        // Ignored
      }
    }

    return {
      success: true,
      message: "Lokasi berhasil dilacak",
      data: {
        activeScheduleId: currentScheduleId,
        status: "OK",
        currentStatus: attendanceStatus,
        attendanceStatus,
        isInsideRadius,
        isInside: isInsideRadius,
        inside: isInsideRadius,
        distanceToTarget,
        distance: distanceToTarget,
        matchedPosko: matchedPoskoName,
        inZoneMinutes,
        actualInZoneSeconds: activeAttendanceForSeconds
          ? calculateLiveInZoneSeconds(activeAttendanceForSeconds)
          : inZoneMinutes * 60,
        actualInZoneMinutes: inZoneMinutes,
        autoAttendanceTriggered: false,
        poskoArea: matchedPoskoName,
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
          recentLogs: [],
        });
      }
      const u = usersMap.get(userId);
      u.bins.push(b);
      if (b.setoranOtomatis) {
        u.recentLogs.push(...b.setoranOtomatis);
      }
    }

    return Array.from(usersMap.values()).map((u: any) => {
      u.recentLogs.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const binOrganik = u.bins.find((b: any) => isOrganikBin(b));
      const binAnorganik = u.bins.find((b: any) => isAnorganikBin(b));
      const primaryBin = u.bins[0];
      const household = u.user.households?.[0];

      return {
        wargaId: u.user.id,
        id: u.user.id,
        binId: primaryBin?.qrCode || primaryBin?.id || "",
        binOrganikId: binOrganik?.qrCode || binOrganik?.id || null,
        binAnorganikId: binAnorganik?.qrCode || binAnorganik?.id || null,
        wargaName: u.user.name || "Unknown",
        address: household?.address || "-",
        kelurahan: household?.kelurahan || "",
        rw: household?.rw || "",
        rt: household?.rt || "",
        totalPoints: u.user.totalPoints || 0,
        totalKg:
          Math.round(
            u.recentLogs.reduce((sum: number, l: any) => sum + Number(l.berat || 0), 0) * 100
          ) / 100,
        recentLogs: u.recentLogs.slice(0, 10).map((log: any) => {
          const sortingStatus = evaluateSortingStatus(
            log.confidenceAi,
            log.discrepancy_status || log.discrepancyStatus,
            log.hasilKlasifikasiAi,
            primaryBin?.category
          );
          return {
            ...log,
            weightKg: Number(log.berat || 0),
            category:
              (log.hasilKlasifikasiAi || "").toLowerCase() === "organik" ? "Organik" : "Anorganik",
            ai_confidence: sortingStatus.ai_confidence,
            aiConfidence: sortingStatus.aiConfidence,
            discrepancy_status: sortingStatus.discrepancy_status,
            discrepancyStatus: sortingStatus.discrepancyStatus,
            is_correct: sortingStatus.is_correct,
            isCorrect: sortingStatus.isCorrect,
          };
        }),
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
    await prisma.studentLocation
      .deleteMany({
        where: {
          studentId,
          recordedAt: {
            lt: cutoff,
          },
        },
      })
      .catch(() => {});

    // 3. Evaluasi Kondisi B (Otomatis): Hitung akumulasi durasi in-zone dari tabel studentLocation
    const autoAttendanceTriggered: string[] = [];
    let inZoneMinutes = 0;
    let isInsideZone = false;

    // SMART ZONE: Tambahan data multi-zona untuk response mobile
    let smartZoneResult: ZoneCheckResult | null = null;

    // Data tambahan untuk sinkronisasi UI real-time
    let activeScheduleId: string | null = null;
    let activeJamMasuk: string | null = null;
    let activeActualInZoneSeconds = 0;
    let activeTargetDurationMinutes = 0;

    // Load geofence buffer from Rule Engine config (replaces hardcoded 15m)
    const ruleConfigs = await configService.getRuleEngineConfigs();
    const bufferMeters = (ruleConfigs as any).attendanceGeofenceBufferMeters ?? 15;

    const nowForPing3 = new Date();
    const nowWibPing3 = new Date(nowForPing3.getTime() + 7 * 60 * 60 * 1000);
    const todayWibStrPing3 = nowWibPing3.toISOString().slice(0, 10);
    const todayStart = new Date(`${todayWibStrPing3}T00:00:00+07:00`);
    const todayEnd = new Date(`${todayWibStrPing3}T23:59:59.999+07:00`);
    const yesterdayWibStrBatch = new Date(
      todayStart.getTime() - 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000
    )
      .toISOString()
      .slice(0, 10);
    const yesterdayStartBatch = new Date(`${yesterdayWibStrBatch}T00:00:00+07:00`);

    const student = await prisma.studentKkn.findUnique({
      where: { userId: studentId },
    });

    // SMART ZONE: Trigger auto-polygon update for this group (async, non-blocking)
    if (student?.kelompokId && latestLoc) {
      smartZoneService.updateGroupAutoPolygon(student.kelompokId).catch(() => {});
      // Pre-check smart zone for response enrichment
      smartZoneService
        .isStudentInGroupZone(latestLoc.latitude, latestLoc.longitude, student.kelompokId)
        .then((result) => {
          smartZoneResult = result;
        })
        .catch(() => {});
    }

    const activeSchedules = await prisma.schedule.findMany({
      where: {
        date: { gte: yesterdayStartBatch, lte: todayEnd },
        isActive: true,
        ...(student?.kelompokId
          ? { OR: [{ kelompokId: student.kelompokId }, { kelompokId: null }] }
          : {}),
      },
    });

    if (activeSchedules.length > 0 && latestLoc) {
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
            isExpired = currentMinutesTotal > endMinutesTotal + 180;
          }
        } else {
          if (isSchedDateToday) {
            const graceMinutes =
              existingAtt &&
              (existingAtt.status === "BERLANGSUNG" || existingAtt.status === "TERJEDA")
                ? 180
                : 60;
            isExpired = currentMinutesTotal > endMinutesTotal + graceMinutes;
          } else if (!isFutureDate) {
            isExpired = true;
          }
        }

        // Jika sudah kadaluarsa (melewati jam pulang), abaikan GPS ping ini agar waktu tidak bertambah
        if (isExpired) {
          continue;
        }

        // Skip jika sudah selesai / hadir / sudah checkout
        if (
          existingAtt &&
          (existingAtt.status === "HADIR" ||
            existingAtt.status === "SELESAI" ||
            existingAtt.status === "SELESAI_TELAT" ||
            existingAtt.status === "HADIR_MEMENUHI" ||
            existingAtt.status === "HADIR_TIDAK_MEMENUHI" ||
            Boolean(existingAtt.checkOutAt))
        ) {
          continue;
        }

        const geofence = await buildGeofence(sch);

        // 1. Cek posisi saat ini: schedule geofence ATAU smart zone multi-posko (OR logic)
        let isCurrInside = false;
        // a. Schedule polygon / radius check (original logic)
        if (geofence.polygon && Array.isArray(geofence.polygon) && geofence.polygon.length >= 3) {
          const polyPoints = (geofence.polygon as any[]).map((p) => ({
            lat: Number(p[0]),
            lng: Number(p[1]),
          }));
          isCurrInside = isPointInPolygonWithBuffer(
            { lat: latestLoc!.latitude, lng: latestLoc!.longitude },
            polyPoints,
            bufferMeters
          );
        } else {
          const dist = calculateDistance(
            latestLoc!.latitude,
            latestLoc!.longitude,
            geofence.latitude,
            geofence.longitude
          );
          isCurrInside = dist <= geofence.radius + bufferMeters;
        }

        // b. SMART ZONE fallback: Jika belum masuk dari schedule geofence, cek multi-posko kelompok
        if (!isCurrInside && student?.kelompokId) {
          try {
            const szResult = await smartZoneService.isStudentInGroupZone(
              latestLoc!.latitude,
              latestLoc!.longitude,
              student.kelompokId,
              bufferMeters
            );
            if (szResult.isInside) {
              isCurrInside = true;
              smartZoneResult = szResult;
            }
          } catch {
            // Non-critical: fallback ke schedule geofence saja
          }
        }
        isInsideZone = isCurrInside;

        const durasiWajibMenit = await getScheduleTargetDurationMinutes(sch);

        const isAttFinished =
          existingAtt &&
          (existingAtt.status === "SELESAI" ||
            existingAtt.status === "SELESAI_TELAT" ||
            existingAtt.status === "HADIR_MEMENUHI" ||
            existingAtt.status === "HADIR_TIDAK_MEMENUHI" ||
            existingAtt.status === "HADIR" ||
            Boolean(existingAtt.checkOutAt));

        if (existingAtt && !isAttFinished) {
          activeScheduleId = existingAtt.scheduleId;
          activeJamMasuk = existingAtt.attendedAt.toISOString();
          activeTargetDurationMinutes = durasiWajibMenit;

          const currentLogs = (existingAtt.jedaLogs as any[]) || [];
          let currentAttStatus = existingAtt.status;

          // [SSOT Backend]: Durasi mutlak hanya berasal dari kalkulasi internal backend, abaikan payload mobile
          let durationInZone = existingAtt.actualInZoneMinutes ?? 0;
          if (currentAttStatus === "BERLANGSUNG") {
            const liveCalculatedMins = calculateLiveInZoneMinutes(existingAtt);
            durationInZone = liveCalculatedMins;

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

          activeActualInZoneSeconds = calculateLiveInZoneSeconds(existingAtt);
          inZoneMinutes = Math.max(inZoneMinutes, durationInZone);
        }

        // Catatan: Status tetap BERLANGSUNG sampai mahasiswa menekan tombol "Absen Sekarang" (manual check-in)
        // Lokasi GPS ping hanya memperbarui actualInZoneMinutes tanpa mengubah status ke HADIR secara otomatis
      }
    }

    // Determine attendance status
    let attendanceStatus = "TIDAK_ADA_KEGIATAN";
    if (activeScheduleId) {
      const scheduleAtt = await prisma.activityAttendance.findFirst({
        where: {
          studentId,
          scheduleId: activeScheduleId,
        },
        select: { status: true },
      });
      if (scheduleAtt) {
        attendanceStatus = scheduleAtt.status;
      } else {
        attendanceStatus = "BERLANGSUNG";
      }
    }

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
        message: activeScheduleId
          ? "Tracking active"
          : "No active schedule, but tracking continues",
        // === SMART ZONE: Data multi-posko untuk UI mobile ===
        smartZone: {
          isInsideAnyZone: isInsideZone,
          matchedPosko: smartZoneResult?.matchedPosko ?? null,
          matchedPoskoId: smartZoneResult?.matchedPoskoId ?? null,
          matchedMethod: smartZoneResult?.matchedMethod ?? (isInsideZone ? "POSKO_UTAMA" : "NONE"),
          distanceToNearestPosko: smartZoneResult?.distanceToNearest ?? null,
          nearestPoskoName: smartZoneResult?.nearestPoskoName ?? null,
          autoPolygonActive: smartZoneResult?.autoPolygonActive ?? false,
          allPoskos: smartZoneResult?.allPoskos ?? [],
        },
      },
    };
  }

  /**
   * Get location details for an activity, with default fallback if not configured.
   */
  async getActivityLocation(scheduleId: string, studentId?: string) {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        kelompok: {
          include: { poskoKkn: true },
        },
      },
    });

    if (!schedule) {
      throw new Error("SCHEDULE_NOT_FOUND");
    }

    const officialPosko = (schedule as any).kelompok?.poskoKkn;

    // Default configuration from system configs or fallback
    const configLatStr = await configService.getConfig("default_activity_latitude");
    const configLngStr = await configService.getConfig("default_activity_longitude");
    const configRadiusStr = await configService.getConfig("default_activity_radius");

    const defaultLat = configLatStr ? parseFloat(configLatStr) : -6.8915; // Bandung / Coblong
    const defaultLng = configLngStr ? parseFloat(configLngStr) : 107.6107;
    const defaultRadius = configRadiusStr ? parseInt(configRadiusStr, 10) : 500;

    const effectiveLat = officialPosko?.latitude
      ? Number(officialPosko.latitude)
      : schedule.latitude
        ? Number(schedule.latitude)
        : defaultLat;
    const effectiveLng = officialPosko?.longitude
      ? Number(officialPosko.longitude)
      : schedule.longitude
        ? Number(schedule.longitude)
        : defaultLng;

    const ruleConfigs = await configService.getRuleEngineConfigs();
    const ruleTargetMinutes =
      ruleConfigs.attendanceMinDurationHours * 60 +
      ruleConfigs.attendanceMinDurationMinutes +
      ruleConfigs.attendanceMinDurationSeconds / 60;
    const targetDurationMinutes = ruleTargetMinutes > 0 ? ruleTargetMinutes : 240;

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
        if (isFinished) {
          if (attendance.status === "SELESAI_TELAT") {
            attendanceStatus = "HADIR_TIDAK_MEMENUHI";
          } else {
            attendanceStatus = isMemenuhi ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI";
          }
        } else if (attendance.status === "ALPA") {
          attendanceStatus = "ALPA";
        } else if (attendance.status === "BERLANGSUNG") {
          attendanceStatus = "BERLANGSUNG";
        } else {
          attendanceStatus = "BELUM_ABSEN";
        }
        checkInTime = attendance.attendedAt;
        checkOutTime = attendance.checkOutAt;
        method = attendance.method;
      }
    }

    const isMemenuhiDurasi = isAttended && attendanceStatus === "HADIR_MEMENUHI";

    const groupPoskos = schedule.kelompokId ? await getGroupPoskoList(schedule.kelompokId) : [];

    return {
      scheduleId: schedule.id,
      title: officialPosko?.nama ? `Kegiatan Harian ${officialPosko.nama}` : schedule.title,
      latitude: effectiveLat,
      longitude: effectiveLng,
      radius: schedule.radius ? Number(schedule.radius) : defaultRadius,
      targetDurationMinutes,
      durationMinutes: targetDurationMinutes,
      polygon: schedule.polygon,
      poskoList: groupPoskos,
      totalPosko: groupPoskos.length,
      isConfigured: schedule.latitude !== null && schedule.longitude !== null,
      isAttended,
      attendanceStatus: attendanceStatus || "BELUM_ABSEN",
      status: attendanceStatus || "BELUM_ABSEN",
      statusKehadiran: attendanceStatus || "BELUM_ABSEN",
      statusDisplay:
        attendanceStatus === "HADIR_MEMENUHI"
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
    deskripsiKegiatan?: string;
    fotoUrl?: string;
  }) {
    const {
      studentId,
      scheduleId,
      latitude,
      longitude,
      method,
      nim: inputNim,
      namaMahasiswa: inputNama,
      kodeZona: inputKodeZona,
      deskripsiKegiatan,
      fotoUrl,
    } = params;
    const isAutoAlpa = method?.toUpperCase() === "ALPA_AUTO" || method?.toUpperCase() === "ALPA";

    // 0. Validate operational hours berdasarkan jam jadwal (bukan hardcoded)
    if (!isAutoAlpa) {
      const nowMs = Date.now();
      const wibHours = (new Date(nowMs).getUTCHours() + 7) % 24;
      const wibMinutes = new Date(nowMs).getUTCMinutes();
      const currentWibTotal = wibHours * 60 + wibMinutes;

      // Ambil jam jadwal dari DB untuk menentukan window yang valid
      let scheduleStartTotal = 0; // default: 00:00
      let scheduleEndTotal = 24 * 60; // default: 24:00 (allow all day)
      let sched: any = null;
      try {
        sched = await prisma.schedule.findUnique({
          where: { id: scheduleId },
          select: { time: true },
        });
        if (sched?.time) {
          const range = parseScheduleTimeRange(sched.time);
          scheduleStartTotal = range.startMinutesTotal;
          scheduleEndTotal = range.endMinutesTotal;
        }
      } catch {
        /* keep defaults */
      }

      // Beri toleransi ±60 menit sebelum/sesudah jam jadwal
      const tolerance = 60;
      const windowStart = Math.max(0, scheduleStartTotal - tolerance);
      const windowEnd = Math.min(24 * 60, scheduleEndTotal + tolerance);

      if (currentWibTotal < windowStart || currentWibTotal > windowEnd) {
        const fmtStart = `${String(Math.floor(scheduleStartTotal / 60)).padStart(2, "0")}:${String(scheduleStartTotal % 60).padStart(2, "0")}`;
        const fmtEnd = `${String(Math.floor(scheduleEndTotal / 60)).padStart(2, "0")}:${String(scheduleEndTotal % 60).padStart(2, "0")}`;
        throw new Error(
          `OPERATIONAL_HOURS_VIOLATION: Absensi untuk kegiatan '${sched?.time || ""}' hanya dapat dilakukan pada rentang operasional jadwal (${fmtStart} - ${fmtEnd} WIB). Jam saat ini: ${String(wibHours).padStart(2, "0")}:${String(wibMinutes).padStart(2, "0")} WIB.`
        );
      }
    }

    // 1. Fetch schedule to get geofence configs and buffer
    const actLoc = await this.getActivityLocation(scheduleId, studentId);
    let isInside = false;

    if (!isAutoAlpa) {
      // 2. Validate backend geofence distance with buffer
      const scheduleLat = actLoc.latitude;
      const scheduleLng = actLoc.longitude;
      const scheduleRadius = actLoc.radius;
      const polygonCoords = actLoc.polygon as any;

      const ruleConfigs = await configService.getRuleEngineConfigs();
      const bufferMeters = (ruleConfigs as any).attendanceGeofenceBufferMeters ?? 15;
      const effectiveRadius = scheduleRadius + bufferMeters;

      if (polygonCoords && Array.isArray(polygonCoords) && polygonCoords.length >= 3) {
        const polyPoints = (polygonCoords as any[]).map((p) => {
          const pLat = Array.isArray(p) ? Number(p[0]) : Number(p.lat ?? p.latitude);
          const pLng = Array.isArray(p) ? Number(p[1]) : Number(p.lng ?? p.longitude);
          return { lat: pLat, lng: pLng };
        });
        isInside = isPointInPolygonWithBuffer(
          { lat: latitude, lng: longitude },
          polyPoints,
          bufferMeters
        );
      } else {
        const distance = calculateDistance(latitude, longitude, scheduleLat, scheduleLng);
        isInside = distance <= effectiveRadius;
      }

      // SMART ZONE & MULTI-POSKO CHECK: Periksa seluruh posko kelompok dan auto-polygon
      if (!isInside) {
        try {
          const schedForSz = await prisma.schedule.findUnique({
            where: { id: scheduleId },
            select: { kelompokId: true },
          });
          if (schedForSz?.kelompokId) {
            const groupPoskos = await getGroupPoskoList(schedForSz.kelompokId);
            for (const gp of groupPoskos) {
              if (
                calculateDistance(latitude, longitude, gp.latitude, gp.longitude) <=
                gp.radius + bufferMeters
              ) {
                isInside = true;
                break;
              }
            }

            if (!isInside) {
              const szCheck = await smartZoneService.isStudentInGroupZone(
                latitude,
                longitude,
                schedForSz.kelompokId,
                bufferMeters
              );
              if (szCheck.isInside) {
                isInside = true;
              }
            }
          }
        } catch {
          // Smart zone check failed — fall through to OUT_OF_RADIUS
        }
      }
    }

    if (!isAutoAlpa && !isInside) {
      console.log(
        `[recordAttendance] Mahasiswa berada di luar radius area kegiatan kelompok - presensi tetap dicatat sesuai aturan presensi fleksibel.`
      );
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
          const targetMins = actLoc.targetDurationMinutes || 240;
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
            ...(deskripsiKegiatan ? { deskripsiKegiatan } : {}),
            ...(fotoUrl ? { fotoUrl } : {}),
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
        throw new Error(
          "FORBIDDEN: Anda belum menekan tombol Mulai Kegiatan (Presensi Masuk). Selesaikan check-in terlebih dahulu sebelum melakukan check-out (Presensi Hadir)."
        );
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
          ...(deskripsiKegiatan ? { deskripsiKegiatan } : {}),
          ...(fotoUrl ? { fotoUrl } : {}),
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

    // Record into system history / audit trail
    auditTrailService
      .recordPresensiMasuk({
        studentId,
        scheduleId,
        scheduleTitle: actLoc?.title || "Kegiatan KKN",
        kelompokName: studentUser?.studentProfile?.kelompok?.name || "-",
        kelurahan: studentUser?.studentProfile?.kelompok?.kelurahan || "-",
        latitude,
        longitude,
        method: attendance.method || method,
        status: attendance.status,
        deskripsiKegiatan,
        fotoUrl,
        studentName: finalNama,
        nim: finalNim,
      })
      .catch((err) => console.warn("[Audit] Presensi masuk log error:", err));

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
    totalDurasiDalamZonaMenit?: number;
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
        status: { in: ["BERLANGSUNG", "HADIR", "TERJEDA"] },
      },
      orderBy: { attendedAt: "desc" },
    });

    // Fallback: cari record BERLANGSUNG yang attendedAt-nya NULL (dibuat dari mulaiKegiatan tanpa set attendedAt)
    if (!attendance) {
      attendance = await prisma.activityAttendance.findFirst({
        where: {
          studentId,
          ...(scheduleId ? { scheduleId } : {}),
          attendedAt: undefined, // prisma will not filter on this field
          checkOutAt: null,
          status: { in: ["BERLANGSUNG", "HADIR", "TERJEDA"] },
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

    // Validasi Geofence: Mahasiswa WAJIB berada di dalam zona untuk checkout
    if (latitude !== undefined && longitude !== undefined) {
      const coSchedule = await prisma.schedule.findUnique({
        where: { id: attendance.scheduleId },
      });
      const coStudent = await prisma.studentKkn.findUnique({
        where: { userId: studentId },
        include: { kelompok: true },
      });
      const coConfigs = await configService.getRuleEngineConfigs();
      const coBuffer = (coConfigs as any).attendanceGeofenceBufferMeters ?? 25;
      const coKelompokId = coStudent?.kelompokId;
      const coGroupPoskos = coKelompokId ? await getGroupPoskoList(coKelompokId) : [];
      const coGeofence = coSchedule ? await buildGeofence(coSchedule) : null;

      let coIsInside = false;
      let coNearestDist = 999999;
      let coNearestRadius = 500;
      let coNearestName = "Posko KKN";

      if (coGroupPoskos.length > 0) {
        for (const gp of coGroupPoskos) {
          const d = calculateDistance(latitude, longitude, gp.latitude, gp.longitude);
          if (d < coNearestDist) {
            coNearestDist = d;
            coNearestRadius = gp.radius;
            coNearestName = gp.nama;
          }
          if (d <= gp.radius + coBuffer) {
            coIsInside = true;
            break;
          }
        }
      }

      if (!coIsInside && coGeofence) {
        const dist = calculateDistance(latitude, longitude, coGeofence.latitude, coGeofence.longitude);
        if (dist < coNearestDist) {
          coNearestDist = dist;
          coNearestRadius = coGeofence.radius;
          coNearestName = coSchedule?.title || "Posko Utama";
        }
        if (coGeofence.polygon && Array.isArray(coGeofence.polygon) && coGeofence.polygon.length >= 3) {
          const polyPoints = (coGeofence.polygon as any[]).map((p) => {
            const val0 = Number(p[0]);
            const val1 = Number(p[1]);
            return { lat: Math.abs(val0) > 45 ? val1 : val0, lng: Math.abs(val0) > 45 ? val0 : val1 };
          });
          coIsInside =
            isPointInPolygonWithBuffer({ lat: latitude, lng: longitude }, polyPoints, coBuffer) ||
            dist <= coGeofence.radius + coBuffer;
        } else {
          coIsInside = dist <= coGeofence.radius + coBuffer;
        }
      }

      if (!coIsInside && coKelompokId) {
        try {
          const szResult = await smartZoneService.isStudentInGroupZone(
            latitude,
            longitude,
            coKelompokId,
            coBuffer
          );
          if (szResult.isInside) coIsInside = true;
          if (szResult.distanceToNearest < coNearestDist) {
            coNearestDist = szResult.distanceToNearest;
            coNearestName = szResult.nearestPoskoName || coNearestName;
          }
        } catch {}
      }

      if (!coIsInside) {
        const distanceInt = Math.round(coNearestDist);
        const allowedRadius = coNearestRadius + coBuffer;
        throw new Error(
          `OUT_OF_GEOFENCE: Anda harus berada di dalam zona ${coNearestName} untuk melakukan presensi pulang (Jarak: ${distanceInt}m, Radius: ${allowedRadius}m).`
        );
      }
    }

    const checkOutTime = new Date();
    // Bug #8 fix: guard attendedAt null agar tidak kalkulasi dari epoch (1970)
    const attendedTime = attendance.attendedAt ? new Date(attendance.attendedAt) : checkOutTime;
    const rawDurationMinutes = Math.max(
      0,
      Math.floor((checkOutTime.getTime() - attendedTime.getTime()) / (1000 * 60))
    );

    // Calculate actual in-zone duration from GPS logs (not simple time diff)
    const sessionStart = attendance.attendedAt
      ? new Date(attendance.attendedAt)
      : new Date(checkOutTime);
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

    let logsCalculatedMins = 0;
    if (schedule && todayLogsForCheckout.length >= 2) {
      const checkoutGeofence = {
        latitude: schedule.latitude ? Number(schedule.latitude) : -6.8915,
        longitude: schedule.longitude ? Number(schedule.longitude) : 107.6107,
        radius: schedule.radius ? Number(schedule.radius) : 500,
        polygon: schedule.polygon,
      };
      logsCalculatedMins = calculateInZoneDurationMinutes(
        todayLogsForCheckout,
        checkoutGeofence,
        checkoutBufferMeters,
        (attendance.jedaLogs as any[]) || []
      );
    }

    const storedMins = attendance.actualInZoneMinutes ?? 0;
    const isPaused = attendance.status === "TERJEDA";
    const jedaLogsArray = (attendance.jedaLogs as any[]) || [];
    const hasJeda = jedaLogsArray.length > 0;

    let liveMins = storedMins;
    if (attendance.attendedAt) {
      liveMins = calculateLiveInZoneMinutes(attendance);
    }

    // [SSOT Backend]: Durasi mutlak berasal dari kalkulasi internal backend (mengabaikan input durasi dari mobile payload)
    let actualInZoneMins = Math.min(480, Math.max(storedMins, liveMins, logsCalculatedMins));

    // Only fallback to rawDurationMinutes if session was active (NOT paused), had NO jeda logs, and actualInZoneMins is still 0 (e.g. legacy/no-gps ping)
    if (actualInZoneMins === 0 && rawDurationMinutes > 0 && !isPaused && !hasJeda) {
      actualInZoneMins = Math.min(480, rawDurationMinutes);
    } else if (isPaused || hasJeda) {
      // If paused or has jeda, liveMins strictly caps duration to before-pause
      actualInZoneMins = Math.min(480, liveMins);
    }

    // Determine final status: HADIR_MEMENUHI or HADIR_TIDAK_MEMENUHI
    let durasiWajibMenit = 240;
    if (schedule) {
      durasiWajibMenit = await getScheduleTargetDurationMinutes(schedule);
    }
    const isMemenuhi =
      durasiWajibMenit > 0 ? actualInZoneMins >= durasiWajibMenit : actualInZoneMins >= 240;
    const checkoutFinalStatus = isMemenuhi ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI";
    const statusDisplay = isMemenuhi ? "Hadir & Memenuhi" : "Hadir & Tidak Memenuhi";

    const durationMinutes = actualInZoneMins;

    const updated = await prisma.activityAttendance.update({
      where: { id: attendance.id },
      data: {
        checkOutAt: checkOutTime,
        status: checkoutFinalStatus,
        actualInZoneMinutes: actualInZoneMins,
        ...(latitude !== undefined && !isNaN(Number(latitude))
          ? { latitude: Number(latitude) }
          : {}),
        ...(longitude !== undefined && !isNaN(Number(longitude))
          ? { longitude: Number(longitude) }
          : {}),
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

    // Record into system history / audit trail
    const kknGroupForAudit =
      (updated.student?.studentProfile as any)?.kelompok || (updated.schedule as any)?.kelompok;
    auditTrailService
      .recordPresensiPulang({
        studentId,
        scheduleId: updated.scheduleId,
        scheduleTitle: updated.schedule?.title || "Kegiatan KKN",
        kelompokName: kknGroupForAudit?.name || "-",
        kelurahan: kknGroupForAudit?.kelurahan || "-",
        attendedAt: updated.attendedAt,
        checkOutAt: updated.checkOutAt,
        durasiMenit: actualInZoneMins,
        durasiTargetMenit: durasiWajibMenit,
        isMemenuhiDurasi: isMemenuhi,
        status: updated.status,
        statusDisplay,
        latitude: updated.latitude ? Number(updated.latitude) : latitude,
        longitude: updated.longitude ? Number(updated.longitude) : longitude,
        deskripsiKegiatan: (updated as any).deskripsiKegiatan || deskripsiKegiatan,
        fotoUrl: (updated as any).fotoUrl || fotoUrl,
        studentName: updated.student?.name,
        nim: updated.student?.studentProfile?.nim,
      })
      .catch((err) => console.warn("[Audit] Presensi pulang log error:", err));

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
    } catch {
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
      if (targetStudentIds.length === 0) {
        return [];
      }
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
      if (targetStudentIds.length === 0) {
        return [];
      }
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
                kelompokId: true,
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
    const leaveRequests =
      allStudentUserIds.length > 0
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

    const leaveMap = new Map<string, (typeof leaveRequests)[0]>();
    for (const lr of leaveRequests) {
      if (!leaveMap.has(lr.studentId)) {
        leaveMap.set(lr.studentId, lr);
      }
    }

    // Load geofence buffer from Rule Engine config
    const attendanceListRuleConfigs = await configService.getRuleEngineConfigs();
    const attendanceListBufferMeters =
      (attendanceListRuleConfigs as any).attendanceGeofenceBufferMeters ?? 15;

    const locations = await this.getActiveStudentsLocations(dplUserId);
    const locMap = new Map(locations.map((l) => [l.studentId, l]));
    const scheduleLoc = await this.getActivityLocation(scheduleId);

    // Query total cumulative minutes for each student across all historical sessions
    const allStudentIds = allStudents.map((s) => s.id);
    const cumulativeRecords =
      allStudentIds.length > 0
        ? await prisma.activityAttendance.findMany({
            where: {
              studentId: { in: allStudentIds },
            },
            select: {
              studentId: true,
              actualInZoneMinutes: true,
              status: true,
              attendedAt: true,
              checkOutAt: true,
            },
          })
        : [];

    const cumulativeMap = new Map<
      string,
      { totalMinutes: number; totalHours: number; totalDays: number }
    >();
    for (const cr of cumulativeRecords) {
      let mins = cr.actualInZoneMinutes ?? 0;
      if (cr.status === "BERLANGSUNG" && !cr.checkOutAt && cr.attendedAt) {
        mins = calculateLiveInZoneMinutes(cr as any);
      } else if (mins === 0 && cr.attendedAt && cr.checkOutAt) {
        mins = Math.max(
          0,
          Math.floor(
            (new Date(cr.checkOutAt).getTime() - new Date(cr.attendedAt).getTime()) / 60000
          )
        );
      }
      const prev = cumulativeMap.get(cr.studentId) || {
        totalMinutes: 0,
        totalHours: 0,
        totalDays: 0,
      };
      prev.totalMinutes += mins;
      prev.totalHours = Math.round((prev.totalMinutes / 60) * 100) / 100;
      if (cr.attendedAt) {
        prev.totalDays += 1;
      }
      cumulativeMap.set(cr.studentId, prev);
    }

    const targetConfigMins =
      attendanceListRuleConfigs.attendanceMinDurationHours * 60 +
      attendanceListRuleConfigs.attendanceMinDurationMinutes +
      Math.round(attendanceListRuleConfigs.attendanceMinDurationSeconds / 60);
    const durasiWajib =
      scheduleLoc?.targetDurationMinutes || (targetConfigMins > 0 ? targetConfigMins : 240);
    const targetHours = Math.round((durasiWajib / 60) * 10) / 10;

    const attendedStudentIds = new Set<string>();

    const attendedList = list.map((att) => {
      attendedStudentIds.add(att.studentId);
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

      let actualMins = att.actualInZoneMinutes ?? 0;
      if (att.status === "BERLANGSUNG" && !att.checkOutAt && att.attendedAt) {
        actualMins = calculateLiveInZoneMinutes(att as any);
      } else if (actualMins === 0 && att.attendedAt && att.checkOutAt) {
        actualMins = Math.max(
          0,
          Math.floor(
            (new Date(att.checkOutAt).getTime() - new Date(att.attendedAt).getTime()) / 60000
          )
        );
      }
      const percentRatio = durasiWajib > 0 ? Math.round((actualMins / durasiWajib) * 100) : 0;
      const isDurMet = durasiWajib <= 0 || actualMins >= durasiWajib;

      if (
        att.method === "IZIN_DPL" ||
        String(att.status).toUpperCase().includes("IZIN") ||
        String(att.status).toUpperCase().includes("SAKIT")
      ) {
        currentStatus = "IZIN_DISETUJUI";
        status = String(att.status).toUpperCase().includes("SAKIT") ? "SAKIT" : "IZIN";
        statusDisplay = status === "SAKIT" ? "Sakit (Disetujui)" : "Izin (Disetujui)";
        isMemenuhiDurasi = false;
      } else if (
        att.method === "OVERRIDE_DPL" ||
        String(att.status).toUpperCase().includes("OVERRIDE") ||
        att.status === "OVERRIDDEN_HADIR"
      ) {
        currentStatus = "OVERRIDDEN_HADIR";
        status = "HADIR_MEMENUHI";
        statusDisplay = "Hadir (Batal Izin)";
        isMemenuhiDurasi = true;
      } else if (
        isFinished ||
        att.status === "HADIR" ||
        att.status === "SELESAI" ||
        att.status === "HADIR_MEMENUHI" ||
        att.status === "HADIR_TIDAK_MEMENUHI"
      ) {
        currentStatus = "TERCATAT_ABSEN";
        if (att.status === "SELESAI_TELAT") {
          status = "HADIR_TIDAK_MEMENUHI";
          statusDisplay = "Hadir & Tidak Memenuhi";
          isMemenuhiDurasi = false;
        } else {
          status = isDurMet ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI";
          statusDisplay = isDurMet ? "Hadir & Memenuhi" : "Hadir & Tidak Memenuhi";
          isMemenuhiDurasi = isDurMet;
        }
      } else if (att.status === "BERLANGSUNG") {
        status = "BERLANGSUNG";
        currentStatus = "MASIH_DI_LOKASI";
        statusDisplay = "Sedang di Lapangan";
        isMemenuhiDurasi = isDurMet;
      } else if (att.status === "TERJEDA") {
        status = "TERJEDA";
        currentStatus = "TERJEDA";
        statusDisplay = "Terjeda";
        isMemenuhiDurasi = isDurMet;
      } else {
        status = att.status;
        statusDisplay = att.status;
        isMemenuhiDurasi = isDurMet;
      }

      const isLeave =
        att.method === "IZIN_DPL" ||
        String(att.status).toUpperCase().includes("IZIN") ||
        String(att.status).toUpperCase().includes("SAKIT");
      const cum = cumulativeMap.get(att.studentId) || {
        totalMinutes: 0,
        totalHours: 0,
        totalDays: 0,
      };
      const jedaMins = isLeave ? 0 : calculateTotalJedaMinutes(att as any);
      const jedaFormatted = formatDurasiMenitIndo(jedaMins);
      return {
        ...att,
        status,
        currentStatus,
        statusDisplay,
        isMemenuhiDurasi,
        actualInZoneMinutes: actualMins,
        durasiJedaMenit: jedaMins,
        durasiJedaFormatted: jedaFormatted,
        targetHours,
        targetDurationMinutes: durasiWajib,
        targetRatioPercent: percentRatio,
        totalMinutes: cum.totalMinutes,
        totalHours: cum.totalHours,
        totalDays: cum.totalDays,
        attendedAt: isLeave ? null : att.attendedAt,
        completedAt: isFinished ? att.checkOutAt || (att as any).completedAt || null : null,
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
      const cum = cumulativeMap.get(s.id) || { totalMinutes: 0, totalHours: 0, totalDays: 0 };

      if (leave && leave.status === "APPROVED") {
        const attStatus = String(leave.type || "")
          .toUpperCase()
          .includes("SAKIT")
          ? "SAKIT"
          : "IZIN";
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
        } catch {
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
          targetHours,
          targetDurationMinutes: durasiWajib,
          targetRatioPercent: 0,
          totalMinutes: cum.totalMinutes,
          totalHours: cum.totalHours,
          totalDays: cum.totalDays,
          leaveRequest: {
            id: leave.id,
            type: leave.type,
            reason: leave.reason,
            evidenceUrl: leave.evidenceUrl,
            status: leave.status,
          },
        });
      } else if (leave && leave.status === "PENDING") {
        const isSakit = String(leave.type || "")
          .toUpperCase()
          .includes("SAKIT");
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
          targetHours,
          targetDurationMinutes: durasiWajib,
          targetRatioPercent: 0,
          totalMinutes: cum.totalMinutes,
          totalHours: cum.totalHours,
          totalDays: cum.totalDays,
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
          targetHours,
          targetDurationMinutes: durasiWajib,
          targetRatioPercent: 0,
          totalMinutes: cum.totalMinutes,
          totalHours: cum.totalHours,
          totalDays: cum.totalDays,
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
          targetHours,
          targetDurationMinutes: durasiWajib,
          targetRatioPercent: 100,
          totalMinutes: cum.totalMinutes,
          totalHours: cum.totalHours,
          totalDays: cum.totalDays,
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
          targetHours,
          targetDurationMinutes: durasiWajib,
          targetRatioPercent: 0,
          actualInZoneMinutes: 0,
          totalMinutes: cum.totalMinutes,
          totalHours: cum.totalHours,
          totalDays: cum.totalDays,
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
    const TARGET_HARIAN_HOURS =
      Number(config.attendanceMinDurationHours || config.targetHarianJam) || 4;
    const TARGET_TOTAL_HOURS =
      Number(config.targetTotalJam) || TARGET_HARIAN_HOURS * Number(config.targetTotalHari || 50);
    const TARGET_TOTAL_MINUTES = Math.round(TARGET_TOTAL_HOURS * 60);
    const TARGET_HARIAN_MINUTES = Math.round(TARGET_HARIAN_HOURS * 60);

    const summary = students.map((s) => {
      let totalMinutes = 0;
      let fulfilledTargetDays = 0;

      const sessionDetails = s.user.attendances.map((att) => {
        let durationMins = 0;
        let storedMins = 0;
        if (
          (att as any).actualInZoneMinutes !== null &&
          (att as any).actualInZoneMinutes !== undefined
        ) {
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

        if (
          att.status === "BERLANGSUNG" ||
          att.status === "DI_ZONA" ||
          att.status === "DALAM_RADIUS"
        ) {
          // Prioritaskan storedMins dari DB (mencerminkan jeda/keluar zona).
          // Fallback ke timeDiffMins hanya jika DB masih 0 (sesi baru mulai).
          durationMins = storedMins > 0 ? storedMins : timeDiffMins;
        } else {
          durationMins = storedMins > 0 ? storedMins : timeDiffMins;
        }
        totalMinutes += durationMins;
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
      const progressPercentage =
        Math.round((totalMinutes / (TARGET_TOTAL_MINUTES || 1)) * 1000) / 10;

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
        hariKerja: config.hariKerja || "Senin - Jumat",
        jamOperasional: config.jamKerja || "08:00 - 16:00 WIB",
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
   * Skip / tandai kegiatan sebagai "Tidak Ada Kegiatan".
   *
   * Aturan scope:
   * - MAHASISWA biasa   → hanya untuk dirinya sendiri
   * - MAHASISWA isKetua → untuk seluruh anggota kelompoknya
   * - DPL               → untuk seluruh anggota kelompok binaannya
   *
   * Catatan: Jadwal global (kelompokId = null) TIDAK diubah status-nya;
   * hanya record ActivityAttendance per mahasiswa yang di-upsert.
   *
   * Endpoint: POST /api/v1/kkn/kegiatan/:id/skip
   */
  async skipKegiatan(
    scheduleId: string,
    userId: string,
    userRole: string,
    alasan?: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      kegiatanId: string;
      jadwalId: string;
      statusKegiatan: string;
      totalMahasiswaTerdampak: number;
      alasan: string;
      ditandaiOleh: string;
      ditandaiPada: string;
    };
  }> {
    const normalizedRole = userRole.toUpperCase();
    const skipAlasan = alasan?.trim() || "Tidak ada kegiatan";
    const now = new Date();

    // 1. Ambil data jadwal
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        attendances: {
          select: { status: true },
        },
        kelompok: {
          include: {
            students: {
              select: { userId: true, isKetua: true },
            },
          },
        },
      },
    });

    if (!schedule) {
      return { success: false, message: "Jadwal kegiatan tidak ditemukan." };
    }

    // 2. Cek apakah ada presensi yang sudah BERLANGSUNG atau SELESAI
    const hasActiveOrFinished = schedule.attendances.some((a) =>
      ["BERLANGSUNG", "SELESAI", "SELESAI_TELAT", "HADIR_MEMENUHI", "HADIR_TIDAK_MEMENUHI", "HADIR"].includes(
        String(a.status).toUpperCase()
      )
    );
    if (hasActiveOrFinished) {
      return {
        success: false,
        message: "Tidak dapat skip kegiatan yang sudah dimulai atau selesai.",
      };
    }

    // 3. Tentukan daftar mahasiswa yang terdampak berdasarkan role
    let targetStudentIds: string[] = [];

    const isDpl = normalizedRole.includes("DPL") || normalizedRole.includes("DOSEN");
    const isMahasiswa = normalizedRole.includes("MAHASISWA");

    if (isDpl || normalizedRole.includes("DEVELOPER") || normalizedRole.includes("SUPER_USER")) {
      // DPL / Admin: skip untuk seluruh kelompok dalam jadwal ini
      if (schedule.kelompok) {
        // Jadwal spesifik kelompok — ambil semua anggota kelompok tersebut
        targetStudentIds = schedule.kelompok.students.map((s) => s.userId);
      } else {
        // Jadwal global: DPL hanya boleh skip untuk kelompok binaannya
        const dplKelompok = await prisma.kelompokKkn.findMany({
          where: { dplId: userId },
          include: { students: { select: { userId: true } } },
        });
        targetStudentIds = dplKelompok.flatMap((k) => k.students.map((s) => s.userId));
      }
    } else if (isMahasiswa) {
      // Cek apakah mahasiswa ini adalah anggota dari jadwal yang diminta
      const studentRecord = await prisma.studentKkn.findUnique({
        where: { userId },
        select: { isKetua: true, kelompokId: true },
      });

      if (!studentRecord) {
        return { success: false, message: "Data mahasiswa tidak ditemukan." };
      }

      // Validasi: mahasiswa harus terdaftar di kelompok yang sama dengan jadwal
      if (schedule.kelompokId && studentRecord.kelompokId !== schedule.kelompokId) {
        return {
          success: false,
          message: "Anda tidak memiliki izin untuk melewati kegiatan ini.",
        };
      }

      if (studentRecord.isKetua) {
        // Ketua: skip untuk seluruh anggota kelompoknya (hanya kelompok sendiri)
        if (studentRecord.kelompokId) {
          const kelompok = await prisma.kelompokKkn.findUnique({
            where: { id: studentRecord.kelompokId },
            include: { students: { select: { userId: true } } },
          });
          targetStudentIds = kelompok?.students.map((s) => s.userId) || [];
        }
      } else {
        // Mahasiswa biasa: hanya untuk dirinya sendiri
        targetStudentIds = [userId];
      }
    } else {
      return {
        success: false,
        message: "Anda tidak memiliki izin untuk melewati kegiatan ini.",
      };
    }

    if (targetStudentIds.length === 0) {
      return {
        success: false,
        message: "Tidak ada mahasiswa yang dapat di-skip pada jadwal ini.",
      };
    }

    // 4. Upsert ActivityAttendance untuk setiap mahasiswa yang terdampak
    const skipDetails = {
      keteranganSkip: skipAlasan,
      skippedBy: userId,
      skippedAt: now.toISOString(),
      skippedByRole: userRole,
    };

    await Promise.all(
      targetStudentIds.map((studentId) =>
        prisma.activityAttendance.upsert({
          where: {
            studentId_scheduleId: { studentId, scheduleId },
          },
          create: {
            studentId,
            scheduleId,
            attendedAt: now,
            method: "SKIP_MANUAL",
            latitude: schedule.latitude || -6.89,
            longitude: schedule.longitude || 107.61,
            status: "TIDAK_ADA_KEGIATAN",
            actualInZoneMinutes: 0,
            deskripsiKegiatan: `Tidak Ada Kegiatan: ${skipAlasan}`,
            jedaLogs: [skipDetails],
          },
          update: {
            status: "TIDAK_ADA_KEGIATAN",
            method: "SKIP_MANUAL",
            deskripsiKegiatan: `Tidak Ada Kegiatan: ${skipAlasan}`,
            jedaLogs: [skipDetails],
          },
        })
      )
    );

    // 5. Jika jadwal ini adalah jadwal SPESIFIK kelompok (bukan global), update status jadwal itu sendiri
    //    Jadwal global (kelompokId = null) TIDAK diubah status-nya agar tidak berdampak ke kelompok lain.
    if (schedule.kelompokId && targetStudentIds.length === (schedule.kelompok?.students.length ?? 0)) {
      // Seluruh anggota kelompok di-skip → update status di Schedule juga
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          status: "TIDAK_ADA_KEGIATAN",
          skipDetails,
        },
      });
    }

    // 6. Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: "SKIP_KEGIATAN",
          entity: "Schedule",
          entityId: scheduleId,
          details: JSON.stringify({
            alasan: skipAlasan,
            totalTerdampak: targetStudentIds.length,
            scope: isDpl ? "DPL" : targetStudentIds.length === 1 ? "INDIVIDUAL" : "KELOMPOK",
          }),
        },
      });
    } catch {
      // Audit log non-critical, jangan gagalkan request utama
    }

    return {
      success: true,
      message: "Kegiatan berhasil ditandai sebagai Tidak Ada Kegiatan.",
      data: {
        kegiatanId: scheduleId,
        jadwalId: scheduleId,
        statusKegiatan: "TIDAK_ADA_KEGIATAN",
        totalMahasiswaTerdampak: targetStudentIds.length,
        alasan: skipAlasan,
        ditandaiOleh: userId,
        ditandaiPada: now.toISOString(),
      },
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
        Math.round(ruleConfigs.attendanceMinDurationSeconds / 60) || 240;

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
    const yesterdayWibDateStr = new Date(
      startOfDay.getTime() - 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000
    )
      .toISOString()
      .slice(0, 10);
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
    let schedules: any[] = await prisma.schedule.findMany({
      where: {
        date: { gte: yesterdayStart, lte: endOfDay },
        isActive: true,
        ...(student?.kelompokId
          ? { OR: [{ kelompokId: student.kelompokId }, { kelompokId: null }] }
          : {}),
      },
      include: {
        kelompok: {
          include: {
            poskoKkn: true,
            poskoMulti: { orderBy: [{ isUtama: "desc" }, { createdAt: "asc" }] },
          },
        },
        attendances: {
          where: { studentId: userId },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (schedules.length === 0 && student?.kelompokId) {
      // Look up group & registered Posko (Primary, Multi, or Facility)
      const group = await prisma.kelompokKkn.findUnique({
        where: { id: student.kelompokId },
        include: {
          poskoKkn: true,
          poskoMulti: { orderBy: [{ isUtama: "desc" }, { createdAt: "asc" }] },
          facilities: {
            where: { jenis: "posko_kkn" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      const registeredPosko =
        group?.poskoKkn || (group as any)?.poskoMulti?.[0] || group?.facilities?.[0];
      let poskoLat = -6.8915; // default Coblong
      let poskoLng = 107.6107;
      let poskoName = `Posko KKN ${group?.name || "Mahasiswa"}`;
      const poskoRadius = Math.max(150, Number((registeredPosko as any)?.radius) || 500);

      if (registeredPosko) {
        poskoLat = Number(registeredPosko.latitude);
        poskoLng = Number(registeredPosko.longitude);
        poskoName = registeredPosko.nama || poskoName;
      } else {
        // Fallback berdasarkan kelurahan resmi
        const kel = (group?.kelurahan || group?.name || "").toLowerCase();
        if (kel.includes("dago")) {
          poskoLat = -6.8833;
          poskoLng = 107.6167;
          poskoName = `Posko KKN ${group?.name || "Dago"} - Kel. Dago`;
        } else if (kel.includes("cipaganti")) {
          poskoLat = -6.8912;
          poskoLng = 107.6035;
          poskoName = `Posko KKN ${group?.name || "Cipaganti"} - Kel. Cipaganti`;
        } else if (kel.includes("lebak gede") || kel.includes("lebakgede")) {
          poskoLat = -6.8875;
          poskoLng = 107.6133;
          poskoName = `Posko KKN ${group?.name || "Lebak Gede"} - Kel. Lebak Gede`;
        } else if (kel.includes("lebak siliwangi")) {
          poskoLat = -6.8892;
          poskoLng = 107.6083;
          poskoName = `Posko KKN ${group?.name || "Lebak Siliwangi"} - Kel. Lebak Siliwangi`;
        } else if (kel.includes("sadang serang")) {
          poskoLat = -6.8917;
          poskoLng = 107.625;
          poskoName = `Posko KKN ${group?.name || "Sadang Serang"} - Kel. Sadang Serang`;
        } else if (kel.includes("sekeloa")) {
          poskoLat = -6.89;
          poskoLng = 107.62;
          poskoName = `Posko KKN ${group?.name || "Sekeloa"} - Kel. Sekeloa`;
        }
      }

      // Upsert automatic daily schedule in database for today
      try {
        const defaultDailySchedule = await prisma.schedule.create({
          data: {
            title: `Kegiatan Harian ${poskoName}`,
            date: startOfDay,
            time: "08:00 - 16:00",
            category: "POSKO_KKN",
            location: poskoName,
            latitude: poskoLat,
            longitude: poskoLng,
            radius: poskoRadius,
            kelompokId: student.kelompokId,
            isActive: true,
          },
          include: {
            kelompok: {
              include: {
                poskoKkn: true,
                poskoMulti: { orderBy: [{ isUtama: "desc" }, { createdAt: "asc" }] },
              },
            },
            attendances: {
              where: { studentId: userId },
            },
          },
        });
        schedules = [defaultDailySchedule];
      } catch {
        // Fallback query jika sudah dibuat secara concurrent oleh rekan sekelompok
        schedules = await prisma.schedule.findMany({
          where: {
            date: { gte: startOfDay, lte: endOfDay },
            kelompokId: student.kelompokId,
            isActive: true,
          },
          include: {
            kelompok: {
              include: {
                poskoKkn: true,
                poskoMulti: { orderBy: [{ isUtama: "desc" }, { createdAt: "asc" }] },
              },
            },
            attendances: {
              where: { studentId: userId },
            },
          },
        });
      }
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
          scheduleStatus = currentMinutesTotal >= startMinutesTotal - 60 ? "AKTIF" : "AKAN_DATANG";
        } else if (isFutureDate) {
          scheduleStatus = "AKAN_DATANG";
        } else {
          scheduleStatus = currentMinutesTotal <= endMinutesTotal + 180 ? "AKTIF" : "SELESAI";
        }
      } else {
        if (isSchedDateToday) {
          if (currentMinutesTotal < startMinutesTotal - 60) {
            scheduleStatus = "AKAN_DATANG";
          } else if (
            currentMinutesTotal > endMinutesTotal + 180 &&
            (!sch.attendances || sch.attendances.length === 0)
          ) {
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

      // Hitung actualInZoneSeconds real-time dari record attendance
      let actualInZoneSeconds = 0;
      let actualInZoneMinutes = 0;
      const att = sch.attendances?.[0];
      if (
        att &&
        (att.status === "BERLANGSUNG" || att.status === "DALAM_RADIUS" || att.status === "DI_ZONA")
      ) {
        actualInZoneMinutes = calculateLiveInZoneMinutes(att);
        actualInZoneSeconds = calculateLiveInZoneSeconds(att);
      } else if (
        att &&
        (att.status === "TERJEDA" ||
          att.status === "HADIR" ||
          att.status === "SELESAI" ||
          att.status === "SELESAI_TELAT" ||
          att.status === "HADIR_MEMENUHI" ||
          att.status === "HADIR_TIDAK_MEMENUHI")
      ) {
        actualInZoneMinutes = att.actualInZoneMinutes ?? 0;
        actualInZoneSeconds = calculateLiveInZoneSeconds(att);
      }

      // Status Kehadiran mahasiswa
      let statusKehadiran: string | null = null;
      let isMemenuhiDurasi = false;
      const isMemenuhi = durasiWajibMenit <= 0 || actualInZoneMinutes >= durasiWajibMenit;

      if (approvedLeave) {
        statusKehadiran = approvedLeave.type.toUpperCase() === "SAKIT" ? "SAKIT" : "IZIN";
        isMemenuhiDurasi = false;
      } else if (att) {
        if (att.status === "ALPA") {
          statusKehadiran = "ALPA";
          isMemenuhiDurasi = false;
        } else if (att.status === "TIDAK_ADA_KEGIATAN" || att.status === "SKIP_KEGIATAN") {
          statusKehadiran = "TIDAK_ADA_KEGIATAN";
          isMemenuhiDurasi = false;
        } else if (
          att.status === "HADIR_MEMENUHI" ||
          att.status === "HADIR_TIDAK_MEMENUHI" ||
          att.status === "SELESAI_TELAT" ||
          att.checkOutAt ||
          att.status === "HADIR" ||
          att.status === "SELESAI"
        ) {
          if (att.status === "SELESAI_TELAT") {
            statusKehadiran = "HADIR_TIDAK_MEMENUHI";
            isMemenuhiDurasi = false;
          } else {
            statusKehadiran = isMemenuhi ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI";
            isMemenuhiDurasi = isMemenuhi;
          }
        } else if (att.status === "BERLANGSUNG") {
          statusKehadiran = "BERLANGSUNG";
          isMemenuhiDurasi = isMemenuhi;
        } else if (att.status === "TERJEDA") {
          statusKehadiran = "TERJEDA";
          isMemenuhiDurasi = isMemenuhi;
        } else if (att.status === "DALAM_RADIUS" || att.status === "DI_ZONA") {
          statusKehadiran = "DI_ZONA";
          isMemenuhiDurasi = isMemenuhi;
        }
      } else if (scheduleStatus === "SELESAI") {
        // Fleksibilitas KKN: Mahasiswa yang tidak absen pada jadwal yang telah selesai TIDAK dicap ALPA
        statusKehadiran = "BELUM_ABSEN";
        isMemenuhiDurasi = false;
      }

      const statusDisplay =
        statusKehadiran === "HADIR_MEMENUHI"
          ? "Hadir & Memenuhi"
          : statusKehadiran === "HADIR_TIDAK_MEMENUHI"
            ? "Hadir & Tidak Memenuhi"
            : statusKehadiran === "TIDAK_ADA_KEGIATAN"
              ? "Tidak Ada Kegiatan"
              : statusKehadiran;

      const allPoskoList: Array<{
        id: string;
        nama: string;
        alamat: string;
        latitude: number;
        longitude: number;
        radius: number;
        isUtama: boolean;
        type: "POSKO_UTAMA" | "POSKO_MULTI";
        fotoUrl?: string | null;
      }> = [];

      if ((sch.kelompok as any)?.poskoKkn) {
        const pk = (sch.kelompok as any).poskoKkn;
        if (pk.latitude && pk.longitude) {
          allPoskoList.push({
            id: pk.id,
            nama: pk.nama,
            alamat: pk.alamat || "-",
            latitude: Number(pk.latitude),
            longitude: Number(pk.longitude),
            radius: Math.max(50, Number(pk.radius) || 500),
            isUtama: true,
            type: "POSKO_UTAMA",
            fotoUrl: pk.fotoUrl || null,
          });
        }
      }

      if (Array.isArray((sch.kelompok as any)?.poskoMulti)) {
        for (const pm of (sch.kelompok as any).poskoMulti) {
          if (pm.latitude && pm.longitude) {
            allPoskoList.push({
              id: pm.id,
              nama: pm.nama,
              alamat: pm.alamat || "-",
              latitude: Number(pm.latitude),
              longitude: Number(pm.longitude),
              radius: Math.max(50, Number(pm.radius) || 500),
              isUtama: pm.isUtama || false,
              type: "POSKO_MULTI",
              fotoUrl: pm.fotoUrl || null,
            });
          }
        }
      }

      const officialPosko =
        (sch.kelompok as any)?.poskoKkn || (sch.kelompok as any)?.poskoMulti?.[0];
      const latNum = officialPosko?.latitude
        ? Number(officialPosko.latitude)
        : sch.latitude
          ? Number(sch.latitude)
          : -6.8906;
      const lngNum = officialPosko?.longitude
        ? Number(officialPosko.longitude)
        : sch.longitude
          ? Number(sch.longitude)
          : 107.615;
      const poskoRadiusNum = officialPosko?.radius
        ? Math.max(50, Number(officialPosko.radius))
        : sch.radius
          ? Math.max(50, Number(sch.radius))
          : 500;
      const titleStr = officialPosko?.nama ? `Kegiatan Harian ${officialPosko.nama}` : sch.title;
      const locationStr = officialPosko?.nama || sch.location || "Lokasi Kegiatan KKN";

      // Auto-sinkronkan koordinat jadwal jika posko baru/diupdate berbeda dengan jadwal
      if (
        officialPosko &&
        (Number(sch.latitude) !== latNum ||
          Number(sch.longitude) !== lngNum ||
          sch.location !== locationStr)
      ) {
        prisma.schedule
          .update({
            where: { id: sch.id },
            data: {
              latitude: latNum,
              longitude: lngNum,
              location: locationStr,
              title: titleStr,
              radius: poskoRadiusNum,
            },
          })
          .catch(() => {});
      }

      // Ekstrak detail skip dari jedaLogs (Array format baru dari skipKegiatan())
      const jedaLogsArr = Array.isArray(att?.jedaLogs) ? (att.jedaLogs as any[]) : [];
      const skipLog = jedaLogsArr.find((l: any) => l.skippedBy || l.keteranganSkip);
      const isSkip = att?.status === "TIDAK_ADA_KEGIATAN" || att?.status === "SKIP_KEGIATAN";
      const keteranganSkip = isSkip
        ? skipLog?.keteranganSkip || att?.deskripsiKegiatan || "Tidak ada kegiatan"
        : undefined;
      const skippedBy = isSkip ? (skipLog?.skippedBy || null) : undefined;
      const skippedAt = isSkip
        ? (skipLog?.skippedAt || (att?.attendedAt ? att.attendedAt.toISOString() : null))
        : undefined;


      const jedaMins = isSkip ? 0 : calculateTotalJedaMinutes(att as any);
      const jedaFormatted = formatDurasiMenitIndo(jedaMins);

      return {
        id: sch.id,
        namaKegiatan: titleStr,
        tanggal: schDateStr,
        jamMulai,
        jamSelesai,
        durasiWajibMenit,
        lokasi: {
          alamat: locationStr,
          latitude: latNum,
          longitude: lngNum,
          radiusMeter: poskoRadiusNum,
          polygon: sch.polygon || null,
        },
        poskoList: allPoskoList,
        totalPosko: allPoskoList.length,
        status: scheduleStatus,
        statusKehadiran,
        attendanceStatus: statusKehadiran,
        statusDisplay,
        isMemenuhiDurasi,
        keteranganSkip,
        skippedBy,
        skippedAt,
        actualInZoneSeconds,
        actualInZoneMinutes,
        durasiJedaMenit: jedaMins,
        durasiJedaFormatted: jedaFormatted,
        attendedAt: att?.attendedAt ? att.attendedAt.toISOString() : null,
        time: `${jamMulai} - ${jamSelesai}`,
        kelompok: {
          id: sch.kelompok?.id || student?.kelompok?.id || "KLP-001",
          nama: sch.kelompok?.name || student?.kelompok?.name || "Kelompok KKN",
        },
        createdAt: sch.createdAt.toISOString(),
      };
    });

    // Filter: Halaman kegiatan aktif hanya menampilkan jadwal hari ini (atau jadwal kemarin yang shift-nya masih AKTIF / overnight).
    // Jadwal kemarin yang sudah SELESAI tidak boleh tampil di daftar kegiatan aktif hari ini.
    const filtered = result.filter((r) => {
      // Jika jadwal adalah tanggal target hari ini, selalu tampilkan
      if (r.tanggal === todayWibDateStr) {
        return true;
      }
      // Jika jadwal kemarin, hanya tampilkan jika statusnya masih AKTIF (overnight)
      return r.status === "AKTIF";
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
    payload: {
      latitude: number;
      longitude: number;
      deviceInfo?: string;
      deskripsiKegiatan?: string;
      fotoUrl?: string;
      poskoId?: string;
    }
  ) {
    const { latitude, longitude, deskripsiKegiatan, fotoUrl, poskoId } = payload;

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
        scheduleStatus = currentMinutesTotal >= startMinutesTotal - 60 ? "AKTIF" : "AKAN_DATANG";
      } else if (isFutureDate) {
        scheduleStatus = "AKAN_DATANG";
      } else {
        scheduleStatus = currentMinutesTotal <= endMinutesTotal + 180 ? "AKTIF" : "SELESAI";
      }
    } else {
      if (isSchedDateToday) {
        // Toleransi persiapan presensi 60 menit sebelum jam mulai
        if (currentMinutesTotal < startMinutesTotal - 60) {
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

    // Validasi Geofence: Mahasiswa WAJIB berada di dalam radius zona kegiatan / posko KKN saat memulai presensi
    const ruleConfigs = await configService.getRuleEngineConfigs();
    const bufferMeters = (ruleConfigs as any).attendanceGeofenceBufferMeters ?? 25;

    const kelompokIdToCheck = schedule.kelompokId || student.kelompokId;
    const groupPoskos = kelompokIdToCheck ? await getGroupPoskoList(kelompokIdToCheck) : [];
    const geofence = await buildGeofence(schedule);

    let isInsideOnStart = false;
    let matchedPosko: any = null;
    let nearestDist = 999999;
    let nearestRadius = 500;
    let nearestName = "Posko KKN";

    // 1. Jika client mengirimkan poskoId spesifik, periksa posko tersebut terlebih dahulu
    if (poskoId && groupPoskos.length > 0) {
      const targeted = groupPoskos.find((p) => p.id === poskoId);
      if (targeted) {
        const distTarget = calculateDistance(
          latitude,
          longitude,
          targeted.latitude,
          targeted.longitude
        );
        nearestDist = distTarget;
        nearestRadius = targeted.radius;
        nearestName = targeted.nama;
        if (distTarget <= targeted.radius + bufferMeters) {
          isInsideOnStart = true;
          matchedPosko = targeted;
        }
      }
    }

    // 2. Jika belum cocok, periksa ke seluruh posko yang terdaftar pada kelompok (Multi-Posko)
    if (!isInsideOnStart && groupPoskos.length > 0) {
      for (const gp of groupPoskos) {
        const d = calculateDistance(latitude, longitude, gp.latitude, gp.longitude);
        if (d < nearestDist) {
          nearestDist = d;
          nearestRadius = gp.radius;
          nearestName = gp.nama;
        }
        if (d <= gp.radius + bufferMeters) {
          isInsideOnStart = true;
          matchedPosko = gp;
          break;
        }
      }
    }

    // 3. Jika belum cocok, periksa geofence jadwal (circle atau polygon)
    if (!isInsideOnStart) {
      const distToZone = calculateDistance(
        latitude,
        longitude,
        geofence.latitude,
        geofence.longitude
      );
      if (distToZone < nearestDist) {
        nearestDist = distToZone;
        nearestRadius = geofence.radius;
        nearestName = schedule.title || "Posko Utama";
      }

      if (geofence.polygon && Array.isArray(geofence.polygon) && geofence.polygon.length >= 3) {
        const polyPoints = (geofence.polygon as any[]).map((p) => {
          const val0 = Number(p[0]);
          const val1 = Number(p[1]);
          return { lat: Math.abs(val0) > 45 ? val1 : val0, lng: Math.abs(val0) > 45 ? val0 : val1 };
        });
        isInsideOnStart =
          isPointInPolygonWithBuffer({ lat: latitude, lng: longitude }, polyPoints, bufferMeters) ||
          distToZone <= geofence.radius + bufferMeters;
      } else {
        isInsideOnStart = distToZone <= geofence.radius + bufferMeters;
      }
    }

    // 4. SMART ZONE FALLBACK: Adaptive polygon dari persebaran aktif kelompok
    if (!isInsideOnStart && kelompokIdToCheck) {
      try {
        const szCheck = await smartZoneService.isStudentInGroupZone(
          latitude,
          longitude,
          kelompokIdToCheck,
          bufferMeters
        );
        if (szCheck.isInside) {
          isInsideOnStart = true;
          matchedPosko = szCheck.matchedPosko ? { nama: szCheck.matchedPosko } : null;
        }
        if (szCheck.distanceToNearest < nearestDist) {
          nearestDist = szCheck.distanceToNearest;
          nearestName = szCheck.nearestPoskoName || nearestName;
        }
      } catch {
        // Abaikan jika fallback gagal
      }
    }

    if (!isInsideOnStart) {
      const distanceInt = Math.round(nearestDist);
      const allowedRadius = nearestRadius + bufferMeters;
      console.log(
        `[mulaiKegiatan] Mahasiswa presensi di luar zona ${nearestName} (${distanceInt}m, radius ${allowedRadius}m) - diperbolehkan oleh aturan mobile fleksibel.`
      );
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
      (existingSession.status === "TIDAK_ADA_KEGIATAN" ||
        existingSession.status === "SKIP_KEGIATAN")
    ) {
      throw new Error("CONFLICT: Kegiatan ini telah ditandai Tidak Ada Kegiatan.");
    }

    if (
      existingSession &&
      (existingSession.status === "HADIR" ||
        existingSession.status === "SELESAI" ||
        existingSession.status === "SELESAI_TELAT" ||
        existingSession.status === "HADIR_MEMENUHI" ||
        existingSession.status === "HADIR_TIDAK_MEMENUHI" ||
        Boolean(existingSession.checkOutAt))
    ) {
      throw new Error(
        "FORBIDDEN: Anda sudah menyelesaikan kegiatan ini (Hadir). Anda tidak dapat memulainya kembali."
      );
    }

    // Concurrency check: Pastikan tidak ada kegiatan lain yang sedang BERLANGSUNG / TERJEDA
    const activeOtherSession = await prisma.activityAttendance.findFirst({
      where: {
        studentId: studentUserId,
        scheduleId: { not: scheduleId },
        checkOutAt: null,
        status: { in: ["BERLANGSUNG", "TERJEDA", "DI_ZONA", "DALAM_RADIUS"] },
      },
      include: { schedule: true },
    });

    if (activeOtherSession) {
      const startOfDay = new Date(`${todayStr}T00:00:00+07:00`);
      if (new Date(activeOtherSession.attendedAt).getTime() < startOfDay.getTime()) {
        // Sesi tertinggal dari hari-hari sebelumnya di-checkout otomatis agar mahasiswa tidak terkunci
        await prisma.activityAttendance
          .update({
            where: { id: activeOtherSession.id },
            data: {
              checkOutAt: new Date(activeOtherSession.attendedAt.getTime() + 8 * 3600 * 1000),
              status: "SELESAI",
            },
          })
          .catch(() => {});
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
          ...(deskripsiKegiatan ? { deskripsiKegiatan } : {}),
          ...(fotoUrl ? { fotoUrl } : {}),
        },
      });
    } else {
      // Mulai kegiatan baru atau update dari status DI_ZONA/DALAM_RADIUS/TERJEDA
      const currentLogs = (existingSession?.jedaLogs as any[]) || [];
      if (existingSession?.status === "TERJEDA") {
        const lastLog = currentLogs.length > 0 ? currentLogs[currentLogs.length - 1] : null;
        if (lastLog && !lastLog.waktuResume) {
          lastLog.waktuResume = new Date().toISOString();
          const resumeMins = Math.max(
            existingSession.actualInZoneMinutes || 0,
            lastLog.durasiSebelumJedaMenit || 0
          );
          lastLog.durasiSebelumResumeMenit = resumeMins;
          lastLog.durasiSebelumResumeDetik = lastLog.durasiSebelumJedaDetik ?? resumeMins * 60;
        } else {
          currentLogs.push({
            alasan: "Resume Kegiatan",
            waktuResume: new Date().toISOString(),
            durasiSebelumResumeMenit: existingSession.actualInZoneMinutes || 0,
            durasiSebelumResumeDetik: (existingSession.actualInZoneMinutes || 0) * 60,
            autoTriggered: true,
          });
        }
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
          ...(deskripsiKegiatan ? { deskripsiKegiatan } : {}),
          ...(fotoUrl ? { fotoUrl } : {}),
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
          ...(deskripsiKegiatan ? { deskripsiKegiatan } : {}),
          ...(fotoUrl ? { fotoUrl } : {}),
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

    // Record into system history / audit trail
    const isResumeSession = existingSession?.status === "TERJEDA";
    if (isResumeSession) {
      auditTrailService
        .recordPresensiLanjut({
          studentId: studentUserId,
          scheduleId: schedule.id,
          scheduleTitle: schedule.title,
          kelompokName: student.kelompok?.name || schedule.kelompok?.name || "-",
          durasiSebelumResumeMenit: existingSession?.actualInZoneMinutes || 0,
          waktuResume: new Date().toISOString(),
          studentName: student.user?.name,
          nim: student.nim,
        })
        .catch((err) => console.warn("[Audit] Presensi lanjut log error:", err));
    } else {
      auditTrailService
        .recordPresensiMasuk({
          studentId: studentUserId,
          scheduleId: schedule.id,
          scheduleTitle: schedule.title,
          kelompokName: student.kelompok?.name || schedule.kelompok?.name || "-",
          kelurahan: student.kelompok?.kelurahan || "-",
          latitude,
          longitude,
          method: "GPS_ACTIVITY",
          status: attendance.status,
          deskripsiKegiatan,
          fotoUrl,
          studentName: student.user?.name,
          nim: student.nim,
        })
        .catch((err) => console.warn("[Audit] Presensi masuk log error:", err));
    }

    const durasiWajibMenit =
      ruleConfigs.attendanceMinDurationHours * 60 +
        ruleConfigs.attendanceMinDurationMinutes +
        Math.round(ruleConfigs.attendanceMinDurationSeconds / 60) || 240;

    return {
      sessionId: `SES-${schedule.id.slice(0, 8)}-${studentUserId.slice(-6)}`,
      scheduleId: schedule.id,
      namaKegiatan: schedule.title,
      jamMulai: timeRange.jamMulai,
      jamSelesai: timeRange.jamSelesai,
      durasiWajibMenit,
      attendedAt: attendance.attendedAt.toISOString(),
      lokasi: {
        alamat: matchedPosko?.alamat || schedule.location || "Lokasi Kegiatan KKN",
        latitude:
          matchedPosko?.latitude ?? (schedule.latitude ? Number(schedule.latitude) : latitude),
        longitude:
          matchedPosko?.longitude ?? (schedule.longitude ? Number(schedule.longitude) : longitude),
        radiusMeter: matchedPosko?.radius ?? (schedule.radius || 200),
        polygon: schedule.polygon || null,
      },
      matchedPosko: matchedPosko
        ? {
            id: matchedPosko.id,
            nama: matchedPosko.nama,
            alamat: matchedPosko.alamat,
            latitude: matchedPosko.latitude,
            longitude: matchedPosko.longitude,
            radius: matchedPosko.radius,
            type: matchedPosko.type,
          }
        : null,
      poskoList: groupPoskos,
      totalPosko: groupPoskos.length,
      geofenceBufferMeters: (ruleConfigs as any).attendanceGeofenceBufferMeters ?? 15,
      invalidationHours: (ruleConfigs as any).attendanceGeofenceInvalidationHours ?? 2,
      serverTimestamp: new Date().toISOString(),
      attendanceId: attendance.id,
      attendanceStatus: attendance.status,
      statusKehadiran: attendance.status,
      // Kembalikan durasi aktual yang sudah terakumulasi agar mobile tidak
      // mulai dari 0 saat resume/mulai kegiatan yang sudah berjalan sebelumnya.
      actualInZoneSeconds: calculateLiveInZoneSeconds(attendance),
      actualInZoneMinutes: calculateLiveInZoneMinutes(attendance),
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
      totalDurasiDalamZonaMenit: payload?.totalDurasiDalamZonaMenit,
    });
    return {
      ...result,
      gpsActive: false,
      statusGps: "INACTIVE",
    };
  }

  /**
   * Jeda sesi kegiatan — MANUAL oleh mahasiswa
   * Timer berhenti. Durasi aktual dibekukan pada titik ini.
   * Endpoint: POST /api/v1/kkn/kegiatan/:scheduleId/jeda
   */
  async jedaKegiatan(
    studentUserId: string,
    scheduleId: string,
    payload: {
      alasan?: string;
      totalDurasiDalamZonaMenit?: number;
      totalDurasiDalamZonaDetik?: number;
    }
  ) {
    const existing = await prisma.activityAttendance.findUnique({
      where: {
        studentId_scheduleId: { studentId: studentUserId, scheduleId },
      },
    });

    if (!existing) throw new Error("Kegiatan aktif tidak ditemukan.");

    if (existing.status !== "BERLANGSUNG" || existing.checkOutAt) {
      throw new Error(
        existing.checkOutAt ||
          ["SELESAI", "HADIR", "SELESAI_TELAT", "HADIR_MEMENUHI", "HADIR_TIDAK_MEMENUHI"].includes(
            existing.status
          )
          ? "Kegiatan sudah diselesaikan."
          : "Kegiatan tidak sedang berlangsung — tidak bisa dijeda."
      );
    }

    // Bekukan durasi aktual (SSOT backend)
    const frozenMins = calculateLiveInZoneMinutes(existing);
    const frozenSecs = calculateLiveInZoneSeconds(existing);

    const currentLogs = (existing.jedaLogs as any[]) || [];
    currentLogs.push({
      alasan: payload.alasan || "Jeda manual oleh mahasiswa",
      waktuJeda: new Date().toISOString(),
      durasiSebelumJedaMenit: frozenMins,
      durasiSebelumJedaDetik: frozenSecs,
      manualByStudent: true,
    });

    const updated = await prisma.activityAttendance.update({
      where: { id: existing.id },
      data: {
        status: "TERJEDA",
        actualInZoneMinutes: frozenMins,
        jedaLogs: currentLogs,
      },
    });

    websocketService.broadcastStudentAttendance({
      id: updated.id,
      studentId: studentUserId,
      scheduleId,
      status: "TERJEDA",
      currentStatus: "TERJEDA",
      actualInZoneMinutes: frozenMins,
      attendedAt: updated.attendedAt.toISOString(),
    });

    // Audit trail (non-blocking)
    prisma.user
      .findUnique({
        where: { id: studentUserId },
        include: { studentProfile: { include: { kelompok: true } } },
      })
      .then(async (studentUserForJeda) => {
        const schedForJeda = await prisma.schedule.findUnique({
          where: { id: scheduleId },
          select: { title: true },
        });
        auditTrailService
          .recordPresensiJeda({
            studentId: studentUserId,
            scheduleId,
            scheduleTitle: schedForJeda?.title || "Kegiatan KKN",
            kelompokName: studentUserForJeda?.studentProfile?.kelompok?.name || "-",
            alasan: payload.alasan || "Jeda manual",
            durasiSebelumJedaMenit: frozenMins,
            waktuJeda: new Date().toISOString(),
            studentName: studentUserForJeda?.name,
            nim: studentUserForJeda?.studentProfile?.nim,
          })
          .catch((err) => console.warn("[Audit] Presensi jeda log error:", err));
      })
      .catch(() => {});

    return updated;
  }

  /**
   * Lanjutkan sesi kegiatan dari status TERJEDA → BERLANGSUNG.
   * Mahasiswa WAJIB berada di dalam zona geofence untuk melanjutkan.
   * Endpoint: POST /api/v1/kkn/kegiatan/:id/lanjut
   */
  async lanjutKegiatan(
    studentUserId: string,
    scheduleId: string,
    payload: {
      latitude: number;
      longitude: number;
    }
  ) {
    const { latitude, longitude } = payload;

    const existing = await prisma.activityAttendance.findUnique({
      where: {
        studentId_scheduleId: {
          studentId: studentUserId,
          scheduleId,
        },
      },
      include: { schedule: true },
    });

    if (!existing) {
      throw new Error("Kegiatan aktif tidak ditemukan.");
    }

    if (existing.status !== "TERJEDA") {
      throw new Error("Hanya sesi dengan status TERJEDA yang dapat dilanjutkan.");
    }

    if (Boolean(existing.checkOutAt)) {
      throw new Error("Kegiatan sudah diselesaikan.");
    }

    // Validasi Geofence: Mahasiswa WAJIB berada di dalam zona untuk melanjutkan sesi
    const ruleConfigs = await configService.getRuleEngineConfigs();
    const bufferMeters = (ruleConfigs as any).attendanceGeofenceBufferMeters ?? 25;

    const student = await prisma.studentKkn.findUnique({
      where: { userId: studentUserId },
      include: { kelompok: true },
    });
    const kelompokIdToCheck = student?.kelompokId;
    const groupPoskos = kelompokIdToCheck ? await getGroupPoskoList(kelompokIdToCheck) : [];
    const geofence = await buildGeofence(existing.schedule);

    let isInside = false;
    let nearestDist = 999999;
    let nearestRadius = 500;
    let nearestName = "Posko KKN";

    // 1. Cek multi-posko kelompok
    if (groupPoskos.length > 0) {
      for (const gp of groupPoskos) {
        const d = calculateDistance(latitude, longitude, gp.latitude, gp.longitude);
        if (d < nearestDist) {
          nearestDist = d;
          nearestRadius = gp.radius;
          nearestName = gp.nama;
        }
        if (d <= gp.radius + bufferMeters) {
          isInside = true;
          break;
        }
      }
    }

    // 2. Cek geofence jadwal
    if (!isInside) {
      const dist = calculateDistance(latitude, longitude, geofence.latitude, geofence.longitude);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestRadius = geofence.radius;
        nearestName = existing.schedule?.title || "Posko Utama";
      }
      if (geofence.polygon && Array.isArray(geofence.polygon) && geofence.polygon.length >= 3) {
        const polyPoints = (geofence.polygon as any[]).map((p) => {
          const val0 = Number(p[0]);
          const val1 = Number(p[1]);
          return { lat: Math.abs(val0) > 45 ? val1 : val0, lng: Math.abs(val0) > 45 ? val0 : val1 };
        });
        isInside =
          isPointInPolygonWithBuffer({ lat: latitude, lng: longitude }, polyPoints, bufferMeters) ||
          dist <= geofence.radius + bufferMeters;
      } else {
        isInside = dist <= geofence.radius + bufferMeters;
      }
    }

    // 3. Smart zone fallback
    if (!isInside && kelompokIdToCheck) {
      try {
        const szResult = await smartZoneService.isStudentInGroupZone(
          latitude,
          longitude,
          kelompokIdToCheck,
          bufferMeters
        );
        if (szResult.isInside) {
          isInside = true;
        }
        if (szResult.distanceToNearest < nearestDist) {
          nearestDist = szResult.distanceToNearest;
          nearestName = szResult.nearestPoskoName || nearestName;
        }
      } catch {}
    }

    if (!isInside) {
      const distanceInt = Math.round(nearestDist);
      const allowedRadius = nearestRadius + bufferMeters;
      throw new Error(
        `OUT_OF_GEOFENCE: Anda harus berada di dalam zona ${nearestName} untuk melanjutkan sesi (Jarak: ${distanceInt}m, Radius: ${allowedRadius}m).`
      );
    }

    // Resume: TERJEDA → BERLANGSUNG
    const currentLogs = (existing.jedaLogs as any[]) || [];
    const lastJeda = currentLogs.length > 0 ? currentLogs[currentLogs.length - 1] : null;
    if (lastJeda && !lastJeda.waktuResume) {
      lastJeda.waktuResume = new Date().toISOString();
      lastJeda.durasiSebelumResumeMenit = existing.actualInZoneMinutes || 0;
    }

    const updated = await prisma.activityAttendance.update({
      where: { id: existing.id },
      data: {
        status: "BERLANGSUNG",
        jedaLogs: currentLogs,
      },
    });

    try {
      websocketService.broadcastStudentAttendance({
        id: updated.id,
        studentId: studentUserId,
        scheduleId,
        status: "BERLANGSUNG",
        currentStatus: "DI_ZONA",
        actualInZoneMinutes: existing.actualInZoneMinutes || 0,
        attendedAt: existing.attendedAt.toISOString(),
      });
    } catch {}

    return {
      success: true,
      message: "Sesi kegiatan berhasil dilanjutkan.",
      data: {
        id: updated.id,
        status: updated.status,
        actualInZoneMinutes: updated.actualInZoneMinutes,
        attendedAt: updated.attendedAt?.toISOString(),
      },
    };
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

    // Record into system history / audit trail
    auditTrailService
      .recordPresensiPelanggaranZona({
        studentId: studentUserId,
        scheduleId,
        scheduleTitle: schedule?.title || "Kegiatan KKN",
        kelompokName: student?.kelompok?.name || schedule?.kelompok?.name || "-",
        outOfZoneMinutes,
        pointsDeducted: penaltyPoints,
        studentName: student?.user?.name,
        nim: student?.nim,
      })
      .catch((err) => console.warn("[Audit] Pelanggaran zona log error:", err));

    return {
      success: true,
      message: "Pelanggaran zona tercatat. Poin dipotong.",
      pointsDeducted: penaltyPoints,
    };
  }

  /**
   * Lanjut setelah jeda — MANUAL oleh mahasiswa
   * Timer dilanjutkan dari titik berhenti (jedaLogs terakhir mendapat waktuResume).
   * Endpoint: POST /api/v1/kkn/kegiatan/:scheduleId/lanjut
   */

  async autoCheckOutEndedSchedules() {
    try {
      const activeAttendances = await prisma.activityAttendance.findMany({
        where: {
          status: { in: ["BERLANGSUNG", "DI_ZONA", "DALAM_RADIUS", "TERJEDA"] },
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
      const todayWibStr = nowWib.toISOString().slice(0, 10);

      for (const att of activeAttendances) {
        if (!att.schedule || !att.schedule.time) continue;

        // Guard 1: Jangan auto-checkout sesi yang baru saja dimulai (< 15 menit)
        if (att.attendedAt) {
          const sessionStartMs = new Date(att.attendedAt).getTime();
          const elapsedMins = (nowUtc.getTime() - sessionStartMs) / (60 * 1000);
          if (elapsedMins < 15) {
            continue;
          }
        }

        const timeRange = parseScheduleTimeRange(att.schedule.time);
        const endMins = timeRange.endMinutesTotal;

        // Guard 2: Jika format jam overnight atau rentang tidak valid (end <= start), jangan auto checkout di siang hari
        if (timeRange.isOvernight || endMins <= timeRange.startMinutesTotal) {
          continue;
        }

        // Guard 3: Periksa tanggal jadwal terhadap hari ini
        let isPastDate = false;
        if (att.schedule.date) {
          const schedWibStr = new Date(new Date(att.schedule.date).getTime() + 7 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);
          if (schedWibStr > todayWibStr) {
            // Jadwal untuk hari depan, abaikan
            continue;
          }
          if (schedWibStr < todayWibStr) {
            isPastDate = true;
          }
        }

        // Kebijakan Fleksibilitas Jam Pulang (Tidak Terpatok 16:00):
        // Jam pulang tidak diputus otomatis di jam 16:00. Mahasiswa dapat beraktivitas fleksibel.
        // Auto-checkout hanya mengeksekusi sesi yang tersangkut dari hari sebelumnya (isPastDate)
        // atau saat pergantian hari di penghujung malam (>= 23:50 WIB).
        const isEndOfDayCutoff = currentMins >= 23 * 60 + 50;

        if (isPastDate || isEndOfDayCutoff) {
          console.log(
            `[AutoCheckout] Melakukan checkout otomatis pergantian hari untuk Mahasiswa ${att.student.name} pada jadwal ${att.schedule.title}`
          );

          await this.checkOutAttendance({
            studentId: att.studentId,
            scheduleId: att.scheduleId,
          });

          // Notifikasi Database
          await prisma.notification
            .create({
              data: {
                userId: att.studentId,
                title: "Kegiatan Selesai ✅",
                message: `Kegiatan ${att.schedule.title} telah usai. Sistem telah mencatat jam kepulangan Anda secara otomatis.`,
              },
            })
            .catch(() => {});

          // Notifikasi Push FCM
          if (att.student.fcmToken) {
            await notificationIntegrationService
              .sendPushNotification(
                att.student.fcmToken,
                "Kegiatan Selesai ✅",
                `Kegiatan ${att.schedule.title} usai. Checkout berhasil otomatis.`
              )
              .catch(() => {});
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

    if (
      attendance.status === "HADIR_MEMENUHI" ||
      attendance.status === "HADIR_TIDAK_MEMENUHI" ||
      attendance.status === "SELESAI_TELAT" ||
      attendance.status === "HADIR" ||
      attendance.status === "SELESAI" ||
      Boolean(jamPulang)
    ) {
      if (attendance.status === "SELESAI_TELAT") {
        finalStatus = "HADIR_TIDAK_MEMENUHI";
        statusDisplay = "Hadir & Tidak Memenuhi";
      } else {
        finalStatus = isMemenuhiDurasi ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI";
        statusDisplay = isMemenuhiDurasi ? "Hadir & Memenuhi" : "Hadir & Tidak Memenuhi";
      }
    }

    const jedaMins = calculateTotalJedaMinutes(attendance as any);
    const jedaFormatted = formatDurasiMenitIndo(jedaMins);

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
      durasiJedaMenit: jedaMins,
      durasiJedaFormatted: jedaFormatted,
      durasiTargetMenit: targetDurationMinutes,
      durasiAktualDetik: durasiAktualMenit * 60,
      durasiTargetDetik: targetDurationMinutes * 60,
      isHadir:
        ["HADIR", "SELESAI", "SELESAI_TELAT", "HADIR_MEMENUHI", "HADIR_TIDAK_MEMENUHI"].includes(
          attendance.status
        ) || Boolean(jamPulang),
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
      const dplUser = await prisma.user.findUnique({
        where: { id: params.dplUserId },
        select: { id: true, name: true, nip: true, phone: true },
      });
      const dplOr: any[] = [{ dplId: params.dplUserId }, { dpl: { id: params.dplUserId } }];
      if (dplUser?.name)
        dplOr.push({ dplNamaMentah: { equals: dplUser.name.trim(), mode: "insensitive" } });
      if (dplUser?.nip) dplOr.push({ dpl: { nip: dplUser.nip } });
      if (dplUser?.phone) dplOr.push({ dpl: { phone: dplUser.phone } });

      const dplGroups = await prisma.kelompokKkn.findMany({
        where: { OR: dplOr },
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
      // Query aggregated stats without pagination (with student profile for student-level accumulation)
      prisma.activityAttendance.findMany({
        where,
        select: {
          studentId: true,
          status: true,
          actualInZoneMinutes: true,
          attendedAt: true,
          checkOutAt: true,
          jedaLogs: true,
          student: {
            select: {
              id: true,
              name: true,
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
                      dpl: { select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const ruleConfigs = await configService.getRuleEngineConfigs().catch(() => null);
    const minHours = Number(
      ruleConfigs?.attendanceMinDurationHours || ruleConfigs?.targetHarianJam || 4
    );
    const targetMinMenit = minHours * 60;

    // Calculate aggregated summary and per-student cumulative stats
    let hadirMemenuhiCount = 0;
    let hadirKurangCount = 0;
    let berlangsungCount = 0;
    let terjedaCount = 0;
    let izinSakitCount = 0;
    let totalMenitKumulatif = 0;

    const studentAggMap = new Map<string, any>();

    for (const r of allSummaryRecords) {
      const st = String(r.status || "").toUpperCase();
      const jedaLogsArr = (r.jedaLogs as any[]) || [];
      const isPaused =
        st === "TERJEDA" ||
        (jedaLogsArr.length > 0 &&
          jedaLogsArr[jedaLogsArr.length - 1]?.waktuJeda &&
          !jedaLogsArr[jedaLogsArr.length - 1]?.waktuResume);

      let mins = Math.min(480, Math.max(0, r.actualInZoneMinutes ?? 0));
      if (st === "BERLANGSUNG" && !r.checkOutAt && r.attendedAt) {
        mins = calculateLiveInZoneMinutes(r);
      } else if (isPaused || jedaLogsArr.length > 0) {
        const liveCapped = calculateLiveInZoneMinutes(r);
        mins = Math.min(mins, liveCapped);
      } else if (mins === 0 && r.attendedAt && r.checkOutAt && r.actualInZoneMinutes === null) {
        const diff = Math.floor((r.checkOutAt.getTime() - r.attendedAt.getTime()) / 60000);
        mins = Math.min(480, Math.max(0, diff));
      }

      totalMenitKumulatif += mins;

      const isFinishedSummary =
        Boolean(r.checkOutAt) ||
        ["HADIR_MEMENUHI", "HADIR_TIDAK_MEMENUHI", "HADIR", "SELESAI", "SELESAI_TELAT"].includes(
          st
        );

      if (isFinishedSummary) {
        if (st === "SELESAI_TELAT" || mins < targetMinMenit) {
          hadirKurangCount++;
        } else {
          hadirMemenuhiCount++;
        }
      } else if (st === "BERLANGSUNG" || st === "DALAM_RADIUS" || st === "DI_ZONA") {
        berlangsungCount++;
      } else if (st === "TERJEDA") {
        terjedaCount++;
      } else if (st.includes("IZIN") || st.includes("SAKIT")) {
        izinSakitCount++;
      }

      // Group per student for cumulative reporting
      const sId = r.studentId;
      if (!studentAggMap.has(sId)) {
        const kknGroup = r.student?.studentProfile?.kelompok;
        studentAggMap.set(sId, {
          studentId: sId,
          namaMahasiswa: r.student?.name || "Mahasiswa",
          nim: r.student?.studentProfile?.nim || "-",
          jurusan: r.student?.studentProfile?.jurusan || "-",
          fotoProfil: r.student?.fotoProfil || null,
          isKetua: r.student?.studentProfile?.isKetua || false,
          kelompok: kknGroup
            ? {
                id: kknGroup.id,
                name: kknGroup.name,
                kelurahan: kknGroup.kelurahan,
                dplName: (kknGroup as any).dpl?.name || "-",
              }
            : null,
          totalSessions: 0,
          totalMinutes: 0,
          hadirMemenuhi: 0,
          hadirKurang: 0,
          berlangsung: 0,
          terjeda: 0,
          izinSakit: 0,
        });
      }

      const agg = studentAggMap.get(sId)!;
      agg.totalSessions++;
      agg.totalMinutes += mins;
      if (isFinishedSummary) {
        if (st === "SELESAI_TELAT" || mins < targetMinMenit) {
          agg.hadirKurang++;
        } else {
          agg.hadirMemenuhi++;
        }
      } else if (st === "BERLANGSUNG" || st === "DALAM_RADIUS" || st === "DI_ZONA")
        agg.berlangsung++;
      else if (st === "TERJEDA") agg.terjeda++;
      else if (st.includes("IZIN") || st.includes("SAKIT")) agg.izinSakit++;
    }

    const studentAggregates = Array.from(studentAggMap.values())
      .map((agg) => {
        const hours = Math.floor(agg.totalMinutes / 60);
        const mins = agg.totalMinutes % 60;
        const totalFormatted =
          hours === 0
            ? `${mins} Menit`
            : mins === 0
              ? `${hours} Jam`
              : `${hours} Jam ${mins} Menit`;
        const avgMins = Math.round(agg.totalMinutes / (agg.totalSessions || 1));
        const avgHours = Math.floor(avgMins / 60);
        const avgRemainderMins = avgMins % 60;
        const avgFormatted =
          avgHours === 0
            ? `${avgRemainderMins} Menit`
            : avgRemainderMins === 0
              ? `${avgHours} Jam`
              : `${avgHours} Jam ${avgRemainderMins} Menit`;

        return {
          ...agg,
          totalHours: Math.round((agg.totalMinutes / 60) * 10) / 10,
          totalFormatted,
          avgMinutesPerDay: avgMins,
          avgFormatted,
        };
      })
      .sort((a, b) => b.totalMinutes - a.totalMinutes);

    const items = records.map((att) => {
      const st = String(att.status || "").toUpperCase();
      const jedaLogsArr = (att.jedaLogs as any[]) || [];
      const isPaused =
        st === "TERJEDA" ||
        (jedaLogsArr.length > 0 &&
          jedaLogsArr[jedaLogsArr.length - 1]?.waktuJeda &&
          !jedaLogsArr[jedaLogsArr.length - 1]?.waktuResume);

      const isLeaveOrAlpha =
        st.includes("IZIN") ||
        st.includes("SAKIT") ||
        st.includes("ALPA") ||
        st.includes("ALPHA") ||
        !att.attendedAt;

      let actualMins = isLeaveOrAlpha
        ? 0
        : Math.min(480, Math.max(0, att.actualInZoneMinutes ?? 0));
      if (!isLeaveOrAlpha) {
        if (st === "BERLANGSUNG" && !att.checkOutAt && att.attendedAt) {
          const liveMins = calculateLiveInZoneMinutes(att);
          actualMins = actualMins > 0 ? actualMins : liveMins;
        } else if (isPaused || jedaLogsArr.length > 0) {
          const liveCapped = calculateLiveInZoneMinutes(att);
          actualMins = Math.min(actualMins, liveCapped);
        } else if (
          actualMins === 0 &&
          att.attendedAt &&
          att.checkOutAt &&
          att.actualInZoneMinutes === null
        ) {
          const diff = Math.floor((att.checkOutAt.getTime() - att.attendedAt.getTime()) / 60000);
          actualMins = Math.min(480, Math.max(0, diff));
        }
      }

      const isFinishedItem =
        Boolean(att.checkOutAt) ||
        ["HADIR_MEMENUHI", "HADIR_TIDAK_MEMENUHI", "HADIR", "SELESAI", "SELESAI_TELAT"].includes(
          st
        );

      const isMemenuhi = isFinishedItem && st !== "SELESAI_TELAT" && actualMins >= targetMinMenit;

      let statusDisplay = att.status;
      let computedStatus = att.status;
      if (isFinishedItem) {
        if (st === "SELESAI_TELAT" || !isMemenuhi) {
          computedStatus = "HADIR_TIDAK_MEMENUHI";
          statusDisplay = "Hadir & Tidak Memenuhi";
        } else {
          computedStatus = "HADIR_MEMENUHI";
          statusDisplay = "Hadir & Memenuhi";
        }
      } else if (st === "BERLANGSUNG") {
        statusDisplay = "Sedang di Lapangan";
      } else if (st === "TERJEDA") {
        statusDisplay = "Terjeda";
      } else if (st.includes("SAKIT")) {
        statusDisplay = "Sakit (Disetujui)";
      } else if (st.includes("IZIN")) {
        statusDisplay = "Izin (Disetujui)";
      } else if (st.includes("ALPA") || st.includes("ALPHA")) {
        statusDisplay = "Tanpa Keterangan";
      }

      const hours = Math.floor(actualMins / 60);
      const mins = actualMins % 60;
      const durasiFormatted =
        hours === 0 ? `${mins} Menit` : mins === 0 ? `${hours} Jam` : `${hours} Jam ${mins} Menit`;

      const jedaMins = isLeaveOrAlpha ? 0 : calculateTotalJedaMinutes(att as any);
      const jedaFormatted = formatDurasiMenitIndo(jedaMins);

      const kknGroup = att.student?.studentProfile?.kelompok || att.schedule?.kelompok;

      return {
        id: att.id,
        studentId: att.studentId,
        namaMahasiswa: att.student?.name || "Mahasiswa",
        nim: att.student?.studentProfile?.nim ?? "-",
        jurusan: att.student?.studentProfile?.jurusan ?? "-",
        fotoProfil: att.student?.fotoProfil ?? null,
        isKetua: att.student?.studentProfile?.isKetua ?? false,
        kelompok: kknGroup
          ? {
              id: kknGroup.id,
              name: kknGroup.name,
              kelurahan: kknGroup.kelurahan,
              dplName: (kknGroup as any).dpl?.name ?? "-",
            }
          : null,
        scheduleId: att.scheduleId,
        namaKegiatan: att.schedule?.title ?? "Kegiatan Harian Lapangan",
        tanggal: att.attendedAt
          ? new Date(att.attendedAt.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
          : "-",
        jamMasuk: att.attendedAt
          ? new Date(att.attendedAt.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(11, 16)
          : "-",
        jamPulang: att.checkOutAt
          ? new Date(att.checkOutAt.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(11, 16)
          : "-",
        durasiMenit: actualMins,
        durasiFormatted,
        durasiAktualMenit: actualMins,
        durasiAktualFormatted: durasiFormatted,
        durasiJedaMenit: jedaMins,
        durasiJedaFormatted: jedaFormatted,
        targetMinMenit,
        rasioKehadiran: Math.min(
          100,
          Math.max(0, Number(((actualMins / targetMinMenit) * 100).toFixed(1)))
        ),
        status: computedStatus,
        statusDisplay,
        isMemenuhiDurasi: isMemenuhi,
        deskripsiKegiatan: (att as any).deskripsiKegiatan ?? null,
        fotoUrl: (att as any).fotoUrl ?? null,
        latitude: att.latitude ? Number(att.latitude) : null,
        longitude: att.longitude ? Number(att.longitude) : null,
        method: att.method,
        jedaLogs: jedaLogsArr,
      };
    });

    const totalMahasiswaCount = studentAggregates.length;
    const avgJamPerMahasiswa =
      totalMahasiswaCount > 0
        ? Math.round((totalMenitKumulatif / 60 / totalMahasiswaCount) * 10) / 10
        : 0;

    return {
      summary: {
        totalPresensi: total,
        totalMahasiswa: totalMahasiswaCount,
        hadirMemenuhi: hadirMemenuhiCount,
        hadirKurang: hadirKurangCount,
        berlangsung: berlangsungCount,
        terjeda: terjedaCount,
        izinSakit: izinSakitCount,
        totalJamKumulatif: Math.round((totalMenitKumulatif / 60) * 10) / 10,
        totalMenitKumulatif,
        avgJamPerMahasiswa,
      },
      studentAggregates,
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Menandai jadwal kegiatan KKN sebagai TIDAK_ADA_KEGIATAN (Skip Kegiatan)
   * Hanya diizinkan untuk DPL kelompok, Ketua Kelompok (isKetua = true), atau Super User/Admin.
   * Endpoint: POST /api/v1/kkn/kegiatan/:id/skip
   */
  async skipKegiatan(
    userId: string,
    userRole: string,
    scheduleId: string,
    payload: { alasan?: string }
  ) {
    const alasan = payload?.alasan?.trim() || "Tidak ada kegiatan";

    // 1. Cari jadwal kegiatan
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        kelompok: {
          include: {
            dpl: true,
            students: true,
          },
        },
        attendances: true,
      },
    });

    if (!schedule) {
      throw new Error("NOT_FOUND: Jadwal kegiatan tidak ditemukan.");
    }

    // 2. Validasi RBAC
    const superRoles = ["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "PANITIA_TASKFORCE", "PEMIMPIN"];
    const isSuperUser = superRoles.includes(userRole);
    const isDpl = userRole === "DPL" || userRole === "DOSEN_PEMBIMBING";
    const isMahasiswa = userRole === "MAHASISWA_KKN" || userRole === "MAHASISWA";

    let hasPermission = false;

    if (isSuperUser) {
      hasPermission = true;
    } else if (isDpl) {
      // DPL kelompok bersangkutan (atau jika kelompokId null, boleh)
      if (!schedule.kelompokId || (schedule.kelompok && schedule.kelompok.dplId === userId)) {
        hasPermission = true;
      }
    } else if (isMahasiswa) {
      // Periksa apakah mahasiswa ini adalah ketua kelompok untuk kelompok jadwal ini
      const student = await prisma.studentKkn.findUnique({
        where: { userId },
      });

      if (
        student &&
        student.isKetua &&
        (!schedule.kelompokId || student.kelompokId === schedule.kelompokId)
      ) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      throw new Error("FORBIDDEN: Anda tidak memiliki izin untuk melewati kegiatan ini.");
    }

    // 3. Validasi Concurrency / Status Kegiatan
    // Jika kegiatan sudah dimulai oleh mahasiswa manapun (BERLANGSUNG, DI_ZONA, DALAM_RADIUS, HADIR_MEMENUHI, HADIR_TIDAK_MEMENUHI, HADIR, SELESAI, SELESAI_TELAT)
    const activeAttendance = schedule.attendances.find((att) => {
      const st = (att.status || "").toUpperCase();
      return (
        st === "BERLANGSUNG" ||
        st === "DI_ZONA" ||
        st === "DALAM_RADIUS" ||
        st === "HADIR_MEMENUHI" ||
        st === "HADIR_TIDAK_MEMENUHI" ||
        st === "HADIR" ||
        st === "SELESAI" ||
        st === "SELESAI_TELAT"
      );
    });

    if (activeAttendance) {
      throw new Error("CONFLICT: Tidak dapat skip kegiatan yang sudah dimulai.");
    }

    // 4. Dapatkan daftar mahasiswa anggota kelompok yang terdampak
    let targetStudents: { userId: string }[] = [];
    if (schedule.kelompokId) {
      targetStudents = await prisma.studentKkn.findMany({
        where: { kelompokId: schedule.kelompokId },
        select: { userId: true },
      });
    } else {
      targetStudents = [{ userId }];
    }

    if (targetStudents.length === 0) {
      targetStudents = [{ userId }];
    }

    const ditandaiPada = new Date();
    const skipMetadata = {
      skippedBy: userId,
      skippedAt: ditandaiPada.toISOString(),
      alasan,
    };

    // 5. Bulk Upsert Presensi untuk seluruh anggota kelompok
    for (const student of targetStudents) {
      await prisma.activityAttendance.upsert({
        where: {
          studentId_scheduleId: {
            studentId: student.userId,
            scheduleId: schedule.id,
          },
        },
        create: {
          studentId: student.userId,
          scheduleId: schedule.id,
          method: "SKIP_KEGIATAN",
          latitude: schedule.latitude ? Number(schedule.latitude) : 0,
          longitude: schedule.longitude ? Number(schedule.longitude) : 0,
          status: "TIDAK_ADA_KEGIATAN",
          actualInZoneMinutes: 0,
          deskripsiKegiatan: alasan,
          jedaLogs: skipMetadata,
          attendedAt: ditandaiPada,
        },
        update: {
          method: "SKIP_KEGIATAN",
          status: "TIDAK_ADA_KEGIATAN",
          actualInZoneMinutes: 0,
          deskripsiKegiatan: alasan,
          jedaLogs: skipMetadata,
        },
      });
    }

    // 5.1. Update status_kegiatan dan detail_skip pada model Schedule
    try {
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: {
          statusKegiatan: "TIDAK_ADA_KEGIATAN",
          detailSkip: skipMetadata,
        },
      });
    } catch {
      // Non-blocking fallback jika schema belum dimigrasi di db lokal
    }

    // 6. Audit Trail Logging
    try {
      await auditTrailService.recordAudit({
        userId,
        roleName: userRole,
        action: "SKIP_KEGIATAN_KKN",
        featureCategory: "Presensi KKN",
        endpoint: `/api/v1/kkn/kegiatan/${schedule.id}/skip`,
        newValue: {
          scheduleId: schedule.id,
          scheduleTitle: schedule.title,
          kelompokId: schedule.kelompokId,
          totalMahasiswaTerdampak: targetStudents.length,
          alasan,
          status: "TIDAK_ADA_KEGIATAN",
        },
      });
    } catch {
      // Non-blocking audit failure
    }

    return {
      kegiatanId: schedule.id,
      jadwalId: schedule.id,
      statusKegiatan: "TIDAK_ADA_KEGIATAN",
      totalMahasiswaTerdampak: targetStudents.length,
      alasan,
      ditandaiOleh: userId,
      ditandaiPada: ditandaiPada.toISOString(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CRUD & MANIPULASI PRESENSI MAHASISWA (Admin, DPL, Super User, Developer)
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Manual Create Presensi Mahasiswa
   */
  async createAttendanceManual(authorUserId: string, authorRole: string, payload: any) {
    const {
      studentId,
      scheduleId,
      attendedAt,
      checkOutAt,
      status,
      actualInZoneMinutes,
      deskripsiKegiatan,
      fotoUrl,
      method = "MANUAL_ADMIN",
      latitude = -6.8903,
      longitude = 107.611,
    } = payload;

    if (!studentId || !scheduleId) {
      throw new Error("studentId dan scheduleId wajib diisi");
    }

    const startDateTime = attendedAt ? new Date(attendedAt) : new Date();
    const endDateTime = checkOutAt ? new Date(checkOutAt) : null;

    let calculatedMinutes = actualInZoneMinutes !== undefined ? Number(actualInZoneMinutes) : null;
    if (calculatedMinutes === null && endDateTime && startDateTime) {
      calculatedMinutes = Math.max(
        0,
        Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 60000)
      );
    }

    const finalStatus =
      status ||
      (endDateTime
        ? calculatedMinutes && calculatedMinutes >= 240
          ? "HADIR_MEMENUHI"
          : "HADIR_TIDAK_MEMENUHI"
        : "BERLANGSUNG");

    const record = await prisma.activityAttendance.upsert({
      where: {
        studentId_scheduleId: {
          studentId,
          scheduleId,
        },
      },
      create: {
        studentId,
        scheduleId,
        attendedAt: startDateTime,
        checkOutAt: endDateTime,
        status: finalStatus,
        actualInZoneMinutes: calculatedMinutes,
        deskripsiKegiatan: deskripsiKegiatan || null,
        fotoUrl: fotoUrl || null,
        method,
        latitude: Number(latitude),
        longitude: Number(longitude),
        jedaLogs: {
          createdManuallyBy: authorUserId,
          createdAt: new Date().toISOString(),
        },
      },
      update: {
        attendedAt: startDateTime,
        checkOutAt: endDateTime,
        status: finalStatus,
        actualInZoneMinutes: calculatedMinutes,
        deskripsiKegiatan: deskripsiKegiatan || undefined,
        fotoUrl: fotoUrl || undefined,
        method,
      },
      include: {
        student: { select: { id: true, name: true, phone: true } },
        schedule: { select: { id: true, title: true, time: true, date: true } },
      },
    });

    try {
      await auditTrailService.recordAudit({
        userId: authorUserId,
        roleName: authorRole,
        action: "CREATE_MANUAL_PRESENSI_KKN",
        featureCategory: "Presensi KKN",
        endpoint: `/api/v1/kkn-attendance/manual`,
        newValue: {
          recordId: record.id,
          studentId,
          scheduleId,
          status: finalStatus,
          actualInZoneMinutes: calculatedMinutes,
        },
      });
    } catch {}

    return record;
  }

  /**
   * Get Detail Presensi By ID
   */
  async getAttendanceById(id: string) {
    const record = await prisma.activityAttendance.findUnique({
      where: { id },
      include: {
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
            kelompok: { select: { id: true, name: true, kelurahan: true } },
          },
        },
      },
    });

    if (!record) {
      throw new Error("Data presensi tidak ditemukan");
    }

    return record;
  }

  /**
   * Update / Manipulasi Presensi (Ubah Jam Masuk, Jam Pulang, Durasi Menit, Status Terjeda -> Selesai)
   */
  async updateAttendanceAdmin(id: string, authorUserId: string, authorRole: string, payload: any) {
    const existing = await prisma.activityAttendance.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Data presensi tidak ditemukan");
    }

    const updateData: any = {};

    if (payload.attendedAt !== undefined) {
      updateData.attendedAt = payload.attendedAt
        ? new Date(payload.attendedAt)
        : existing.attendedAt;
    }
    if (payload.checkOutAt !== undefined) {
      updateData.checkOutAt = payload.checkOutAt ? new Date(payload.checkOutAt) : null;
    }
    if (payload.status !== undefined && payload.status !== null) {
      updateData.status = String(payload.status).toUpperCase();
    }
    if (payload.actualInZoneMinutes !== undefined && payload.actualInZoneMinutes !== null) {
      updateData.actualInZoneMinutes = Number(payload.actualInZoneMinutes);
    } else if (payload.checkOutAt && updateData.attendedAt) {
      // Auto recalculate duration if checkOutAt updated but minutes not explicitly passed
      const diffMins = Math.floor(
        (new Date(payload.checkOutAt).getTime() -
          new Date(updateData.attendedAt || existing.attendedAt).getTime()) /
          60000
      );
      if (diffMins >= 0 && updateData.actualInZoneMinutes === undefined) {
        updateData.actualInZoneMinutes = diffMins;
      }
    }

    if (payload.deskripsiKegiatan !== undefined) {
      updateData.deskripsiKegiatan = payload.deskripsiKegiatan;
    }
    if (payload.fotoUrl !== undefined) {
      updateData.fotoUrl = payload.fotoUrl;
    }
    if (payload.method !== undefined) {
      updateData.method = payload.method;
    }
    if (payload.clearJedaLogs === true) {
      updateData.jedaLogs = {
        clearedBy: authorUserId,
        clearedAt: new Date().toISOString(),
      };
    } else if (payload.jedaLogs !== undefined) {
      updateData.jedaLogs = payload.jedaLogs;
    }

    const updated = await prisma.activityAttendance.update({
      where: { id },
      data: updateData,
      include: {
        student: { select: { id: true, name: true, phone: true } },
        schedule: { select: { id: true, title: true, time: true, date: true } },
      },
    });

    try {
      await auditTrailService.recordAudit({
        userId: authorUserId,
        roleName: authorRole,
        action: "UPDATE_PRESENSI_KKN_ADMIN",
        featureCategory: "Presensi KKN",
        endpoint: `/api/v1/kkn-attendance/${id}`,
        oldValue: {
          attendedAt: existing.attendedAt,
          checkOutAt: existing.checkOutAt,
          status: existing.status,
          actualInZoneMinutes: existing.actualInZoneMinutes,
        },
        newValue: updateData,
      });
    } catch {}

    return updated;
  }

  /**
   * Delete Record Presensi
   */
  async deleteAttendanceAdmin(id: string, authorUserId: string, authorRole: string) {
    const existing = await prisma.activityAttendance.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Data presensi tidak ditemukan");
    }

    await prisma.activityAttendance.delete({ where: { id } });

    try {
      await auditTrailService.recordAudit({
        userId: authorUserId,
        roleName: authorRole,
        action: "DELETE_PRESENSI_KKN_ADMIN",
        featureCategory: "Presensi KKN",
        endpoint: `/api/v1/kkn-attendance/${id}`,
        oldValue: {
          id: existing.id,
          studentId: existing.studentId,
          scheduleId: existing.scheduleId,
          status: existing.status,
          attendedAt: existing.attendedAt,
        },
      });
    } catch {}

    return { id, success: true, message: "Data presensi berhasil dihapus" };
  }

  /**
   * Force Checkout untuk sesi presensi yang Terjeda / Menggantung / Belum Selesai
   */
  async forceCheckoutAttendance(
    id: string,
    authorUserId: string,
    authorRole: string,
    payload?: any
  ) {
    const existing = await prisma.activityAttendance.findUnique({
      where: { id },
      include: { schedule: true, student: true },
    });
    if (!existing) {
      throw new Error("Data presensi tidak ditemukan");
    }

    const checkOutTime = payload?.checkOutAt ? new Date(payload.checkOutAt) : new Date();
    let finalMinutes =
      payload?.actualInZoneMinutes !== undefined ? Number(payload.actualInZoneMinutes) : null;

    if (finalMinutes === null) {
      if (existing.actualInZoneMinutes && existing.actualInZoneMinutes > 0) {
        finalMinutes = existing.actualInZoneMinutes;
      } else if (existing.attendedAt) {
        finalMinutes = Math.max(
          0,
          Math.floor((checkOutTime.getTime() - new Date(existing.attendedAt).getTime()) / 60000)
        );
      } else {
        finalMinutes = 240;
      }
    }

    const targetMinutes = existing.schedule
      ? await getScheduleTargetDurationMinutes(existing.schedule)
      : 240;
    const finalStatus =
      payload?.status ||
      (finalMinutes >= targetMinutes ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI");

    const updated = await prisma.activityAttendance.update({
      where: { id },
      data: {
        checkOutAt: checkOutTime,
        status: finalStatus,
        actualInZoneMinutes: finalMinutes,
        jedaLogs: {
          forcedCheckoutBy: authorUserId,
          forcedCheckoutAt: new Date().toISOString(),
          previousStatus: existing.status,
          alasan: payload?.alasan || "Force Checkout Sesi Terjeda oleh Admin/DPL",
        },
      },
      include: {
        student: { select: { id: true, name: true, phone: true } },
        schedule: { select: { id: true, title: true, time: true, date: true } },
      },
    });

    try {
      await auditTrailService.recordAudit({
        userId: authorUserId,
        roleName: authorRole,
        action: "FORCE_CHECKOUT_PRESENSI_KKN",
        featureCategory: "Presensi KKN",
        endpoint: `/api/v1/kkn-attendance/${id}/force-checkout`,
        oldValue: {
          status: existing.status,
          checkOutAt: existing.checkOutAt,
          actualInZoneMinutes: existing.actualInZoneMinutes,
        },
        newValue: {
          status: finalStatus,
          checkOutAt: checkOutTime,
          actualInZoneMinutes: finalMinutes,
        },
      });
    } catch {}

    return updated;
  }

  /**
   * Evaluasi & Penandaan Otomatis ALPHA (Tanpa Keterangan) untuk Hari Kerja (Senin - Jumat)
   * Berlaku jika pada hari kerja terdapat jadwal posko aktif dan mahasiswa:
   * 1. Tidak ada presensi kegiatan (ActivityAttendance / PresensiMandiri)
   * 2. Tidak ada pengajuan izin/sakit yang disetujui (StudentLeaveRequest)
   * 3. Tidak ada pembuatan logbook (LogbookKkn)
   *
   * Hari Sabtu dan Minggu (Weekend) DIBYPASS / DIKECUALIKAN secara mutlak dari auto-alpha.
   */
  async processWeekdayAutoAlpha(targetDateStr?: string): Promise<{
    success: boolean;
    date: string;
    isWeekday: boolean;
    totalEvaluatedGroups: number;
    totalStudentsEvaluated: number;
    totalMarkedAlpha: number;
    totalBypassed: number;
    reason?: string;
  }> {
    try {
      const now = new Date();
      const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      const dateStr = targetDateStr || wibNow.toISOString().slice(0, 10);
      const targetDate = new Date(`${dateStr}T12:00:00+07:00`);

      // 1. Cek Hari: Hanya Senin (1) s.d. Jumat (5)
      // getUTCDay() dari WIB Date (atau targetDate)
      const dayOfWeek = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

      if (!isWeekday) {
        console.log(
          `[kknAttendanceService.processWeekdayAutoAlpha] Tanggal ${dateStr} adalah akhir pekan (Sabtu/Minggu, Day ${dayOfWeek}). Auto-alpha dibypass.`
        );
        return {
          success: true,
          date: dateStr,
          isWeekday: false,
          totalEvaluatedGroups: 0,
          totalStudentsEvaluated: 0,
          totalMarkedAlpha: 0,
          totalBypassed: 0,
          reason: "Akhir pekan (Sabtu/Minggu) - Fleksibilitas KKN aktif tanpa auto-alpha",
        };
      }

      // 2. Cek apakah tanggal ini adalah hari libur KKN / di luar periode KKN
      const holidayCheck =
        typeof configService?.isDateKknHoliday === "function"
          ? await configService
              .isDateKknHoliday(targetDate)
              .catch(() => ({ isHoliday: false, reason: undefined }))
          : { isHoliday: false, reason: undefined };
      if (holidayCheck?.isHoliday) {
        console.log(
          `[kknAttendanceService.processWeekdayAutoAlpha] Tanggal ${dateStr} adalah hari libur KKN (${holidayCheck.reason}). Auto-alpha dibypass.`
        );
        return {
          success: true,
          date: dateStr,
          isWeekday: true,
          totalEvaluatedGroups: 0,
          totalStudentsEvaluated: 0,
          totalMarkedAlpha: 0,
          totalBypassed: 0,
          reason: holidayCheck.reason || "Hari Libur KKN / Di luar Periode",
        };
      }

      const startOfDay = new Date(`${dateStr}T00:00:00+07:00`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999+07:00`);

      // 3. Ambil seluruh jadwal aktif pada tanggal tersebut
      const schedules = await prisma.schedule.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          isActive: true,
        },
        include: {
          kelompok: {
            include: {
              students: {
                include: { user: true },
              },
            },
          },
          attendances: true,
        },
      });

      if (!schedules || schedules.length === 0) {
        return {
          success: true,
          date: dateStr,
          isWeekday: true,
          totalEvaluatedGroups: 0,
          totalStudentsEvaluated: 0,
          totalMarkedAlpha: 0,
          totalBypassed: 0,
          reason: "Tidak ada jadwal kegiatan aktif pada tanggal ini",
        };
      }

      let totalEvaluatedGroups = 0;
      let totalStudentsEvaluated = 0;
      let totalMarkedAlpha = 0;
      let totalBypassed = 0;

      for (const sched of schedules) {
        // Guard 1: Cek apakah jadwal ini sudah di-skip di level jadwal (oleh Ketua/DPL)
        // Ini mencegah seluruh kelompok mendapat ALPA jika jadwalnya memang dikosongkan.
        if ((sched as any).statusKegiatan === "TIDAK_ADA_KEGIATAN") {
          continue;
        }

        // Guard 2: Cek apakah ada presensi individual yang sudah berstatus skip
        const isScheduleSkipped = sched.attendances.some(
          (a) => a.status === "TIDAK_ADA_KEGIATAN" || a.status === "SKIP_KEGIATAN"
        );
        if (isScheduleSkipped) {
          continue;
        }

        const students = sched.kelompok?.students || [];
        if (students.length === 0) continue;

        totalEvaluatedGroups++;

        for (const st of students) {
          totalStudentsEvaluated++;
          const uId = st.userId;

          // 1. Cek ActivityAttendance untuk jadwal ini
          const existingAtt = sched.attendances.find((a) => a.studentId === uId);
          if (existingAtt) {
            const stUpper = String(existingAtt.status || "").toUpperCase();
            if (
              [
                "HADIR",
                "HADIR_MEMENUHI",
                "HADIR_TIDAK_MEMENUHI",
                "BERLANGSUNG",
                "SELESAI",
                "SELESAI_TELAT",
                "TERJEDA",
                "IZIN",
                "SAKIT",
                "TIDAK_ADA_KEGIATAN",
                "SKIP_KEGIATAN",
                "ALPA",
                "ALPHA",
              ].includes(stUpper)
            ) {
              totalBypassed++;
              continue;
            }
          }

          // 2. Cek apakah ada kehadiran di jadwal lain pada tanggal yang sama
          const anyOtherAtt = await prisma.activityAttendance
            ?.findFirst({
              where: {
                studentId: uId,
                attendedAt: { gte: startOfDay, lte: endOfDay },
                status: {
                  in: [
                    "HADIR",
                    "HADIR_MEMENUHI",
                    "HADIR_TIDAK_MEMENUHI",
                    "BERLANGSUNG",
                    "SELESAI",
                    "TERJEDA",
                    "IZIN",
                    "SAKIT",
                  ],
                },
              },
            })
            .catch(() => null);
          if (anyOtherAtt) {
            totalBypassed++;
            continue;
          }

          // 3. Cek Presensi Mandiri pada tanggal yang sama
          const mandiriAtt = await prisma.presensiMandiri
            ?.findFirst({
              where: {
                studentId: uId,
                checkInAt: { gte: startOfDay, lte: endOfDay },
                status: { not: "DIBATALKAN" },
              },
            })
            .catch(() => null);
          if (mandiriAtt) {
            totalBypassed++;
            continue;
          }

          // 4. Cek Pengajuan Izin/Sakit yang Disetujui
          const approvedLeave = await prisma.studentLeaveRequest
            ?.findFirst({
              where: {
                studentId: uId,
                status: "APPROVED",
                startDate: { lte: endOfDay },
                endDate: { gte: startOfDay },
              },
            })
            .catch(() => null);
          if (approvedLeave) {
            const leaveStatus = approvedLeave.type === "SAKIT" ? "SAKIT" : "IZIN";
            await prisma.activityAttendance.upsert({
              where: {
                studentId_scheduleId: {
                  studentId: uId,
                  scheduleId: sched.id,
                },
              },
              create: {
                studentId: uId,
                scheduleId: sched.id,
                attendedAt: startOfDay,
                method: "LEAVE_AUTO",
                latitude: sched.latitude || -6.89,
                longitude: sched.longitude || 107.61,
                status: leaveStatus,
                actualInZoneMinutes: 240,
                deskripsiKegiatan: `Izin/Sakit Disetujui DPL: ${approvedLeave.reason || "-"}`,
              },
              update: {
                status: leaveStatus,
                method: "LEAVE_AUTO",
                actualInZoneMinutes: 240,
                deskripsiKegiatan: `Izin/Sakit Disetujui DPL: ${approvedLeave.reason || "-"}`,
              },
            });
            totalBypassed++;
            continue;
          }

          // 5. Cek Pembuatan Logbook KKN pada tanggal yang sama
          const studentLogbook = await prisma.logbookKkn
            ?.findFirst({
              where: {
                penulisId: uId,
                tanggalKegiatan: { gte: startOfDay, lte: endOfDay },
              },
            })
            .catch(() => null);
          if (studentLogbook) {
            totalBypassed++;
            continue;
          }

          // Jika sama sekali tidak ada presensi, izin/sakit, dan logbook pada hari kerja ini:
          // Tandai secara otomatis sebagai ALPA (Tanpa Keterangan)
          await prisma.activityAttendance.upsert({
            where: {
              studentId_scheduleId: {
                studentId: uId,
                scheduleId: sched.id,
              },
            },
            create: {
              studentId: uId,
              scheduleId: sched.id,
              attendedAt: startOfDay,
              method: "ALPA_AUTO",
              latitude: sched.latitude || -6.89,
              longitude: sched.longitude || 107.61,
              status: "ALPA",
              actualInZoneMinutes: 0,
              deskripsiKegiatan:
                "Tanpa Keterangan (Otomatis Sistem: Tidak ada presensi, izin, atau logbook pada hari kerja)",
            },
            update: {
              status: "ALPA",
              method: "ALPA_AUTO",
              actualInZoneMinutes: 0,
              deskripsiKegiatan:
                "Tanpa Keterangan (Otomatis Sistem: Tidak ada presensi, izin, atau logbook pada hari kerja)",
            },
          });
          totalMarkedAlpha++;
        }
      }

      console.log(
        `[kknAttendanceService.processWeekdayAutoAlpha] Selesai evaluasi ${dateStr}. Dievaluasi: ${totalStudentsEvaluated} mahasiswa, Ditandai Alpa: ${totalMarkedAlpha}, Bypassed/Ada Kegiatan: ${totalBypassed}`
      );

      return {
        success: true,
        date: dateStr,
        isWeekday: true,
        totalEvaluatedGroups,
        totalStudentsEvaluated,
        totalMarkedAlpha,
        totalBypassed,
      };
    } catch (err: any) {
      console.error("[kknAttendanceService.processWeekdayAutoAlpha] Error:", err);
      throw err;
    }
  }
}

export const kknAttendanceService = new KknAttendanceService();
