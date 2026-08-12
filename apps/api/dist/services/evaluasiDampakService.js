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
    getBaselineData: async (userId, userRole) => {
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
    validateBaseline: async (dplUserId, kelurahanId, status, catatan) => {
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
    getEndlineData: async (userId, userRole) => {
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
    validateEndline: async (dplUserId, kelurahanId, status, catatan) => {
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
    getKomparasiDampak: async (userId, userRole) => {
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
        const endlineMap = new Map(endlineData.map((e) => [e.kelurahanId, e]));
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
            const baselineBankSampah = baseline.bankSampahPengolahan?.bankSampahAktif ?? null;
            const endlineBankSampah = endline?.bankSampahPengolahan?.bankSampahAktif ?? null;
            return {
                kelurahanId: baseline.kelurahanId,
                namaKelurahan: baseline.namaKelurahan,
                kecamatan: baseline.kecamatan,
                hasEndline: endline !== null,
                pemilahan: {
                    baseline: baselinePemilahan,
                    endline: endlinePemilahan,
                    delta: baselinePemilahan !== null && endlinePemilahan !== null
                        ? endlinePemilahan - baselinePemilahan
                        : null,
                },
                volumeSampah: {
                    baseline: baselineVolume,
                    endline: endlineVolume,
                    delta: baselineVolume !== null && endlineVolume !== null
                        ? endlineVolume - baselineVolume
                        : null,
                },
                bankSampahAktif: {
                    baseline: baselineBankSampah,
                    endline: endlineBankSampah,
                    delta: baselineBankSampah !== null && endlineBankSampah !== null
                        ? endlineBankSampah - baselineBankSampah
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
async function buildKelurahanScope(userId, userRole) {
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
        .filter(Boolean);
    if (kelurahanNames.length === 0) {
        return { namaKelurahan: { in: [] } }; // Kosong — DPL belum punya kelompok
    }
    return {
        namaKelurahan: { in: kelurahanNames },
    };
}
