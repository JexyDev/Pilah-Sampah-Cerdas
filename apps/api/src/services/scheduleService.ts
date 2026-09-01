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
          select: { kelompokId: true },
        });
        kelompokIds = studentProfile?.kelompokId ? [studentProfile.kelompokId] : [];
      } else if (
        ["DPL", "DOSEN_PEMBIMBING", "DOSEN_PENDAMPING", "DOSEN_PENDAMPING_LAPANGAN"].includes(
          userRole
        ) &&
        userId
      ) {
        // DPL strictly sees ONLY their assigned groups + global schedules
        const dplUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, nip: true, phone: true },
        });
        const dplOr: any[] = [{ dplId: userId }, { dpl: { id: userId } }];
        if (dplUser?.name)
          dplOr.push({ dplNamaMentah: { equals: dplUser.name.trim(), mode: "insensitive" } });
        if (dplUser?.nip) dplOr.push({ dpl: { nip: dplUser.nip } });
        if (dplUser?.phone) dplOr.push({ dpl: { phone: dplUser.phone } });

        const kelompokBinaan = await prisma.kelompokKkn.findMany({
          where: { OR: dplOr },
          select: { id: true },
        });
        kelompokIds = kelompokBinaan.map((k) => k.id);
      } else if (
        ["SUPER_USER", "ADMIN_DLH", "PANITIA_TASKFORCE", "PEMIMPIN", "DEVELOPER"].includes(userRole)
      ) {
        // Global viewers see everything without unnecessary write side-effects
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
          ? 500 + (ruleConfigs as any).attendanceGeofenceBufferMeters
          : 500;
      } catch (_err) {
        data.radius = 500;
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
          await notificationIntegrationService.sendSilentDataPush(s.user.fcmToken, {
            event: "REFRESH_KEGIATAN_MAHASISWA",
          });
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

  cleanAllDuplicateSchedules: async () => {
    try {
      console.log(
        "[scheduleService.cleanAllDuplicateSchedules] Starting duplicate schedules cleanup..."
      );
      // Ambil semua jadwal kegiatan posko KKN
      const allPoskoSchedules = await prisma.schedule.findMany({
        where: {
          kelompokId: { not: null },
          category: "POSKO_KKN",
        },
        include: {
          attendances: {
            select: { id: true, studentId: true },
          },
        },
        orderBy: [{ createdAt: "desc" }],
      });

      // Group berdasarkan kelompokId dan tanggal (YYYY-MM-DD WIB)
      const groupDateMap = new Map<string, typeof allPoskoSchedules>();
      for (const s of allPoskoSchedules) {
        if (!s.kelompokId || !s.date) continue;
        const wibDateStr = new Date(new Date(s.date).getTime() + 7 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
        const key = `${s.kelompokId}_${wibDateStr}`;
        if (!groupDateMap.has(key)) {
          groupDateMap.set(key, []);
        }
        groupDateMap.get(key)!.push(s);
      }

      let removedDuplicatesCount = 0;

      for (const [_key, list] of groupDateMap.entries()) {
        if (list.length <= 1) continue;

        // Pilih primary schedule: yang punya presensi terbanyak atau paling baru
        list.sort((a, b) => {
          const aCount = a.attendances?.length || 0;
          const bCount = b.attendances?.length || 0;
          if (bCount !== aCount) return bCount - aCount;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        const primarySchedule = list[0];
        const duplicates = list.slice(1);

        for (const dup of duplicates) {
          if (dup.attendances && dup.attendances.length > 0) {
            for (const att of dup.attendances) {
              const existingAtt = await prisma.activityAttendance.findFirst({
                where: { scheduleId: primarySchedule.id, studentId: att.studentId },
              });
              if (existingAtt) {
                await prisma.activityAttendance.delete({ where: { id: att.id } });
              } else {
                await prisma.activityAttendance.update({
                  where: { id: att.id },
                  data: { scheduleId: primarySchedule.id },
                });
              }
            }
          }
          // Hapus jadwal duplikat
          await prisma.schedule.delete({ where: { id: dup.id } });
          removedDuplicatesCount++;
        }
      }

      console.log(
        `[scheduleService.cleanAllDuplicateSchedules] Completed. Removed ${removedDuplicatesCount} duplicate schedules.`
      );
      return { success: true, removedDuplicatesCount };
    } catch (err: any) {
      console.error("[scheduleService.cleanAllDuplicateSchedules] Error:", err);
      throw err;
    }
  },

  /**
   * Generator & Sinkronisasi Jadwal Kegiatan Posko KKN Per Hari (Harian)
   * Memastikan setiap kelompok KKN memiliki jadwal posko aktif harian untuk tanggal yang ditentukan (default: hari ini).
   */
  syncDailySchedulesForToday: async (targetDateStr?: string) => {
    try {
      const now = new Date();
      const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      const dateStr = targetDateStr || wibNow.toISOString().slice(0, 10);
      const startOfDay = new Date(`${dateStr}T00:00:00+07:00`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999+07:00`);

      // Fetch all KKN groups with Posko info
      const groups = await prisma.kelompokKkn.findMany({
        include: {
          facilities: {
            where: { jenis: "posko_kkn" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      const [poskos, multiPoskos] = await Promise.all([
        prisma.poskoKkn.findMany(),
        (prisma as any).poskoKknMulti.findMany({
          orderBy: [{ isUtama: "desc" }, { createdAt: "asc" }],
        }),
      ]);

      const poskoMap = new Map<string, any>();
      poskos.forEach((p) => {
        if (p.kelompokId) poskoMap.set(p.kelompokId, p);
      });
      multiPoskos.forEach((mp: any) => {
        if (mp.kelompokId && !poskoMap.has(mp.kelompokId)) {
          poskoMap.set(mp.kelompokId, mp);
        }
      });

      let createdCount = 0;
      let existingCount = 0;
      let cleanedDuplicatesCount = 0;

      for (const group of groups) {
        // Fetch all existing daily posko schedules for this group on this date
        const existingList = await prisma.schedule.findMany({
          where: {
            kelompokId: group.id,
            date: { gte: startOfDay, lte: endOfDay },
            category: "POSKO_KKN",
            isActive: true,
          },
          include: {
            attendances: { select: { id: true, studentId: true } },
          },
          orderBy: [{ createdAt: "desc" }],
        });

        // Determine Posko location & name
        const officialPosko = poskoMap.get(group.id);
        const facilityPosko = group.facilities?.[0];

        let poskoLat = -6.8915; // default Coblong
        let poskoLng = 107.6107;
        let poskoName = `Posko KKN ${group.name}`;
        let poskoRadius = 500;

        if (officialPosko && officialPosko.latitude && officialPosko.longitude) {
          poskoLat = Number(officialPosko.latitude);
          poskoLng = Number(officialPosko.longitude);
          poskoName = officialPosko.nama || poskoName;
          poskoRadius = Math.max(150, Number(officialPosko.radius) || 500);
        } else if (facilityPosko && facilityPosko.latitude && facilityPosko.longitude) {
          poskoLat = Number(facilityPosko.latitude);
          poskoLng = Number(facilityPosko.longitude);
          poskoName = facilityPosko.nama || poskoName;
          poskoRadius = Math.max(150, Number((facilityPosko as any)?.radius) || 500);
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
            poskoLng = 107.625;
            poskoName = `Posko KKN ${group.name} - Kel. Sadang Serang`;
          } else if (kel.includes("sekeloa")) {
            poskoLat = -6.89;
            poskoLng = 107.62;
            poskoName = `Posko KKN ${group.name} - Kel. Sekeloa`;
          }
        }

        if (existingList.length > 0) {
          existingCount++;

          // Urutkan: utamakan yang ada presensi, lalu yang paling baru
          existingList.sort((a, b) => {
            const aCount = a.attendances?.length || 0;
            const bCount = b.attendances?.length || 0;
            if (bCount !== aCount) return bCount - aCount;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });

          const primarySchedule = existingList[0];
          const duplicates = existingList.slice(1);

          // Hapus duplikat dan alihkan presensinya ke primarySchedule
          for (const dup of duplicates) {
            if (dup.attendances && dup.attendances.length > 0) {
              for (const att of dup.attendances) {
                const existingAtt = await prisma.activityAttendance.findFirst({
                  where: { scheduleId: primarySchedule.id, studentId: att.studentId },
                });
                if (existingAtt) {
                  await prisma.activityAttendance.delete({ where: { id: att.id } });
                } else {
                  await prisma.activityAttendance.update({
                    where: { id: att.id },
                    data: { scheduleId: primarySchedule.id },
                  });
                }
              }
            }
            await prisma.schedule.delete({ where: { id: dup.id } });
            cleanedDuplicatesCount++;
          }

          // Perbarui titik koordinat, nama, dan radius jadwal utama jika berubah.
          // Adaptasi aman: Jika jadwal yang sudah ada (primarySchedule) memiliki radius kustom di database
          // dan posko resmi tidak secara spesifik memiliki nilai radius baru, pertahankan radius kustom tersebut.
          const existingScheduleRadius = Number(primarySchedule.radius) || 0;
          const targetScheduleRadius = (officialPosko && Number(officialPosko.radius) > 0)
            ? Math.max(150, Number(officialPosko.radius))
            : (existingScheduleRadius > 0 ? existingScheduleRadius : poskoRadius);

          if (
            Number(primarySchedule.latitude) !== poskoLat ||
            Number(primarySchedule.longitude) !== poskoLng ||
            primarySchedule.location !== poskoName ||
            Number(primarySchedule.radius) !== targetScheduleRadius
          ) {
            await prisma.schedule.update({
              where: { id: primarySchedule.id },
              data: {
                latitude: poskoLat,
                longitude: poskoLng,
                location: poskoName,
                title: `Kegiatan Harian ${poskoName}`,
                radius: targetScheduleRadius,
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

      console.log(
        `[scheduleService.syncDailySchedulesForToday] Date: ${dateStr}, Groups: ${groups.length}. Created: ${createdCount}, Existing: ${existingCount}, Duplicates Cleaned: ${cleanedDuplicatesCount}`
      );

      return {
        success: true,
        date: dateStr,
        createdCount,
        existingCount,
        cleanedDuplicatesCount,
        totalGroups: groups.length,
      };
    } catch (err: any) {
      console.error("[scheduleService.syncDailySchedulesForToday] Error:", err);
      throw err;
    }
  },
};
