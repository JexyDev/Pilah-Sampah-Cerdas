/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */
import { PrismaClient, DispatchStatus } from "@prisma/client";
const prisma = new PrismaClient();
export class PengangkutanService {
    async getAll(filters) {
        const whereClause = {};
        if (filters?.status) {
            whereClause.status = filters.status;
        }
        if (filters?.rwId) {
            whereClause.bin = {
                rwId: filters.rwId,
            };
        }
        return prisma.dispatchTask.findMany({
            where: whereClause,
            include: {
                bin: {
                    include: {
                        rw: {
                            include: {
                                kelurahan: true,
                            },
                        },
                        kelurahan: true,
                    },
                },
                claimedByUser: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }
    async getById(id) {
        const task = await prisma.dispatchTask.findUnique({
            where: { id },
            include: {
                bin: {
                    include: {
                        rw: {
                            include: {
                                kelurahan: true,
                            },
                        },
                        kelurahan: true,
                    },
                },
                claimedByUser: true,
            },
        });
        if (!task)
            throw new Error("DISPATCH_TASK_NOT_FOUND");
        return task;
    }
    async create(data) {
        // Verify bin exists
        const binExists = await prisma.bin.findUnique({
            where: { id: data.binId },
        });
        if (!binExists)
            throw new Error("BIN_NOT_FOUND");
        if (data.claimedByUserId) {
            const userExists = await prisma.user.findUnique({
                where: { id: data.claimedByUserId },
            });
            if (!userExists)
                throw new Error("USER_NOT_FOUND");
        }
        return prisma.dispatchTask.create({
            data: {
                binId: data.binId,
                status: data.status || DispatchStatus.PENDING,
                claimedByUserId: data.claimedByUserId || null,
            },
            include: {
                bin: {
                    include: {
                        rw: {
                            include: {
                                kelurahan: true,
                            },
                        },
                        kelurahan: true,
                    },
                },
                claimedByUser: true,
            },
        });
    }
    async update(id, data) {
        const task = await prisma.dispatchTask.findUnique({
            where: { id },
        });
        if (!task)
            throw new Error("DISPATCH_TASK_NOT_FOUND");
        if (data.claimedByUserId) {
            const userExists = await prisma.user.findUnique({
                where: { id: data.claimedByUserId },
            });
            if (!userExists)
                throw new Error("USER_NOT_FOUND");
        }
        const updateData = {};
        if (data.status !== undefined) {
            updateData.status = data.status;
        }
        if (data.claimedByUserId !== undefined) {
            updateData.claimedByUserId = data.claimedByUserId || null;
        }
        return prisma.dispatchTask.update({
            where: { id },
            data: updateData,
            include: {
                bin: {
                    include: {
                        rw: {
                            include: {
                                kelurahan: true,
                            },
                        },
                        kelurahan: true,
                    },
                },
                claimedByUser: true,
            },
        });
    }
    async delete(id) {
        const task = await prisma.dispatchTask.findUnique({
            where: { id },
        });
        if (!task)
            throw new Error("DISPATCH_TASK_NOT_FOUND");
        return prisma.dispatchTask.delete({
            where: { id },
        });
    }
}
export const pengangkutanService = new PengangkutanService();
