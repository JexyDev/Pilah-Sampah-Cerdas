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
      approved: 0,
      completed: 0,
      ongoing: 0,
      notStarted: 0,
      active: 0,
      rate: 0,
      ratioLabel: "0/0",
      tooltip: "Belum ada program kerja",
      isLowProker: false,
    };
  }

  // 1. Filter proker non-ditolak
  const nonRejected = prokers.filter((p: any) => {
    const u = String(p?.statusUsulan || "").toUpperCase().trim();
    const s = String(p?.status || "").toUpperCase().trim();
    return u !== "DITOLAK" && s !== "DITOLAK";
  });

  // 2. Filter proker yang disetujui (DISETUJUI / DITERIMA / sedang aktif berjalan)
  const approvedList = nonRejected.filter((p: any) => {
    const u = String(p?.statusUsulan || "").toUpperCase().trim();
    const s = String(p?.status || "").toUpperCase().trim();
    const pl = String(p?.statusPelaksanaan || "").toUpperCase().trim();
    return (
      u === "DISETUJUI" ||
      s === "DISETUJUI" ||
      s === "DITERIMA" ||
      pl === "SEDANG_BERJALAN" ||
      pl === "SELESAI"
    );
  });

  const targetList = approvedList.length > 0 ? approvedList : nonRejected;
  const approved = targetList.length;

  if (approved === 0) {
    return {
      total,
      approved: 0,
      completed: 0,
      ongoing: 0,
      notStarted: 0,
      active: 0,
      rate: 0,
      ratioLabel: "0/0",
      tooltip: "Belum ada program kerja disetujui",
      isLowProker: false,
    };
  }

  let completed = 0;
  let ongoing = 0;
  let notStarted = 0;

  for (const p of targetList) {
    const status = normalizeProkerExecutionStatus(p?.statusPelaksanaan, p?.status);
    if (status === "SELESAI") completed++;
    else if (status === "SEDANG_BERJALAN") ongoing++;
    else notStarted++;
  }

  const active = completed + ongoing;
  const rawRate = (active / approved) * 100;
  const rate = Math.min(100, Math.max(0, Math.round(rawRate)));

  return {
    total,
    approved,
    completed,
    ongoing,
    notStarted,
    active,
    rate,
    ratioLabel: `${active}/${approved}`,
    tooltip: `${active} dari ${approved} Proker Disetujui (${ongoing} Sedang Berjalan, ${completed} Selesai)`,
    isLowProker: rate < 60,
  };
}

describe("QC Progres Program Kerja KKN", () => {
  it("harus menghitung 1 proker sedang berjalan dari 5 disetujui sebagai 20% (1/5) sesuai arahan CEO", () => {
    // Skenario kasus riil CEO: 1 sedang berjalan dari 5 total disetujui -> 20% (1/5)
    const prokers = [
      { id: "1", statusPelaksanaan: "SEDANG_BERJALAN", status: "DISETUJUI" },
      { id: "2", statusPelaksanaan: "BELUM_MULAI", status: "DISETUJUI" },
      { id: "3", statusPelaksanaan: "BELUM_MULAI", status: "DISETUJUI" },
      { id: "4", statusPelaksanaan: "BELUM_MULAI", status: "DISETUJUI" },
      { id: "5", statusPelaksanaan: "BELUM_MULAI", status: "DISETUJUI" },
    ];
    const metrics = calculateProkerMetrics(prokers);
    expect(metrics.total).toBe(5);
    expect(metrics.approved).toBe(5);
    expect(metrics.completed).toBe(0);
    expect(metrics.ongoing).toBe(1);
    expect(metrics.active).toBe(1);
    expect(metrics.rate).toBe(20);
    expect(metrics.ratioLabel).toBe("1/5");
    expect(metrics.tooltip).toBe("1 dari 5 Proker Disetujui (1 Sedang Berjalan, 0 Selesai)");
    expect(metrics.isLowProker).toBe(true);
  });

  it("harus menghitung 2/3 proker selesai sebagai 67% saat 1 belum mulai", () => {
    const prokers = [
      { id: "1", statusPelaksanaan: "SELESAI", status: "DISETUJUI" },
      { id: "2", statusPelaksanaan: "SELESAI", status: "DISETUJUI" },
      { id: "3", statusPelaksanaan: "BELUM_MULAI", status: "DISETUJUI" },
    ];
    const metrics = calculateProkerMetrics(prokers);
    expect(metrics.total).toBe(3);
    expect(metrics.completed).toBe(2);
    expect(metrics.ongoing).toBe(0);
    expect(metrics.active).toBe(2);
    expect(metrics.rate).toBe(67);
    expect(metrics.ratioLabel).toBe("2/3");
    expect(metrics.tooltip).toBe("2 dari 3 Proker Disetujui (0 Sedang Berjalan, 2 Selesai)");
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
    expect(metrics.active).toBe(3);
    expect(metrics.rate).toBe(100); // 3 aktif dari 3 approved = 100%, bukan 117%!
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
