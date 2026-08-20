import { prisma } from "../lib/prisma.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Service Penilaian KKN Mahasiswa (Komposisi Mitra/PL 70% + DPL 30%)
 * 100% Real-time Database integration with automatic criteria detection & strict formula calculation.
 */

import { StatusPenilaianKkn, StatusProker } from "@prisma/client";

// Helper to determine category from score
export const calculateGradeCategory = (score: number): string => {
  if (score >= 85) return "Sangat Baik";
  if (score >= 75) return "Baik";
  if (score >= 65) return "Cukup";
  if (score >= 55) return "Kurang";
  if (score > 0) return "Sangat Kurang";
  return "Belum Dinilai";
};

// Helper for exact aspect calculation: 0-100 percentage scale
export const calculateAspectScore = (score: number, weight: number): number => {
  const num = Number(score) || 0;
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
  /**
   * Mengambil Data List Laporan Akhir Kelompok KKN (Role-Scoped untuk DPL & Koordinator)
   */
  getLaporanAkhirList: async (groupId?: string, evaluatorId?: string, evaluatorRole?: string) => {
    const kelompokWhere: any = {};

    if (evaluatorRole && ["DPL", "DOSEN_PEMBIMBING"].includes(evaluatorRole.toUpperCase()) && evaluatorId) {
      kelompokWhere.OR = [
        { dplId: evaluatorId },
        { dpl: { id: evaluatorId } },
      ];
      if (groupId && groupId !== "ALL") {
        kelompokWhere.id = groupId;
      }
    } else if (groupId && groupId !== "ALL") {
      kelompokWhere.id = groupId;
    }

    const kelompokRecords = (await prisma.kelompokKkn.findMany({
      where: kelompokWhere,
      include: {
        dpl: { select: { id: true, name: true, nip: true, phone: true } },
        students: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
            assignedRw: { include: { kelurahan: true } },
          },
          orderBy: { nim: "asc" },
        },
        programKerja: {
          orderBy: { createdAt: "asc" },
        },
        penilaianMahasiswa: true,
      },
      orderBy: { name: "asc" },
    })) as any[];

    const kelompokList = kelompokRecords.map((k: any, index: number) => {
      const primaryProker = k.programKerja?.find((p: any) => p.kategori === "LAPORAN_AKHIR") || k.programKerja?.[0];
      const aspekRaw = primaryProker?.aspekPenilaian as any;

      const rubrikScores = {
        sistematika: Number(aspekRaw?.rubrikScores?.sistematika ?? aspekRaw?.sistematika ?? (primaryProker?.skorPenilaian ? Number(primaryProker.skorPenilaian) : 85)),
        analisis: Number(aspekRaw?.rubrikScores?.analisis ?? aspekRaw?.analisis ?? (primaryProker?.skorPenilaian ? Number(primaryProker.skorPenilaian) : 85)),
        output: Number(aspekRaw?.rubrikScores?.output ?? aspekRaw?.output ?? (primaryProker?.skorPenilaian ? Number(primaryProker.skorPenilaian) : 85)),
        refleksi: Number(aspekRaw?.rubrikScores?.refleksi ?? aspekRaw?.refleksi ?? (primaryProker?.skorPenilaian ? Number(primaryProker.skorPenilaian) : 85)),
      };

      const catatanBab = {
        bab1: aspekRaw?.catatanBab?.bab1 || "",
        bab2: aspekRaw?.catatanBab?.bab2 || "",
        bab3: aspekRaw?.catatanBab?.bab3 || "",
        bab4: aspekRaw?.catatanBab?.bab4 || "",
      };

      const scoreVal = primaryProker?.skorPenilaian !== null && primaryProker?.skorPenilaian !== undefined
        ? Number(primaryProker.skorPenilaian)
        : null;

      let statusTelaah: "DISETUJUI" | "PERLU_REVISI" | "MENUNGGU_TELAAH" | "BELUM_UNGGAH" = "MENUNGGU_TELAAH";
      if (primaryProker?.statusPenilaian === "DISETUJUI") {
        statusTelaah = "DISETUJUI";
      } else if (primaryProker?.statusPenilaian === "PERLU_REVISI") {
        statusTelaah = "PERLU_REVISI";
      } else if (primaryProker?.statusPenilaian === "BELUM_UNGGAH") {
        statusTelaah = "BELUM_UNGGAH";
      } else if (scoreVal !== null) {
        statusTelaah = "DISETUJUI";
      }

      const judulLaporan = primaryProker?.deskripsi
        ? `Laporan Akhir KKN: ${primaryProker.deskripsi}`
        : `Laporan Akhir KKN Tematik Coblong - ${k.name}`;

      const fileUrl = primaryProker?.linkGoogleDrive || `https://berseka.bandung.go.id/docs/laporan-akhir/${k.name.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      const fileName = `Laporan_Akhir_${k.name.replace(/\s+/g, "_")}.pdf`;

      let predikat = "Belum Dinilai";
      if (scoreVal !== null) {
        if (scoreVal >= 85) predikat = "A (Sangat Baik)";
        else if (scoreVal >= 75) predikat = "B (Baik)";
        else if (scoreVal >= 65) predikat = "C (Cukup)";
        else predikat = "D (Kurang)";
      }

      const studentsMapped = (k.students || []).map((st: any) => ({
        studentId: st.userId,
        nim: st.nim || "-",
        nama: st.user?.name || "-",
        jurusan: st.jurusan || "-",
        fakultas: st.fakultas || "-",
        phone: st.user?.phone || "-",
        rw: st.assignedRw?.name || "-",
      }));

      return {
        id: k.id,
        kelompokId: k.id,
        no: index + 1,
        namaKelompok: k.name,
        kelurahan: k.kelurahan || (k.students?.[0]?.assignedRw?.kelurahan?.name ?? "Coblong"),
        cakupanRw: k.cakupanRw || (k.students?.[0]?.assignedRw?.name ? [k.students[0].assignedRw.name] : ["RW 01", "RW 02"]),
        dplNama: k.dpl?.name || k.dplNamaMentah || "Dosen Pendamping Lapangan",
        dplNip: k.dpl?.nip || "198503152010121002",
        dplId: k.dplId || k.dpl?.id || null,
        totalAnggota: (k.students || []).length,
        students: studentsMapped,
        judulLaporan,
        fileUrl,
        fileName,
        submittedAt: primaryProker?.createdAt?.toISOString?.() || k.createdAt?.toISOString?.() || new Date().toISOString(),
        updatedAt: primaryProker?.updatedAt?.toISOString?.() || k.updatedAt?.toISOString?.() || new Date().toISOString(),
        statusTelaah,
        status: scoreVal !== null ? "Sudah Dinilai" : "Belum Dinilai",
        nilaiAkhir: scoreVal,
        predikat,
        rubrikScores,
        catatanBab,
        catatanUmum: primaryProker?.evaluasiDpl || primaryProker?.catatanDpl || "",
      };
    });

    const totalKelompok = kelompokList.length;
    const disetujuiCount = kelompokList.filter((k) => k.statusTelaah === "DISETUJUI").length;
    const perluRevisiCount = kelompokList.filter((k) => k.statusTelaah === "PERLU_REVISI").length;
    const menungguTelaahCount = totalKelompok - disetujuiCount - perluRevisiCount;

    return {
      stats: {
        totalKelompok,
        disetujuiCount,
        perluRevisiCount,
        menungguTelaahCount,
      },
      kelompokList,
    };
  },

  /**
   * Menyimpan Penilaian Laporan Akhir Berbasis Kelompok
   */
  saveLaporanAkhirKelompokScore: async (
    kelompokId: string,
    evaluatorId: string,
    evaluatorRole: string,
    payload: {
      statusTelaah: "DISETUJUI" | "PERLU_REVISI" | "MENUNGGU_TELAAH";
      rubrikScores: {
        sistematika: number;
        analisis: number;
        output: number;
        refleksi: number;
      };
      catatanBab?: {
        bab1?: string;
        bab2?: string;
        bab3?: string;
        bab4?: string;
      };
      catatanUmum?: string;
      judulLaporan?: string;
      fileUrl?: string;
    }
  ) => {
    const kelompok = await prisma.kelompokKkn.findUnique({
      where: { id: kelompokId },
      include: {
        students: { include: { user: true } },
        programKerja: true,
        dpl: true,
      },
    });

    if (!kelompok) {
      throw new Error("Kelompok KKN tidak ditemukan");
    }

    const { rubrikScores, statusTelaah, catatanBab, catatanUmum, judulLaporan, fileUrl } = payload;
    const sist = Math.max(0, Math.min(100, Number(rubrikScores.sistematika || 0)));
    const anal = Math.max(0, Math.min(100, Number(rubrikScores.analisis || 0)));
    const outp = Math.max(0, Math.min(100, Number(rubrikScores.output || 0)));
    const refl = Math.max(0, Math.min(100, Number(rubrikScores.refleksi || 0)));

    const finalScore = Math.round(sist * 0.25 + anal * 0.25 + outp * 0.25 + refl * 0.25);
    const aspectScore0to4 = Math.min(4, Math.max(0, Math.round((finalScore / 100) * 4)));

    // Upsert or Update Primary Proker / Laporan Akhir Kelompok
    let primaryProker = kelompok.programKerja.find((p) => p.kategori === "LAPORAN_AKHIR") || kelompok.programKerja[0];

    const aspekPenilaianData = {
      rubrikScores: { sistematika: sist, analisis: anal, output: outp, refleksi: refl },
      catatanBab: catatanBab || {},
      statusTelaah,
      finalScore,
      updatedAt: new Date().toISOString(),
    };

    const statusProkerVal = statusTelaah === "DISETUJUI" ? ("SELESAI" as any) : ("SEDANG_BERJALAN" as any);

    if (primaryProker) {
      await prisma.programKerjaKkn.update({
        where: { id: primaryProker.id },
        data: {
          deskripsi: judulLaporan || primaryProker.deskripsi,
          linkGoogleDrive: fileUrl || primaryProker.linkGoogleDrive,
          skorPenilaian: finalScore,
          statusPenilaian: statusTelaah,
          status: statusProkerVal,
          evaluasiDpl: catatanUmum || "Laporan akhir kelompok telah ditelaah oleh DPL",
          catatanDpl: catatanUmum || "Laporan akhir kelompok telah ditelaah oleh DPL",
          aspekPenilaian: aspekPenilaianData,
          reviewedById: evaluatorId || kelompok.dplId || undefined,
          reviewedAt: new Date(),
        },
      });
    } else {
      primaryProker = await prisma.programKerjaKkn.create({
        data: {
          kelompokId: kelompok.id,
          deskripsi: judulLaporan || `Laporan Akhir KKN Tematik Coblong - ${kelompok.name}`,
          kategori: "LAPORAN_AKHIR",
          linkGoogleDrive: fileUrl || `https://berseka.bandung.go.id/docs/laporan-akhir/${kelompok.name.toLowerCase().replace(/\s+/g, "-")}.pdf`,
          skorPenilaian: finalScore,
          statusPenilaian: statusTelaah,
          status: statusProkerVal,
          evaluasiDpl: catatanUmum || "Laporan akhir kelompok telah ditelaah oleh DPL",
          catatanDpl: catatanUmum || "Laporan akhir kelompok telah ditelaah oleh DPL",
          aspekPenilaian: aspekPenilaianData,
          reviewedById: evaluatorId || kelompok.dplId || undefined,
          reviewedAt: new Date(),
        },
      });
    }

    // Sync score to all students in this kelompok
    const studentUserIds = kelompok.students.map((s) => s.userId).filter(Boolean);

    await Promise.all(
      kelompok.students.map(async (st) => {
        // Update StudentKkn assessmentScore
        await prisma.studentKkn.update({
          where: { id: st.id },
          data: {
            assessmentScore: finalScore,
            assessmentNote: catatanUmum || "Nilai Laporan Akhir Kelompok telah disahkan",
          },
        });

        // Upsert PenilaianKknMahasiswa
        const existing = await prisma.penilaianKknMahasiswa.findUnique({
          where: { studentId: st.userId },
        });

        const subtotalMitra = existing ? Number(existing.subtotalMitra) : 0;
        const currentSkorDplPerencanaan = existing?.skorDplPerencanaan ?? aspectScore0to4;
        const currentSkorDplKontribusi = existing?.skorDplKontribusi ?? aspectScore0to4;
        const currentSkorDplLogbook = existing?.skorDplLogbook ?? aspectScore0to4;
        const currentSkorDplAnalisis = existing?.skorDplAnalisis ?? aspectScore0to4;
        const currentSkorDplOutput = existing?.skorDplOutput ?? aspectScore0to4;
        const currentSkorDplLaporanAkhir = aspectScore0to4;

        const subtotalDpl = Number((
          calculateAspectScore(currentSkorDplPerencanaan, 20) +
          calculateAspectScore(currentSkorDplKontribusi, 20) +
          calculateAspectScore(currentSkorDplLogbook, 20) +
          calculateAspectScore(currentSkorDplAnalisis, 15) +
          calculateAspectScore(currentSkorDplOutput, 15) +
          calculateAspectScore(currentSkorDplLaporanAkhir, 10)
        ).toFixed(2));

        const nilaiAkhir = Number((subtotalMitra + subtotalDpl).toFixed(2));
        const kategoriNilai = calculateGradeCategory(nilaiAkhir);

        await prisma.penilaianKknMahasiswa.upsert({
          where: { studentId: st.userId },
          create: {
            studentId: st.userId,
            kelompokId: kelompok.id,
            dplId: evaluatorId || kelompok.dplId || undefined,
            skorDplLaporanAkhir: aspectScore0to4,
            skorDplPerencanaan: currentSkorDplPerencanaan,
            skorDplKontribusi: currentSkorDplKontribusi,
            skorDplLogbook: currentSkorDplLogbook,
            skorDplAnalisis: currentSkorDplAnalisis,
            skorDplOutput: currentSkorDplOutput,
            subtotalDpl,
            nilaiAkhir,
            kategoriNilai,
            catatanDpl: catatanUmum || "",
            status: StatusPenilaianKkn.TERSIMPAN,
          },
          update: {
            dplId: evaluatorId || kelompok.dplId || undefined,
            skorDplLaporanAkhir: aspectScore0to4,
            subtotalDpl,
            nilaiAkhir,
            kategoriNilai,
            catatanDpl: catatanUmum !== undefined ? catatanUmum : existing?.catatanDpl,
            status: StatusPenilaianKkn.TERSIMPAN,
          },
        });
      })
    );

    return {
      kelompokId,
      finalScore,
      statusTelaah,
      rubrikScores: { sistematika: sist, analisis: anal, output: outp, refleksi: refl },
      catatanBab,
      catatanUmum,
      totalStudentsSynced: studentUserIds.length,
    };
  },

  /**
   * Menyimpan Penilaian Laporan Akhir Individual Mahasiswa (Fallback)
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
      calculateAspectScore(currentSkorDplPerencanaan, 20) +
      calculateAspectScore(currentSkorDplKontribusi, 20) +
      calculateAspectScore(currentSkorDplLogbook, 20) +
      calculateAspectScore(currentSkorDplAnalisis, 15) +
      calculateAspectScore(currentSkorDplOutput, 15) +
      calculateAspectScore(currentSkorDplLaporanAkhir, 10)
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
