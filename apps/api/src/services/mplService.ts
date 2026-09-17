/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Service MPL (Mitra Pembimbing Lapangan) — INDEPENDENT dari DPL.
 * Mencakup: Dashboard, Kelompok, Program Kerja, Monitoring Presensi, Penilaian.
 */

import { prisma } from "../lib/prisma.js";
import { configService } from "./configService.js";
import {
  calculateCompositeScore,
  calculateAspectScore,
} from "./penilaianKknService.js";
import {
  isTestKelompok,
  isTestStudent,
} from "../utils/filterTestingUtils.js";

// ---------------------------------------------------------------------------
// Helper internal: Dapatkan nama kelurahan MPL dari profil user
// Urutan fallback: rw.kelurahan.name → address field → deteksi nama user
// ---------------------------------------------------------------------------
async function getMplKelurahan(userId: string): Promise<{
  kelurahanName: string | null;
  kelurahanId: string | null;
}> {
  const mplUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { rw: { include: { kelurahan: true } } },
  });

  if (!mplUser) return { kelurahanName: null, kelurahanId: null };

  // Prioritas 1: lewat relasi rw → kelurahan
  if (mplUser.rw?.kelurahan?.name) {
    return {
      kelurahanName: mplUser.rw.kelurahan.name,
      kelurahanId: mplUser.rw.kelurahan.id,
    };
  }

  // Prioritas 2: dari field address ("Kel. <nama>")
  if (mplUser.address) {
    const cleanAddress = mplUser.address.replace(/^Kel\.\s*/i, "").trim();
    const match = await prisma.kelurahan.findFirst({
      where: { name: { contains: cleanAddress, mode: "insensitive" } },
    });
    if (match) {
      return { kelurahanName: match.name, kelurahanId: match.id };
    }
    // Gunakan string address mentah jika tidak ada kecocokan di DB
    return { kelurahanName: cleanAddress, kelurahanId: null };
  }

  // Prioritas 3: deteksi nama kelurahan dari nama pengguna MPL
  if (mplUser.name) {
    const allKelurahans = await prisma.kelurahan.findMany({
      select: { id: true, name: true },
    });
    const lowerName = mplUser.name.toLowerCase();
    const matchedKel = allKelurahans.find((k) =>
      lowerName.includes(k.name.toLowerCase())
    );
    if (matchedKel) {
      return { kelurahanName: matchedKel.name, kelurahanId: matchedKel.id };
    }
  }

  return { kelurahanName: null, kelurahanId: null };
}

// ---------------------------------------------------------------------------
// Helper internal: Susun filter Prisma untuk KelompokKkn dalam scope MPL
// Mengikuti pola getKelompokWhere(MPL) di dplService.ts
// ---------------------------------------------------------------------------
async function buildMplKelompokFilter(mplUserId: string): Promise<object> {
  const { kelurahanName } = await getMplKelurahan(mplUserId);

  const conditions: object[] = [
    { mplId: mplUserId },
    { mpl: { id: mplUserId } },
  ];

  if (kelurahanName) {
    conditions.push({ kelurahan: { equals: kelurahanName, mode: "insensitive" } });
    conditions.push({ kelurahan: { contains: kelurahanName, mode: "insensitive" } });
  }

  return { OR: conditions };
}

// ---------------------------------------------------------------------------
// Export service
// ---------------------------------------------------------------------------
export const mplService = {
  // -------------------------------------------------------------------------
  // 1. Dashboard ringkasan MPL
  // Menampilkan: kelurahan, totalKelompok, totalAnggota, daftar kelompok.
  // TIDAK menampilkan tingkat presensi (sesuai notulensi rapat).
  // -------------------------------------------------------------------------
  async getDashboard(mplUserId: string) {
    const { kelurahanName } = await getMplKelurahan(mplUserId);
    const kelompokFilter = await buildMplKelompokFilter(mplUserId);

    const kelompokList = await prisma.kelompokKkn.findMany({
      where: kelompokFilter as any,
      include: {
        students: { select: { id: true, userId: true } },
      },
      orderBy: { name: "asc" },
    });

    // Saring data testing
    const filtered = kelompokList.filter((k) => !isTestKelompok(k));
    const totalAnggota = filtered.reduce((sum, k) => sum + k.students.length, 0);

    return {
      kelurahan: kelurahanName ?? "Tidak Diketahui",
      totalKelompok: filtered.length,
      totalAnggota,
      kelompokList: filtered.map((k) => ({
        id: k.id,
        name: k.name,
        kelurahan: k.kelurahan,
        cakupanRw: k.cakupanRw,
        jumlahAnggota: k.students.length,
      })),
    };
  },

  // -------------------------------------------------------------------------
  // 2. Daftar kelompok dengan optional filter kelurahan & RW
  // -------------------------------------------------------------------------
  async getKelompok(
    mplUserId: string,
    filters: { kelurahan?: string; rw?: string } = {}
  ) {
    const kelompokFilter = await buildMplKelompokFilter(mplUserId);

    // Terapkan filter kelurahan tambahan dari query param bila ada
    let whereClause: any = kelompokFilter;
    if (filters.kelurahan) {
      whereClause = {
        AND: [
          kelompokFilter,
          { kelurahan: { contains: filters.kelurahan, mode: "insensitive" } },
        ],
      };
    }

    const kelompokList = await prisma.kelompokKkn.findMany({
      where: whereClause,
      include: {
        students: { select: { id: true, userId: true } },
        mpl: { select: { id: true, name: true } },
        dpl: { select: { id: true, name: true, nip: true } },
      },
      orderBy: { name: "asc" },
    });

    let filtered = kelompokList.filter((k) => !isTestKelompok(k));

    // Filter RW dari cakupanRw JSON bila parameter rw diberikan
    if (filters.rw) {
      filtered = filtered.filter((k) => {
        if (!k.cakupanRw) return false;
        const rwList = Array.isArray(k.cakupanRw)
          ? k.cakupanRw
          : Object.values(k.cakupanRw as any);
        return rwList.some((rw: any) =>
          String(rw).toLowerCase().includes(filters.rw!.toLowerCase())
        );
      });
    }

    return filtered.map((k) => ({
      id: k.id,
      name: k.name,
      kelurahan: k.kelurahan,
      cakupanRw: k.cakupanRw,
      jumlahAnggota: k.students.length,
      mpl: k.mpl ? { id: k.mpl.id, name: k.mpl.name } : null,
      dpl: k.dpl ? { id: k.dpl.id, name: k.dpl.name, nip: k.dpl.nip } : null,
    }));
  },

  // -------------------------------------------------------------------------
  // 3. Program kerja dalam scope MPL (READ-ONLY — MPL tidak bisa approve/reject)
  // -------------------------------------------------------------------------
  async getProgramKerja(
    mplUserId: string,
    filters: { kelurahan?: string; rw?: string; kelompokId?: string } = {}
  ) {
    const kelompokFilter = await buildMplKelompokFilter(mplUserId);
    let scopedKelompokIds: string[];

    if (filters.kelompokId) {
      // Validasi bahwa kelompok yang diminta memang dalam scope MPL
      const kelompokInScope = await prisma.kelompokKkn.findFirst({
        where: { AND: [{ id: filters.kelompokId }, kelompokFilter as any] },
        select: { id: true },
      });
      if (!kelompokInScope) return [];
      scopedKelompokIds = [filters.kelompokId];
    } else {
      const allKelompok = await prisma.kelompokKkn.findMany({
        where: kelompokFilter as any,
        select: { id: true, name: true },
      });
      scopedKelompokIds = allKelompok
        .filter((k) => !isTestKelompok(k))
        .map((k) => k.id);
    }

    if (scopedKelompokIds.length === 0) return [];

    const prokerList = await prisma.programKerjaKkn.findMany({
      where: { kelompokId: { in: scopedKelompokIds } },
      include: {
        kelompok: { select: { id: true, name: true, kelurahan: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return prokerList.map((p) => ({
      id: p.id,
      deskripsi: p.deskripsi,
      status: p.status,
      statusPelaksanaan: p.statusPelaksanaan,
      kelompok: p.kelompok
        ? { id: p.kelompok.id, name: p.kelompok.name, kelurahan: p.kelompok.kelurahan }
        : null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  },

  // -------------------------------------------------------------------------
  // 4. Monitoring presensi mahasiswa dalam scope MPL (READ-ONLY)
  // Merangkum jumlah hadir / izin / sakit / alpa per mahasiswa.
  // TIDAK ada aksi verifikasi izin/sakit (beda dengan DPL).
  // -------------------------------------------------------------------------
  async getMonitoring(
    mplUserId: string,
    filters: { kelurahan?: string } = {}
  ) {
    const kelompokFilter = await buildMplKelompokFilter(mplUserId);

    const allKelompok = await prisma.kelompokKkn.findMany({
      where: kelompokFilter as any,
      select: { id: true, name: true, kelurahan: true },
    });

    const filteredKelompok = allKelompok.filter((k) => !isTestKelompok(k));
    if (filteredKelompok.length === 0) return [];

    const kelompokIds = filteredKelompok.map((k) => k.id);

    // Ambil semua mahasiswa yang ada di kelompok scope MPL
    const students = await prisma.studentKkn.findMany({
      where: { kelompokId: { in: kelompokIds } },
      include: {
        user: { select: { id: true, name: true } },
        kelompok: { select: { id: true, name: true, kelurahan: true } },
      },
    });

    const filteredStudents = students.filter(
      (s) => !isTestStudent(s)
    );
    if (filteredStudents.length === 0) return [];

    const studentUserIds = filteredStudents.map((s) => s.userId);

    // Ambil semua record presensi mahasiswa dalam scope
    const attendances = await prisma.activityAttendance.findMany({
      where: {
        studentId: { in: studentUserIds },
        status: { notIn: ["TIDAK_ADA_KEGIATAN", "SKIP_KEGIATAN"] },
      },
      select: {
        studentId: true,
        status: true,
      },
    });

    // Susun map studentId → ringkasan presensi
    const attendanceMap = new Map<
      string,
      { hadir: number; izin: number; sakit: number; alpa: number; total: number }
    >();

    for (const att of attendances) {
      if (!attendanceMap.has(att.studentId)) {
        attendanceMap.set(att.studentId, { hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0 });
      }
      const summary = attendanceMap.get(att.studentId)!;
      const stUpper = String(att.status ?? "").toUpperCase();
      summary.total++;

      if (stUpper === "HADIR" || stUpper === "HADIR_MEMENUHI" || stUpper === "BERLANGSUNG") {
        summary.hadir++;
      } else if (stUpper.includes("IZIN")) {
        summary.izin++;
      } else if (stUpper.includes("SAKIT")) {
        summary.sakit++;
      } else {
        summary.alpa++;
      }
    }

    return filteredStudents.map((s) => {
      const summary = attendanceMap.get(s.userId) ?? {
        hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0,
      };
      const persenHadir =
        summary.total > 0
          ? Math.round(
              ((summary.hadir + summary.izin + summary.sakit) / summary.total) * 100
            )
          : 0;

      return {
        studentId: s.userId,
        studentKknId: s.id,
        nama: s.user?.name ?? "-",
        nim: s.nim ?? "-",
        kelompok: s.kelompok
          ? { id: s.kelompok.id, name: s.kelompok.name }
          : null,
        presensi: {
          hadir: summary.hadir,
          izin: summary.izin,
          sakit: summary.sakit,
          alpa: summary.alpa,
          total: summary.total,
          persenKehadiran: persenHadir,
        },
      };
    });
  },

  // -------------------------------------------------------------------------
  // 5. Daftar mahasiswa beserta status penilaian MPL
  // Sertakan flag sudahDinilaiDpl dan skor Mitra yang sudah ada (jika ada).
  // Syarat bisaDinilaiMpl: subtotalDpl > 0 ATAU status != DRAFT
  // -------------------------------------------------------------------------
  async getPenilaianMahasiswaList(mplUserId: string, kelompokId?: string) {
    const kelompokFilter = await buildMplKelompokFilter(mplUserId);
    let kelompokIds: string[];

    if (kelompokId) {
      const kelompokInScope = await prisma.kelompokKkn.findFirst({
        where: { AND: [{ id: kelompokId }, kelompokFilter as any] },
        select: { id: true },
      });
      if (!kelompokInScope) return [];
      kelompokIds = [kelompokId];
    } else {
      const allKelompok = await prisma.kelompokKkn.findMany({
        where: kelompokFilter as any,
        select: { id: true, name: true },
      });
      kelompokIds = allKelompok
        .filter((k) => !isTestKelompok(k))
        .map((k) => k.id);
    }

    if (kelompokIds.length === 0) return [];

    const students = await prisma.studentKkn.findMany({
      where: { kelompokId: { in: kelompokIds } },
      include: {
        user: {
          select: { id: true, name: true },
          include: {
            penilaianKkn: {
              select: {
                id: true,
                status: true,
                subtotalDpl: true,
                subtotalMitra: true,
                skorMitraKehadiran: true,
                skorMitraWargaBinaan: true,
                skorMitraProker: true,
                skorMitraKomunikasi: true,
                skorMitraTanggungJawab: true,
                skorMitraBuktiKegiatan: true,
                skorMitraDampak: true,
                skorMitraInisiatif: true,
                catatanMitra: true,
                nilaiAkhir: true,
                isFinalized: true,
              },
            },
          },
        },
        kelompok: { select: { id: true, name: true } },
      },
    });

    const filteredStudents = students.filter(
      (s) => !isTestStudent(s)
    );

    return filteredStudents.map((s) => {
      const penilaian = s.user?.penilaianKkn ?? null;

      // Syarat bisa dinilai MPL: DPL sudah ada (subtotalDpl > 0 ATAU status != DRAFT)
      const sudahDinilaiDpl = Boolean(
        penilaian &&
          (Number(penilaian.subtotalDpl) > 0 || penilaian.status !== "DRAFT")
      );

      return {
        studentId: s.userId,
        studentKknId: s.id,
        nama: s.user?.name ?? "-",
        nim: s.nim ?? "-",
        kelompok: s.kelompok
          ? { id: s.kelompok.id, name: s.kelompok.name }
          : null,
        sudahDinilaiDpl,
        bisaDinilaiMpl: sudahDinilaiDpl,
        skorMitraSekarang: penilaian
          ? {
              kehadiran: penilaian.skorMitraKehadiran,
              wargaBinaan: penilaian.skorMitraWargaBinaan,
              proker: penilaian.skorMitraProker,
              komunikasi: penilaian.skorMitraKomunikasi,
              tanggungJawab: penilaian.skorMitraTanggungJawab,
              buktiKegiatan: penilaian.skorMitraBuktiKegiatan,
              dampak: penilaian.skorMitraDampak,
              inisiatif: penilaian.skorMitraInisiatif,
              subtotalMitra: penilaian.subtotalMitra,
            }
          : null,
        catatanMitra: penilaian?.catatanMitra ?? null,
        nilaiAkhir: penilaian?.nilaiAkhir ?? 0,
        isFinalized: penilaian?.isFinalized ?? false,
      };
    });
  },

  // -------------------------------------------------------------------------
  // 6. Simpan penilaian 8 aspek Mitra oleh MPL — INDEPENDENT dari endpoint DPL.
  //
  // Guard 1: MPL harus punya akses ke mahasiswa (kelurahan match / mplId match).
  // Guard 2: DPL HARUS sudah menilai terlebih dahulu.
  //
  // Formula subtotalMitra (skala 0–100, sesuai penilaianKknService):
  //   Kehadiran 15% + WargaBinaan 15% + Proker 15% + Komunikasi 10% +
  //   TanggungJawab 10% + BuktiKegiatan 10% + Dampak 15% + Inisiatif 10% = 100%
  // -------------------------------------------------------------------------
  async assessMahasiswaByMpl(opts: {
    mplUserId: string;
    studentId: string;
    skorMitraKehadiran: number;
    skorMitraWargaBinaan: number;
    skorMitraProker: number;
    skorMitraKomunikasi: number;
    skorMitraTanggungJawab: number;
    skorMitraBuktiKegiatan: number;
    skorMitraDampak: number;
    skorMitraInisiatif: number;
    catatanMitra?: string;
  }) {
    const { mplUserId, studentId, catatanMitra } = opts;

    // ── Ambil data mahasiswa beserta relasi kelompok ──────────────────────
    const studentUser = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: {
          include: {
            kelompok: { select: { id: true, mplId: true, kelurahan: true, dplId: true } },
            assignedRw: { include: { kelurahan: true } },
          },
        },
        rw: { include: { kelurahan: true } },
        penilaianKkn: true,
      },
    });

    if (!studentUser) {
      throw new Error("MAHASISWA_TIDAK_DITEMUKAN");
    }

    // ── Guard 1: Verifikasi akses MPL ke mahasiswa ────────────────────────
    const { kelurahanName: mplKelurahanName, kelurahanId: mplKelurahanId } =
      await getMplKelurahan(mplUserId);

    const profile = studentUser.studentProfile;
    const kelompok = profile?.kelompok;
    const assignedRw = profile?.assignedRw;

    const isDirectMpl =
      profile?.mplId === mplUserId || kelompok?.mplId === mplUserId;

    const isKelurahanRwMatch = Boolean(
      mplKelurahanId &&
        (assignedRw?.kelurahan?.id === mplKelurahanId ||
          studentUser.rw?.kelurahan?.id === mplKelurahanId)
    );

    const isKelompokKelurahanMatch = Boolean(
      mplKelurahanName &&
        kelompok?.kelurahan &&
        (kelompok.kelurahan.toLowerCase().trim() ===
          mplKelurahanName.toLowerCase().trim() ||
          kelompok.kelurahan.toLowerCase().includes(mplKelurahanName.toLowerCase()) ||
          mplKelurahanName.toLowerCase().includes(kelompok.kelurahan.toLowerCase()))
    );

    if (!isDirectMpl && !isKelurahanRwMatch && !isKelompokKelurahanMatch) {
      throw new Error("AKSES_DITOLAK");
    }

    // ── Guard 2: DPL harus sudah menilai terlebih dahulu ─────────────────
    const existing = studentUser.penilaianKkn;
    const dplSudahMenilai = Boolean(
      existing && (Number(existing.subtotalDpl) > 0 || existing.status !== "DRAFT")
    );

    if (!dplSudahMenilai) {
      throw new Error("PENILAIAN_DPL_BELUM_SELESAI");
    }

    // ── Normalisasi & klamp skor ke range 0–100 ───────────────────────────
    const clamp = (v: number) => Math.max(0, Math.min(100, Number(v) || 0));
    const s = {
      skorMitraKehadiran: clamp(opts.skorMitraKehadiran),
      skorMitraWargaBinaan: clamp(opts.skorMitraWargaBinaan),
      skorMitraProker: clamp(opts.skorMitraProker),
      skorMitraKomunikasi: clamp(opts.skorMitraKomunikasi),
      skorMitraTanggungJawab: clamp(opts.skorMitraTanggungJawab),
      skorMitraBuktiKegiatan: clamp(opts.skorMitraBuktiKegiatan),
      skorMitraDampak: clamp(opts.skorMitraDampak),
      skorMitraInisiatif: clamp(opts.skorMitraInisiatif),
    };

    // ── Kalkulasi subtotalMitra (weighted sum, maks 100) ──────────────────
    const subtotalMitra = Number(
      (
        calculateAspectScore(s.skorMitraKehadiran, 15) +
        calculateAspectScore(s.skorMitraWargaBinaan, 15) +
        calculateAspectScore(s.skorMitraProker, 15) +
        calculateAspectScore(s.skorMitraKomunikasi, 10) +
        calculateAspectScore(s.skorMitraTanggungJawab, 10) +
        calculateAspectScore(s.skorMitraBuktiKegiatan, 10) +
        calculateAspectScore(s.skorMitraDampak, 15) +
        calculateAspectScore(s.skorMitraInisiatif, 10)
      ).toFixed(2)
    );

    // ── Ambil bobot dari config (default 50/50) ───────────────────────────
    const ruleConfigs = await configService.getRuleEngineConfigs().catch(() => null);
    const bobotMplPersen: number = (ruleConfigs as any)?.penilaianBobotMplPersen ?? 50;
    const bobotDplPersen: number = (ruleConfigs as any)?.penilaianBobotDplPersen ?? 50;

    const subtotalDpl = Number(existing?.subtotalDpl ?? 0);
    const nilaiAkhir = calculateCompositeScore(
      subtotalMitra,
      subtotalDpl,
      bobotMplPersen,
      bobotDplPersen
    );

    // ── Metadata untuk upsert ─────────────────────────────────────────────
    const kelompokId = profile?.kelompokId ?? existing?.kelompokId ?? null;
    const dplId = existing?.dplId ?? kelompok?.dplId ?? null;
    const prevMitraId = existing?.mitraId ?? null;

    // ── Upsert PenilaianKknMahasiswa ──────────────────────────────────────
    const updated = await prisma.penilaianKknMahasiswa.upsert({
      where: { studentId },
      create: {
        studentId,
        kelompokId,
        dplId,
        mitraId: prevMitraId,
        mplId: mplUserId,
        namaMitraPenilai: "Mitra Pembimbing Lapangan",
        // 8 aspek Mitra
        skorMitraKehadiran: Math.round(s.skorMitraKehadiran),
        skorMitraWargaBinaan: Math.round(s.skorMitraWargaBinaan),
        skorMitraProker: Math.round(s.skorMitraProker),
        skorMitraKomunikasi: Math.round(s.skorMitraKomunikasi),
        skorMitraTanggungJawab: Math.round(s.skorMitraTanggungJawab),
        skorMitraBuktiKegiatan: Math.round(s.skorMitraBuktiKegiatan),
        skorMitraDampak: Math.round(s.skorMitraDampak),
        skorMitraInisiatif: Math.round(s.skorMitraInisiatif),
        subtotalMitra,
        // Skor DPL dipertahankan dari record yang sudah ada
        skorDplPerencanaan: existing?.skorDplPerencanaan ?? 0,
        skorDplKontribusi: existing?.skorDplKontribusi ?? 0,
        skorDplLogbook: existing?.skorDplLogbook ?? 0,
        skorDplAnalisis: existing?.skorDplAnalisis ?? 0,
        skorDplOutput: existing?.skorDplOutput ?? 0,
        skorDplLaporanAkhir: existing?.skorDplLaporanAkhir ?? 0,
        subtotalDpl,
        nilaiAkhir,
        kategoriNilai: "Dinilai Mitra",
        catatanMitra: catatanMitra ?? "",
        catatanDpl: existing?.catatanDpl ?? "",
        status: "TERSIMPAN",
        isFinalized: false,
      },
      update: {
        mplId: mplUserId,
        // Hanya update 8 aspek Mitra; skor DPL tidak disentuh
        skorMitraKehadiran: Math.round(s.skorMitraKehadiran),
        skorMitraWargaBinaan: Math.round(s.skorMitraWargaBinaan),
        skorMitraProker: Math.round(s.skorMitraProker),
        skorMitraKomunikasi: Math.round(s.skorMitraKomunikasi),
        skorMitraTanggungJawab: Math.round(s.skorMitraTanggungJawab),
        skorMitraBuktiKegiatan: Math.round(s.skorMitraBuktiKegiatan),
        skorMitraDampak: Math.round(s.skorMitraDampak),
        skorMitraInisiatif: Math.round(s.skorMitraInisiatif),
        subtotalMitra,
        nilaiAkhir,
        ...(catatanMitra !== undefined ? { catatanMitra } : {}),
        status: "TERSIMPAN",
      },
    });

    // ── Update flag isAssessed di StudentKkn ─────────────────────────────
    if (profile?.id) {
      await prisma.studentKkn.update({
        where: { id: profile.id },
        data: {
          isAssessed: true,
          assessmentScore: updated.subtotalMitra,
          ...(profile.mplId == null ? { mplId: mplUserId } : {}),
        },
      });
    }

    return updated;
  },
};
