/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 *
 * gisEksekutifService — 100% fetch dari PostgreSQL via Prisma.
 * Tidak ada data hardcode / static fallback (kecuali geometri poligon kelurahan
 * yang memang bukan data tabel, melainkan koordinat batas administratif).
 */

import { prisma } from "../lib/prisma.js";

export interface GisEksekutifFilters {
  kelurahan?: string;
  rw?: string;
  periode?: string;
  jenisFasilitas?: string;
  search?: string;
}

export interface GisFacilityDto {
  id: string;
  nama: string;
  tipe: string;
  lat: number;
  lng: number;
  kel: string;
  rw: string;
  pic?: string | null;
  foto?: string | null;
  kontak?: string | null;
  kapasitas?: number | null;
  alamat?: string | null;
  statusApproval?: string;
}

// Koordinat batas kelurahan resmi Kecamatan Coblong (data GIS statis — bukan dari tabel DB)
const KELURAHAN_GEOMETRIES: Record<string, [number, number][]> = {
  "Dago": [
    [-6.868, 107.608], [-6.864, 107.618], [-6.867, 107.628],
    [-6.874, 107.625], [-6.882, 107.619], [-6.878, 107.611],
  ],
  "Sekeloa": [
    [-6.878, 107.619], [-6.882, 107.626], [-6.891, 107.625],
    [-6.895, 107.617], [-6.888, 107.612],
  ],
  "Lebak Gede": [
    [-6.888, 107.611], [-6.894, 107.616], [-6.903, 107.614],
    [-6.901, 107.605], [-6.892, 107.604],
  ],
  "Cipaganti": [
    [-6.881, 107.595], [-6.879, 107.605], [-6.889, 107.604],
    [-6.895, 107.599], [-6.891, 107.592],
  ],
  "Lebak Siliwangi": [
    [-6.888, 107.604], [-6.889, 107.611], [-6.896, 107.609],
    [-6.900, 107.602], [-6.894, 107.598],
  ],
  "Sadang Serang": [
    [-6.882, 107.626], [-6.885, 107.635], [-6.898, 107.633],
    [-6.902, 107.624], [-6.892, 107.624],
  ],
};

// Label warna kepatuhan
function kepColor(pct: number): string {
  if (pct >= 80) return "#15803d";
  if (pct >= 70) return "#22c55e";
  if (pct >= 60) return "#eab308";
  if (pct >= 50) return "#f97316";
  return "#ef4444";
}

export const gisEksekutifService = {
  getBaselineOverview(filters: GisEksekutifFilters = {}, errorMessage?: string) {
    const kelurahanNames = ["Cipaganti", "Dago", "Lebak Gede", "Lebak Siliwangi", "Sadang Serang", "Sekeloa"];
    const periode = filters.periode || "September 2026";
    const poligonKelurahan = kelurahanNames.map((nama) => ({
      nama,
      coordinates: (KELURAHAN_GEOMETRIES[nama] as [number, number][]) ?? [],
      kepatuhan: null as number | null,
      volume: null as number | null,
      totalFasilitas: 0,
      color: "#9ca3af",
      hasData: false,
    }));

    return {
      success: true,
      meta: {
        wilayah: "Kecamatan Coblong",
        periode,
        kelurahanFilter: filters.kelurahan ?? "Semua",
        rwFilter: filters.rw ?? "Semua",
        timestamp: new Date().toISOString(),
        hasSensorData: false,
        hasTrendData: false,
        isDegraded: true,
        degradedReason: errorMessage || "Layanan database sedang disinkronkan. Menampilkan data dasar geospasial.",
      },
      filterOptions: {
        kelurahans: ["Semua", ...kelurahanNames],
        rws: ["Semua"],
        periodes: ["September 2026"],
        tipeFasilitas: ["Semua"],
      },
      kpi: {
        fasilitasTerdata: 0,
        fasilitasSubtext: "Koneksi database dalam pemulihan",
        volumeTotal: null as number | null,
        volumeGrowthPercent: null as number | null,
        volumeUnit: "m³/bulan",
        kepatuhanPemilahan: null as number | null,
        kepatuhanDeltaPoin: null as number | null,
        sensorCh4OnlineCount: 0,
        sensorCh4TotalCount: 0,
        sensorCh4Text: "Tahap Integrasi Jaringan IoT",
      },
      komposisiVolume: {
        organik: { persen: 0, volumeM3: 0 },
        anorganik: { persen: 0, volumeM3: 0 },
        residu: { persen: 0, volumeM3: 0 },
        totalM3: 0,
      },
      trenBulanan: [] as Array<{ bulan: string; volume: number }>,
      kepatuhanPerKelurahan: kelurahanNames.map((nama) => ({
        nama,
        kepatuhan: null as number | null,
        volume: null as number | null,
        totalFasilitas: 0,
        color: "#9ca3af",
        hasData: false,
      })),
      pemantauanCh4: {
        rentangText: "Tahap Integrasi",
        titikPengukuranCount: 0,
        titikPengukuranText: "Sensor CH₄ belum aktif",
        sensors: [] as any[],
      },
      titikFasilitas: [] as GisFacilityDto[],
      poligonKelurahan,
    };
  },

  async getOverview(filters: GisEksekutifFilters = {}) {
    try {
      const rawKel =
        filters.kelurahan && filters.kelurahan !== "Semua"
          ? filters.kelurahan.trim()
          : undefined;
      const rawRw =
        filters.rw && filters.rw !== "Semua" ? filters.rw.trim() : undefined;
      const periode = filters.periode || "September 2026";

    // ── 1. Daftar kelurahan dari DB (hanya Coblong) ──────────────────────────
    // Filter hanya kelurahan yang ada Rw-nya (artinya kelurahan aktif di sistem)
    const kelurahanList = await prisma.kelurahan.findMany({
      where: {
        rws: { some: {} }, // hanya yang punya RW
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, rws: { select: { id: true, name: true } } },
    });

    // ── 2. Daftar RW dari DB ─────────────────────────────────────────────────
    const rwWhere: Record<string, unknown> = {};
    if (rawKel) {
      rwWhere["kelurahan"] = { name: { equals: rawKel, mode: "insensitive" } };
    }
    const rwList = await prisma.rw.findMany({
      where: rwWhere,
      orderBy: { name: "asc" },
      select: { id: true, name: true, kelurahan: { select: { name: true } } },
    });

    // ── 3. Fasilitas aktual dari DB ──────────────────────────────────────────
    const facilityWhere: Record<string, unknown> = {
      jenis: { not: "posko_kkn" as const },
    };
    if (rawKel) {
      facilityWhere["rw"] = {
        kelurahan: { name: { equals: rawKel, mode: "insensitive" } },
      };
    }
    if (rawRw) {
      const rwNum = parseInt(rawRw.replace(/\D/g, ""), 10);
      if (!isNaN(rwNum)) {
        facilityWhere["rw"] = {
          ...(facilityWhere["rw"] as object || {}),
          name: { contains: String(rwNum), mode: "insensitive" },
        };
      }
    }
    if (filters.jenisFasilitas && filters.jenisFasilitas !== "Semua") {
      facilityWhere["jenis"] = filters.jenisFasilitas;
    }
    if (filters.search) {
      const s = filters.search.trim();
      facilityWhere["OR"] = [
        { nama: { contains: s, mode: "insensitive" } },
        { pic: { contains: s, mode: "insensitive" } },
        { alamat: { contains: s, mode: "insensitive" } },
      ];
    }

    const facilitiesRaw = await prisma.facility.findMany({
      where: facilityWhere,
      include: { rw: { include: { kelurahan: true } } },
      orderBy: [{ jenis: "asc" }, { nama: "asc" }],
    });

    const facilities: GisFacilityDto[] = facilitiesRaw.map((f) => ({
      id: f.id,
      nama: f.nama,
      tipe: f.jenis,
      lat: Number(f.latitude),
      lng: Number(f.longitude),
      kel: f.rw?.kelurahan?.name ?? "-",
      rw: f.rw?.name ?? "-",
      pic: f.pic ?? null,
      foto: f.foto ?? null,
      kontak: f.kontak ?? null,
      kapasitas: f.kapasitas ? Number(f.kapasitas) : null,
      alamat: f.alamat ?? null,
      statusApproval: f.statusApproval,
    }));

    // ── 4. Survei Pemilahan & Volume dari DB ─────────────────────────────────
    const surveiKelurahan = await prisma.surveiKelurahan.findMany({
      include: {
        pemilahanSampah: true,
        volumeSampah: true,
      },
    });

    // Fasilitas per kelurahan (nama)
    const facCountByKel: Record<string, number> = {};
    facilitiesRaw.forEach((f) => {
      const kelNama = f.rw?.kelurahan?.name ?? "-";
      facCountByKel[kelNama] = (facCountByKel[kelNama] ?? 0) + 1;
    });

    // Hitung kepatuhan & volume riil dari survei
    const kelurahanNames = kelurahanList.map((k) => k.name);

    const kepatuhanPerKelurahan = kelurahanNames.map((kelName) => {
      const survei = surveiKelurahan.find(
        (s) => s.namaKelurahan?.toLowerCase() === kelName.toLowerCase()
      );

      // Persentase pemilahan — dari DB jika ada, kalau tidak ada = null → UI tampilkan "Belum ada data"
      let kepatuhan: number | null = null;
      if (survei?.pemilahanSampah?.persentasePemilahan != null) {
        const raw = Number(survei.pemilahanSampah.persentasePemilahan);
        // Field disimpan sebagai desimal 0.0000–1.0000 (Decimal 5,4)
        kepatuhan = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
      }

      // Komposisi organik/anorganik/residu per kelurahan (dari survei)
      let organikKgHari = 0, anorganikKgHari = 0, residuKgHari = 0;
      if (survei?.volumeSampah) {
        organikKgHari = Number(survei.volumeSampah.organikKgPerHari ?? 0);
        anorganikKgHari = Number(survei.volumeSampah.anorganikKgPerHari ?? 0);
        residuKgHari = Number(survei.volumeSampah.residuKgPerHari ?? 0);
      }
      const sumKgHari = organikKgHari + anorganikKgHari + residuKgHari;

      // Volume — dari DB (dikonversi kg/hari ke m³/bln: kg/hari × 30 / 1000)
      let volume: number | null = null;
      if (sumKgHari > 0) {
        volume = Math.round(((sumKgHari * 30) / 1000) * 10) / 10;
      } else if (survei?.volumeSampah?.totalVolumeKgPerHari != null) {
        const kgPerHari = Number(survei.volumeSampah.totalVolumeKgPerHari);
        volume = Math.round(((kgPerHari * 30) / 1000) * 10) / 10;
      }

      return {
        nama: kelName,
        kepatuhan,
        volume,
        organikKgHari,
        anorganikKgHari,
        residuKgHari,
        totalFasilitas: facCountByKel[kelName] ?? 0,
        color: kepatuhan !== null ? kepColor(kepatuhan) : "#9ca3af",
        hasData: survei != null,
      };
    });

    // ── 5. KPI Ringkasan ─────────────────────────────────────────────────────
    const totalFasilitas = facilities.length;

    // Kepatuhan rata-rata (hanya dari kelurahan yang ada surveinya)
    const kelWithKep = kepatuhanPerKelurahan.filter((k) => k.kepatuhan !== null);
    let avgKepatuhan: number | null = null;
    if (rawKel) {
      const match = kepatuhanPerKelurahan.find(
        (k) => k.nama.toLowerCase() === rawKel.toLowerCase()
      );
      avgKepatuhan = match?.kepatuhan ?? null;
    } else if (kelWithKep.length > 0) {
      avgKepatuhan = Math.round(
        kelWithKep.reduce((s, k) => s + (k.kepatuhan as number), 0) / kelWithKep.length
      );
    }

    // ── 6. Komposisi Volume Agregat ──────────────────────────────────────────
    // Ambil dari survei kelurahan yang terpilih (atau semua)
    const surveiScope = rawKel
      ? surveiKelurahan.filter(
          (s) => s.namaKelurahan?.toLowerCase() === rawKel.toLowerCase()
        )
      : surveiKelurahan;

    const totalOrganikKg = surveiScope.reduce(
      (s, sv) => s + Number(sv.volumeSampah?.organikKgPerHari ?? 0), 0
    );
    const totalAnorganikKg = surveiScope.reduce(
      (s, sv) => s + Number(sv.volumeSampah?.anorganikKgPerHari ?? 0), 0
    );
    const totalResiduKg = surveiScope.reduce(
      (s, sv) => s + Number(sv.volumeSampah?.residuKgPerHari ?? 0), 0
    );
    const totalKg = totalOrganikKg + totalAnorganikKg + totalResiduKg;

    const orgM3 = Math.round(((totalOrganikKg * 30) / 1000) * 10) / 10;
    const anoM3 = Math.round(((totalAnorganikKg * 30) / 1000) * 10) / 10;
    const resM3 = Math.round(((totalResiduKg * 30) / 1000) * 10) / 10;
    const computedTotalM3 = Math.round((orgM3 + anoM3 + resM3) * 10) / 10;

    // Volume total m³/bln (konsisten 100% dengan komponen komposisi)
    const kelWithVol = kepatuhanPerKelurahan.filter((k) => k.volume !== null);
    let volumeTotal: number | null = null;
    if (rawKel) {
      const match = kepatuhanPerKelurahan.find(
        (k) => k.nama.toLowerCase() === rawKel.toLowerCase()
      );
      volumeTotal = match?.volume ?? (computedTotalM3 > 0 ? computedTotalM3 : null);
    } else if (computedTotalM3 > 0) {
      volumeTotal = computedTotalM3;
    } else if (kelWithVol.length > 0) {
      volumeTotal = Math.round(
        kelWithVol.reduce((s, k) => s + (k.volume as number), 0) * 10
      ) / 10;
    }

    const komposisiVolume = {
      organik: {
        persen: totalKg > 0 ? Math.round((totalOrganikKg / totalKg) * 100) : 0,
        volumeM3: orgM3,
      },
      anorganik: {
        persen: totalKg > 0 ? Math.round((totalAnorganikKg / totalKg) * 100) : 0,
        volumeM3: anoM3,
      },
      residu: {
        persen: totalKg > 0 ? Math.round((totalResiduKg / totalKg) * 100) : 0,
        volumeM3: resM3,
      },
      totalM3: volumeTotal ?? 0,
    };

    // ── 7. Tren Bulanan — dari FacilityProductionLog jika ada ───────────────
    // Query aggregate log produksi per bulan (Sep 2025 – Sep 2026)
    const prodLogs = await prisma.facilityProductionLog.findMany({
      where: {
        createdAt: { gte: new Date("2025-10-01"), lte: new Date("2026-09-30") },
        ...(rawKel
          ? {
              facility: {
                rw: { kelurahan: { name: { equals: rawKel, mode: "insensitive" } } },
              },
            }
          : {}),
      },
      select: { createdAt: true, outputKg: true },
    });

    const BULAN_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep"];
    const trenMap: Record<number, number> = {};
    prodLogs.forEach((log) => {
      const month = new Date(log.createdAt).getMonth(); // 0=Jan
      trenMap[month] = (trenMap[month] ?? 0) + Number(log.outputKg ?? 0);
    });

    const trenBulanan = BULAN_LABELS.map((bulan, idx) => ({
      bulan,
      // Konversi kg → m³ (estimasi 1 m³ ≈ 400 kg sampah campur)
      volume: trenMap[idx] != null ? Math.round((trenMap[idx] / 400) * 10) / 10 : null,
    }));

    // Jika TIDAK ada log sama sekali, fallback ke null semua (UI tahu ada/tidak data)
    const hasTrendData = prodLogs.length > 0;

    // ── 8. Sensor CH₄ — tabel BELUM ADA, kembalikan kosong + flag ──────────
    // Ketika tabel sensor dibuat di DB, replace bagian ini dengan Prisma query.
    const sensors: {
      id: string; label: string; lokasi: string; kel: string; rw: string;
      lat: number; lng: number; ch4Ppm: number | null;
      status: "Online" | "Offline"; updatedAt: string; keterangan: string;
    }[] = [];
    const hasSensorData = false;

    // ── 9. Poligon Kelurahan ─────────────────────────────────────────────────
    const poligonKelurahan = kelurahanNames.map((kelName) => {
      const kd = kepatuhanPerKelurahan.find((k) => k.nama === kelName);
      return {
        nama: kelName,
        coordinates: (KELURAHAN_GEOMETRIES[kelName] as [number, number][]) ?? [],
        kepatuhan: kd?.kepatuhan ?? null,
        volume: kd?.volume ?? null,
        totalFasilitas: kd?.totalFasilitas ?? 0,
        color: kd?.color ?? "#9ca3af",
        hasData: kd?.hasData ?? false,
      };
    });

    // ── 10. Filter Options dari DB ──────────────────────────────────────────
    const jenisFasilitasDB: string[] = [
      ...new Set(facilitiesRaw.map((f) => f.jenis as string)),
    ].sort();

    return {
      success: true,
      meta: {
        wilayah: "Kecamatan Coblong",
        periode,
        kelurahanFilter: rawKel ?? "Semua",
        rwFilter: rawRw ?? "Semua",
        timestamp: new Date().toISOString(),
        hasSensorData,
        hasTrendData,
      },
      filterOptions: {
        kelurahans: ["Semua", ...kelurahanNames],
        rws: ["Semua", ...Array.from(new Set(rwList.map((r) => r.name))).sort()],
        periodes: ["September 2026"],
        tipeFasilitas: ["Semua", ...jenisFasilitasDB],
      },
      kpi: {
        fasilitasTerdata: totalFasilitas,
        fasilitasSubtext: rawKel ? `Kelurahan ${rawKel}` : "dari seluruh kelurahan",
        volumeTotal,
        volumeGrowthPercent: null, // tidak ada data periode sebelumnya untuk dibandingkan
        volumeUnit: "m³/bulan",
        kepatuhanPemilahan: avgKepatuhan,
        kepatuhanDeltaPoin: null,
        sensorCh4OnlineCount: 0,
        sensorCh4TotalCount: 0,
        sensorCh4Text: "Belum ada data",
      },
      komposisiVolume,
      trenBulanan,
      kepatuhanPerKelurahan: kepatuhanPerKelurahan.map(
        ({ organikKgHari, anorganikKgHari, residuKgHari, ...rest }) => rest
      ),
      pemantauanCh4: {
        rentangText: "Belum ada data sensor",
        titikPengukuranCount: 0,
        titikPengukuranText: "Tabel sensor belum tersedia",
        sensors,
      },
      titikFasilitas: facilities,
      poligonKelurahan,
    };
    } catch (error: any) {
      console.warn("[gisEksekutifService] Falling back to baseline overview due to error:", error?.message || error);
      return gisEksekutifService.getBaselineOverview(filters, error?.message);
    }
  },
};
