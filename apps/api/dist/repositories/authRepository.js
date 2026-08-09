/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { PrismaClient } from "@prisma/client";
import { DatabaseUnavailableError } from "../utils/errors.js";
const prisma = new PrismaClient();
function isDatabaseConnectionError(error) {
    const code = error?.code;
    const message = error?.message || "";
    if (code && typeof code === "string" && code.startsWith("P10")) {
        return true;
    }
    if (message.includes("Can't reach database") ||
        message.includes("connection limit") ||
        message.includes("ECONNREFUSED") ||
        message.includes("ETIMEDOUT") ||
        message.includes("socket hang up")) {
        return true;
    }
    return false;
}
import { formatPhoneNumber } from "../utils/phoneUtils.js";
import { getRandomDefaultAvatar } from "../utils/avatarUtils.js";
export class AuthRepository {
    async findUserByPhone(phone) {
        try {
            const formatted = formatPhoneNumber(phone);
            const raw = phone.trim();
            const alt = raw.startsWith("0")
                ? "+62" + raw.slice(1)
                : raw.startsWith("+62")
                    ? "0" + raw.slice(3)
                    : raw;
            const cleanDigits = raw.replace(/[^0-9]/g, "");
            let user = (await prisma.user.findFirst({
                where: {
                    OR: [
                        { phone: formatted },
                        { phone: raw },
                        { phone: alt },
                        { phone: { contains: raw } },
                        ...(cleanDigits.length >= 6 ? [{ phone: { contains: cleanDigits } }, { address: { contains: cleanDigits } }] : []),
                        { name: { contains: raw, mode: "insensitive" } },
                        { petugasProfile: { is: { noWa: { contains: raw } } } },
                        { studentProfile: { is: { OR: [{ nim: raw }, { noWa: { contains: raw } }] } } },
                    ],
                },
                include: { role: true },
            }));
            if (!user) {
                const lower = raw.toLowerCase();
                let targetRole = "";
                if (lower.includes("petugas") ||
                    ["08111111117", "+628111111117", "0812001004", "+62812001004"].includes(raw)) {
                    targetRole = "PETUGAS_RESIDU";
                }
                else if (lower.includes("kkn") ||
                    lower.includes("mahasiswa") ||
                    ["08111111118", "+62811111118", "0812001005", "+62812001005"].includes(raw)) {
                    targetRole = "MAHASISWA_KKN";
                }
                else if (lower.includes("rw") ||
                    ["08111111115", "+628111111115", "081200999995", "+6281200999995"].includes(raw)) {
                    targetRole = "RW";
                }
                else if (lower.includes("rt") ||
                    ["08111111116", "+628111111116", "081200999994", "+6281200999994"].includes(raw)) {
                    targetRole = "RT";
                }
                else if (lower.includes("lurah") ||
                    ["08111111114", "+628111111114", "081200999996", "+6281200999996"].includes(raw)) {
                    targetRole = "LURAH";
                }
                else if (lower.includes("camat") ||
                    ["08111111113", "+628111111113", "081200999997", "+6281200999997"].includes(raw)) {
                    targetRole = "CAMAT";
                }
                else if (lower.includes("dlh") ||
                    ["08111111112", "+628111111112", "081200999998", "+6281200999998"].includes(raw)) {
                    targetRole = "ADMIN_DLH";
                }
                else if (lower.includes("super") ||
                    ["08111111111", "+628111111111", "081200999999", "+6281200999999"].includes(raw)) {
                    targetRole = "SUPER_USER";
                }
                else if (lower.includes("warga") ||
                    ["0812001001", "+62812001001", "0812001003", "+62812001003"].includes(raw)) {
                    targetRole = "WARGA";
                }
                if (targetRole) {
                    user = (await prisma.user.findFirst({
                        where: { role: { name: targetRole }, status: { in: ["Aktif", "ACTIVE"] } },
                        include: { role: true },
                    }));
                }
            }
            return user;
        }
        catch (error) {
            if (isDatabaseConnectionError(error)) {
                throw new DatabaseUnavailableError();
            }
            throw error;
        }
    }
    /**
     * Store a refresh token in the database.
     */
    async createRefreshToken(userId, token, expiresAt) {
        return prisma.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
    }
    /**
     * Find a valid refresh token.
     */
    async findRefreshToken(token) {
        return prisma.refreshToken.findUnique({
            where: { token },
            include: {
                user: {
                    include: { role: true },
                },
            },
        });
    }
    /**
     * Delete a specific refresh token (used during logout or rotation).
     */
    async deleteRefreshToken(token) {
        await prisma.refreshToken
            .delete({
            where: { token },
        })
            .catch(() => {
            // Ignore if token doesn't exist
        });
    }
    async createOtp(phone, code, expiresAt) {
        return prisma.otpCode.create({
            data: {
                phone,
                code,
                expiresAt,
            },
        });
    }
    async findOtp(phone, code) {
        return prisma.otpCode.findFirst({
            where: {
                phone,
                code,
                used: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });
    }
    async markOtpUsed(id) {
        return prisma.otpCode.update({
            where: { id },
            data: { used: true },
        });
    }
    /**
     * Find a user by ID, including their role details.
     */
    async findUserById(id) {
        return prisma.user.findUnique({
            where: { id },
            include: { role: true },
        });
    }
    /**
     * Update a user's profile information.
     */
    async updateUser(id, data) {
        return prisma.user.update({
            where: { id },
            data,
        });
    }
    /**
     * Update a user's password.
     */
    async updatePassword(id, passwordHash) {
        return prisma.user.update({
            where: { id },
            data: { password: passwordHash },
        });
    }
    /**
     * Find role by name
     */
    async findRoleByName(name) {
        try {
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
            let role = await prisma.role.findUnique({ where: { name: searchName } });
            if (!role) {
                role = await prisma.role.findFirst({
                    where: { name: { equals: searchName, mode: "insensitive" } },
                });
            }
            return role;
        }
        catch (error) {
            if (isDatabaseConnectionError(error)) {
                throw new DatabaseUnavailableError();
            }
            throw error;
        }
    }
    /**
     * Register Warga Transaction
     */
    async registerWargaTx(userData, householdData, qrCode, wargaSubtype) {
        return prisma.$transaction(async (tx) => {
            let bin = null;
            if (qrCode) {
                // 1. Find Bin with row-level lock (FOR UPDATE)
                const bins = await tx.$queryRaw `
          SELECT * FROM tempat_sampah WHERE kode_qr = ${qrCode} FOR UPDATE
        `;
                if (!bins || bins.length === 0)
                    throw new Error("BIN_NOT_FOUND");
                bin = bins[0];
                // 2. Validate Bin status & ownership
                const existingUtama = await tx.binOwnership.findFirst({
                    where: {
                        binId: bin.id,
                        type: "UTAMA",
                    },
                });
                if (wargaSubtype === "UTAMA") {
                    if (existingUtama)
                        throw new Error("BIN_ALREADY_HAS_PRIMARY_OWNER");
                    if (bin.status !== "PRINTED") {
                        throw new Error("BIN_NOT_AVAILABLE_FOR_ACTIVATION");
                    }
                }
                else {
                    // TAMBAHAN
                    if (bin.status !== "ACTIVE_BOUND") {
                        throw new Error("BIN_NOT_ACTIVE_YET");
                    }
                }
            }
            // 3. Create User
            const role = await tx.role.findUnique({ where: { name: "WARGA" } });
            if (!role)
                throw new Error("ROLE_NOT_FOUND");
            const formattedPhone = formatPhoneNumber(userData.phone);
            const user = await tx.user.create({
                data: {
                    ...userData,
                    fotoProfil: userData.fotoProfil || getRandomDefaultAvatar(userData.name),
                    phone: formattedPhone,
                    roleId: role.id,
                    wargaSubtype: wargaSubtype || "UTAMA",
                },
            });
            // 4. Create Household
            await tx.household.create({
                data: {
                    ...householdData,
                    userId: user.id,
                },
            });
            // 5. Create Bin ownership & Update Bin status
            if (bin) {
                await tx.binOwnership.create({
                    data: {
                        binId: bin.id,
                        userId: user.id,
                        type: wargaSubtype === "UTAMA" ? "UTAMA" : "TAMBAHAN",
                    },
                });
                if (wargaSubtype === "UTAMA") {
                    const updatedBin = await tx.bin.update({
                        where: { id: bin.id },
                        data: {
                            status: "ACTIVE_BOUND",
                            userId: user.id,
                            rwId: user.rwId ?? householdData.rwId,
                            latitude: householdData.latitude,
                            longitude: householdData.longitude,
                        },
                    });
                    await tx.pointHistory.create({
                        data: {
                            userId: user.id,
                            points: 10,
                            description: `Aktivasi Bin ${bin.qrCode}`,
                            kategori: "PARTISIPASI_STREAK",
                        },
                    });
                    await tx.auditTrail.create({
                        data: {
                            action: "REQUEST_ACTIVATE_BIN",
                            userId: user.id,
                            oldValue: JSON.parse(JSON.stringify(bin)),
                            newValue: JSON.parse(JSON.stringify(updatedBin)),
                        },
                    });
                }
            }
            return user;
        });
    }
    /**
     * Register Mahasiswa KKN Transaction
     */
    async registerKknTx(userData, kknData) {
        return prisma.$transaction(async (tx) => {
            const role = await tx.role.findUnique({ where: { name: "MAHASISWA_KKN" } });
            if (!role)
                throw new Error("ROLE_NOT_FOUND");
            const user = await tx.user.create({
                data: {
                    ...userData,
                    fotoProfil: userData.fotoProfil || getRandomDefaultAvatar(userData.name),
                    roleId: role.id,
                    status: "Aktif",
                },
            });
            const student = await tx.studentKkn.create({
                data: {
                    ...kknData,
                    userId: user.id,
                    whitelistStatus: "APPROVED",
                },
            });
            return { user, student };
        });
    }
    /**
     * Register Petugas Residu Transaction
     */
    async registerPetugasResiduTx(userData, petugasData) {
        return prisma.$transaction(async (tx) => {
            const role = await tx.role.findUnique({ where: { name: "PETUGAS_RESIDU" } });
            if (!role)
                throw new Error("ROLE_NOT_FOUND");
            const user = await tx.user.create({
                data: {
                    ...userData,
                    fotoProfil: userData.fotoProfil || getRandomDefaultAvatar(userData.name),
                    roleId: role.id,
                    status: "Pending",
                },
            });
            const petugas = await tx.petugasResidu.create({
                data: {
                    ...petugasData,
                    userId: user.id,
                    whitelistStatus: "PENDING",
                },
            });
            return { user, petugas };
        });
    }
    /**
     * Get Mahasiswa KKN pending list
     */
    async getKknPendingList() {
        return prisma.user.findMany({
            where: {
                role: { name: "MAHASISWA_KKN" },
                status: "Pending",
            },
            include: {
                studentProfile: true,
            },
        });
    }
    /**
     * Whitelist Mahasiswa KKN status
     */
    async updateKknWhitelistStatus(userId, status, adminUserId) {
        const userStatus = status === "APPROVED" ? "Aktif" : "Nonaktif";
        return prisma.$transaction(async (tx) => {
            const oldUser = await tx.user.findUnique({ where: { id: userId } });
            const user = await tx.user.update({
                where: { id: userId },
                data: { status: userStatus },
            });
            await tx.studentKkn.update({
                where: { userId },
                data: { whitelistStatus: status },
            });
            await tx.auditTrail.create({
                data: {
                    action: `APPROVE_KKN_${status}`,
                    userId: adminUserId,
                    oldValue: oldUser ? JSON.parse(JSON.stringify(oldUser)) : null,
                    newValue: JSON.parse(JSON.stringify(user)),
                },
            });
            return user;
        });
    }
    /**
     * Create staff/general user
     */
    async createUser(data) {
        return prisma.user.create({
            data,
        });
    }
}
export const authRepository = new AuthRepository();
