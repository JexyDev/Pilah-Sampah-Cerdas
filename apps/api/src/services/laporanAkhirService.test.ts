/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Unit Test: Laporan Akhir KKN Sub-Modul Mandiri (Per-Individu)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { laporanAkhirService } from "./laporanAkhirService.js";
import { prisma } from "../lib/prisma.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    studentKkn: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    programKerjaKkn: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    kelompokKkn: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("./notificationIntegrationService.js", () => ({
  notificationIntegrationService: {
    sendToUser: vi.fn().mockResolvedValue({ success: true }),
    sendToUsers: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe("LaporanAkhirService - Modul Mandiri Per-Individu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitLaporanAkhirIndividu", () => {
    it("harus menolak jika mahasiswa belum terdaftar dalam kelompok KKN", async () => {
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue(null);

      await expect(
        laporanAkhirService.submitLaporanAkhirIndividu("user-tanpa-kelompok", {
          judul: "Laporan KKN",
        })
      ).rejects.toThrow("Mahasiswa belum terdaftar dalam kelompok KKN.");
    });

    it("harus berhasil create laporan akhir baru dengan studentId dan trigger notifikasi DPL", async () => {
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        id: "student-1",
        userId: "user-1",
        kelompokId: "kelompok-10",
        nim: "10119001",
        user: { name: "Budi Mahasiswa" },
        kelompok: {
          id: "kelompok-10",
          name: "Kelompok 10 Coblong",
          dplId: "dpl-user-99",
        },
      } as any);

      vi.mocked(prisma.programKerjaKkn.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.programKerjaKkn.create).mockResolvedValue({
        id: "proker-laporan-1",
        kelompokId: "kelompok-10",
        studentId: "student-1",
        kategori: "LAPORAN_AKHIR",
        deskripsi: "**Laporan Akhir KKN Budi**\n\nAbstrak laporan",
        attachmentFile: "/uploads/laporan.pdf",
        statusUsulan: "MENUNGGU_TELAAH",
      } as any);

      const result = await laporanAkhirService.submitLaporanAkhirIndividu(
        "user-1",
        {
          judul: "Laporan Akhir KKN Budi",
          deskripsi: "Abstrak laporan",
        },
        { filename: "laporan.pdf" } as any
      );

      expect(result.id).toBe("proker-laporan-1");
      expect(prisma.programKerjaKkn.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          kelompokId: "kelompok-10",
          studentId: "student-1",
          kategori: "LAPORAN_AKHIR",
          attachmentFile: "/uploads/laporan.pdf",
          statusUsulan: "MENUNGGU_TELAAH",
        }),
      });

      expect(notificationIntegrationService.sendToUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "dpl-user-99",
          triggerType: "LAPORAN_AKHIR_SUBMITTED",
          dataPayload: expect.objectContaining({
            studentId: "student-1",
            kelompokId: "kelompok-10",
          }),
        })
      );
    });
  });

  describe("getLaporanAkhirMe", () => {
    it("harus mengembalikan data null jika mahasiswa belum mengunggah laporan", async () => {
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        id: "student-1",
        userId: "user-1",
        kelompokId: "kelompok-10",
        kelompok: { name: "Kelompok 10" },
      } as any);

      vi.mocked(prisma.programKerjaKkn.findFirst).mockResolvedValue(null);

      const res = await laporanAkhirService.getLaporanAkhirMe("user-1");

      expect(res.hasSubmitted).toBe(false);
      expect(res.data).toBeNull();
    });

    it("harus mengembalikan laporan spesifik milik studentId login (isolasi individu)", async () => {
      vi.mocked(prisma.studentKkn.findUnique).mockResolvedValue({
        id: "student-2",
        userId: "user-2",
        nim: "10119002",
        user: { name: "Siti Mahasiswa" },
        kelompokId: "kelompok-10",
        kelompok: {
          name: "Kelompok 10",
          dpl: { id: "dpl-1", name: "Dr. Dosen", phone: "0812345" },
        },
      } as any);

      vi.mocked(prisma.programKerjaKkn.findFirst).mockResolvedValue({
        id: "laporan-siti",
        studentId: "student-2",
        kategori: "LAPORAN_AKHIR",
        deskripsi: "**Laporan Akhir KKN - Siti**\n\nIsi abstrak laporan",
        attachmentFile: "/uploads/laporan-siti.pdf",
        statusUsulan: "DISETUJUI",
        statusPenilaian: "DISETUJUI",
        skorPenilaian: 90,
        predikat: "A (Sangat Baik)",
        createdAt: new Date("2026-10-01T10:00:00Z"),
        updatedAt: new Date("2026-10-02T10:00:00Z"),
      } as any);

      const res = await laporanAkhirService.getLaporanAkhirMe("user-2");

      expect(prisma.programKerjaKkn.findFirst).toHaveBeenCalledWith({
        where: {
          studentId: "student-2",
          kategori: "LAPORAN_AKHIR",
        },
        orderBy: { updatedAt: "desc" },
      });

      expect(res.hasSubmitted).toBe(true);
      expect(res.id).toBe("laporan-siti");
      expect(res.nilaiAkhir).toBe(90);
      expect(res.statusTelaah).toBe("DISETUJUI");
      expect(res.dpl?.name).toBe("Dr. Dosen");
    });
  });

  describe("getLaporanAkhirDplMatrix", () => {
    it("harus menyajikan matriks per-mahasiswa dalam kelompok KKN", async () => {
      vi.mocked(prisma.kelompokKkn.findUnique).mockResolvedValue({
        id: "kelompok-10",
        name: "Kelompok 10 Coblong",
        students: [
          {
            id: "st-1",
            userId: "u-1",
            nim: "10119001",
            isKetua: true,
            user: { name: "Ahmad" },
          },
          {
            id: "st-2",
            userId: "u-2",
            nim: "10119002",
            isKetua: false,
            user: { name: "Siti" },
          },
        ],
      } as any);

      vi.mocked(prisma.programKerjaKkn.findMany).mockResolvedValue([
        {
          id: "lap-ahmad",
          studentId: "st-1",
          kategori: "LAPORAN_AKHIR",
          attachmentFile: "/uploads/laporan-ahmad.pdf",
          deskripsi: "**Laporan Ahmad**\n\nAbstrak",
          statusUsulan: "MENUNGGU_TELAAH",
          statusPenilaian: "BELUM_DINILAI",
          skorPenilaian: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ]);

      const matrix = await laporanAkhirService.getLaporanAkhirDplMatrix("kelompok-10");

      expect(matrix.totalMahasiswa).toBe(2);
      expect(matrix.totalSudahSubmit).toBe(1);
      expect(matrix.totalBelumSubmit).toBe(1);

      const ahmad = matrix.mahasiswa.find((m) => m.studentId === "st-1");
      const siti = matrix.mahasiswa.find((m) => m.studentId === "st-2");

      expect(ahmad?.hasSubmitted).toBe(true);
      expect(ahmad?.fileUrl).toBe("/uploads/laporan-ahmad.pdf");
      expect(ahmad?.statusTelaah).toBe("MENUNGGU_TELAAH");

      expect(siti?.hasSubmitted).toBe(false);
      expect(siti?.fileUrl).toBeNull();
      expect(siti?.statusTelaah).toBe("BELUM_UNGGAH");
    });
  });
});
