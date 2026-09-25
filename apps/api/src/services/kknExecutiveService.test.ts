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

describe("kknExecutiveService - Status Pelaksanaan Proker (Business Logic Fix)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
    ]);

    (prisma.user.findMany as any).mockResolvedValue([]);
    (prisma.studentKkn.findMany as any).mockResolvedValue([]);
    (prisma.activityAttendance.groupBy as any).mockResolvedValue([]);
    (prisma.activityAttendance.count as any).mockResolvedValue(0);
    (prisma.logbookKkn.count as any).mockResolvedValue(0);
    (prisma.logbookKkn.findFirst as any).mockResolvedValue(null);
    (prisma.logbookKkn.findMany as any).mockResolvedValue([]);
    (prisma.logbookDpl.count as any).mockResolvedValue(0);
    (prisma.logbookDpl.findMany as any).mockResolvedValue([]);
    (prisma.logbookDpl.groupBy as any).mockResolvedValue([]);
    (prisma.timelineKkn.findMany as any).mockResolvedValue([]);
    (prisma.kelurahan.count as any).mockResolvedValue(6);
    (prisma.rw.count as any).mockResolvedValue(84);
  });

  it("hanya menghitung pelaksanaan dari proker DISETUJUI, mengabaikan proker MENUNGGU dan DITOLAK", async () => {
    // 138 proker total:
    // - 104 DISETUJUI -> 27 selesai, 64 sedang berjalan, 13 belum mulai
    // - 28 MENUNGGU -> tidak masuk keranjang pelaksanaan
    // - 6 DITOLAK -> tidak masuk keranjang pelaksanaan
    const mockProkers = [
      ...Array.from({ length: 27 }, (_, i) => ({
        id: `selesai-${i}`,
        status: "SELESAI",
        statusUsulan: "DISETUJUI",
        statusPelaksanaan: "SELESAI",
      })),
      ...Array.from({ length: 64 }, (_, i) => ({
        id: `berjalan-${i}`,
        status: "SEDANG_BERJALAN",
        statusUsulan: "DISETUJUI",
        statusPelaksanaan: "SEDANG_BERJALAN",
      })),
      ...Array.from({ length: 13 }, (_, i) => ({
        id: `belum-${i}`,
        status: "DITERIMA",
        statusUsulan: "DISETUJUI",
        statusPelaksanaan: "",
      })),
      ...Array.from({ length: 28 }, (_, i) => ({
        id: `menunggu-${i}`,
        status: "MENUNGGU",
        statusUsulan: "MENUNGGU",
        statusPelaksanaan: "",
      })),
      ...Array.from({ length: 6 }, (_, i) => ({
        id: `ditolak-${i}`,
        status: "DITOLAK",
        statusUsulan: "DITOLAK",
        statusPelaksanaan: "",
      })),
    ];

    (prisma.programKerjaKkn.findMany as any).mockResolvedValue(mockProkers);

    const result = await kknExecutiveService.getExecutiveDashboard({});
    const { usulan, pelaksanaan } = result.statusProker;

    // Dimensi Usulan: total 138
    expect(usulan.total).toBe(138);
    expect(usulan.disetujui.count).toBe(104);
    expect(usulan.belumDisetujui.count).toBe(28);
    expect(usulan.ditolak.count).toBe(6);

    // Dimensi Pelaksanaan: total 104 (HANYA proker disetujui)
    expect(pelaksanaan.total).toBe(104);
    expect(pelaksanaan.selesai.count).toBe(27);
    expect(pelaksanaan.sedangBerjalan.count).toBe(64);
    expect(pelaksanaan.belum.count).toBe(13); // Terkoreksi akurat jadi 13, bukan 47!

    // Persentase dihitung terhadap total proker disetujui (104)
    expect(pelaksanaan.selesai.percentage).toBe(Math.round((27 / 104) * 100));
    expect(pelaksanaan.sedangBerjalan.percentage).toBe(Math.round((64 / 104) * 100));
    expect(pelaksanaan.belum.percentage).toBe(Math.round((13 / 104) * 100));
  });
});

