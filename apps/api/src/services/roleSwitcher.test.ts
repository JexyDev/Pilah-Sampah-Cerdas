import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "./authService.js";
import { authRepository } from "../repositories/authRepository.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../repositories/authRepository.js", () => ({
  authRepository: {
    findUserById: vi.fn(),
    findCitizenMentor: vi.fn(),
  },
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    role: {
      findFirst: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    userRole: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    studentKkn: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    pointHistory: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock("./pointService.js", () => ({
  calculateValidIndividualPoints: vi.fn().mockResolvedValue(100),
}));

describe("RoleSwitcher & Multi-Role Governance (Pimpinan to DPL)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw USER_NOT_FOUND if user does not exist", async () => {
    vi.mocked(authRepository.findUserById).mockResolvedValue(null);

    await expect(authService.switchRole("non-existent-id", "DPL")).rejects.toThrow(
      "USER_NOT_FOUND"
    );
  });

  it("should throw ROLE_NOT_PERMITTED if user tries to switch to an unassigned role", async () => {
    const mockUser: any = {
      id: "user-1",
      role: { id: 7, name: "PEMIMPIN" },
      roleId: 7,
      userRoles: [{ role: { id: 9, name: "DPL" } }],
    };
    vi.mocked(authRepository.findUserById).mockResolvedValue(mockUser);
    vi.mocked(prisma.role.findFirst).mockResolvedValue({ id: 10, name: "PETUGAS_RESIDU" } as any);

    await expect(authService.switchRole("user-1", "PETUGAS_RESIDU")).rejects.toThrow(
      "ROLE_NOT_PERMITTED"
    );
  });

  it("should allow Pimpinan to switch to assigned DPL role without mutating user in database", async () => {
    const mockUser: any = {
      id: "umi-pimpinan-id",
      name: "Prof. Dr. Hj. Umi Narimawati",
      role: { id: 7, name: "PEMIMPIN" },
      roleId: 7,
      userRoles: [{ role: { id: 9, name: "DPL" } }],
      dplKelompok: [{ id: "kel-1", name: "Kelompok 1 Dago" }],
    };
    vi.mocked(authRepository.findUserById).mockResolvedValue(mockUser);
    vi.mocked(prisma.role.findFirst).mockResolvedValue({ id: 9, name: "DPL" } as any);

    const result = await authService.switchRole("umi-pimpinan-id", "DPL");

    expect(result.currentRole).toBe("DPL");
    expect(result.accessToken).toBeDefined();
    expect(result.user.role).toBe("DPL");
    // CRITICAL: Ensure database user was NOT mutated!
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("should return clean availableRoles without 13-role hardcode bloat", async () => {
    const mockUser: any = {
      id: "umi-id",
      name: "Prof. Dr. Hj. Umi Narimawati",
      role: { id: 7, name: "PEMIMPIN" },
      roleId: 7,
      userRoles: [{ role: { id: 9, name: "DPL" } }],
      dplKelompok: [{ id: "kel-1", name: "Kelompok 1 Dago" }],
    };
    vi.mocked(authRepository.findUserById).mockResolvedValue(mockUser);

    const profile = await authService.getCurrentUser("umi-id");

    expect(profile.availableRoles).toEqual(["PEMIMPIN", "DPL"]);
    expect(profile.availableRoles).not.toContain("WARGA");
    expect(profile.availableRoles).not.toContain("PETUGAS_RESIDU");
    expect(profile.availableRoles).not.toContain("MAHASISWA_KKN");
  });

  it("should return only ['DEVELOPER'] as availableRoles for developer account", async () => {
    const mockDev: any = {
      id: "dev-id",
      name: "Jeremy Darrell",
      role: { id: 1, name: "DEVELOPER" },
      roleId: 1,
      userRoles: [],
    };
    vi.mocked(authRepository.findUserById).mockResolvedValue(mockDev);

    const profile = await authService.getCurrentUser("dev-id");
    expect(profile.availableRoles).toEqual(["DEVELOPER"]);
    expect(profile.availableRoles).not.toContain("PEMIMPIN");
    expect(profile.availableRoles).not.toContain("DPL");
  });

  it("should forbid Developer from switching role even if target role exists", async () => {
    const mockDev: any = {
      id: "dev-id",
      name: "Jeremy Darrell",
      role: { id: 1, name: "DEVELOPER" },
      roleId: 1,
      userRoles: [],
    };
    vi.mocked(authRepository.findUserById).mockResolvedValue(mockDev);
    vi.mocked(prisma.role.findFirst).mockResolvedValue({ id: 9, name: "DPL" } as any);

    await expect(authService.switchRole("dev-id", "DPL")).rejects.toThrow("ROLE_NOT_PERMITTED");
  });
});
