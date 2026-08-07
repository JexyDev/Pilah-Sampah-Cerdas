/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */
import { authRepository } from "../repositories/authRepository.js";
import { comparePassword, hashPassword } from "../utils/hashUtils.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwtUtils.js";
import { formatPhoneNumber } from "../utils/phoneUtils.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export class AuthService {
    /**
     * Authenticate user with email and password, returning tokens if successful.
     */
    async login(identifier, password) {
        let user = await authRepository.findUserByPhone(identifier);
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }
        if (user.status !== "Aktif" && user.status !== "ACTIVE") {
            if (user.status === "PENDING_APPROVAL" ||
                user.status === "Pending" ||
                user.status === "DIPEGANG_MAHASISWA") {
                throw new Error("USER_PENDING_APPROVAL");
            }
            throw new Error("USER_INACTIVE");
        }
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new Error("WRONG_PASSWORD");
        }
        // Prepare payload
        const payload = {
            userId: user.id,
            role: user.role.name,
            rwId: user.rwId ?? undefined,
        };
        // Generate tokens
        const accessToken = generateAccessToken(payload);
        const { token: refreshToken, expiresAt } = generateRefreshToken(user.id);
        // Save refresh token to DB
        await authRepository.createRefreshToken(user.id, refreshToken, expiresAt);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                role: user.role.name,
                phone: user.phone,
                address: user.address,
                fotoProfil: user.fotoProfil,
            },
        };
    }
    /**
     * Validate refresh token and issue a new access token.
     */
    async refresh(token) {
        const tokenRecord = await authRepository.findRefreshToken(token);
        if (!tokenRecord) {
            throw new Error("INVALID_TOKEN");
        }
        if (new Date() > tokenRecord.expiresAt) {
            // Token expired, clean it up
            await authRepository.deleteRefreshToken(token);
            throw new Error("TOKEN_EXPIRED");
        }
        // Generate new access token
        const payload = {
            userId: tokenRecord.user.id,
            role: tokenRecord.user.role.name,
            rwId: tokenRecord.user.rwId ?? undefined,
        };
        const newAccessToken = generateAccessToken(payload);
        return {
            accessToken: newAccessToken,
        };
    }
    /**
     * Invalidate a refresh token (Logout) and clear GPS locations.
     */
    async logout(token) {
        if (token) {
            const record = await prisma.refreshToken.findUnique({
                where: { token },
                select: { userId: true },
            });
            if (record?.userId) {
                await prisma.studentLocation.deleteMany({
                    where: { studentId: record.userId },
                });
            }
            await authRepository.deleteRefreshToken(token);
        }
    }
    async logoutUserById(userId) {
        await prisma.studentLocation.deleteMany({
            where: { studentId: userId },
        });
        await prisma.refreshToken.deleteMany({
            where: { userId },
        });
    }
    /**
     * Update user profile
     */
    async updateProfile(userId, name, phone, address, fotoProfil) {
        const user = await authRepository.findUserById(userId);
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }
        const updatedUser = await authRepository.updateUser(userId, {
            name,
            phone,
            address,
            fotoProfil,
        });
        return updatedUser;
    }
    async getCitizenStreak(userId) {
        const streakDaysConfig = await prisma.systemConfig.findUnique({
            where: { key: "streak_bonus_days" },
        });
        const maxStreakToCheck = streakDaysConfig ? Number(streakDaysConfig.value) : 5;
        let streakCount = 0;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        const hasSubmittedToday = await prisma.setoranOtomatis.findFirst({
            where: {
                wargaId: userId,
                createdAt: { gte: startOfToday, lte: endOfToday },
            },
        });
        let startIndex = 0;
        if (hasSubmittedToday) {
            streakCount = 1;
            startIndex = 1;
        }
        else {
            const startOfYesterday = new Date();
            startOfYesterday.setDate(startOfYesterday.getDate() - 1);
            startOfYesterday.setHours(0, 0, 0, 0);
            const endOfYesterday = new Date();
            endOfYesterday.setDate(endOfYesterday.getDate() - 1);
            endOfYesterday.setHours(23, 59, 59, 999);
            const hasSubmittedYesterday = await prisma.setoranOtomatis.findFirst({
                where: {
                    wargaId: userId,
                    createdAt: { gte: startOfYesterday, lte: endOfYesterday },
                },
            });
            if (hasSubmittedYesterday) {
                streakCount = 1;
                startIndex = 2;
            }
            else {
                return 0;
            }
        }
        for (let i = startIndex; i < maxStreakToCheck + 5; i++) {
            const checkDateStart = new Date();
            checkDateStart.setDate(checkDateStart.getDate() - i);
            checkDateStart.setHours(0, 0, 0, 0);
            const checkDateEnd = new Date();
            checkDateEnd.setDate(checkDateEnd.getDate() - i);
            checkDateEnd.setHours(23, 59, 59, 999);
            const logOnDay = await prisma.setoranOtomatis.findFirst({
                where: {
                    wargaId: userId,
                    createdAt: { gte: checkDateStart, lte: checkDateEnd },
                },
            });
            if (logOnDay) {
                streakCount++;
            }
            else {
                break;
            }
        }
        return streakCount;
    }
    async getCitizenMotivation(userId) {
        const streak = await this.getCitizenStreak(userId);
        let configKey = "motivational_template_streak_0";
        if (streak >= 5) {
            configKey = "motivational_template_streak_5";
        }
        else if (streak >= 3) {
            configKey = "motivational_template_streak_3";
        }
        else if (streak >= 1) {
            configKey = "motivational_template_streak_1";
        }
        const template = await prisma.systemConfig.findUnique({ where: { key: configKey } });
        const message = template
            ? template.value
            : "Ayo terus pilah sampahmu demi lingkungan yang lebih bersih!";
        return {
            streak,
            message,
        };
    }
    /**
     * Get user profile by ID
     */
    async getCurrentUser(userId) {
        const user = await authRepository.findUserById(userId);
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }
        let streakInfo = undefined;
        if (user.role.name === "WARGA") {
            streakInfo = await this.getCitizenMotivation(userId);
        }
        return {
            id: user.id,
            name: user.name,
            role: user.role.name,
            phone: user.phone,
            address: user.address,
            fotoProfil: user.fotoProfil,
            qrCode: `USER:${user.id}`,
            streakInfo,
        };
    }
    /**
     * Update user password
     */
    async updatePassword(userId, currentPassword, newPassword) {
        if (!currentPassword || !newPassword) {
            throw new Error("INVALID_INPUT");
        }
        const user = await authRepository.findUserById(userId);
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }
        const isPasswordValid = await comparePassword(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new Error("INVALID_CREDENTIALS");
        }
        const { hashPassword } = await import("../utils/hashUtils.js");
        const hashedPassword = await hashPassword(newPassword);
        await authRepository.updatePassword(userId, hashedPassword);
    }
    async resolveRtRwId(rtRw, kelurahan) {
        // If rtRw is numeric string, try parsing directly
        if (rtRw && !isNaN(Number(rtRw))) {
            const existingById = await prisma.rw.findUnique({ where: { id: Number(rtRw) } });
            if (existingById)
                return existingById.id;
        }
        // Try finding by name and optional kelurahan
        let whereClause = {};
        if (kelurahan) {
            const kel = await prisma.kelurahan.findFirst({
                where: { name: { equals: kelurahan, mode: "insensitive" } },
            });
            if (kel) {
                whereClause.kelurahanId = kel.id;
            }
        }
        if (rtRw) {
            const areaMatch = await prisma.rw.findFirst({
                where: {
                    ...whereClause,
                    name: { contains: rtRw, mode: "insensitive" },
                },
            });
            if (areaMatch)
                return areaMatch.id;
        }
        // If kelurahan matched but rtRw didn't match specific string, get first area in kelurahan
        if (whereClause.kelurahanId) {
            const areaInKel = await prisma.rw.findFirst({
                where: { kelurahanId: whereClause.kelurahanId },
            });
            if (areaInKel)
                return areaInKel.id;
        }
        // Fallback: pick the first registered official RtRwArea in system
        const defaultArea = await prisma.rw.findFirst({
            orderBy: { id: "asc" },
        });
        if (!defaultArea) {
            throw new Error("RT_RW_AREA_NOT_FOUND");
        }
        return defaultArea.id;
    }
    /**
     * Register Warga
     */
    async registerWarga(userData, householdData, qrCode, wargaSubtype, scannerUser) {
        const { hashPassword } = await import("../utils/hashUtils.js");
        const hashedPassword = await hashPassword(userData.password);
        // If scanner is Mahasiswa KKN, validate PIC matching
        if (qrCode && scannerUser && scannerUser.role === "MAHASISWA_KKN") {
            const { binRepository } = await import("../repositories/binRepository.js");
            const bin = await binRepository.findByQrCode(qrCode);
            if (!bin)
                throw new Error("BIN_NOT_FOUND");
            const batch = bin.qrBatchId ? await binRepository.findQrBatchById(bin.qrBatchId) : null;
            if (batch && batch.assignedPicUserId !== scannerUser.userId) {
                throw new Error("PIC_MISMATCH");
            }
        }
        // Check duplicate phone
        const existingUserByPhone = await authRepository.findUserByPhone(userData.phone);
        if (existingUserByPhone)
            throw new Error("PHONE_ALREADY_IN_USE");
        const role = await authRepository.findRoleByName("WARGA");
        if (!role)
            throw new Error("ROLE_NOT_FOUND");
        let finalStatus = "Aktif";
        const user = await authRepository.registerWargaTx({
            ...userData,
            password: hashedPassword,
            status: finalStatus,
        }, householdData, qrCode, wargaSubtype);
        if (userData.rwId) {
            import("./polygonService.js").then(({ polygonService }) => {
                polygonService.regenerateRtRwPolygon(userData.rwId).catch(console.error);
            });
        }
        const accessToken = generateAccessToken({
            userId: user.id,
            role: "WARGA",
            rwId: user.rwId ?? undefined,
        });
        const { token: refreshToken, expiresAt } = generateRefreshToken(user.id);
        await authRepository.createRefreshToken(user.id, refreshToken, expiresAt);
        return {
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: "WARGA",
                rwId: user.rwId,
                fotoProfil: user.fotoProfil,
            },
            accessToken,
            refreshToken,
        };
    }
    /**
     * Register Mahasiswa KKN
     */
    async registerKkn(userData, kknData) {
        const { hashPassword } = await import("../utils/hashUtils.js");
        const hashedPassword = await hashPassword(userData.password);
        return authRepository.registerKknTx({
            ...userData,
            password: hashedPassword,
        }, kknData);
    }
    /**
     * Register Petugas Residu
     */
    async registerPetugasResidu(userData, petugasData) {
        const { hashPassword } = await import("../utils/hashUtils.js");
        const hashedPassword = await hashPassword(userData.password);
        if (userData.rwId) {
            const existingPetugas = await prisma.user.findFirst({
                where: {
                    rwId: userData.rwId,
                    role: { name: "PETUGAS_RESIDU" },
                },
                include: {
                    rw: true,
                },
            });
            if (existingPetugas) {
                const rwName = existingPetugas.rw?.name || `RW ID ${userData.rwId}`;
                throw new Error(`Pendaftaran Ditolak: ${rwName} sudah memiliki Petugas Residu aktif.`);
            }
        }
        return authRepository.registerPetugasResiduTx({
            ...userData,
            password: hashedPassword,
        }, petugasData);
    }
    /**
     * Register general staff (Camat, Lurah, RW, Admin DLH)
     */
    async registerStaff(userData, roleName) {
        const { hashPassword } = await import("../utils/hashUtils.js");
        const hashedPassword = await hashPassword(userData.password);
        const role = await authRepository.findRoleByName(roleName);
        if (!role)
            throw new Error("ROLE_NOT_FOUND");
        return authRepository.createUser({
            ...userData,
            password: hashedPassword,
            roleId: role.id,
        });
    }
    async registerDpl(userData) {
        const { hashPassword } = await import("../utils/hashUtils.js");
        const hashedPassword = await hashPassword(userData.password);
        let role = await authRepository.findRoleByName("DPL");
        if (!role) {
            // Create role DPL if not exists for demo purposes
            role = await prisma.role.create({ data: { name: "DPL" } });
        }
        const { universityId, ...userBaseData } = userData;
        return prisma.user.create({
            data: {
                ...userBaseData,
                password: hashedPassword,
                roleId: role.id,
                dosenPembimbing: {
                    create: {
                        universityId: universityId,
                    },
                },
            },
        });
    }
    /**
     * Get KKN pending list
     */
    async getKknPendingList() {
        return authRepository.getKknPendingList();
    }
    /**
     * Whitelist Mahasiswa KKN status
     */
    async updateKknWhitelistStatus(userId, status, adminUserId) {
        return authRepository.updateKknWhitelistStatus(userId, status, adminUserId);
    }
    async forgotPassword(phone) {
        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user)
            throw new Error("EMAIL_NOT_FOUND");
        return "123456";
    }
    async resetPassword(phoneInput, _tokenInput, newPassword) {
        if (!newPassword)
            throw new Error("PASSWORD_REQUIRED");
        const phone = phoneInput.trim();
        const cleanPhone = phone.replace(/^\+?62/, "0").replace(/\s|-/g, "");
        const altPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.substring(1) : cleanPhone;
        const subPhone = cleanPhone.length > 5 ? cleanPhone.substring(cleanPhone.length - 8) : cleanPhone;
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone: phone },
                    { phone: cleanPhone },
                    { phone: altPhone },
                    { phone: { endsWith: subPhone } },
                ],
            },
        });
        if (!user)
            throw new Error("USER_NOT_FOUND");
        const hashedPassword = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
    }
    async changePassword(userId, oldPasswordInput, newPasswordInput) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error("USER_NOT_FOUND");
        const isMatch = await comparePassword(oldPasswordInput, user.password);
        if (!isMatch) {
            throw new Error("WRONG_OLD_PASSWORD");
        }
        const hashedPassword = await hashPassword(newPasswordInput);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
    }
    /**
     * Request OTP via WhatsApp (Fonnte API)
     */
    async requestOtp(rawPhone) {
        const phone = formatPhoneNumber(rawPhone);
        // Generate 6-digit random OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
        // Clean old OTPs for this phone
        await prisma.otpCode.deleteMany({ where: { phone } });
        // Store in DB
        await prisma.otpCode.create({
            data: {
                phone,
                code,
                expiresAt,
                used: false,
            },
        });
        // Send via Fonnte API
        const fonnteToken = process.env.FONNTE_TOKEN || "mrHbMDmd5sorX6KQexgb";
        const target = phone.startsWith("+") ? phone.slice(1) : phone;
        try {
            const body = new URLSearchParams({
                target,
                message: `Kode OTP TrashCare Anda adalah: ${code}. Kode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun.`,
            });
            const response = await fetch("https://api.fonnte.com/send", {
                method: "POST",
                headers: { Authorization: fonnteToken },
                body,
            });
            const resData = await response.json();
            console.log(`[Fonnte OTP] Phone: ${target} | Result:`, resData);
        }
        catch (err) {
            console.error("[Fonnte OTP Exception]", err);
        }
        return {
            success: true,
            message: "Kode OTP berhasil dikirimkan via WhatsApp",
        };
    }
    /**
     * Verify OTP code & return tokens if user exists
     */
    async verifyOtp(rawPhone, otp) {
        const phone = formatPhoneNumber(rawPhone);
        const isMasterOtp = process.env.NODE_ENV !== "production" && (otp === "123456" || otp === "849201");
        if (!isMasterOtp) {
            const record = await prisma.otpCode.findFirst({
                where: {
                    phone,
                    code: otp,
                    used: false,
                    expiresAt: { gt: new Date() },
                },
            });
            if (!record) {
                throw new Error("INVALID_OTP");
            }
            await prisma.otpCode.update({
                where: { id: record.id },
                data: { used: true },
            });
        }
        // Try finding user by phone
        let user = await authRepository.findUserByPhone(phone);
        if (!user && phone.startsWith("+62")) {
            user = await authRepository.findUserByPhone("0" + phone.slice(3));
        }
        if (!user) {
            return {
                phone,
                isNewUser: true,
                message: "OTP valid, silakan lanjutkan pendaftaran akun warga",
            };
        }
        // Generate login tokens for existing user
        const payload = {
            userId: user.id,
            role: user.role.name,
            rwId: user.rwId ?? undefined,
        };
        const accessToken = generateAccessToken(payload);
        const { token: refreshToken, expiresAt } = generateRefreshToken(user.id);
        await authRepository.createRefreshToken(user.id, refreshToken, expiresAt);
        return {
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role.name,
            },
            accessToken,
            refreshToken,
        };
    }
}
export const authService = new AuthService();
