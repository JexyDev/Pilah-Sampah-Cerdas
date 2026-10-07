import { describe, it, expect } from "vitest";
import {
  calculateVolumeDeltaKg,
  calculateVolumeDeltaPct,
  calculateComplianceDelta,
  formatDeltaKg,
  formatDeltaPct,
  formatComplianceDelta,
  aggregateKelurahanImpact,
  calculateDailyAverageKg,
  calculateMonthlyKg,
  STANDARD_CYCLE_DAYS,
  type WasteImpactItem,
} from "./wasteCalculations.js";

describe("wasteCalculations", () => {
  it("should calculate daily average kg from accumulated volume correctly", () => {
    // 1200 kg dalam 30 hari -> 40 kg/hari
    expect(calculateDailyAverageKg(1200, 30)).toBe(40);
    // 1110 kg dalam 30 hari -> 37 kg/hari
    expect(calculateDailyAverageKg(1110, 30)).toBe(37);
    // Default 30 hari
    expect(STANDARD_CYCLE_DAYS).toBe(30);
    expect(calculateDailyAverageKg(90)).toBe(3);
    // Edge cases
    expect(calculateDailyAverageKg(0)).toBe(0);
    expect(calculateDailyAverageKg(null)).toBe(0);
    expect(calculateDailyAverageKg(undefined)).toBe(0);
    expect(calculateDailyAverageKg(100, 0)).toBe(0);
  });
  it("should calculate volume delta kg correctly", () => {
    // Studi kasus Lebakgede: Baseline 250, Aktual 37 -> 213 kg
    expect(calculateVolumeDeltaKg(250, 37)).toBe(213);
    // Lonjakan timbulan sampah: Baseline 100, Aktual 125 -> -25 kg
    expect(calculateVolumeDeltaKg(100, 125)).toBe(-25);
    expect(calculateVolumeDeltaKg(null, 37)).toBeNull();
    expect(calculateVolumeDeltaKg(undefined, 37)).toBeNull();
    expect(calculateVolumeDeltaKg(250, 0)).toBe(250);
    expect(calculateVolumeDeltaKg(250, undefined)).toBe(250);
  });

  it("should calculate volume delta percentage correctly", () => {
    // Studi kasus Lebakgede: ((250 - 37) / 250) * 100% = 85.2%
    expect(calculateVolumeDeltaPct(250, 37)).toBe(85.2);
    // Lonjakan sampah: ((100 - 120) / 100) * 100% = -20%
    expect(calculateVolumeDeltaPct(100, 120)).toBe(-20);
    // Edge case pembagian nol
    expect(calculateVolumeDeltaPct(0, 50)).toBeNull();
    expect(calculateVolumeDeltaPct(null, 50)).toBeNull();
  });

  it("should calculate compliance delta correctly", () => {
    expect(calculateComplianceDelta(13.67, 100)).toBe(86.33);
    expect(calculateComplianceDelta(50, 40)).toBe(-10);
    expect(calculateComplianceDelta(null, 80)).toBeNull();
    expect(calculateComplianceDelta(50, null)).toBeNull();
  });

  it("should format delta kg correctly", () => {
    expect(formatDeltaKg(213)).toBe("+213,0 kg");
    expect(formatDeltaKg(-25.5)).toBe("-25,5 kg");
    expect(formatDeltaKg(0)).toBe("0,0 kg");
    expect(formatDeltaKg(null)).toBe("—");
  });

  it("should format delta percentage correctly", () => {
    expect(formatDeltaPct(85.2)).toBe("+85,2%");
    expect(formatDeltaPct(-20)).toBe("-20,0%");
    expect(formatDeltaPct(null)).toBe("—");
  });

  it("should format compliance delta with appropriate unit and decimals", () => {
    expect(formatComplianceDelta(86.33, { unit: "%" })).toBe("+86,33%");
    expect(formatComplianceDelta(86.33, { unit: "pp" })).toBe("+86,33 pp");
    expect(formatComplianceDelta(-5.2, { unit: "pp" })).toBe("-5,2 pp");
    expect(formatComplianceDelta(-5.2, { unit: "pp", fractionDigits: 2 })).toBe("-5,20 pp");
  });

  it("should aggregate kelurahan impact using weighted calculations", () => {
    const mockItems: WasteImpactItem[] = [
      {
        id: "1",
        kelurahan: "Lebakgede",
        baselineKg: 250,
        actualKg: 37,
        baselineCompliance: 21.6,
        actualCompliance: 80,
        setoranDinilai: 10,
        setoranPatuh: 8,
      },
      {
        id: "2",
        kelurahan: "Sekeloa",
        baselineKg: 1000,
        actualKg: 900,
        baselineCompliance: 17.8,
        actualCompliance: 60,
        setoranDinilai: 20,
        setoranPatuh: 12,
      },
    ];

    const agg = aggregateKelurahanImpact(mockItems);
    expect(agg.totalBaselineKg).toBe(1250);
    expect(agg.totalActualKg).toBe(937);
    expect(agg.totalDeltaKg).toBe(313);
    expect(agg.weightedDeltaPct).toBe(25.04);
    expect(agg.avgActualCompliance).toBe(70);
  });

  it("should calculate monthly kg (daily * 30) correctly and preserve delta percentage", () => {
    // Harian: 100 kg/hari -> Bulanan: 3000 kg/bulan
    expect(calculateMonthlyKg(100)).toBe(3000);
    expect(calculateMonthlyKg(37)).toBe(1110);
    expect(calculateMonthlyKg(0)).toBe(0);
    expect(calculateMonthlyKg(null)).toBeNull();
    expect(calculateMonthlyKg(undefined)).toBeNull();

    // Delta harian vs bulanan
    const dailyBaseline = 100;
    const dailyActual = 37;
    const monthlyBaseline = calculateMonthlyKg(dailyBaseline)!; // 3000
    const monthlyActual = calculateMonthlyKg(dailyActual)!;     // 1110

    const dailyDeltaKg = calculateVolumeDeltaKg(dailyBaseline, dailyActual); // 63
    const monthlyDeltaKg = calculateVolumeDeltaKg(monthlyBaseline, monthlyActual); // 1890

    expect(monthlyDeltaKg).toBe(dailyDeltaKg! * 30);

    // Delta persentase wajib identik antara harian dan bulanan
    const dailyDeltaPct = calculateVolumeDeltaPct(dailyBaseline, dailyActual);
    const monthlyDeltaPct = calculateVolumeDeltaPct(monthlyBaseline, monthlyActual);

    expect(dailyDeltaPct).toBe(63);
    expect(monthlyDeltaPct).toBe(63);
    expect(monthlyDeltaPct).toBe(dailyDeltaPct);
  });
});

