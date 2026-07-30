/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";
import { configService } from "./configService.js";
import { isPointInPolygon } from "../utils/geoUtils.js";

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

  async getWargaDampingan(userId: string) {
    // Ambil warga yang di-register oleh mahasiswa ini
    const bins = await prisma.bin.findMany({
      where: { registeredByStudentId: userId },
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
        isInside = isPointInPolygon({ lat: latitude, lng: longitude }, polyPoints);
      } else if (schedule.latitude && schedule.longitude) {
        const dist = calculateDistance(
          latitude,
          longitude,
          Number(schedule.latitude),
          Number(schedule.longitude)
        );
        isInside = dist <= (schedule.radius || 100);
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
    let isInside = false;
    if (actLoc.polygon && Array.isArray(actLoc.polygon) && actLoc.polygon.length >= 3) {
      const polyPoints = (actLoc.polygon as any[]).map((p) => ({
        lat: Number(p[0]),
        lng: Number(p[1]),
      }));
      isInside = isPointInPolygon({ lat: latitude, lng: longitude }, polyPoints);
    } else {
      const distance = calculateDistance(latitude, longitude, actLoc.latitude, actLoc.longitude);
      isInside = distance <= actLoc.radius;
    }

    if (!isInside) {
      throw new Error(`OUT_OF_RADIUS: Mahasiswa tidak berada di dalam area kegiatan.`);
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
        if (existing.checkOutAt) {
          throw new Error("ALREADY_ATTENDED_AND_CHECKED_OUT");
        }

        // This is a checkout
        const record = await tx.activityAttendance.update({
          where: { id: existing.id },
          data: {
            checkOutAt: new Date(),
            status: "LEPAS_RADIUS",
          },
        });

        return record;
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

      // Award +10 points to student on Check-In
      await tx.pointHistory.create({
        data: {
          userId: studentId,
          points: 10,
          description: `Bonus kehadiran (Check-In) KKN: ${actLoc.title} (${method})`,
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

    // Include registered Mahasiswa KKN who haven't sent a location ping in last 24h
    const allMahasiswa = await prisma.user.findMany({
      where: {
        role: { name: "MAHASISWA_KKN" },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
        studentProfile: {
          select: {
            nim: true,
            jurusan: true,
            assignedPolygon: {
              select: {
                name: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
        attendances: {
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

    for (const mhs of allMahasiswa) {
      if (!uniqueStudents.has(mhs.id)) {
        let lat = -6.8915;
        let lng = 107.6107;
        let recAt = mhs.createdAt;

        if (mhs.attendances.length > 0 && mhs.attendances[0].latitude && mhs.attendances[0].longitude) {
          lat = Number(mhs.attendances[0].latitude);
          lng = Number(mhs.attendances[0].longitude);
          recAt = mhs.attendances[0].attendedAt;
        } else if (
          mhs.studentProfile?.assignedPolygon?.latitude &&
          mhs.studentProfile?.assignedPolygon?.longitude
        ) {
          lat = Number(mhs.studentProfile.assignedPolygon.latitude);
          lng = Number(mhs.studentProfile.assignedPolygon.longitude);
        } else {
          const charSum = mhs.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
          lat = -6.8915 + ((charSum % 30) - 15) * 0.0003;
          lng = 107.6107 + ((charSum % 25) - 12) * 0.0003;
        }

        uniqueStudents.set(mhs.id, {
          id: `fallback-${mhs.id}`,
          studentId: mhs.id,
          latitude: lat as any,
          longitude: lng as any,
          recordedAt: recAt,
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
      orderBy: {
        attendedAt: "desc",
      },
    });

    const attendedStudentIds = new Set(list.map((a) => a.studentId));
    const locations = await this.getActiveStudentsLocations();
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
          isInside = isPointInPolygon(
            { lat: Number(latestLoc.latitude), lng: Number(latestLoc.longitude) },
            polyPoints
          );
        } else {
          const dist = calculateDistance(
            Number(latestLoc.latitude),
            Number(latestLoc.longitude),
            scheduleLoc.latitude,
            scheduleLoc.longitude
          );
          isInside = dist <= scheduleLoc.radius;
        }
        currentStatus = isInside ? "MASIH_DI_LOKASI" : "SUDAH_MENINGGALKAN_RADIUS";
      }

      return {
        ...att,
        currentStatus,
      };
    });

    const allStudents = await prisma.user.findMany({
      where: {
        role: { name: "MAHASISWA_KKN" },
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
            isInside = isPointInPolygon(
              { lat: Number(latestLoc.latitude), lng: Number(latestLoc.longitude) },
              polyPoints
            );
          } else {
            const dist = calculateDistance(
              Number(latestLoc.latitude),
              Number(latestLoc.longitude),
              scheduleLoc.latitude,
              scheduleLoc.longitude
            );
            isInside = dist <= scheduleLoc.radius;
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

    return [...attendedList, ...unAttendedList];
  }
}

export const kknAttendanceService = new KknAttendanceService();
