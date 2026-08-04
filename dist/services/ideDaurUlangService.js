import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export class IdeDaurUlangService {
    async createIde(userId, judul, material, foto) {
        const ide = await prisma.ideDaurUlang.create({
            data: {
                userId,
                judul,
                material,
                foto,
                statusApproval: "PENDING",
            },
        });
        return ide;
    }
    async getSemuaIde(filters) {
        let whereClause = {};
        if (filters?.status) {
            whereClause.statusApproval = filters.status;
        }
        if (filters?.search) {
            whereClause.OR = [
                { judul: { contains: filters.search, mode: "insensitive" } },
                { material: { contains: filters.search, mode: "insensitive" } },
                { user: { name: { contains: filters.search, mode: "insensitive" } } },
            ];
        }
        return prisma.ideDaurUlang.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: { name: true, role: { select: { name: true } } },
                },
            },
        });
    }
    async getIdeWarga(userId) {
        return prisma.ideDaurUlang.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    }
    async approveIde(id, approvedBy) {
        const ide = await prisma.ideDaurUlang.update({
            where: { id },
            data: { statusApproval: "APPROVED", approvedBy },
        });
        // Add +50 points to user
        await prisma.pointHistory.create({
            data: {
                userId: ide.userId,
                points: 50,
                description: `Ide Daur Ulang Disetujui: ${ide.judul}`,
                kategori: "IDE_DAUR_ULANG",
            },
        });
        // Add to Social Feed
        await prisma.socialFeed.create({
            data: {
                tipe: "RECYCLE_IDEA",
                deskripsi: `Ide daur ulang "${ide.judul}" telah disetujui untuk diimplementasikan!`,
                userId: ide.userId,
                entityId: ide.id,
            },
        });
        return ide;
    }
    async rejectIde(id, rejectedBy) {
        return prisma.ideDaurUlang.update({
            where: { id },
            data: { statusApproval: "REJECTED", approvedBy: rejectedBy },
        });
    }
    async updateIde(id, judul, material, foto) {
        const data = { judul, material };
        if (foto !== null) {
            data.foto = foto;
        }
        return prisma.ideDaurUlang.update({
            where: { id },
            data,
        });
    }
    async deleteIde(id) {
        return prisma.ideDaurUlang.delete({
            where: { id },
        });
    }
}
export const ideDaurUlangService = new IdeDaurUlangService();
