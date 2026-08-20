/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { userService } from "./userService.js";
import { userRepository } from "../repositories/userRepository.js";

// Mock the userRepository
vi.mock("../repositories/userRepository.js", () => {
  return {
    userRepository: {
      findMany: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByNik: vi.fn(),
      findRoleByName: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
});

// Mock hashUtils
vi.mock("../utils/hashUtils.js", () => {
  return {
    hashPassword: vi.fn().mockResolvedValue("hashed_password"),
  };
});

vi.mock("../utils/rbacScoping.js", () => {
  return {
    getScopingFilters: vi.fn().mockResolvedValue({}),
  };
});

const {
  mockPrismaUserCreate,
  mockPrismaStudentKknCreate,
  mockPrismaUserFindUnique,
  mockPrismaTransaction,
} = vi.hoisted(() => {
  const userCreate = vi.fn();
  const studentCreate = vi.fn();
  const userFindUnique = vi.fn().mockResolvedValue(null);
  return {
    mockPrismaUserCreate: userCreate,
    mockPrismaStudentKknCreate: studentCreate,
    mockPrismaUserFindUnique: userFindUnique,
    mockPrismaTransaction: vi.fn((callback) =>
      callback({
        user: { create: userCreate, findUnique: userFindUnique },
        studentKkn: { create: studentCreate },
      })
    ),
  };
});

vi.mock("@prisma/client", () => {
  return {
    PrismaClient: class {
      $transaction = mockPrismaTransaction;
      user = { create: mockPrismaUserCreate, findUnique: mockPrismaUserFindUnique };
      studentKkn = { create: mockPrismaStudentKknCreate };
    },
  };
});

describe("UserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllUsers", () => {
    it("should fetch and format users correctly", async () => {
      const mockUsers = [
        {
          id: "user-1",
          name: "User One",
          email: "one@psc.id",
          phone: "+6281122233344",
          status: "Aktif",
          role: { name: "WARGA" },
          rw: { name: "RT 01 / RW 01", kelurahan: { name: "Dago" } },
          households: [
            {
              rw: null,
            },
          ],
          setoranOtomatis: [{ berat: 2.5 }, { berat: 1.5 }],
          pointHistory: [{ points: 100 }, { points: 50 }],
          createdAt: new Date("2026-07-18T00:00:00Z"),
        },
      ];

      vi.mocked(userRepository.findMany).mockResolvedValue(mockUsers as any);

      const result = await userService.getAllUsers(
        {},
        { userId: "mock-user-id", role: "SUPER_USER" }
      );

      expect(userRepository.findMany).toHaveBeenCalledWith({});
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "user-1",
        name: "User One",
        email: "+6281122233344",
        phone: "+6281122233344",
        nip: null,
        institusi: null,
        jabatan: null,
        programStudi: null,
        jenjangPendidikan: null,
        jumlahAnggotaKeluarga: null,
        fotoProfil: null,
        nim: null,
        role: "WARGA",
        status: "Aktif",
        binStatus: "Belum Teraktivasi",
        activeBinsCount: 0,
        provinsi: "Jawa Barat",
        kabupaten: "Kota Bandung",
        kecamatan: "-",
        kelurahan: "Dago",
        rw: "RT 01 / RW 01",
        address: "Sekretariat RT 01 / RW 01, Dago, Kota Bandung",
        wilayah: "RT 01 / RW 01, Dago",
        setoran: 4.0,
        totalPoin: 150,
        studentProfile: null,
        dplKelompok: [],
        petugasResidu: null,
      });
    });
  });

  describe("createUser", () => {
    it("should create a user successfully when inputs are valid", async () => {
      const mockRole = { id: 1, name: "WARGA" };
      const mockCreatedUser = {
        id: "user-new",
        name: "New Warga",
        phone: "+6281122233344",
        role: { name: "WARGA" },
      };

      vi.mocked(userRepository.findRoleByName).mockResolvedValue(mockRole as any);
      mockPrismaUserFindUnique.mockResolvedValue(null);
      mockPrismaUserCreate.mockResolvedValue(mockCreatedUser);

      const result = await userService.createUser({
        name: "New Warga",
        password: "password123",
        phone: "+6281122233344",
        roleName: "WARGA",
      });

      expect(userRepository.findRoleByName).toHaveBeenCalledWith("WARGA");
      expect(mockPrismaTransaction).toHaveBeenCalled();
      expect(result).toEqual({
        id: "user-new",
        name: "New Warga",
        phone: "+6281122233344",
        role: "WARGA",
      });
    });

    it("should throw ROLE_NOT_FOUND if role does not exist", async () => {
      mockPrismaUserFindUnique.mockResolvedValue(null);
      vi.mocked(userRepository.findRoleByName).mockResolvedValue(null);

      await expect(
        userService.createUser({
          name: "New Warga",
          password: "password123",
          phone: "+6281122233345",
          roleName: "INVALID_ROLE",
        })
      ).rejects.toThrow("ROLE_NOT_FOUND");
    });

    it("should throw PHONE_CONFLICT if phone number already exists", async () => {
      vi.mocked(userRepository.findRoleByName).mockResolvedValue({ id: 1 } as any);
      mockPrismaUserFindUnique.mockResolvedValue({ id: "exist-user" });

      await expect(
        userService.createUser({
          name: "New Warga",
          password: "password123",
          phone: "+6281122233346",
          roleName: "WARGA",
        })
      ).rejects.toThrow("PHONE_CONFLICT");
    });
  });
});
