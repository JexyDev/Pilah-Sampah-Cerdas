/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export class UserRepository {
    async findMany(whereClause) {
        return prisma.user.findMany({
            where: whereClause,
            include: {
                role: true,
                rw: {
                    include: {
                        kelurahan: {
                            include: { kecamatan: true },
                        },
                    },
                },
                rt: {
                    include: {
                        rw: {
                            include: {
                                kelurahan: {
                                    include: { kecamatan: true },
                                },
                            },
                        },
                    },
                },
                rwOwned: {
                    include: {
                        kelurahan: {
                            include: { kecamatan: true },
                        },
                    },
                },
                households: {
                    include: {
                        rw: {
                            include: {
                                kelurahan: {
                                    include: { kecamatan: true },
                                },
                            },
                        },
                    },
                },
                setoranOtomatis: {
                    select: { berat: true },
                },
                pointHistory: {
                    select: { points: true },
                },
                studentProfile: {
                    include: {
                        assignedRw: {
                            include: {
                                kelurahan: {
                                    include: { kecamatan: true },
                                },
                            },
                        },
                        kelompok: {
                            include: {
                                dpl: {
                                    select: {
                                        id: true,
                                        name: true,
                                        phone: true,
                                    },
                                },
                            },
                        },
                    },
                },
                petugasProfile: true,
                bins: {
                    include: {
                        registeredByStudent: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async findById(id) {
        return prisma.user.findUnique({
            where: { id },
            include: { role: true, studentProfile: true, petugasProfile: true },
        });
    }
    async findByPhone(phone) {
        return prisma.user.findUnique({
            where: { phone },
        });
    }
    async findByEmail(_email) {
        return null;
    }
    async findRoleByName(name) {
        const normalizedMap = {
            "Super User": "SUPER_USER",
            "SUPER USER": "SUPER_USER",
            "Dinas Lingkungan Hidup": "ADMIN_DLH",
            "Camat": "CAMAT",
            "Lurah": "LURAH",
            "Rukun Warga": "RW",
            "Rukun Tetangga": "RT",
            "Dosen Pembimbing Lapangan": "DPL",
            "Petugas Residu": "PETUGAS_RESIDU",
            "Mahasiswa": "MAHASISWA_KKN",
            "Mahasiswa KKN": "MAHASISWA_KKN",
            "Warga": "WARGA",
            "Pimpinan": "PEMIMPIN",
            "Task Force": "PANITIA_TASKFORCE",
        };
        const searchName = normalizedMap[name] || name;
        let role = await prisma.role.findUnique({
            where: { name: searchName },
        });
        if (!role) {
            role = await prisma.role.findFirst({
                where: { name: { equals: searchName, mode: "insensitive" } },
            });
        }
        return role;
    }
    async create(data) {
        return prisma.user.create({
            data,
            include: { role: { select: { name: true } } },
        });
    }
    async update(id, data) {
        return prisma.user.update({
            where: { id },
            data,
            include: { role: { select: { name: true } } },
        });
    }
    async delete(id) {
        return prisma.$transaction(async (tx) => {
            // 1. Delete direct child records referencing user
            await tx.refreshToken.deleteMany({ where: { userId: id } });
            await tx.notification.deleteMany({ where: { userId: id } });
            await tx.pointHistory.deleteMany({ where: { userId: id } });
            await tx.bankSampahLedger.deleteMany({ where: { userId: id } });
            await tx.aiRequestLog.deleteMany({ where: { userId: id } });
            await tx.auditTrail.deleteMany({ where: { userId: id } });
            await tx.activityAttendance.deleteMany({ where: { studentId: id } });
            await tx.studentLocation.deleteMany({ where: { studentId: id } });
            await tx.studentKkn.deleteMany({ where: { userId: id } });
            await tx.petugasResidu.deleteMany({ where: { userId: id } });
            await tx.household.deleteMany({ where: { userId: id } });
            await tx.binOwnership.deleteMany({ where: { userId: id } });
            await tx.setoranOtomatis.deleteMany({ where: { wargaId: id } });
            await tx.setoranManual.deleteMany({ where: { petugasResiduId: id } });
            await tx.ideDaurUlang.deleteMany({ where: { userId: id } });
            await tx.studentLeaveRequest.deleteMany({
                where: { OR: [{ studentId: id }, { reviewedById: id }] },
            });
            await tx.kknHandoverHistory.deleteMany({
                where: { OR: [{ fromUserId: id }, { toUserId: id }] },
            });
            // 2. Clear optional foreign key references on other models
            await tx.bin.updateMany({ where: { userId: id }, data: { userId: null } });
            await tx.bin.updateMany({
                where: { registeredByStudentId: id },
                data: { registeredByStudentId: null },
            });
            await tx.qrBatch.updateMany({
                where: { assignedPicUserId: id },
                data: { assignedPicUserId: null },
            });
            await tx.kelompokKkn.updateMany({ where: { dplId: id }, data: { dplId: null } });
            await tx.rw.updateMany({ where: { petugasResiduId: id }, data: { petugasResiduId: null } });
            await tx.dispatchTask.updateMany({
                where: { claimedByUserId: id },
                data: { claimedByUserId: null },
            });
            await tx.binResetRequest.deleteMany({
                where: { OR: [{ userId: id }, { reviewedById: id }] },
            });
            await tx.violation.deleteMany({
                where: { OR: [{ userId: id }, { petugasUserId: id }] },
            });
            // 3. Delete the user
            return tx.user.delete({
                where: { id },
            });
        });
    }
}
export const userRepository = new UserRepository();
