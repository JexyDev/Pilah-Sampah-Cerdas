import { describe, it, expect } from "vitest";

// Replikasi fungsi normalisasi status & kalkulasi metrik proker untuk QC backend/frontend
type ProkerExecutionStatus = "SELESAI" | "SEDANG_BERJALAN" | "BELUM_MULAI";

function normalizeProkerExecutionStatus(
  statusPelaksanaan?: string | null,
  legacyStatus?: string | null
): ProkerExecutionStatus {
  const p = String(statusPelaksanaan || "").toUpperCase().trim();
  const leg = String(legacyStatus || "").toUpperCase().trim();

  if (p === "SELESAI" || p === "SUDAH") return "SELESAI";
  if (
    p === "SEDANG_BERJALAN" ||
    p === "SEDANG_DILAKSANAKAN" ||
    p === "BERJALAN" ||
    p === "SEDANG" ||
    p === "BERLANGSUNG"
  )
    return "SEDANG_BERJALAN";
  if (p === "BELUM_MULAI" || p === "BELUM_DIMULAI" || p === "BELUM") return "BELUM_MULAI";

  if (leg === "SELESAI" || leg === "SUDAH") return "SELESAI";
  if (
    leg === "SEDANG_BERJALAN" ||
    leg === "SEDANG_DILAKSANAKAN" ||
    leg === "BERJALAN" ||
    leg === "SEDANG" ||
    leg === "BERLANGSUNG"
  )
    return "SEDANG_BERJALAN";

  return "BELUM_MULAI";
}

function calculateProkerMetrics(programKerja?: any[] | null) {
  const prokers = Array.isArray(programKerja) ? programKerja : [];
  const total = prokers.length;

  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      ongoing: 0,
      notStarted: 0,
      rate: 0,
      ratioLabel: "0/0",
      tooltip: "Belum ada program kerja",
      isLowProker: false,
    };
  }

  let completed = 0;
  let ongoing = 0;
  let notStarted = 0;

  for (const p of prokers) {
    const status = normalizeProkerExecutionStatus(p?.statusPelaksanaan, p?.status);
    if (status === "SELESAI") completed++;
    else if (status === "SEDANG_BERJALAN") ongoing++;
    else notStarted++;
  }

  const rawRate = (completed / total) * 100;
  const rate = Math.min(100, Math.max(0, Math.round(rawRate)));

  return {
    total,
    completed,
    ongoing,
    notStarted,
    rate,
    ratioLabel: `${completed}/${total}`,
    tooltip: `${completed} Selesai, ${ongoing} Sedang Berjalan, dari total ${total} Proker`,
    isLowProker: rate < 60,
  };
}

describe("QC Progres Program Kerja KKN", () => {
  it("harus menghitung 2/3 proker selesai sebagai 67% (bukan 117%)", () => {
    const prokers = [
      { id: "1", statusPelaksanaan: "SELESAI", status: "DISETUJUI" },
      { id: "2", statusPelaksanaan: "SELESAI", status: "DISETUJUI" },
      { id: "3", statusPelaksanaan: "SEDANG_BERJALAN", status: "DISETUJUI" },
    ];
    const metrics = calculateProkerMetrics(prokers);
    expect(metrics.total).toBe(3);
    expect(metrics.completed).toBe(2);
    expect(metrics.ongoing).toBe(1);
    expect(metrics.notStarted).toBe(0);
    expect(metrics.rate).toBe(67);
    expect(metrics.ratioLabel).toBe("2/3");
    expect(metrics.tooltip).toBe("2 Selesai, 1 Sedang Berjalan, dari total 3 Proker");
  });

  it("tidak boleh double-counting jika record memiliki desync status legacy SEDANG_BERJALAN vs statusPelaksanaan SELESAI", () => {
    // Skenario data riil VPS yang memicu anomali 117% di versi sebelumnya
    const desyncProkers = [
      { id: "1", statusPelaksanaan: "SELESAI", status: "SEDANG_BERJALAN" },
      { id: "2", statusPelaksanaan: "SELESAI", status: "SEDANG_BERJALAN" },
      { id: "3", statusPelaksanaan: "SEDANG_BERJALAN", status: "SEDANG_BERJALAN" },
    ];
    const metrics = calculateProkerMetrics(desyncProkers);
    expect(metrics.total).toBe(3);
    expect(metrics.completed).toBe(2);
    expect(metrics.ongoing).toBe(1); // Bukan 3!
    expect(metrics.rate).toBe(67); // Bukan 117%!
    expect(metrics.rate).toBeLessThanOrEqual(100);
  });

  it("harus aman menangani kelompok tanpa proker", () => {
    const metricsEmpty = calculateProkerMetrics([]);
    expect(metricsEmpty.total).toBe(0);
    expect(metricsEmpty.rate).toBe(0);
    expect(metricsEmpty.ratioLabel).toBe("0/0");

    const metricsNull = calculateProkerMetrics(null);
    expect(metricsNull.total).toBe(0);
    expect(metricsNull.rate).toBe(0);
  });

  it("harus menangani proker selesai 100%", () => {
    const allDone = [
      { statusPelaksanaan: "SELESAI" },
      { statusPelaksanaan: "SELESAI" },
    ];
    const metrics = calculateProkerMetrics(allDone);
    expect(metrics.total).toBe(2);
    expect(metrics.completed).toBe(2);
    expect(metrics.rate).toBe(100);
    expect(metrics.ratioLabel).toBe("2/2");
    expect(metrics.isLowProker).toBe(false);
  });
});
