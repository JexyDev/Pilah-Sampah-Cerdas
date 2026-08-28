import { prisma } from "../lib/prisma.js";
import { configService } from "./configService.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

export const scheduleService = {
  getAllSchedules: async (userId?: string, role?: string) => {
    try {
      let kelompokIds: string[] | null = null; // null means global (fetch all)
      
      const userRole = role?.toUpperCase() || "";

      if (userRole === "MAHASISWA_KKN" && userId) {
        // Mahasiswa only sees their own group + global schedules
        const studentProfile = await prisma.studentKkn.findUnique({
          where: { userId: userId },
          select: { kelompokId: true }
        });
        kelompokIds = studentProfile?.kelompokId ? [studentProfile.kelompokId] : [];
      } else if (["DPL", "DOSEN_PEMBIMBING", "DOSEN_PENDAMPING", "DOSEN_PENDAMPING_LAPANGAN"].includes(userRole) && userId) {
        // DPL strictly sees ONLY their assigned groups + global schedules
        const dplUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, nip: true, phone: true },
        });
        const dplOr: any[] = [
          { dplId: userId },
          { dpl: { id: userId } },
        ];
        if (dplUser?.name) dplOr.push({ dplNamaMentah: { equals: dplUser.name.trim(), mode: "insensitive" } });
        if (dplUser?.nip) dplOr.push({ dpl: { nip: dplUser.nip } });
        if (dplUser?.phone) dplOr.push({ dpl: { phone: dplUser.phone } });

        const kelompokBinaan = await prisma.kelompokKkn.findMany({
          where: { OR: dplOr },
          select: { id: true },
        });
        kelompokIds = kelompokBinaan.map((k) => k.id);
      } else if (["SUPER_USER", "ADMIN_DLH", "PANITIA_TASKFORCE", "PEMIMPIN", "DEVELOPER"].includes(userRole)) {
        // Global viewers see everything, auto-ensure today's schedules exist
        await scheduleService.syncDailySchedulesForToday().catch(() => {});
        kelompokIds = null;
      } else if (userId) {
        // Other users (warga, rw, lurah)
        kelompokIds = [];
      }

      let whereClause: any = {};
      
      if (kelompokIds !== null) {
        if (kelompokIds.length === 0) {
          // If they have no groups, they can ONLY see global schedules (kelompokId = null)
          whereClause = { kelompokId: null };
        } else {
          whereClause = {
            OR: [{ kelompokId: { in: kelompokIds } }, { kelompokId: null }],
          };
        }
      }

      return await prisma.schedule.findMany({
        where: whereClause,
        include: {
          kelompok: {
            select: { id: true, name: true, kelurahan: true },
          },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      });
    } catch (err: any) {
      console.error("[scheduleService.getAllSchedules] Error querying schedules:", err);
      throw err;
    }
  },

  createSchedule: async (data: {
    title: string;
    date: Date;
    time?: string;
    category: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    polygon?: any;
    kelompokId?: string;
    isActive?: boolean;
  }) => {
    // Pull default geofence buffer from Rule Engine if radius not provided
    if (data.radius === undefined || data.radius === null) {
      try {
        const ruleConfigs = await configService.getRuleEngineConfigs();
        data.radius = (ruleConfigs as any).attendanceGeofenceBufferMeters
          ? 200 + (ruleConfigs as any).attendanceGeofenceBufferMeters
          : 200;
      } catch (_err) {
        data.radius = 200;
      }
    }
    const schedule = await prisma.schedule.create({
      data,
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
    });

    // SILENT PUSH UNTUK REALTIME KEGIATAN MAHASISWA
    try {
      const students = await prisma.studentKkn.findMany({
        where: data.kelompokId ? { kelompokId: data.kelompokId } : {},
        include: { user: true },
      });
      for (const s of students) {
        if (s.user?.fcmToken) {
          await notificationIntegrationService.sendSilentDataPush(
            s.user.fcmToken,
            { event: 'REFRESH_KEGIATAN_MAHASISWA' }
          );
        }
      }
    } catch (e) {
      console.warn("[createSchedule] Failed to send silent push", e);
    }

    return schedule;
  },

  deleteSchedule: async (id: string) => {
    return prisma.schedule.delete({
      where: { id },
    });
  },

  updateSchedule: async (
    id: string,
    data: {
      title?: string;
      date?: Date;
      time?: string;
      category?: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      radius?: number;
      polygon?: any;
      kelompokId?: string;
      isActive?: boolean;
    }
  ) => {
    return prisma.schedule.update({
      where: { id },
      data,
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
    });
  },

  syncDailySchedulesForToday: async (targetDateStr?: string) => {
    try {
      const now = new Date();
      const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      const dateStr = targetDateStr || wibNow.toISOString().slice(0, 10);
      const startOfDay = new Date(`${dateStr}T00:00:00+07:00`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999+07:00`);

      // Fetch all KKN groups
      const groups = await prisma.kelompokKkn.findMany({
        include: {
          facilities: {
            where: { jenis: "posko_kkn" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      // Also check posko_kkn table
      const poskos = await prisma.poskoKkn.findMany();
      const poskoMap = new Map<string, any>();
      poskos.forEach((p) => {
        if (p.kelompokId) poskoMap.set(p.kelompokId, p);
      });

      let createdCount = 0;
      let existingCount = 0;

      for (const group of groups) {
        // Check if schedule already exists for this group on this date
        const existing = await prisma.schedule.findFirst({
          where: {
            kelompokId: group.id,
            date: { gte: startOfDay, lte: endOfDay },
            isActive: true,
          },
        });

        // Determine Posko location & name
        const officialPosko = poskoMap.get(group.id);
        const facilityPosko = group.facilities?.[0];

        let poskoLat = -6.8915; // default Coblong
        let poskoLng = 107.6107;
        let poskoName = `Posko KKN ${group.name}`;
        const poskoRadius = 200;

        if (officialPosko && officialPosko.latitude && officialPosko.longitude) {
          poskoLat = Number(officialPosko.latitude);
          poskoLng = Number(officialPosko.longitude);
          poskoName = officialPosko.nama || poskoName;
        } else if (facilityPosko && facilityPosko.latitude && facilityPosko.longitude) {
          poskoLat = Number(facilityPosko.latitude);
          poskoLng = Number(facilityPosko.longitude);
          poskoName = facilityPosko.nama || poskoName;
        } else {
          // Fallback kelurahan resmi
          const kel = (group.kelurahan || group.name || "").toLowerCase();
          if (kel.includes("dago")) {
            poskoLat = -6.8833;
            poskoLng = 107.6167;
            poskoName = `Posko KKN ${group.name} - Kel. Dago`;
          } else if (kel.includes("cipaganti")) {
            poskoLat = -6.8912;
            poskoLng = 107.6035;
            poskoName = `Posko KKN ${group.name} - Kel. Cipaganti`;
          } else if (kel.includes("lebak gede") || kel.includes("lebakgede")) {
            poskoLat = -6.8875;
            poskoLng = 107.6133;
            poskoName = `Posko KKN ${group.name} - Kel. Lebak Gede`;
          } else if (kel.includes("lebak siliwangi")) {
            poskoLat = -6.8892;
            poskoLng = 107.6083;
            poskoName = `Posko KKN ${group.name} - Kel. Lebak Siliwangi`;
          } else if (kel.includes("sadang serang")) {
            poskoLat = -6.8917;
            poskoLng = 107.6250;
            poskoName = `Posko KKN ${group.name} - Kel. Sadang Serang`;
          } else if (kel.includes("sekeloa")) {
            poskoLat = -6.8900;
            poskoLng = 107.6200;
            poskoName = `Posko KKN ${group.name} - Kel. Sekeloa`;
          }
        }

        if (existing) {
          existingCount++;
          // Jika sudah ada posko resmi atau koordinat fallback berbeda dari jadwal yang tercatat, perbarui
          if (
            (officialPosko && (Number(existing.latitude) !== poskoLat || Number(existing.longitude) !== poskoLng)) ||
            (existing.location?.startsWith("Posko KKN") && (Number(existing.latitude) !== poskoLat || Number(existing.longitude) !== poskoLng))
          ) {
            await prisma.schedule.update({
              where: { id: existing.id },
              data: {
                latitude: poskoLat,
                longitude: poskoLng,
                location: poskoName,
                title: `Kegiatan Harian ${poskoName}`,
              },
            });
          }
          continue;
        }

        try {
          await prisma.schedule.create({
            data: {
              title: `Kegiatan Harian ${poskoName}`,
              date: startOfDay,
              time: "08:00 - 16:00",
              category: "POSKO_KKN",
              location: poskoName,
              latitude: poskoLat,
              longitude: poskoLng,
              radius: poskoRadius,
              kelompokId: group.id,
              isActive: true,
            },
          });
          createdCount++;
        } catch (_createErr) {
          // Concurrent creation safe
        }
      }

      return { success: true, date: dateStr, createdCount, existingCount, totalGroups: groups.length };
    } catch (err: any) {
      console.error("[scheduleService.syncDailySchedulesForToday] Error:", err);
      throw err;
    }
  },
};
