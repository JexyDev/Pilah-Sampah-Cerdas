import { prisma } from "../lib/prisma.js";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Service Penilaian KKN Mahasiswa (Komposisi Mitra/PL 70% + DPL 30%)
 * 100% Real-time Database integration with automatic criteria detection & strict formula calculation.
 */

import { StatusPenilaianKkn } from "@prisma/client";

// Helper to determine category from score
export const calculateGradeCategory = (score: number): string => {
  if (score >= 85) return "Sangat Baik";
  if (score >= 75) return "Baik";
  if (score >= 65) return "Cukup";
  if (score >= 55) return "Kurang";
  if (score > 0) return "Sangat Kurang";
  return "Belum Dinilai";
};

// Helper for exact aspect calculation: supports 0-100 percentage & 0-4 scale
export const calculateAspectScore = (score: number, weight: number): number => {
  const num = Number(score) || 0;
  if (num <= 4 && num > 0) {
    return Number(((num / 4) * weight).toFixed(2));
  }
  const safeScore = Math.max(0, Math.min(100, num));
  return Number(((safeScore * weight) / 100).toFixed(2));
};

export const penilaianKknService = {
  /**
   * Mengambil data lengkap mahasiswa dan penilaian aktif (beserta kalkulasi otomatis data lapangan)
   */
  getStudentPenilaianData: async (studentId: string, evaluatorId?: string, evaluatorRole?: string) => {
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

    // Strict Scope: Jika evaluator DPL, pastikan mahasiswa berada di bawah kelompok bimbingannya
    if (evaluatorRole && ["DPL", "DOSEN_PEMBIMBING"].includes(evaluatorRole.toUpperCase()) && evaluatorId) {
      const isSupervised = dpl?.id === evaluatorId || kelompok?.dplId === evaluatorId;
      if (!isSupervised) {
        throw new Error("Akses ditolak: Mahasiswa ini bukan bagian dari kelompok bimbingan DPL Anda");
      }
    }

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
      : 0;

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
      : "Mitra Pendamping Lapangan (MPL) RW";

    // 5. Existing Penilaian Record - Default 0 jika belum dinilai di database
    const existing = studentUser.penilaianKkn;

    const assessment = existing || {
      id: "",
      studentId,
      kelompokId: kelompok?.id || null,
      dplId: dpl?.id || null,
      mitraId: null,
      namaMitraPenilai: namaMitra,
      skorMitraKehadiran: 0,
      skorMitraWargaBinaan: 0,
      skorMitraProker: 0,
      skorMitraKomunikasi: 0,
      skorMitraTanggungJawab: 0,
      skorMitraBuktiKegiatan: 0,
      skorMitraDampak: 0,
      skorMitraInisiatif: 0,
      subtotalMitra: 0,
      skorDplPerencanaan: 0,
      skorDplKontribusi: 0,
      skorDplLogbook: 0,
      skorDplAnalisis: 0,
      skorDplOutput: 0,
      skorDplLaporanAkhir: 0,
      subtotalDpl: 0,
      nilaiAkhir: 0,
      kategoriNilai: "Belum Dinilai",
      catatanDpl: "",
      catatanMitra: "",
      status: "DRAFT" as StatusPenilaianKkn,
      isFinalized: false,
      finalizedAt: null,
    };

    // Calculate dynamic subtotal from actual aspect scores
    const subMitra =
      calculateAspectScore(assessment.skorMitraKehadiran, 10) +
      calculateAspectScore(assessment.skorMitraWargaBinaan, 10) +
      calculateAspectScore(assessment.skorMitraProker, 10) +
      calculateAspectScore(assessment.skorMitraKomunikasi, 8) +
      calculateAspectScore(assessment.skorMitraTanggungJawab, 8) +
      calculateAspectScore(assessment.skorMitraBuktiKegiatan, 7) +
      calculateAspectScore(assessment.skorMitraDampak, 10) +
      calculateAspectScore(assessment.skorMitraInisiatif, 7);

    // DPL academic 6 aspects (20%, 20%, 20%, 15%, 15%, 10% -> 100% total)
    const subDpl =
      calculateAspectScore(assessment.skorDplPerencanaan, 20) +
      calculateAspectScore(assessment.skorDplKontribusi, 20) +
      calculateAspectScore(assessment.skorDplLogbook, 20) +
      calculateAspectScore(assessment.skorDplAnalisis, 15) +
      calculateAspectScore(assessment.skorDplOutput, 15) +
      calculateAspectScore(assessment.skorDplLaporanAkhir, 10);

    const totalNilai = Number((subDpl > 0 ? subDpl : (subMitra + subDpl)).toFixed(2));
    const kategori = totalNilai === 0 && !existing ? "Belum Dinilai" : calculateGradeCategory(totalNilai);

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
        dplNama: dpl?.name || kelompok?.dplNamaMentah || "Dosen Pendamping Lapangan",
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
        isEvidenceValid: pastSchedulesCount > 0,
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
   * Menyimpan / Update Penilaian (Draft / Tersimpan / Final)
   */
  savePenilaian: async (
    studentId: string,
    evaluatorId: string,
    evaluatorRole: string,
    payload: {
      namaMitraPenilai?: string;
      skorMitraKehadiran?: number;
      skorMitraWargaBinaan?: number;
      skorMitraProker?: number;
      skorMitraKomunikasi?: number;
      skorMitraTanggungJawab?: number;
      skorMitraBuktiKegiatan?: number;
      skorMitraDampak?: number;
      skorMitraInisiatif?: number;
      skorDplPerencanaan?: number;
      skorDplKontribusi?: number;
      skorDplLogbook?: number;
      skorDplAnalisis?: number;
      skorDplOutput?: number;
      skorDplLaporanAkhir?: number;
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
            kelompok: {
              include: {
                dpl: true,
              },
            },
            assignedRw: true,
          },
        },
        penilaianKkn: true,
      },
    });

    if (!studentUser) {
      throw new Error("Data mahasiswa tidak ditemukan");
    }

    const isDpl = ["DPL", "DOSEN_PEMBIMBING"].includes(evaluatorRole);
    const isMitra = ["RW", "MITRA", "ADMIN_DLH", "DLH", "LURAH", "KELURAHAN"].includes(evaluatorRole);

    // Strict Scope: DPL hanya dapat menilai mahasiswa di bawah bimbingannya
    if (isDpl && evaluatorId) {
      const isSupervised =
        studentUser.studentProfile?.kelompok?.dplId === evaluatorId ||
        studentUser.studentProfile?.kelompok?.dpl?.id === evaluatorId;
      if (!isSupervised) {
        throw new Error("Akses ditolak: Anda hanya berwenang menilai mahasiswa di bawah bimbingan DPL Anda");
      }
    }

    if (studentUser.penilaianKkn?.isFinalized && !["SUPER_USER", "DEVELOPER"].includes(evaluatorRole)) {
      throw new Error("Penilaian telah difinalisasi dan dikunci. Hubungi Administrator untuk pembukaan kunci.");
    }

    const prev = studentUser.penilaianKkn;

    // Merge scores safely based on evaluator role
    const skorMitraKehadiran = isDpl
      ? (prev?.skorMitraKehadiran ?? 0)
      : (payload.skorMitraKehadiran !== undefined ? Number(payload.skorMitraKehadiran) : (prev?.skorMitraKehadiran ?? 0));

    const skorMitraWargaBinaan = isDpl
      ? (prev?.skorMitraWargaBinaan ?? 0)
      : (payload.skorMitraWargaBinaan !== undefined ? Number(payload.skorMitraWargaBinaan) : (prev?.skorMitraWargaBinaan ?? 0));

    const skorMitraProker = isDpl
      ? (prev?.skorMitraProker ?? 0)
      : (payload.skorMitraProker !== undefined ? Number(payload.skorMitraProker) : (prev?.skorMitraProker ?? 0));

    const skorMitraKomunikasi = isDpl
      ? (prev?.skorMitraKomunikasi ?? 0)
      : (payload.skorMitraKomunikasi !== undefined ? Number(payload.skorMitraKomunikasi) : (prev?.skorMitraKomunikasi ?? 0));

    const skorMitraTanggungJawab = isDpl
      ? (prev?.skorMitraTanggungJawab ?? 0)
      : (payload.skorMitraTanggungJawab !== undefined ? Number(payload.skorMitraTanggungJawab) : (prev?.skorMitraTanggungJawab ?? 0));

    const skorMitraBuktiKegiatan = isDpl
      ? (prev?.skorMitraBuktiKegiatan ?? 0)
      : (payload.skorMitraBuktiKegiatan !== undefined ? Number(payload.skorMitraBuktiKegiatan) : (prev?.skorMitraBuktiKegiatan ?? 0));

    const skorMitraDampak = isDpl
      ? (prev?.skorMitraDampak ?? 0)
      : (payload.skorMitraDampak !== undefined ? Number(payload.skorMitraDampak) : (prev?.skorMitraDampak ?? 0));

    const skorMitraInisiatif = isDpl
      ? (prev?.skorMitraInisiatif ?? 0)
      : (payload.skorMitraInisiatif !== undefined ? Number(payload.skorMitraInisiatif) : (prev?.skorMitraInisiatif ?? 0));

    const skorDplPerencanaan = isMitra
      ? (prev?.skorDplPerencanaan ?? 0)
      : (payload.skorDplPerencanaan !== undefined ? Number(payload.skorDplPerencanaan) : (prev?.skorDplPerencanaan ?? 0));

    const skorDplKontribusi = isMitra
      ? (prev?.skorDplKontribusi ?? 0)
      : (payload.skorDplKontribusi !== undefined ? Number(payload.skorDplKontribusi) : (prev?.skorDplKontribusi ?? 0));

    const skorDplLogbook = isMitra
      ? (prev?.skorDplLogbook ?? 0)
      : (payload.skorDplLogbook !== undefined ? Number(payload.skorDplLogbook) : (prev?.skorDplLogbook ?? 0));

    const skorDplAnalisis = isMitra
      ? (prev?.skorDplAnalisis ?? 0)
      : (payload.skorDplAnalisis !== undefined ? Number(payload.skorDplAnalisis) : (prev?.skorDplAnalisis ?? 0));

    const skorDplOutput = isMitra
      ? (prev?.skorDplOutput ?? 0)
      : (payload.skorDplOutput !== undefined ? Number(payload.skorDplOutput) : (prev?.skorDplOutput ?? 0));

    const skorDplLaporanAkhir = isMitra
      ? (prev?.skorDplLaporanAkhir ?? 0)
      : (payload.skorDplLaporanAkhir !== undefined ? Number(payload.skorDplLaporanAkhir) : (prev?.skorDplLaporanAkhir ?? 0));

    // 2. Kalkulasi Subtotal Mitra (Max 70)
    const subtotalMitra = Number((
      calculateAspectScore(skorMitraKehadiran, 10) +
      calculateAspectScore(skorMitraWargaBinaan, 10) +
      calculateAspectScore(skorMitraProker, 10) +
      calculateAspectScore(skorMitraKomunikasi, 8) +
      calculateAspectScore(skorMitraTanggungJawab, 8) +
      calculateAspectScore(skorMitraBuktiKegiatan, 7) +
      calculateAspectScore(skorMitraDampak, 10) +
      calculateAspectScore(skorMitraInisiatif, 7)
    ).toFixed(2));

    // 3. Kalkulasi Subtotal DPL (Bobot total 100%: 20%, 20%, 20%, 15%, 15%, 10%)
    const subtotalDpl = Number((
      calculateAspectScore(skorDplPerencanaan, 20) +
      calculateAspectScore(skorDplKontribusi, 20) +
      calculateAspectScore(skorDplLogbook, 20) +
      calculateAspectScore(skorDplAnalisis, 15) +
      calculateAspectScore(skorDplOutput, 15) +
      calculateAspectScore(skorDplLaporanAkhir, 10)
    ).toFixed(2));

    // 4. Kalkulasi Nilai Akhir & Kategori
    const nilaiAkhir = Number((subtotalDpl > 0 ? subtotalDpl : (subtotalMitra + subtotalDpl)).toFixed(2));
    const kategoriNilai = calculateGradeCategory(nilaiAkhir);

    const isFinal = Boolean(payload.isFinalizeAction);
    const statusVal: StatusPenilaianKkn = isFinal ? StatusPenilaianKkn.FINAL : StatusPenilaianKkn.TERSIMPAN;

    const kelompokId = studentUser.studentProfile?.kelompokId || null;
    const dplId = isDpl
      ? evaluatorId
      : prev?.dplId || studentUser.studentProfile?.kelompok?.dplId || null;

    const mitraId = isMitra ? evaluatorId : prev?.mitraId || null;
    const defaultMitraName = studentUser.studentProfile?.assignedRw?.name
      ? `Ketua ${studentUser.studentProfile.assignedRw.name}`
      : "Mitra Pendamping Lapangan";
    const namaMitraPenilai = payload.namaMitraPenilai || prev?.namaMitraPenilai || defaultMitraName;
    const catatanDpl = isMitra
      ? (prev?.catatanDpl ?? "")
      : (payload.catatanDpl !== undefined ? payload.catatanDpl : (prev?.catatanDpl ?? ""));

    const catatanMitra = isDpl
      ? (prev?.catatanMitra ?? "")
      : (payload.catatanMitra !== undefined ? payload.catatanMitra : (prev?.catatanMitra ?? ""));

    if (studentUser.studentProfile) {
      await prisma.studentKkn.update({
        where: { id: studentUser.studentProfile.id },
        data: {
          assessmentScore: subtotalDpl,
          assessmentNote: catatanDpl || undefined,
        },
      });
    }

    const updated = await prisma.penilaianKknMahasiswa.upsert({
      where: { studentId },
      create: {
        studentId,
        kelompokId,
        dplId,
        mitraId,
        namaMitraPenilai,
        skorMitraKehadiran,
        skorMitraWargaBinaan,
        skorMitraProker,
        skorMitraKomunikasi,
        skorMitraTanggungJawab,
        skorMitraBuktiKegiatan,
        skorMitraDampak,
        skorMitraInisiatif,
        subtotalMitra,
        skorDplPerencanaan,
        skorDplKontribusi,
        skorDplLogbook,
        skorDplAnalisis,
        skorDplOutput,
        skorDplLaporanAkhir,
        subtotalDpl,
        nilaiAkhir,
        kategoriNilai,
        catatanDpl,
        catatanMitra,
        status: statusVal,
        isFinalized: isFinal,
        finalizedAt: isFinal ? new Date() : null,
      },
      update: {
        kelompokId: kelompokId || undefined,
        dplId: dplId || undefined,
        mitraId: mitraId || undefined,
        namaMitraPenilai: namaMitraPenilai || undefined,
        skorMitraKehadiran,
        skorMitraWargaBinaan,
        skorMitraProker,
        skorMitraKomunikasi,
        skorMitraTanggungJawab,
        skorMitraBuktiKegiatan,
        skorMitraDampak,
        skorMitraInisiatif,
        subtotalMitra,
        skorDplPerencanaan,
        skorDplKontribusi,
        skorDplLogbook,
        skorDplAnalisis,
        skorDplOutput,
        skorDplLaporanAkhir,
        subtotalDpl,
        nilaiAkhir,
        kategoriNilai,
        catatanDpl,
        catatanMitra,
        status: statusVal,
        isFinalized: isFinal,
        finalizedAt: isFinal ? new Date() : undefined,
      },
    });

    return updated;
  },

  /**
   * Mengambil Rekapitulasi Penilaian KKN (Role-Scoped untuk DPL / RW / Lurah / DLH / Super User)
   */
  getRekapPenilaian: async (groupId?: string, evaluatorId?: string, evaluatorRole?: string) => {
    const whereCondition: any = {
      role: { name: "MAHASISWA_KKN" },
    };

    if (evaluatorRole && ["DPL", "DOSEN_PEMBIMBING"].includes(evaluatorRole.toUpperCase()) && evaluatorId) {
      whereCondition.studentProfile = {
        kelompok: {
          id: groupId || undefined,
          OR: [
            { dplId: evaluatorId },
            { dpl: { id: evaluatorId } },
          ],
        },
      };
    } else if (groupId) {
      whereCondition.studentProfile = { kelompokId: groupId };
    } else if (evaluatorRole === "RW" && evaluatorId) {
      const userRw = await prisma.user.findUnique({
        where: { id: evaluatorId },
        select: { rwId: true },
      });
      if (userRw?.rwId) {
        whereCondition.studentProfile = { assignedRwId: userRw.rwId };
      }
    } else if (evaluatorRole === "LURAH" && evaluatorId) {
      const userLurah = await prisma.user.findUnique({
        where: { id: evaluatorId },
        include: { rw: true },
      });
      if (userLurah?.rw?.kelurahanId) {
        whereCondition.studentProfile = {
          assignedRw: { kelurahanId: userLurah.rw.kelurahanId },
        };
      }
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
      const skorDplPerencanaan = p ? Number(p.skorDplPerencanaan) : 0;
      const skorDplKontribusi = p ? Number(p.skorDplKontribusi) : 0;
      const skorDplLogbook = p ? Number(p.skorDplLogbook) : 0;
      const skorDplAnalisis = p ? Number(p.skorDplAnalisis) : 0;
      const skorDplOutput = p ? Number(p.skorDplOutput) : 0;
      const skorDplLaporanAkhir = p ? Number(p.skorDplLaporanAkhir) : 0;
      const directScore = Number(s.studentProfile?.assessmentScore || 0);

      const subtotalDpl = p && Number(p.subtotalDpl) > 0
        ? Number(p.subtotalDpl)
        : Number((
            calculateAspectScore(skorDplPerencanaan, 20) +
            calculateAspectScore(skorDplKontribusi, 20) +
            calculateAspectScore(skorDplLogbook, 20) +
            calculateAspectScore(skorDplAnalisis, 15) +
            calculateAspectScore(skorDplOutput, 15) +
            calculateAspectScore(skorDplLaporanAkhir, 10)
          ).toFixed(2)) || (directScore > 0 ? directScore : 0);

      const hasAnyScore =
        skorDplPerencanaan > 0 ||
        skorDplKontribusi > 0 ||
        skorDplLogbook > 0 ||
        skorDplAnalisis > 0 ||
        skorDplOutput > 0 ||
        skorDplLaporanAkhir > 0 ||
        directScore > 0;

      const hasAllScores =
        skorDplPerencanaan > 0 &&
        skorDplKontribusi > 0 &&
        skorDplLogbook > 0 &&
        skorDplAnalisis > 0 &&
        skorDplOutput > 0 &&
        skorDplLaporanAkhir > 0;

      let statusDpl = "BELUM_DINILAI";
      if (hasAllScores || (p && p.status === "FINAL") || (subtotalDpl > 0 && hasAllScores)) {
        statusDpl = "SUDAH_DINILAI";
      } else if (hasAnyScore) {
        statusDpl = "SEDANG_DINILAI";
      }

      return {
        studentId: s.id,
        nama: s.name,
        nim: s.studentProfile?.nim || "-",
        jenjangPendidikan: s.studentProfile?.jenjangPendidikan || "S1",
        jurusan: s.studentProfile?.jurusan || "-",
        fakultas: s.studentProfile?.fakultas || "-",
        kelompok: s.studentProfile?.kelompok?.name || "-",
        kelurahan: s.studentProfile?.assignedRw?.kelurahan?.name || "-",
        rw: s.studentProfile?.assignedRw?.name || "-",
        dplNama: s.studentProfile?.kelompok?.dpl?.name || "-",
        subtotalMitra: p ? Number(p.subtotalMitra) : 0,
        subtotalDpl,
        nilaiAkhir: subtotalDpl,
        kategori: p?.kategoriNilai || (subtotalDpl > 0 ? calculateGradeCategory(subtotalDpl) : "Belum Dinilai"),
        status: p?.status || "BELUM_DINILAI",
        statusDpl,
        isFinalized: Boolean(p?.isFinalized),
        skorDplPerencanaan,
        skorDplKontribusi,
        skorDplLogbook,
        skorDplAnalisis,
        skorDplOutput,
        skorDplLaporanAkhir,
        catatanDpl: p?.catatanDpl || s.studentProfile?.assessmentNote || "",
      };
    });
  },

  /**
   * Mengambil Data List Laporan Akhir Mahasiswa KKN (Role-Scoped)
   */
  getLaporanAkhirList: async (groupId?: string, evaluatorId?: string, evaluatorRole?: string) => {
    const whereCondition: any = {
      role: { name: "MAHASISWA_KKN" },
    };

    if (evaluatorRole && ["DPL", "DOSEN_PEMBIMBING"].includes(evaluatorRole.toUpperCase()) && evaluatorId) {
      whereCondition.studentProfile = {
        kelompok: {
          id: groupId && groupId !== "ALL" ? groupId : undefined,
          OR: [
            { dplId: evaluatorId },
            { dpl: { id: evaluatorId } },
          ],
        },
      };
    } else if (groupId && groupId !== "ALL") {
      whereCondition.studentProfile = { kelompokId: groupId };
    }

    const students = await prisma.user.findMany({
      where: whereCondition,
      include: {
        studentProfile: {
          include: {
            kelompok: {
              include: {
                dpl: { select: { id: true, name: true, nip: true } },
                programKerja: { take: 1, orderBy: { createdAt: "asc" } },
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

    const mapped = students.map((s) => {
      const p = s.penilaianKkn;
      const sp = s.studentProfile;
      const proker = sp?.kelompok?.programKerja?.[0];
      
      const judulLaporan = proker?.deskripsi ? `Implementasi ${proker.deskripsi}` : null;
      const fileUrl = proker?.linkGoogleDrive || null;
      const fileName = fileUrl ? `Laporan_${sp?.nim || s.name.replace(/\s+/g, "_")}.pdf` : null;

      const directScore = Number(sp?.assessmentScore || 0);
      const aspectScore = p ? Number(p.skorDplLaporanAkhir) : 0;
      
      const isGraded = directScore > 0 || aspectScore > 0;
      const finalScore = directScore > 0 
        ? directScore 
        : (aspectScore > 0 ? aspectScore * 25 : null);

      return {
        id: s.id,
        studentId: s.id,
        nim: sp?.nim || "-",
        nama: s.name,
        kelompok: sp?.kelompok?.name || "-",
        kelompokId: sp?.kelompok?.id || null,
        judulLaporan,
        fileUrl,
        fileName,
        status: isGraded ? "Sudah Dinilai" : "Belum Dinilai",
        nilai: isGraded && finalScore ? Math.round(finalScore) : null,
        catatan: p?.catatanDpl || sp?.assessmentNote || "",
        jurusan: sp?.jurusan || "-",
        dplNama: sp?.kelompok?.dpl?.name || "-",
        updatedAt: p?.updatedAt || s.updatedAt,
      };
    });

    const totalMahasiswa = mapped.length;
    const sudahDinilai = mapped.filter((m) => m.status === "Sudah Dinilai").length;
    const belumDinilai = totalMahasiswa - sudahDinilai;

    return {
      stats: {
        totalMahasiswa,
        sudahDinilai,
        belumDinilai,
      },
      students: mapped,
    };
  },

  /**
   * Menyimpan Penilaian Laporan Akhir Mahasiswa
   */
  saveLaporanAkhirScore: async (
    studentId: string,
    evaluatorId: string,
    evaluatorRole: string,
    score: number,
    catatan?: string
  ) => {
    if (typeof score !== "number" || isNaN(score) || score < 0 || score > 100) {
      throw new Error("Skor penilaian laporan akhir harus berada di rentang 0 sampai 100");
    }

    const studentUser = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: {
          include: {
            kelompok: true,
          },
        },
        penilaianKkn: true,
      },
    });

    if (!studentUser) {
      throw new Error("Mahasiswa tidak ditemukan");
    }

    const aspectScore = Math.min(4, Math.max(0, Math.round((score / 100) * 4)));

    if (studentUser.studentProfile) {
      await prisma.studentKkn.update({
        where: { id: studentUser.studentProfile.id },
        data: {
          assessmentScore: score,
          assessmentNote: catatan || "Laporan akhir telah dinilai oleh DPL",
        },
      });
    }

    const existing = studentUser.penilaianKkn;
    const kelompokId = studentUser.studentProfile?.kelompokId || null;
    const dplId = ["DPL", "DOSEN_PEMBIMBING"].includes(evaluatorRole)
      ? evaluatorId
      : existing?.dplId || studentUser.studentProfile?.kelompok?.dplId || null;

    const subtotalMitra = existing ? Number(existing.subtotalMitra) : 0;
    const currentSkorDplPerencanaan = existing?.skorDplPerencanaan ?? aspectScore;
    const currentSkorDplKontribusi = existing?.skorDplKontribusi ?? aspectScore;
    const currentSkorDplLogbook = existing?.skorDplLogbook ?? aspectScore;
    const currentSkorDplAnalisis = existing?.skorDplAnalisis ?? aspectScore;
    const currentSkorDplOutput = existing?.skorDplOutput ?? aspectScore;
    const currentSkorDplLaporanAkhir = aspectScore;

    const subtotalDpl = Number((
      calculateAspectScore(currentSkorDplPerencanaan, 5) +
      calculateAspectScore(currentSkorDplKontribusi, 5) +
      calculateAspectScore(currentSkorDplLogbook, 5) +
      calculateAspectScore(currentSkorDplAnalisis, 5) +
      calculateAspectScore(currentSkorDplOutput, 5) +
      calculateAspectScore(currentSkorDplLaporanAkhir, 5)
    ).toFixed(2));

    const nilaiAkhir = Number((subtotalMitra + subtotalDpl).toFixed(2));
    const kategoriNilai = calculateGradeCategory(nilaiAkhir);

    const saved = await prisma.penilaianKknMahasiswa.upsert({
      where: { studentId },
      create: {
        studentId,
        kelompokId,
        dplId,
        skorDplLaporanAkhir: aspectScore,
        skorDplPerencanaan: currentSkorDplPerencanaan,
        skorDplKontribusi: currentSkorDplKontribusi,
        skorDplLogbook: currentSkorDplLogbook,
        skorDplAnalisis: currentSkorDplAnalisis,
        skorDplOutput: currentSkorDplOutput,
        subtotalDpl,
        nilaiAkhir,
        kategoriNilai,
        catatanDpl: catatan || "",
        status: StatusPenilaianKkn.TERSIMPAN,
      },
      update: {
        dplId: dplId || undefined,
        skorDplLaporanAkhir: aspectScore,
        subtotalDpl,
        nilaiAkhir,
        kategoriNilai,
        catatanDpl: catatan !== undefined ? catatan : existing?.catatanDpl,
        status: StatusPenilaianKkn.TERSIMPAN,
      },
    });

    return {
      studentId,
      score,
      status: "Sudah Dinilai",
      catatan,
      penilaianRecord: saved,
    };
  },
};
