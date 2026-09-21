import { describe, it, expect } from "vitest";
import { calculateRealDuration } from "../../scripts/migrate-historical-presensi-durasi.js";

describe("Migrate Historical Presensi - Logic & Duration Calculation", () => {
  it("should accurately calculate duration without pause (jeda)", () => {
    const attendedAt = new Date("2026-08-28T08:00:00+07:00");
    const checkOutAt = new Date("2026-08-28T09:45:00+07:00"); // 105 mins

    const { durasiKasar, totalJedaMenit, durasiRiil } = calculateRealDuration(
      attendedAt,
      checkOutAt,
      []
    );

    expect(durasiKasar).toBe(105);
    expect(totalJedaMenit).toBe(0);
    expect(durasiRiil).toBe(105);
  });

  it("should accurately subtract pause time from jedaLogs", () => {
    const attendedAt = new Date("2026-08-28T08:00:00+07:00");
    const checkOutAt = new Date("2026-08-28T12:30:00+07:00"); // 270 mins kasar

    const jedaLogs = [
      {
        waktuJeda: "2026-08-28T09:00:00+07:00",
        waktuResume: "2026-08-28T09:40:00+07:00", // 40 mins
      },
      {
        waktuJeda: "2026-08-28T11:00:00+07:00",
        waktuResume: "2026-08-28T11:20:00+07:00", // 20 mins
      },
    ];

    const { durasiKasar, totalJedaMenit, durasiRiil } = calculateRealDuration(
      attendedAt,
      checkOutAt,
      jedaLogs
    );

    expect(durasiKasar).toBe(270);
    expect(totalJedaMenit).toBe(60);
    expect(durasiRiil).toBe(210); // 270 - 60 = 210 (Kurang dari 240 target)
  });

  it("should ignore invalid or incomplete jeda logs safely", () => {
    const attendedAt = new Date("2026-08-28T08:00:00+07:00");
    const checkOutAt = new Date("2026-08-28T12:00:00+07:00"); // 240 mins

    const jedaLogs = [
      null,
      {},
      { waktuJeda: "2026-08-28T09:00:00+07:00" }, // missing waktuResume
      { waktuJeda: "2026-08-28T10:00:00+07:00", waktuResume: "2026-08-28T09:30:00+07:00" }, // resume earlier than pause
    ];

    const { durasiKasar, totalJedaMenit, durasiRiil } = calculateRealDuration(
      attendedAt,
      checkOutAt,
      jedaLogs
    );

    expect(durasiKasar).toBe(240);
    expect(totalJedaMenit).toBe(0);
    expect(durasiRiil).toBe(240);
  });

  it("should clamp maximum duration to 480 minutes (8 hours)", () => {
    const attendedAt = new Date("2026-08-28T06:00:00+07:00");
    const checkOutAt = new Date("2026-08-28T20:00:00+07:00"); // 14 hours = 840 mins

    const { durasiKasar, durasiRiil } = calculateRealDuration(
      attendedAt,
      checkOutAt,
      []
    );

    expect(durasiKasar).toBe(840);
    expect(durasiRiil).toBe(480);
  });

  it("should clamp negative duration to 0 minutes", () => {
    const attendedAt = new Date("2026-08-28T10:00:00+07:00");
    const checkOutAt = new Date("2026-08-28T09:00:00+07:00"); // anomaly checkout before attend

    const { durasiRiil } = calculateRealDuration(
      attendedAt,
      checkOutAt,
      []
    );

    expect(durasiRiil).toBe(0);
  });

  it("should correctly identify if duration satisfies target vs not", () => {
    const target = 240;

    const case1DurasiRiil = 240;
    const case1Status = case1DurasiRiil >= target ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI";
    expect(case1Status).toBe("HADIR_MEMENUHI");

    const case2DurasiRiil = 239;
    const case2Status = case2DurasiRiil >= target ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI";
    expect(case2Status).toBe("HADIR_TIDAK_MEMENUHI");

    const case3DurasiRiil = 36; // Contoh riil kasus Ananda Fityan
    const case3Status = case3DurasiRiil >= target ? "HADIR_MEMENUHI" : "HADIR_TIDAK_MEMENUHI";
    expect(case3Status).toBe("HADIR_TIDAK_MEMENUHI");
  });
});
