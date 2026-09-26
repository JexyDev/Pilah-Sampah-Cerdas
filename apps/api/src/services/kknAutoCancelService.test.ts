import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock redisService to prevent connection timeouts in tests
vi.mock("./redisService.js", () => {
  return {
    redisClient: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue("OK"),
      del: vi.fn().mockResolvedValue(1),
    },
  };
});

const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockFindUniqueKelompok = vi.fn();
const mockCountLogbook = vi.fn().mockResolvedValue(0);

vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      programKerjaKkn: {
        findMany: (...args: any[]) => mockFindMany(...args),
        update: (...args: any[]) => mockUpdate(...args),
      },
      logbookKkn: {
        count: (...args: any[]) => mockCountLogbook(...args),
      },
      kelompokKkn: {
        findUnique: (...args: any[]) => mockFindUniqueKelompok(...args),
      },
      pointHistory: {
        findFirst: vi.fn().mockResolvedValue(null),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    },
  };
});

// Mock notificationIntegrationService
vi.mock("./notificationIntegrationService.js", () => {
  return {
    notificationIntegrationService: {
      sendToUsers: vi.fn().mockResolvedValue(true),
    },
  };
});

import { kknService } from "./kknService.js";

describe("kknService.autoCancelExpiredProker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not cancel proker if endDate is in the future or today", async () => {
    // Current year is 2026. If proker is for 2099-09-25, it should not be expired
    mockFindMany.mockResolvedValueOnce([
      {
        id: "proker-standby-1",
        kelompokId: "kel-1",
        deskripsi: "**Program Kerja Masa Depan**\n\nDeskripsi kegiatan",
        waktuPelaksanaan: "2099-09-20 s/d 2099-09-25",
        statusPelaksanaan: "BELUM_MULAI",
        statusUsulan: "DISETUJUI",
      },
    ]);

    const count = await kknService.autoCancelExpiredProker();

    expect(count).toBe(0);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should auto-cancel proker if current date has passed endDate", async () => {
    // Past date (e.g. 2020-01-01)
    mockFindMany.mockResolvedValueOnce([
      {
        id: "proker-expired-1",
        kelompokId: "kel-1",
        deskripsi: "**Pelatihan Kompos Organik**\n\nKegiatan komposting warga",
        waktuPelaksanaan: "2020-01-10 s/d 2020-01-15",
        statusPelaksanaan: "BELUM_MULAI",
        statusUsulan: "DISETUJUI",
      },
    ]);
    mockUpdate.mockResolvedValueOnce({ id: "proker-expired-1" });
    mockFindUniqueKelompok.mockResolvedValueOnce({
      id: "kel-1",
      students: [{ userId: "u-1" }, { userId: "u-2" }],
    });

    const count = await kknService.autoCancelExpiredProker();

    expect(count).toBe(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "proker-expired-1" },
      data: {
        statusUsulan: "KADALUARSA_OTOMATIS",
        status: "DITOLAK",
        catatanDpl: expect.stringContaining("2020-01-15"),
      },
    });
  });

  it("should not auto-cancel proker with unparseable or conditional date", async () => {
    mockFindMany.mockResolvedValueOnce([
      {
        id: "proker-cond-1",
        kelompokId: "kel-1",
        deskripsi: "**Program Kerja Fleksibel**",
        waktuPelaksanaan: "Menyesuaikan kebutuhan warga",
        statusPelaksanaan: "BELUM_MULAI",
        statusUsulan: "DISETUJUI",
      },
    ]);

    const count = await kknService.autoCancelExpiredProker();

    expect(count).toBe(0);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should mark proker as SELESAI instead of cancelling if logbooks are already linked", async () => {
    mockFindMany.mockResolvedValueOnce([
      {
        id: "proker-with-logbook-1",
        kelompokId: "kel-1",
        deskripsi: "**Sosialisasi Lapangan**",
        waktuPelaksanaan: "2020-01-10 s/d 2020-01-15",
        statusPelaksanaan: "BELUM_MULAI",
        statusUsulan: "DISETUJUI",
      },
    ]);
    mockCountLogbook.mockResolvedValueOnce(3); // 3 logbooks uploaded
    mockUpdate.mockResolvedValueOnce({ id: "proker-with-logbook-1" });

    const count = await kknService.autoCancelExpiredProker();

    expect(count).toBe(0); // Not counted in cancelled list
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "proker-with-logbook-1" },
      data: {
        statusUsulan: "DISETUJUI",
        statusPelaksanaan: "SELESAI",
        status: "SELESAI",
        catatanDpl: null,
      },
    });
  });
});
