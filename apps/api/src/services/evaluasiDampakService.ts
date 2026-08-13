import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Service layer untuk fitur Evaluasi Dampak KKN.
 * Mengelola data Baseline (dari SurveiKelurahan), Endline (EndlineSurveiKelurahan),
 * dan kalkulasi Komparasi Dampak.
 */
export const evaluasiDampakService = {
  /**
   * Mengambil data baseline (SurveiKelurahan) beserta relasi child.
   * Untuk DPL, data di-scope ke kelurahan kelompok bimbingannya.
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
  getEndlineData: async (userId: string, userRole: string) => {
    const whereClause = await buildKelurahanScope(userId, userRole);

    const data = await prisma.endlineSurveiKelurahan.findMany({
      where: whereClause,
      include: {
        pemilahanSampah: true,
        volumeSampah: true,
        bankSampahPengolahan: true,
        catatanKesimpulan: true,
        validasiDpl: { select: { id: true, name: true } },
      },
      orderBy: { kelurahanId: "asc" },
    });

    return data;
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
        },
        orderBy: { kelurahanId: "asc" },
      }),
      prisma.endlineSurveiKelurahan.findMany({
        where: whereClause,
        include: {
          pemilahanSampah: true,
          volumeSampah: true,
          bankSampahPengolahan: true,
        },
        orderBy: { kelurahanId: "asc" },
      }),
    ]);

    // Merge baseline dan endline per kelurahanId
    const endlineMap = new Map(
      endlineData.map((e) => [e.kelurahanId, e])
    );

    // Helper untuk menghitung jumlah kegiatan pemanfaatan sampah aktif
    const countKegiatan = (bs: any) => {
      if (!bs) return null;
      let count = 0;
      if (bs.bioporiLoseda) count++;
      if (bs.ecobrickKerajinanDaurUlang) count++;
      if (bs.buruanSae) count++;
      if (bs.pengepulMitraDaurUlang) count++;
      if (bs.digitalisasiData) count++;
      if (bs.jumlahUnitKomposter && bs.jumlahUnitKomposter !== "0" && bs.jumlahUnitKomposter !== "-") count++;
      if (bs.jumlahTitikMaggotBsf && bs.jumlahTitikMaggotBsf !== "0" && bs.jumlahTitikMaggotBsf !== "-") count++;
      if (bs.bankSampahAktif && Number(bs.bankSampahAktif) > 0) count++;
      return count;
    };

    const komparasi = baselineData.map((baseline) => {
      const endline = endlineMap.get(baseline.kelurahanId) || null;

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

      return {
        kelurahanId: baseline.kelurahanId,
        namaKelurahan: baseline.namaKelurahan,
        kecamatan: baseline.kecamatan,
        hasEndline: endline !== null,
        pemilahan: {
          baseline: baselinePemilahan,
          endline: endlinePemilahan,
          delta:
            baselinePemilahan !== null && endlinePemilahan !== null
              ? endlinePemilahan - baselinePemilahan
              : null,
        },
        volumeSampah: {
          baseline: baselineVolume,
          endline: endlineVolume,
          delta:
            baselineVolume !== null && endlineVolume !== null
              ? endlineVolume - baselineVolume
              : null,
        },
        kegiatanPemanfaatan: {
          baseline: baselineKegiatan,
          endline: endlineKegiatan,
          delta:
            baselineKegiatan !== null && endlineKegiatan !== null
              ? endlineKegiatan - baselineKegiatan
              : null,
        },
      };
    });

    return komparasi;
  },
};

/**
 * Membangun scope filter kelurahan berdasarkan role pengguna.
 * DPL hanya bisa melihat kelurahan yang menjadi area kelompok bimbingannya.
 * SUPER_USER, PANITIA_TASKFORCE, PEMIMPIN bisa melihat semua.
 */
async function buildKelurahanScope(userId: string, userRole: string) {
  if (["SUPER_USER", "PANITIA_TASKFORCE", "PEMIMPIN"].includes(userRole)) {
    return {}; // Semua kelurahan
  }

  // DPL: scope ke kelurahan dari kelompok bimbingan
  const kelompokDpl = await prisma.kelompokKkn.findMany({
    where: { dplId: userId },
    select: { kelurahan: true },
  });

  const kelurahanNames = kelompokDpl
    .map((k) => k.kelurahan)
    .filter(Boolean) as string[];

  if (kelurahanNames.length === 0) {
    return { namaKelurahan: { in: [] } }; // Kosong — DPL belum punya kelompok
  }

  return {
    namaKelurahan: { in: kelurahanNames },
  };
}
