/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { binService } from "./binService.js";
import { binRepository } from "../repositories/binRepository.js";
import { getScopingFilters } from "../utils/rbacScoping.js";

import { prisma } from "../lib/prisma.js";

// Mock rbacScoping
vi.mock("../utils/rbacScoping.js", () => {
  return {
    getScopingFilters: vi.fn().mockResolvedValue({}),
  };
});

// Mock the qrGenerator
vi.mock("../utils/qrGenerator.js", () => {
  return {
    generateNextQrCode: vi.fn().mockResolvedValue("QR-NEW"),
  };
});

// Mock the binRepository
vi.mock("../repositories/binRepository.js", () => {
  return {
    binRepository: {
      findAll: vi.fn(),
      getLocations: vi.fn(),
      findByQrCode: vi.fn(),
      findById: vi.fn(),
      updateVolume: vi.fn(),
      recordScanTransaction: vi.fn(),
      createOverflowNotification: vi.fn(),
      findAreas: vi.fn(),
      findKelurahans: vi.fn(),
      createArea: vi.fn(),
      findRtRwById: vi.fn(),
      getUserrwId: vi.fn(),
      getUserHouseholdrwId: vi.fn(),
      findBinsByrwId: vi.fn(),
      createBin: vi.fn(),
      updateBin: vi.fn(),
      deleteBin: vi.fn(),
    },
  };
});

// Mock Prisma client
const { mockPrisma } = vi.hoisted(() => {
  const mock: any = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    household: {
      create: vi.fn(),
    },
    rw: {
      findUnique: vi.fn(),
    },
    bin: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    binOwnership: {
      create: vi.fn(),
    },
    pointHistory: {
      create: vi.fn(),
    },
    auditTrail: {
      create: vi.fn(),
    },
    wasteCategory: {
      findFirst: vi.fn().mockResolvedValue({ id: "cat-1", name: "ORGANIC" }),
    },
  };
  mock.$transaction = vi.fn().mockImplementation(async (cb: any) => cb(mock));
  return { mockPrisma: mock };
});

vi.mock("../lib/prisma.js", () => {
  return {
    prisma: mockPrisma,
  };
});

describe("BinService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllBins", () => {
    it("should fetch all bins", async () => {
      const mockBins = [{ id: "bin-1", qrCode: "QR-1", maxCapacityLiter: 25 }];
      vi.mocked(binRepository.findAll).mockResolvedValue(mockBins as any);

      const result = await binService.getAllBins();

      expect(binRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockBins);
    });

    it("should strictly scope PRINTED bins for scoped users without global bypass", async () => {
      const mockScopingFilter = {
        OR: [
          { rwId: 5 },
          { rw: { kelurahan: { name: { equals: "Dago", mode: "insensitive" } } } },
        ],
      };
      vi.mocked(getScopingFilters).mockResolvedValue({
        binFilter: mockScopingFilter,
      } as any);

      const currentUser = { userId: "mhs-1", role: "MAHASISWA_KKN" };
      await binService.getAllBins(currentUser, { status: "PRINTED" });

      expect(binRepository.findAll).toHaveBeenCalledWith({
        AND: [mockScopingFilter, { status: "PRINTED" }],
      });
    });

    it("should strictly scope all bins without OR bypass when status is not specified or ALL", async () => {
      const mockScopingFilter = {
        OR: [
          { rwId: 5 },
          { rw: { kelurahan: { name: { equals: "Dago", mode: "insensitive" } } } },
        ],
      };
      vi.mocked(getScopingFilters).mockResolvedValue({
        binFilter: mockScopingFilter,
      } as any);

      const currentUser = { userId: "mhs-1", role: "MAHASISWA_KKN" };
      await binService.getAllBins(currentUser);

      expect(binRepository.findAll).toHaveBeenCalledWith(mockScopingFilter);
    });

    it("should allow non-scoped users (e.g. SUPER_USER) to query PRINTED bins without scoping filter", async () => {
      vi.mocked(getScopingFilters).mockResolvedValue({});

      const currentUser = { userId: "admin-1", role: "SUPER_USER" };
      await binService.getAllBins(currentUser, { status: "PRINTED" });

      expect(binRepository.findAll).toHaveBeenCalledWith({ status: "PRINTED" });
    });
  });

  describe("getBinStatus", () => {
    it("should fetch status of a bin by id", async () => {
      const mockBin = { id: "bin-1", qrCode: "QR-1" };
      vi.mocked(binRepository.findById).mockResolvedValue(mockBin as any);

      const result = await binService.getBinStatus("bin-1");

      expect(binRepository.findById).toHaveBeenCalledWith("bin-1");
      expect(result).toEqual(mockBin);
    });

    it("should throw BIN_NOT_FOUND if bin does not exist", async () => {
      vi.mocked(binRepository.findById).mockResolvedValue(null);

      await expect(binService.getBinStatus("bin-not-exist")).rejects.toThrow("BIN_NOT_FOUND");
    });
  });

  describe("createBin", () => {
    it("should create a bin successfully", async () => {
      const mockBinInput = {
        qrCode: "QR-NEW",
        categoryId: "cat-1",
        rwId: "123",
        maxCapacityLiter: "30.0",
        latitude: "-6.123",
        longitude: "106.123",
      };

      const mockArea = { id: 123, kelurahanId: 456 };
      const mockCreatedBin = { id: "bin-new", qrCode: "QR-NEW" };

      vi.mocked(binRepository.findRtRwById).mockResolvedValue(mockArea as any);
      vi.mocked(binRepository.createBin).mockResolvedValue(mockCreatedBin as any);

      const result = await binService.createBin(mockBinInput);

      expect(binRepository.findRtRwById).toHaveBeenCalledWith(123);
      expect(binRepository.createBin).toHaveBeenCalledWith({
        qrCode: "QR-NEW",
        categoryId: "cat-1",
        rwId: 123,
        kelurahanId: 456,
        latitude: -6.123,
        longitude: 106.123,
        maxCapacityLiter: 30.0,
        userId: null,
        status: "PRINTED",
      });
      expect(result).toEqual(mockCreatedBin);
    });
  });

  describe("registerWargaBin Quota & Security Protection", () => {
    const mockUser = {
      id: "user-warga-1",
      rwId: 10,
      households: [{ id: "hh-1", rwId: 10, latitude: -6.2, longitude: 106.8 }],
    };

    const organicBin = {
      id: "bin-org-1",
      qrCode: "BSK-ORG-001",
      status: "PRINTED",
      rwId: null,
      categoryId: "cat-org",
      category: { id: "cat-org", name: "Organik" },
    };

    const nonOrganicBin = {
      id: "bin-anorg-1",
      qrCode: "BSK-ANORG-001",
      status: "PRINTED",
      rwId: null,
      categoryId: "cat-anorg",
      category: { id: "cat-anorg", name: "Anorganik" },
    };

    beforeEach(() => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.bin.update).mockImplementation(async ({ data }: any) => ({
        ...data,
        id: "bin-mock-updated",
      }));
      vi.mocked(prisma.binOwnership.create).mockResolvedValue({} as any);
      vi.mocked(prisma.pointHistory.create).mockResolvedValue({} as any);
      vi.mocked(prisma.auditTrail.create).mockResolvedValue({} as any);
    });

    it("should allow registering 1 organic and 1 non-organic bin for new user (within quota)", async () => {
      // User has 0 active bins currently
      vi.mocked(prisma.bin.findMany).mockResolvedValue([]);
      vi.mocked(prisma.bin.findUnique).mockImplementation(async ({ where }: any) => {
        if (where.qrCode === "BSK-ORG-001") return organicBin as any;
        if (where.qrCode === "BSK-ANORG-001") return nonOrganicBin as any;
        return null;
      });

      const result = await binService.registerWargaBin("user-warga-1", {
        qrCodes: ["BSK-ORG-001", "BSK-ANORG-001"],
      });

      expect(result).toHaveLength(2);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-warga-1" },
        data: { lifecycleState: "FULLY_ACTIVE" },
      });
    });

    it("should allow registering missing 1 non-organic bin if user only has 1 organic bin", async () => {
      // User already has 1 organic bin active
      vi.mocked(prisma.bin.findMany).mockResolvedValue([
        { id: "bin-existing-org", status: "ACTIVE_BOUND", category: { name: "Organik" } },
      ] as any);
      vi.mocked(prisma.bin.findUnique).mockResolvedValue(nonOrganicBin as any);

      const result = await binService.registerWargaBin("user-warga-1", {
        qrCode: "BSK-ANORG-001",
      });

      expect(result).toHaveLength(1);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-warga-1" },
        data: { lifecycleState: "FULLY_ACTIVE" },
      });
    });

    it("should reject with MAXIMUM_BIN_LIMIT_REACHED if user already has 2 active bins", async () => {
      // User already has 2 bins active (1 organic, 1 non-organic)
      vi.mocked(prisma.bin.findMany).mockResolvedValue([
        { id: "bin-1", status: "ACTIVE_BOUND", category: { name: "Organik" } },
        { id: "bin-2", status: "ACTIVE_BOUND", category: { name: "Anorganik" } },
      ] as any);

      await expect(
        binService.registerWargaBin("user-warga-1", {
          qrCode: "BSK-NEW-001",
        })
      ).rejects.toThrow("MAXIMUM_BIN_LIMIT_REACHED");
    });

    it("should reject with MAXIMUM_BIN_LIMIT_REACHED if batch registration exceeds quota (e.g. has 1, requests 2)", async () => {
      // User has 1 bin active
      vi.mocked(prisma.bin.findMany).mockResolvedValue([
        { id: "bin-1", status: "ACTIVE_BOUND", category: { name: "Organik" } },
      ] as any);

      // User requests 2 bins at once -> 1 + 2 = 3 > 2 (Quota exceeded)
      await expect(
        binService.registerWargaBin("user-warga-1", {
          qrCodes: ["BSK-NEW-001", "BSK-NEW-002"],
        })
      ).rejects.toThrow("MAXIMUM_BIN_LIMIT_REACHED");
    });

    it("should reject with ONBOARDING_INCOMPLETE_WRONG_CATEGORY if user has organic and requests organic again during onboarding", async () => {
      // User has 1 organic bin, 0 non-organic
      vi.mocked(prisma.bin.findMany).mockResolvedValue([
        { id: "bin-1", status: "ACTIVE_BOUND", category: { name: "Organik" } },
      ] as any);
      vi.mocked(prisma.bin.findUnique).mockResolvedValue({
        id: "bin-org-2",
        qrCode: "BSK-ORG-002",
        status: "PRINTED",
        categoryId: "cat-org",
        category: { id: "cat-org", name: "Organik" },
      } as any);

      await expect(
        binService.registerWargaBin("user-warga-1", {
          qrCode: "BSK-ORG-002",
        })
      ).rejects.toThrow("ONBOARDING_INCOMPLETE_WRONG_CATEGORY:ORGANIC");
    });

    it("should reject with BIN_CATEGORY_DUPLICATE_IN_REQUEST if batch contains duplicate category", async () => {
      vi.mocked(prisma.bin.findMany).mockResolvedValue([]);
      vi.mocked(prisma.bin.findUnique).mockResolvedValue(organicBin as any);

      await expect(
        binService.registerWargaBin("user-warga-1", {
          qrCodes: ["BSK-ORG-001", "BSK-ORG-001"],
        })
      ).rejects.toThrow("BIN_CATEGORY_DUPLICATE_IN_REQUEST");
    });
  });
});
