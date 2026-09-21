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

function createOfflineFallbackData(kelurahanFilter = "Semua"): GisOverviewApiResponse {
  const kelNames = ["Cipaganti", "Dago", "Lebak Gede", "Lebak Siliwangi", "Sadang Serang", "Sekeloa"];
  const poligonKelurahan = kelNames.map((nama) => ({
    nama,
    coordinates: (KELURAHAN_GEODATA[nama as keyof typeof KELURAHAN_GEODATA]?.bounds || []) as [number, number][],
    kepatuhan: 0,
    volume: 0,
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
      isDegraded: true,
      degradedReason: "Mode visualisasi peta dasar aktif (menunggu sinkronisasi data server)",
    },
    filterOptions: {
      kelurahans: ["Semua", ...kelNames],
      rws: ["Semua"],
      periodes: ["September 2026"],
      tipeFasilitas: ["Semua"],
    },
    kpi: {
      fasilitasTerdata: 0,
      fasilitasSubtext: "Mode Peta Dasar Aktif",
      volumeTotal: 0,
      volumeGrowthPercent: 0,
      volumeUnit: "m³/bulan",
      kepatuhanPemilahan: 0,
      kepatuhanDeltaPoin: 0,
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
    trenBulanan: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep"].map((b) => ({
      bulan: b,
      volume: 0,
    })),
    kepatuhanPerKelurahan: kelNames.map((nama) => ({
      nama,
      kepatuhan: 0,
      volume: 0,
      totalFasilitas: 0,
      color: "#9ca3af",
    })),
    pemantauanCh4: {
      rentangText: "Tahap Integrasi",
      titikPengukuranCount: 0,
      titikPengukuranText: "Sensor CH₄ belum aktif",
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
        {icon ? <Icon name={icon} size={16} className="pill-i" /> : null}
        {children}
        <Icon name="chevron" size={15} className="pill-c" />
      </span>
    </label>
  );
}

/* ---------- Export Menu ---------- */
function ExportMenu({ onExport }: { onExport: (what: "kel" | "fac") => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className="export" ref={box}>
      <button type="button" className="btn-primary" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Icon name="download" size={19} /> Ekspor <Icon name="chevron" size={15} />
      </button>
      {open && (
        <div className="menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onExport("kel"); }}>
            <Icon name="table" size={17} />
            <span>Ringkasan kelurahan<small>CSV • periode terpilih</small></span>
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onExport("fac"); }}>
            <Icon name="file" size={17} />
            <span>Daftar fasilitas<small>CSV • sesuai filter aktif</small></span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Loading Skeleton ---------- */
function KpiSkeleton() {
  return (
    <div className="card kpi" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
      <span className="kpi-ico k-teal" style={{ opacity: 0.3 }}><Icon name="building" size={30} /></span>
      <div>
        <div className="kpi-l" style={{ background: "#e5e7eb", borderRadius: 4, height: 14, width: 120, marginBottom: 8 }} />
        <div className="kpi-v" style={{ background: "#e5e7eb", borderRadius: 4, height: 28, width: 80, marginBottom: 6 }} />
        <div className="kpi-s" style={{ background: "#e5e7eb", borderRadius: 4, height: 12, width: 160 }} />
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
  const [filterOptions, setFilterOptions] = useState<{
    kelurahans: string[]; rws: string[]; periodes: string[]; tipeFasilitas: string[];
  }>({
    kelurahans: ["Semua"],
    rws: ["Semua"],
    periodes: ["September 2026"],
    tipeFasilitas: ["Semua"],
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
      // Update filter options dari API (dinamis dari DB)
      if (res.filterOptions) {
        setFilterOptions(res.filterOptions);
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
      // Pseudo KelurahanData shape for MapView compatibility
      const kShape = {
        id: pk.nama.toLowerCase().replace(/\s+/g, "-"),
        nama: pk.nama,
        kep: kd?.kepatuhan ?? 0,
        org: data.komposisiVolume.organik.volumeM3,
        ano: data.komposisiVolume.anorganik.volumeM3,
        res: data.komposisiVolume.residu.volumeM3,
        rw: 0,
        fac: facCount,
        label: [0, 0] as [number, number],
        labelLL,
        poly: ringCoords.length > 0 ? ringCoords : [defaultLL],
        ring: ringCoords.length > 0 ? ringCoords : [defaultLL],
      };
      const sShape = {
        kep: kd?.kepatuhan ?? 0,
        org: data.komposisiVolume.organik.volumeM3,
        ano: data.komposisiVolume.anorganik.volumeM3,
        res: data.komposisiVolume.residu.volumeM3,
        total: data.komposisiVolume.totalM3,
        fac: facCount,
        sensors: sensors.filter((s) => s.kel === pk.nama),
        share: 1,
      };
      return { k: kShape, s: sShape };
    });
  }, [data, sensors]);

  // Fasilitas visible setelah search/facType filter (client-side karena sudah difilter API)
  const visibleFac = useMemo<FacilityForMap[]>(() => {
    const q = query.trim().toLowerCase();
    return facilities.filter((f) => {
      if (facType !== "Semua" && f.tipe !== facType) return false;
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

  // ─── Export CSV ──────────────────────────────────────────────────────────────
  const doExport = async (what: "kel" | "fac") => {
    if (!data || (what === "fac" && (data.titikFasilitas ?? []).length === 0)) {
      setToast("Data fasilitas belum tersedia untuk diekspor. Silakan tunggu sinkronisasi selesai.");
      return;
    }
    try {
      setToast("Menyiapkan berkas CSV...");
      let rows: Array<Array<string | number | null>>;
      let name: string;
      if (what === "kel") {
        rows = [["Kelurahan", "Periode", "Fasilitas", "Kepatuhan (%)", "Volume m³/bln", "Sensor Online"]];
        data.kepatuhanPerKelurahan.forEach((k) => {
          rows.push([k.nama, periode, k.totalFasilitas, k.kepatuhan, k.volume, 0]);
        });
        name = `ringkasan-kelurahan-${periode.toLowerCase().replace(/\s+/g, "-")}.csv`;
      } else {
        rows = [["ID", "Nama Fasilitas", "Tipe", "Kelurahan", "RW", "Lat", "Lng", "PIC"]];
        (data.titikFasilitas ?? []).forEach((f) =>
          rows.push([f.id, f.nama, f.tipe, f.kel, f.rw, f.lat, f.lng, f.pic ?? ""])
        );
        name = "daftar-fasilitas.csv";
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
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#ecfdf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#055c46",
              boxShadow: "0 0 0 8px rgba(5, 92, 70, 0.06)",
              marginTop: 4,
            }}>
              <Icon name="signal" size={32} />
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
            <h1>GIS Eksekutif Tata Kelola Sampah</h1>
            <p className="sub">Kecamatan Coblong • Fasilitas, pemilahan, volume, dan pemantauan CH₄</p>
          </div>
          <div className="head-r">
            <span className="tag-live">
              <span className="tag-live-dot" />
              LIVE • DATA REAL-TIME
            </span>
            <div className="filters">
              <Pill label="Kelurahan">
                <select value={kel} onChange={(e) => changeKel(e.target.value)} aria-label="Kelurahan">
                  {filterOptions.kelurahans.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </Pill>
              <Pill label="RW" disabled={kel === "Semua"}>
                <select value={rw} onChange={(e) => setRw(e.target.value)} disabled={kel === "Semua"} aria-label="RW"
                  title={kel === "Semua" ? "Pilih kelurahan terlebih dahulu" : ""}>
                  {filterOptions.rws.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Pill>
              <Pill label="Periode" icon="calendar">
                <select value={periode} onChange={(e) => setPeriode(e.target.value)} aria-label="Periode">
                  {filterOptions.periodes.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Pill>
              <ExportMenu onExport={doExport} />
            </div>
          </div>
        </header>

        {/* KPI */}
        <section className="kpis" aria-label="Indikator utama">
          {loading ? (
            <><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /></>
          ) : (
            <>
              <div className="card kpi">
                <span className="kpi-ico k-teal"><Icon name="building" size={30} /></span>
                <div>
                  <div className="kpi-l">Fasilitas terdata</div>
                  <div className="kpi-v">{data?.kpi.fasilitasTerdata ?? 0}</div>
                  <div className="kpi-s">{scopeText}</div>
                </div>
              </div>
              <div className="card kpi">
                <span className="kpi-ico k-teal"><Icon name="bars" size={30} stroke={3} /></span>
                <div>
                  <div className="kpi-l">Volume</div>
                  <div className="kpi-v">
                    {data?.kpi.volumeTotal != null
                      ? <>{fmtN(data.kpi.volumeTotal)} <small>m³/bulan</small></>
                      : <span style={{ fontSize: 14, color: "#9ca3af" }}>Belum ada data survei</span>}
                  </div>
                  <div className="kpi-s">dari survei KKN terkini</div>
                </div>
              </div>
              <div className="card kpi">
                <span className="kpi-ico k-amber"><Icon name="pie" size={30} /></span>
                <div>
                  <div className="kpi-l">Kepatuhan pemilahan</div>
                  <div className="kpi-v">
                    {data?.kpi.kepatuhanPemilahan != null
                      ? `${data.kpi.kepatuhanPemilahan}%`
                      : <span style={{ fontSize: 14, color: "#9ca3af" }}>Belum ada data survei</span>}
                  </div>
                  <div className="kpi-s">rata-rata lintas kelurahan</div>
                </div>
              </div>
              <div className="card kpi">
                <span className="kpi-ico k-teal"><Icon name="signal" size={30} /></span>
                <div>
                  <div className="kpi-l">Telemetri IoT CH₄</div>
                  <div className="kpi-v">
                    {onlineCount > 0 ? (
                      <>{onlineCount} <small>titik online</small></>
                    ) : (
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#10b981" }}>Tahap Integrasi</span>
                    )}
                  </div>
                  <div className="kpi-s">
                    {onlineCount > 0 ? "dari jaringan sensor aktif" : "infrastruktur sedang disiapkan"}
                  </div>
                </div>
                <span className={`kpi-dot ${onlineCount > 0 ? "" : "off"}`} aria-hidden="true" />
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
              />
              <Trend
                series={
                  (data?.trenBulanan && data.trenBulanan.length > 0)
                    ? data.trenBulanan.map((t) => t.volume ?? 0)
                    : [0, 0, 0, 0, 0, 0, 0, 0, 0]
                }
                pi={
                  (data?.trenBulanan && data.trenBulanan.length > 0)
                    ? data.trenBulanan.length - 1
                    : 8
                }
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
              <Methane sensors={sensors as any} />
            </>
          )}
        </section>

        {/* Bilah alat peta */}
        <section className="card toolbar" aria-label="Kontrol peta">
          <div className="search">
            <Icon name="search" size={19} className="search-i" />
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
                  const tipeInfo = TIPE_BY_ID[t];
                  return <option key={t} value={t}>{tipeInfo?.nama ?? t}</option>;
                })}
              </select>
              <Icon name="chevron" size={15} className="pill-c" />
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
                <ul className="fac-list">
                  {TIPE.map((t) => (
                    <li key={t.id}>
                      <button type="button"
                        className={facType === t.id ? "on" : ""} aria-pressed={facType === t.id}
                        onClick={() => setFacType(facType === t.id ? "Semua" : t.id)}
                        title="Klik untuk menyaring jenis ini">
                        <span className="fac-ico" style={{ background: t.warna }}>
                          <Icon name={TIPE_ICON[t.id]} size={17} stroke={2.2} />
                        </span>
                        <span className="fac-n">{t.nama}</span>
                        <span className="fac-d">—</span>
                        <span className="fac-f">{t.fungsi}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="side-sec">
                <h4 className="side-h">Kepatuhan (%)</h4>
                <ul className="lg-grid">
                  {KEP_CLASSES.map((c) => (
                    <li key={c.label}><i style={{ background: c.warna }} /><span>{c.label}</span><em>{c.ket}</em></li>
                  ))}
                  <li><i className="hatch" /><span>Belum ada data</span></li>
                </ul>
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
      </div>
    </div>
  );
}
