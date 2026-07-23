/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { authRepository } from "../repositories/authRepository.js";
import { comparePassword } from "../utils/hashUtils.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwtUtils.js";
import { PrismaClient } from "@prisma/client";
import { notificationIntegrationService } from "./notificationIntegrationService.js";

const prisma = new PrismaClient();

export class AuthService {
  /**
   * Authenticate user with email and password, returning tokens if successful.
   */
  async login(phone: string, password: string) {
    const isPhone = /^\+62\d{8,15}$/.test(phone);
    if (!isPhone) {
      throw new Error("USER_NOT_FOUND");
    }
    
    let user = await authRepository.findUserByPhone(phone);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (user.status !== "Aktif" && user.status !== "ACTIVE") {
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
      rtRwId: user.rtRwId ?? undefined,
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
        email: user.email,
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
  async refresh(token: string) {
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
      rtRwId: tokenRecord.user.rtRwId ?? undefined,
    };
    const newAccessToken = generateAccessToken(payload);

    return {
      accessToken: newAccessToken,
    };
  }

  /**
   * Invalidate a refresh token (Logout).
   */
  async logout(token: string) {
    await authRepository.deleteRefreshToken(token);
  }

  async requestOtp(phone: string) {
    const user = await authRepository.findUserByPhone(phone);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Generate 6 digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    await authRepository.createOtp(phone, otp, expiresAt);

    await notificationIntegrationService.sendWhatsApp(
      phone,
      `Kode OTP Anda untuk masuk ke Pilah Sampah Cerdas adalah: ${otp}. Kode berlaku selama 5 menit.`,
      "OTP"
    ).catch(e => console.error("WhatsApp OTP error:", e));
    
    return {
      message: "OTP sent via WhatsApp",
      expiresIn: "5 minutes"
    };
  }

  async verifyOtp(phone: string, otp: string) {
    const user = await authRepository.findUserByPhone(phone);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const otpRecord = await authRepository.findOtp(phone, otp);
    if (!otpRecord) {
      throw new Error("INVALID_OTP");
    }

    await authRepository.markOtpUsed(otpRecord.id);

    // Prepare payload
    const payload = {
      userId: user.id,
      role: user.role.name,
      rtRwId: user.rtRwId ?? undefined,
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
        email: user.email,
        role: user.role.name,
        phone: user.phone,
        address: user.address,
        fotoProfil: user.fotoProfil,
      },
    };
  }
  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    name?: string,
    email?: string,
    phone?: string,
    address?: string,
    fotoProfil?: string
  ) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (email && email !== user.email) {
      const existingUser = await authRepository.findUserByEmail(email);
      if (existingUser) {
        throw new Error("EMAIL_ALREADY_IN_USE");
      }
    }

    const updatedUser = await authRepository.updateUser(userId, {
      name,
      email,
      phone,
      address,
      fotoProfil,
    });
    return updatedUser;
  }

  async getCitizenStreak(userId: string): Promise<number> {
    const streakDaysConfig = await prisma.systemConfig.findUnique({
      where: { key: "streak_bonus_days" },
    });
    const maxStreakToCheck = streakDaysConfig ? Number(streakDaysConfig.value) : 5;

    let streakCount = 0;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const hasSubmittedToday = await prisma.wasteLog.findFirst({
      where: {
        household: { userId },
        createdAt: { gte: startOfToday, lte: endOfToday }
      }
    });

    let startIndex = 0;
    if (hasSubmittedToday) {
      streakCount = 1;
      startIndex = 1;
    } else {
      const startOfYesterday = new Date();
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      startOfYesterday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date();
      endOfYesterday.setDate(endOfYesterday.getDate() - 1);
      endOfYesterday.setHours(23, 59, 59, 999);

      const hasSubmittedYesterday = await prisma.wasteLog.findFirst({
        where: {
          household: { userId },
          createdAt: { gte: startOfYesterday, lte: endOfYesterday }
        }
      });

      if (hasSubmittedYesterday) {
        streakCount = 1;
        startIndex = 2;
      } else {
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

      const logOnDay = await prisma.wasteLog.findFirst({
        where: {
          household: { userId },
          createdAt: { gte: checkDateStart, lte: checkDateEnd }
        }
      });

      if (logOnDay) {
        streakCount++;
      } else {
        break;
      }
    }

    return streakCount;
  }

  async getCitizenMotivation(userId: string) {
    const streak = await this.getCitizenStreak(userId);
    let configKey = "motivational_template_streak_0";
    if (streak >= 5) {
      configKey = "motivational_template_streak_5";
    } else if (streak >= 3) {
      configKey = "motivational_template_streak_3";
    } else if (streak >= 1) {
      configKey = "motivational_template_streak_1";
    }

    const template = await prisma.systemConfig.findUnique({ where: { key: configKey } });
    const message = template ? template.value : "Ayo terus pilah sampahmu demi lingkungan yang lebih bersih!";

    return {
      streak,
      message
    };
  }

  /**
   * Get user profile by ID
   */
  async getCurrentUser(userId: string) {
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
      email: user.email,
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
  async updatePassword(userId: string, currentPassword?: string, newPassword?: string) {
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

  /**
   * Register Warga
   */
  async registerWarga(
    userData: any,
    householdData: any,
    qrCode?: string,
    wargaSubtype?: string,
    scannerUser?: any
  ) {
    const { hashPassword } = await import("../utils/hashUtils.js");
    const hashedPassword = await hashPassword(userData.password);

    // If scanner is Mahasiswa KKN, validate PIC matching
    if (qrCode && scannerUser && scannerUser.role === "MAHASISWA_KKN") {
      const { binRepository } = await import("../repositories/binRepository.js");
      const bin = await binRepository.findByQrCode(qrCode);
      if (!bin) throw new Error("BIN_NOT_FOUND");

      const batch = bin.qrBatchId ? await binRepository.findQrBatchById(bin.qrBatchId) : null;
      if (batch && batch.assignedPicUserId !== scannerUser.userId) {
        throw new Error("PIC_MISMATCH");
      }
    }

    // Check duplicate email
    const existingUserByEmail = await authRepository.findUserByEmail(userData.email);
    if (existingUserByEmail) throw new Error("EMAIL_ALREADY_IN_USE");

    // Check duplicate NIK
    if (userData.nik) {
      const existingUserByNik = await authRepository.findUserByNik(userData.nik);
      if (existingUserByNik) throw new Error("NIK_ALREADY_IN_USE");
    }

    const user = await authRepository.registerWargaTx(
      {
        ...userData,
        password: hashedPassword,
      },
      householdData,
      qrCode,
      wargaSubtype
    );

    const accessToken = generateAccessToken({
      userId: user.id,
      role: "WARGA",
      rtRwId: user.rtRwId ?? undefined,
    });
    const { token: refreshToken, expiresAt } = generateRefreshToken(user.id);

    await authRepository.createRefreshToken(user.id, refreshToken, expiresAt);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: "WARGA",
        rtRwId: user.rtRwId,
        fotoProfil: user.fotoProfil,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Register Mahasiswa KKN
   */
  async registerKkn(userData: any, kknData: any) {
    const { hashPassword } = await import("../utils/hashUtils.js");
    const hashedPassword = await hashPassword(userData.password);

    const existingUserByEmail = await authRepository.findUserByEmail(userData.email);
    if (existingUserByEmail) throw new Error("EMAIL_ALREADY_IN_USE");

    if (userData.nik) {
      const existingUserByNik = await authRepository.findUserByNik(userData.nik);
      if (existingUserByNik) throw new Error("NIK_ALREADY_IN_USE");
    }

    return authRepository.registerKknTx(
      {
        ...userData,
        password: hashedPassword,
      },
      kknData
    );
  }

  /**
   * Register Petugas Residu
   */
  async registerPetugasResidu(userData: any, petugasData: any) {
    const { hashPassword } = await import("../utils/hashUtils.js");
    const hashedPassword = await hashPassword(userData.password);

    const existingUserByEmail = await authRepository.findUserByEmail(userData.email);
    if (existingUserByEmail) throw new Error("EMAIL_ALREADY_IN_USE");

    if (userData.nik) {
      const existingUserByNik = await authRepository.findUserByNik(userData.nik);
      if (existingUserByNik) throw new Error("NIK_ALREADY_IN_USE");
    }

    return authRepository.registerPetugasResiduTx(
      {
        ...userData,
        password: hashedPassword,
      },
      petugasData
    );
  }

  /**
   * Register general staff (Camat, Lurah, RW, Admin DLH)
   */
  async registerStaff(userData: any, roleName: string) {
    const { hashPassword } = await import("../utils/hashUtils.js");
    const hashedPassword = await hashPassword(userData.password);

    const existingUserByEmail = await authRepository.findUserByEmail(userData.email);
    if (existingUserByEmail) throw new Error("EMAIL_ALREADY_IN_USE");

    if (userData.nik) {
      const existingUserByNik = await authRepository.findUserByNik(userData.nik);
      if (existingUserByNik) throw new Error("NIK_ALREADY_IN_USE");
    }

    const role = await authRepository.findRoleByName(roleName);
    if (!role) throw new Error("ROLE_NOT_FOUND");

    return authRepository.createUser({
      ...userData,
      password: hashedPassword,
      roleId: role.id,
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
  async updateKknWhitelistStatus(userId: string, status: string, adminUserId: string) {
    return authRepository.updateKknWhitelistStatus(userId, status, adminUserId);
  }
}

export const authService = new AuthService();
