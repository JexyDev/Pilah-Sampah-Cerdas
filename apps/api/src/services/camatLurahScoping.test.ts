import { describe, it, expect, vi, beforeEach } from "vitest";
import { getScopingFilters } from "../utils/rbacScoping.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    kelompokKkn: {
      findMany: vi.fn(),
    },
    kelurahan: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    kecamatan: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

describe("Role CAMAT, LURAH & ADMIN_DLH Scoping & Read-Only Governance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ADMIN_DLH Scoping", () => {
    it("should return empty filters for ADMIN_DLH to allow city-wide waste monitoring", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "dlh-1",
        name: "Ir. Bambang Triyono",
        address: "Dinas Lingkungan Hidup Kota Bandung",
      } as any);

      const filters = await getScopingFilters({ userId: "dlh-1", role: "ADMIN_DLH" });
      expect(filters).toEqual({});
    });
  });

  describe("CAMAT Scoping", () => {
    it("should scope CAMAT by address matching Kecamatan Coblong even when rwId is null", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "camat-1",
        name: "Ratna Rahayu Pitriyati, S.STP., M.Si.",
        address: "Kantor Kecamatan Coblong, Kota Bandung",
        rw: null,
      } as any);

      vi.mocked(prisma.kecamatan.findMany).mockResolvedValue([
        { id: "kec-coblong", name: "Coblong" },
      ] as any);

      vi.mocked(prisma.kelurahan.findMany).mockResolvedValue([
        { id: "kel-1", name: "Cipaganti" },
        { id: "kel-2", name: "Dago" },
        { id: "kel-3", name: "Lebak Gede" },
        { id: "kel-4", name: "Lebak Siliwangi" },
        { id: "kel-5", name: "Sadang Serang" },
        { id: "kel-6", name: "Sekeloa" },
      ] as any);

      const filters = await getScopingFilters({ userId: "camat-1", role: "CAMAT" });

      expect(filters.userFilter).toBeDefined();
      expect(filters.binFilter).toBeDefined();
      expect(filters.kelompokKknFilter).toBeDefined();
      expect(filters.studentKknFilter).toBeDefined();

      // Ensure all 6 kelurahans in Coblong are included in the scope
      expect(filters.userFilter.OR).toContainEqual(
        expect.objectContaining({
          rw: { kelurahanId: { in: ["kel-1", "kel-2", "kel-3", "kel-4", "kel-5", "kel-6"] } },
        })
      );
    });
  });

  describe("LURAH Scoping", () => {
    it("should scope LURAH by address matching Kelurahan Lebak Siliwangi even when rwId is null", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "lurah-1",
        name: "Budi Rukmana, S.Sos., M.Si.",
        address: "Kelurahan Lebak Siliwangi, Kec. Coblong",
        rw: null,
      } as any);

      vi.mocked(prisma.kelurahan.findMany).mockResolvedValue([
        { id: "kel-1", name: "Cipaganti" },
        { id: "kel-2", name: "Dago" },
        { id: "kel-3", name: "Lebak Gede" },
        { id: "kel-4", name: "Lebak Siliwangi" },
        { id: "kel-5", name: "Sadang Serang" },
        { id: "kel-6", name: "Sekeloa" },
      ] as any);

      const filters = await getScopingFilters({ userId: "lurah-1", role: "LURAH" });

      expect(filters.userFilter).toBeDefined();
      expect(filters.binFilter).toBeDefined();
      expect(filters.kelompokKknFilter).toEqual({
        OR: [{ kelurahan: { equals: "Lebak Siliwangi", mode: "insensitive" } }],
      });
      expect(filters.studentKknFilter).toEqual({
        kelompok: { OR: [{ kelurahan: { equals: "Lebak Siliwangi", mode: "insensitive" } }] },
      });
    });
  });
});
