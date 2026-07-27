/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";
import { configService } from "./configService.js";

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
  /**
   * Save student's current location and perform auto-cleanup of logs older than 24h.
   * If student is inside active activity radius, trigger auto-attendance.
   */
  async updateStudentLocation(studentId: string, latitude: number, longitude: number) {
    // 1. Save new location
    const location = await prisma.studentLocation.create({
      data: {
        studentId,
        latitude,
        longitude,
      },
    });

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

    // 3. Auto-attendance check:
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
      if (!schedule.latitude || !schedule.longitude) continue;

      const dist = calculateDistance(
        latitude,
        longitude,
        Number(schedule.latitude),
        Number(schedule.longitude)
      );

      const radius = schedule.radius || 100;
      if (dist <= radius) {
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
      location,
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
      isConfigured: schedule.latitude !== null && schedule.longitude !== null,
    };
  }

  /**
   * Record attendance (either manual or automatic trigger).
   * Verifies coordinates and radius on backend.
   * Awards +10 points to student.
   */
  async recordAttendance(params: {
    studentId: string;
    scheduleId: string;
    latitude: number;
    longitude: number;
    method: "OTOMATIS" | "MANUAL";
  }) {
    const { studentId, scheduleId, latitude, longitude, method } = params;

    // 1. Get activity location configuration
    const actLoc = await this.getActivityLocation(scheduleId);

    // 2. Validate radius on backend
    const distance = calculateDistance(latitude, longitude, actLoc.latitude, actLoc.longitude);
    if (distance > actLoc.radius) {
      throw new Error(
        `OUT_OF_RADIUS: Jarak mahasiswa (${distance.toFixed(1)}m) melebihi batas radius (${actLoc.radius}m).`
      );
    }

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
        throw new Error("ALREADY_ATTENDED");
      }

      const record = await tx.activityAttendance.create({
        data: {
          studentId,
          scheduleId,
          method,
          latitude,
          longitude,
          status: "DALAM_RADIUS",
        },
      });

      // Award +10 points to student
      await tx.pointHistory.create({
        data: {
          userId: studentId,
          points: 10,
          description: `Bonus kehadiran KKN: ${actLoc.title} (${method})`,
          kategori: "PARTISIPASI_STREAK",
          redeemable: false,
        },
      });

      return record;
    });

    return attendance;
  }

  /**
   * Get all student locations recorded in the last 24 hours.
   */
  async getActiveStudentsLocations() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // Group by student to get the latest position of each active student
    const locations = await prisma.studentLocation.findMany({
      where: {
        recordedAt: {
          gte: cutoff,
        },
      },
      orderBy: {
        recordedAt: "desc",
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
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
   */
  async getAttendanceList(scheduleId: string) {
    const list = await prisma.activityAttendance.findMany({
      where: { scheduleId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentProfile: {
              select: {
                nim: true,
                jurusan: true,
              },
            },
          },
        },
      },
      orderBy: {
        attendedAt: "desc",
      },
    });

    // We can also fetch their current status (whether they are still in radius)
    // by comparing with their latest recorded location
    const locations = await this.getActiveStudentsLocations();
    const locMap = new Map(locations.map((l) => [l.studentId, l]));

    const scheduleLoc = await this.getActivityLocation(scheduleId);

    return list.map((att) => {
      const latestLoc = locMap.get(att.studentId);
      let currentStatus = "TIDAK_TERDETEKSI"; // GPS off/expired
      if (latestLoc) {
        const dist = calculateDistance(
          Number(latestLoc.latitude),
          Number(latestLoc.longitude),
          scheduleLoc.latitude,
          scheduleLoc.longitude
        );
        currentStatus =
          dist <= scheduleLoc.radius ? "MASIH_DI_LOKASI" : "SUDAH_MENINGGALKAN_RADIUS";
      }

      return {
        ...att,
        currentStatus,
      };
    });
  }
}

export const kknAttendanceService = new KknAttendanceService();
