import { prisma } from "../lib/prisma.js";
/**
 * Project: TrashCare
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
      } else if (["DPL", "DOSEN_PEMBIMBING"].includes(userRole) && userId) {
        // DPL sees all their groups + global schedules
        const kelompokBinaan = await prisma.kelompokKkn.findMany({
          where: {
            OR: [
              { dplId: userId },
              { dpl: { id: userId } },
            ],
          },
          select: { id: true },
        });
        kelompokIds = kelompokBinaan.map((k) => k.id);
      } else if (["SUPER_USER", "ADMIN_DLH", "PANITIA_TASKFORCE", "PEMIMPIN", "DEVELOPER"].includes(userRole)) {
        // Global viewers see everything
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
        orderBy: { date: "asc" },
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
    return prisma.schedule.create({
      data,
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
    });
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
};
