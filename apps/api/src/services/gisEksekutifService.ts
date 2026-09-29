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
import { classifyWaste } from "./dashboardService.js";

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

// Label warna kepatuhan sesuai standar QC (≥ 60% Hijau, 40-59% Kuning, < 40% Merah)
function kepColor(pct: number): string {
  if (pct >= 60) return "#00a86b";
  if (pct >= 40) return "#f59e0b";
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

    // ── 2. Daftar RW & Total Warga dari DB ──────────────────────────────────
    const allRwList = await prisma.rw.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        kelurahan: { select: { name: true } },
        _count: { select: { users: { where: { isTestAccount: false } } } },
      },
    });

    const totalWargaByKel: Record<string, number> = {};
    allRwList.forEach((r) => {
      const kelName = r.kelurahan?.name;
      if (!kelName) return;
      const key = kelName.toLowerCase();
      totalWargaByKel[key] = (totalWargaByKel[key] || 0) + (r._count?.users || 0);
    });

    const rwList = rawKel
      ? allRwList.filter((r) => r.kelurahan?.name?.toLowerCase() === rawKel.toLowerCase())
      : allRwList;

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

    // ── 4. Fasilitas per kelurahan (nama) ───────────────────────────────────
    const facCountByKel: Record<string, number> = {};
    facilitiesRaw.forEach((f) => {
      const kelNama = f.rw?.kelurahan?.name ?? "-";
      facCountByKel[kelNama] = (facCountByKel[kelNama] ?? 0) + 1;
    });

    const kelurahanNames = kelurahanList.length > 0
      ? kelurahanList.map((k) => k.name)
      : Object.keys(KELURAHAN_GEOMETRIES);

    // ── 5. Data Transaksi Riil Sistem (Setoran Otomatis & Setoran Manual) ───
    // Rentang waktu program KKN (Agustus - Desember 2026)
    const programStart = new Date("2026-08-01T00:00:00.000Z");
    const programEnd = new Date("2026-12-31T23:59:59.999Z");

    // A. Setoran Otomatis Warga (Smart Bin IoT & AI)
    const setoranAllWindow = await prisma.setoranOtomatis.findMany({
      where: {
        createdAt: { gte: programStart, lte: programEnd },
        warga: { isTestAccount: false },
      },
      select: {
        id: true,
        wargaId: true,
        status: true,
        berat: true,
        hasilKlasifikasiAi: true,
        kategoriAktual: true,
        createdAt: true,
        warga: {
          select: {
            rw: { select: { kelurahanId: true, kelurahan: { select: { name: true } } } },
          },
        },
        bin: {
          select: {
            rw: { select: { kelurahanId: true, kelurahan: { select: { name: true } } } },
            kelurahan: { select: { name: true } },
          },
        },
      },
    });

    // B. Setoran Manual Petugas Pengangkut
    const setoranManualAllWindow = await prisma.setoranManual.findMany({
      where: {
        createdAt: { gte: programStart, lte: programEnd },
        petugas: { isTestAccount: false },
      },
      select: {
        id: true,
        status: true,
        berat: true,
        kategori: true,
        createdAt: true,
        rw: {
          select: { kelurahanId: true, kelurahan: { select: { name: true } } },
        },
      },
    });

    // Filter transaksi untuk bulan aktif (activeMonthIdx)
    const setoranBulanan = setoranAllWindow.filter(
      (s) => new Date(s.createdAt).getUTCMonth() === activeMonthIdx
    );
    const setoranManualBulanan = setoranManualAllWindow.filter(
      (sm) => new Date(sm.createdAt).getUTCMonth() === activeMonthIdx
    );

    // Struktur agregasi riil per kelurahan (Sumber Primer: Warga)
    interface KelRealMetrics {
      totalSetoran: number;
      patuhSetoran: number;
      organikKg: number; // Murni setoran otomatis warga
      anorganikKg: number; // Murni setoran otomatis warga
      residuKg: number; // Kategori residu tidak digunakan lagi (selalu 0)
      wargaAktifIds: Set<string>;
      // Data terpisah untuk pencatatan petugas pemilah (mencegah double counting)
      petugasOrganikKg: number;
      petugasAnorganikKg: number;
      petugasTotalKg: number;
      petugasSetoranCount: number;
    }
    const realMetricsByKel: Record<string, KelRealMetrics> = {};
    const getOrInitKel = (name: string): KelRealMetrics => {
      const key = name.toLowerCase();
      if (!realMetricsByKel[key]) {
        realMetricsByKel[key] = {
          totalSetoran: 0,
          patuhSetoran: 0,
          organikKg: 0,
          anorganikKg: 0,
          residuKg: 0,
          wargaAktifIds: new Set<string>(),
          petugasOrganikKg: 0,
          petugasAnorganikKg: 0,
          petugasTotalKg: 0,
          petugasSetoranCount: 0,
        };
      }
      return realMetricsByKel[key];
    };

    // Agregasi setoran otomatis warga (Data Timbulan Riil Primer)
    setoranBulanan.forEach((s) => {
      const kelName =
        s.warga?.rw?.kelurahan?.name ||
        s.bin?.rw?.kelurahan?.name ||
        s.bin?.kelurahan?.name;
      if (!kelName) return;
      const m = getOrInitKel(kelName);

      m.totalSetoran += 1;
      if (s.wargaId) m.wargaAktifIds.add(s.wargaId);
      if (s.status === "ACCEPTED") {
        m.patuhSetoran += 1;
      }

      const kg = Number(s.berat || 0);
      const kelas = classifyWaste(s);
      if (kelas === "organik") {
        m.organikKg += kg;
      } else if (kelas === "anorganik") {
        m.anorganikKg += kg;
      }
      // Residu diabaikan/tidak digunakan lagi
    });

    // Agregasi setoran manual petugas pemilah (DIPISAHKAN agar tidak dobel dengan setoran warga)
    setoranManualBulanan.forEach((sm) => {
      const kelName = sm.rw?.kelurahan?.name;
      if (!kelName) return;
      const m = getOrInitKel(kelName);

      const kg = Number(sm.berat || 0);
      const kat = (sm.kategori || "").toLowerCase().trim();
      m.petugasSetoranCount += 1;
      m.petugasTotalKg += kg;

      // urutan penting: "anorganik" mengandung substring "organik"
      if (kat.includes("anorganik") || kat.includes("non-organik") || kat.includes("non organik")) {
        m.petugasAnorganikKg += kg;
      } else if (kat.includes("organik")) {
        m.petugasOrganikKg += kg;
      }
      // Residu diabaikan (tidak digunakan lagi)
    });

    // ── 6. Kepatuhan & Volume Real per Kelurahan (Murni Real Database Warga) ───
    const kepatuhanPerKelurahan = kelurahanNames.map((kelName) => {
      const key = kelName.toLowerCase();
      const real = realMetricsByKel[key];
      const hasRealTransactions = Boolean(
        real && (real.totalSetoran > 0 || (real.organikKg + real.anorganikKg) > 0)
      );

      let kepatuhan: number | null = null;
      let partisipasi: number | null = null;
      let akurasiPilah: number | null = null;

      if (real && real.totalSetoran > 0) {
        const rawAkurasi = (real.patuhSetoran / real.totalSetoran) * 100;
        const wargaAktif = real.wargaAktifIds.size;
        const totalWarga = totalWargaByKel[key] || 1; // Hindari division by zero
        const rawPartisipasi = Math.min((wargaAktif / totalWarga) * 100, 100);

        partisipasi = Math.round(rawPartisipasi);
        akurasiPilah = Math.round(rawAkurasi);
        // Indeks Gabungan (50:50)
        kepatuhan = Math.round((rawPartisipasi * 0.5) + (rawAkurasi * 0.5));
      }

      const organikKg = real ? Math.round(real.organikKg * 10) / 10 : 0;
      const anorganikKg = real ? Math.round(real.anorganikKg * 10) / 10 : 0;
      const residuKg = 0; // Kategori residu tidak digunakan lagi
      const sumKg = Math.round((organikKg + anorganikKg) * 10) / 10;

      // Konversi berat nyata ke volume m³/bulan (DLH/SNI: 1.000 kg = 1 m³)
      const volumeM3 = sumKg > 0 ? Math.round((sumKg / 1000) * 100) / 100 : null;

      return {
        nama: kelName,
        kepatuhan,
        partisipasi,
        akurasiPilah,
        totalSetoran: real ? real.totalSetoran : 0,
        patuhSetoran: real ? real.patuhSetoran : 0,
        volume: volumeM3,
        volumeKg: sumKg > 0 ? sumKg : null,
        organikKgHari: organikKg,
        anorganikKgHari: anorganikKg,
        residuKgHari: residuKg,
        totalFasilitas: facCountByKel[kelName] ?? 0,
        color: kepatuhan !== null ? kepColor(kepatuhan) : "#9ca3af",
        hasData: hasRealTransactions,
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

    // ── 7. Komposisi Volume Agregat (Real Database Murni Warga) ────────────────
    const scopedKels = rawKel
      ? kepatuhanPerKelurahan.filter((k) => k.nama.toLowerCase() === rawKel.toLowerCase())
      : kepatuhanPerKelurahan;

    const baseOrgKg = Math.round(scopedKels.reduce((s, k) => s + (k.organikKgHari || 0), 0) * 10) / 10;
    const baseAnoKg = Math.round(scopedKels.reduce((s, k) => s + (k.anorganikKgHari || 0), 0) * 10) / 10;
    const baseResKg = 0; // Kategori residu tidak digunakan lagi
    const baseTotalKg = Math.round((baseOrgKg + baseAnoKg) * 10) / 10;

    const orgM3 = baseTotalKg > 0 ? Math.round((baseOrgKg / 1000) * 100) / 100 : 0;
    const anoM3 = baseTotalKg > 0 ? Math.round((baseAnoKg / 1000) * 100) / 100 : 0;
    const resM3 = 0;
    const computedTotalM3 = baseTotalKg > 0 ? Math.round((baseTotalKg / 1000) * 100) / 100 : null;

    // Persentase 100% dialokasikan murni Organik dan Anorganik
    let orgPct = baseTotalKg > 0 ? Math.round((baseOrgKg / baseTotalKg) * 100) : 0;
    let anoPct = baseTotalKg > 0 ? (100 - orgPct) : 0;
    let resPct = 0;

    const basePetugasOrgKg = Math.round(Object.values(realMetricsByKel).reduce((s, m) => s + m.petugasOrganikKg, 0) * 10) / 10;
    const basePetugasAnoKg = Math.round(Object.values(realMetricsByKel).reduce((s, m) => s + m.petugasAnorganikKg, 0) * 10) / 10;
    const basePetugasTotalKg = Math.round((basePetugasOrgKg + basePetugasAnoKg) * 10) / 10;

    let volumeTotal = computedTotalM3;
    const hasData = baseTotalKg > 0;

    const komposisiVolume = {
      organik: {
        persen: orgPct,
        volumeM3: orgM3,
        kgHari: baseOrgKg,
      },
      anorganik: {
        persen: anoPct,
        volumeM3: anoM3,
        kgHari: baseAnoKg,
      },
      residu: {
        persen: 0,
        volumeM3: 0,
        kgHari: 0,
      },
      totalM3: volumeTotal,
      totalKg: baseTotalKg,
      totalKgHari: baseTotalKg,
      hasData,
      // Metadata terpisah untuk data pencatatan petugas pemilah (terisolasi, tidak dobel)
      petugasPemilah: {
        totalKg: basePetugasTotalKg,
        organikKg: basePetugasOrgKg,
        anorganikKg: basePetugasAnoKg,
      },
    };

    // ── 7. Tren Bulanan — integrasi riil transaksi bulanan + log produksi fasilitas (Agustus – Desember 2026) ──
    const prodLogs = await prisma.facilityProductionLog.findMany({
      where: {
        createdAt: { gte: programStart, lte: programEnd },
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
      const month = new Date(log.createdAt).getUTCMonth(); // 7=Agu, 8=Sep, 9=Okt, 10=Nov, 11=Des
      prodMap[month] = (prodMap[month] ?? 0) + Number(log.outputKg ?? 0);
    });

    const trenBulanan = PROGRAM_MONTHS.map(({ label, monthIdx }) => {
      const autoInMonth = setoranAllWindow.filter((s) => {
        if (new Date(s.createdAt).getUTCMonth() !== monthIdx) return false;
        if (!rawKel) return true;
        const kelName =
          s.warga?.rw?.kelurahan?.name ||
          s.bin?.rw?.kelurahan?.name ||
          s.bin?.kelurahan?.name;
        return kelName?.toLowerCase() === rawKel.toLowerCase();
      });

      const manualInMonth = setoranManualAllWindow.filter((sm) => {
        if (new Date(sm.createdAt).getUTCMonth() !== monthIdx) return false;
        if (!rawKel) return true;
        const kelName = sm.rw?.kelurahan?.name;
        return kelName?.toLowerCase() === rawKel.toLowerCase();
      });

      const autoKg = autoInMonth.reduce((acc, s) => acc + Number(s.berat || 0), 0);
      const manualKg = manualInMonth.reduce((acc, sm) => acc + Number(sm.berat || 0), 0);
      const prodKg = prodMap[monthIdx] ?? 0;
      const totalKgMonth = autoKg + manualKg + prodKg;

      // Konversi berat nyata ke volume m³ (1.000 kg = 1 m³ standar DLH Kota Bandung / SNI)
      const volumeM3 = totalKgMonth > 0 ? Math.round((totalKgMonth / 1000) * 100) / 100 : 0;
      const volumeKg = totalKgMonth > 0 ? Math.round(totalKgMonth * 10) / 10 : 0;
      return { bulan: label, volume: volumeM3, volumeKg };
    });

    // Indeks dalam deret 5 bulan linimasa KKN (0=Agu, 1=Sep, 2=Okt, 3=Nov, 4=Des)
    const programMonthIdx = PROGRAM_MONTHS.findIndex((pm) => pm.monthIdx === activeMonthIdx);
    const prevProgramMonthIdx = programMonthIdx > 0 ? programMonthIdx - 1 : null;

    const currentVol = trenBulanan[programMonthIdx]?.volume ?? volumeTotal ?? 0;
    const currentVolKg = trenBulanan[programMonthIdx]?.volumeKg ?? baseTotalKg ?? 0;
    const prevVol = prevProgramMonthIdx !== null ? trenBulanan[prevProgramMonthIdx]?.volume : null;
    const previousMonthName = prevProgramMonthIdx !== null ? PROGRAM_MONTHS[prevProgramMonthIdx].label : null;

    let growthPct: number | null = null;
    if (currentVol > 0 && prevVol != null && prevVol > 0) {
      growthPct = Math.round(((currentVol - prevVol) / prevVol) * 1000) / 10;
    }

    const hasTrendData = trenBulanan.some((t) => t.volume > 0);

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
        volumeKg: kd?.volumeKg ?? null,
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
        volumeTotalKg: currentVolKg,
        volumeGrowthPercent: growthPct,
        previousMonthName,
        activeMonthIndex: activeMonthIdx,
        volumeUnit: "kg",
        volumeUnitM3: "m³/bulan",
        kepatuhanPemilahan: avgKepatuhan,
        kepatuhanTarget: 60,
        kepatuhanSubtext: "Sampel selama giat KKN",
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
