import { describe, it, expect, vi, beforeEach } from "vitest";
import { configService } from "./configService.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      systemConfig: {
        findMany: vi.fn(),
      },
    },
  };
});

describe("configService - isDateKknHoliday Weekend & Timezone Robustness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.systemConfig.findMany).mockResolvedValue([
      { id: "1", key: "kkn_start_date", value: "2026-08-20", category: "kkn", description: "" },
      { id: "2", key: "kkn_end_date", value: "2026-10-20", category: "kkn", description: "" },
      { id: "3", key: "kkn_auto_holiday_weekends", value: "true", category: "kkn", description: "" },
      { id: "4", key: "kkn_holidays", value: JSON.stringify([{ date: "2026-08-17", description: "HUT RI" }]), category: "kkn", description: "" },
    ] as any);
  });

  it("should identify Saturday (WIB) as weekend holiday even if Date object is created as UTC 17:00 previous day", async () => {
    // 2026-09-05 00:00 WIB is 2026-09-04 17:00 UTC
    const saturdayWibDate = new Date("2026-09-05T00:00:00+07:00");
    const result = await configService.isDateKknHoliday(saturdayWibDate);

    expect(result.isHoliday).toBe(true);
    expect(result.reason).toContain("Hari Sabtu");
  });

  it("should identify Sunday (WIB) as weekend holiday", async () => {
    // 2026-09-06 08:00 WIB
    const sundayWibDate = new Date("2026-09-06T08:00:00+07:00");
    const result = await configService.isDateKknHoliday(sundayWibDate);

    expect(result.isHoliday).toBe(true);
    expect(result.reason).toContain("Hari Minggu");
  });

  it("should NOT mark regular weekday as holiday", async () => {
    // 2026-09-01 is Tuesday
    const tuesdayDate = new Date("2026-09-01T08:00:00+07:00");
    const result = await configService.isDateKknHoliday(tuesdayDate);

    expect(result.isHoliday).toBe(false);
  });
});
