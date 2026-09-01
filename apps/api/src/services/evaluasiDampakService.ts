import { prisma } from "../lib/prisma.js";

/**
 * Service layer untuk fitur Evaluasi Dampak KKN.
 * Mengelola data Baseline (dari SurveiKelurahan), Endline (EndlineSurveiKelurahan),
 * dan kalkulasi Komparasi Dampak.
 */
export const evaluasiDampakService = {
  /**
   * Mengambil data baseline (SurveiKelurahan) beserta relasi child.
   * Untuk DPL, data di-scope ke kelurahan kelompok dampingannya.
   */
  getBaselineData: async (userId: string, userRole: string) => {
    const whereClause = await buildKelurahanScope(userId, userRole);

    const data = await prisma.surveiKelurahan.findMany({
      where: whereClause,
      include: {
        pemilahanSampah: true,
        volumeSampah: true,
        bankSampahPengolahan: true,
        karakteristikWilayah: true,
        keyPlayers: true,
        catatanKesimpulan: true,
        validasiDpl: { select: { id: true, name: true } },
      },
      orderBy: { kelurahanId: "asc" },
    });

    return data;
  },

  /**
   * DPL memvalidasi atau merevisi data baseline kelurahan tertentu.
   */
  validateBaseline: async (
    dplUserId: string,
    kelurahanId: number,
    status: "VALID" | "REVISI",
    catatan?: string
  ) => {
    const survey = await prisma.surveiKelurahan.findUnique({
      where: { kelurahanId },
      select: { namaKelurahan: true },
    });
    if (!survey) throw new Error("SURVEI_NOT_FOUND");

    const kelompokDpl = await prisma.kelompokKkn.findMany({
      where: { dplId: dplUserId },
      select: { kelurahan: true },
    });
    const kelurahanNames = kelompokDpl.map((k) => k.kelurahan?.toLowerCase()).filter(Boolean);
    if (kelurahanNames.length > 0 && !kelurahanNames.includes(survey.namaKelurahan.toLowerCase())) {
      throw new Error("FORBIDDEN_SCOPE");
    }

    const updated = await prisma.surveiKelurahan.update({
      where: { kelurahanId },
      data: {
        statusValidasi: status,
        validasiDplId: dplUserId,
        catatanValidasi: catatan || null,
      },
    });

    return updated;
  },

  /**
   * Mengambil data endline (EndlineSurveiKelurahan) beserta relasi child.
   */
  getEndlineData: async (
    userId: string,
    userRole: string,
    page: number = 1,
    limit: number = 10,
    search: string = ""
  ) => {
    const baseWhereClause = await buildKelurahanScope(userId, userRole);

    // Add search condition
    const whereClause = {
      ...baseWhereClause,
      ...(search ? { namaKelurahan: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.endlineSurveiKelurahan.findMany({
        where: whereClause,
        include: {
          pemilahanSampah: true,
          volumeSampah: true,
          bankSampahPengolahan: true,
          catatanKesimpulan: true,
          validasiDpl: { select: { id: true, name: true } },
        },
        orderBy: { kelurahanId: "asc" },
        skip,
        take: limit,
      }),
      prisma.endlineSurveiKelurahan.count({ where: whereClause }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * DPL memvalidasi atau merevisi data endline kelurahan tertentu.
   */
  validateEndline: async (
    dplUserId: string,
    kelurahanId: number,
    status: "VALID" | "REVISI",
    catatan?: string
  ) => {
    const endline = await prisma.endlineSurveiKelurahan.findUnique({
      where: { kelurahanId },
      select: { namaKelurahan: true },
    });
    if (!endline) throw new Error("SURVEI_NOT_FOUND");

    const kelompokDpl = await prisma.kelompokKkn.findMany({
      where: { dplId: dplUserId },
      select: { kelurahan: true },
    });
    const kelurahanNames = kelompokDpl.map((k) => k.kelurahan?.toLowerCase()).filter(Boolean);
    if (
      kelurahanNames.length > 0 &&
      !kelurahanNames.includes(endline.namaKelurahan.toLowerCase())
    ) {
      throw new Error("FORBIDDEN_SCOPE");
    }

    const updated = await prisma.endlineSurveiKelurahan.update({
      where: { kelurahanId },
      data: {
        statusValidasi: status,
        validasiDplId: dplUserId,
        catatanValidasi: catatan || null,
      },
    });

    return updated;
  },

  /**
   * Mengambil data komparasi dampak (Baseline vs Endline) per kelurahan.
   * Menghitung delta persentase pemilahan, volume sampah, dan bank sampah aktif.
   */
  getKomparasiDampak: async (userId: string, userRole: string) => {
    const whereClause = await buildKelurahanScope(userId, userRole);

    const [baselineData, endlineData] = await Promise.all([
      prisma.surveiKelurahan.findMany({
        where: whereClause,
        include: {
          pemilahanSampah: true,
          volumeSampah: true,
          bankSampahPengolahan: true,
          catatanKesimpulan: true,
        },
        orderBy: { kelurahanId: "asc" },
      }),
      prisma.endlineSurveiKelurahan.findMany({
        where: whereClause,
        include: {
          pemilahanSampah: true,
          volumeSampah: true,
          bankSampahPengolahan: true,
          catatanKesimpulan: true,
        },
        orderBy: { kelurahanId: "asc" },
      }),
    ]);

    // Merge baseline dan endline per kelurahanId
    const endlineMap = new Map(endlineData.map((e) => [e.kelurahanId, e]));

    // Helper untuk menghitung jumlah kegiatan pemanfaatan sampah aktif
    const countKegiatan = (bs: any) => {
      if (!bs) return null;
      let count = 0;
      if (bs.bioporiLoseda) count++;
      if (bs.ecobrickKerajinanDaurUlang) count++;
      if (bs.buruanSae) count++;
      if (bs.pengepulMitraDaurUlang) count++;
      if (bs.digitalisasiData) count++;
      if (
        bs.jumlahUnitKomposter &&
        bs.jumlahUnitKomposter !== "0" &&
        bs.jumlahUnitKomposter !== "-"
      )
        count++;
      if (
        bs.jumlahTitikMaggotBsf &&
        bs.jumlahTitikMaggotBsf !== "0" &&
        bs.jumlahTitikMaggotBsf !== "-"
      )
        count++;
      if (bs.bankSampahAktif && Number(bs.bankSampahAktif) > 0) count++;
      return count;
    };

    const komparasi = baselineData.map((baseline) => {
      const endline: any = endlineMap.get(baseline.kelurahanId) || null;

      const baselinePemilahan = baseline.pemilahanSampah?.persentasePemilahan
        ? Number(baseline.pemilahanSampah.persentasePemilahan)
        : null;
      const endlinePemilahan = endline?.pemilahanSampah?.persentasePemilahan
        ? Number(endline.pemilahanSampah.persentasePemilahan)
        : null;

      const baselineVolume = baseline.volumeSampah?.totalVolumeKgPerHari
        ? Number(baseline.volumeSampah.totalVolumeKgPerHari)
        : null;
      const endlineVolume = endline?.volumeSampah?.totalVolumeKgPerHari
        ? Number(endline.volumeSampah.totalVolumeKgPerHari)
        : null;

      const baselineKegiatan = countKegiatan(baseline.bankSampahPengolahan);
      const endlineKegiatan = endline ? countKegiatan(endline.bankSampahPengolahan) : null;

      // Target standar DLH/KKN: Pemilahan minimal 50% atau kenaikan +20% dari baseline
      const targetPemilahan =
        baselinePemilahan !== null ? Math.max(50, baselinePemilahan + 20) : 50;
      const deltaPemilahan =
        baselinePemilahan !== null && endlinePemilahan !== null
          ? Number((endlinePemilahan - baselinePemilahan).toFixed(2))
          : null;
      const isTargetPemilahanTercapai =
        endlinePemilahan !== null
          ? endlinePemilahan >= targetPemilahan || (deltaPemilahan !== null && deltaPemilahan > 0)
          : false;

      const deltaVolume =
        baselineVolume !== null && endlineVolume !== null
          ? Number((endlineVolume - baselineVolume).toFixed(2))
          : null;

      const deltaKegiatan =
        baselineKegiatan !== null && endlineKegiatan !== null
          ? endlineKegiatan - baselineKegiatan
          : null;

      const evaluasiText =
        endline?.catatanKesimpulan?.prioritasIntervensi ||
        baseline.catatanKesimpulan?.prioritasIntervensi ||
        "Evaluasi efektivitas intervensi pemilahan sampah organik dan anorganik di wilayah kelurahan.";

      const rekomendasiText =
        endline?.catatanKesimpulan?.catatanTambahanRisikoSosial ||
        baseline.catatanKesimpulan?.catatanTambahanRisikoSosial ||
        "Rekomendasi penguatan bank sampah unit dan konsistensi edukasi pemilahan level RT/RW.";

      return {
        kelurahanId: baseline.kelurahanId,
        namaKelurahan: baseline.namaKelurahan,
        kecamatan: baseline.kecamatan,
        hasEndline: endline !== null,
        evaluasi: evaluasiText,
        rekomendasi: rekomendasiText,
        target: {
          persentasePemilahan: targetPemilahan,
          reduksiVolumeKg: baselineVolume ? Number((baselineVolume * 0.2).toFixed(2)) : 0,
        },
        hasilAktual: {
          pemilahan: endlinePemilahan ?? baselinePemilahan,
          volumeSampah: endlineVolume ?? baselineVolume,
          kegiatanPemanfaatan: endlineKegiatan ?? baselineKegiatan,
        },
        pemilahan: {
          baseline: baselinePemilahan,
          endline: endlinePemilahan,
          target: targetPemilahan,
          delta: deltaPemilahan,
          tercapai: isTargetPemilahanTercapai,
        },
        volumeSampah: {
          baseline: baselineVolume,
          endline: endlineVolume,
          delta: deltaVolume,
          tercapai: deltaVolume !== null ? deltaVolume <= 0 : false, // Reduksi berhasil jika delta <= 0
        },
        kegiatanPemanfaatan: {
          baseline: baselineKegiatan,
          endline: endlineKegiatan,
          delta: deltaKegiatan,
          tercapai: deltaKegiatan !== null ? deltaKegiatan >= 0 : false,
        },
        statusCapaian: isTargetPemilahanTercapai
          ? "TERCAPAI"
          : endline !== null
            ? "BELUM_TERCAPAI"
            : "PROSES_EVALUASI",
      };
    });

    return komparasi;
  },
};

/**
 * Membangun scope filter kelurahan berdasarkan role pengguna.
 * DPL hanya bisa melihat kelurahan yang menjadi area kelompok dampingannya.
 * SUPER_USER, PANITIA_TASKFORCE, PEMIMPIN bisa melihat semua.
 */
async function buildKelurahanScope(userId: string, userRole: string) {
  if (["SUPER_USER", "PANITIA_TASKFORCE", "PEMIMPIN"].includes(userRole)) {
    return {}; // Semua kelurahan
  }

  // DPL: scope ke kelurahan dari kelompok dampingan
  const kelompokDpl = await prisma.kelompokKkn.findMany({
    where: { dplId: userId },
    select: { kelurahan: true },
  });

  const kelurahanNames = kelompokDpl.map((k) => k.kelurahan).filter(Boolean) as string[];

  if (kelurahanNames.length === 0) {
    return { namaKelurahan: { in: [] } }; // Kosong — DPL belum punya kelompok
  }

  return {
    namaKelurahan: { in: kelurahanNames },
  };
}
