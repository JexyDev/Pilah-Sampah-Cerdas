/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const scheduleService = {
  getAllSchedules: async () => {
    return prisma.schedule.findMany({
      orderBy: { date: "asc" },
    });
  },

  createSchedule: async (data: {
    title: string;
    date: Date;
    time?: string;
    category: string;
    location?: string;
  }) => {
    return prisma.schedule.create({
      data,
    });
  },
};
