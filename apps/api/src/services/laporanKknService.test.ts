import { describe, it, expect, vi, beforeEach } from "vitest";
import { laporanKknService } from "./laporanKknService.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    kelompokKkn: {
      findMany: vi.fn(),
    },
    presensiMandiri: {
      aggregate: vi.fn(),
    },
    penilaianKknMahasiswa: {
      findMany: vi.fn(),
    },
    activityAttendance: {
      findMany: vi.fn(),
    },
    studentKkn: {
      findMany: vi.fn(),
    },
  },
}));

describe("laporanKknService - Laporan Resmi KKN Eksekutif", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getGradeFromScore helper", () => {
    it("harus mengonversi skor angka ke huruf mutu UNIKOM dengan tepat", () => {
      expect(laporanKknService.getGradeFromScore(90)).toBe("A");
      expect(laporanKknService.getGradeFromScore(85)).toBe("A");
      expect(laporanKknService.getGradeFromScore(82)).toBe("A-");
      expect(laporanKknService.getGradeFromScore(77)).toBe("B+");
      expect(laporanKknService.getGradeFromScore(72)).toBe("B");
      expect(laporanKknService.getGradeFromScore(67)).toBe("B-");
      expect(laporanKknService.getGradeFromScore(62)).toBe("C+");
      expect(laporanKknService.getGradeFromScore(57)).toBe("C");
      expect(laporanKknService.getGradeFromScore(45)).toBe("D");
      expect(laporanKknService.getGradeFromScore(30)).toBe("E");
    });
  });

  describe("getLaporanSummary", () => {
    it("harus menghasilkan ringkasan eksekutif dan matriks kelompok dengan menyaring data testing", async () => {
      (prisma.kelompokKkn.findMany as any).mockResolvedValue([
        {
          id: "kel-1",
          name: "Kelompok 1 Sadang Serang",
          kelurahan: "Sadang Serang",
          cakupanRw: ["01", "02"],
          dpl: {
            id: "dpl-1",
            name: "Dr. Budi Santoso, M.T.",
            nip: "197501012000031001",
            phone: "081234567891",
            programStudi: "Teknik Informatika",
          },
          poskoKkn: {
            nama: "Posko Sadang Serang RW 01",
            alamat: "Jl. Sadang Serang No. 10",
            latitude: -6.89,
            longitude: 107.62,
          },
          students: [
            {
              id: "mhs-1",
              userId: "user-mhs-1",
              nim: "10121001",
              jurusan: "Teknik Informatika",
              fakultas: "Teknik dan Ilmu Komputer",
              isKetua: true,
              user: { id: "user-mhs-1", name: "Ahmad Rizki", phone: "081299990001", isTestAccount: false },
            },
            {
              id: "mhs-2",
              userId: "user-mhs-2",
              nim: "10121002",
              jurusan: "Sistem Informasi",
              fakultas: "Teknik dan Ilmu Komputer",
              isKetua: false,
              user: { id: "user-mhs-2", name: "Siti Nurhaliza", phone: "081299990002", isTestAccount: false },
            },
          ],
          programKerja: [
            {
              id: "proker-1",
              nomor: 1,
              deskripsi: "Sosialisasi Pemilahan Sampah",
              kategori: "LINGKUNGAN",
              status: "SELESAI",
              statusUsulan: "DISETUJUI",
              statusPelaksanaan: "SELESAI",
            },
            {
              id: "proker-2",
              nomor: 2,
              deskripsi: "Pembuatan Komposter Loseda",
              kategori: "FISIK",
              status: "SEDANG_BERJALAN",
              statusUsulan: "DISETUJUI",
              statusPelaksanaan: "SEDANG_BERJALAN",
            },
          ],
          penilaianMahasiswa: [
            {
              id: "pen-1",
              studentId: "user-mhs-1",
              nilaiAkhir: 88.5,
              kategoriNilai: "A",
              status: "FINAL",
            },
            {
              id: "pen-2",
              studentId: "user-mhs-2",
              nilaiAkhir: 82.0,
              kategoriNilai: "A-",
              status: "FINAL",
            },
          ],
          schedules: [
            {
              id: "sch-1",
              attendances: [
                {
                  id: "att-1",
                  studentId: "user-mhs-1",
                  status: "HADIR",
                  actualInZoneMinutes: 180,
                  attendedAt: new Date("2026-08-15T08:00:00Z"),
                },
                {
                  id: "att-2",
                  studentId: "user-mhs-2",
                  status: "HADIR",
                  actualInZoneMinutes: 180,
                  attendedAt: new Date("2026-08-15T08:00:00Z"),
                },
              ],
            },
          ],
        },
        // Kelompok Testing yang harus disaring keluar
        {
          id: "kel-test",
          name: "Kelompok 99 Dummy Test",
          kelurahan: "Dago",
          cakupanRw: ["99"],
          dpl: { id: "dpl-test", name: "DPL Tester" },
          poskoKkn: null,
          students: [],
          programKerja: [],
          penilaianMahasiswa: [],
          schedules: [],
        },
      ]);

      (prisma.presensiMandiri.aggregate as any).mockResolvedValue({
        _sum: { durasiMenit: 240 },
      });

      (prisma.penilaianKknMahasiswa.findMany as any).mockResolvedValue([
        { nilaiAkhir: 88.5, kategoriNilai: "A" },
        { nilaiAkhir: 82.0, kategoriNilai: "A-" },
      ]);

      (prisma.activityAttendance.findMany as any).mockResolvedValue([
        { attendedAt: new Date("2026-08-15T08:00:00Z"), status: "HADIR", actualInZoneMinutes: 360 },
      ]);

      const result = await laporanKknService.getLaporanSummary({});

      // Verifikasi Filter Dummy: Kelompok test harus diabaikan
      expect(result.ringkasanEksekutif.totalKelompok).toBe(1);
      expect(result.ringkasanEksekutif.totalMahasiswaAktif).toBe(2);
      expect(result.ringkasanEksekutif.totalDpl).toBe(1);

      // Verifikasi Perhitungan Jam Kontribusi
      // Total menit = (180 + 180) + 240 = 600 menit = 10 jam
      expect(result.ringkasanEksekutif.totalJamKontribusi).toBe(10);
      expect(result.ringkasanEksekutif.rataRataJamPerMahasiswa).toBe(5);

      // Verifikasi Matriks Kelompok
      expect(result.matriksKelompok.length).toBe(1);
      const group1 = result.matriksKelompok[0];
      expect(group1.nama).toBe("Kelompok 1 Sadang Serang");
      expect(group1.ketua?.name).toBe("Ahmad Rizki");
      expect(group1.dpl?.name).toBe("Dr. Budi Santoso, M.T.");
      expect(group1.persentaseKehadiran).toBe(100);
      expect(group1.prokerSelesaiCount).toBe(1);
      expect(group1.prokerTotalCount).toBe(2);
      expect(group1.prokerSelesaiPercent).toBe(50);
      expect(group1.rataRataSkorEvaluasi).toBe(85.25);
      expect(group1.kategoriNilai).toBe("A");
      expect(group1.jumlahMhsDinilai).toBe(2);

      // Verifikasi Lembar Pengesahan
      expect(result.lembarPengesahan.pejabat.length).toBe(3);
      expect(result.lembarPengesahan.pejabat[2].nama).toBe("Dr. Ir. Herman S. Soegoto, MBA");
    });
  });

  describe("exportLaporanCsv", () => {
    it("harus menghasilkan string CSV berisi header dan baris matriks kelompok", async () => {
      (prisma.kelompokKkn.findMany as any).mockResolvedValue([
        {
          id: "kel-1",
          name: "Kelompok 1 Sadang Serang",
          kelurahan: "Sadang Serang",
          cakupanRw: ["01"],
          dpl: { name: "Dr. Budi Santoso, M.T.", nip: "19750101" },
          poskoKkn: { nama: "Posko RW 01", alamat: "Jl. Sadang Serang" },
          students: [],
          programKerja: [],
          penilaianMahasiswa: [],
          schedules: [],
        },
      ]);
      (prisma.presensiMandiri.aggregate as any).mockResolvedValue({ _sum: { durasiMenit: 0 } });
      (prisma.penilaianKknMahasiswa.findMany as any).mockResolvedValue([]);
      (prisma.activityAttendance.findMany as any).mockResolvedValue([]);

      const csv = await laporanKknService.exportLaporanCsv({});
      expect(csv).toContain("Kelompok KKN");
      expect(csv).toContain("DPL");
      expect(csv).toContain("Kelompok 1 Sadang Serang");
    });
  });
});
