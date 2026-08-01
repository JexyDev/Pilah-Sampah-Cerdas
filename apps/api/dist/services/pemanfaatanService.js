/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export class PemanfaatanService {
    async create(data) {
        return prisma.pemanfaatan.create({
            data: {
                ...data,
                volumeBahanBaku: data.volumeBahanBaku,
                hasil: data.hasil,
            },
        });
    }
    async getAll() {
        return prisma.pemanfaatan.findMany({
            include: {
                rw: { include: { kelurahan: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async getById(id) {
        const item = await prisma.pemanfaatan.findUnique({
            where: { id },
            include: {
                rw: { include: { kelurahan: true } },
            },
        });
        if (!item)
            throw new Error("PEMANFAATAN_NOT_FOUND");
        return item;
    }
    async update(id, data) {
        const item = await prisma.pemanfaatan.findUnique({ where: { id } });
        if (!item)
            throw new Error("PEMANFAATAN_NOT_FOUND");
        return prisma.pemanfaatan.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        const item = await prisma.pemanfaatan.findUnique({ where: { id } });
        if (!item)
            throw new Error("PEMANFAATAN_NOT_FOUND");
        return prisma.pemanfaatan.delete({
            where: { id },
        });
    }
}
export const pemanfaatanService = new PemanfaatanService();
