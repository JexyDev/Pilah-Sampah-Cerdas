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
    setoranOtomatis: { findMany: vi.fn(), aggregate: vi.fn() },
    setoranManual: { findMany: vi.fn() },
    bin: { findMany: vi.fn(), count: vi.fn() },
    schedule: { findMany: vi.fn(), count: vi.fn() },
    pointHistory: { aggregate: vi.fn() },
    aiRequestLog: { count: vi.fn() },
    dispatchTask: { count: vi.fn() },
    refreshToken: { findMany: vi.fn() },
    surveiKelurahan: { findMany: vi.fn() },
    endlineSurveiKelurahan: { findMany: vi.fn() },
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
    (prisma.setoranManual.findMany as any).mockResolvedValue([]);
    (prisma.bin.findMany as any).mockResolvedValue([]);
    (prisma.bin.count as any).mockResolvedValue(0);
    (prisma.schedule.findMany as any).mockResolvedValue([]);
    (prisma.schedule.count as any).mockResolvedValue(0);
    (prisma.pointHistory.aggregate as any).mockResolvedValue({ _sum: { points: 0 } });
    (prisma.aiRequestLog.count as any).mockResolvedValue(0);
    (prisma.dispatchTask.count as any).mockResolvedValue(0);
    (prisma.refreshToken.findMany as any).mockResolvedValue([]);
    (prisma.endlineSurveiKelurahan.findMany as any).mockResolvedValue([]);
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
});
