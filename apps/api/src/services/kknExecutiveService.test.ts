import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

  it("should return 75 RW and 6 Kelurahan for default view (Semua Kelurahan)", async () => {
    (prisma.kelurahan.count as any).mockResolvedValue(6);
    (prisma.rw.count as any).mockResolvedValue(75);

    const result = await kknExecutiveService.getExecutiveDashboard({});

    expect(prisma.kelurahan.count).toHaveBeenCalled();
    expect(prisma.rw.count).toHaveBeenCalled();
    expect(result.summary.totalWilayah.kelurahanCount).toBe(6);
    expect(result.summary.totalWilayah.rwCount).toBe(75);
    expect(result.summary.totalWilayah.label).toBe("6 Kelurahan • 75 RW");
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

describe("kknExecutiveService - Rasio Kehadiran Target 250 Jam", () => {
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

    (prisma.user.findMany as any).mockResolvedValue([
      { id: "u1", role: "MAHASISWA" },
    ]);
    (prisma.studentKkn.findMany as any).mockResolvedValue([
      { id: "s1", userId: "u1" },
    ]);
    (prisma.programKerjaKkn.findMany as any).mockResolvedValue([]);
    (prisma.programKerjaKkn.count as any).mockResolvedValue(0);
    (prisma.activityAttendance.groupBy as any).mockResolvedValue([]);
    (prisma.activityAttendance.count as any).mockResolvedValue(0);
    // Mock 125 jam (7500 menit) aktual
    (prisma.activityAttendance.aggregate as any).mockResolvedValue({
      _sum: { actualInZoneMinutes: 7500 },
    });
    (prisma.presensiMandiri.aggregate as any).mockResolvedValue({
      _sum: { durasiMenit: 0 },
    });
    (prisma.activityAttendance.findMany as any).mockResolvedValue([]);
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

  it("menghitung rasio kehadiran terhadap target 250 jam dengan benar", async () => {
    const result = await kknExecutiveService.getExecutiveDashboard({});

    // 7500 menit = 125 jam. Total mahasiswa = 1.
    // 125 jam / 250 jam = 50%
    expect(result.summary.rasioKehadiran.targetHours).toBe(250);
    expect(result.summary.rasioKehadiran.totalHours).toBe(125);
    expect(result.summary.rasioKehadiran.percentage).toBe(50);
    expect(result.summary.rasioKehadiran.remainingHours).toBe(125);
    expect(result.summary.rasioKehadiran.sublabel).toBe("125 dari target 250 jam");

    expect(result.rasioKehadiranTrend.targetHours).toBe(250);
    expect(result.rasioKehadiranTrend.currentAvgHours).toBe(125);
    expect(result.rasioKehadiranTrend.percentage).toBe(50);
    expect(result.rasioKehadiranTrend.remainingHours).toBe(125);

    // Semua pekan weeklyTrends targetnya harus 250
    result.rasioKehadiranTrend.weeklyTrends.forEach((w) => {
      expect(w.target).toBe(250);
    });
  });
});

describe("kknExecutiveService - Linimasa Terkini Dynamic Calendar & Active Stage Windowing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-08T10:00:00.000Z")); // 8 Oktober 2026 (Minggu 9)

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

    (prisma.user.findMany as any).mockResolvedValue([{ id: "u1", role: "MAHASISWA" }]);
    (prisma.studentKkn.findMany as any).mockResolvedValue([{ id: "s1", userId: "u1" }]);
    (prisma.programKerjaKkn.findMany as any).mockResolvedValue([]);
    (prisma.programKerjaKkn.count as any).mockResolvedValue(0);
    (prisma.activityAttendance.groupBy as any).mockResolvedValue([]);
    (prisma.activityAttendance.count as any).mockResolvedValue(0);
    (prisma.activityAttendance.aggregate as any).mockResolvedValue({ _sum: { actualInZoneMinutes: 0 } });
    (prisma.presensiMandiri.aggregate as any).mockResolvedValue({ _sum: { durasiMenit: 0 } });
    (prisma.activityAttendance.findMany as any).mockResolvedValue([]);
    (prisma.logbookKkn.count as any).mockResolvedValue(0);
    (prisma.logbookKkn.findFirst as any).mockResolvedValue(null);
    (prisma.logbookKkn.findMany as any).mockResolvedValue([]);
    (prisma.logbookDpl.count as any).mockResolvedValue(0);
    (prisma.logbookDpl.findMany as any).mockResolvedValue([]);
    (prisma.logbookDpl.groupBy as any).mockResolvedValue([]);
    (prisma.kelurahan.count as any).mockResolvedValue(6);
    (prisma.rw.count as any).mockResolvedValue(84);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("menampilkan tahapan 'Sedang Berlangsung' pada lini masa eksekutif sesuai kalender riil hari ini (8 Okt 2026 = Minggu 9)", async () => {
    // Mock database kembalikan daftar 10 pekan KKN (Minggu 1 s/d Minggu 12)
    const mockDbTimelines = [
      { id: "t1", tahapMinggu: "Minggu 1", tanggal: "12 - 18 Agustus 2026", startDate: new Date("2026-08-12"), endDate: new Date("2026-08-18"), statusPelaksanaan: "SELESAI", kegiatanUtama: "Kick Off" },
      { id: "t2", tahapMinggu: "Minggu 2", tanggal: "19 - 25 Agustus 2026", startDate: new Date("2026-08-19"), endDate: new Date("2026-08-25"), statusPelaksanaan: "SELESAI", kegiatanUtama: "Observasi" },
      { id: "t3", tahapMinggu: "Minggu 3", tanggal: "26 Agustus - 1 September 2026", startDate: new Date("2026-08-26"), endDate: new Date("2026-09-01"), statusPelaksanaan: "SELESAI", kegiatanUtama: "Matriks Proker" },
      { id: "t4", tahapMinggu: "Minggu 4", tanggal: "2 - 8 September 2026", startDate: new Date("2026-09-02"), endDate: new Date("2026-09-08"), statusPelaksanaan: "SELESAI", kegiatanUtama: "Distribusi Sarana" },
      { id: "t5", tahapMinggu: "Minggu 5", tanggal: "9 - 15 September 2026", startDate: new Date("2026-09-09"), endDate: new Date("2026-09-15"), statusPelaksanaan: "SELESAI", kegiatanUtama: "Edukasi Warga" },
      { id: "t6", tahapMinggu: "Minggu 6 dan 7", tanggal: "16 - 29 September 2026", startDate: new Date("2026-09-16"), endDate: new Date("2026-09-29"), statusPelaksanaan: "SELESAI", kegiatanUtama: "Perluasan RW" },
      { id: "t7", tahapMinggu: "Minggu 8", tanggal: "30 September - 6 Oktober 2026", startDate: new Date("2026-09-30"), endDate: new Date("2026-10-06"), statusPelaksanaan: "SELESAI", kegiatanUtama: "IoT & Kompos" },
      { id: "t8", tahapMinggu: "Minggu 9", tanggal: "7 - 13 Oktober 2026", startDate: new Date("2026-10-07"), endDate: new Date("2026-10-13"), statusPelaksanaan: "BELUM_DIMULAI", kegiatanUtama: "Bank Sampah & POC" },
      { id: "t9", tahapMinggu: "Minggu 10 dan 11", tanggal: "14 - 27 Oktober 2026", startDate: new Date("2026-10-14"), endDate: new Date("2026-10-27"), statusPelaksanaan: "BELUM_DIMULAI", kegiatanUtama: "Mitigasi & SOP" },
      { id: "t10", tahapMinggu: "Minggu 12", tanggal: "28 - 31 Oktober 2026", startDate: new Date("2026-10-28"), endDate: new Date("2026-10-31"), statusPelaksanaan: "BELUM_DIMULAI", kegiatanUtama: "Penutupan" },
    ];

    (prisma.timelineKkn.findMany as any).mockResolvedValue(mockDbTimelines);

    const result = await kknExecutiveService.getExecutiveDashboard({});

    expect(result.liniMasaTerkini).toBeDefined();
    expect(result.liniMasaTerkini.length).toBe(4);

    // Pastikan ada item yang berstatus 'Sedang Berlangsung' dengan badgeType 'active'
    const activeItem = result.liniMasaTerkini.find((item: any) => item.status === "Sedang Berlangsung");
    expect(activeItem).toBeDefined();
    expect(activeItem?.badgeType).toBe("active");
    expect(activeItem?.dateRange).toContain("Minggu 9");

    // Pastikan urutan window 4 item adalah: Minggu 8 (Selesai), Minggu 9 (Sedang Berlangsung), Minggu 10-11 (Akan Datang), Minggu 12 (Akan Datang)
    expect(result.liniMasaTerkini[0].dateRange).toContain("Minggu 8");
    expect(result.liniMasaTerkini[0].status).toBe("Selesai");
    expect(result.liniMasaTerkini[0].badgeType).toBe("completed");

    expect(result.liniMasaTerkini[1].dateRange).toContain("Minggu 9");
    expect(result.liniMasaTerkini[1].status).toBe("Sedang Berlangsung");
    expect(result.liniMasaTerkini[1].badgeType).toBe("active");

    expect(result.liniMasaTerkini[2].dateRange).toContain("Minggu 10 dan 11");
    expect(result.liniMasaTerkini[2].status).toBe("Akan Datang");
    expect(result.liniMasaTerkini[2].badgeType).toBe("upcoming");

    expect(result.liniMasaTerkini[3].dateRange).toContain("Minggu 12");
    expect(result.liniMasaTerkini[3].status).toBe("Akan Datang");
    expect(result.liniMasaTerkini[3].badgeType).toBe("upcoming");
  });

  it("menggunakan fallback DEFAULT_TIMELINE_COBLONG saat database timeline kosong dan tetap memuat tahapan aktif", async () => {
    (prisma.timelineKkn.findMany as any).mockResolvedValue([]);

    const result = await kknExecutiveService.getExecutiveDashboard({});

    expect(result.liniMasaTerkini).toBeDefined();
    expect(result.liniMasaTerkini.length).toBe(4);

    // Di DEFAULT_TIMELINE_COBLONG pada 8 Okt 2026, Minggu 9 aktif
    const activeItem = result.liniMasaTerkini.find((item: any) => item.status === "Sedang Berlangsung");
    expect(activeItem).toBeDefined();
    expect(activeItem?.badgeType).toBe("active");
    expect(activeItem?.dateRange).toContain("Minggu 9");
  });
});


