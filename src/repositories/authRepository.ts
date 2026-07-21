/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { PrismaClient, User, RefreshToken, Role } from "@prisma/client";
import { DatabaseUnavailableError } from "../utils/errors.js";

const prisma = new PrismaClient();

function isDatabaseConnectionError(error: any): boolean {
  const code = error?.code;
  const message = error?.message || "";
  if (code && typeof code === "string" && code.startsWith("P10")) {
    return true;
  }
  if (
    message.includes("Can't reach database") ||
    message.includes("connection limit") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("socket hang up")
  ) {
    return true;
  }
  return false;
}

export class AuthRepository {
  /**
   * Find a user by email, including their role details.
   */
  async findUserByEmail(email: string): Promise<(User & { role: Role }) | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: { role: true },
      });
    } catch (error: any) {
      if (isDatabaseConnectionError(error)) {
        throw new DatabaseUnavailableError();
      }
      throw error;
    }
  }

  /**
   * Find a user by NIK, including their role details.
   */
  async findUserByNik(nik: string): Promise<(User & { role: Role }) | null> {
    try {
      return await prisma.user.findUnique({
        where: { nik },
        include: { role: true },
      });
    } catch (error: any) {
      if (isDatabaseConnectionError(error)) {
        throw new DatabaseUnavailableError();
      }
      throw error;
    }
  }

  /**
   * Store a refresh token in the database.
   */
  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
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
  async findRefreshToken(
    token: string
  ): Promise<(RefreshToken & { user: User & { role: Role } }) | null> {
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
  async deleteRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken
      .delete({
        where: { token },
      })
      .catch(() => {
        // Ignore if token doesn't exist
      });
  }
  /**
   * Find a user by ID, including their role details.
   */
  async findUserById(id: string): Promise<(User & { role: Role }) | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  /**
   * Update a user's profile information.
   */
  async updateUser(
    id: string,
    data: { name?: string; email?: string; phone?: string; address?: string; fotoProfil?: string }
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Update a user's password.
   */
  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });
  }

  /**
   * Find role by name
   */
  async findRoleByName(name: string): Promise<Role | null> {
    try {
      return await prisma.role.findUnique({ where: { name } });
    } catch (error: any) {
      if (isDatabaseConnectionError(error)) {
        throw new DatabaseUnavailableError();
      }
      throw error;
    }
  }

  /**
   * Register Warga Transaction
   */
  async registerWargaTx(userData: any, householdData: any, qrCode: string, wargaSubtype: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Find Bin
      const bin = await tx.bin.findUnique({
        where: { qrCode },
      });
      if (!bin) throw new Error("BIN_NOT_FOUND");

      // 2. Validate Bin status
      if (wargaSubtype === "UTAMA") {
        if (bin.kepemilikanUtamaUserId) throw new Error("BIN_ALREADY_HAS_PRIMARY_OWNER");
        // Bin must be PRINTED or ASSIGNED_TO_PIC to be activated
        if (bin.status !== "PRINTED" && bin.status !== "ASSIGNED_TO_PIC") {
          throw new Error("BIN_NOT_AVAILABLE_FOR_ACTIVATION");
        }
      } else {
        // TAMBAHAN
        if (bin.status !== "ACTIVE_BOUND") {
          throw new Error("BIN_NOT_ACTIVE_YET");
        }
      }

      // 3. Create User
      const role = await tx.role.findUnique({ where: { name: "WARGA" } });
      if (!role) throw new Error("ROLE_NOT_FOUND");

      const user = await tx.user.create({
        data: {
          ...userData,
          roleId: role.id,
          wargaSubtype,
        },
      });

      // 4. Create Household
      await tx.household.create({
        data: {
          ...householdData,
          userId: user.id,
        },
      });

      // 5. Update Bin ownership & status
      if (wargaSubtype === "UTAMA") {
        await tx.bin.update({
          where: { id: bin.id },
          data: {
            kepemilikanUtamaUserId: user.id,
            status: "ACTIVE_BOUND",
          },
        });

        // Award +10 points to primary owner
        await tx.pointHistory.create({
          data: {
            userId: user.id,
            points: 10,
            description: `Bonus aktivasi tempat sampah ${qrCode}`,
          },
        });
      } else {
        // Warga Tambahan
        const currentTambahan = bin.kepemilikanTambahanUserIds || [];
        await tx.bin.update({
          where: { id: bin.id },
          data: {
            kepemilikanTambahanUserIds: [...currentTambahan, user.id],
          },
        });
      }

      return user;
    });
  }

  /**
   * Register Mahasiswa KKN Transaction
   */
  async registerKknTx(userData: any, kknData: any) {
    return prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({ where: { name: "MAHASISWA_KKN" } });
      if (!role) throw new Error("ROLE_NOT_FOUND");

      const user = await tx.user.create({
        data: {
          ...userData,
          roleId: role.id,
          status: "Pending", // KKN is pending whitelist by Admin DLH
        },
      });

      const student = await tx.studentKkn.create({
        data: {
          ...kknData,
          userId: user.id,
        },
      });

      return { user, student };
    });
  }

  /**
   * Register Petugas Residu Transaction
   */
  async registerPetugasResiduTx(userData: any, petugasData: any) {
    return prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({ where: { name: "PETUGAS_RESIDU" } });
      if (!role) throw new Error("ROLE_NOT_FOUND");

      const user = await tx.user.create({
        data: {
          ...userData,
          roleId: role.id,
        },
      });

      const petugas = await tx.petugasResidu.create({
        data: {
          ...petugasData,
          userId: user.id,
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
  async updateKknWhitelistStatus(userId: string, status: string) {
    const userStatus = status === "APPROVED" ? "Aktif" : "Nonaktif";
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { status: userStatus },
      });
      await tx.studentKkn.update({
        where: { userId },
        data: { whitelistStatus: status },
      });
      return user;
    });
  }

  /**
   * Create staff/general user
   */
  async createUser(data: any): Promise<User> {
    return prisma.user.create({
      data,
    });
  }
}

export const authRepository = new AuthRepository();
