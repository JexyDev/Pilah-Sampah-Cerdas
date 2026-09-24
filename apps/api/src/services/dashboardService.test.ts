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

  it("should export explicitly declared fallback constants with expected rates", () => {
    expect(BASELINE_FALLBACK_RATES.cipaganti).toBe(13.67);
    expect(BASELINE_FALLBACK_RATES.dago).toBe(10.0);
    expect(BASELINE_FALLBACK_RATES.lebakgede).toBe(21.6);
    expect(BASELINE_FALLBACK_RATES.lebaksiliwangi).toBe(15.0);
    expect(BASELINE_FALLBACK_RATES.sadangserang).toBe(24.8);
    expect(BASELINE_FALLBACK_RATES.sekeloa).toBe(17.8);

    expect(BASELINE_FALLBACK_KG.dago).toBe(500.0);
    expect(BASELINE_FALLBACK_KG.lebakgede).toBe(250.0);
    expect(BASELINE_FALLBACK_KG.lebaksiliwangi).toBe(10.0);
    expect(BASELINE_FALLBACK_KG.sadangserang).toBe(7298.5);
    expect(BASELINE_FALLBACK_KG.sekeloa).toBe(9723.4);
  });

  it("should flag isFallbackBaselineRate=false and isFallback=false when survey data exists in DB", async () => {
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
    expect(dago.baselineRate).toBe(35);
    expect(dago.baselineKg).toBe(200);
    expect(dago.isFallbackBaselineRate).toBe(false);
    expect(dago.isFallbackBaselineKg).toBe(false);
    expect(dago.isFallback).toBe(false);
  });

  it("should flag isFallbackBaselineRate=true and isFallback=true when kelurahan has no survey in DB (e.g. Cipaganti)", async () => {
    // Database kosong untuk seluruh survei kelurahan
    (prisma.surveiKelurahan.findMany as any).mockResolvedValue([]);

    const result = await dashboardService.getKpi();
    const cipaganti = result.baselineComparison.find((k: any) => k.kelurahan === "Cipaganti");

    expect(cipaganti).toBeDefined();
    // Mengambil fallback terkonfigurasi
    expect(cipaganti.baselineRate).toBe(13.67);
    // Cipaganti tidak memiliki fallback volume Kg
    expect(cipaganti.baselineKg).toBe(0);
    // Metadata audit transparansi wajib aktif
    expect(cipaganti.isFallbackBaselineRate).toBe(true);
    expect(cipaganti.isFallbackBaselineKg).toBe(false);
    expect(cipaganti.isFallback).toBe(true);
  });

  it("should flag both isFallbackBaselineRate=true and isFallbackBaselineKg=true when fallback applies to both rate and volume", async () => {
    (prisma.surveiKelurahan.findMany as any).mockResolvedValue([]);

    const result = await dashboardService.getKpi();
    const sekeloa = result.baselineComparison.find((k: any) => k.kelurahan === "Sekeloa");

    expect(sekeloa).toBeDefined();
    expect(sekeloa.baselineRate).toBe(17.8);
    expect(sekeloa.baselineKg).toBe(9723.4);
    expect(sekeloa.isFallbackBaselineRate).toBe(true);
    expect(sekeloa.isFallbackBaselineKg).toBe(true);
    expect(sekeloa.isFallback).toBe(true);
  });
});
