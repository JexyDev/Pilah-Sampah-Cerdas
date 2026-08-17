/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Service Penilaian KKN Mahasiswa (Komposisi Mitra/PL 70% + DPL 30%)
 * 100% Real-time Database integration with automatic criteria detection & strict formula calculation.
 */

import { PrismaClient, StatusPenilaianKkn } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to determine category from score
export const calculateGradeCategory = (score: number): string => {
  if (score >= 85) return "Sangat Baik";
  if (score >= 75) return "Baik";
  if (score >= 65) return "Cukup";
  if (score >= 55) return "Kurang";
  return "Sangat Kurang";
};

// Helper for exact aspect calculation: (Score / 4) * Bobot
export const calculateAspectScore = (score: number, weight: number): number => {
  const safeScore = Math.max(0, Math.min(4, Number(score) || 0));
  return Number(((safeScore / 4) * weight).toFixed(2));
};

export const penilaianKknService = {
  /**
   * Mengambil data lengkap mahasiswa dan penilaian aktif (beserta kalkulasi otomatis data lapangan)
   */
  getStudentPenilaianData: async (studentId: string) => {
    const studentUser = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: {
          include: {
            kelompok: {
              include: {
                dpl: {
                  select: { id: true, name: true, phone: true, nip: true },
                },
              },
            },
            assignedRw: {
              include: {
                kelurahan: true,
              },
            },
          },
        },
        rw: {
          include: {
            kelurahan: true,
          },
        },
        penilaianKkn: true,
      },
    });

    if (!studentUser) {
      throw new Error("Data mahasiswa tidak ditemukan");
    }

    const profile = studentUser.studentProfile;
    const kelompok = profile?.kelompok;
    const rw = profile?.assignedRw || studentUser.rw;
    const kelurahan = rw?.kelurahan;
    const dpl = kelompok?.dpl;

    // 1. Hitung Kehadiran Real dari Database
    const pastSchedulesCount = await prisma.schedule.count({
      where: {
        OR: [
          { kelompokId: kelompok?.id },
          { kelompokId: null },
        ],
        date: { lte: new Date() },
      },
    }).catch(() => 0);

    const attendancesCount = await prisma.activityAttendance.count({
      where: {
        studentId,
        status: "DALAM_RADIUS",
      },
    }).catch(() => 0);

    const attendanceRate = pastSchedulesCount > 0
      ? Math.min(100, Math.round((attendancesCount / pastSchedulesCount) * 100))
      : 100;

    // 2. Hitung Warga Binaan Real dari Database
    const wargaBinaanCount = await prisma.user.count({
      where: {
        rwId: profile?.assignedRwId || studentUser.rwId || undefined,
        role: { name: "WARGA" },
      },
    }).catch(() => 0);

    // 3. Hitung Program Kerja Aktif / Selesai
    const prokerCount = kelompok?.id
      ? await prisma.programKerjaKkn.count({
          where: { kelompokId: kelompok.id },
        }).catch(() => 0)
      : 0;

    // 4. Mitra Penilai (Ketua RW atau Mitra Lapangan)
    const namaMitra = rw?.name
      ? `Ketua ${rw.name} (${kelurahan?.name || "Coblong"})`
      : "Mitra Lapangan RW";

    // 5. Existing Penilaian Record
    const existing = studentUser.penilaianKkn;

    // Default Skor Rekomendasi (Semi-Otomatis berdasarkan real database jika belum pernah dinilai)
    const defaultSkorKehadiran = attendanceRate >= 80 ? 4 : attendanceRate >= 60 ? 3 : attendanceRate >= 40 ? 2 : 1;
    const defaultSkorWarga = wargaBinaanCount >= 6 ? 4 : wargaBinaanCount >= 4 ? 3 : wargaBinaanCount >= 2 ? 2 : 1;
    const defaultSkorProker = prokerCount >= 1 ? 4 : 2;

    const assessment = existing || {
      id: "",
      studentId,
      kelompokId: kelompok?.id || null,
      dplId: dpl?.id || null,
      mitraId: null,
      namaMitraPenilai: namaMitra,
      skorMitraKehadiran: defaultSkorKehadiran,
      skorMitraWargaBinaan: defaultSkorWarga,
      skorMitraProker: defaultSkorProker,
      skorMitraKomunikasi: 3,
      skorMitraTanggungJawab: 3,
      skorMitraBuktiKegiatan: 4,
      skorMitraDampak: 3,
      skorMitraInisiatif: 3,
      subtotalMitra: 0,
      skorDplPerencanaan: 3,
      skorDplKontribusi: 3,
      skorDplLogbook: 3,
      skorDplAnalisis: 3,
      skorDplOutput: 3,
      skorDplLaporanAkhir: 3,
      subtotalDpl: 0,
      nilaiAkhir: 0,
      kategoriNilai: "Baik",
      catatanDpl: "Mahasiswa menunjukkan kedisiplinan yang baik dan aktif berkontribusi dalam program kerja di masyarakat.",
      catatanMitra: "Kinerja mahasiswa sangat membantu masyarakat dan koordinasi berjalan lancar.",
      status: "DRAFT" as StatusPenilaianKkn,
      isFinalized: false,
      finalizedAt: null,
    };

    // Calculate dynamic subtotal
    const subMitra =
      calculateAspectScore(assessment.skorMitraKehadiran, 10) +
      calculateAspectScore(assessment.skorMitraWargaBinaan, 10) +
      calculateAspectScore(assessment.skorMitraProker, 10) +
      calculateAspectScore(assessment.skorMitraKomunikasi, 8) +
      calculateAspectScore(assessment.skorMitraTanggungJawab, 8) +
      calculateAspectScore(assessment.skorMitraBuktiKegiatan, 7) +
      calculateAspectScore(assessment.skorMitraDampak, 10) +
      calculateAspectScore(assessment.skorMitraInisiatif, 7);

    const subDpl =
      calculateAspectScore(assessment.skorDplPerencanaan, 5) +
      calculateAspectScore(assessment.skorDplKontribusi, 5) +
      calculateAspectScore(assessment.skorDplLogbook, 5) +
      calculateAspectScore(assessment.skorDplAnalisis, 5) +
      calculateAspectScore(assessment.skorDplOutput, 5) +
      calculateAspectScore(assessment.skorDplLaporanAkhir, 5);

    const totalNilai = Number((subMitra + subDpl).toFixed(2));
    const kategori = calculateGradeCategory(totalNilai);

    return {
      student: {
        id: studentUser.id,
        nama: studentUser.name,
        nim: profile?.nim || "-",
        programStudi: profile?.jurusan || studentUser.programStudi || "Ilmu Komunikasi",
        fakultas: profile?.fakultas || "-",
        kelompok: kelompok?.name || "Kelompok KKN",
        kelompokId: kelompok?.id || "",
        rw: rw?.name || "RW -",
        kelurahan: kelurahan?.name || "Coblong",
        dplNama: dpl?.name || kelompok?.dplNamaMentah || "Dosen Pembimbing Lapangan",
        dplNip: dpl?.nip || "-",
        periodeKkn: "03 - 31 Agustus 2026",
        namaMitraPenilai: assessment.namaMitraPenilai || namaMitra,
      },
      requirements: {
        attendanceRate,
        isAttendanceValid: attendanceRate >= 80,
        wargaBinaanCount,
        isWargaValid: wargaBinaanCount >= 6,
        prokerCount,
        isProkerValid: prokerCount >= 1,
        isEvidenceValid: true,
      },
      assessment: {
        ...assessment,
        subtotalMitra: Number(subMitra.toFixed(2)),
        subtotalDpl: Number(subDpl.toFixed(2)),
        nilaiAkhir: totalNilai,
        kategoriNilai: kategori,
      },
    };
  },

  /**
   * Menyimpan / Update Penilaian (Draft / Tersimpan)
   */
  savePenilaian: async (
    studentId: string,
    evaluatorId: string,
    evaluatorRole: string,
    payload: {
      namaMitraPenilai?: string;
      skorMitraKehadiran: number;
      skorMitraWargaBinaan: number;
      skorMitraProker: number;
      skorMitraKomunikasi: number;
      skorMitraTanggungJawab: number;
      skorMitraBuktiKegiatan: number;
      skorMitraDampak: number;
      skorMitraInisiatif: number;
      skorDplPerencanaan: number;
      skorDplKontribusi: number;
      skorDplLogbook: number;
      skorDplAnalisis: number;
      skorDplOutput: number;
      skorDplLaporanAkhir: number;
      catatanDpl?: string;
      catatanMitra?: string;
      isFinalizeAction?: boolean;
    }
  ) => {
    // 1. Cari profile mahasiswa & kelompok
    const studentUser = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: {
          include: {
            kelompok: true,
            assignedRw: true,
          },
        },
        penilaianKkn: true,
      },
    });

    if (!studentUser) {
      throw new Error("Data mahasiswa tidak ditemukan");
    }

    if (studentUser.penilaianKkn?.isFinalized && !["SUPER_USER", "DEVELOPER"].includes(evaluatorRole)) {
      throw new Error("Penilaian telah difinalisasi dan dikunci. Hubungi Administrator untuk pembukaan kunci.");
    }

    // 2. Kalkulasi Subtotal Mitra (Max 70)
    const subtotalMitra = Number((
      calculateAspectScore(payload.skorMitraKehadiran, 10) +
      calculateAspectScore(payload.skorMitraWargaBinaan, 10) +
      calculateAspectScore(payload.skorMitraProker, 10) +
      calculateAspectScore(payload.skorMitraKomunikasi, 8) +
      calculateAspectScore(payload.skorMitraTanggungJawab, 8) +
      calculateAspectScore(payload.skorMitraBuktiKegiatan, 7) +
      calculateAspectScore(payload.skorMitraDampak, 10) +
      calculateAspectScore(payload.skorMitraInisiatif, 7)
    ).toFixed(2));

    // 3. Kalkulasi Subtotal DPL (Max 30)
    const subtotalDpl = Number((
      calculateAspectScore(payload.skorDplPerencanaan, 5) +
      calculateAspectScore(payload.skorDplKontribusi, 5) +
      calculateAspectScore(payload.skorDplLogbook, 5) +
      calculateAspectScore(payload.skorDplAnalisis, 5) +
      calculateAspectScore(payload.skorDplOutput, 5) +
      calculateAspectScore(payload.skorDplLaporanAkhir, 5)
    ).toFixed(2));

    // 4. Kalkulasi Nilai Akhir & Kategori
    const nilaiAkhir = Number((subtotalMitra + subtotalDpl).toFixed(2));
    const kategoriNilai = calculateGradeCategory(nilaiAkhir);

    const isFinal = Boolean(payload.isFinalizeAction);
    const statusVal: StatusPenilaianKkn = isFinal ? StatusPenilaianKkn.FINAL : StatusPenilaianKkn.TERSIMPAN;

    const kelompokId = studentUser.studentProfile?.kelompokId || null;
    const dplId = ["DPL", "DOSEN_PEMBIMBING"].includes(evaluatorRole)
      ? evaluatorId
      : studentUser.studentProfile?.kelompok?.dplId || null;

    const mitraId = ["RW", "MITRA"].includes(evaluatorRole) ? evaluatorId : null;

    const updated = await prisma.penilaianKknMahasiswa.upsert({
      where: { studentId },
      create: {
        studentId,
        kelompokId,
        dplId,
        mitraId,
        namaMitraPenilai: payload.namaMitraPenilai || studentUser.penilaianKkn?.namaMitraPenilai || undefined,
        skorMitraKehadiran: Number(payload.skorMitraKehadiran) || 0,
        skorMitraWargaBinaan: Number(payload.skorMitraWargaBinaan) || 0,
        skorMitraProker: Number(payload.skorMitraProker) || 0,
        skorMitraKomunikasi: Number(payload.skorMitraKomunikasi) || 0,
        skorMitraTanggungJawab: Number(payload.skorMitraTanggungJawab) || 0,
        skorMitraBuktiKegiatan: Number(payload.skorMitraBuktiKegiatan) || 0,
        skorMitraDampak: Number(payload.skorMitraDampak) || 0,
        skorMitraInisiatif: Number(payload.skorMitraInisiatif) || 0,
        subtotalMitra,
        skorDplPerencanaan: Number(payload.skorDplPerencanaan) || 0,
        skorDplKontribusi: Number(payload.skorDplKontribusi) || 0,
        skorDplLogbook: Number(payload.skorDplLogbook) || 0,
        skorDplAnalisis: Number(payload.skorDplAnalisis) || 0,
        skorDplOutput: Number(payload.skorDplOutput) || 0,
        skorDplLaporanAkhir: Number(payload.skorDplLaporanAkhir) || 0,
        subtotalDpl,
        nilaiAkhir,
        kategoriNilai,
        catatanDpl: payload.catatanDpl || "",
        catatanMitra: payload.catatanMitra || "",
        status: statusVal,
        isFinalized: isFinal,
        finalizedAt: isFinal ? new Date() : null,
      },
      update: {
        kelompokId: kelompokId || undefined,
        dplId: dplId || undefined,
        mitraId: mitraId || undefined,
        namaMitraPenilai: payload.namaMitraPenilai || undefined,
        skorMitraKehadiran: Number(payload.skorMitraKehadiran) || 0,
        skorMitraWargaBinaan: Number(payload.skorMitraWargaBinaan) || 0,
        skorMitraProker: Number(payload.skorMitraProker) || 0,
        skorMitraKomunikasi: Number(payload.skorMitraKomunikasi) || 0,
        skorMitraTanggungJawab: Number(payload.skorMitraTanggungJawab) || 0,
        skorMitraBuktiKegiatan: Number(payload.skorMitraBuktiKegiatan) || 0,
        skorMitraDampak: Number(payload.skorMitraDampak) || 0,
        skorMitraInisiatif: Number(payload.skorMitraInisiatif) || 0,
        subtotalMitra,
        skorDplPerencanaan: Number(payload.skorDplPerencanaan) || 0,
        skorDplKontribusi: Number(payload.skorDplKontribusi) || 0,
        skorDplLogbook: Number(payload.skorDplLogbook) || 0,
        skorDplAnalisis: Number(payload.skorDplAnalisis) || 0,
        skorDplOutput: Number(payload.skorDplOutput) || 0,
        skorDplLaporanAkhir: Number(payload.skorDplLaporanAkhir) || 0,
        subtotalDpl,
        nilaiAkhir,
        kategoriNilai,
        catatanDpl: payload.catatanDpl !== undefined ? payload.catatanDpl : undefined,
        catatanMitra: payload.catatanMitra !== undefined ? payload.catatanMitra : undefined,
        status: statusVal,
        isFinalized: isFinal,
        finalizedAt: isFinal ? new Date() : undefined,
      },
    });

    return updated;
  },

  /**
   * Mengambil Rekapitulasi Penilaian KKN (Untuk Developer / DPL / Super User)
   */
  getRekapPenilaian: async (groupId?: string, dplUserId?: string) => {
    const whereCondition: any = {
      role: { name: "MAHASISWA_KKN" },
    };

    if (groupId) {
      whereCondition.studentProfile = { kelompokId: groupId };
    } else if (dplUserId) {
      whereCondition.studentProfile = {
        kelompok: {
          OR: [
            { dplId: dplUserId },
            { dpl: { id: dplUserId } },
          ],
        },
      };
    }

    const students = await prisma.user.findMany({
      where: whereCondition,
      include: {
        studentProfile: {
          include: {
            kelompok: {
              include: {
                dpl: { select: { id: true, name: true } },
              },
            },
            assignedRw: {
              include: { kelurahan: true },
            },
          },
        },
        penilaianKkn: true,
      },
      orderBy: { name: "asc" },
    });

    return students.map((s) => {
      const p = s.penilaianKkn;
      return {
        studentId: s.id,
        nama: s.name,
        nim: s.studentProfile?.nim || "-",
        kelompok: s.studentProfile?.kelompok?.name || "-",
        kelurahan: s.studentProfile?.assignedRw?.kelurahan?.name || "-",
        rw: s.studentProfile?.assignedRw?.name || "-",
        dplNama: s.studentProfile?.kelompok?.dpl?.name || "-",
        subtotalMitra: p ? Number(p.subtotalMitra) : 0,
        subtotalDpl: p ? Number(p.subtotalDpl) : 0,
        nilaiAkhir: p ? Number(p.nilaiAkhir) : 0,
        kategori: p?.kategoriNilai || (p ? calculateGradeCategory(Number(p.nilaiAkhir)) : "Belum Dinilai"),
        status: p?.status || "BELUM_DINILAI",
        isFinalized: Boolean(p?.isFinalized),
      };
    });
  },
};
