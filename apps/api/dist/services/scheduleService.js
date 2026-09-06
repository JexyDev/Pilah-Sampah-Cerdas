/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
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
    createSchedule: async (data) => {
        return prisma.schedule.create({
            data,
        });
    },
    deleteSchedule: async (id) => {
        return prisma.schedule.delete({
            where: { id },
        });
    },
    updateSchedule: async (id, data) => {
        return prisma.schedule.update({
            where: { id },
            data,
        });
    },
};
