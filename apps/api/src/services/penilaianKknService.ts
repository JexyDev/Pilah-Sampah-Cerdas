import { prisma } from "../lib/prisma.js";
import { configService } from "./configService.js";
/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Service Penilaian KKN Mahasiswa (Komposisi Mitra/MPL 50% + DPL 50%)
 * 100% Real-time Database integration with automatic criteria detection & strict formula calculation.
 */

import { StatusPenilaianKkn, StatusProker, StatusLogbookKkn } from "@prisma/client";

// Helper to determine category from score (Grading A-E)
export const calculateGradeCategory = (score: number): string => {
  const num = Number(score) || 0;
  if (num >= 80) return "A";
  if (num >= 70) return "B";
  if (num >= 60) return "C";
  if (num >= 50) return "D";
  if (num > 0) return "E";
  return "Belum Dinilai";
};

// Helper for exact aspect calculation: 0-100 percentage scale
export const calculateAspectScore = (score: number, weight: number): number => {
  const num = Number(score) || 0;
  const safeScore = Math.max(0, Math.min(100, num));
  return Number(((safeScore * weight) / 100).toFixed(2));
};

// Helper to calculate composite final score (Mitra 50% + DPL 50%)
export const calculateCompositeScore = (subtotalMitra: number, subtotalDpl: number): number => {
  const sMitra = Number(subtotalMitra) || 0;
  const sDpl = Number(subtotalDpl) || 0;

  if (sMitra > 0 && sDpl > 0) {
    return Number((sMitra * 0.5 + sDpl * 0.5).toFixed(2));
  }
  if (sDpl > 0) {
    return Number(sDpl.toFixed(2));
  }
  if (sMitra > 0) {
    return Number(sMitra.toFixed(2));
  }
  return 0;
};

export const penilaianKknService = {
  /**
   * Mengambil data lengkap mahasiswa dan penilaian aktif (beserta kalkulasi otomatis data lapangan)
   */
  getStudentPenilaianData: async (
    studentId: string,
    evaluatorId?: string,
    evaluatorRole?: string
  ) => {
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

    // Strict Scope: Jika evaluator DPL, pastikan mahasiswa berada di bawah kelompok dampingannya
    if (
      evaluatorRole &&
      ["DPL", "DOSEN_PEMBIMBING", "DOSEN_PENDAMPING"].includes(evaluatorRole.toUpperCase()) &&
      evaluatorId
    ) {
      let isSupervised = dpl?.id === evaluatorId || kelompok?.dplId === evaluatorId;
      if (!isSupervised) {
        const evalUser = await prisma.user.findUnique({
          where: { id: evaluatorId },
          select: { name: true, phone: true, nip: true },
        });
        if (evalUser) {
          if (
            kelompok?.dplNamaMentah &&
            evalUser.name &&
            kelompok.dplNamaMentah.toLowerCase().trim() === evalUser.name.toLowerCase().trim()
          ) {
            isSupervised = true;
          } else if (dpl?.phone && evalUser.phone && dpl.phone === evalUser.phone) {
            isSupervised = true;
          } else if (dpl?.nip && evalUser.nip && dpl.nip === evalUser.nip) {
            isSupervised = true;
          }
        }
      }
      if (!isSupervised) {
        throw new Error(
          "Akses ditolak: Mahasiswa ini bukan bagian dari kelompok dampingan DPL Anda"
        );
      }
    }

    // 1. Hitung Kehadiran Real dari Database (Strict schedule scope)
    const pastSchedulesCount = await prisma.schedule
      .count({
        where: {
          OR: [{ kelompokId: kelompok?.id }, { kelompokId: null }],
          date: { lte: new Date() },
        },
      })
      .catch(() => 0);

    const attendancesCount = await prisma.activityAttendance
      .count({
        where: {
          studentId,
          status: "DALAM_RADIUS",
          schedule: {
            OR: [{ kelompokId: kelompok?.id }, { kelompokId: null }],
            date: { lte: new Date() },
          },
        },
      })
      .catch(() => 0);

    const attendanceRate =
      pastSchedulesCount > 0
        ? Math.min(100, Math.round((attendancesCount / pastSchedulesCount) * 100))
        : 0;

    // 2. Hitung Warga Binaan Real dari Database (Berdasarkan Tempat Sampah/Bin pendaftaran mahasiswa, fallback ke RW)
    const directRegisteredBinsCount = await prisma.bin
      .count({
        where: { registeredByStudentId: studentId },
      })
      .catch(() => 0);

    let wargaBinaanCount = directRegisteredBinsCount;
    if (wargaBinaanCount === 0) {
      const rwWarga = await prisma.user
        .count({
          where: {
            rwId: profile?.assignedRwId || studentUser.rwId || undefined,
            role: { name: "WARGA" },
          },
        })
        .catch(() => 0);
      wargaBinaanCount = rwWarga;
    }

    // 3. Hitung Program Kerja Aktif / Selesai
    const prokerCount = kelompok?.id
      ? await prisma.programKerjaKkn
          .count({
            where: { kelompokId: kelompok.id },
          })
          .catch(() => 0)
      : 0;

    // 3b. Hitung Kepatuhan Logbook KKN (Target standar & bobot dinamis dari Rule Engine)
    const ruleConfigs = await configService.getRuleEngineConfigs().catch(() => null);
    const targetLogbook = ruleConfigs?.logbookTargetKegiatan || 24;
    const bobotLogbook = ruleConfigs?.logbookBobotPersen || 20;

    const approvedLogbookCount = await prisma.logbookKkn
      .count({
        where: {
          statusApproval: StatusLogbookKkn.DISETUJUI_DPL,
          OR: [{ penulisId: studentId }, ...(kelompok?.id ? [{ kelompokId: kelompok.id }] : [])],
        },
      })
      .catch(() => 0);

    const totalSubmittedLogbooks = await prisma.logbookKkn
      .count({
        where: {
          OR: [{ penulisId: studentId }, ...(kelompok?.id ? [{ kelompokId: kelompok.id }] : [])],
        },
      })
      .catch(() => 0);

    const calculatedLogbookScore = Math.min(
      100,
      Math.round((approvedLogbookCount / targetLogbook) * 100)
    );

    // 4. Mitra Penilai (Ketua RW atau Mitra Lapangan)
    const namaMitra = rw?.name
      ? `Ketua ${rw.name} (${kelurahan?.name || "Coblong"})`
      : "Mitra Pendamping Lapangan (MPL) RW";

    // 5. Existing Penilaian Record - Default 0 jika belum dinilai di database
    const existing = studentUser.penilaianKkn;

    const assessment = existing
      ? {
          ...existing,
          skorDplLogbook:
            existing.skorDplLogbook > 0 ? existing.skorDplLogbook : calculatedLogbookScore,
        }
      : {
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
          skorDplLogbook: calculatedLogbookScore,
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

    // Calculate dynamic subtotal from actual aspect scores (Skala 0-100 per aspek)
    const subMitra =
      calculateAspectScore(assessment.skorMitraKehadiran, 15) +
      calculateAspectScore(assessment.skorMitraWargaBinaan, 15) +
      calculateAspectScore(assessment.skorMitraProker, 15) +
      calculateAspectScore(assessment.skorMitraKomunikasi, 10) +
      calculateAspectScore(assessment.skorMitraTanggungJawab, 10) +
      calculateAspectScore(assessment.skorMitraBuktiKegiatan, 10) +
      calculateAspectScore(assessment.skorMitraDampak, 15) +
      calculateAspectScore(assessment.skorMitraInisiatif, 10);

    // DPL academic 6 aspects (Total Bobot 100%: Perencanaan 20%, Kontribusi 10%, Logbook dinamis [default 20%], Analisis 20%, Output 20%, Laporan Akhir 10%)
    const subDpl =
      calculateAspectScore(assessment.skorDplPerencanaan, 20) +
      calculateAspectScore(assessment.skorDplKontribusi, 10) +
      calculateAspectScore(assessment.skorDplLogbook, bobotLogbook) +
      calculateAspectScore(assessment.skorDplAnalisis, 20) +
      calculateAspectScore(assessment.skorDplOutput, 20) +
      calculateAspectScore(assessment.skorDplLaporanAkhir, 10);

    const totalNilai = calculateCompositeScore(subMitra, subDpl);
    const kategori =
      totalNilai === 0 && !existing ? "Belum Dinilai" : calculateGradeCategory(totalNilai);

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
        approvedLogbookCount,
        totalSubmittedLogbooks,
        logbookComplianceScore: calculatedLogbookScore,
        isLogbookValid: approvedLogbookCount >= targetLogbook,
        targetLogbook,
        bobotLogbook,
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

    const normRole = String(evaluatorRole || "").toUpperCase();
    if (normRole === "PEMIMPIN" || normRole === "PIMPINAN") {
      throw new Error(
        "FORBIDDEN_ROLE: Role Pimpinan hanya memiliki akses View-Only dan tidak dapat menginput/mengubah penilaian."
      );
    }

    const isDpl = ["DPL", "DOSEN_PEMBIMBING", "DOSEN_PENDAMPING"].includes(normRole);
    const isMpl = ["MPL", "MITRA_PENDAMPING_LAPANGAN", "MITRA_PEMBIMBING_LAPANGAN"].includes(
      normRole
    );
    const isMitra =
      isMpl || ["RW", "MITRA", "ADMIN_DLH", "DLH", "LURAH", "KELURAHAN"].includes(normRole);

    // Strict Scope: DPL hanya dapat menilai mahasiswa di bawah dampingannya
    if (isDpl && evaluatorId) {
      const isSupervised =
        studentUser.studentProfile?.kelompok?.dplId === evaluatorId ||
        studentUser.studentProfile?.kelompok?.dpl?.id === evaluatorId;
      if (!isSupervised) {
        throw new Error(
          "Akses ditolak: Anda hanya berwenang menilai mahasiswa di bawah dampingan DPL Anda"
        );
      }
    }

    if (studentUser.penilaianKkn?.isFinalized && !["SUPER_USER", "DEVELOPER"].includes(normRole)) {
      throw new Error(
        "Penilaian telah difinalisasi dan dikunci. Hubungi Administrator untuk pembukaan kunci."
      );
    }

    const prev = studentUser.penilaianKkn;

    // Merge scores safely in unified 0-100 scale
    const skorMitraKehadiran = isDpl
      ? (prev?.skorMitraKehadiran ?? 0)
      : payload.skorMitraKehadiran !== undefined
        ? Number(payload.skorMitraKehadiran)
        : (prev?.skorMitraKehadiran ?? 0);

    const skorMitraWargaBinaan = isDpl
      ? (prev?.skorMitraWargaBinaan ?? 0)
      : payload.skorMitraWargaBinaan !== undefined
        ? Number(payload.skorMitraWargaBinaan)
        : (prev?.skorMitraWargaBinaan ?? 0);

    const skorMitraProker = isDpl
      ? (prev?.skorMitraProker ?? 0)
      : payload.skorMitraProker !== undefined
        ? Number(payload.skorMitraProker)
        : (prev?.skorMitraProker ?? 0);

    const skorMitraKomunikasi = isDpl
      ? (prev?.skorMitraKomunikasi ?? 0)
      : payload.skorMitraKomunikasi !== undefined
        ? Number(payload.skorMitraKomunikasi)
        : (prev?.skorMitraKomunikasi ?? 0);

    const skorMitraTanggungJawab = isDpl
      ? (prev?.skorMitraTanggungJawab ?? 0)
      : payload.skorMitraTanggungJawab !== undefined
        ? Number(payload.skorMitraTanggungJawab)
        : (prev?.skorMitraTanggungJawab ?? 0);

    const skorMitraBuktiKegiatan = isDpl
      ? (prev?.skorMitraBuktiKegiatan ?? 0)
      : payload.skorMitraBuktiKegiatan !== undefined
        ? Number(payload.skorMitraBuktiKegiatan)
        : (prev?.skorMitraBuktiKegiatan ?? 0);

    const skorMitraDampak = isDpl
      ? (prev?.skorMitraDampak ?? 0)
      : payload.skorMitraDampak !== undefined
        ? Number(payload.skorMitraDampak)
        : (prev?.skorMitraDampak ?? 0);

    const skorMitraInisiatif = isDpl
      ? (prev?.skorMitraInisiatif ?? 0)
      : payload.skorMitraInisiatif !== undefined
        ? Number(payload.skorMitraInisiatif)
        : (prev?.skorMitraInisiatif ?? 0);

    const skorDplPerencanaan = isMitra
      ? (prev?.skorDplPerencanaan ?? 0)
      : payload.skorDplPerencanaan !== undefined
        ? Number(payload.skorDplPerencanaan)
        : (prev?.skorDplPerencanaan ?? 0);

    const skorDplKontribusi = isMitra
      ? (prev?.skorDplKontribusi ?? 0)
      : payload.skorDplKontribusi !== undefined
        ? Number(payload.skorDplKontribusi)
        : (prev?.skorDplKontribusi ?? 0);

    const skorDplLogbook = isMitra
      ? (prev?.skorDplLogbook ?? 0)
      : payload.skorDplLogbook !== undefined
        ? Number(payload.skorDplLogbook)
        : (prev?.skorDplLogbook ?? 0);

    const skorDplAnalisis = isMitra
      ? (prev?.skorDplAnalisis ?? 0)
      : payload.skorDplAnalisis !== undefined
        ? Number(payload.skorDplAnalisis)
        : (prev?.skorDplAnalisis ?? 0);

    const skorDplOutput = isMitra
      ? (prev?.skorDplOutput ?? 0)
      : payload.skorDplOutput !== undefined
        ? Number(payload.skorDplOutput)
        : (prev?.skorDplOutput ?? 0);

    const skorDplLaporanAkhir = isMitra
      ? (prev?.skorDplLaporanAkhir ?? 0)
      : payload.skorDplLaporanAkhir !== undefined
        ? Number(payload.skorDplLaporanAkhir)
        : (prev?.skorDplLaporanAkhir ?? 0);

    // 2. Kalkulasi Subtotal Mitra (Max 100)
    const subtotalMitra = Number(
      (
        calculateAspectScore(skorMitraKehadiran, 15) +
        calculateAspectScore(skorMitraWargaBinaan, 15) +
        calculateAspectScore(skorMitraProker, 15) +
        calculateAspectScore(skorMitraKomunikasi, 10) +
        calculateAspectScore(skorMitraTanggungJawab, 10) +
        calculateAspectScore(skorMitraBuktiKegiatan, 10) +
        calculateAspectScore(skorMitraDampak, 15) +
        calculateAspectScore(skorMitraInisiatif, 10)
      ).toFixed(2)
    );

    // 3. Kalkulasi Subtotal DPL (Bobot total 100%: Perencanaan 20%, Kontribusi 10%, Logbook 20%, Analisis 20%, Output 20%, Laporan Akhir 10%)
    const subtotalDpl = Number(
      (
        calculateAspectScore(skorDplPerencanaan, 20) +
        calculateAspectScore(skorDplKontribusi, 10) +
        calculateAspectScore(skorDplLogbook, 20) +
        calculateAspectScore(skorDplAnalisis, 20) +
        calculateAspectScore(skorDplOutput, 20) +
        calculateAspectScore(skorDplLaporanAkhir, 10)
      ).toFixed(2)
    );

    // 4. Kalkulasi Nilai Akhir & Kategori (Formula Komposisi Mitra 50% + DPL 50%)
    const nilaiAkhir = calculateCompositeScore(subtotalMitra, subtotalDpl);
    const kategoriNilai = calculateGradeCategory(nilaiAkhir);

    const isFinal = Boolean(payload.isFinalizeAction);
    const statusVal: StatusPenilaianKkn = isFinal
      ? StatusPenilaianKkn.FINAL
      : StatusPenilaianKkn.TERSIMPAN;

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
      : payload.catatanDpl !== undefined
        ? payload.catatanDpl
        : (prev?.catatanDpl ?? "");

    const catatanMitra = isDpl
      ? (prev?.catatanMitra ?? "")
      : payload.catatanMitra !== undefined
        ? payload.catatanMitra
        : (prev?.catatanMitra ?? "");

    if (studentUser.studentProfile) {
      await prisma.studentKkn.update({
        where: { id: studentUser.studentProfile.id },
        data: {
          assessmentScore: subtotalDpl,
          assessmentNote: catatanDpl || undefined,
          isAssessed: true,
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
        skorMitraKehadiran: Math.round(skorMitraKehadiran),
        skorMitraWargaBinaan: Math.round(skorMitraWargaBinaan),
        skorMitraProker: Math.round(skorMitraProker),
        skorMitraKomunikasi: Math.round(skorMitraKomunikasi),
        skorMitraTanggungJawab: Math.round(skorMitraTanggungJawab),
        skorMitraBuktiKegiatan: Math.round(skorMitraBuktiKegiatan),
        skorMitraDampak: Math.round(skorMitraDampak),
        skorMitraInisiatif: Math.round(skorMitraInisiatif),
        subtotalMitra,
        skorDplPerencanaan: Math.round(skorDplPerencanaan),
        skorDplKontribusi: Math.round(skorDplKontribusi),
        skorDplLogbook: Math.round(skorDplLogbook),
        skorDplAnalisis: Math.round(skorDplAnalisis),
        skorDplOutput: Math.round(skorDplOutput),
        skorDplLaporanAkhir: Math.round(skorDplLaporanAkhir),
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
        skorMitraKehadiran: Math.round(skorMitraKehadiran),
        skorMitraWargaBinaan: Math.round(skorMitraWargaBinaan),
        skorMitraProker: Math.round(skorMitraProker),
        skorMitraKomunikasi: Math.round(skorMitraKomunikasi),
        skorMitraTanggungJawab: Math.round(skorMitraTanggungJawab),
        skorMitraBuktiKegiatan: Math.round(skorMitraBuktiKegiatan),
        skorMitraDampak: Math.round(skorMitraDampak),
        skorMitraInisiatif: Math.round(skorMitraInisiatif),
        subtotalMitra,
        skorDplPerencanaan: Math.round(skorDplPerencanaan),
        skorDplKontribusi: Math.round(skorDplKontribusi),
        skorDplLogbook: Math.round(skorDplLogbook),
        skorDplAnalisis: Math.round(skorDplAnalisis),
        skorDplOutput: Math.round(skorDplOutput),
        skorDplLaporanAkhir: Math.round(skorDplLaporanAkhir),
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

    if (
      evaluatorRole &&
      ["DPL", "DOSEN_PEMBIMBING"].includes(evaluatorRole.toUpperCase()) &&
      evaluatorId
    ) {
      const evalUser = await prisma.user.findUnique({
        where: { id: evaluatorId },
        select: { id: true, name: true, phone: true, nip: true },
      });
      const dplOr: any[] = [{ dplId: evaluatorId }, { dpl: { id: evaluatorId } }];
      if (evalUser?.name) {
        dplOr.push({ dplNamaMentah: { equals: evalUser.name.trim(), mode: "insensitive" } });
        dplOr.push({ dpl: { name: { equals: evalUser.name.trim(), mode: "insensitive" } } });
      }
      if (evalUser?.phone) dplOr.push({ dpl: { phone: evalUser.phone } });
      if (evalUser?.nip) dplOr.push({ dpl: { nip: evalUser.nip } });

      whereCondition.studentProfile = {
        kelompok: {
          id: groupId || undefined,
          OR: dplOr,
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
      const userRw = userLurah?.rw as any;
      const kelurahanId = userRw?.kelurahanId || userRw?.kelurahan?.id;
      if (kelurahanId) {
        whereCondition.studentProfile = {
          assignedRw: {
            kelurahanId: kelurahanId,
          },
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
              include: {
                kelurahan: true,
              },
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

      const subtotalDpl =
        p && Number(p.subtotalDpl) > 0
          ? Number(p.subtotalDpl)
          : Number(
              (
                calculateAspectScore(skorDplPerencanaan, 20) +
                calculateAspectScore(skorDplKontribusi, 10) +
                calculateAspectScore(skorDplLogbook, 20) +
                calculateAspectScore(skorDplAnalisis, 20) +
                calculateAspectScore(skorDplOutput, 20) +
                calculateAspectScore(skorDplLaporanAkhir, 10)
              ).toFixed(2)
            ) || (directScore > 0 ? directScore : 0);

      const subtotalMitra = p ? Number(p.subtotalMitra) : 0;
      const calculatedNilaiAkhir = calculateCompositeScore(subtotalMitra, subtotalDpl);
      const finalNilai =
        p && Number(p.nilaiAkhir) > 0 ? Number(p.nilaiAkhir) : calculatedNilaiAkhir;

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
        subtotalMitra,
        subtotalDpl,
        nilaiAkhir: finalNilai,
        kategori:
          p?.kategoriNilai ||
          (finalNilai > 0 ? calculateGradeCategory(finalNilai) : "Belum Dinilai"),
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
   * Mengambil Data List Laporan Akhir Kelompok KKN (Role-Scoped untuk DPL & Koordinator)
   */
  getLaporanAkhirList: async (groupId?: string, evaluatorId?: string, evaluatorRole?: string) => {
    const kelompokWhere: any = {};

    if (
      evaluatorRole &&
      ["DPL", "DOSEN_PEMBIMBING"].includes(evaluatorRole.toUpperCase()) &&
      evaluatorId
    ) {
      const evalUser = await prisma.user.findUnique({
        where: { id: evaluatorId },
        select: { id: true, name: true, phone: true, nip: true },
      });
      const dplOr: any[] = [{ dplId: evaluatorId }, { dpl: { id: evaluatorId } }];
      if (evalUser?.name) {
        dplOr.push({ dplNamaMentah: { equals: evalUser.name.trim(), mode: "insensitive" } });
        dplOr.push({ dpl: { name: { equals: evalUser.name.trim(), mode: "insensitive" } } });
      }
      if (evalUser?.phone) dplOr.push({ dpl: { phone: evalUser.phone } });
      if (evalUser?.nip) dplOr.push({ dpl: { nip: evalUser.nip } });

      kelompokWhere.OR = dplOr;
      if (groupId && groupId !== "ALL") {
        kelompokWhere.id = groupId;
      }
    } else if (groupId && groupId !== "ALL") {
      kelompokWhere.id = groupId;
    }

    let kelompokRecords: any[] = [];
    try {
      kelompokRecords = (await prisma.kelompokKkn.findMany({
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
    } catch (dbErr) {
      console.error("[getLaporanAkhirList] Database query error:", dbErr);
      kelompokRecords = [];
    }

    if (kelompokRecords.length === 0) {
      return {
        stats: {
          totalKelompok: 0,
          disetujuiCount: 0,
          perluRevisiCount: 0,
          menungguTelaahCount: 0,
          totalMahasiswa: 0,
          sudahDinilaiCount: 0,
          belumDinilaiCount: 0,
        },
        students: [],
        kelompokList: [],
      };
    }

    const kelompokList = kelompokRecords.map((k: any, index: number) => {
      const primaryProker =
        k.programKerja?.find((p: any) => p.kategori === "LAPORAN_AKHIR") || k.programKerja?.[0];
      let parsedAspek: any = null;
      if (primaryProker?.aspekPenilaian) {
        if (typeof primaryProker.aspekPenilaian === "string") {
          try {
            parsedAspek = JSON.parse(primaryProker.aspekPenilaian);
          } catch {
            parsedAspek = null;
          }
        } else if (typeof primaryProker.aspekPenilaian === "object") {
          parsedAspek = primaryProker.aspekPenilaian;
        }
      }

      const rubrikScores = {
        sistematika: Number(
          parsedAspek?.rubrikScores?.sistematika ??
            parsedAspek?.sistematika ??
            (primaryProker?.skorPenilaian ? Number(primaryProker.skorPenilaian) : 85)
        ),
        analisis: Number(
          parsedAspek?.rubrikScores?.analisis ??
            parsedAspek?.analisis ??
            (primaryProker?.skorPenilaian ? Number(primaryProker.skorPenilaian) : 85)
        ),
        output: Number(
          parsedAspek?.rubrikScores?.output ??
            parsedAspek?.output ??
            (primaryProker?.skorPenilaian ? Number(primaryProker.skorPenilaian) : 85)
        ),
        refleksi: Number(
          parsedAspek?.rubrikScores?.refleksi ??
            parsedAspek?.refleksi ??
            (primaryProker?.skorPenilaian ? Number(primaryProker.skorPenilaian) : 85)
        ),
      };

      const catatanBab = {
        bab1: parsedAspek?.catatanBab?.bab1 || "",
        bab2: parsedAspek?.catatanBab?.bab2 || "",
        bab3: parsedAspek?.catatanBab?.bab3 || "",
        bab4: parsedAspek?.catatanBab?.bab4 || "",
      };

      const scoreVal =
        primaryProker?.skorPenilaian !== null && primaryProker?.skorPenilaian !== undefined
          ? Number(primaryProker.skorPenilaian)
          : null;

      const groupName = k.name || `Kelompok ${index + 1}`;
      const judulLaporan = primaryProker?.deskripsi
        ? `Laporan Akhir KKN: ${primaryProker.deskripsi}`
        : `Laporan Akhir KKN Tematik Coblong - ${groupName}`;

      const fileUrl = primaryProker?.linkGoogleDrive || null;
      const fileName = fileUrl ? `Laporan_Akhir_${groupName.replace(/\s+/g, "_")}.pdf` : null;

      let statusTelaah: "DISETUJUI" | "PERLU_REVISI" | "MENUNGGU_TELAAH" | "BELUM_UNGGAH" =
        "MENUNGGU_TELAAH";
      if (!fileUrl) {
        statusTelaah = "BELUM_UNGGAH";
      } else if (primaryProker?.statusPenilaian === "DISETUJUI") {
        statusTelaah = "DISETUJUI";
      } else if (primaryProker?.statusPenilaian === "PERLU_REVISI") {
        statusTelaah = "PERLU_REVISI";
      } else if (primaryProker?.statusPenilaian === "BELUM_UNGGAH") {
        statusTelaah = "BELUM_UNGGAH";
      } else if (scoreVal !== null) {
        statusTelaah = "DISETUJUI";
      } else {
        statusTelaah = "MENUNGGU_TELAAH";
      }

      let predikat = "Belum Dinilai";
      if (scoreVal !== null) {
        if (scoreVal >= 85) predikat = "A (Sangat Baik)";
        else if (scoreVal >= 75) predikat = "B (Baik)";
        else if (scoreVal >= 65) predikat = "C (Cukup)";
        else predikat = "D (Kurang)";
      }

      const studentsMapped = (k.students || []).map((st: any) => ({
        studentId: st.userId || st.id,
        nim: st.nim || "-",
        nama: st.user?.name || st.name || "-",
        jurusan: st.jurusan || "-",
        fakultas: st.fakultas || "-",
        phone: st.user?.phone || "-",
        rw: st.assignedRw?.name || "-",
      }));

      const safeIso = (d: any) => {
        if (!d) return new Date().toISOString();
        try {
          return new Date(d).toISOString();
        } catch {
          return new Date().toISOString();
        }
      };

      return {
        id: k.id,
        kelompokId: k.id,
        no: index + 1,
        namaKelompok: groupName,
        kelurahan: k.kelurahan || (k.students?.[0]?.assignedRw?.kelurahan?.name ?? "Coblong"),
        cakupanRw:
          k.cakupanRw ||
          (k.students?.[0]?.assignedRw?.name
            ? [k.students[0].assignedRw.name]
            : ["RW 01", "RW 02"]),
        dplNama: k.dpl?.name || k.dplNamaMentah || "Dosen Pendamping Lapangan",
        dplNip: k.dpl?.nip || "-",
        dplId: k.dplId || k.dpl?.id || null,
        totalAnggota: (k.students || []).length,
        students: studentsMapped,
        judulLaporan,
        fileUrl,
        fileName,
        submittedAt: safeIso(primaryProker?.createdAt || k.createdAt),
        updatedAt: safeIso(primaryProker?.updatedAt || k.updatedAt),
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

    const studentsFlat: any[] = [];
    kelompokList.forEach((k: any) => {
      if (Array.isArray(k.students)) {
        k.students.forEach((st: any) => {
          studentsFlat.push({
            studentId: st.studentId,
            nim: st.nim,
            nama: st.nama,
            jurusan: st.jurusan,
            fakultas: st.fakultas,
            kelompok: k.namaKelompok,
            kelompokId: k.kelompokId || k.id,
            dplNama: k.dplNama,
            dplNip: k.dplNip,
            judulLaporan: k.judulLaporan,
            fileUrl: k.fileUrl,
            fileName: k.fileName,
            status: k.status,
            statusTelaah: k.statusTelaah,
            nilai: k.nilaiAkhir,
            predikat: k.predikat,
            rubrikScores: k.rubrikScores,
            catatan: k.catatanUmum,
            submittedAt: k.submittedAt,
            updatedAt: k.updatedAt,
          });
        });
      }
    });

    const sudahDinilaiCount = studentsFlat.filter((s) => s.status === "Sudah Dinilai").length;
    const belumDinilaiCount = studentsFlat.length - sudahDinilaiCount;

    return {
      stats: {
        totalKelompok,
        disetujuiCount,
        perluRevisiCount,
        menungguTelaahCount,
        totalMahasiswa: studentsFlat.length,
        sudahDinilaiCount,
        belumDinilaiCount,
      },
      students: studentsFlat,
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

    // Upsert or Update Primary Proker / Laporan Akhir Kelompok
    let primaryProker =
      kelompok.programKerja.find((p) => p.kategori === "LAPORAN_AKHIR") || kelompok.programKerja[0];

    const aspekPenilaianData = {
      rubrikScores: { sistematika: sist, analisis: anal, output: outp, refleksi: refl },
      catatanBab: catatanBab || {},
      statusTelaah,
      finalScore,
      updatedAt: new Date().toISOString(),
    };

    const statusProkerVal =
      statusTelaah === "DISETUJUI" ? ("SELESAI" as any) : ("SEDANG_BERJALAN" as any);

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
          linkGoogleDrive: fileUrl || undefined,
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
            isAssessed: true,
          },
        });

        // Upsert PenilaianKknMahasiswa in unified 0-100 scale
        const existing = await prisma.penilaianKknMahasiswa.findUnique({
          where: { studentId: st.userId },
        });

        const subtotalMitra = existing ? Number(existing.subtotalMitra) : 0;
        const currentSkorDplPerencanaan = existing?.skorDplPerencanaan ?? 0;
        const currentSkorDplKontribusi = existing?.skorDplKontribusi ?? 0;
        const currentSkorDplLogbook = existing?.skorDplLogbook ?? 0;
        const currentSkorDplAnalisis = existing?.skorDplAnalisis ?? 0;
        const currentSkorDplOutput = existing?.skorDplOutput ?? 0;
        const currentSkorDplLaporanAkhir = finalScore;

        const subtotalDpl = Number(
          (
            calculateAspectScore(currentSkorDplPerencanaan, 20) +
            calculateAspectScore(currentSkorDplKontribusi, 10) +
            calculateAspectScore(currentSkorDplLogbook, 20) +
            calculateAspectScore(currentSkorDplAnalisis, 20) +
            calculateAspectScore(currentSkorDplOutput, 20) +
            calculateAspectScore(currentSkorDplLaporanAkhir, 10)
          ).toFixed(2)
        );

        const nilaiAkhir = calculateCompositeScore(subtotalMitra, subtotalDpl);
        const kategoriNilai = calculateGradeCategory(nilaiAkhir);

        await prisma.penilaianKknMahasiswa.upsert({
          where: { studentId: st.userId },
          create: {
            studentId: st.userId,
            kelompokId: kelompok.id,
            dplId: evaluatorId || kelompok.dplId || undefined,
            skorDplLaporanAkhir: finalScore,
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
            skorDplLaporanAkhir: finalScore,
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

    const finalScore = Math.round(score);

    if (studentUser.studentProfile) {
      await prisma.studentKkn.update({
        where: { id: studentUser.studentProfile.id },
        data: {
          assessmentScore: finalScore,
          assessmentNote: catatan || "Laporan akhir telah dinilai oleh DPL",
          isAssessed: true,
        },
      });
    }

    const existing = studentUser.penilaianKkn;
    const kelompokId = studentUser.studentProfile?.kelompokId || null;
    const dplId = ["DPL", "DOSEN_PEMBIMBING"].includes(evaluatorRole)
      ? evaluatorId
      : existing?.dplId || studentUser.studentProfile?.kelompok?.dplId || null;

    const subtotalMitra = existing ? Number(existing.subtotalMitra) : 0;
    const currentSkorDplPerencanaan = existing?.skorDplPerencanaan ?? 0;
    const currentSkorDplKontribusi = existing?.skorDplKontribusi ?? 0;
    const currentSkorDplLogbook = existing?.skorDplLogbook ?? 0;
    const currentSkorDplAnalisis = existing?.skorDplAnalisis ?? 0;
    const currentSkorDplOutput = existing?.skorDplOutput ?? 0;
    const currentSkorDplLaporanAkhir = finalScore;

    const subtotalDpl = Number(
      (
        calculateAspectScore(currentSkorDplPerencanaan, 20) +
        calculateAspectScore(currentSkorDplKontribusi, 10) +
        calculateAspectScore(currentSkorDplLogbook, 20) +
        calculateAspectScore(currentSkorDplAnalisis, 20) +
        calculateAspectScore(currentSkorDplOutput, 20) +
        calculateAspectScore(currentSkorDplLaporanAkhir, 10)
      ).toFixed(2)
    );

    const nilaiAkhir = calculateCompositeScore(subtotalMitra, subtotalDpl);
    const kategoriNilai = calculateGradeCategory(nilaiAkhir);

    const saved = await prisma.penilaianKknMahasiswa.upsert({
      where: { studentId },
      create: {
        studentId,
        kelompokId,
        dplId,
        skorDplLaporanAkhir: finalScore,
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
        skorDplLaporanAkhir: finalScore,
        subtotalDpl,
        nilaiAkhir,
        kategoriNilai,
        catatanDpl: catatan !== undefined ? catatan : existing?.catatanDpl,
        status: StatusPenilaianKkn.TERSIMPAN,
      },
    });

    return {
      studentId,
      score: finalScore,
      status: "Sudah Dinilai",
      catatan,
      penilaianRecord: saved,
    };
  },
};
