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
  getDateRangeForDay,
  getDateRangeForMonth,
  getPreviousPeriodRange,
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
    // Jika belum ada data transaksi aktual (0 atau undefined), kembalikan null (tidak klaim penurunan palsu)
    expect(calculateVolumeDeltaKg(250, 0)).toBeNull();
    expect(calculateVolumeDeltaKg(250, undefined)).toBeNull();
  });

  it("should calculate volume delta percentage correctly", () => {
    // Studi kasus Lebakgede: ((250 - 37) / 250) * 100% = 85.2%
    expect(calculateVolumeDeltaPct(250, 37)).toBe(85.2);
    // Lonjakan sampah: ((100 - 120) / 100) * 100% = -20%
    expect(calculateVolumeDeltaPct(100, 120)).toBe(-20);
    // Edge case pembagian nol atau belum ada data aktual
    expect(calculateVolumeDeltaPct(0, 50)).toBeNull();
    expect(calculateVolumeDeltaPct(null, 50)).toBeNull();
    expect(calculateVolumeDeltaPct(250, 0)).toBeNull();
    expect(calculateVolumeDeltaPct(250, null)).toBeNull();
  });

  it("should calculate compliance delta correctly", () => {
    expect(calculateComplianceDelta(13.67, 100)).toBe(86.33);
    expect(calculateComplianceDelta(50, 40)).toBe(-10);
    expect(calculateComplianceDelta(null, 80)).toBeNull();
    expect(calculateComplianceDelta(50, null)).toBeNull();
    expect(calculateComplianceDelta(50, 0)).toBeNull();
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
    // Default unit should now be 'pp'
    expect(formatComplianceDelta(86.3)).toBe("+86,3 pp");
    expect(formatComplianceDelta(86.33, { unit: "%" })).toBe("+86,3%");
    expect(formatComplianceDelta(86.33, { unit: "pp", fractionDigits: 2 })).toBe("+86,33 pp");
    expect(formatComplianceDelta(-5.2)).toBe("-5,2 pp");
    expect(formatComplianceDelta(-5.2, { unit: "pp", fractionDigits: 2 })).toBe("-5,20 pp");
    expect(formatComplianceDelta(null)).toBe("—");
  });

  it("should generate date ranges for day and month correctly", () => {
    const dayRange = getDateRangeForDay("2026-10-07");
    expect(dayRange.startDate).toBe("2026-10-07");
    expect(dayRange.endDate).toBe("2026-10-07");
    expect(dayRange.label).toContain("2026");

    const monthRange = getDateRangeForMonth(2026, 9); // September 2026 (30 hari)
    expect(monthRange.startDate).toBe("2026-09-01");
    expect(monthRange.endDate).toBe("2026-09-30");
    expect(monthRange.label.toLowerCase()).toContain("september");

    const octRange = getDateRangeForMonth(2026, 10); // Oktober 2026 (31 hari)
    expect(octRange.startDate).toBe("2026-10-01");
    expect(octRange.endDate).toBe("2026-10-31");

    // Previous period range
    const prevDay = getPreviousPeriodRange("DAILY", "2026-10-08");
    expect(prevDay.startDate).toBe("2026-10-07");
    expect(prevDay.endDate).toBe("2026-10-07");

    const prevMonth = getPreviousPeriodRange("MONTHLY", "2026-10-01");
    expect(prevMonth.startDate).toBe("2026-09-01");
    expect(prevMonth.endDate).toBe("2026-09-30");
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

  it("should aggregate kelurahan impact returning null deltas when actual data is zero", () => {
    const mockZeroItems: WasteImpactItem[] = [
      {
        id: "1",
        kelurahan: "Lebakgede",
        baselineKg: 250,
        actualKg: 0,
        baselineCompliance: 21.6,
        actualCompliance: 0,
      },
      {
        id: "2",
        kelurahan: "Sekeloa",
        baselineKg: 1000,
        actualKg: 0,
        baselineCompliance: 17.8,
        actualCompliance: 0,
      },
    ];

    const agg = aggregateKelurahanImpact(mockZeroItems);
    expect(agg.totalBaselineKg).toBe(1250);
    expect(agg.totalActualKg).toBe(0);
    expect(agg.totalDeltaKg).toBeNull();
    expect(agg.weightedDeltaPct).toBeNull();
    expect(agg.avgActualCompliance).toBeNull();
    expect(agg.deltaCompliance).toBeNull();
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

