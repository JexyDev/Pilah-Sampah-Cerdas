import { describe, it, expect, vi, beforeEach } from "vitest";
import { poskoKknService } from "./poskoKknService.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      poskoKkn: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        upsert: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      poskoKknMulti: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      kelompokKkn: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      kknSchedule: {
        updateMany: vi.fn(),
      },
      facility: {
        findFirst: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    },
  };
});

describe("poskoKknService - Radius & Dual Photo Properties (QC Unit Test)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("upsertPosko", () => {
    it("should upsert primary posko with custom radius and photo URL", async () => {
      const mockResult = {
        id: "posko-1",
        kelompokId: "kel-1",
        nama: "Posko KKN Kelompok 1 Dago",
        alamat: "Jl. Ir. H. Juanda No. 123",
        latitude: -6.8903,
        longitude: 107.611,
        fotoUrl: "/uploads/posko-1.jpg",
        radius: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.poskoKkn.upsert as any).mockResolvedValue(mockResult);

      const result = await poskoKknService.upsertPosko("kel-1", {
        nama: "Posko KKN Kelompok 1 Dago",
        alamat: "Jl. Ir. H. Juanda No. 123",
        latitude: -6.8903,
        longitude: 107.611,
        fotoUrl: "/uploads/posko-1.jpg",
        radius: 200,
      });

      expect(prisma.poskoKkn.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { kelompokId: "kel-1" },
          create: expect.objectContaining({
            kelompokId: "kel-1",
            nama: "Posko KKN Kelompok 1 Dago",
            radius: 200,
            fotoUrl: "/uploads/posko-1.jpg",
          }),
          update: expect.objectContaining({
            nama: "Posko KKN Kelompok 1 Dago",
            radius: 200,
            fotoUrl: "/uploads/posko-1.jpg",
          }),
        })
      );

      expect(result.id).toBe("posko-1");
      expect(result.radius).toBe(200);
    });

    it("should fallback to default radius 150 in create when radius is not provided", async () => {
      const mockResult = {
        id: "posko-2",
        kelompokId: "kel-2",
        nama: "Posko KKN Kelompok 2",
        alamat: "Jl. Coblong No. 45",
        latitude: -6.892,
        longitude: 107.612,
        fotoUrl: null,
        radius: 150,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.poskoKkn.upsert as any).mockResolvedValue(mockResult);

      await poskoKknService.upsertPosko("kel-2", {
        nama: "Posko KKN Kelompok 2",
        alamat: "Jl. Coblong No. 45",
        latitude: -6.892,
        longitude: 107.612,
      });

      expect(prisma.poskoKkn.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { kelompokId: "kel-2" },
          create: expect.objectContaining({
            radius: 150,
          }),
        })
      );
    });
  });

  describe("getAllPosko", () => {
    it("should return posko items with both foto, fotoUrl, and normalized radius", async () => {
      const mockPoskoList = [
        {
          id: "posko-1",
          nama: "Posko KKN Kelompok 1",
          alamat: "Jl. Dago No. 1",
          kelompokId: "kel-1",
          latitude: -6.8903,
          longitude: 107.611,
          radius: 250,
          fotoUrl: "/uploads/posko-1.jpg",
          createdAt: new Date(),
          kelompok: {
            id: "kel-1",
            name: "Kelompok 01 - Dago",
            kelurahan: "DAGO",
            cakupanRw: ["01"],
            dplNamaMentah: "Dr. Budi",
            students: [{ id: "mhs-1" }, { id: "mhs-2" }],
          },
        },
      ];

      (prisma.poskoKkn.findMany as any).mockResolvedValue(mockPoskoList);
      (prisma as any).poskoKknMulti.findMany.mockResolvedValue([]);

      const items = await poskoKknService.getAllPosko();

      expect(items).toHaveLength(1);
      expect(items[0]).toEqual(
        expect.objectContaining({
          id: "posko-1",
          radius: 250,
          foto: "/uploads/posko-1.jpg",
          fotoUrl: "/uploads/posko-1.jpg",
          kelompokName: "Kelompok 01 - Dago",
          totalAnggota: 2,
        })
      );
    });
  });

  describe("getGroupAllPoskos", () => {
    it("should return combined poskos with correct isUtama, radius, and dual photo properties", async () => {
      (prisma.kelompokKkn.findUnique as any).mockResolvedValue({
        id: "kel-1",
        name: "Kelompok 01 - Dago",
        latitude: -6.8903,
        longitude: 107.611,
      });

      (prisma.poskoKkn.findUnique as any).mockResolvedValue({
        id: "posko-utama",
        nama: "Posko Utama",
        latitude: -6.8903,
        longitude: 107.611,
        fotoUrl: "/uploads/utama.jpg",
        radius: 180,
      });

      (prisma as any).poskoKknMulti.findMany.mockResolvedValue([
        {
          id: "posko-multi-1",
          nama: "Posko Tambahan RW 02",
          latitude: -6.8915,
          longitude: 107.6125,
          fotoUrl: "/uploads/multi-1.jpg",
          isUtama: false,
          radius: 100,
          kelompok: { name: "Kelompok 01" },
        },
      ]);

      const result = await poskoKknService.getGroupAllPoskos("kel-1");

      expect(result.poskoList).toHaveLength(2);
      expect(result.poskoList[0]).toEqual(
        expect.objectContaining({
          id: "posko-utama",
          isUtama: true,
          radius: 180,
          foto: "/uploads/utama.jpg",
          fotoUrl: "/uploads/utama.jpg",
          type: "POSKO_UTAMA",
        })
      );

      expect(result.poskoList[1]).toEqual(
        expect.objectContaining({
          id: "posko-multi-1",
          isUtama: false,
          radius: 100,
          foto: "/uploads/multi-1.jpg",
          fotoUrl: "/uploads/multi-1.jpg",
          type: "POSKO_MULTI",
        })
      );
    });
  });
});
