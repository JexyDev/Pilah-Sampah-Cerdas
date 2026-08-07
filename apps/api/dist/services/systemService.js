/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export const systemService = {
    /**
     * Get all audit trail logs (SUPER USER only view)
     */
    getAuditTrails: async () => {
        return prisma.auditTrail.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        role: { select: { name: true } },
                    },
                },
            },
            orderBy: { timestamp: "desc" },
        });
    },
    /**
     * Create a new social feed activity entry
     */
    createSocialFeed: async (userId, tipe, deskripsi, entityId) => {
        return prisma.socialFeed.create({
            data: {
                userId,
                tipe,
                deskripsi,
                entityId,
            },
        });
    },
    /**
     * Get public social feed stream in real-time
     */
    getSocialFeed: async () => {
        return prisma.socialFeed.findMany({
            orderBy: { timestamp: "desc" },
            take: 50, // Limit to 50 latest activities
        });
    },
};
