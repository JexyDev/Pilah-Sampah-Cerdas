import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock redis to avoid timeout
vi.mock("./redisService.js", () => ({
  redisService: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(null),
  },
}));

// Mock prisma client for dashboardService
vi.mock("../lib/prisma.js", () => ({
  prisma: {
    rw: { findMany: vi.fn(), count: vi.fn() },
    kelurahan: { findMany: vi.fn() },
    user: { count: vi.fn(), findMany: vi.fn() },
    warga: { count: vi.fn() },
    household: { count: vi.fn() },
    setoranOtomatis: { findMany: vi.fn(), aggregate: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    setoranManual: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    bin: { findMany: vi.fn(), count: vi.fn() },
    schedule: { findMany: vi.fn(), count: vi.fn() },
    pointHistory: { aggregate: vi.fn() },
    aiRequestLog: { count: vi.fn() },
    dispatchTask: { count: vi.fn() },
    refreshToken: { findMany: vi.fn() },
    surveiKelurahan: { findMany: vi.fn() },
    endlineSurveiKelurahan: { findMany: vi.fn() },
    kelompokKkn: { findMany: vi.fn() },
    studentKkn: { count: vi.fn() },
  },
}));

import { prisma } from "../lib/prisma.js";
import {
  dashboardService,
  BASELINE_FALLBACK_RATES,
  BASELINE_FALLBACK_KG,
} from "./dashboardService.js";

describe("dashboardService Baseline Anti-Dummy & Fallback Metadata Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (prisma.rw.findMany as any).mockResolvedValue([]);
    (prisma.rw.count as any).mockResolvedValue(6);
    (prisma.kelurahan.findMany as any).mockResolvedValue([]);
    (prisma.user.count as any).mockResolvedValue(0);
    (prisma.user.findMany as any).mockResolvedValue([]);
    (prisma.warga.count as any).mockResolvedValue(0);
    (prisma.household.count as any).mockResolvedValue(0);
    (prisma.setoranOtomatis.findMany as any).mockResolvedValue([]);
    (prisma.setoranOtomatis.aggregate as any).mockResolvedValue({ _sum: { berat: 0 } });
    (prisma.setoranOtomatis.findFirst as any).mockResolvedValue(null);
    (prisma.setoranOtomatis.count as any).mockResolvedValue(0);
    (prisma.setoranManual.findMany as any).mockResolvedValue([]);
    (prisma.setoranManual.findFirst as any).mockResolvedValue(null);
    (prisma.setoranManual.count as any).mockResolvedValue(0);
    (prisma.bin.findMany as any).mockResolvedValue([]);
    (prisma.bin.count as any).mockResolvedValue(0);
    (prisma.schedule.findMany as any).mockResolvedValue([]);
    (prisma.schedule.count as any).mockResolvedValue(0);
    (prisma.pointHistory.aggregate as any).mockResolvedValue({ _sum: { points: 0 } });
    (prisma.aiRequestLog.count as any).mockResolvedValue(0);
    (prisma.dispatchTask.count as any).mockResolvedValue(0);
    (prisma.refreshToken.findMany as any).mockResolvedValue([]);
    (prisma.endlineSurveiKelurahan.findMany as any).mockResolvedValue([]);
    (prisma.kelompokKkn.findMany as any).mockResolvedValue([]);
    (prisma.studentKkn.count as any).mockResolvedValue(0);
  });

  it("should have deactivated static fallback constants in compliance with anti-dummy governance", () => {
    expect(Object.keys(BASELINE_FALLBACK_RATES).length).toBe(0);
    expect(Object.keys(BASELINE_FALLBACK_KG).length).toBe(0);
  });

  it("should flag hasBaseline=true and return factual data when survey data exists in DB", async () => {
    (prisma.surveiKelurahan.findMany as any).mockResolvedValue([
      {
        id: "survei-dago",
        namaKelurahan: "Dago",
        pemilahanSampah: {
          persentasePemilahan: "0.35", // 35% di DB
        },
        volumeSampah: {
          organikKgPerHari: 120,
          anorganikKgPerHari: 80,
        },
      },
    ]);

    const result = await dashboardService.getKpi();
    const dago = result.baselineComparison.find((k: any) => k.kelurahan === "Dago");

    expect(dago).toBeDefined();
    // Harus murni dari DB (35% dan 200 kg)
    expect(dago.hasBaseline).toBe(true);
    expect(dago.baselineRate).toBe(35);
    expect(dago.baselineKg).toBe(200);
    expect(dago.isFallback).toBe(false);
  });

  it("should return hasBaseline=false and null baseline values when kelurahan has no survey in DB (Zero Dummy Policy)", async () => {
    // Database kosong untuk seluruh survei kelurahan
    (prisma.surveiKelurahan.findMany as any).mockResolvedValue([]);

    const result = await dashboardService.getKpi();
    const cipaganti = result.baselineComparison.find((k: any) => k.kelurahan === "Cipaganti");

    expect(cipaganti).toBeDefined();
    // Tidak menginjeksi fallback angka fiktif
    expect(cipaganti.hasBaseline).toBe(false);
    expect(cipaganti.baselineRate).toBeNull();
    expect(cipaganti.baselineKg).toBeNull();
    expect(cipaganti.isFallback).toBe(false);
  });

  describe("dashboardService getTrend Hierarchical Time Filter Tests", () => {
    it("should return 6 hourly interval buckets for 'today' or '24h' range with factual 0 kg baseline when empty", async () => {
      const trend = await dashboardService.getTrend(1, undefined, undefined, "today");

      expect(trend).toHaveLength(6);
      expect(trend.map((t: any) => t.label)).toEqual([
        "00:00",
        "04:00",
        "08:00",
        "12:00",
        "16:00",
        "20:00",
      ]);
      trend.forEach((slot: any) => {
        expect(slot.organic).toBe(0);
        expect(slot.inorganic).toBe(0);
        expect(slot.weight).toBe(0);
      });
    });

    it("should return 12 monthly buckets for 'year' range", async () => {
      const trend = await dashboardService.getTrend(52, undefined, 2026, "year");

      expect(trend).toHaveLength(12);
      expect(trend.map((t: any) => t.label)).toEqual([
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
      ]);
    });

    it("should return 7 daily buckets for 'this_week' range", async () => {
      const trend = await dashboardService.getTrend(1, undefined, undefined, "this_week");

      expect(trend).toHaveLength(7);
      expect(trend.map((t: any) => t.label)).toEqual([
        "Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"
      ]);
      trend.forEach((d: any) => {
        expect(d.date).toBeDefined();
        expect(d.organic).toBe(0);
        expect(d.inorganic).toBe(0);
      });
    });

    it("should return weekly buckets for default/7d range", async () => {
      const trend = await dashboardService.getTrend(2, undefined, undefined, "7d");

      expect(trend).toHaveLength(2);
      trend.forEach((w: any) => {
        expect(w.label).toMatch(/^W\d+$/);
      });
    });
  });

  describe("dashboardService getAvailableYears Relational Database Tests", () => {
    it("should return fallback [2026] when no setoran records exist in DB", async () => {
      const years = await dashboardService.getAvailableYears();
      expect(years).toEqual([2026]);
    });

    it("should return actual verified years based on setoran records in DB", async () => {
      (prisma.setoranOtomatis.findFirst as any)
        .mockResolvedValueOnce({ createdAt: new Date("2026-09-01T00:00:00.000Z") }) // asc
        .mockResolvedValueOnce({ createdAt: new Date("2026-09-29T00:00:00.000Z") }); // desc
      (prisma.setoranOtomatis.count as any).mockResolvedValue(10);

      const years = await dashboardService.getAvailableYears();
      expect(years).toEqual([2026]);
    });
  });
});

