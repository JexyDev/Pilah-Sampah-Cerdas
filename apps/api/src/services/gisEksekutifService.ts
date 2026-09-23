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

// Label warna kepatuhan sesuai standar QC
function kepColor(pct: number): string {
  if (pct >= 25) return "#00a86b";
  if (pct >= 10) return "#f59e0b";
  return "#ef4444";
}

export const PROGRAM_MONTHS = [
  { label: "Agu", monthIdx: 7, name: "Agustus" },
  { label: "Sep", monthIdx: 8, name: "September" },
  { label: "Okt", monthIdx: 9, name: "Oktober" },
  { label: "Nov", monthIdx: 10, name: "November" },
  { label: "Des", monthIdx: 11, name: "Desember" },
];

export const AVAILABLE_PERIODES = [
  "Agustus 2026",
  "September 2026",
  "Oktober 2026",
  "November 2026",
  "Desember 2026",
];

const FACILITY_TYPE_MAP: Record<string, string> = {
  bank: "bank_sampah",
  bank_sampah: "bank_sampah",
  maggot: "rumah_maggot",
  rumah_maggot: "rumah_maggot",
  sae: "buruan_sae",
  buruan_sae: "buruan_sae",
  loseda: "loseda",
  bata: "bata_terawang",
  bata_terawang: "bata_terawang",
  tps: "tps",
  tpst: "tps",
  poc: "poc",
  posko: "posko_kkn",
  posko_kkn: "posko_kkn",
};

const VALID_FACILITY_TYPES = new Set([
  "loseda",
  "bata_terawang",
  "rumah_maggot",
  "bank_sampah",
  "tps",
  "buruan_sae",
  "poc",
  "posko_kkn",
]);

export const gisEksekutifService = {

  async getOverview(filters: GisEksekutifFilters = {}) {
    try {
      const rawKel =
        filters.kelurahan && filters.kelurahan !== "Semua"
          ? filters.kelurahan.trim()
          : undefined;
      const rawRw =
        filters.rw && filters.rw !== "Semua" ? filters.rw.trim() : undefined;
      const periode = filters.periode || "September 2026";
      const periodeLower = periode.toLowerCase();
      const MONTH_INDEX_MAP: Record<string, number> = {
        agu: 7, sep: 8, okt: 9, nov: 10, des: 11,
      };
      let activeMonthIdx = 8; // Default September (fase baseline survei utama)
      for (const [key, idx] of Object.entries(MONTH_INDEX_MAP)) {
        if (periodeLower.includes(key)) {
          activeMonthIdx = idx;
          break;
        }
      }
      const isFuturePeriod = activeMonthIdx > 8;
      const isKickoffPeriod = activeMonthIdx === 7;

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
      const rawType = filters.jenisFasilitas.toLowerCase().trim();
      const mappedType = FACILITY_TYPE_MAP[rawType] || rawType;
      if (VALID_FACILITY_TYPES.has(mappedType)) {
        facilityWhere["jenis"] = mappedType as any;
      }
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
    let surveiKelurahan: Array<{
      namaKelurahan: string;
      pemilahanSampah?: { persentasePemilahan?: any } | null;
      volumeSampah?: {
        organikKgPerHari?: any;
        anorganikKgPerHari?: any;
        residuKgPerHari?: any;
        totalVolumeKgPerHari?: any;
      } | null;
    }> = [];

    if (isFuturePeriod) {
      // Periode masa depan (Oktober – Desember 2026): HANYA ambil data riil dari EndlineSurveiKelurahan
      // Jika belum ada data evaluasi endline di database, data harus murni 0 / null (DILARANG fallback ke baseline September)
      try {
        const endlineSurvei = await prisma.endlineSurveiKelurahan.findMany({
          include: {
            pemilahanSampah: true,
            volumeSampah: true,
          },
        });
        if (endlineSurvei && endlineSurvei.length > 0) {
          surveiKelurahan = endlineSurvei.map((e) => ({
            namaKelurahan: e.namaKelurahan,
            pemilahanSampah: e.pemilahanSampah,
            volumeSampah: e.volumeSampah,
          }));
        }
      } catch (err) {
        console.warn("[gisEksekutifService] Gagal memuat data endline:", err);
      }
    } else if (activeMonthIdx === 8) {
      // Periode baseline survei penuh (September 2026): Ambil dari surveiKelurahan baseline
      surveiKelurahan = await prisma.surveiKelurahan.findMany({
        include: {
          pemilahanSampah: true,
          volumeSampah: true,
        },
      });
    } else {
      // Periode Kickoff (Agustus 2026): Penerjunan 12 Agustus 2026, survei kelurahan belum difinalisasi
      surveiKelurahan = [];
    }

    // Fasilitas per kelurahan (nama)
    const facCountByKel: Record<string, number> = {};
    facilitiesRaw.forEach((f) => {
      const kelNama = f.rw?.kelurahan?.name ?? "-";
      facCountByKel[kelNama] = (facCountByKel[kelNama] ?? 0) + 1;
    });

    // Hitung kepatuhan & volume riil dari survei (murni data DB, tanpa angka tebakan/hardcode)
    const kelurahanNames = kelurahanList.length > 0
      ? kelurahanList.map((k) => k.name)
      : Object.keys(KELURAHAN_GEOMETRIES);

    // Filter setoran bulanan untuk evaluasi performa dinamis
    const startOfMonth = new Date(Date.UTC(2026, activeMonthIdx, 1));
    const endOfMonth = new Date(Date.UTC(2026, activeMonthIdx + 1, 0, 23, 59, 59, 999));
    
    const setoranBulanan = await prisma.setoranOtomatis.findMany({
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        warga: { isTestAccount: false }
      },
      select: {
        status: true,
        warga: {
          select: { rw: { select: { kelurahanId: true, kelurahan: { select: { name: true } } } } }
        }
      }
    });

    const kepatuhanAktual: Record<string, { total: number, patuh: number }> = {};
    setoranBulanan.forEach((s) => {
      const kelName = s.warga?.rw?.kelurahan?.name;
      if (!kelName) return;
      
      const key = kelName.toLowerCase();
      if (!kepatuhanAktual[key]) {
        kepatuhanAktual[key] = { total: 0, patuh: 0 };
      }
      
      kepatuhanAktual[key].total += 1;
      if (s.status === "ACCEPTED") {
        kepatuhanAktual[key].patuh += 1;
      }
    });

    const kepatuhanPerKelurahan = kelurahanNames.map((kelName) => {
      const survei = surveiKelurahan.find(
        (s) => s.namaKelurahan?.toLowerCase() === kelName.toLowerCase()
      );

      let kepatuhan: number | null = null;
      const key = kelName.toLowerCase();
      const realData = kepatuhanAktual[key];

      if (realData && realData.total > 0) {
        // Gunakan data transaksi real jika ada
        kepatuhan = Math.round((realData.patuh / realData.total) * 100);
      } else if (survei?.pemilahanSampah?.persentasePemilahan != null) {
        // Fallback ke survei KKN jika transaksi belum terjadi sama sekali
        const raw = Number(survei.pemilahanSampah.persentasePemilahan);
        // Field disimpan sebagai desimal 0.0000–1.0000 (Decimal 5,4)
        kepatuhan = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
        kepatuhan = Math.max(0, Math.min(100, kepatuhan));
      }

      // Komposisi organik/anorganik/residu per kelurahan (dari DB)
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

      const hasSurveiData = Boolean(
        survei && (
          (survei.pemilahanSampah && survei.pemilahanSampah.persentasePemilahan != null) ||
          (survei.volumeSampah && (sumKgHari > 0 || survei.volumeSampah.totalVolumeKgPerHari != null))
        )
      );

      return {
        nama: kelName,
        kepatuhan,
        volume,
        organikKgHari,
        anorganikKgHari,
        residuKgHari,
        totalFasilitas: facCountByKel[kelName] ?? 0,
        color: kepatuhan !== null ? kepColor(kepatuhan) : "#9ca3af",
        hasData: hasSurveiData,
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

    const baseOrgKg = surveiScope.reduce(
      (s, sv) => s + Number(sv.volumeSampah?.organikKgPerHari ?? 0), 0
    );
    const baseAnoKg = surveiScope.reduce(
      (s, sv) => s + Number(sv.volumeSampah?.anorganikKgPerHari ?? 0), 0
    );
    const baseResKg = surveiScope.reduce(
      (s, sv) => s + Number(sv.volumeSampah?.residuKgPerHari ?? 0), 0
    );
    const baseTotalKg = baseOrgKg + baseAnoKg + baseResKg;

    const baseOrgM3 = Math.round(((baseOrgKg * 30) / 1000) * 10) / 10;
    const baseAnoM3 = Math.round(((baseAnoKg * 30) / 1000) * 10) / 10;
    const baseResM3 = Math.round(((baseResKg * 30) / 1000) * 10) / 10;
    const computedBaseTotalM3 = Math.round((baseOrgM3 + baseAnoM3 + baseResM3) * 10) / 10;

    const orgM3 = baseOrgM3;
    const anoM3 = baseAnoM3;
    const resM3 = baseResM3;
    const computedTotalM3 = computedBaseTotalM3;
    const scaledTotalKg = baseTotalKg;

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

    const hasData = baseTotalKg > 0;
    const komposisiVolume = {
      organik: {
        persen: baseTotalKg > 0 ? Math.round((baseOrgKg / baseTotalKg) * 100) : 0,
        volumeM3: orgM3,
        kgHari: baseOrgKg,
      },
      anorganik: {
        persen: baseTotalKg > 0 ? Math.round((baseAnoKg / baseTotalKg) * 100) : 0,
        volumeM3: anoM3,
        kgHari: baseAnoKg,
      },
      residu: {
        persen: baseTotalKg > 0 ? Math.round((baseResKg / baseTotalKg) * 100) : 0,
        volumeM3: resM3,
        kgHari: baseResKg,
      },
      totalM3: volumeTotal ?? computedTotalM3,
      totalKgHari: scaledTotalKg,
      hasData,
    };

    // ── 7. Tren Bulanan — integrasi log produksi fasilitas dan deret linimasa KKN resmi (Agustus – Desember 2026) ──
    // Query aggregate log produksi per bulan sepanjang linimasa KKN (Agustus – Desember 2026)
    const prodLogs = await prisma.facilityProductionLog.findMany({
      where: {
        createdAt: { gte: new Date("2026-08-01T00:00:00.000Z"), lte: new Date("2026-12-31T23:59:59.999Z") },
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

    const prodMap: Record<number, number> = {};
    prodLogs.forEach((log) => {
      const month = new Date(log.createdAt).getMonth(); // 7=Agu, 8=Sep, 9=Okt, 10=Nov, 11=Des
      prodMap[month] = (prodMap[month] ?? 0) + Number(log.outputKg ?? 0);
    });

    // Ambil baseline survei September jika periode aktif bukan September
    let sepBaselineVolume = 0;
    if (activeMonthIdx === 8) {
      sepBaselineVolume = computedBaseTotalM3;
    } else {
      const sepSurvei = await prisma.surveiKelurahan.findMany({
        where: rawKel ? { namaKelurahan: { equals: rawKel, mode: "insensitive" } } : {},
        include: { volumeSampah: true },
      });
      const orgKg = sepSurvei.reduce((s, sv) => s + Number(sv.volumeSampah?.organikKgPerHari ?? 0), 0);
      const anoKg = sepSurvei.reduce((s, sv) => s + Number(sv.volumeSampah?.anorganikKgPerHari ?? 0), 0);
      const resKg = sepSurvei.reduce((s, sv) => s + Number(sv.volumeSampah?.residuKgPerHari ?? 0), 0);
      const totalKg = orgKg + anoKg + resKg;
      if (totalKg > 0) {
        sepBaselineVolume = Math.round(((totalKg * 30) / 1000) * 10) / 10;
      }
    }

    // Jika periode aktif adalah Agustus dan ada log produksi di Agustus, sinkronkan volumeTotal
    if (isKickoffPeriod && prodMap[7] != null && prodMap[7] > 0) {
      volumeTotal = Math.round((prodMap[7] / 400) * 10) / 10;
      komposisiVolume.totalM3 = volumeTotal;
      komposisiVolume.hasData = true;
    }

    const trenBulanan = PROGRAM_MONTHS.map(({ label, monthIdx }) => {
      let vol = 0;
      if (monthIdx === 8) {
        vol = sepBaselineVolume;
      } else if (monthIdx > 8 && activeMonthIdx === monthIdx && isFuturePeriod) {
        vol = computedBaseTotalM3;
      }
      if (prodMap[monthIdx] != null && prodMap[monthIdx] > 0) {
        vol = Math.round((vol + (prodMap[monthIdx] / 400)) * 10) / 10;
      }
      return { bulan: label, volume: vol };
    });

    // Indeks dalam deret 5 bulan linimasa KKN (0=Agu, 1=Sep, 2=Okt, 3=Nov, 4=Des)
    const programMonthIdx = PROGRAM_MONTHS.findIndex((pm) => pm.monthIdx === activeMonthIdx);
    const prevProgramMonthIdx = programMonthIdx > 0 ? programMonthIdx - 1 : null;

    const currentVol = isFuturePeriod || isKickoffPeriod
      ? (volumeTotal ?? null)
      : ((computedBaseTotalM3 > 0 || prodLogs.length > 0)
          ? (trenBulanan[programMonthIdx]?.volume ?? volumeTotal)
          : null);

    const prevVol = prevProgramMonthIdx !== null ? trenBulanan[prevProgramMonthIdx]?.volume : null;
    const previousMonthName = prevProgramMonthIdx !== null ? PROGRAM_MONTHS[prevProgramMonthIdx].label : null;

    let growthPct: number | null = null;
    if (currentVol != null && currentVol > 0 && prevVol != null && prevVol > 0) {
      growthPct = Math.round(((currentVol - prevVol) / prevVol) * 1000) / 10;
    }

    const hasTrendData = prodLogs.length > 0 || (activeMonthIdx === 8 && computedBaseTotalM3 > 0) || (isKickoffPeriod && (volumeTotal ?? 0) > 0);

    // ── 8. Sensor CH₄ — infrastruktur gateway & sensor dalam tahap integrasi ──
    const sensors: {
      id: string; label: string; lokasi: string; kel: string; rw: string;
      lat: number; lng: number; ch4Ppm: number | null;
      status: "Online" | "Offline"; updatedAt: string; keterangan: string;
    }[] = [];
    const hasSensorData = false;

    // ── 9. Poligon Kelurahan ─────────────────────────────────────────────────
    const poligonKelurahan = kelurahanNames.map((kelName) => {
      const kd = kepatuhanPerKelurahan.find((k) => k.nama.toLowerCase() === kelName.toLowerCase());
      const kep = kd?.kepatuhan ?? null;
      return {
        nama: kelName,
        coordinates: (KELURAHAN_GEOMETRIES[kelName] as [number, number][]) ?? [],
        kepatuhan: kep,
        volume: kd?.volume ?? null,
        totalFasilitas: kd?.totalFasilitas ?? 0,
        color: kep !== null ? kepColor(kep) : "#9ca3af",
        hasData: kd?.hasData ?? false,
      };
    });

    // ── 10. Filter Options dari DB ──────────────────────────────────────────
    // Ambil daftar lengkap jenis fasilitas agar seluruh opsi tetap muncul dan dapat dipilih
    const systemTypes = Array.from(VALID_FACILITY_TYPES).filter((t) => t !== "posko_kkn");
    let jenisFasilitasDB: string[] = [];
    try {
      const allTypes = await prisma.facility.findMany({
        where: { jenis: { not: "posko_kkn" as const } },
        distinct: ["jenis"],
        select: { jenis: true },
      });
      jenisFasilitasDB = allTypes.map((f) => f.jenis as string).filter(Boolean);
    } catch {
      // fallback jika mock tidak menyediakan distinct
    }

    jenisFasilitasDB = Array.from(new Set([...systemTypes, ...jenisFasilitasDB])).sort();

    return {
      success: true,
      meta: {
        wilayah: "Kecamatan Coblong",
        periode,
        activeMonthIndex: activeMonthIdx,
        kelurahanFilter: rawKel ?? "Semua",
        rwFilter: rawRw ?? "Semua",
        timestamp: new Date().toISOString(),
        hasSensorData,
        hasTrendData,
      },
      filterOptions: {
        kelurahans: ["Semua", ...kelurahanNames],
        rws: ["Semua", ...Array.from(new Set(rwList.map((r) => r.name))).sort()],
        periodes: [...AVAILABLE_PERIODES],
        tipeFasilitas: ["Semua", ...jenisFasilitasDB],
      },
      kpi: {
        fasilitasTerdata: totalFasilitas,
        fasilitasSubtext: rawKel ? `Kelurahan ${rawKel}` : `${kelurahanNames.length} kelurahan`,
        volumeTotal: currentVol,
        volumeGrowthPercent: growthPct,
        previousMonthName,
        activeMonthIndex: activeMonthIdx,
        volumeUnit: "m³/bulan",
        kepatuhanPemilahan: avgKepatuhan,
        kepatuhanDeltaPoin: 0,
        sensorCh4OnlineCount: 0,
        sensorCh4TotalCount: 0,
        sensorCh4Text: "Tahap integrasi",
        sensorCh4ProgressPercent: 0,
      },
      komposisiVolume,
      trenBulanan,
      kepatuhanPerKelurahan,
      pemantauanCh4: {
        rentangText: "— ppm",
        titikPengukuranCount: 0,
        titikPengukuranText: "0 dari 0 sensor online",
        status: "Tahap Integrasi IoT",
        statusDeskripsi: "Telemetri belum aktif. Belum ada sensor IoT yang terhubung ke database.",
        cakupan: "Coblong",
        satuan: "ppm",
        sensorOnline: "0/0",
        placeholderVal: "— ppm",
        placeholderStatus: "Belum ada data",
        placeholderSub: "Sensor IoT belum terpasang",
        progressPercent: 0,
        sensors,
      },
      titikFasilitas: facilities,
      poligonKelurahan,
    };
    } catch (error: any) {
      console.error("[gisEksekutifService] Error executing dynamic getOverview:", error);
      throw error;
    }
  },
};
