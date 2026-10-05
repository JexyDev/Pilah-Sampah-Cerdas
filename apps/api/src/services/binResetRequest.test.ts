import { describe, it, expect, vi, beforeEach } from "vitest";
import { binService } from "./binService.js";
import { prisma } from "../lib/prisma.js";
import { getScopingFilters } from "../utils/rbacScoping.js";

// Mock Prisma
vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      binResetRequest: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      notification: {
        create: vi.fn().mockResolvedValue({}),
      },
      auditTrail: {
        create: vi.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      binOwnership: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

describe("BinResetRequest Service & Scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("cancelResetRequest", () => {
    it("should allow requester (warga) to cancel their pending reset request", async () => {
      const mockRequest = {
        id: "req-1",
        binId: "bin-1",
        userId: "warga-123",
        status: "PENDING",
        bin: { qrCode: "TSC-001" },
        user: { name: "Ibu Winarti" },
      };

      vi.mocked(prisma.binResetRequest.findUnique).mockResolvedValue(mockRequest as any);
      vi.mocked(prisma.binResetRequest.update).mockResolvedValue({
        ...mockRequest,
        status: "CANCELLED",
      } as any);

      const result = await binService.cancelResetRequest("req-1", "warga-123", "WARGA");

      expect(prisma.binResetRequest.findUnique).toHaveBeenCalledWith({
        where: { id: "req-1" },
        include: { bin: true, user: true },
      });

      expect(prisma.binResetRequest.update).toHaveBeenCalledWith({
        where: { id: "req-1" },
        data: { status: "CANCELLED" },
        include: { bin: true, user: true },
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: "warga-123",
          title: "Pengajuan Dibatalkan",
          message: "Pengajuan pengosongan tempat sampah TSC-001 telah berhasil dibatalkan.",
        },
      });

      expect(prisma.auditTrail.create).toHaveBeenCalledWith({
        data: {
          action: "CANCEL_RESET_REQUEST",
          userId: "warga-123",
          oldValue: { status: "PENDING", request: "req-1" },
          newValue: { status: "CANCELLED", binId: "bin-1" },
        },
      });

      expect(result.status).toBe("CANCELLED");
    });

    it("should allow admin or staff to cancel a pending reset request on behalf of warga", async () => {
      const mockRequest = {
        id: "req-1",
        binId: "bin-1",
        userId: "warga-123",
        status: "PENDING",
        bin: { qrCode: "TSC-001" },
        user: { name: "Ibu Winarti" },
      };

      vi.mocked(prisma.binResetRequest.findUnique).mockResolvedValue(mockRequest as any);
      vi.mocked(prisma.binResetRequest.update).mockResolvedValue({
        ...mockRequest,
        status: "CANCELLED",
      } as any);

      const result = await binService.cancelResetRequest("req-1", "admin-456", "SUPER_USER");

      expect(prisma.binResetRequest.update).toHaveBeenCalledWith({
        where: { id: "req-1" },
        data: { status: "CANCELLED" },
        include: { bin: true, user: true },
      });
      expect(result.status).toBe("CANCELLED");
    });

    it("should throw REQUEST_NOT_FOUND if request does not exist", async () => {
      vi.mocked(prisma.binResetRequest.findUnique).mockResolvedValue(null);

      await expect(
        binService.cancelResetRequest("non-existent", "warga-123", "WARGA")
      ).rejects.toThrow("REQUEST_NOT_FOUND");
    });

    it("should throw FORBIDDEN if another warga tries to cancel", async () => {
      const mockRequest = {
        id: "req-1",
        binId: "bin-1",
        userId: "warga-123",
        status: "PENDING",
      };

      vi.mocked(prisma.binResetRequest.findUnique).mockResolvedValue(mockRequest as any);

      await expect(
        binService.cancelResetRequest("req-1", "other-warga-999", "WARGA")
      ).rejects.toThrow("FORBIDDEN");
    });

    it("should allow requester (warga) to cancel their ASSIGNED reset request", async () => {
      const mockRequest = {
        id: "req-1",
        binId: "bin-1",
        userId: "warga-123",
        status: "ASSIGNED",
        bin: { qrCode: "TSC-001" },
        user: { name: "Ibu Winarti" },
      };

      vi.mocked(prisma.binResetRequest.findUnique).mockResolvedValue(mockRequest as any);
      vi.mocked(prisma.binResetRequest.update).mockResolvedValue({
        ...mockRequest,
        status: "CANCELLED",
      } as any);

      const result = await binService.cancelResetRequest("req-1", "warga-123", "WARGA");
      expect(result.status).toBe("CANCELLED");
    });

    it("should throw ALREADY_PROCESSED if request status is not PENDING or ASSIGNED (e.g. COMPLETED)", async () => {
      const mockRequest = {
        id: "req-1",
        binId: "bin-1",
        userId: "warga-123",
        status: "COMPLETED",
      };

      vi.mocked(prisma.binResetRequest.findUnique).mockResolvedValue(mockRequest as any);

      await expect(
        binService.cancelResetRequest("req-1", "warga-123", "WARGA")
      ).rejects.toThrow("ALREADY_PROCESSED");
    });

    it("should allow cancelling reset request directly by binId for the requester", async () => {
      const mockRequest = {
        id: "req-active-1",
        binId: "bin-123",
        userId: "warga-123",
        status: "PENDING",
        bin: { qrCode: "TSC-123" },
        user: { name: "Pak Budi" },
      };

      vi.mocked(prisma.binResetRequest.findFirst).mockResolvedValue(mockRequest as any);
      vi.mocked(prisma.binResetRequest.update).mockResolvedValue({
        ...mockRequest,
        status: "CANCELLED",
      } as any);

      const result = await binService.cancelResetRequestByBinId("bin-123", "warga-123", "WARGA");
      expect(result.status).toBe("CANCELLED");
      expect(prisma.binResetRequest.findFirst).toHaveBeenCalledWith({
        where: {
          binId: "bin-123",
          status: { in: ["PENDING", "ASSIGNED"] },
        },
        orderBy: { createdAt: "desc" },
        include: { bin: true, user: true },
      });
      expect(prisma.auditTrail.create).toHaveBeenCalledWith({
        data: {
          action: "CANCEL_RESET_REQUEST_BY_BIN_ID",
          userId: "warga-123",
          oldValue: { status: "PENDING", requestId: "req-active-1" },
          newValue: { status: "CANCELLED", binId: "bin-123" },
        },
      });
    });

    it("should allow household bin owner to cancel reset request by binId even if requested by family member", async () => {
      const mockRequest = {
        id: "req-active-1",
        binId: "bin-123",
        userId: "anak-123",
        status: "ASSIGNED",
        bin: { qrCode: "TSC-123" },
        user: { name: "Anak" },
      };

      vi.mocked(prisma.binResetRequest.findFirst).mockResolvedValue(mockRequest as any);
      vi.mocked(prisma.binOwnership.findFirst).mockResolvedValue({
        id: "bo-1",
        binId: "bin-123",
        userId: "kepala-keluarga-456",
      } as any);
      vi.mocked(prisma.binResetRequest.update).mockResolvedValue({
        ...mockRequest,
        status: "CANCELLED",
      } as any);

      const result = await binService.cancelResetRequestByBinId("bin-123", "kepala-keluarga-456", "WARGA");
      expect(result.status).toBe("CANCELLED");
    });

    it("should throw FORBIDDEN if user is not requester and not bin owner", async () => {
      const mockRequest = {
        id: "req-active-1",
        binId: "bin-123",
        userId: "warga-123",
        status: "PENDING",
        bin: { qrCode: "TSC-123", userId: "warga-123" },
        user: { name: "Pak Budi" },
      };

      vi.mocked(prisma.binResetRequest.findFirst).mockResolvedValue(mockRequest as any);
      vi.mocked(prisma.binOwnership.findFirst).mockResolvedValue(null);

      await expect(
        binService.cancelResetRequestByBinId("bin-123", "intruder-999", "WARGA")
      ).rejects.toThrow("FORBIDDEN");
    });

    it("should throw NO_ACTIVE_RESET_REQUEST when cancelResetRequestByBinId finds no active request", async () => {
      vi.mocked(prisma.binResetRequest.findFirst).mockResolvedValue(null);

      await expect(
        binService.cancelResetRequestByBinId("bin-empty", "warga-123", "WARGA")
      ).rejects.toThrow("NO_ACTIVE_RESET_REQUEST");
    });
  });

  describe("listResetRequests with Petugas Pemilahan scoping", () => {
    it("should include petugasId in OR condition when user is PETUGAS_PEMILAHAN", async () => {
      vi.mocked(prisma.binResetRequest.findMany).mockResolvedValue([
        { id: "req-1", status: "PENDING", petugasId: "petugas-10" } as any,
      ]);

      const currentUser = { userId: "petugas-10", role: "PETUGAS_PEMILAHAN" };
      await binService.listResetRequests(currentUser, { status: "PENDING" });

      expect(prisma.binResetRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PENDING",
            OR: expect.arrayContaining([{ petugasId: "petugas-10" }]),
          }),
          include: expect.objectContaining({
            petugas: true,
            user: true,
          }),
        })
      );
    });
  });

  describe("rbacScoping normalizeRole and PETUGAS_PEMILAHAN", () => {
    it("should normalize PETUGAS_PEMILAHAN and provide RW binFilter without falling back to id: none", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "petugas-10",
        roleId: 2,
        rwId: 10,
        rw: { id: 10, name: "RW 10", kelurahanId: "kel-sadang-serang" },
      } as any);

      const filters = await getScopingFilters({
        userId: "petugas-10",
        role: "PETUGAS_PEMILAHAN",
      });

      expect(filters.binFilter).toEqual({ rwId: 10 });
      expect(filters.binFilter).not.toEqual({ id: "none" });
      expect(filters.userFilter).toEqual({
        role: { name: "WARGA" },
        rwId: 10,
      });
    });

    it("should provide kelurahan fallback if petugas rwId is not set", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "petugas-gaslah-1",
        roleId: 2,
        rwId: null,
        rw: { kelurahanId: "kel-sadang-serang" },
      } as any);

      const filters = await getScopingFilters({
        userId: "petugas-gaslah-1",
        role: "PETUGAS_GASLAH",
      });

      expect(filters.binFilter).toEqual({
        rw: { kelurahanId: "kel-sadang-serang" },
      });
      expect(filters.binFilter).not.toEqual({ id: "none" });
    });
  });
});
