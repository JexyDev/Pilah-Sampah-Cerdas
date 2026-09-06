import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { formatPhoneNumber } from "../utils/phoneUtils.js";
const prisma = new PrismaClient();
export const adminMahasiswaService = {
    getAllMahasiswa: async (page = 1, limit = 10, search = "") => {
        const skip = (page - 1) * limit;
        const whereClause = {
            role: { name: "MAHASISWA_KKN" },
            status: "Aktif",
        };
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { studentProfile: { nim: { contains: search, mode: "insensitive" } } },
            ];
        }
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: whereClause,
                include: {
                    studentProfile: {
                        include: {
                            kelompok: true,
                            assignedPolygon: true,
                        },
                    },
                    rtRw: {
                        include: {
                            kelurahan: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.user.count({ where: whereClause }),
        ]);
        return { users, total, page, limit };
    },
    createMahasiswa: async (data) => {
        const role = await prisma.role.findUnique({ where: { name: "MAHASISWA_KKN" } });
        if (!role)
            throw new Error("Role MAHASISWA_KKN not found");
        const passwordHash = await bcrypt.hash("password123", 10);
        return prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name: data.nama_lengkap,
                    phone: formatPhoneNumber(data.no_telepon),
                    password: passwordHash,
                    roleId: role.id,
                    status: data.status_aktif || "Aktif",
                    rtRwId: data.area_tugas || null,
                },
            });
            const studentProfile = await tx.studentKkn.create({
                data: {
                    userId: user.id,
                    nim: data.nim,
                    jurusan: "Umum",
                    fakultas: data.universitas || "UNIKOM",
                    noWa: data.no_telepon,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                    whitelistStatus: "APPROVED",
                    assignedPolygonId: data.area_tugas || null,
                },
                include: {
                    assignedPolygon: true,
                },
            });
            return { user, studentProfile };
        });
    },
    updateMahasiswa: async (id, data) => {
        return prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id },
                data: {
                    ...(data.nama_lengkap && { name: data.nama_lengkap }),
                    ...(data.no_telepon && { phone: data.no_telepon }),
                    ...(data.status_aktif && { status: data.status_aktif }),
                    ...(data.area_tugas !== undefined && { rtRwId: data.area_tugas || null }),
                },
            });
            const studentProfile = await tx.studentKkn.findUnique({ where: { userId: id } });
            let updatedStudent = null;
            if (studentProfile) {
                updatedStudent = await tx.studentKkn.update({
                    where: { userId: id },
                    data: {
                        ...(data.nim && { nim: data.nim }),
                        ...(data.universitas && { fakultas: data.universitas }),
                        ...(data.no_telepon && { noWa: data.no_telepon }),
                        ...(data.area_tugas !== undefined && { assignedPolygonId: data.area_tugas || null }),
                    },
                    include: {
                        assignedPolygon: true,
                    },
                });
            }
            return { user, studentProfile: updatedStudent };
        });
    },
    deleteMahasiswa: async (id) => {
        // Soft delete by updating status to Nonaktif
        return prisma.user.update({
            where: { id },
            data: { status: "Nonaktif" },
        });
    },
};
