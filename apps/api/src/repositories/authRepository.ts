/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
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

import { formatPhoneNumber } from "../utils/phoneUtils.js";
import { getRandomDefaultAvatar } from "../utils/avatarUtils.js";

export class AuthRepository {
  async findUserByPhone(phone: string): Promise<(User & { role: Role }) | null> {
    try {
      const formatted = formatPhoneNumber(phone);
      const raw = phone.trim();

      // Hasilkan format alternatif: 08xxx ↔ +628xxx
      const alt = raw.startsWith("0")
        ? "+62" + raw.slice(1)
        : raw.startsWith("+62")
          ? "0" + raw.slice(3)
          : raw;

      // Cari user hanya berdasarkan nomor telepon (3 format yang valid)
      const user = (await prisma.user.findFirst({
        where: {
          OR: [
            { phone: formatted },
            { phone: raw },
            { phone: alt },
            { studentProfile: { nim: raw } },
            { studentProfile: { nim: alt } },
          ],
        },
        include: { role: true },
      })) as (User & { role: Role }) | null;

      return user;
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

  async createOtp(phone: string, code: string, expiresAt: Date) {
    return prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt,
      },
    });
  }

  async findOtp(phone: string, code: string) {
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

  async markOtpUsed(id: string) {
    return prisma.otpCode.update({
      where: { id },
      data: { used: true },
    });
  }
  /**
   * Find a user by ID, including their role details.
   */
  async findUserById(id: string): Promise<any> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        rw: {
          include: {
            kelurahan: {
              include: {
                kecamatan: true,
              },
            },
          },
        },
        rt: true,
        studentProfile: {
          include: {
            assignedRw: {
              include: {
                kelurahan: {
                  include: {
                    kecamatan: true,
                  },
                },
              },
            },
            kelompok: true,
          },
        },
      },
    });
  }

  /**
   * Update a user's profile information.
   */
  async updateUser(
    id: string,
    data: { name?: string; phone?: string; address?: string; fotoProfil?: string; jumlahAnggotaKeluarga?: number | null }
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
      const normalizedMap: Record<string, string> = {
        Admin: "SUPER_USER",
        ADMIN: "SUPER_USER",
        "Super User": "SUPER_USER",
        "SUPER USER": "SUPER_USER",
        "Dinas Lingkungan Hidup": "ADMIN_DLH",
        Camat: "CAMAT",
        Lurah: "LURAH",
        "Rukun Warga": "RW",
        "Rukun Tetangga": "RT",
        "Dosen Pembimbing Lapangan": "DPL",
        "Petugas Residu": "PETUGAS_RESIDU",
        Mahasiswa: "MAHASISWA_KKN",
        "Mahasiswa KKN": "MAHASISWA_KKN",
        Warga: "WARGA",
        Pimpinan: "PEMIMPIN",
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
  async registerWargaTx(
    userData: any,
    householdData: any,
    qrCode?: string | null,
    wargaSubtype?: string | null
  ) {
    return prisma.$transaction(async (tx) => {
      let bin: any = null;
      if (qrCode) {
        // 1. Find Bin with row-level lock (FOR UPDATE)
        const bins = await tx.$queryRaw<any[]>`
          SELECT * FROM tempat_sampah WHERE kode_qr = ${qrCode} FOR UPDATE
        `;
        if (!bins || bins.length === 0) throw new Error("BIN_NOT_FOUND");
        bin = bins[0];

        // 2. Validate Bin status & ownership
        const existingUtama = await tx.binOwnership.findFirst({
          where: {
            binId: bin.id,
            type: "UTAMA",
          },
        });

        if (wargaSubtype === "UTAMA") {
          if (existingUtama) throw new Error("BIN_ALREADY_HAS_PRIMARY_OWNER");
          if (bin.status !== "PRINTED") {
            throw new Error("BIN_NOT_AVAILABLE_FOR_ACTIVATION");
          }
        } else {
          // TAMBAHAN
          if (bin.status !== "ACTIVE_BOUND") {
            throw new Error("BIN_NOT_ACTIVE_YET");
          }
        }
      }

      // 3. Create User
      const role = await tx.role.findUnique({ where: { name: "WARGA" } });
      if (!role) throw new Error("ROLE_NOT_FOUND");

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
  async registerKknTx(userData: any, kknData: any) {
    return prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({ where: { name: "MAHASISWA_KKN" } });
      if (!role) throw new Error("ROLE_NOT_FOUND");

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
  async registerPetugasResiduTx(userData: any, petugasData: any) {
    return prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({ where: { name: "PETUGAS_RESIDU" } });
      if (!role) throw new Error("ROLE_NOT_FOUND");

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
  async updateKknWhitelistStatus(userId: string, status: string, adminUserId: string) {
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
  async createUser(data: any): Promise<User> {
    return prisma.user.create({
      data,
    });
  }
}

export const authRepository = new AuthRepository();
