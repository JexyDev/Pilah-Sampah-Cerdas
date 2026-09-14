import { describe, it, expect, vi, beforeEach } from "vitest";
import { kknExecutiveService } from "./kknExecutiveService.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    kelompokKkn: {
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    studentKkn: {
      findMany: vi.fn(),
    },
    programKerjaKkn: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    activityAttendance: {
      groupBy: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn().mockResolvedValue({ _sum: { actualInZoneMinutes: 0 } }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    presensiMandiri: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { durasiMenit: 0 } }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    logbookKkn: {
      count: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    logbookDpl: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    timelineKkn: {
      findMany: vi.fn(),
    },
    kelurahan: {
      count: vi.fn(),
    },
    rw: {
      count: vi.fn(),
    },
  },
}));

describe("kknExecutiveService - Total Wilayah & RW Calculation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock kelompok default
    (prisma.kelompokKkn.findMany as any).mockResolvedValue([
      {
        id: "k1",
        name: "Kelompok 1 Dago",
        kelurahan: "Dago",
        cakupanRw: ["1", "2"],
        dplId: "dpl1",
        schedules: [],
        programKerja: [],
      },
      {
        id: "k2",
        name: "Kelompok 1 Sekeloa",
        kelurahan: "Sekeloa",
        cakupanRw: ["1", "2"],
        dplId: "dpl2",
        schedules: [],
        programKerja: [],
      },
    ]);

    (prisma.user.findMany as any).mockResolvedValue([]);
    (prisma.studentKkn.findMany as any).mockResolvedValue([]);
    (prisma.programKerjaKkn.findMany as any).mockResolvedValue([]);
    (prisma.programKerjaKkn.count as any).mockResolvedValue(0);
    (prisma.activityAttendance.groupBy as any).mockResolvedValue([]);
    (prisma.activityAttendance.count as any).mockResolvedValue(0);
    (prisma.logbookKkn.count as any).mockResolvedValue(0);
    (prisma.logbookKkn.findFirst as any).mockResolvedValue(null);
    (prisma.logbookKkn.findMany as any).mockResolvedValue([]);
    (prisma.logbookDpl.count as any).mockResolvedValue(0);
    (prisma.logbookDpl.findMany as any).mockResolvedValue([]);
    (prisma.logbookDpl.groupBy as any).mockResolvedValue([]);
    (prisma.timelineKkn.findMany as any).mockResolvedValue([]);
  });

  it("should return 84 RW and 6 Kelurahan for default view (Semua Kelurahan)", async () => {
    (prisma.kelurahan.count as any).mockResolvedValue(6);
    (prisma.rw.count as any).mockResolvedValue(84);

    const result = await kknExecutiveService.getExecutiveDashboard({});

    expect(prisma.kelurahan.count).toHaveBeenCalled();
    expect(prisma.rw.count).toHaveBeenCalled();
    expect(result.summary.totalWilayah.kelurahanCount).toBe(6);
    expect(result.summary.totalWilayah.rwCount).toBe(84);
    expect(result.summary.totalWilayah.totalRwKecamatan).toBe(84);
    expect(result.summary.totalWilayah.label).toBe("6 Kelurahan • 84 RW");
  });

  it("should query rw count for specific kelurahan when filtered", async () => {
    (prisma.kelurahan.count as any).mockResolvedValue(6);
    (prisma.rw.count as any).mockResolvedValue(13);

    const result = await kknExecutiveService.getExecutiveDashboard({ kelurahan: "Dago" });

    expect(prisma.rw.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          kelurahan: {
            name: { contains: "Dago", mode: "insensitive" },
          },
        }),
      })
    );
    expect(result.summary.totalWilayah.kelurahanCount).toBe(1);
    expect(result.summary.totalWilayah.rwCount).toBe(13);
    expect(result.summary.totalWilayah.label).toBe("1 Kelurahan • 13 RW");
  });

  it("should return rwCount = 1 when filtered by RW", async () => {
    (prisma.kelurahan.count as any).mockResolvedValue(6);

    const result = await kknExecutiveService.getExecutiveDashboard({ rw: "RW 01" });

    expect(result.summary.totalWilayah.rwCount).toBe(1);
  });

  it("should avoid RW collision between kelurahans when counting distinct RW per group", async () => {
    (prisma.kelurahan.count as any).mockResolvedValue(6);
    (prisma.rw.count as any).mockResolvedValue(84);

    // K1 Dago has RW 1 & 2; K2 Sekeloa has RW 1 & 2
    // If filtered by specific kelompok "Kelompok 1 Dago", it should return 2 RW
    const result = await kknExecutiveService.getExecutiveDashboard({ kelompok: "Kelompok 1 Dago" });

    expect(result.summary.totalWilayah.kelurahanCount).toBe(1);
    expect(result.summary.totalWilayah.rwCount).toBe(2);
  });
});
