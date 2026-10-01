import { describe, it, expect, vi, beforeEach } from "vitest";
import { kknController } from "./kknController.js";
import { kknService } from "../services/kknService.js";
import { notificationIntegrationService } from "../services/notificationIntegrationService.js";

vi.mock("../services/kknService.js", () => {
  return {
    kknService: {
      createProgramKerja: vi.fn(),
    },
  };
});

vi.mock("../services/notificationIntegrationService.js", () => {
  return {
    notificationIntegrationService: {
      sendToUser: vi.fn(),
    },
  };
});

describe("KknController - Laporan Akhir vs Proker Notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send Laporan Akhir specific notification when kategori is LAPORAN_AKHIR", async () => {
    (kknService.createProgramKerja as any).mockResolvedValue({
      id: "proker-1",
      judul: "[Acef Testing] Laporan Akhir KKN Desa Bojong",
      kategori: "LAPORAN_AKHIR",
    });

    const req = {
      user: { userId: "mhs-123" },
      body: {
        judul: "Laporan Akhir KKN Desa Bojong",
        kategori: "LAPORAN_AKHIR",
      },
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    await kknController.createProgramKerja(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(notificationIntegrationService.sendToUser).toHaveBeenCalledWith({
      userId: "mhs-123",
      title: "Pengajuan Laporan Akhir ✅",
      message: 'Laporan Akhir "Laporan Akhir KKN Desa Bojong" berhasil diajukan dan sedang direview oleh DPL.',
      triggerType: "PROKER_LAPORAN_AKHIR",
      dataPayload: {
        type: "LAPORAN_AKHIR",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    });
  });

  it("should send standard Program Kerja notification when kategori is not LAPORAN_AKHIR", async () => {
    (kknService.createProgramKerja as any).mockResolvedValue({
      id: "proker-2",
      judul: "Sosialisasi Pemilahan Sampah",
      kategori: "SOSIALISASI",
    });

    const req = {
      user: { userId: "mhs-123" },
      body: {
        judul: "Sosialisasi Pemilahan Sampah",
        kategori: "SOSIALISASI",
      },
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;

    await kknController.createProgramKerja(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(notificationIntegrationService.sendToUser).toHaveBeenCalledWith({
      userId: "mhs-123",
      title: "Pengajuan Program Kerja ✅",
      message: 'Program "Sosialisasi Pemilahan Sampah" berhasil diajukan dan sedang direview oleh DPL.',
      triggerType: "PROKER_PENGAJUAN",
      dataPayload: {
        type: "PROKER",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    });
  });
});
