import { prisma } from "../lib/prisma.js";
import { configService } from "./configService.js";
import { notificationIntegrationService } from "./notificationIntegrationService.js";
import {
  isTestUser,
  isTestKelompok,
  isTestStudent,
} from "../utils/filterTestingUtils.js";
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
export const calculateGradeCategory = (
  score: number,
  options?: { isFinalized?: boolean; isComplete?: boolean }
): string => {
  const num = Number(score) || 0;
  if (num >= 80) return "A";
  if (num >= 70) return "B";
  if (num >= 60) return "C";
  if (num >= 50) return "D";
  if (num > 0) {
    // Cegah vonis "E" prematur jika penilaian belum difinalisasi atau masih sebagian
    if (options && (!options.isFinalized || options.isComplete === false)) {
      return "Belum Lengkap";
    }
    return "E";
  }
  return "Belum Dinilai";
};

// Helper for exact aspect calculation: 0-100 percentage scale
export const calculateAspectScore = (score: number, weight: number): number => {
  const num = Number(score) || 0;
  const safeScore = Math.max(0, Math.min(100, num));
  return Number(((safeScore * weight) / 100).toFixed(2));
};

// Helper to calculate progressive aspect subtotal when some aspects are still being assessed
export const calculateProgressiveAspectSubtotal = (
  aspects: Array<{ score: number; weight: number }>
): { rawSubtotal: number; normalizedSubtotal: number; totalAssessedWeight: number } => {
  let rawSubtotal = 0;
  let totalAssessedWeight = 0;
  for (const a of aspects) {
    const s = Math.max(0, Math.min(100, Number(a.score) || 0));
    rawSubtotal += (s * a.weight) / 100;
    if (s > 0) {
      totalAssessedWeight += a.weight;
    }
  }
  rawSubtotal = Number(rawSubtotal.toFixed(2));
  const normalizedSubtotal =
    totalAssessedWeight > 0
      ? Number(((rawSubtotal / totalAssessedWeight) * 100).toFixed(2))
      : 0;
  return { rawSubtotal, normalizedSubtotal, totalAssessedWeight };
};

// Helper to calculate composite final score with dynamic weights (Default: Mitra 40% + DPL 40% + Laporan Akhir 20%)
export const calculateCompositeScore = (
  subtotalMitra: number,
  subtotalDpl: number,
  bobotMitraPersen: number = 40,
  bobotDplPersen: number = 40,
  normalizeSingleEvaluator: boolean = true,
  skorLaporanAkhir: number = 0,
  bobotLaporanPersen: number = 20
): number => {
  const sMitra = Number(subtotalMitra) || 0;
  const sDpl = Number(subtotalDpl) || 0;
  const sLap = Number(skorLaporanAkhir) || 0;
  const wMitra = (Number(bobotMitraPersen) || 40) / 100;
  const wDpl = (Number(bobotDplPersen) || 40) / 100;
  const wLap = (Number(bobotLaporanPersen) || 20) / 100;

  const activeWeights =
    (sMitra > 0 ? wMitra : 0) +
    (sDpl > 0 ? wDpl : 0) +
    (sLap > 0 ? wLap : 0);

  if (activeWeights >= 0.99) {
    return Number((sMitra * wMitra + sDpl * wDpl + sLap * wLap).toFixed(2));
  }

  // Normalisasi Single / Partial Evaluator:
  // Jika baru sebagian penilai yang mengisi dan normalisasi aktif,
  // nilai sementara dihitung proporsional terhadap bobot yang sudah dinilai agar tidak jatuh ke vonis E prematur.
  if (activeWeights > 0) {
    const rawWeightedSum = sMitra * wMitra + sDpl * wDpl + sLap * wLap;
    if (normalizeSingleEvaluator) {
      return Number((rawWeightedSum / activeWeights).toFixed(2));
    } else {
      return Number(rawWeightedSum.toFixed(2));
    }
  }

  return 0;
};

export const penilaianKknService = {
  calculateCompositeScore,
  calculateAspectScore,
  calculateProgressiveAspectSubtotal,
  calculateGradeCategory,

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

    // Strict Scope: Jika evaluator MPL, pastikan mahasiswa berada di bawah kelompok/wilayah binaannya
    if (
      evaluatorRole &&
      ["MPL", "MITRA_PENDAMPING_LAPANGAN", "MITRA_PEMBIMBING_LAPANGAN"].includes(
        evaluatorRole.toUpperCase()
      ) &&
      evaluatorId
    ) {
      const mplUser = await prisma.user.findUnique({
        where: { id: evaluatorId },
        include: { rw: { include: { kelurahan: true } } },
      });
      let mplKelurahanId = mplUser?.rw?.kelurahanId;
      let mplKelurahanName = mplUser?.rw?.kelurahan?.name;

      if (!mplKelurahanName && mplUser?.address) {
        const cleanAddress = mplUser.address.replace(/^Kel\.\s*/i, "").trim();
        const match = await prisma.kelurahan.findFirst({
          where: {
            name: { contains: cleanAddress, mode: "insensitive" },
          },
        });
        if (match) {
          mplKelurahanId = match.id;
          mplKelurahanName = match.name;
        } else {
          mplKelurahanName = cleanAddress;
        }
      }

      const isDirectMpl = profile?.mplId === evaluatorId || kelompok?.mplId === evaluatorId;

      const isKelurahanRwMatch = Boolean(
        mplKelurahanId &&
        (rw?.kelurahanId === mplKelurahanId || profile?.assignedRw?.kelurahanId === mplKelurahanId)
      );

      const isKelompokKelurahanMatch = Boolean(
        mplKelurahanName &&
        kelompok?.kelurahan &&
        (kelompok.kelurahan.toLowerCase().trim() === mplKelurahanName.toLowerCase().trim() ||
          kelompok.kelurahan.toLowerCase().includes(mplKelurahanName.toLowerCase()) ||
          mplKelurahanName.toLowerCase().includes(kelompok.kelurahan.toLowerCase()))
      );

      if (!isDirectMpl && !isKelurahanRwMatch && !isKelompokKelurahanMatch) {
        throw new Error(
          "Akses ditolak: Mahasiswa ini bukan bagian dari kelompok / wilayah binaan MPL Anda"
        );
      }
    }

    // 1. Hitung Kehadiran Real dari Database (Berdasarkan durasi menit aktual & status pemenuhan jam)
    const ruleConfigs = await configService.getRuleEngineConfigs().catch(() => null);
    const targetLogbook = ruleConfigs?.logbookTargetKegiatan || 24;
    const bobotLogbook = ruleConfigs?.logbookBobotPersen || 20;
    const bobotDplPersen = ruleConfigs?.penilaianBobotDplPersen ?? 40;
    const bobotMplPersen = ruleConfigs?.penilaianBobotMplPersen ?? 40;
    const bobotLaporanPersen = (ruleConfigs as any)?.penilaianBobotLaporanPersen ?? 20;
    const targetDailyMinutes = (ruleConfigs?.attendanceMinDurationHours || 4) * 60;

    const pastSchedulesCount = await prisma.schedule
      .count({
        where: {
          OR: [{ kelompokId: kelompok?.id }, { kelompokId: null }],
          date: { lte: new Date() },
        },
      })
      .catch(() => 0);

    const attendances = await prisma.activityAttendance
      .findMany({
        where: {
          studentId,
          status: { notIn: ["TIDAK_ADA_KEGIATAN", "SKIP_KEGIATAN"] },
          schedule: {
            OR: [{ kelompokId: kelompok?.id }, { kelompokId: null }],
            date: { lte: new Date() },
          },
        },
        select: {
          status: true,
          actualInZoneMinutes: true,
          attendedAt: true,
          checkOutAt: true,
        },
      })
      .catch(() => []);

    let sumAttendanceScores = 0;
    for (const att of attendances) {
      const stUpper = String(att.status || "").toUpperCase();
      let mins = Math.min(480, Math.max(0, att.actualInZoneMinutes ?? 0));
      if (stUpper === "BERLANGSUNG" && !att.checkOutAt && att.attendedAt) {
        const elapsed = Math.max(
          0,
          Math.floor((Date.now() - new Date(att.attendedAt).getTime()) / 60000)
        );
        mins = Math.min(480, Math.max(mins, elapsed));
      } else if (mins === 0 && att.attendedAt && att.checkOutAt) {
        const diff = Math.floor(
          (new Date(att.checkOutAt).getTime() - new Date(att.attendedAt).getTime()) / 60000
        );
        mins = Math.min(480, Math.max(0, diff));
      }

      if (stUpper === "HADIR_MEMENUHI" || (stUpper === "HADIR" && mins >= targetDailyMinutes)) {
        sumAttendanceScores += 100;
      } else if (mins > 0) {
        sumAttendanceScores += Math.min(100, Math.round((mins / targetDailyMinutes) * 100));
      } else if (stUpper.includes("IZIN") || stUpper.includes("SAKIT")) {
        sumAttendanceScores += 100;
      }
    }

    const attendanceRate =
      attendances.length > 0
        ? Math.min(100, Math.max(0, Math.round(sumAttendanceScores / attendances.length)))
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
      : "Mitra Pembimbing Lapangan (MPL) RW";

    // 5. Existing Penilaian Record - Default to calculated rates if not yet explicitly saved
    const existing = studentUser.penilaianKkn;

    const assessment = existing
      ? {
          ...existing,
          skorMitraKehadiran:
            existing.skorMitraKehadiran > 0 ? existing.skorMitraKehadiran : attendanceRate,
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
          skorMitraKehadiran: attendanceRate,
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

    // DPL academic 5 aspects (Total Bobot 100%: Perencanaan 20%, Kontribusi 20%, Logbook dinamis [default 20%], Analisis 20%, Output 20%)
    const subDpl =
      calculateAspectScore(assessment.skorDplPerencanaan, 20) +
      calculateAspectScore(assessment.skorDplKontribusi, 20) +
      calculateAspectScore(assessment.skorDplLogbook, bobotLogbook) +
      calculateAspectScore(assessment.skorDplAnalisis, 20) +
      calculateAspectScore(assessment.skorDplOutput, 20);

    const hasDplAny =
      assessment.skorDplPerencanaan > 0 ||
      assessment.skorDplKontribusi > 0 ||
      assessment.skorDplLogbook > 0 ||
      assessment.skorDplAnalisis > 0 ||
      assessment.skorDplOutput > 0 ||
      assessment.skorDplLaporanAkhir > 0;

    const hasMitraAny =
      assessment.skorMitraKehadiran > 0 ||
      assessment.skorMitraWargaBinaan > 0 ||
      assessment.skorMitraProker > 0 ||
      assessment.skorMitraKomunikasi > 0 ||
      assessment.skorMitraTanggungJawab > 0 ||
      assessment.skorMitraBuktiKegiatan > 0 ||
      assessment.skorMitraDampak > 0 ||
      assessment.skorMitraInisiatif > 0;

    const isComplete = (subDpl > 0 || hasDplAny) && (subMitra > 0 || hasMitraAny);
    const isFinalized = Boolean(assessment.isFinalized);

    const totalNilai = calculateCompositeScore(
      subMitra,
      subDpl,
      bobotMplPersen,
      bobotDplPersen,
      true,
      assessment.skorDplLaporanAkhir || 0,
      bobotLaporanPersen
    );
    const kategori =
      totalNilai === 0 && !existing
        ? "Belum Dinilai"
        : calculateGradeCategory(totalNilai, { isFinalized, isComplete });

    const kontribusiDpl = Number((subDpl * (bobotDplPersen / 100)).toFixed(2));
    const kontribusiMitra = Number((subMitra * (bobotMplPersen / 100)).toFixed(2));
    const kontribusiLaporan = Number(
      ((assessment.skorDplLaporanAkhir || 0) * (bobotLaporanPersen / 100)).toFixed(2)
    );

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
        isEvidenceValid: pastSchedulesCount > 0,
        approvedLogbookCount,
        totalSubmittedLogbooks,
        logbookComplianceScore: calculatedLogbookScore,
        isLogbookValid: approvedLogbookCount >= targetLogbook,
        targetLogbook,
        bobotLogbook,
        bobotDplPersen,
        bobotMplPersen,
        bobotLaporanPersen,
      },
      assessment: {
        ...assessment,
        subtotalMitra: Number(subMitra.toFixed(2)),
        subtotalDpl: Number(subDpl.toFixed(2)),
        kontribusiDpl,
        kontribusiMitra,
        kontribusiLaporan,
        bobotDplPersen,
        bobotMplPersen,
        bobotLaporanPersen,
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

    // Strict Scope: MPL hanya dapat menilai mahasiswa di bawah wilayah/kelompok binaannya
    if (isMpl && evaluatorId) {
      const mplUser = await prisma.user.findUnique({
        where: { id: evaluatorId },
        include: { rw: { include: { kelurahan: true } } },
      });
      let mplKelurahanId = mplUser?.rw?.kelurahanId;
      let mplKelurahanName = mplUser?.rw?.kelurahan?.name;

      if (!mplKelurahanName && mplUser?.address) {
        const cleanAddress = mplUser.address.replace(/^Kel\.\s*/i, "").trim();
        const match = await prisma.kelurahan.findFirst({
          where: {
            name: { contains: cleanAddress, mode: "insensitive" },
          },
        });
        if (match) {
          mplKelurahanId = match.id;
          mplKelurahanName = match.name;
        } else {
          mplKelurahanName = cleanAddress;
        }
      }

      const isDirectMpl =
        studentUser.studentProfile?.mplId === evaluatorId ||
        studentUser.studentProfile?.kelompok?.mplId === evaluatorId;

      const isKelurahanRwMatch = Boolean(
        mplKelurahanId && studentUser.studentProfile?.assignedRw?.kelurahanId === mplKelurahanId
      );

      const isKelompokKelurahanMatch = Boolean(
        mplKelurahanName &&
        studentUser.studentProfile?.kelompok?.kelurahan &&
        (studentUser.studentProfile.kelompok.kelurahan.toLowerCase().trim() ===
          mplKelurahanName.toLowerCase().trim() ||
          studentUser.studentProfile.kelompok.kelurahan
            .toLowerCase()
            .includes(mplKelurahanName.toLowerCase()) ||
          mplKelurahanName
            .toLowerCase()
            .includes(studentUser.studentProfile.kelompok.kelurahan.toLowerCase()))
      );

      if (!isDirectMpl && !isKelurahanRwMatch && !isKelompokKelurahanMatch) {
        throw new Error(
          "Akses ditolak: Anda hanya berwenang menilai mahasiswa di wilayah / kelompok binaan MPL Anda"
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

    // 3. Kalkulasi Subtotal DPL (5 aspek akademik DPL berbobot total 100%: Perencanaan 20%, Kontribusi 20%, Logbook 20%, Analisis 20%, Output 20%)
    const subtotalDpl = Number(
      (
        calculateAspectScore(skorDplPerencanaan, 20) +
        calculateAspectScore(skorDplKontribusi, 20) +
        calculateAspectScore(skorDplLogbook, 20) +
        calculateAspectScore(skorDplAnalisis, 20) +
        calculateAspectScore(skorDplOutput, 20)
      ).toFixed(2)
    );

    // 4. Kalkulasi Nilai Akhir & Kategori (Formula Komposisi Dinamis: MPL 40% + DPL 40% + Laporan Akhir 20%)
    const ruleConfigs = await configService.getRuleEngineConfigs().catch(() => null);
    const bobotDplPersen = ruleConfigs?.penilaianBobotDplPersen ?? 40;
    const bobotMplPersen = ruleConfigs?.penilaianBobotMplPersen ?? 40;
    const bobotLaporanPersen = (ruleConfigs as any)?.penilaianBobotLaporanPersen ?? 20;

    const hasDplAny =
      skorDplPerencanaan > 0 ||
      skorDplKontribusi > 0 ||
      skorDplLogbook > 0 ||
      skorDplAnalisis > 0 ||
      skorDplOutput > 0 ||
      skorDplLaporanAkhir > 0;

    const hasMitraAny =
      skorMitraKehadiran > 0 ||
      skorMitraWargaBinaan > 0 ||
      skorMitraProker > 0 ||
      skorMitraKomunikasi > 0 ||
      skorMitraTanggungJawab > 0 ||
      skorMitraBuktiKegiatan > 0 ||
      skorMitraDampak > 0 ||
      skorMitraInisiatif > 0;

    const isComplete = (subtotalDpl > 0 || hasDplAny) && (subtotalMitra > 0 || hasMitraAny);
    const isFinal = Boolean(payload.isFinalizeAction);

    const nilaiAkhir = calculateCompositeScore(
      subtotalMitra,
      subtotalDpl,
      bobotMplPersen,
      bobotDplPersen,
      true,
      skorDplLaporanAkhir,
      bobotLaporanPersen
    );
    const kategoriNilai = calculateGradeCategory(nilaiAkhir, {
      isFinalized: isFinal,
      isComplete,
    });
    const statusVal: StatusPenilaianKkn = isFinal
      ? StatusPenilaianKkn.FINAL
      : StatusPenilaianKkn.TERSIMPAN;

    const kelompokId = studentUser.studentProfile?.kelompokId || null;
    const dplId = isDpl
      ? evaluatorId
      : prev?.dplId || studentUser.studentProfile?.kelompok?.dplId || null;

    const mitraId = isMitra ? evaluatorId : prev?.mitraId || null;
    const mplId = isMpl ? evaluatorId : prev?.mplId || null;
    const defaultMitraName = isMpl
      ? "Mitra Pembimbing Lapangan"
      : studentUser.studentProfile?.assignedRw?.name
        ? `Ketua ${studentUser.studentProfile.assignedRw.name}`
        : "Mitra Pembimbing Lapangan";
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
          isAssessed: subtotalDpl > 0 || subtotalMitra > 0,
          ...(isMpl && !studentUser.studentProfile.mplId ? { mplId: evaluatorId } : {}),
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
        mplId,
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
        mplId: mplId || undefined,
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
   * Mengambil Rekapitulasi Penilaian KKN (Role-Scoped untuk DPL / MPL / RW / Lurah / DLH / Super User)
   */
  getRekapPenilaian: async (groupId?: string, evaluatorId?: string, evaluatorRole?: string) => {
    const whereCondition: any = {
      role: { name: "MAHASISWA_KKN" },
    };

    const normRole = String(evaluatorRole || "").toUpperCase();

    if (["DPL", "DOSEN_PEMBIMBING", "DOSEN_PENDAMPING"].includes(normRole) && evaluatorId) {
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
    } else if (
      ["MPL", "MITRA_PENDAMPING_LAPANGAN", "MITRA_PEMBIMBING_LAPANGAN"].includes(normRole) &&
      evaluatorId
    ) {
      const mplUser = await prisma.user.findUnique({
        where: { id: evaluatorId },
        include: { rw: { include: { kelurahan: true } } },
      });
      let kelurahanId = mplUser?.rw?.kelurahanId;
      let kelurahanName = mplUser?.rw?.kelurahan?.name;

      // In Berseka, MPL is assigned at Kelurahan level where rwId is null but address stores "Kel. <name>"
      if (!kelurahanName && mplUser?.address) {
        const cleanAddress = mplUser.address.replace(/^Kel\.\s*/i, "").trim();
        const match = await prisma.kelurahan.findFirst({
          where: {
            name: { contains: cleanAddress, mode: "insensitive" },
          },
        });
        if (match) {
          kelurahanId = match.id;
          kelurahanName = match.name;
        } else {
          kelurahanName = cleanAddress;
        }
      }

      // Fallback: deteksi kelurahan dari nama pengguna MPL (contoh: "Mpl Kelurahan Cipaganti" -> "Cipaganti")
      if (!kelurahanName && mplUser?.name) {
        const allKelurahans = await prisma.kelurahan.findMany({ select: { id: true, name: true } });
        const lowerName = mplUser.name.toLowerCase();
        const matchedKel = allKelurahans.find((k) => lowerName.includes(k.name.toLowerCase()));
        if (matchedKel) {
          kelurahanId = matchedKel.id;
          kelurahanName = matchedKel.name;
        }
      }

      const mplConditions: any[] = [{ mplId: evaluatorId }, { kelompok: { mplId: evaluatorId } }];
      if (kelurahanId) {
        mplConditions.push({ assignedRw: { kelurahanId } });
      }
      if (kelurahanName) {
        mplConditions.push({
          kelompok: { kelurahan: { equals: kelurahanName, mode: "insensitive" } },
        });
        mplConditions.push({
          kelompok: { kelurahan: { contains: kelurahanName, mode: "insensitive" } },
        });
      }
      whereCondition.studentProfile = {
        OR: mplConditions,
        ...(groupId ? { kelompokId: groupId } : {}),
      };
    } else if (groupId) {
      whereCondition.studentProfile = { kelompokId: groupId };
    } else if (normRole === "RW" && evaluatorId) {
      const userRw = await prisma.user.findUnique({
        where: { id: evaluatorId },
        select: { rwId: true },
      });
      if (userRw?.rwId) {
        whereCondition.studentProfile = { assignedRwId: userRw.rwId };
      }
    } else if (normRole === "LURAH" && evaluatorId) {
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

    const studentsRaw = await prisma.user.findMany({
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

    const students = studentsRaw.filter(
      (s) => !isTestUser(s) && !isTestStudent(s.studentProfile) && !isTestKelompok(s.studentProfile?.kelompok)
    );

    const ruleConfigs = await configService.getRuleEngineConfigs().catch(() => null);
    const bobotDplPersen = ruleConfigs?.penilaianBobotDplPersen ?? 40;
    const bobotMplPersen = ruleConfigs?.penilaianBobotMplPersen ?? 40;
    const bobotLaporanPersen = (ruleConfigs as any)?.penilaianBobotLaporanPersen ?? 20;
    const wDpl = bobotDplPersen / 100;
    const wMpl = bobotMplPersen / 100;
    const wLap = bobotLaporanPersen / 100;

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
                calculateAspectScore(skorDplKontribusi, 20) +
                calculateAspectScore(skorDplLogbook, 20) +
                calculateAspectScore(skorDplAnalisis, 20) +
                calculateAspectScore(skorDplOutput, 20)
              ).toFixed(2)
            ) || (directScore > 0 ? directScore : 0);

      const skorMitraKehadiran = p ? Number(p.skorMitraKehadiran) : 0;
      const skorMitraWargaBinaan = p ? Number(p.skorMitraWargaBinaan) : 0;
      const skorMitraProker = p ? Number(p.skorMitraProker) : 0;
      const skorMitraKomunikasi = p ? Number(p.skorMitraKomunikasi) : 0;
      const skorMitraTanggungJawab = p ? Number(p.skorMitraTanggungJawab) : 0;
      const skorMitraBuktiKegiatan = p ? Number(p.skorMitraBuktiKegiatan) : 0;
      const skorMitraDampak = p ? Number(p.skorMitraDampak) : 0;
      const skorMitraInisiatif = p ? Number(p.skorMitraInisiatif) : 0;

      const hasMitraScores =
        skorMitraKehadiran > 0 ||
        skorMitraWargaBinaan > 0 ||
        skorMitraProker > 0 ||
        skorMitraKomunikasi > 0 ||
        skorMitraTanggungJawab > 0 ||
        skorMitraBuktiKegiatan > 0 ||
        skorMitraDampak > 0 ||
        skorMitraInisiatif > 0;

      const subtotalMitra =
        p && Number(p.subtotalMitra) > 0
          ? Number(p.subtotalMitra)
          : Number(
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

      // Transparansi komposisi dinamis DPL 40% + MPL 40% + Laporan Akhir 20%
      const kontribusiDpl = Number((subtotalDpl * wDpl).toFixed(2));
      const kontribusiMitra = Number((subtotalMitra * wMpl).toFixed(2));
      const kontribusiLaporan = Number((skorDplLaporanAkhir * wLap).toFixed(2));

      const hasDplAny =
        skorDplPerencanaan > 0 ||
        skorDplKontribusi > 0 ||
        skorDplLogbook > 0 ||
        skorDplAnalisis > 0 ||
        skorDplOutput > 0 ||
        skorDplLaporanAkhir > 0 ||
        directScore > 0;

      const hasDplAll =
        skorDplPerencanaan > 0 &&
        skorDplKontribusi > 0 &&
        skorDplLogbook > 0 &&
        skorDplAnalisis > 0 &&
        skorDplOutput > 0;

      const isComplete = (subtotalDpl > 0 || hasDplAll) && (subtotalMitra > 0 || hasMitraScores);

      const calculatedNilaiAkhir = calculateCompositeScore(
        subtotalMitra,
        subtotalDpl,
        bobotMplPersen,
        bobotDplPersen,
        true,
        skorDplLaporanAkhir,
        bobotLaporanPersen
      );

      const finalNilai =
        p && Number(p.nilaiAkhir) > 0 && (isComplete || p.status === "FINAL")
          ? Number(p.nilaiAkhir)
          : calculatedNilaiAkhir;

      let statusDpl = "BELUM_DINILAI";
      if (hasDplAll || (p && p.status === "FINAL") || (subtotalDpl > 0 && hasDplAll)) {
        statusDpl = "SUDAH_DINILAI";
      } else if (hasDplAny) {
        statusDpl = "SEDANG_DINILAI";
      }

      let statusMitra = "BELUM_DINILAI";
      if (subtotalMitra > 0 || hasMitraScores) {
        statusMitra = "SUDAH_DINILAI";
      }

      let statusPenilaian = "BELUM_DINILAI";
      if ((subtotalDpl > 0 || hasDplAll) && (subtotalMitra > 0 || hasMitraScores)) {
        statusPenilaian = "LENGKAP";
      } else if (subtotalDpl > 0 || hasDplAny) {
        statusPenilaian = "MENUNGGU_MPL";
      } else if (subtotalMitra > 0 || hasMitraScores) {
        statusPenilaian = "MENUNGGU_DPL";
      }

      const isFinalized = Boolean(p?.isFinalized);
      const kategori =
        p?.kategoriNilai && isComplete && isFinalized
          ? p.kategoriNilai
          : finalNilai > 0
            ? calculateGradeCategory(finalNilai, { isFinalized, isComplete })
            : "Belum Dinilai";

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
        namaMitraPenilai: p?.namaMitraPenilai || "-",
        subtotalMitra,
        kontribusiMitra,
        subtotalDpl,
        kontribusiDpl,
        kontribusiLaporan,
        bobotDplPersen,
        bobotMplPersen,
        bobotLaporanPersen,
        nilaiAkhir: finalNilai,
        kategori,
        status: p?.status || "BELUM_DINILAI",
        statusDpl,
        statusMitra,
        statusPenilaian,
        isFinalized: Boolean(p?.isFinalized),
        skorDplPerencanaan,
        skorDplKontribusi,
        skorDplLogbook,
        skorDplAnalisis,
        skorDplOutput,
        skorDplLaporanAkhir,
        skorMitraKehadiran,
        skorMitraWargaBinaan,
        skorMitraProker,
        skorMitraKomunikasi,
        skorMitraTanggungJawab,
        skorMitraBuktiKegiatan,
        skorMitraDampak,
        skorMitraInisiatif,
        catatanDpl: p?.catatanDpl || s.studentProfile?.assessmentNote || "",
        catatanMitra: p?.catatanMitra || "",
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
            orderBy: { updatedAt: "desc" },
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

    // 100% Data Aktual: Filter kelompok testing/dummy
    const cleanKelompokRecords = kelompokRecords.filter((k: any) => !isTestKelompok(k));

    const kelompokList = cleanKelompokRecords.map((k: any, index: number) => {
      const prokers: any[] = k.programKerja || [];
      // Prioritaskan kategori LAPORAN_AKHIR yang memiliki link/lampiran
      const primaryProker =
        prokers.find(
          (p: any) =>
            p.kategori?.toUpperCase() === "LAPORAN_AKHIR" &&
            Boolean(p.linkGoogleDrive || p.attachmentFile)
        ) ||
        prokers.find((p: any) => p.kategori?.toUpperCase() === "LAPORAN_AKHIR") ||
        prokers.find(
          (p: any) =>
            p.deskripsi?.toLowerCase().includes("laporan akhir") &&
            Boolean(p.linkGoogleDrive || p.attachmentFile)
        ) ||
        prokers.find((p: any) => Boolean(p.linkGoogleDrive || p.attachmentFile)) ||
        prokers[0] ||
        null;

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

      const fileUrl = primaryProker?.linkGoogleDrive || primaryProker?.attachmentFile || null;
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

      const cleanStudents = (k.students || []).filter((st: any) => !isTestStudent(st));

      const studentsMapped = cleanStudents.map((st: any) => ({
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
        dplNama: k.dpl?.name || k.dplNamaMentah || "Dosen Pembimbing Lapangan",
        dplNip: k.dpl?.nip || "-",
        dplId: k.dplId || k.dpl?.id || null,
        totalAnggota: (k.students || []).length,
        students: studentsMapped,
        penilaianMahasiswa: k.penilaianMahasiswa || [],
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
      const penList: any[] = k.penilaianMahasiswa || [];
      if (Array.isArray(k.students)) {
        k.students.forEach((st: any) => {
          const studentUserId = st.studentId;
          const studentPen = penList.find((p: any) => p.studentId === studentUserId);
          const studentLaporanScore =
            studentPen && studentPen.skorDplLaporanAkhir > 0
              ? Number(studentPen.skorDplLaporanAkhir)
              : k.nilaiAkhir !== null
                ? Number(k.nilaiAkhir)
                : null;

          const isStudentAssessed = studentLaporanScore !== null && studentLaporanScore > 0;

          let studentPredikat = "Belum Dinilai";
          if (studentLaporanScore !== null) {
            if (studentLaporanScore >= 85) studentPredikat = "A (Sangat Baik)";
            else if (studentLaporanScore >= 75) studentPredikat = "B (Baik)";
            else if (studentLaporanScore >= 65) studentPredikat = "C (Cukup)";
            else studentPredikat = "D (Kurang)";
          }

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
            status: isStudentAssessed ? "Sudah Dinilai" : "Belum Dinilai",
            statusTelaah: k.statusTelaah,
            nilai: studentLaporanScore,
            predikat: studentPredikat,
            rubrikScores: k.rubrikScores,
            catatan: studentPen?.catatanDpl || k.catatanUmum,
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
    const normRole = String(evaluatorRole || "").toUpperCase();
    if (
      ["MPL", "MITRA_PENDAMPING_LAPANGAN", "MITRA_PEMBIMBING_LAPANGAN", "MITRA", "PEMIMPIN", "PIMPINAN"].some(
        (r) => normRole === r || normRole.includes(r)
      )
    ) {
      throw new Error(
        "FORBIDDEN_ROLE: Penilaian telaah laporan akhir adalah wewenang DPL. Role Anda hanya memiliki akses pemantauan (Read-Only)."
      );
    }

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
    const ruleConfigs = await configService.getRuleEngineConfigs().catch(() => null);
    const bobotDplPersen = ruleConfigs?.penilaianBobotDplPersen ?? 40;
    const bobotMplPersen = ruleConfigs?.penilaianBobotMplPersen ?? 40;
    const bobotLaporanPersen = (ruleConfigs as any)?.penilaianBobotLaporanPersen ?? 20;

    const studentUserIds = kelompok.students.map((s) => s.userId).filter(Boolean);
    const oldGroupScore = primaryProker?.skorPenilaian ? Number(primaryProker.skorPenilaian) : 0;

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
        let currentSkorDplLogbook = existing?.skorDplLogbook ?? 0;
        const currentSkorDplAnalisis = existing?.skorDplAnalisis ?? 0;
        const currentSkorDplOutput = existing?.skorDplOutput ?? 0;

        // Auto-inject capaian logbook riil mahasiswa jika belum dinilai manual
        if (currentSkorDplLogbook === 0) {
          const targetLogbook = ruleConfigs?.logbookTargetKegiatan || 24;
          const approvedCount = await prisma.logbookKkn.count({
            where: {
              statusApproval: StatusLogbookKkn.DISETUJUI_DPL,
              OR: [{ penulisId: st.userId }, ...(kelompok?.id ? [{ kelompokId: kelompok.id }] : [])],
            },
          }).catch(() => 0);
          currentSkorDplLogbook = Math.min(100, Math.round((approvedCount / targetLogbook) * 100));
        }

        // Pertahankan nilai esai individual jika DPL sudah menyesuaikannya secara spesifik
        const hasCustomIndividualScore =
          existing &&
          existing.skorDplLaporanAkhir > 0 &&
          oldGroupScore > 0 &&
          existing.skorDplLaporanAkhir !== oldGroupScore;

        const currentSkorDplLaporanAkhir = hasCustomIndividualScore
          ? existing.skorDplLaporanAkhir
          : finalScore;

        const aspectScores = [
          { score: currentSkorDplPerencanaan, weight: 20 },
          { score: currentSkorDplKontribusi, weight: 20 },
          { score: currentSkorDplLogbook, weight: 20 },
          { score: currentSkorDplAnalisis, weight: 20 },
          { score: currentSkorDplOutput, weight: 20 },
        ];

        const { rawSubtotal, normalizedSubtotal, totalAssessedWeight } =
          calculateProgressiveAspectSubtotal(aspectScores);

        // Jika semua aspek DPL sudah dinilai (bobot 100%), gunakan rawSubtotal.
        // Jika baru sebagian dinilai, gunakan normalizedSubtotal agar tidak jatuh prematur.
        const subtotalDpl = totalAssessedWeight >= 100 ? rawSubtotal : normalizedSubtotal;

        const hasDplAll =
          currentSkorDplPerencanaan > 0 &&
          currentSkorDplKontribusi > 0 &&
          currentSkorDplLogbook > 0 &&
          currentSkorDplAnalisis > 0 &&
          currentSkorDplOutput > 0;

        const isComplete = hasDplAll && subtotalMitra > 0;

        const nilaiAkhir = calculateCompositeScore(
          subtotalMitra,
          subtotalDpl,
          bobotMplPersen,
          bobotDplPersen,
          true,
          currentSkorDplLaporanAkhir,
          bobotLaporanPersen
        );
        const kategoriNilai = calculateGradeCategory(nilaiAkhir, {
          isFinalized: false,
          isComplete,
        });

        await prisma.penilaianKknMahasiswa.upsert({
          where: { studentId: st.userId },
          create: {
            studentId: st.userId,
            kelompokId: kelompok.id,
            dplId: evaluatorId || kelompok.dplId || undefined,
            skorDplLaporanAkhir: currentSkorDplLaporanAkhir,
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
            skorDplLaporanAkhir: currentSkorDplLaporanAkhir,
            skorDplLogbook: currentSkorDplLogbook,
            subtotalDpl,
            nilaiAkhir,
            kategoriNilai,
            catatanDpl: catatanUmum !== undefined ? catatanUmum : existing?.catatanDpl,
            status: StatusPenilaianKkn.TERSIMPAN,
          },
        });
      })
    );

    try {
      if (studentUserIds.length > 0) {
        const isApproved = statusTelaah === "DISETUJUI";
        const isRevisi = statusTelaah === "PERLU_REVISI";
        if (isApproved) {
          await notificationIntegrationService.sendToUsers({
            userIds: studentUserIds,
            title: "Laporan Akhir Kelompok Disetujui! 🎓",
            message: `Laporan akhir kelompok ${kelompok.name} telah ditelaah dan disetujui resmi oleh DPL (Nilai: ${finalScore}).`,
            triggerType: "LAPORAN_AKHIR_APPROVED",
            dataPayload: {
              event: "REFRESH_PROKER_MAHASISWA",
              type: "PROKER_DISETUJUI",
              entityId: primaryProker?.id || kelompokId,
              kelompokId,
              status: "DISETUJUI",
              finalScore: String(finalScore),
              click_action: "FLUTTER_NOTIFICATION_CLICK",
            },
          });
        } else if (isRevisi) {
          await notificationIntegrationService.sendToUsers({
            userIds: studentUserIds,
            title: "Laporan Akhir Perlu Perbaikan ⚠️",
            message: `Laporan akhir kelompok ${kelompok.name} memerlukan revisi: ${catatanUmum || "Periksa catatan evaluasi DPL."}`,
            triggerType: "LAPORAN_AKHIR_REVISI",
            dataPayload: {
              event: "REFRESH_PROKER_MAHASISWA",
              type: "KEGIATAN_REVISI",
              entityId: primaryProker?.id || kelompokId,
              kelompokId,
              status: "PERLU_REVISI",
              catatan: catatanUmum || "",
              click_action: "FLUTTER_NOTIFICATION_CLICK",
            },
          });
        }
      }
    } catch (err: any) {
      console.warn(
        "[penilaianKknService.saveLaporanAkhirKelompokScore] Push notification error:",
        err?.message
      );
    }

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
    const normRole = String(evaluatorRole || "").toUpperCase();
    if (
      [
        "MPL",
        "MITRA_PENDAMPING_LAPANGAN",
        "MITRA_PEMBIMBING_LAPANGAN",
        "MITRA",
        "PEMIMPIN",
        "PIMPINAN",
      ].some((r) => normRole === r || normRole.includes(r))
    ) {
      throw new Error(
        "FORBIDDEN_ROLE: Penilaian telaah laporan akhir adalah wewenang DPL. Role Anda hanya memiliki akses pemantauan (Read-Only)."
      );
    }

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
    let currentSkorDplLogbook = existing?.skorDplLogbook ?? 0;
    const currentSkorDplAnalisis = existing?.skorDplAnalisis ?? 0;
    const currentSkorDplOutput = existing?.skorDplOutput ?? 0;
    const currentSkorDplLaporanAkhir = finalScore;

    const ruleConfigs = await configService.getRuleEngineConfigs().catch(() => null);
    const bobotDplPersen = ruleConfigs?.penilaianBobotDplPersen ?? 40;
    const bobotMplPersen = ruleConfigs?.penilaianBobotMplPersen ?? 40;
    const bobotLaporanPersen = (ruleConfigs as any)?.penilaianBobotLaporanPersen ?? 20;

    // Auto-inject capaian logbook riil mahasiswa jika belum dinilai manual
    if (currentSkorDplLogbook === 0) {
      const targetLogbook = ruleConfigs?.logbookTargetKegiatan || 24;
      const approvedCount = await prisma.logbookKkn.count({
        where: {
          statusApproval: StatusLogbookKkn.DISETUJUI_DPL,
          OR: [{ penulisId: studentId }, ...(kelompokId ? [{ kelompokId }] : [])],
        },
      }).catch(() => 0);
      currentSkorDplLogbook = Math.min(100, Math.round((approvedCount / targetLogbook) * 100));
    }

    const aspectScores = [
      { score: currentSkorDplPerencanaan, weight: 20 },
      { score: currentSkorDplKontribusi, weight: 20 },
      { score: currentSkorDplLogbook, weight: 20 },
      { score: currentSkorDplAnalisis, weight: 20 },
      { score: currentSkorDplOutput, weight: 20 },
    ];

    const { rawSubtotal, normalizedSubtotal, totalAssessedWeight } =
      calculateProgressiveAspectSubtotal(aspectScores);

    const subtotalDpl = totalAssessedWeight >= 100 ? rawSubtotal : normalizedSubtotal;

    const hasDplAll =
      currentSkorDplPerencanaan > 0 &&
      currentSkorDplKontribusi > 0 &&
      currentSkorDplLogbook > 0 &&
      currentSkorDplAnalisis > 0 &&
      currentSkorDplOutput > 0;

    const isComplete = hasDplAll && subtotalMitra > 0;

    const nilaiAkhir = calculateCompositeScore(
      subtotalMitra,
      subtotalDpl,
      bobotMplPersen,
      bobotDplPersen,
      true,
      currentSkorDplLaporanAkhir,
      bobotLaporanPersen
    );
    const kategoriNilai = calculateGradeCategory(nilaiAkhir, {
      isFinalized: false,
      isComplete,
    });

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
        skorDplLogbook: currentSkorDplLogbook,
        subtotalDpl,
        nilaiAkhir,
        kategoriNilai,
        catatanDpl: catatan !== undefined ? catatan : existing?.catatanDpl,
        status: StatusPenilaianKkn.TERSIMPAN,
      },
    });

    if (kelompokId) {
      try {
        const prokers = await prisma.programKerjaKkn.findMany({
          where: { kelompokId },
          orderBy: { updatedAt: "desc" },
        });

        const primaryProker =
          prokers.find((p) => p.kategori?.toUpperCase() === "LAPORAN_AKHIR") ||
          prokers.find((p) => p.deskripsi?.toLowerCase().includes("laporan akhir")) ||
          prokers[0];

        if (primaryProker) {
          await prisma.programKerjaKkn.update({
            where: { id: primaryProker.id },
            data: {
              statusPenilaian: "DISETUJUI",
              status: "SELESAI",
              skorPenilaian: primaryProker.skorPenilaian ?? finalScore,
              reviewedById: dplId || undefined,
              reviewedAt: new Date(),
            },
          });
        }
      } catch (err: any) {
        console.warn(
          "[penilaianKknService.saveLaporanAkhirScore] Sync primary proker warning:",
          err?.message
        );
      }
    }

    return {
      studentId,
      score: finalScore,
      status: "Sudah Dinilai",
      catatan,
      penilaianRecord: saved,
    };
  },

  /**
   * Normalisasi Massal Seluruh Data Penilaian Mahasiswa KKN
   * - Harmonisasi nilai laporan akhir kelompok ke seluruh mahasiswa
   * - Auto-inject realisasi logbook disetujui riil (skala 0-100)
   * - Auto-inject realisasi presensi GPS riil (skala 0-100)
   * - Pembersihan teks tercemar H+5 pada catatan_penilaian_dpl
   * - Hitung ulang subtotal DPL, subtotal Mitra, nilai akhir, dan kategori mutu bebas dari vonis "E palsu"
   * - Pastikan konfigurasi bobot resmi tersimpan di konfigurasi_sistem
   */
  normalizeAllStudentAssessments: async (operatorId?: string) => {
    // 1. Pastikan default config bobot di konfigurasi_sistem
    try {
      await (prisma as any).konfigurasiSistem.upsert({
        where: { key: "penilaian_bobot_dpl_persen" },
        update: {},
        create: {
          key: "penilaian_bobot_dpl_persen",
          value: "40",
          tipe: "NUMBER",
          deskripsi: "Bobot penilaian akhir DPL (persen)",
          diperbaruiOleh: operatorId || "SYSTEM_NORMALIZER",
        },
      });
      await (prisma as any).konfigurasiSistem.upsert({
        where: { key: "penilaian_bobot_mpl_persen" },
        update: {},
        create: {
          key: "penilaian_bobot_mpl_persen",
          value: "40",
          tipe: "NUMBER",
          deskripsi: "Bobot penilaian akhir Mitra Lapangan / MPL (persen)",
          diperbaruiOleh: operatorId || "SYSTEM_NORMALIZER",
        },
      });
      await (prisma as any).konfigurasiSistem.upsert({
        where: { key: "penilaian_bobot_laporan_persen" },
        update: {},
        create: {
          key: "penilaian_bobot_laporan_persen",
          value: "20",
          tipe: "NUMBER",
          deskripsi: "Bobot penilaian akhir Laporan Akhir KKN (persen)",
          diperbaruiOleh: operatorId || "SYSTEM_NORMALIZER",
        },
      });
    } catch (cfgErr: any) {
      console.warn("[normalizeAllStudentAssessments] Config upsert warning:", cfgErr?.message);
    }

    const ruleConfigs = await configService.getRuleEngineConfigs().catch(() => null);
    const targetLogbook = ruleConfigs?.logbookTargetKegiatan || 24;
    const targetDailyMinutes = (ruleConfigs?.attendanceMinDurationHours || 4) * 60;
    const bobotDplPersen = ruleConfigs?.penilaianBobotDplPersen ?? 40;
    const bobotMplPersen = ruleConfigs?.penilaianBobotMplPersen ?? 40;
    const bobotLaporanPersen = (ruleConfigs as any)?.penilaianBobotLaporanPersen ?? 20;

    // 2. Ambil seluruh mahasiswa KKN riil
    const allStudentsRaw = await prisma.user.findMany({
      where: {
        studentProfile: { isNot: null },
      },
      include: {
        studentProfile: {
          include: {
            kelompok: {
              include: {
                programKerja: true,
                dpl: true,
              },
            },
            assignedRw: true,
          },
        },
        penilaianKkn: true,
      },
    });

    const students = allStudentsRaw.filter(
      (s) =>
        !isTestUser(s) &&
        !isTestStudent(s.studentProfile) &&
        !isTestKelompok(s.studentProfile?.kelompok)
    );

    let normalizedCount = 0;
    let fixedScoreAnomalies = 0;
    let cleanedH5Notes = 0;

    for (const st of students) {
      const profile = st.studentProfile;
      if (!profile) continue;

      const kelompok = profile.kelompok;
      const kelompokId = kelompok?.id || null;
      const dplId = kelompok?.dplId || kelompok?.dpl?.id || null;
      const existing = st.penilaianKkn;

      // Cek apakah ada catatan H+5 yang mencemari catatan penilaian DPL
      let assessmentNote = profile.assessmentNote || "";
      if (assessmentNote.includes("Dibatalkan otomatis oleh sistem (H+5)")) {
        assessmentNote = "";
        cleanedH5Notes++;
      }

      // Cek apakah kelompok sudah memiliki laporan akhir yang dinilai
      let groupLaporanScore: number | null = null;
      if (kelompok?.programKerja) {
        const laporanProker =
          kelompok.programKerja.find((p) => p.kategori?.toUpperCase() === "LAPORAN_AKHIR") ||
          kelompok.programKerja.find((p) => p.deskripsi?.toLowerCase().includes("laporan akhir"));
        if (laporanProker?.skorPenilaian !== null && laporanProker?.skorPenilaian !== undefined) {
          groupLaporanScore = Number(laporanProker.skorPenilaian);
        }
      }

      // Hitung kepatuhan logbook riil
      const approvedLogbookCount = await prisma.logbookKkn
        .count({
          where: {
            statusApproval: StatusLogbookKkn.DISETUJUI_DPL,
            OR: [{ penulisId: st.id }, ...(kelompokId ? [{ kelompokId }] : [])],
          },
        })
        .catch(() => 0);
      const calculatedLogbookScore = Math.min(
        100,
        Math.round((approvedLogbookCount / targetLogbook) * 100)
      );

      // Hitung kehadiran presensi riil
      const attendances = await prisma.activityAttendance
        .findMany({
          where: {
            studentId: st.id,
            status: { notIn: ["TIDAK_ADA_KEGIATAN", "SKIP_KEGIATAN"] },
          },
          select: {
            status: true,
            actualInZoneMinutes: true,
            attendedAt: true,
            checkOutAt: true,
          },
        })
        .catch(() => []);

      let sumAttendanceScores = 0;
      for (const att of attendances) {
        const stUpper = String(att.status || "").toUpperCase();
        let mins = Math.min(480, Math.max(0, att.actualInZoneMinutes ?? 0));
        if (mins === 0 && att.attendedAt && att.checkOutAt) {
          mins = Math.floor(
            (new Date(att.checkOutAt).getTime() - new Date(att.attendedAt).getTime()) / 60000
          );
        }
        if (stUpper === "HADIR_MEMENUHI" || (stUpper === "HADIR" && mins >= targetDailyMinutes)) {
          sumAttendanceScores += 100;
        } else if (mins > 0) {
          sumAttendanceScores += Math.min(100, Math.round((mins / targetDailyMinutes) * 100));
        } else if (stUpper.includes("IZIN") || stUpper.includes("SAKIT")) {
          sumAttendanceScores += 100;
        }
      }
      const attendanceRate =
        attendances.length > 0
          ? Math.min(100, Math.max(0, Math.round(sumAttendanceScores / attendances.length)))
          : 0;

      // Resolusi aspek DPL
      const currentSkorDplPerencanaan = existing?.skorDplPerencanaan ?? 0;
      const currentSkorDplKontribusi = existing?.skorDplKontribusi ?? 0;
      const currentSkorDplAnalisis = existing?.skorDplAnalisis ?? 0;
      const currentSkorDplOutput = existing?.skorDplOutput ?? 0;
      const resolvedSkorLogbook =
        (existing?.skorDplLogbook ?? 0) > 0 ? existing!.skorDplLogbook : calculatedLogbookScore;

      // Skor laporan akhir: prioritas existing individual -> groupLaporanScore -> direct assessmentScore
      const directScore = Number(profile.assessmentScore || 0);
      let resolvedSkorLaporan = existing?.skorDplLaporanAkhir ?? 0;
      if (resolvedSkorLaporan === 0) {
        if (groupLaporanScore !== null && groupLaporanScore > 0) {
          resolvedSkorLaporan = groupLaporanScore;
        } else if (directScore > 0) {
          resolvedSkorLaporan = directScore;
        }
      }

      // Aspek Mitra
      const resolvedSkorMitraKehadiran =
        (existing?.skorMitraKehadiran ?? 0) > 0 ? existing!.skorMitraKehadiran : attendanceRate;
      const currentSkorMitraWargaBinaan = existing?.skorMitraWargaBinaan ?? 0;
      const currentSkorMitraProker = existing?.skorMitraProker ?? 0;
      const currentSkorMitraKomunikasi = existing?.skorMitraKomunikasi ?? 0;
      const currentSkorMitraTanggungJawab = existing?.skorMitraTanggungJawab ?? 0;
      const currentSkorMitraBuktiKegiatan = existing?.skorMitraBuktiKegiatan ?? 0;
      const currentSkorMitraDampak = existing?.skorMitraDampak ?? 0;
      const currentSkorMitraInisiatif = existing?.skorMitraInisiatif ?? 0;

      const dplAspects = [
        { score: currentSkorDplPerencanaan, weight: 20 },
        { score: currentSkorDplKontribusi, weight: 20 },
        { score: resolvedSkorLogbook, weight: 20 },
        { score: currentSkorDplAnalisis, weight: 20 },
        { score: currentSkorDplOutput, weight: 20 },
      ];

      const mitraAspects = [
        { score: resolvedSkorMitraKehadiran, weight: 15 },
        { score: currentSkorMitraWargaBinaan, weight: 15 },
        { score: currentSkorMitraProker, weight: 15 },
        { score: currentSkorMitraKomunikasi, weight: 10 },
        { score: currentSkorMitraTanggungJawab, weight: 10 },
        { score: currentSkorMitraBuktiKegiatan, weight: 10 },
        { score: currentSkorMitraDampak, weight: 15 },
        { score: currentSkorMitraInisiatif, weight: 10 },
      ];

      const dplCalc = calculateProgressiveAspectSubtotal(dplAspects);
      const mitraCalc = calculateProgressiveAspectSubtotal(mitraAspects);

      const effectiveSubtotalDpl =
        dplCalc.totalAssessedWeight >= 100 ? dplCalc.rawSubtotal : dplCalc.normalizedSubtotal;

      const effectiveSubtotalMitra =
        mitraCalc.totalAssessedWeight >= 100 ? mitraCalc.rawSubtotal : mitraCalc.normalizedSubtotal;

      const hasDplAll =
        currentSkorDplPerencanaan > 0 &&
        currentSkorDplKontribusi > 0 &&
        resolvedSkorLogbook > 0 &&
        currentSkorDplAnalisis > 0 &&
        currentSkorDplOutput > 0;

      const hasMitraAll =
        resolvedSkorMitraKehadiran > 0 &&
        currentSkorMitraWargaBinaan > 0 &&
        currentSkorMitraProker > 0 &&
        currentSkorMitraKomunikasi > 0 &&
        currentSkorMitraTanggungJawab > 0 &&
        currentSkorMitraBuktiKegiatan > 0 &&
        currentSkorMitraDampak > 0 &&
        currentSkorMitraInisiatif > 0;

      const isComplete = hasDplAll && hasMitraAll;
      const isFinalized = Boolean(existing?.isFinalized);

      const nilaiAkhir = calculateCompositeScore(
        effectiveSubtotalMitra,
        effectiveSubtotalDpl,
        bobotMplPersen,
        bobotDplPersen,
        true,
        resolvedSkorLaporan,
        bobotLaporanPersen
      );

      const kategoriNilai = calculateGradeCategory(nilaiAkhir, {
        isFinalized,
        isComplete,
      });

      // Deteksi apakah ada perbaikan anomali nilai (misal dari <= 10 menjadi skor wajar)
      if (existing && Number(existing.nilaiAkhir) <= 10 && nilaiAkhir > 10) {
        fixedScoreAnomalies++;
      }

      // Update StudentKkn
      await prisma.studentKkn.update({
        where: { id: profile.id },
        data: {
          assessmentScore: effectiveSubtotalDpl > 0 ? effectiveSubtotalDpl : directScore,
          assessmentNote: assessmentNote || undefined,
          isAssessed: effectiveSubtotalDpl > 0 || effectiveSubtotalMitra > 0,
        },
      });

      // Upsert PenilaianKknMahasiswa
      await prisma.penilaianKknMahasiswa.upsert({
        where: { studentId: st.id },
        create: {
          studentId: st.id,
          kelompokId,
          dplId,
          skorDplLaporanAkhir: resolvedSkorLaporan,
          skorDplPerencanaan: currentSkorDplPerencanaan,
          skorDplKontribusi: currentSkorDplKontribusi,
          skorDplLogbook: resolvedSkorLogbook,
          skorDplAnalisis: currentSkorDplAnalisis,
          skorDplOutput: currentSkorDplOutput,
          subtotalDpl: effectiveSubtotalDpl,
          skorMitraKehadiran: resolvedSkorMitraKehadiran,
          skorMitraWargaBinaan: currentSkorMitraWargaBinaan,
          skorMitraProker: currentSkorMitraProker,
          skorMitraKomunikasi: currentSkorMitraKomunikasi,
          skorMitraTanggungJawab: currentSkorMitraTanggungJawab,
          skorMitraBuktiKegiatan: currentSkorMitraBuktiKegiatan,
          skorMitraDampak: currentSkorMitraDampak,
          skorMitraInisiatif: currentSkorMitraInisiatif,
          subtotalMitra: effectiveSubtotalMitra,
          nilaiAkhir,
          kategoriNilai,
          catatanDpl: existing?.catatanDpl || assessmentNote || "",
          status: existing?.status || StatusPenilaianKkn.TERSIMPAN,
          isFinalized,
        },
        update: {
          dplId: dplId || undefined,
          skorDplLaporanAkhir: resolvedSkorLaporan,
          skorDplLogbook: resolvedSkorLogbook,
          subtotalDpl: effectiveSubtotalDpl,
          skorMitraKehadiran: resolvedSkorMitraKehadiran,
          subtotalMitra: effectiveSubtotalMitra,
          nilaiAkhir,
          kategoriNilai,
          catatanDpl: existing?.catatanDpl || assessmentNote || "",
        },
      });

      normalizedCount++;
    }

    return {
      success: true,
      totalStudents: students.length,
      normalizedCount,
      fixedScoreAnomalies,
      cleanedH5Notes,
      message: `Normalisasi berhasil untuk ${normalizedCount} mahasiswa. Diperbaiki ${fixedScoreAnomalies} anomali nilai dan dibersihkan ${cleanedH5Notes} catatan teks H+5.`,
    };
  },
};
