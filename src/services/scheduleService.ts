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
