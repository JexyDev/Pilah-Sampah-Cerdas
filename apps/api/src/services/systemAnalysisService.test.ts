import { describe, it, expect, vi, beforeEach } from "vitest";
import { systemAnalysisService } from "./systemAnalysisService.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    logbookKkn: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    kelompokKkn: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    schedule: {
      count: vi.fn(),
    },
    activityAttendance: {
      findMany: vi.fn(),
    },
    studentLeaveRequest: {
      findMany: vi.fn(),
    },
    studentKkn: {
      count: vi.fn(),
    },
    programKerjaKkn: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    penilaianKknMahasiswa: {
      findMany: vi.fn(),
    },
    user: {
      count: vi.fn(),
    },
    setoranManual: {
      findMany: vi.fn(),
    },
    setoranOtomatis: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    facility: {
      findMany: vi.fn(),
    },
    bin: {
      findMany: vi.fn(),
    },
    binResetRequest: {
      findMany: vi.fn(),
    },
    facilityProductionLog: {
      findMany: vi.fn(),
    },
    bankSampahLedger: {
      findMany: vi.fn(),
    },
    $queryRawUnsafe: vi.fn(),
  },
}));

describe("systemAnalysisService - Comprehensive QC and Formula Audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getKknAnalysis (5 Pilar Operasional)", () => {
    it("should calculate university-wide metrics accurately without scale anomalies", async () => {
      vi.mocked(prisma.logbookKkn.count)
        .mockResolvedValueOnce(150)
        .mockResolvedValueOnce(120);

      vi.mocked(prisma.logbookKkn.groupBy).mockResolvedValueOnce([
        { kelompokId: "kel-1", _count: { id: 90 } },
        { kelompokId: "kel-2", _count: { id: 60 } },
      ] as any);

      vi.mocked(prisma.kelompokKkn.findMany).mockResolvedValueOnce([
        {
          id: "kel-1",
          name: "Kelompok 1 Sadang Serang",
          kelurahan: "Sadang Serang",
          poskoKkn: { latitude: -6.89, longitude: 107.61, alamat: "Posko 1" },
          students: [{ id: "mhs-1" }, { id: "mhs-2" }, { id: "mhs-3" }],
          programKerja: [
            { id: "pk-1", status: "DISETUJUI", statusPelaksanaan: "SELESAI" },
            { id: "pk-2", status: "DISETUJUI", statusPelaksanaan: "SEDANG_BERJALAN" },
          ],
          _count: { schedules: 4 },
        },
        {
          id: "kel-2",
          name: "Kelompok 2 Dago",
          kelurahan: "Dago",
          poskoKkn: { latitude: -6.88, longitude: 107.62, alamat: "Posko 2" },
          students: [{ id: "mhs-4" }, { id: "mhs-5" }],
          programKerja: [
            { id: "pk-3", status: "DISETUJUI", statusPelaksanaan: "SELESAI" },
          ],
          _count: { schedules: 3 },
        },
      ] as any);

      vi.mocked(prisma.schedule.count)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.activityAttendance.findMany).mockResolvedValueOnce([
        { id: "att-1", status: "DALAM_RADIUS", attendedAt: new Date() },
        { id: "att-2", status: "DALAM_RADIUS", attendedAt: new Date() },
        { id: "att-3", status: "DI_LUAR_RADIUS", attendedAt: new Date() },
      ] as any);

      vi.mocked(prisma.studentLeaveRequest.findMany).mockResolvedValueOnce([
        { type: "IZIN", reason: "Urusan keluarga" },
        { type: "SAKIT", reason: "Demam berdarah" },
      ] as any);

      vi.mocked(prisma.studentKkn.count).mockResolvedValueOnce(5);

      vi.mocked(prisma.programKerjaKkn.count)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(6)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);

      vi.mocked(prisma.penilaianKknMahasiswa.findMany).mockResolvedValueOnce([
        { kategoriNilai: "A", nilaiAkhir: "88.50" },
        { kategoriNilai: "B", nilaiAkhir: "78.00" },
        { kategoriNilai: "C", nilaiAkhir: "62.00" },
        { kategoriNilai: "D", nilaiAkhir: "45.00" },
      ] as any);

      const result = await systemAnalysisService.getKknAnalysis();

      expect(result.pilar1.totalLogbook).toBe(150);
      expect(result.pilar1.approvedLogbook).toBe(120);
      expect(result.pilar1.verificationRate).toBe(80);
      expect(result.pilar1.topKelompokLogbook[0].kelompokId).toBe("kel-1");
      expect(result.pilar1.topKelompokLogbook[0].totalLogbook).toBe(90);

      expect(result.pilar2.hadirCount).toBe(3);
      expect(result.pilar2.inZoneCount).toBe(2);
      expect(result.pilar2.outZoneCount).toBe(1);
      expect(result.pilar2.geofenceComplianceRate).toBe(67);
      expect(result.pilar2.onTimeAttendanceRate).toBe(17);
      expect(result.pilar2.izinCount).toBe(1);
      expect(result.pilar2.sakitCount).toBe(1);

      expect(result.pilar3.totalProker).toBe(10);
      expect(result.pilar3.prokerCompletionRate).toBe(60);
      expect(result.pilar3.breakdown.selesai).toBe(6);
      expect(result.pilar3.breakdown.proses).toBe(3);
      expect(result.pilar3.breakdown.belum).toBe(1);

      expect(result.pilar4.totalStudents).toBe(5);
      expect(result.pilar4.evaluatedStudents).toBe(4);
      expect(result.pilar4.dplEvaluationRate).toBe(80);
      expect(result.pilar4.gradeDistribution).toEqual([
        { grade: "A", count: 1 },
        { grade: "B", count: 1 },
        { grade: "C", count: 1 },
        { grade: "D", count: 1 },
      ]);

      expect(result.pilar5.top5Kelompok).toHaveLength(2);
    });

    it("should accurately scope metrics when kelompokId filter is provided", async () => {
      const kelompokId = "kel-1";

      vi.mocked(prisma.logbookKkn.count)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(18);

      vi.mocked(prisma.logbookKkn.groupBy).mockResolvedValueOnce([
        { kelompokId: "kel-1", _count: { id: 20 } },
      ] as any);

      vi.mocked(prisma.kelompokKkn.findMany).mockResolvedValueOnce([
        {
          id: "kel-1",
          name: "Kelompok 1 Sadang Serang",
          kelurahan: "Sadang Serang",
          poskoKkn: { latitude: -6.89, longitude: 107.61, alamat: "Posko 1" },
          students: [{ id: "mhs-1" }, { id: "mhs-2" }],
          programKerja: [{ id: "pk-1", status: "DISETUJUI", statusPelaksanaan: "SELESAI" }],
          _count: { schedules: 5 },
        },
      ] as any);

      vi.mocked(prisma.schedule.count)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.activityAttendance.findMany).mockResolvedValueOnce([
        { id: "att-1", status: "DALAM_RADIUS", attendedAt: new Date() },
        { id: "att-2", status: "DALAM_RADIUS", attendedAt: new Date() },
      ] as any);

      vi.mocked(prisma.studentLeaveRequest.findMany).mockResolvedValueOnce([]);
      vi.mocked(prisma.studentKkn.count).mockResolvedValueOnce(2);

      vi.mocked(prisma.programKerjaKkn.count)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      vi.mocked(prisma.penilaianKknMahasiswa.findMany).mockResolvedValueOnce([
        { kategoriNilai: "A", nilaiAkhir: "92.00" },
        { kategoriNilai: "A", nilaiAkhir: "86.00" },
      ] as any);

      const result = await systemAnalysisService.getKknAnalysis(kelompokId);

      expect(result.pilar1.totalLogbook).toBe(20);
      expect(result.pilar1.verificationRate).toBe(90);
      expect(result.pilar2.onTimeAttendanceRate).toBe(20);
      expect(result.pilar4.evaluatedStudents).toBe(2);
      expect(result.pilar4.dplEvaluationRate).toBe(100);
      expect(result.pilar4.gradeDistribution.find((g) => g.grade === "A")?.count).toBe(2);
    });
  });

  describe("getWasteGovernanceAnalysis (4 Pilar Strategis)", () => {
    it("should compute waste metrics, conversion, and carbon reduction accurately", async () => {
      vi.mocked(prisma.user.count).mockResolvedValueOnce(100);
      vi.mocked(prisma.setoranManual.findMany).mockResolvedValueOnce([
        { diinputOleh: "user-warga-1" },
        { diinputOleh: "user-warga-2" },
      ] as any);
      vi.mocked(prisma.setoranOtomatis.findMany)
        .mockResolvedValueOnce([{ wargaId: "user-warga-3" }] as any)
        .mockResolvedValueOnce([
          { confidenceAi: 0.9, hasilKlasifikasiAi: "Organik" },
          { confidenceAi: 0.8, hasilKlasifikasiAi: "Anorganik" },
        ] as any);
      vi.mocked(prisma.setoranOtomatis.count).mockResolvedValueOnce(2);

      vi.mocked(prisma.facility.findMany).mockResolvedValueOnce([
        { id: "fac-1", nama: "TPS3R Coblong", jenis: "TPS3R", rw: { name: "RW 01" } },
      ] as any);

      vi.mocked(prisma.bin.findMany).mockResolvedValueOnce([
        { id: "bin-1", currentVolumeLiter: 22, maxCapacityLiter: 25, status: "ACTIVE" },
        { id: "bin-2", currentVolumeLiter: 24, maxCapacityLiter: 25, status: "FULL" },
        { id: "bin-3", currentVolumeLiter: 5, maxCapacityLiter: 25, status: "ACTIVE" },
      ] as any);

      vi.mocked(prisma.binResetRequest.findMany).mockResolvedValueOnce([
        {
          status: "RESOLVED",
          createdAt: new Date("2026-09-15T08:00:00Z"),
          updatedAt: new Date("2026-09-15T08:20:00Z"),
        },
      ] as any);

      vi.mocked(prisma.facilityProductionLog.findMany).mockResolvedValueOnce([
        { materialMasukKg: 50, outputKg: 40, createdAt: new Date() },
      ] as any);

      vi.mocked(prisma.setoranManual.findMany).mockResolvedValueOnce([
        { berat: 30, kategori: "Organik" },
      ] as any);

      vi.mocked(prisma.setoranOtomatis.findMany).mockResolvedValueOnce([
        { berat: 20, hasilKlasifikasiAi: "Anorganik", kategoriAktual: "Anorganik" },
      ] as any);

      vi.mocked(prisma.bankSampahLedger.findMany).mockResolvedValueOnce([
        { saldoRupiah: 5000000 },
      ] as any);

      const result = await systemAnalysisService.getWasteGovernanceAnalysis();

      expect(result.pilar1.totalWarga).toBe(100);
      expect(result.pilar1.activeResidentCount).toBe(3);
      expect(result.pilar1.activeResidentRatio).toBe(3);
      expect(result.pilar1.sortingComplianceIndex).toBe(100);

      expect(result.pilar2.totalFasilitas).toBe(1);
      expect(result.pilar2.kritisitasTempatSampah.total).toBe(3);
      expect(result.pilar2.kritisitasTempatSampah.kritis).toBe(1);
      expect(result.pilar2.kritisitasTempatSampah.waspada).toBe(1);
      expect(result.pilar2.kritisitasTempatSampah.normal).toBe(1);
      expect(result.pilar2.avgPickupLatencyMinutes).toBe(20);

      expect(result.pilar3.totalSampahMasukKg).toBe(50);
      expect(result.pilar3.organikKg).toBe(30);
      expect(result.pilar3.anorganikKg).toBe(20);
      expect(result.pilar4.reduksiEmisiCo2Kg).toBe(46.4);
      expect(result.pilar4.totalNilaiEkonomiRupiah).toBe(5000000);
    });
  });
});
