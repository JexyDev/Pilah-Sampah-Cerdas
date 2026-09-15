import { describe, it, expect, vi, beforeEach } from "vitest";
import { dplScopeMiddleware } from "../middlewares/dplScopeMiddleware.js";
import { getKelompokWhere } from "./dplService.js";
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
  },
}));

describe("Role MPL Permissions and Scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("dplScopeMiddleware", () => {
    it("should allow MPL user through middleware", async () => {
      const req: any = {
        user: { userId: "mpl-1", role: "MPL" },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await dplScopeMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should allow MITRA_PENDAMPING_LAPANGAN user through middleware", async () => {
      const req: any = {
        user: { userId: "mpl-2", role: "MITRA_PENDAMPING_LAPANGAN" },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await dplScopeMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("should allow MITRA_PEMBIMBING_LAPANGAN user through middleware", async () => {
      const req: any = {
        user: { userId: "mpl-3", role: "MITRA_PEMBIMBING_LAPANGAN" },
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await dplScopeMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("getKelompokWhere for MPL", () => {
    it("should return mplId and kelurahan conditions for MPL user with rw", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "mpl-user-1",
        rw: {
          kelurahan: {
            name: "Dago",
          },
        },
      } as any);

      const filter = await getKelompokWhere("mpl-user-1", "MPL");

      expect(filter).toEqual({
        OR: [
          { mplId: "mpl-user-1" },
          { mpl: { id: "mpl-user-1" } },
          { kelurahan: { equals: "Dago", mode: "insensitive" } },
          { kelurahan: { contains: "Dago", mode: "insensitive" } },
        ],
      });
    });

    it("should resolve kelurahan from address when rw is null for MPL user", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "mpl-user-2",
        rw: null,
        address: "Kel. Cibiru Hilir",
      } as any);

      vi.mocked(prisma.kelurahan.findFirst).mockResolvedValue({
        id: "kel-1",
        name: "Cibiru Hilir",
      } as any);

      const filter = await getKelompokWhere("mpl-user-2", "MPL");

      expect(filter).toEqual({
        OR: [
          { mplId: "mpl-user-2" },
          { mpl: { id: "mpl-user-2" } },
          { kelurahan: { equals: "Cibiru Hilir", mode: "insensitive" } },
          { kelurahan: { contains: "Cibiru Hilir", mode: "insensitive" } },
        ],
      });
    });
  });

  describe("determineRbacScope for MPL", () => {
    it("should scope MPL queries to their assigned kelurahan and kelompok", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "mpl-user-1",
        rw: {
          kelurahanId: 10,
          kelurahan: {
            id: 10,
            name: "Coblong",
          },
        },
      } as any);

      const scope = await getScopingFilters({
        userId: "mpl-user-1",
        role: "MPL",
      });

      expect(scope.kelompokKknFilter).toBeDefined();
      expect(scope.studentKknFilter).toBeDefined();
      expect(scope.binFilter).toEqual({
        OR: [{ kelurahanId: 10 }, { rw: { kelurahanId: 10 } }],
      });
    });

    it("should resolve kelurahan from address when rw is null in rbacScoping", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "mpl-user-address",
        rw: null,
        address: "Kel. Sukasari",
      } as any);

      vi.mocked(prisma.kelurahan.findFirst).mockResolvedValue({
        id: "kel-sukasari",
        name: "Sukasari",
      } as any);

      const scope = await getScopingFilters({
        userId: "mpl-user-address",
        role: "MPL",
      });

      expect(scope.kelompokKknFilter).toEqual({
        OR: [
          { mplId: "mpl-user-address" },
          { mpl: { id: "mpl-user-address" } },
          { kelurahan: { equals: "Sukasari", mode: "insensitive" } },
          { kelurahan: { contains: "Sukasari", mode: "insensitive" } },
        ],
      });
    });
  });
});
