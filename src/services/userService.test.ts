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
          nik: "1234567890123456",
          status: "Aktif",
          role: { name: "WARGA" },
          rtRw: { name: "RT 01 / RW 01", kelurahan: { name: "Dago" } },
          households: [
            {
              rtRw: null,
              wasteLogs: [{ weightKg: 2.5 }, { weightKg: 1.5 }],
            },
          ],
          pointHistory: [{ points: 100 }, { points: 50 }],
          createdAt: new Date("2026-07-18T00:00:00Z"),
        },
      ];

      vi.mocked(userRepository.findMany).mockResolvedValue(mockUsers as any);

      const result = await userService.getAllUsers({});

      expect(userRepository.findMany).toHaveBeenCalledWith({});
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "user-1",
        name: "User One",
        email: "one@psc.id",
        role: "WARGA",
        nik: "1234567890123456",
        status: "Aktif",
        wilayah: "RT 01 / RW 01 (Kel. Dago)",
        setoran: 4.0,
        totalPoin: 150,
        createdAt: mockUsers[0].createdAt,
      });
    });
  });

  describe("createUser", () => {
    it("should create a user successfully when inputs are valid", async () => {
      const mockRole = { id: 1, name: "WARGA" };
      const mockCreatedUser = {
        id: "user-new",
        name: "New Warga",
        email: "new@psc.id",
        role: { name: "WARGA" },
      };

      vi.mocked(userRepository.findRoleByName).mockResolvedValue(mockRole as any);
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(userRepository.create).mockResolvedValue(mockCreatedUser as any);

      const result = await userService.createUser({
        name: "New Warga",
        email: "new@psc.id",
        password: "password123",
        roleName: "WARGA",
        nik: "1234567890000000",
      });

      expect(userRepository.findRoleByName).toHaveBeenCalledWith("WARGA");
      expect(userRepository.findByEmail).toHaveBeenCalledWith("new@psc.id");
      expect(userRepository.create).toHaveBeenCalled();
      expect(result).toEqual({
        id: "user-new",
        name: "New Warga",
        email: "new@psc.id",
        role: "WARGA",
      });
    });

    it("should throw ROLE_NOT_FOUND if role does not exist", async () => {
      vi.mocked(userRepository.findRoleByName).mockResolvedValue(null);

      await expect(
        userService.createUser({
          name: "New Warga",
          email: "new@psc.id",
          password: "password123",
          roleName: "INVALID_ROLE",
        })
      ).rejects.toThrow("ROLE_NOT_FOUND");
    });

    it("should throw EMAIL_CONFLICT if email already exists", async () => {
      vi.mocked(userRepository.findRoleByName).mockResolvedValue({ id: 1 } as any);
      vi.mocked(userRepository.findByEmail).mockResolvedValue({ id: "exist-user" } as any);

      await expect(
        userService.createUser({
          name: "New Warga",
          email: "existing@psc.id",
          password: "password123",
          roleName: "WARGA",
        })
      ).rejects.toThrow("EMAIL_CONFLICT");
    });
  });
});
