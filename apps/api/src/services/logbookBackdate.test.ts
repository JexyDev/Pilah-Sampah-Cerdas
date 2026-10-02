import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing service
vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      logbookKkn: {
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
      },
      systemConfig: {
        findUnique: vi.fn().mockResolvedValue({
          key: "LOGBOOK_TOLERANCE_DAYS",
          value: "1",
        }),
      },
      auditTrail: {
        create: vi.fn(),
      },
    },
  };
});

vi.mock("./notificationIntegrationService.js", () => {
  return {
    notificationIntegrationService: {
      sendToUser: vi.fn().mockResolvedValue(true),
    },
  };
});

vi.mock("./auditTrailService.js", () => {
  return {
    auditTrailService: {
      record: vi.fn().mockResolvedValue(true),
    },
  };
});

import { LogbookService } from "./logbookService.js";

describe("LogbookService - validateBackdate (QC Backdate & Future Date Guards)", () => {
  let service: LogbookService;

  beforeEach(() => {
    service = new LogbookService();
    vi.clearAllMocks();
  });

  it("harus menolak tanggal kegiatan di masa depan meskipun isPastReport bernilai true", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    await expect(
      service.validateBackdate(tomorrow, "MAHASISWA_KKN", true)
    ).rejects.toThrow("Tanggal kegiatan logbook tidak boleh berupa tanggal di masa depan.");
  });

  it("harus menolak tanggal masa lampau jika isPastReport false dan melebihi toleransi", async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    await expect(
      service.validateBackdate(threeDaysAgo, "MAHASISWA_KKN", false)
    ).rejects.toThrow(/Batas toleransi pengisian logbook adalah/);
  });

  it("harus mengizinkan pengisian logbook masa lampau jika isPastReport bernilai true", async () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    await expect(
      service.validateBackdate(fiveDaysAgo, "MAHASISWA_KKN", true)
    ).resolves.toBeUndefined();
  });

  it("harus mengizinkan pengisian logbook hari ini meskipun isPastReport bernilai false", async () => {
    const today = new Date();

    await expect(
      service.validateBackdate(today, "MAHASISWA_KKN", false)
    ).resolves.toBeUndefined();
  });

  it("harus membypass validasi jika role adalah DEVELOPER atau SUPER_USER", async () => {
    const pastDate = new Date("2026-01-01");

    await expect(
      service.validateBackdate(pastDate, "DEVELOPER", false)
    ).resolves.toBeUndefined();

    await expect(
      service.validateBackdate(pastDate, "SUPER_USER", false)
    ).resolves.toBeUndefined();
  });
});
