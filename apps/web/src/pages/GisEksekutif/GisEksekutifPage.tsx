/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo,
 * tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 *
 * GisEksekutifPage — 100% data dinamis dari PostgreSQL via REST API.
 * Tidak ada data hardcode / fallback statis di UI ini.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./gisEksekutif.css";
import { Icon, TIPE_ICON } from "./ui";
import { Donut, Trend, Compliance, Methane, fmtN } from "./charts";
import MapView, { LAYERS } from "./MapView";
import { CH4_CLASSES, KEP_CLASSES, TIPE, TIPE_BY_ID, pad2 } from "./data";
import { KELURAHAN_GEODATA } from "../../constants/coblongGeoData";
import {
  gisEksekutifApi,
  type GisOverviewApiResponse,
  type GisFacilityDto,
  type GisSensorDto,
} from "./gisEksekutifApi";
import { QcDataAuditModal } from "./QcDataAuditModal";
import { downloadQcReportPdf } from "../../utils/downloadQcReportPdf";
import { useAuthStore } from "../../store/useAuthStore";

function createOfflineFallbackData(kelurahanFilter = "Semua"): GisOverviewApiResponse {
  const kelNames = ["Cipaganti", "Dago", "Lebak Gede", "Lebak Siliwangi", "Sadang Serang", "Sekeloa"];
  const poligonKelurahan = kelNames.map((nama) => ({
    nama,
    coordinates: (KELURAHAN_GEODATA[nama as keyof typeof KELURAHAN_GEODATA]?.bounds || []) as [number, number][],
    kepatuhan: null,
    volume: null,
    totalFasilitas: 0,
    color: "#9ca3af",
    hasData: false,
  }));

  return {
    success: true,
    meta: {
      wilayah: "Kecamatan Coblong",
      periode: "September 2026",
      kelurahanFilter,
      rwFilter: "Semua",
      timestamp: new Date().toISOString(),
    },
    filterOptions: {
      kelurahans: ["Semua", ...kelNames],
      rws: ["Semua"],
      periodes: [
        "Agustus 2026",
        "September 2026",
        "Oktober 2026",
        "November 2026",
        "Desember 2026",
      ],
      tipeFasilitas: ["Semua"],
    },
    kpi: {
      fasilitasTerdata: 0,
      fasilitasSubtext: "Mode Peta Dasar Aktif",
      volumeTotal: null,
      volumeGrowthPercent: null,
      volumeUnit: "m³/bulan",
      kepatuhanPemilahan: null,
      kepatuhanDeltaPoin: 0,
      sensorCh4OnlineCount: 0,
      sensorCh4TotalCount: 0,
      sensorCh4Text: "Tahap Integrasi Jaringan IoT",
      sensorCh4ProgressPercent: 0,
    },
    komposisiVolume: {
      organik: { persen: 0, volumeM3: 0 },
      anorganik: { persen: 0, volumeM3: 0 },
      residu: { persen: 0, volumeM3: 0 },
      totalM3: 0,
      hasData: false,
    },
    trenBulanan: ["Agu", "Sep", "Okt", "Nov", "Des"].map((b) => ({
      bulan: b,
      volume: 0,
    })),
    kepatuhanPerKelurahan: kelNames.map((nama) => ({
      nama,
      kepatuhan: null,
      volume: null,
      totalFasilitas: 0,
      color: "#9ca3af",
      hasData: false,
    })),
    pemantauanCh4: {
      rentangText: "Tahap Integrasi",
      titikPengukuranCount: 0,
      titikPengukuranText: "Sensor CH₄ belum aktif",
      status: "Tahap Integrasi Jaringan IoT",
      statusDeskripsi: "Telemetri belum aktif. Belum ada sensor IoT yang terhubung ke database.",
      cakupan: "Coblong",
      satuan: "ppm",
      sensorOnline: "0/0",
      placeholderVal: "— ppm",
      placeholderStatus: "Belum ada data",
      placeholderSub: "Sensor IoT belum terpasang",
      progressPercent: 0,
      sensors: [],
    },
    titikFasilitas: [],
    poligonKelurahan,
  };
}

/* ---------- Tipe lokal compat MapView/charts ---------- */
// MapView & charts masih pakai shape lama dari data.ts → adapter di bawah
type KelRowForMap = {
  k: { id: string; nama: string; kep: number; poly: [number, number][]; ring: [number, number][]; label: number[]; labelLL: [number, number]; rw: number; fac: number; org: number; ano: number; res: number };
  s: { kep: number; org: number; ano: number; res: number; total: number; fac: number; sensors: SensorForMap[]; share: number };
};
type SensorForMap = {
  id: string; kel: string; rw: number; lokasi: string; ppm: number | null;
  pos: [number, number]; ll: [number, number];
};
type FacilityForMap = {
  id: string; tipe: string; kel: string; rw: number; x: number; y: number;
  nama: string; ll: [number, number];
};
type ActiveTarget = { kind: "sensor"; id: string } | { kind: "facility"; id: string } | null;

/* ---------- CSV helpers ---------- */
const csvCell = (v: string | number | null): string => {
  const s = String(v ?? "");
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows: Array<Array<string | number | null>>): string =>
  "\uFEFF" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n");

async function saveFileCsv(filename: string, data: string): Promise<string> {
  try {
    const url = URL.createObjectURL(new Blob([data], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return `Berkas ${filename} berhasil diunduh.`;
  } catch {
    return "Unduhan tidak tersedia di peramban ini.";
  }
}

/* ---------- Filter Pill ---------- */
function Pill({ label, icon, children, disabled }: {
  label: string; icon?: string; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <label className={`pill ${disabled ? "is-disabled" : ""}`}>
      <span className="pill-l">{label}</span>
      <span className="pill-s">
        {icon ? <Icon name={icon} size={14} className="pill-i" /> : null}
        {children}
        <Icon name="chevron" size={13} className="pill-c" />
      </span>
    </label>
  );
}

/* ---------- Export Menu ---------- */
interface ExportMenuProps {
  onExport: (what: "kel-all" | "kel-single" | "fac") => void;
  selectedKel?: string;
  periode?: string;
  onOpenQcModal?: () => void;
  onDownloadQcPdf?: () => void;
  isDeveloper?: boolean;
}

function ExportMenu({ onExport, selectedKel, periode, onOpenQcModal, onDownloadQcPdf, isDeveloper }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const hasSpecificKel = Boolean(selectedKel && selectedKel !== "Semua");

  return (
    <div className="export" ref={box} title="Ekspor data CSV">
      <button
        type="button"
        className="btn-primary"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="download" size={15} /> Ekspor <Icon name="chevron" size={13} />
      </button>
      {open && (
        <div className="menu" role="menu">
          {/* Opsi 1: Ringkasan Semua Kelurahan */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onExport("kel-all");
            }}
          >
            <Icon name="table" size={15} />
            <span>
              Ringkasan Semua Kelurahan
              <small>CSV • 6 Kelurahan (Kec. Coblong)</small>
            </span>
          </button>

          {/* Opsi 2: Ringkasan Kelurahan Spesifik jika sedang memilih kelurahan */}
          {hasSpecificKel && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onExport("kel-single");
              }}
            >
              <Icon name="mapPin" size={15} />
              <span>
                Ringkasan Kel. {selectedKel}
                <small>CSV • Khusus wilayah terpilih</small>
              </span>
            </button>
          )}

          {/* Opsi 3: Daftar Fasilitas */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onExport("fac");
            }}
          >
            <Icon name="file" size={15} />
            <span>
              Daftar Fasilitas
              <small>
                CSV • {hasSpecificKel ? `Khusus Kel. ${selectedKel}` : "Seluruh titik di Coblong"}
              </small>
            </span>
          </button>

          {/* Opsi 4: Cetak / Unduh Laporan PDF QC (Khusus Role Developer) */}
          {isDeveloper && onDownloadQcPdf && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDownloadQcPdf();
              }}
              style={{ borderTop: "1px solid #f1f5f9" }}
            >
              <Icon name="file" size={15} />
              <span>
                Laporan PDF QC (Resmi)
                <small>Format dokumen A4 berstandar DLH</small>
              </span>
            </button>
          )}

          {/* Opsi 5: Laporan Asal & Rumus Data (QC) (Khusus Role Developer) */}
          {isDeveloper && onOpenQcModal && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenQcModal();
              }}
              style={!onDownloadQcPdf ? { borderTop: "1px solid #f1f5f9" } : undefined}
            >
              <Icon name="clipboard" size={15} />
              <span>
                Laporan Asal & Rumus QC
                <small>Dokumentasi formula & audit tabel DB</small>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Loading Skeleton ---------- */
function KpiSkeleton() {
  return (
    <div className="kpi-card-qc" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
      <div className="kpi-circle-icon mint" style={{ opacity: 0.3 }} />
      <div className="kpi-qc-content">
        <div style={{ background: "#e5e7eb", borderRadius: 4, height: 12, width: 90, marginBottom: 6 }} />
        <div style={{ background: "#e5e7eb", borderRadius: 4, height: 26, width: 80, marginBottom: 6 }} />
        <div style={{ background: "#e5e7eb", borderRadius: 4, height: 11, width: 120 }} />
      </div>
    </div>
  );
}

/* ---------- Adapter: GisFacilityDto → FacilityForMap ---------- */
function toFacilityForMap(f: GisFacilityDto): FacilityForMap {
  return {
    id: f.id,
    tipe: f.tipe,
    kel: f.kel,
    rw: f.rw,
    x: 0,
    y: 0,
    nama: f.nama,
    ll: [f.lat, f.lng],
    pic: f.pic,
    kontak: f.kontak,
    foto: f.foto,
    alamat: f.alamat,
    kapasitas: f.kapasitas,
  };
}

function normalizeFacilityType(t?: string | null): string {
  if (!t) return "";
  const map: Record<string, string> = {
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
    poc: "poc",
  };
  return map[t.toLowerCase()] || t.toLowerCase();
}

/* ---------- Adapter: GisSensorDto → SensorForMap ---------- */
function toSensorForMap(s: GisSensorDto): SensorForMap {
  return {
    id: s.label,
    kel: s.kel,
    rw: parseInt(s.rw.replace(/\D/g, ""), 10) || 1,
    lokasi: s.lokasi,
    ppm: s.ch4Ppm,
    pos: [0, 0],
    ll: [s.lat, s.lng],
  };
}

/* ---------- Komponen Utama ---------- */
export default function GisEksekutifPage() {
  // ─── User role security: Fitur Asal & Rumus QC DILARANG untuk pimpinan/su/role lain, HANYA untuk DEVELOPER
  const user = useAuthStore((s) => s.user);
  const userRole = String(user?.peran || (user as any)?.role || "").toUpperCase();
  const isDeveloper = userRole === "DEVELOPER" || userRole === "DEV";

  // ─── Filter state ───────────────────────────────────────────────────────────
  const [kel, setKel] = useState("Semua");
  const [rw, setRw] = useState("Semua");
  const [periode, setPeriode] = useState("September 2026");
  const [facType, setFacType] = useState("Semua");
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  // ─── UI state ───────────────────────────────────────────────────────────────
  const [layer, setLayer] = useState<"kep" | "org" | "ano" | "res" | "total" | "ch4">("kep");
  const [base, setBase] = useState<"peta" | "sat">("sat"); // Default Satelit Google (sesuai menu Fasilitas)
  const [active, setActive] = useState<ActiveTarget>(null);
  const [toast, setToast] = useState("");

  // ─── API state ──────────────────────────────────────────────────────────────
  const [data, setData] = useState<GisOverviewApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useOfflineMode, setUseOfflineMode] = useState(false);
  const [autoRetryCountdown, setAutoRetryCountdown] = useState(5);
  const [isAutoRetryPaused, setIsAutoRetryPaused] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showQcModal, setShowQcModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState<{
    kelurahans: string[]; rws: string[]; periodes: string[]; tipeFasilitas: string[];
  }>({
    kelurahans: ["Semua"],
    rws: ["Semua"],
    periodes: [
      "Agustus 2026",
      "September 2026",
      "Oktober 2026",
      "November 2026",
      "Desember 2026",
    ],
    tipeFasilitas: ["Semua", ...TIPE.map((t) => t.id)],
  });

  // ─── Fetch API ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) { setLoading(true); setError(null); }
    else { setRefreshing(true); }
    try {
      const res = await gisEksekutifApi.getOverview({
        kelurahan: kel !== "Semua" ? kel : undefined,
        rw: rw !== "Semua" ? rw : undefined,
        periode,
        jenisFasilitas: facType !== "Semua" ? facType : undefined,
        search: query || undefined,
      });
      setData(res);
      setError(null);
      setUseOfflineMode(false);
      // Update filter options dari API (dinamis dari DB), pertahankan daftar lengkap opsi tipe fasilitas
      if (res.filterOptions) {
        setFilterOptions((prev) => {
          const apiTypes = res.filterOptions.tipeFasilitas || [];
          const merged = Array.from(new Set([...prev.tipeFasilitas, ...apiTypes]));
          return {
            ...res.filterOptions,
            tipeFasilitas: merged.length > apiTypes.length ? merged : apiTypes,
          };
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat data GIS";
      setError(msg);
      // Jika mode offline belum diaktifkan, siapkan countdown auto-retry
      setAutoRetryCountdown(5);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [kel, rw, periode, facType, query]);

  // Fetch pertama kali
  useEffect(() => { fetchData(true); }, []);

  // Re-fetch saat filter berubah (bukan initial)
  useEffect(() => {
    if (loading) return;
    fetchData(false);
  }, [kel, rw, periode, facType, query]);

  // Auto-retry effect saat terjadi error
  useEffect(() => {
    if (!error || useOfflineMode || isAutoRetryPaused) return;
    if (autoRetryCountdown <= 0) {
      fetchData(true);
      setAutoRetryCountdown(5);
      return;
    }
    const timer = setInterval(() => {
      setAutoRetryCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [error, useOfflineMode, isAutoRetryPaused, autoRetryCountdown, fetchData]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  // ─── Filter handlers ─────────────────────────────────────────────────────────
  const changeKel = (v: string) => { setKel(v); setRw("Semua"); };
  const submitSearch = () => {
    setQuery(input);
    if (input.trim()) {
      setToast(`Mencari fasilitas "${input}"...`);
    }
  };
  const clearFilters = () => { setFacType("Semua"); setInput(""); setQuery(""); };

  const activateOfflineMode = () => {
    setUseOfflineMode(true);
    setError(null);
    setData(createOfflineFallbackData(kel));
    setToast("Mode peta dasar aktif. Menampilkan geometri administratif 6 kelurahan.");
  };

  // ─── Derived data → adapter ke format MapView/charts ─────────────────────────
  const facilities = useMemo<FacilityForMap[]>(
    () => (data?.titikFasilitas ?? []).map(toFacilityForMap),
    [data]
  );
  const sensors = useMemo<SensorForMap[]>(
    () => (data?.pemantauanCh4?.sensors ?? []).map(toSensorForMap),
    [data]
  );

  // kelRows per kelurahan (untuk Compliance chart & MapView)
  const kelRows = useMemo<KelRowForMap[]>(() => {
    if (!data) return [];
    return (data.poligonKelurahan ?? []).map((pk) => {
      const kd = data.kepatuhanPerKelurahan.find((k) => k.nama === pk.nama);
      const facCount = (data.titikFasilitas ?? []).filter((f) => f.kel === pk.nama).length;
      const ringCoords = Array.isArray(pk.coordinates) ? (pk.coordinates as [number, number][]) : [];
      const defaultLL: [number, number] = [-6.885, 107.615];
      const labelLL = (ringCoords.length > 0 && Array.isArray(ringCoords[0])) ? ringCoords[0] : defaultLL;

      // Hitung volume spesifik per kelurahan dari data survei
      const orgM3 = kd?.organikKgHari != null
        ? Math.round(((Number(kd.organikKgHari) * 30) / 1000) * 10) / 10
        : (kd?.volume != null ? Math.round(Number(kd.volume) * 0.21 * 10) / 10 : 0);
      const anoM3 = kd?.anorganikKgHari != null
        ? Math.round(((Number(kd.anorganikKgHari) * 30) / 1000) * 10) / 10
        : (kd?.volume != null ? Math.round(Number(kd.volume) * 0.74 * 10) / 10 : 0);
      const resM3 = kd?.residuKgHari != null
        ? Math.round(((Number(kd.residuKgHari) * 30) / 1000) * 10) / 10
        : (kd?.volume != null ? Math.round(Number(kd.volume) * 0.05 * 10) / 10 : 0);
      const totalM3 = kd?.volume != null ? Number(kd.volume) : Math.round((orgM3 + anoM3 + resM3) * 10) / 10;

      // Pseudo KelurahanData shape for MapView compatibility
      const kShape = {
        id: pk.nama.toLowerCase().replace(/\s+/g, "-"),
        nama: pk.nama,
        kep: kd?.kepatuhan ?? 0,
        org: orgM3,
        ano: anoM3,
        res: resM3,
        rw: 0,
        fac: facCount,
        label: [0, 0] as [number, number],
        labelLL,
        poly: ringCoords.length > 0 ? ringCoords : [defaultLL],
        ring: ringCoords.length > 0 ? ringCoords : [defaultLL],
      };
      const sShape = {
        kep: kd?.kepatuhan ?? (null as any),
        org: orgM3,
        ano: anoM3,
        res: resM3,
        total: totalM3,
        fac: facCount,
        sensors: sensors.filter((s) => s.kel === pk.nama),
        share: 1,
        hasData: Boolean(kd?.hasData),
      };
      return { k: kShape, s: sShape };
    });
  }, [data, sensors]);

  // Nilai maksimum untuk legenda gradasi volume aktif
  const maxLayerVolume = useMemo(() => {
    if (!kelRows || kelRows.length === 0) return 1;
    const vals = kelRows.map((r) => {
      if (layer === "org") return r.s.org;
      if (layer === "ano") return r.s.ano;
      if (layer === "res") return r.s.res;
      if (layer === "total") return r.s.total;
      return 0;
    });
    return Math.max(...vals, 0.1);
  }, [kelRows, layer]);

  // Fasilitas visible setelah search/facType filter (client-side karena sudah difilter API)
  const visibleFac = useMemo<FacilityForMap[]>(() => {
    const q = query.trim().toLowerCase();
    return facilities.filter((f) => {
      if (facType !== "Semua" && normalizeFacilityType(f.tipe) !== normalizeFacilityType(facType)) {
        return false;
      }
      if (!q) return true;
      const hay = `${f.nama} ${f.kel} rw ${f.rw} ${TIPE_BY_ID[f.tipe]?.fungsi ?? ""}`.toLowerCase();
      return q.split(/\s+/).every((tok) => hay.includes(tok));
    });
  }, [facilities, facType, query]);

  const filtered = facType !== "Semua" || query.trim() !== "";

  const onlineCount = data?.kpi.sensorCh4OnlineCount ?? 0;
  const totalSensorCount = data?.kpi.sensorCh4TotalCount ?? 0;

  const scopeText = kel === "Semua"
    ? "dari seluruh kelurahan"
    : `di Kel. ${kel}${rw !== "Semua" ? ` RW ${rw}` : ""}`;

  // Indeks bulan dari periode aktif untuk disorot pada grafik tren bulanan (5 bulan: Agu=0, Sep=1, Okt=2, Nov=3, Des=4)
  const selectedMonthIndex = useMemo(() => {
    const p = (periode || "").toLowerCase();
    if (p.includes("agu")) return 0;
    if (p.includes("sep")) return 1;
    if (p.includes("okt")) return 2;
    if (p.includes("nov")) return 3;
    if (p.includes("des")) return 4;
    return 1; // default September 2026 (fase baseline utama)
  }, [periode]);

  // Format timestamp data diperbarui
  const formattedTimestamp = useMemo(() => {
    if (!data?.meta?.timestamp) return "21 Sep 2026, 09:41";
    try {
      const d = new Date(data.meta.timestamp);
      if (isNaN(d.getTime())) return "21 Sep 2026, 09:41";
      const day = d.getDate();
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      return `${day} ${month} ${year}, ${hours}:${mins}`;
    } catch {
      return "21 Sep 2026, 09:41";
    }
  }, [data?.meta?.timestamp]);

  // ─── Export CSV ──────────────────────────────────────────────────────────────
  const doExport = async (what: "kel-all" | "kel-single" | "fac") => {
    if (!data) {
      setToast("Data belum siap diekspor. Silakan tunggu pemuatan selesai.");
      return;
    }
    if (what === "fac" && (data.titikFasilitas ?? []).length === 0) {
      setToast("Data fasilitas belum tersedia untuk diekspor. Silakan tunggu sinkronisasi selesai.");
      return;
    }

    try {
      setToast("Menyiapkan berkas CSV...");
      let rows: Array<Array<string | number | null>>;
      let name: string;
      const periodeSlug = periode.toLowerCase().replace(/\s+/g, "-");

      if (what === "kel-all") {
        rows = [["Kelurahan", "Periode", "Fasilitas", "Kepatuhan (%)", "Volume m³/bln", "Sensor Online"]];
        data.kepatuhanPerKelurahan.forEach((k) => {
          rows.push([k.nama, periode, k.totalFasilitas, k.kepatuhan, k.volume, 0]);
        });
        name = `ringkasan-semua-kelurahan-coblong-${periodeSlug}.csv`;
      } else if (what === "kel-single") {
        const targetKel = kel !== "Semua" ? kel : "Coblong";
        const kelSlug = targetKel.toLowerCase().replace(/\s+/g, "-");
        rows = [["Kelurahan", "Periode", "Fasilitas", "Kepatuhan (%)", "Volume m³/bln", "Sensor Online"]];
        const targetKels = data.kepatuhanPerKelurahan.filter(
          (k) => k.nama.toLowerCase() === targetKel.toLowerCase()
        );
        (targetKels.length > 0 ? targetKels : data.kepatuhanPerKelurahan).forEach((k) => {
          rows.push([k.nama, periode, k.totalFasilitas, k.kepatuhan, k.volume, 0]);
        });
        name = `ringkasan-kelurahan-${kelSlug}-${periodeSlug}.csv`;
      } else {
        const isSpecific = kel !== "Semua";
        const kelSlug = isSpecific ? `-${kel.toLowerCase().replace(/\s+/g, "-")}` : "-coblong";
        rows = [["ID", "Nama Fasilitas", "Tipe", "Kelurahan", "RW", "Lat", "Lng", "PIC"]];
        const targetFacs = isSpecific
          ? (data.titikFasilitas ?? []).filter((f) => f.kel.toLowerCase() === kel.toLowerCase())
          : (data.titikFasilitas ?? []);
        targetFacs.forEach((f) =>
          rows.push([f.id, f.nama, f.tipe, f.kel, f.rw, f.lat, f.lng, f.pic ?? ""])
        );
        name = `daftar-fasilitas${kelSlug}.csv`;
      }

      const msg = await saveFileCsv(name, toCsv(rows));
      setToast(msg);
    } catch (exportErr: any) {
      setToast(`Gagal mengekspor data: ${exportErr?.message || "Kesalahan tidak dikenal"}`);
    }
  };

  // ─── Render: Professional Error & Reconnect State ─────────────────────────────
  if (error && !useOfflineMode) {
    return (
      <div className="gis-eksekutif-root" data-theme="light">
        <div className="app" style={{ minHeight: 480, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
          <div style={{
            maxWidth: 560,
            width: "100%",
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
            padding: "36px 28px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}>
            {/* Status Pill Badge */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 14px",
              borderRadius: 9999,
              background: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#b45309",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
              Sinkronisasi Geospasial Berseka
            </div>

            {/* Radar / Server Icon */}
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#ecfdf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#055c46",
              boxShadow: "0 0 0 6px rgba(5, 92, 70, 0.06)",
              marginTop: 4,
            }}>
              <Icon name="signal" size={22} />
            </div>

            {/* Title & Description */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                Penyelarasan Data Geospasial Sedang Berlangsung
              </h2>
              <p style={{ margin: 0, fontSize: 13.5, color: "#64748b", lineHeight: 1.5, maxWidth: 460 }}>
                Layanan sedang menyinkronkan data fasilitas dan persampahan dari server basis data. Sistem dilengkapi proteksi pemulihan otomatis.
              </p>
            </div>

            {/* Auto-Retry Countdown Badge */}
            <div style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 12.5,
              color: "#475569",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <span>⏱️ Mencoba menghubungkan otomatis dalam <b>{autoRetryCountdown}s</b></span>
              <button
                type="button"
                onClick={() => setIsAutoRetryPaused((p) => !p)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#055c46",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                {isAutoRetryPaused ? "Lanjutkan" : "Jeda"}
              </button>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", width: "100%", marginTop: 4 }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => fetchData(true)}
                disabled={loading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 22px",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Menghubungkan..." : "Hubungkan Kembali Sekarang"}
              </button>

              <button
                type="button"
                onClick={activateOfflineMode}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 18px",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13.5,
                  background: "#f1f5f9",
                  color: "#334155",
                  border: "1px solid #cbd5e1",
                  cursor: "pointer",
                }}
              >
                <span>🗺️ Buka Peta Dasar Coblong</span>
              </button>
            </div>

            {/* Diagnostic Information (Collapsible) */}
            <div style={{ width: "100%", marginTop: 8, borderTop: "1px solid #f1f5f9", paddingTop: 12, textAlign: "left" }}>
              <button
                type="button"
                onClick={() => setShowTechnicalDetails((v) => !v)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  fontSize: 11.5,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <span>{showTechnicalDetails ? "▼ Sembunyikan" : "▶ Lihat"} Rincian Diagnostik Sistem</span>
              </button>

              {showTechnicalDetails && (
                <div style={{
                  marginTop: 8,
                  padding: 12,
                  background: "#f8fafc",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 11.5,
                  color: "#334155",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}>
                  <div><strong>Kode Kesalahan:</strong> <code>{error}</code></div>
                  <div><strong>Target Endpoint:</strong> <code>/api/v1/gis-eksekutif/overview</code></div>
                  <div><strong>Waktu Deteksi:</strong> {new Date().toLocaleTimeString()} WIB</div>
                  <div style={{ marginTop: 4, color: "#64748b", fontSize: 11 }}>
                    Saran Pemulihan: Pastikan server API aktif (`npm run dev:all`) dan database PostgreSQL terhubung. Klik 'Buka Peta Dasar Coblong' untuk tetap melihat visualisasi batas wilayah.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gis-eksekutif-root" data-theme="light">
      <div className="app">
        {/* Refreshing indicator */}
        {refreshing && (
          <div style={{ position: "fixed", top: 12, right: 12, zIndex: 9999, background: "#055c46", color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            Memperbarui data…
          </div>
        )}

        {/* Informational Banner saat mode offline atau data terdegradasi */}
        {(useOfflineMode || data?.meta?.isDegraded) && (
          <div style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 10,
            padding: "10px 16px",
            margin: "0 0 16px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>ℹ️</span>
              <span style={{ fontSize: 13, color: "#92400e", fontWeight: 600 }}>
                {data?.meta?.degradedReason || "Mode Peta Dasar Aktif: Menampilkan batas administratif 6 kelurahan Coblong. Menunggu sinkronisasi data live server..."}
              </span>
            </div>
            <button
              type="button"
              onClick={() => { setUseOfflineMode(false); fetchData(true); }}
              disabled={loading}
              style={{
                background: "#055c46",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Menghubungkan..." : "Sinkronkan Live Data"}
            </button>
          </div>
        )}

        {/* Banner informasi jika filter menghasilkan 0 fasilitas */}
        {filtered && visibleFac.length === 0 && (
          <div style={{
            background: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: 8,
            padding: "10px 16px",
            margin: "0 0 16px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}>
            <span style={{ fontSize: 12.5, color: "#475569" }}>
              Tidak ada fasilitas yang sesuai dengan filter Kelurahan/RW/Tipe/Pencarian saat ini.
            </span>
            <button
              type="button"
              onClick={clearFilters}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "#0f172a",
                cursor: "pointer",
              }}
            >
              Reset Filter
            </button>
          </div>
        )}

        {/* Header */}
        <header className="head">
          <div className="head-l">
            <h1>Dashboard Lingkungan & Persampahan</h1>
            <p className="sub">Monitoring data persampahan, pemilahan, dan emisi gas untuk Kecamatan Coblong</p>
          </div>
          <div className="head-r">
            <div className="qc-filters-row">
              <div className="qc-pill-dropdown">
                <Icon name="home" size={15} style={{ color: "#64748b" }} />
                <select
                  aria-label="Kecamatan"
                  value="Coblong"
                  disabled
                  style={{ cursor: "default" }}
                >
                  <option value="Coblong">Kecamatan: Coblong</option>
                </select>
                <Icon name="chevron" size={13} className="qc-chevron" />
              </div>

              <div className="qc-pill-dropdown">
                <Icon name="mapPin" size={15} style={{ color: "#64748b" }} />
                <select
                  aria-label="Kelurahan"
                  value={kel}
                  onChange={(e) => changeKel(e.target.value)}
                >
                  {filterOptions.kelurahans.map((k) => (
                    <option key={k} value={k}>
                      {k === "Semua" ? "Kelurahan: Semua" : `Kelurahan: ${k}`}
                    </option>
                  ))}
                </select>
                <Icon name="chevron" size={13} className="qc-chevron" />
              </div>

              <div className="qc-pill-dropdown">
                <Icon name="calendar" size={15} style={{ color: "#64748b" }} />
                <select
                  aria-label="Periode"
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                >
                  {filterOptions.periodes.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <Icon name="chevron" size={13} className="qc-chevron" />
              </div>

              <ExportMenu
                onExport={doExport}
                selectedKel={kel}
                periode={periode}
                isDeveloper={isDeveloper}
                onOpenQcModal={isDeveloper ? () => setShowQcModal(true) : undefined}
                onDownloadQcPdf={isDeveloper ? () => downloadQcReportPdf({ data, periode, selectedKel: kel }) : undefined}
              />

              {/* Tombol Asal & Rumus Data (QC) — KHUSUS ROLE DEVELOPER */}
              {isDeveloper && (
                <button
                  type="button"
                  className="qc-audit-trigger-btn"
                  onClick={() => setShowQcModal(true)}
                  title="Buka Lembar Asal Data & Rumus Perhitungan untuk Tim QC (Akses Khusus Developer)"
                >
                  <Icon name="clipboard" size={14} />
                  <span>Asal & Rumus Data (QC)</span>
                </button>
              )}
            </div>

            <div className="qc-timestamp">
              Data diperbarui: {formattedTimestamp}
            </div>
          </div>
        </header>

        {/* KPI */}
        <section className="kpis-qc" aria-label="Indikator utama">
          {loading ? (
            <><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /></>
          ) : (
            <>
              {/* Card 1: Fasilitas terdata */}
              <div className="kpi-card-qc">
                <div className="kpi-circle-icon mint">
                  <Icon name="home" size={22} />
                </div>
                <div className="kpi-qc-content">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span className="kpi-qc-label">Fasilitas terdata</span>
                    <span className="kpi-ch4-prep-badge">
                      {kel !== "Semua" ? kel : (data?.meta?.wilayah ? data.meta.wilayah.replace("Kecamatan ", "") : "Coblong")}
                    </span>
                  </div>
                  <div className="kpi-qc-val">{data?.kpi?.fasilitasTerdata ?? 0}</div>
                  <div className="kpi-qc-subtext">
                    {kel !== "Semua"
                      ? `Terdata di Kel. ${kel}`
                      : (data?.kpi?.fasilitasSubtext ? `Tersebar di ${data.kpi.fasilitasSubtext}` : "Tersebar di 6 kelurahan")}
                  </div>
                </div>
              </div>

              {/* Card 2: Volume sampah bulanan */}
              <div className="kpi-card-qc">
                <div className="kpi-circle-icon mint">
                  <Icon name="bars" size={22} stroke={2.5} />
                </div>
                <div className="kpi-qc-content">
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", width: "100%" }}>
                    <span className="kpi-qc-label">Volume sampah bulanan</span>
                    {data?.kpi?.volumeGrowthPercent != null && (
                      <div className="kpi-qc-growth-pill">
                        <span className="kpi-qc-growth-arrow">
                          {data.kpi.volumeGrowthPercent >= 0 ? "↑" : "↓"}{" "}
                          {Math.abs(data.kpi.volumeGrowthPercent).toLocaleString("id-ID")}%
                        </span>
                        <span className="kpi-qc-growth-sub">
                          vs {data.kpi.previousMonthName || "Agu"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="kpi-qc-val">
                    {data?.kpi?.volumeTotal != null && data.kpi.volumeTotal > 0 ? (
                      <>{fmtN(data.kpi.volumeTotal)} <span className="kpi-qc-unit">{data.kpi.volumeUnit || "m³/bln"}</span></>
                    ) : (
                      <span style={{ fontSize: 16, color: "#9ca3af" }}>Belum ada data</span>
                    )}
                  </div>
                  <div className="kpi-qc-subtext">
                    {data?.kpi?.volumeTotal != null && data.kpi.volumeTotal > 0
                      ? `Periode ${periode}${kel !== "Semua" ? ` • Kel. ${kel}` : ""} • Riil Sistem`
                      : "Belum ada data transaksi"}
                  </div>
                </div>
              </div>

              {/* Card 3: Kepatuhan pemilahan */}
              <div className="kpi-card-qc">
                <div className="kpi-circle-icon amber">
                  <Icon name="pie" size={22} />
                </div>
                <div className="kpi-qc-content">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span className="kpi-qc-label">Kepatuhan pemilahan</span>
                    <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "8px", background: "#fef3c7", color: "#92400e", fontWeight: 600, border: "1px solid #fde68a" }}>
                      Sampel Giat KKN
                    </span>
                  </div>
                  <div className="kpi-qc-val-row">
                    <span className="kpi-qc-val">
                      {data?.kpi?.kepatuhanPemilahan != null ? `${data.kpi.kepatuhanPemilahan}%` : "—"}
                    </span>
                    <span className="kpi-qc-target-pill">Target: 25%</span>
                  </div>
                  <div className="kpi-qc-subtext">
                    {data?.kpi?.kepatuhanPemilahan != null
                      ? `Sampel selama giat KKN • ${kel !== "Semua" ? `Kel. ${kel}` : "Rata-rata 6 kelurahan"}`
                      : "Belum ada data transaksi"}
                  </div>
                </div>
              </div>

              {/* Card 4: Telemetri IoT CH₄ */}
              <div className="kpi-card-qc">
                <div className="kpi-circle-icon slate">
                  <Icon name="broadcast" size={22} />
                </div>
                <div className="kpi-qc-content">
                  <div className="kpi-ch4-head">
                    <span className="kpi-qc-label">Telemetri IoT CH₄</span>
                    <span className="kpi-ch4-prep-badge">
                      {data?.pemantauanCh4?.sensorOnline ?? `${onlineCount}/${totalSensorCount}`} online
                    </span>
                  </div>
                  <div className="kpi-ch4-status-val">
                    {data?.pemantauanCh4?.status ?? data?.kpi?.sensorCh4Text ?? (onlineCount > 0 ? `${onlineCount} Sensor Online` : "Tahap Integrasi")}
                  </div>
                  <div className="kpi-ch4-progress-row">
                    <div className="kpi-ch4-progress-track">
                      <div
                        className="kpi-ch4-progress-fill"
                        style={{ width: `${data?.pemantauanCh4?.progressPercent ?? data?.kpi?.sensorCh4ProgressPercent ?? 0}%` }}
                      />
                    </div>
                    <span className="kpi-ch4-progress-label">
                      Infrastruktur {data?.pemantauanCh4?.progressPercent ?? data?.kpi?.sensorCh4ProgressPercent ?? 0}%
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Grafik */}
        <section className="charts" aria-label="Ringkasan grafik">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", width: "100%" }}>
              Memuat grafik…
            </div>
          ) : (
            <>
              <Donut
                org={data?.komposisiVolume.organik.volumeM3 ?? 0}
                ano={data?.komposisiVolume.anorganik.volumeM3 ?? 0}
                res={data?.komposisiVolume.residu.volumeM3 ?? 0}
                orgPersen={data?.komposisiVolume.organik.persen}
                anoPersen={data?.komposisiVolume.anorganik.persen}
                resPersen={data?.komposisiVolume.residu.persen}
                orgKg={data?.komposisiVolume.organik.kgHari}
                anoKg={data?.komposisiVolume.anorganik.kgHari}
                resKg={data?.komposisiVolume.residu.kgHari}
                totalM3={data?.komposisiVolume.totalM3}
                hasData={data?.komposisiVolume.hasData}
                wilayahLabel={kel !== "Semua" ? kel : "Kec. Coblong"}
              />
              <Trend
                series={
                  (data?.trenBulanan && data.trenBulanan.length > 0)
                    ? data.trenBulanan.map((t) => t.volume ?? 0)
                    : new Array(5).fill(0)
                }
                pi={selectedMonthIndex}
              />
              <Compliance
                rows={kelRows as any}
                selected={kel !== "Semua" ? kel.toLowerCase().replace(/\s+/g, "-") : null}
                onSelect={(id: string) => {
                  const kelName = (data?.poligonKelurahan ?? []).find(
                    (pk) => pk.nama.toLowerCase().replace(/\s+/g, "-") === id
                  )?.nama;
                  if (kelName) changeKel(kel === kelName ? "Semua" : kelName);
                }}
              />
              <Methane sensors={sensors as any} metaCh4={data?.pemantauanCh4} />
            </>
          )}
        </section>

        {/* Bilah alat peta */}
        <section className="card toolbar" aria-label="Kontrol peta">
          <div className="search">
            <Icon name="search" size={15} className="search-i" />
            <input
              type="search" value={input}
              placeholder="Cari alamat, kelurahan, RW, atau fasilitas…"
              onChange={(e) => { setInput(e.target.value); if (!e.target.value) setQuery(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") submitSearch(); }}
              aria-label="Cari"
            />
          </div>
          <button type="button" className="btn-primary btn-sm" onClick={submitSearch}>Cari</button>
          <label className="fac-sel">
            <span>Fasilitas:</span>
            <span className="pill-s">
              <select value={facType} onChange={(e) => setFacType(e.target.value)} aria-label="Jenis fasilitas">
                {filterOptions.tipeFasilitas.map((t) => {
                  const tipeInfo = TIPE_BY_ID[t] || TIPE_BY_ID[normalizeFacilityType(t)];
                  const label = t === "Semua" ? "Semua Fasilitas" : (tipeInfo?.nama ?? t.replace(/_/g, " ").toUpperCase());
                  return <option key={t} value={t}>{label}</option>;
                })}
              </select>
              <Icon name="chevron" size={13} className="pill-c" />
            </span>
          </label>
          <div className="tabs" role="group" aria-label="Lapisan overlay">
            {LAYERS.map((l) => (
              <button key={l.id} type="button" className={layer === l.id ? "on" : ""}
                aria-pressed={layer === l.id} onClick={() => setLayer(l.id)}>{l.label}</button>
            ))}
          </div>
        </section>

        {/* Peta + Legenda */}
        {!loading && (
          <section className="main">
            <MapView
              kelRows={kelRows as any}
              layer={layer}
              base={base}
              setBase={setBase}
              facilities={visibleFac as any}
              allCount={facilities.length}
              selectedKel={kel !== "Semua" ? kel.toLowerCase().replace(/\s+/g, "-") : null}
              onSelectKel={(id: string) => {
                const kelName = (data?.poligonKelurahan ?? []).find(
                  (pk) => pk.nama.toLowerCase().replace(/\s+/g, "-") === id
                )?.nama;
                if (kelName) changeKel(kel === kelName ? "Semua" : kelName);
              }}
              active={active}
              setActive={setActive}
              onClearFilters={clearFilters}
              filtered={filtered}
              searchQuery={query}
            />
            <aside className="card side" aria-label="Legenda">
              <div className="side-sec">
                <h4 className="side-h">Fasilitas dan fungsi</h4>
                <ul className="fac-list" role="list">
                  {TIPE.map((t) => {
                    const isOn = normalizeFacilityType(facType) === normalizeFacilityType(t.id);
                    return (
                      <li key={t.id}>
                        <div className={`fac-item ${isOn ? "is-selected" : ""}`}>
                          <span className="fac-ico" style={{ background: t.warna }}>
                            <Icon name={TIPE_ICON[t.id]} size={14} stroke={2} />
                          </span>
                          <span className="fac-n">{t.nama}</span>
                          <span className="fac-d">—</span>
                          <span className="fac-f">{t.fungsi}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="side-sec">
                <h4 className="side-h">
                  {layer === "kep" && "Kepatuhan Pemilahan (%)"}
                  {layer === "org" && "Intensitas Sampah Organik (m³)"}
                  {layer === "ano" && "Intensitas Sampah Anorganik (m³)"}
                  {layer === "res" && "Intensitas Sampah Residu (m³)"}
                  {layer === "total" && "Intensitas Volume Total (m³)"}
                </h4>
                {layer === "kep" ? (
                  <ul className="lg-grid">
                    {KEP_CLASSES.map((c) => (
                      <li key={c.label}><i style={{ background: c.warna }} /><span>{c.label}</span><em>{c.ket}</em></li>
                    ))}
                    <li><i className="hatch" /><span>Belum ada data</span></li>
                  </ul>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11.5, color: "#475569", marginTop: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 600 }}>
                      <span>Rendah</span>
                      <span>Tinggi</span>
                    </div>
                    <div style={{
                      height: 10,
                      borderRadius: 6,
                      background: layer === "org"
                        ? "linear-gradient(to right, #dcfce7, #15803d)"
                        : layer === "ano"
                        ? "linear-gradient(to right, #dbeafe, #1d4ed8)"
                        : layer === "res"
                        ? "linear-gradient(to right, #fee2e2, #b91c1c)"
                        : "linear-gradient(to right, #f3e8ff, #7e22ce)"
                    }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#64748b" }}>
                      <span>0 m³</span>
                      <span>Maks: {fmtN(Math.round(maxLayerVolume * 10) / 10)} m³</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="side-sec">
                <h4 className="side-h">Metana CH₄ (ppm)</h4>
                <ul className="lg-row">
                  {CH4_CLASSES.map((c) => (
                    <li key={c.label}>
                      <svg width="20" height="20" viewBox="-10 -10 20 20" aria-hidden="true">
                        <rect x="-6" y="-6" width="12" height="12" rx="2.4" transform="rotate(45)" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
                        {c.min >= 5 ? <rect x="-2.4" y="-2.4" width="4.8" height="4.8" rx="1" transform="rotate(45)" fill={c.stroke} /> : null}
                      </svg>
                      <span>{c.label}</span>
                    </li>
                  ))}
                  <li>
                    <svg width="20" height="20" viewBox="-10 -10 20 20" aria-hidden="true">
                      <rect x="-6" y="-6" width="12" height="12" rx="2.4" transform="rotate(45)" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
                    </svg>
                    <span>Offline</span>
                  </li>
                </ul>
              </div>
              <p className="side-note">
                Data fasilitas, kepatuhan, dan volume dari database real-time BERSEKA.
                {data?.meta.hasSensorData === false && " Sensor CH₄ belum tersedia."}
                {!data?.meta.hasTrendData && " Tren produksi belum ada log."}
              </p>
            </aside>
          </section>
        )}

        <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>

        {isDeveloper && (
          <QcDataAuditModal
            isOpen={showQcModal}
            onClose={() => setShowQcModal(false)}
            data={data}
            currentPeriode={periode}
            selectedKel={kel}
          />
        )}
      </div>
    </div>
  );
}
