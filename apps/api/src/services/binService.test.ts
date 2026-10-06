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
vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      wasteCategory: {
        findFirst: vi.fn().mockResolvedValue({ id: "cat-1", name: "ORGANIC" }),
      },
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      bin: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      binOwnership: {
        create: vi.fn(),
      },
      auditTrail: {
        create: vi.fn(),
      },
      systemConfig: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((callback) =>
        callback({
          bin: {
            findUnique: vi.fn(),
            update: vi.fn(),
          },
          binOwnership: {
            create: vi.fn(),
          },
          auditTrail: {
            create: vi.fn(),
          },
          user: {
            update: vi.fn(),
          },
        })
      ),
    },
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

  describe("registerKomunalBin", () => {
    it("should reject if user is not PETUGAS_RESIDU", async () => {
      const { prisma } = await import("../lib/prisma.js");
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-warga-1",
        role: { name: "WARGA" },
      } as any);

      await expect(
        binService.registerKomunalBin("user-warga-1", { qrCode: "QR-KOMUNAL-1" })
      ).rejects.toThrow("FORBIDDEN_NOT_PETUGAS");
    });

    it("should successfully register single communal bin with isCommunal: true and type KOMUNAL", async () => {
      const { prisma } = await import("../lib/prisma.js");
      const mockPetugas = {
        id: "petugas-1",
        role: { name: "PETUGAS_RESIDU" },
        petugasProfile: { latitude: -6.89, longitude: 107.61 },
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockPetugas as any);

      const mockPrintedBin = {
        id: "bin-kom-1",
        qrCode: "QR-KOMUNAL-1",
        status: "PRINTED",
        category: { id: "cat-1", name: "ORGANIC" },
      };

      const mockUpdatedBin = {
        id: "bin-kom-1",
        qrCode: "QR-KOMUNAL-1",
        status: "ACTIVE_BOUND",
        isCommunal: true,
        tipeKepemilikan: "KOMUNAL",
        latitude: -6.89,
        longitude: 107.61,
      };

      const txBinFindUnique = vi.fn().mockResolvedValue(mockPrintedBin);
      const txBinUpdate = vi.fn().mockResolvedValue(mockUpdatedBin);
      const txBinOwnershipCreate = vi.fn().mockResolvedValue({});
      const txAuditCreate = vi.fn().mockResolvedValue({});

      vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
        return callback({
          bin: {
            findUnique: txBinFindUnique,
            update: txBinUpdate,
          },
          binOwnership: {
            create: txBinOwnershipCreate,
          },
          auditTrail: {
            create: txAuditCreate,
          },
        });
      });

      const result = await binService.registerKomunalBin("petugas-1", {
        qrCode: "QR-KOMUNAL-1",
        deskripsiLokasi: "TPS RW 16 Sekeloa",
      });

      expect(txBinFindUnique).toHaveBeenCalledWith({
        where: { qrCode: "QR-KOMUNAL-1" },
        include: { category: true, qrBatch: true },
      });

      expect(txBinUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "bin-kom-1" },
          data: expect.objectContaining({
            status: "ACTIVE_BOUND",
            userId: "petugas-1",
            isCommunal: true,
            tipeKepemilikan: "KOMUNAL",
            deskripsiLokasi: "TPS RW 16 Sekeloa",
          }),
        })
      );

      expect(txBinOwnershipCreate).toHaveBeenCalledWith({
        data: {
          binId: "bin-kom-1",
          userId: "petugas-1",
          type: "KOMUNAL",
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].isCommunal).toBe(true);
    });
  });
});
