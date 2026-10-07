import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma directly inside factory
vi.mock("../lib/prisma.js", () => {
  const mockObj: any = {
    $transaction: vi.fn(async (cb: any) => cb(mockObj)),
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    studentKkn: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    bin: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    binOwnership: {
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    binResetRequest: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    auditTrail: {
      create: vi.fn().mockResolvedValue({}),
    },
    notification: {
      create: vi.fn().mockResolvedValue({}),
    },
    pointHistory: {
      create: vi.fn().mockResolvedValue({}),
    },
    household: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    rw: {
      findUnique: vi.fn(),
    },
  };
  return {
    prisma: mockObj,
    default: mockObj,
  };
});

vi.mock("./redisService", () => ({
  redisService: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    del: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("./firebaseService", () => ({
  sendPushNotification: vi.fn().mockResolvedValue(true),
}));

import { prisma } from "../lib/prisma.js";
import { kknService } from "./kknService";
import { binService } from "./binService";
import { superUserService } from "./superUserService";

describe("🛡️ Anti-Ghost Bin Safeguards Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. reassignWargaPendampingUnified", () => {
    it("should NOT create any ghost bin when warga has no existing bins", async () => {
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          id: "warga-1",
          name: "Bu Winarti",
          rwId: 71,
          bins: [],
          binOwnerships: [],
        } as any) // target warga
        .mockResolvedValueOnce({
          id: "student-lead",
          name: "Ketua KKN",
        } as any); // requester user

      vi.mocked(prisma.studentKkn.findUnique)
        .mockResolvedValueOnce({
          id: "student-new",
          userId: "user-student-new",
          kelompokId: "kelompok-1",
          user: { id: "user-student-new", name: "Mahasiswa Baru" },
          kelompok: { id: "kelompok-1", name: "Kelompok 1" },
        } as any) // targetStudent
        .mockResolvedValueOnce({
          id: "student-lead",
          userId: "user-student-lead",
          kelompokId: "kelompok-1",
          isKetua: true,
        } as any); // requesterStudent (ketua)

      vi.mocked(prisma.bin.deleteMany).mockResolvedValueOnce({ count: 0 });
      vi.mocked(prisma.bin.updateMany).mockResolvedValueOnce({ count: 0 });

      const result = await kknService.reassignWargaPendampingUnified({
        requesterUserId: "user-student-lead",
        requesterRole: "MAHASISWA_KKN",
        wargaId: "warga-1",
        targetStudentId: "user-student-new",
        reason: "Rotasi wilayah",
      });

      expect(result).toBeDefined();
      expect(result.wargaId).toBe("warga-1");
      expect(result.newStudentId).toBe("user-student-new");

      // VERIFIKASI KRUSIAL: prisma.bin.create TIDAK BOLEH DIPANGGIL SAMA SEKALI
      expect(prisma.bin.create).not.toHaveBeenCalled();

      // VERIFIKASI: Sanitasi pembersihan ghost bin dipanggil
      expect(prisma.bin.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            qrCode: { startsWith: "BSK-MEMBER-" },
          }),
        })
      );
    });
  });

  describe("2. activateWargaBin (KKN Service)", () => {
    it("should sanitize legacy BSK-MEMBER- ghost bins when activating real pair bins", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "warga-1",
        name: "Bu Winarti",
        rwId: 71,
      } as any);

      vi.mocked(prisma.bin.findMany).mockResolvedValueOnce([
        {
          id: "bin-org-1",
          qrCode: "BSK-OGN-060926-0001",
          status: "PRINTED",
          userId: null,
          rwId: 71,
        },
        {
          id: "bin-anorg-1",
          qrCode: "BSK-AGN-060926-0002",
          status: "PRINTED",
          userId: null,
          rwId: 71,
        },
      ] as any);

      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValueOnce({
        id: "student-1",
        userId: "user-student-1",
        assignedRwId: 71,
        kelompokId: "kelompok-1",
      } as any);

      vi.mocked(prisma.rw.findUnique).mockResolvedValueOnce({
        id: 71,
        kelurahanId: "kel-1",
        latitude: -6.89,
        longitude: 107.61,
      } as any);

      vi.mocked(prisma.bin.deleteMany).mockResolvedValueOnce({ count: 1 });
      vi.mocked(prisma.bin.update).mockResolvedValue({} as any);
      vi.mocked(prisma.binOwnership.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.binOwnership.create).mockResolvedValue({} as any);
      vi.mocked(prisma.household.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.household.create).mockResolvedValue({} as any);

      await kknService.activateWargaBin(
        "warga-1",
        "BSK-OGN-060926-0001",
        "BSK-AGN-060926-0002",
        -6.89,
        107.61,
        "user-student-1"
      );

      // Pastikan auto-sanitize ghost bins BSK-MEMBER- dijalankan
      expect(prisma.bin.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: "warga-1",
          qrCode: { startsWith: "BSK-MEMBER-" },
        },
      });
    });
  });

  describe("3. resetBinOwnership (Bin Service)", () => {
    it("should permanently delete BSK-MEMBER- ghost bins instead of updating to PRINTED", async () => {
      vi.mocked(prisma.bin.findFirst).mockResolvedValueOnce({
        id: "ghost-bin-1",
        qrCode: "BSK-MEMBER-MUWM1WW7-8280",
        status: "ACTIVE_BOUND",
        userId: "warga-1",
      } as any);

      vi.mocked(prisma.binOwnership.deleteMany).mockResolvedValueOnce({ count: 0 });
      vi.mocked(prisma.bin.delete).mockResolvedValueOnce({ id: "ghost-bin-1" } as any);
      vi.mocked(prisma.bin.count).mockResolvedValueOnce(0);

      const result: any = await binService.resetBinOwnership("BSK-MEMBER-MUWM1WW7-8280", "admin-1");

      expect(result.status).toBe("DELETED");
      expect(result.isGhostBin).toBe(true);

      // Verifikasi: Dipanggil prisma.bin.delete BUKAN prisma.bin.update
      expect(prisma.bin.delete).toHaveBeenCalledWith({
        where: { id: "ghost-bin-1" },
      });
      expect(prisma.bin.update).not.toHaveBeenCalled();
    });

    it("should update real physical bins to PRINTED on reset", async () => {
      vi.mocked(prisma.bin.findFirst).mockResolvedValueOnce({
        id: "real-bin-1",
        qrCode: "BSK-OGN-060926-0001",
        status: "ACTIVE_BOUND",
        userId: "warga-1",
      } as any);

      vi.mocked(prisma.binOwnership.deleteMany).mockResolvedValueOnce({ count: 1 });
      vi.mocked(prisma.bin.update).mockResolvedValueOnce({
        id: "real-bin-1",
        qrCode: "BSK-OGN-060926-0001",
        status: "PRINTED",
      } as any);
      vi.mocked(prisma.bin.count).mockResolvedValueOnce(0);

      const result = await binService.resetBinOwnership("BSK-OGN-060926-0001", "admin-1");

      expect(result.status).toBe("PRINTED");
      expect(prisma.bin.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "real-bin-1" },
          data: expect.objectContaining({ status: "PRINTED", userId: null }),
        })
      );
    });
  });

  describe("4. purgeGhostBins (SuperUser Service)", () => {
    it("should scan and purge ghost bins with BSK-MEMBER- prefix", async () => {
      vi.mocked(prisma.bin.findMany).mockResolvedValueOnce([
        { id: "ghost-1", qrCode: "BSK-MEMBER-AAA-1111", userId: "u-1" },
        { id: "ghost-2", qrCode: "BSK-MEMBER-BBB-2222", userId: "u-2" },
      ] as any);

      vi.mocked(prisma.binOwnership.deleteMany).mockResolvedValueOnce({ count: 0 });
      vi.mocked(prisma.binResetRequest.deleteMany).mockResolvedValueOnce({ count: 0 });
      vi.mocked(prisma.bin.deleteMany).mockResolvedValueOnce({ count: 2 });

      const res = await superUserService.purgeGhostBins("admin-master");

      expect(res.purgedCount).toBe(2);
      expect(res.purgedBinIds).toEqual(["ghost-1", "ghost-2"]);
      expect(prisma.bin.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ["ghost-1", "ghost-2"] } },
      });
    });
  });
});
