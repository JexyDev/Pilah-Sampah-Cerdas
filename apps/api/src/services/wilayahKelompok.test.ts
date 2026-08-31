import { describe, it, expect, vi, beforeEach } from "vitest";
import { parsePolygonCoordinates, kknService } from "./kknService.js";
import { prisma } from "../lib/prisma.js";

// Mock Prisma
vi.mock("../lib/prisma.js", () => ({
  prisma: {
    studentKkn: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    kelompokKkn: {
      findFirst: vi.fn(),
    },
  },
}));

describe("parsePolygonCoordinates Helper", () => {
  it("should parse array of {lat, lng} objects", () => {
    const raw = [
      { lat: -6.9147, lng: 107.6098 },
      { lat: -6.915, lng: 107.6105 },
      { lat: -6.9142, lng: 107.611 },
      { lat: -6.9147, lng: 107.6098 },
    ];
    const parsed = parsePolygonCoordinates(raw);
    expect(parsed).toEqual(raw);
  });

  it("should parse array of [lat, lng] coordinates", () => {
    const raw = [
      [-6.9147, 107.6098],
      [-6.915, 107.6105],
      [-6.9142, 107.611],
      [-6.9147, 107.6098],
    ];
    const parsed = parsePolygonCoordinates(raw);
    expect(parsed).toEqual([
      { lat: -6.9147, lng: 107.6098 },
      { lat: -6.915, lng: 107.6105 },
      { lat: -6.9142, lng: 107.611 },
      { lat: -6.9147, lng: 107.6098 },
    ]);
  });

  it("should parse stringified JSON polygon", () => {
    const raw = JSON.stringify([
      { lat: -6.9147, lng: 107.6098 },
      { lat: -6.915, lng: 107.6105 },
      { lat: -6.9142, lng: 107.611 },
    ]);
    const parsed = parsePolygonCoordinates(raw);
    expect(parsed).toHaveLength(3);
    expect(parsed![0]).toEqual({ lat: -6.9147, lng: 107.6098 });
  });

  it("should return null for less than 3 points", () => {
    const raw = [{ lat: -6.9147, lng: 107.6098 }];
    expect(parsePolygonCoordinates(raw)).toBeNull();
  });

  it("should return null for invalid data", () => {
    expect(parsePolygonCoordinates(null)).toBeNull();
    expect(parsePolygonCoordinates("invalid-json")).toBeNull();
    expect(parsePolygonCoordinates({})).toBeNull();
  });
});

describe("kknService.getWilayahKelompok", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return POLYGON type when kelompok schedule has a valid polygon", async () => {
    const mockStudent = {
      userId: "user-1",
      kelompok: {
        id: "kelompok-123",
        name: "Kelompok KKN 12 - Desa Cibiru",
        kelurahan: "Cibiru",
        poskoKkn: {
          latitude: -6.914744,
          longitude: 107.60981,
        },
        facilities: [],
        schedules: [
          {
            id: "sched-1",
            isActive: true,
            radius: 200,
            polygon: [
              { lat: -6.9147, lng: 107.6098 },
              { lat: -6.915, lng: 107.6105 },
              { lat: -6.9142, lng: 107.611 },
              { lat: -6.9147, lng: 107.6098 },
            ],
          },
        ],
      },
      assignedRw: null,
    };

    (prisma.studentKkn.findUnique as any).mockResolvedValue(mockStudent);

    const result = await kknService.getWilayahKelompok("user-1");

    expect(result).toEqual({
      kelompokId: "kelompok-123",
      namaKelompok: "Kelompok KKN 12 - Desa Cibiru",
      posko: {
        latitude: -6.914744,
        longitude: 107.60981,
      },
      tipeArea: "POLYGON",
      polygonKoordinat: [
        { lat: -6.9147, lng: 107.6098 },
        { lat: -6.915, lng: 107.6105 },
        { lat: -6.9142, lng: 107.611 },
        { lat: -6.9147, lng: 107.6098 },
      ],
      radiusMeters: null,
    });
  });

  it("should return RADIUS type when kelompok schedule has no polygon", async () => {
    const mockStudent = {
      userId: "user-2",
      kelompok: {
        id: "kelompok-456",
        name: "Kelompok KKN 01 - Dago",
        kelurahan: "Dago",
        poskoKkn: {
          latitude: -6.8833,
          longitude: 107.6167,
        },
        facilities: [],
        schedules: [
          {
            id: "sched-2",
            isActive: true,
            radius: 250,
            polygon: null,
          },
        ],
      },
      assignedRw: null,
    };

    (prisma.studentKkn.findUnique as any).mockResolvedValue(mockStudent);

    const result = await kknService.getWilayahKelompok("user-2");

    expect(result).toEqual({
      kelompokId: "kelompok-456",
      namaKelompok: "Kelompok KKN 01 - Dago",
      posko: {
        latitude: -6.8833,
        longitude: 107.6167,
      },
      tipeArea: "RADIUS",
      polygonKoordinat: null,
      radiusMeters: 250,
    });
  });

  it("should fallback posko coordinates based on kelurahan name if poskoKkn is not registered", async () => {
    const mockStudent = {
      userId: "user-3",
      kelompok: {
        id: "kelompok-789",
        name: "Kelompok KKN 05 - Sekeloa",
        kelurahan: "Sekeloa",
        poskoKkn: null,
        facilities: [],
        schedules: [],
      },
      assignedRw: null,
    };

    (prisma.studentKkn.findUnique as any).mockResolvedValue(mockStudent);

    const result = await kknService.getWilayahKelompok("user-3");

    expect(result.posko).toEqual({
      latitude: -6.89,
      longitude: 107.62,
    });
    expect(result.tipeArea).toBe("RADIUS");
    expect(result.radiusMeters).toBe(200);
  });

  it("should throw KELOMPOK_NOT_FOUND when student has no kelompok", async () => {
    (prisma.studentKkn.findUnique as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValue({ role: { name: "MAHASISWA_KKN" } });

    await expect(kknService.getWilayahKelompok("unknown-user")).rejects.toThrow(
      "KELOMPOK_NOT_FOUND"
    );
  });
});
