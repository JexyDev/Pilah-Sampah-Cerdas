/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "./authService.js";
import { authRepository } from "../repositories/authRepository.js";
import { binRepository } from "../repositories/binRepository.js";
import { prisma } from "../lib/prisma.js";
import { comparePassword } from "../utils/hashUtils.js";

vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      pointHistory: {
        findFirst: vi.fn(),
        create: vi.fn(),
        aggregate: vi.fn().mockResolvedValue({ _sum: { points: 0 } }),
      },
      kelompokKkn: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      systemConfig: {
        findUnique: vi.fn(),
      },
    },
  };
});

vi.mock("../repositories/authRepository.js", () => {
  return {
    authRepository: {
      findUserByPhone: vi.fn(),
      registerWargaTx: vi.fn(),
      createRefreshToken: vi.fn(),
      findRoleByName: vi.fn(),
    },
  };
});

vi.mock("../repositories/binRepository.js", () => {
  return {
    binRepository: {
      findByQrCode: vi.fn(),
      findQrBatchById: vi.fn(),
    },
  };
});

vi.mock("../utils/hashUtils.js", () => {
  return {
    hashPassword: vi.fn().mockResolvedValue("hashed_password"),
    comparePassword: vi.fn().mockResolvedValue(true),
  };
});

describe("AuthService - registerWarga security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authRepository.findUserByPhone).mockResolvedValue(null);

    vi.mocked(authRepository.findRoleByName).mockResolvedValue({ id: 1, name: "WARGA" } as any);
  });

  it("should throw PIC_MISMATCH when Mahasiswa KKN registers a bin assigned to another PIC", async () => {
    const scannerUser = { userId: "kkn-1", role: "MAHASISWA_KKN" };
    const qrCode = "QR-BATCH-1-123456";
    const wargaSubtype = "UTAMA";

    const mockBin = {
      id: "bin-1",
      qrCode,
      qrBatchId: "batch-1",
    };

    const mockBatch = {
      id: "batch-1",
      assignedPicUserId: "kkn-different-pic",
    };

    vi.mocked(binRepository.findByQrCode).mockResolvedValue(mockBin as any);
    vi.mocked(binRepository.findQrBatchById).mockResolvedValue(mockBatch as any);

    await expect(
      authService.registerWarga(
        { phone: "081234567890", password: "password123", name: "Warga" },
        {},
        qrCode,
        wargaSubtype,
        scannerUser
      )
    ).rejects.toThrow("PIC_MISMATCH");
  });

  it("should allow registration when Mahasiswa KKN registers a bin assigned to themselves", async () => {
    const scannerUser = { userId: "kkn-1", role: "MAHASISWA_KKN" };
    const qrCode = "QR-BATCH-1-123456";
    const wargaSubtype = "UTAMA";

    const mockBin = {
      id: "bin-1",
      qrCode,
      qrBatchId: "batch-1",
    };

    const mockBatch = {
      id: "batch-1",
      assignedPicUserId: "kkn-1",
    };

    vi.mocked(binRepository.findByQrCode).mockResolvedValue(mockBin as any);
    vi.mocked(binRepository.findQrBatchById).mockResolvedValue(mockBatch as any);

    vi.mocked(authRepository.registerWargaTx).mockResolvedValue({ id: "warga-1" } as any);

    const result = await authService.registerWarga(
      { phone: "081234567890", password: "password123", name: "Warga" },
      {},
      qrCode,
      wargaSubtype,
      scannerUser
    );

    expect(authRepository.registerWargaTx).toHaveBeenCalled();
    expect(authRepository.createRefreshToken).toHaveBeenCalledWith(
      "warga-1",
      expect.any(String),
      expect.any(Date)
    );
    expect(result).toEqual({
      user: {
        id: "warga-1",
        name: undefined,

        phone: undefined,
        role: "WARGA",
        rwId: undefined,
        fotoProfil: undefined,
      },
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  describe("AuthService - Login Point Bonus", () => {
    it("should award +20 bonus points on first login for MAHASISWA_KKN", async () => {
      const mockKknUser = {
        id: "kkn-user-1",
        name: "Mahasiswa KKN Test",
        phone: "081234567891",
        password: "hashed_password",
        status: "Aktif",
        role: { name: "MAHASISWA_KKN" },
      };

      vi.mocked(authRepository.findUserByPhone).mockResolvedValue(mockKknUser as any);
      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.pointHistory.create).mockResolvedValue({ id: "pt-1" } as any);
      vi.mocked(prisma.pointHistory.aggregate).mockResolvedValue({ _sum: { points: 20 } } as any);

      const result = await authService.login("081234567891", "password123");

      expect(prisma.pointHistory.findFirst).toHaveBeenCalledWith({
        where: {
          userId: "kkn-user-1",
          OR: [
            { kategori: "BONUS_LOGIN_PERTAMA" },
            { kategori: "BONUS_REGISTRASI" },
            { description: { contains: "Bonus login pertama" } },
            { description: { contains: "Bonus registrasi" } },
          ],
        },
      });
      expect(prisma.pointHistory.create).toHaveBeenCalledWith({
        data: {
          userId: "kkn-user-1",
          points: 20,
          description: "Bonus login pertama Mahasiswa KKN",
          kategori: "BONUS_LOGIN_PERTAMA",
          redeemable: false,
        },
      });
      expect(result.user.points).toBe(20);
    });

    it("should NOT award bonus points on subsequent login for MAHASISWA_KKN", async () => {
      const mockKknUser = {
        id: "kkn-user-1",
        name: "Mahasiswa KKN Test",
        phone: "081234567891",
        password: "hashed_password",
        status: "Aktif",
        role: { name: "MAHASISWA_KKN" },
      };

      vi.mocked(authRepository.findUserByPhone).mockResolvedValue(mockKknUser as any);
      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue({ id: "pt-existing" } as any);
      vi.mocked(prisma.pointHistory.aggregate).mockResolvedValue({ _sum: { points: 20 } } as any);

      await authService.login("081234567891", "password123");

      expect(prisma.pointHistory.create).not.toHaveBeenCalled();
    });

    it("should NOT award bonus points for other roles like WARGA or PETUGAS_RESIDU on login", async () => {
      const mockWargaUser = {
        id: "warga-user-1",
        name: "Warga Test",
        phone: "081234567892",
        password: "hashed_password",
        status: "Aktif",
        role: { name: "WARGA" },
      };

      vi.mocked(authRepository.findUserByPhone).mockResolvedValue(mockWargaUser as any);
      vi.mocked(prisma.pointHistory.aggregate).mockResolvedValue({ _sum: { points: 0 } } as any);

      await authService.login("081234567892", "password123");

      expect(prisma.pointHistory.findFirst).not.toHaveBeenCalled();
      expect(prisma.pointHistory.create).not.toHaveBeenCalled();
    });
  });

  describe("AuthService - changePassword & updatePassword NIM Fallback", () => {
    it("should allow changePassword when Mahasiswa KKN inputs NIM as oldPassword", async () => {
      const mockUser = {
        id: "mhs-1",
        password: "$2a$10$hashedDefaultPassword",
        studentProfile: {
          nim: "10123001",
        },
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(comparePassword).mockResolvedValue(false);
      vi.mocked(prisma.user.update).mockResolvedValue({ id: "mhs-1" } as any);

      await authService.changePassword("mhs-1", "10123001", "NewSecurePassword123!");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "mhs-1" },
        data: {
          password: "hashed_password",
          mustChangePassword: false,
        },
      });
    });

    it("should allow updatePassword when Mahasiswa KKN inputs NIM as currentPassword", async () => {
      const mockUser = {
        id: "mhs-1",
        password: "$2a$10$hashedDefaultPassword",
        studentProfile: {
          nim: "10123001",
        },
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(comparePassword).mockResolvedValue(false);
      vi.mocked(prisma.user.update).mockResolvedValue({ id: "mhs-1" } as any);

      await authService.updatePassword("mhs-1", "10123001", "NewSecurePassword123!");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "mhs-1" },
        data: {
          password: "hashed_password",
          mustChangePassword: false,
        },
      });
    });

    it("should reject changePassword when old password does not match hash or NIM", async () => {
      const mockUser = {
        id: "mhs-1",
        password: "$2a$10$hashedDefaultPassword",
        studentProfile: {
          nim: "10123001",
        },
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(comparePassword).mockResolvedValue(false);

      await expect(
        authService.changePassword("mhs-1", "wrongpassword", "NewSecurePassword123!")
      ).rejects.toThrow("WRONG_OLD_PASSWORD");
    });
  });
});
