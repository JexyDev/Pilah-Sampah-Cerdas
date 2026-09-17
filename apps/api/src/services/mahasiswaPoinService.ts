/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo,
 * tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 *
 * Service: Perhitungan Poin Mahasiswa KKN
 * Formula berdasarkan notulensi rapat BERSEKA.
 *
 * Formula:
 *   Komponen A (bobot 60%):
 *     - NilaiProkerStep = rata-rata step proker semua proker kelompok (25/60/100)
 *     - RataAnggota     = rata-rata assessmentScore anggota kelompok
 *     - KomponenA       = (NilaiProkerStep + RataAnggota) / 2
 *
 *   Komponen B (bobot 40%):
 *     - KomponenB = rata-rata KomponenA dari SEMUA kelompok (bukan per kelompok)
 *
 *   PoinAkhir = (KomponenA * 0.6) + (KomponenB * 0.4)
 *   Semua anggota dalam satu kelompok mendapat PoinAkhir yang sama.
 */

import { prisma } from "../lib/prisma.js";
import { isTestKelompok, isTestStudent } from "../utils/filterTestingUtils.js";

// ─────────────────────────────────────────────
// HELPER: Nilai step proker berdasarkan status
// ─────────────────────────────────────────────

/**
 * Menentukan nilai step proker (25 / 60 / 100) berdasarkan statusPelaksanaan dan status.
 *
 * Step 3 (SELESAI)                                → 100
 * Step 2 (SEDANG_BERJALAN / DITERIMA / DISETUJUI) → 60
 * Step 1 (BELUM_MULAI / DIUSULKAN / lainnya)      → 25
 */
function hitungNilaiProkerStep(
  statusPelaksanaan: string | null,
  status: string | null
): number {
  const pelaksanaan = (statusPelaksanaan ?? "").toUpperCase().trim();
  const statusEnum = (status ?? "").toUpperCase().trim();

  // Step 3: Selesai
  if (pelaksanaan === "SELESAI" || statusEnum === "SELESAI") {
    return 100;
  }

  // Step 2: Sedang berjalan / disetujui / diterima
  const step2Keywords = ["SEDANG_BERJALAN", "DITERIMA", "DISETUJUI", "BERJALAN"];
  if (
    step2Keywords.some((kw) => pelaksanaan.includes(kw)) ||
    step2Keywords.some((kw) => statusEnum.includes(kw))
  ) {
    return 60;
  }

  // Step 1: Default (BELUM_MULAI, DIUSULKAN, BELUM_DISETUJUI, dll.)
  return 25;
}

// ─────────────────────────────────────────────
// EXPORT: mahasiswaPoinService
// ─────────────────────────────────────────────

export const mahasiswaPoinService = {
  /**
   * Hitung poin untuk satu kelompok KKN.
   * Mengembalikan nilaiProkerStep, rataAnggota, komponenA, dan komponenABobot (x0.6).
   * Tidak menulis ke database — murni kalkulasi.
   */
  async hitungPoinKelompok(kelompokId: string): Promise<{
    kelompokId: string;
    kelompokName: string;
    nilaiProkerStep: number;
    rataRataAssessmentAnggota: number;
    komponenA: number;
    komponenABobot: number;
  }> {
    // Ambil data kelompok beserta proker dan mahasiswa
    const kelompok = await prisma.kelompokKkn.findUnique({
      where: { id: kelompokId },
      select: {
        id: true,
        name: true,
        kelurahan: true,
        dplNamaMentah: true,
        dpl: { select: { id: true, name: true, email: true, nip: true } },
        programKerja: {
          select: {
            id: true,
            status: true,
            statusPelaksanaan: true,
          },
        },
        students: {
          select: {
            id: true,
            assessmentScore: true,
            user: { select: { id: true, name: true, email: true, nip: true } },
          },
        },
      },
    });

    if (!kelompok) {
      throw new Error(`Kelompok dengan id=${kelompokId} tidak ditemukan`);
    }

    // ── Hitung NilaiProkerStep ──────────────────────────────────
    let nilaiProkerStep = 25; // default jika tidak ada proker
    if (kelompok.programKerja.length > 0) {
      const sumStep = kelompok.programKerja.reduce((acc, pk) => {
        return acc + hitungNilaiProkerStep(pk.statusPelaksanaan, pk.status);
      }, 0);
      nilaiProkerStep = sumStep / kelompok.programKerja.length;
    }

    // ── Hitung RataRataAssessmentAnggota ───────────────────────
    // Filter mahasiswa non-testing
    const mahasiswaValid = kelompok.students.filter((s) => {
      return !isTestStudent({
        id: s.id,
        user: s.user,
        kelompok: {
          name: kelompok.name,
          kelurahan: kelompok.kelurahan,
          dpl: kelompok.dpl,
          dplNamaMentah: kelompok.dplNamaMentah,
        },
      });
    });

    let rataRataAssessmentAnggota = 0;
    if (mahasiswaValid.length > 0) {
      const sumAssessment = mahasiswaValid.reduce((acc, s) => {
        const score = s.assessmentScore !== null ? Number(s.assessmentScore) : 0;
        return acc + score;
      }, 0);
      rataRataAssessmentAnggota = sumAssessment / mahasiswaValid.length;
    }

    // ── KomponenA = (nilaiProkerStep + rataRataAssessment) / 2 ─
    const komponenA = (nilaiProkerStep + rataRataAssessmentAnggota) / 2;

    // ── KomponenABobot = komponenA * 0.6 ──────────────────────
    const komponenABobot = komponenA * 0.6;

    return {
      kelompokId: kelompok.id,
      kelompokName: kelompok.name,
      nilaiProkerStep: parseFloat(nilaiProkerStep.toFixed(4)),
      rataRataAssessmentAnggota: parseFloat(rataRataAssessmentAnggota.toFixed(4)),
      komponenA: parseFloat(komponenA.toFixed(4)),
      komponenABobot: parseFloat(komponenABobot.toFixed(4)),
    };
  },

  /**
   * Hitung poin akhir semua kelompok KKN.
   *
   * Komponen B = rata-rata komponenA dari semua kelompok valid.
   * PoinAkhir  = (komponenA * 0.6) + (KomponenB * 0.4)
   *
   * Semua anggota dalam satu kelompok mendapat PoinAkhir yang sama.
   * Fungsi ini TIDAK menulis ke database (pure calculation).
   */
  async hitungPoinSemua(): Promise<{
    totalKelompok: number;
    rataRataPoinKelompok: number;
    kelompokList: Array<{
      kelompokId: string;
      kelompokName: string;
      komponenA: number;
      komponenABobot: number;
      komponenBBobot: number;
      poinAkhir: number;
      mahasiswaList: Array<{
        studentId: string;
        userId: string;
        nama: string;
        poinAkhir: number;
      }>;
    }>;
  }> {
    // Ambil semua kelompok beserta data yang diperlukan
    const semuaKelompok = await prisma.kelompokKkn.findMany({
      select: {
        id: true,
        name: true,
        kelurahan: true,
        dplNamaMentah: true,
        dpl: { select: { id: true, name: true, email: true, nip: true } },
        programKerja: {
          select: {
            id: true,
            status: true,
            statusPelaksanaan: true,
          },
        },
        students: {
          select: {
            id: true,
            userId: true,
            assessmentScore: true,
            user: { select: { id: true, name: true, email: true, nip: true } },
          },
        },
      },
    });

    // Filter kelompok testing
    const kelompokValid = semuaKelompok.filter((k) => {
      return !isTestKelompok({
        id: k.id,
        name: k.name,
        kelurahan: k.kelurahan,
        dplNamaMentah: k.dplNamaMentah,
        dpl: k.dpl,
      });
    });

    if (kelompokValid.length === 0) {
      return {
        totalKelompok: 0,
        rataRataPoinKelompok: 0,
        kelompokList: [],
      };
    }

    // ── Hitung komponenA per kelompok ──────────────────────────
    const intermediates = kelompokValid.map((kelompok) => {
      // Nilai proker step (rata-rata dari semua proker kelompok)
      let nilaiProkerStep = 25;
      if (kelompok.programKerja.length > 0) {
        const sumStep = kelompok.programKerja.reduce((acc, pk) => {
          return acc + hitungNilaiProkerStep(pk.statusPelaksanaan, pk.status);
        }, 0);
        nilaiProkerStep = sumStep / kelompok.programKerja.length;
      }

      // Rata-rata assessment anggota (hanya non-testing)
      const mahasiswaValid = kelompok.students.filter((s) => {
        return !isTestStudent({
          id: s.id,
          user: s.user,
          kelompok: {
            name: kelompok.name,
            kelurahan: kelompok.kelurahan,
            dpl: kelompok.dpl,
            dplNamaMentah: kelompok.dplNamaMentah,
          },
        });
      });

      let rataRataAssessment = 0;
      if (mahasiswaValid.length > 0) {
        const sumAssessment = mahasiswaValid.reduce((acc, s) => {
          return acc + (s.assessmentScore !== null ? Number(s.assessmentScore) : 0);
        }, 0);
        rataRataAssessment = sumAssessment / mahasiswaValid.length;
      }

      const komponenA = (nilaiProkerStep + rataRataAssessment) / 2;
      const komponenABobot = komponenA * 0.6;

      return {
        kelompok,
        mahasiswaValid,
        nilaiProkerStep,
        rataRataAssessment,
        komponenA,
        komponenABobot,
      };
    });

    // ── Komponen B = mean(semua komponenA) dari seluruh kelompok ──
    const sumKomponenA = intermediates.reduce((acc, item) => acc + item.komponenA, 0);
    const rataRataPoinKelompok = sumKomponenA / intermediates.length;
    const komponenBBobot = rataRataPoinKelompok * 0.4;

    // ── Susun kelompokList dengan poinAkhir per mahasiswa ─────
    const kelompokList = intermediates.map((item) => {
      const { kelompok, mahasiswaValid, komponenA, komponenABobot } = item;
      const poinAkhir = komponenABobot + komponenBBobot;

      const mahasiswaList = mahasiswaValid.map((s) => ({
        studentId: s.id,
        userId: s.userId,
        nama: s.user?.name ?? "(Tanpa Nama)",
        poinAkhir: parseFloat(poinAkhir.toFixed(2)),
      }));

      return {
        kelompokId: kelompok.id,
        kelompokName: kelompok.name,
        komponenA: parseFloat(komponenA.toFixed(4)),
        komponenABobot: parseFloat(komponenABobot.toFixed(4)),
        komponenBBobot: parseFloat(komponenBBobot.toFixed(4)),
        poinAkhir: parseFloat(poinAkhir.toFixed(2)),
        mahasiswaList,
      };
    });

    return {
      totalKelompok: kelompokValid.length,
      rataRataPoinKelompok: parseFloat(rataRataPoinKelompok.toFixed(4)),
      kelompokList,
    };
  },

  /**
   * Simulasi formula poin KKN — preview tanpa commit ke database.
   * Alias dari hitungPoinSemua() untuk endpoint publik preview.
   */
  async simulasiFormula(): Promise<{
    kelompokList: any[];
    totalKelompok: number;
    rataRataPoin: number;
  }> {
    const hasil = await this.hitungPoinSemua();
    return {
      totalKelompok: hasil.totalKelompok,
      rataRataPoin: hasil.rataRataPoinKelompok,
      kelompokList: hasil.kelompokList,
    };
  },

  /**
   * Normalisasi poin KKN ke PointHistory (DEVELOPER ONLY).
   *
   * Untuk setiap mahasiswa per kelompok (dalam transaction):
   *   1. Hapus PointHistory lama dengan kategori = "POIN_KKN_FINAL"
   *   2. Buat PointHistory baru dengan poin = Math.round(poinAkhir)
   *
   * Dilakukan per kelompok dalam transaction terpisah untuk isolasi kegagalan.
   */
  async normalisasiPoinBulk(): Promise<{
    berhasil: number;
    gagal: number;
    detail: Array<{
      kelompokId: string;
      kelompokName: string;
      status: "BERHASIL" | "GAGAL";
      mahasiswaCount?: number;
      error?: string;
    }>;
  }> {
    // Hitung poin semua kelompok terlebih dahulu
    const hasil = await this.hitungPoinSemua();

    let berhasil = 0;
    let gagal = 0;
    const detail: Array<{
      kelompokId: string;
      kelompokName: string;
      status: "BERHASIL" | "GAGAL";
      mahasiswaCount?: number;
      error?: string;
    }> = [];

    for (const kelompokData of hasil.kelompokList) {
      try {
        // Transaction per kelompok untuk isolasi kegagalan
        await prisma.$transaction(async (tx) => {
          for (const mhs of kelompokData.mahasiswaList) {
            // 1. Hapus PointHistory lama dengan kategori POIN_KKN_FINAL
            await tx.pointHistory.deleteMany({
              where: {
                userId: mhs.userId,
                kategori: "POIN_KKN_FINAL",
              },
            });

            // 2. Buat PointHistory baru dengan poin akhir hasil formula
            await tx.pointHistory.create({
              data: {
                userId: mhs.userId,
                points: Math.round(mhs.poinAkhir),
                kategori: "POIN_KKN_FINAL",
                description: `Normalisasi poin KKN dari formula kelompok (${kelompokData.kelompokName})`,
              },
            });
          }
        });

        berhasil++;
        detail.push({
          kelompokId: kelompokData.kelompokId,
          kelompokName: kelompokData.kelompokName,
          status: "BERHASIL",
          mahasiswaCount: kelompokData.mahasiswaList.length,
        });
      } catch (err: any) {
        gagal++;
        detail.push({
          kelompokId: kelompokData.kelompokId,
          kelompokName: kelompokData.kelompokName,
          status: "GAGAL",
          error: err?.message ?? "Unknown error",
        });
        console.error(
          `[normalisasiPoinBulk] Gagal untuk kelompok ${kelompokData.kelompokName}:`,
          err
        );
      }
    }

    return { berhasil, gagal, detail };
  },
};
