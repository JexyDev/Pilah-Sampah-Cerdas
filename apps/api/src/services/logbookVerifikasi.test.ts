import { describe, it, expect, vi, beforeEach } from "vitest";
import { StatusLogbookKkn } from "@prisma/client";

// Mock dependencies before importing service
vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      logbookKkn: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      pointHistory: {
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        create: vi.fn(),
      },
      studentKkn: {
        findUnique: vi.fn(),
      },
      systemConfig: {
        findUnique: vi.fn(),
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

import { prisma } from "../lib/prisma.js";
import { LogbookService } from "./logbookService.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";

describe("LogbookService - Verifikasi DPL (Separasi Revisi vs Tolak)", () => {
  let service: LogbookService;

  const mockLogbook = {
    id: "logbook-1",
    penulisId: "mhs-1",
    kelompokId: "kel-1",
    tanggalKegiatan: new Date("2026-08-15T08:00:00.000Z"),
    deskripsi: "Penyuluhan pilah sampah di RW 02",
    pekanKe: 2,
    statusApproval: StatusLogbookKkn.MENUNGGU_VERIFIKASI_DPL,
    kelompok: {
      id: "kel-1",
      dplId: "dpl-1",
    },
    penulis: {
      id: "mhs-1",
      nama: "Mahasiswa Zahira",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LogbookService();
  });

  describe("verifikasiByDpl - Action REVISI", () => {
    it("harus mengubah status menjadi PERLU_REVISI_DPL tanpa menarik poin (poin tetap utuh)", async () => {
      vi.mocked(prisma.logbookKkn.findUnique).mockResolvedValue(mockLogbook as any);
      vi.mocked(prisma.logbookKkn.update).mockResolvedValue({
        ...mockLogbook,
        statusApproval: StatusLogbookKkn.PERLU_REVISI_DPL,
        catatanDpl: "Perbaiki foto kegiatan",
      } as any);

      const result = await service.verifikasiByDpl(
        "logbook-1",
        "dpl-1",
        "DPL",
        "REVISI",
        "Perbaiki foto kegiatan"
      );

      // Status logbook diperbarui ke PERLU_REVISI_DPL
      expect(prisma.logbookKkn.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "logbook-1" },
          data: expect.objectContaining({
            statusApproval: StatusLogbookKkn.PERLU_REVISI_DPL,
            catatanDpl: "Perbaiki foto kegiatan",
          }),
        })
      );

      // Poin TIDAK ditarik ke 0 (pointHistory.updateMany tidak boleh dipanggil)
      expect(prisma.pointHistory.updateMany).not.toHaveBeenCalled();

      // Notifikasi dikirim dengan triggerType LOGBOOK_REVISI dan instruksi Revisi Sekarang
      expect(notificationIntegrationService.sendToUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "mhs-1",
          triggerType: "LOGBOOK_REVISI",
          dataPayload: expect.objectContaining({
            type: "KEGIATAN_REVISI",
            status: StatusLogbookKkn.PERLU_REVISI_DPL,
          }),
        })
      );

      expect(result.statusApproval).toBe(StatusLogbookKkn.PERLU_REVISI_DPL);
    });
  });

  describe("verifikasiByDpl - Action TOLAK", () => {
    it("harus menolak jika catatanDpl kosong saat menolak logbook", async () => {
      vi.mocked(prisma.logbookKkn.findUnique).mockResolvedValue(mockLogbook as any);

      await expect(
        service.verifikasiByDpl("logbook-1", "dpl-1", "DPL", "TOLAK", "")
      ).rejects.toThrow("Catatan penolakan wajib diisi saat menolak logbook.");
    });

    it("harus mengubah status menjadi DITOLAK_DPL dan menarik poin menjadi 0", async () => {
      vi.mocked(prisma.logbookKkn.findUnique).mockResolvedValue(mockLogbook as any);
      vi.mocked(prisma.logbookKkn.update).mockResolvedValue({
        ...mockLogbook,
        statusApproval: StatusLogbookKkn.DITOLAK_DPL,
        catatanDpl: "Kegiatan tidak sesuai dengan program kerja",
      } as any);

      const result = await service.verifikasiByDpl(
        "logbook-1",
        "dpl-1",
        "DPL",
        "TOLAK",
        "Kegiatan tidak sesuai dengan program kerja"
      );

      // Status diperbarui ke DITOLAK_DPL
      expect(prisma.logbookKkn.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "logbook-1" },
          data: expect.objectContaining({
            statusApproval: StatusLogbookKkn.DITOLAK_DPL,
            catatanDpl: "Kegiatan tidak sesuai dengan program kerja",
          }),
        })
      );

      // Poin ditarik menjadi 0
      expect(prisma.pointHistory.updateMany).toHaveBeenCalledWith({
        where: {
          userId: "mhs-1",
          kategori: "KKN_LOGBOOK_HARIAN",
          description: { contains: "2026-08-15" },
          points: { gt: 0 },
        },
        data: {
          points: 0,
        },
      });

      // Notifikasi dikirim dengan triggerType LOGBOOK_REJECTED
      expect(notificationIntegrationService.sendToUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "mhs-1",
          triggerType: "LOGBOOK_REJECTED",
          dataPayload: expect.objectContaining({
            type: "KEGIATAN_DITOLAK",
            status: StatusLogbookKkn.DITOLAK_DPL,
          }),
        })
      );

      expect(result.statusApproval).toBe(StatusLogbookKkn.DITOLAK_DPL);
    });
  });

  describe("verifikasiByDpl - Action APPROVE (Self-healing recovery)", () => {
    it("harus memulihkan poin yang bernilai 0 kembali menjadi 3 saat di-approve", async () => {
      vi.mocked(prisma.logbookKkn.findUnique).mockResolvedValue(mockLogbook as any);
      vi.mocked(prisma.logbookKkn.update).mockResolvedValue({
        ...mockLogbook,
        statusApproval: StatusLogbookKkn.DISETUJUI_DPL,
      } as any);

      // Kasus poin sebelumnya 0
      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue({
        id: "pt-old",
        userId: "mhs-1",
        points: 0,
        description: "Poin logbook 2026-08-15",
      } as any);

      const result = await service.verifikasiByDpl("logbook-1", "dpl-1", "DPL", "APPROVE");

      expect(prisma.pointHistory.update).toHaveBeenCalledWith({
        where: { id: "pt-old" },
        data: { points: 3 },
      });

      expect(result.statusApproval).toBe(StatusLogbookKkn.DISETUJUI_DPL);
    });

    it("tidak boleh menambah row poin baru jika poin sudah 3 PTS (mencegah duplikasi)", async () => {
      vi.mocked(prisma.logbookKkn.findUnique).mockResolvedValue(mockLogbook as any);
      vi.mocked(prisma.logbookKkn.update).mockResolvedValue({
        ...mockLogbook,
        statusApproval: StatusLogbookKkn.DISETUJUI_DPL,
      } as any);

      // Kasus poin sudah 3 PTS
      vi.mocked(prisma.pointHistory.findFirst).mockResolvedValue({
        id: "pt-valid",
        userId: "mhs-1",
        points: 3,
        description: "Poin logbook 2026-08-15",
      } as any);

      await service.verifikasiByDpl("logbook-1", "dpl-1", "DPL", "APPROVE");

      expect(prisma.pointHistory.update).not.toHaveBeenCalled();
      expect(prisma.pointHistory.create).not.toHaveBeenCalled();
    });
  });

  describe("updateMahasiswaLogbook - Guard Mutlak DITOLAK_DPL", () => {
    it("harus melempar error jika mahasiswa mencoba mengedit logbook berstatus DITOLAK_DPL", async () => {
      const rejectedLogbook = {
        ...mockLogbook,
        statusApproval: StatusLogbookKkn.DITOLAK_DPL,
      };
      vi.mocked(prisma.logbookKkn.findUnique).mockResolvedValue(rejectedLogbook as any);

      await expect(
        service.updateMahasiswaLogbook("logbook-1", "mhs-1", "MAHASISWA", {
          deskripsi: "Mencoba mengedit logbook ditolak",
        })
      ).rejects.toThrow("Logbook yang telah ditolak mutlak oleh DPL tidak dapat diubah kembali.");
    });
  });
});
