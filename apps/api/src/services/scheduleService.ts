/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const scheduleService = {
  getAllSchedules: async (dplUserId?: string) => {
    let kelompokIds: string[] | null = null;
    if (dplUserId) {
      const kelompokBinaan = await prisma.kelompokKkn.findMany({
        where: { dplId: dplUserId },
        select: { id: true },
      });
      kelompokIds = kelompokBinaan.map((k) => k.id);
    }

    const whereClause: any =
      kelompokIds !== null
        ? {
            OR: [{ kelompokId: { in: kelompokIds } }, { kelompokId: null }],
          }
        : {};

    return prisma.schedule.findMany({
      where: whereClause,
      include: {
        kelompok: {
          select: { id: true, name: true, kelurahan: true },
        },
      },
      orderBy: { date: "asc" },
    });
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
