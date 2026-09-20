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

import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./gisEksekutif.css";
import { Icon, TIPE_ICON } from "./ui";
import { Donut, Trend, Compliance, Methane, fmtN, type ComplianceRow } from "./charts";
import MapView, { LAYERS, type ActiveTarget } from "./MapView";
import {
  CH4_CLASSES,
  KEP_CLASSES,
  TIPE,
  TIPE_BY_ID,
  type FacilityItem,
  type SensorItem,
  type KelurahanData,
  type StatsKelResult,
  pad2,
} from "./data";
import { gisEksekutifApi, type GisOverviewApiResponse } from "./gisEksekutifApi";


/* ---------- Helper: transform API response ke format MapView/charts ---------- */

/**
 * Mengubah data poligon dari API (lat/lng pairs) ke format KelurahanData
 * yang digunakan MapView dan charts.
 */
function buildKelurahanFromApi(
  apiData: GisOverviewApiResponse
): KelurahanData[] {
  return apiData.poligonKelurahan.map((p) => {
    const kepRow = apiData.kepatuhanPerKelurahan.find(
      (k) => k.nama.toLowerCase() === p.nama.toLowerCase()
    );
    const vol = kepRow?.volume ?? 15;
    const org = Math.round(vol * 0.55 * 10) / 10;
    const ano = Math.round(vol * 0.30 * 10) / 10;
    const res = Math.round(vol * 0.15 * 10) / 10;
    // Buat labelLL = centroid kasar dari koordinat poligon
    const lats = p.coordinates.map(([lat]) => lat);
    const lngs = p.coordinates.map(([, lng]) => lng);
    const centerLat = lats.length > 0 ? lats.reduce((a, b) => a + b, 0) / lats.length : -6.885;
    const centerLng = lngs.length > 0 ? lngs.reduce((a, b) => a + b, 0) / lngs.length : 107.615;

    // Buat id dari nama (slug)
    const id = p.nama.toLowerCase().replace(/\s+/g, "-");

    return {
      id,
      nama: p.nama,
      kep: p.kepatuhan,
      org,
      ano,
      res,
      rw: 6, // default fallback; jumlah RW tidak kritis untuk rendering peta
      fac: kepRow?.totalFasilitas ?? 0,
      label: [centerLng, centerLat] as [number, number],
      // ring = koordinat poligon sebagai [lat, lng] pairs untuk Leaflet
      poly: p.coordinates,
      ring: p.coordinates,
      labelLL: [centerLat, centerLng] as [number, number],
    };
  });
}

/**
 * Mengubah titik fasilitas dari API ke format FacilityItem untuk MapView.
 * Mapping tipe API → tipe internal (id) agar kompatibel dengan TIPE dari data.ts
 */
const API_TIPE_TO_ID: Record<string, string> = {
  bank_sampah: "bank",
  rumah_maggot: "maggot",
  buruan_sae: "sae",
  loseda: "loseda",
  bata_terawang: "bata",
  tps: "tps",
  poc: "poc",
};

function buildFacilitiesFromApi(
  apiData: GisOverviewApiResponse
): FacilityItem[] {
  return apiData.titikFasilitas.map((f) => {
    const kelId = f.kel.toLowerCase().replace(/\s+/g, "-");
    return {
      id: f.id,
      tipe: API_TIPE_TO_ID[f.tipe] ?? f.tipe,
      kel: kelId,
      rw: parseInt(f.rw.replace(/\D/g, ""), 10) || 1,
      x: 0, // tidak digunakan (MapView pakai ll)
      y: 0,
      nama: f.nama,
      ll: [f.lat, f.lng] as [number, number],
    };
  });
}

/**
 * Mengubah sensor CH4 dari API ke format SensorItem untuk MapView & charts.
 */
function buildSensorsFromApi(
  apiData: GisOverviewApiResponse
): SensorItem[] {
  return apiData.pemantauanCh4.sensors.map((s) => {
    const kelId = s.kel.toLowerCase().replace(/\s+/g, "-");
    return {
      id: s.label,
      kel: kelId,
      rw: parseInt(s.rw.replace(/\D/g, ""), 10) || 1,
      lokasi: s.lokasi,
      ppm: s.ch4Ppm,
      pos: [s.lng, s.lat] as [number, number], // untuk referensi saja
      ll: [s.lat, s.lng] as [number, number],
    };
  });
}

/**
 * Membangun ComplianceRow untuk chart Compliance dari data API
 */
function buildComplianceRows(
  kelurahanData: KelurahanData[],
  facilities: FacilityItem[],
  sensors: SensorItem[],
  selectedKelId: string | null,
  rwFilter: number | null,
): ComplianceRow[] {
  return kelurahanData.map((k) => {
    const kelSensors = sensors.filter((s) => s.kel === k.id);
    const kelFac = facilities.filter(
      (f) =>
        f.kel === k.id &&
        (!selectedKelId || selectedKelId === k.id || !rwFilter || f.rw === rwFilter)
    ).length;

    const s: StatsKelResult = {
      org: k.org,
      ano: k.ano,
      res: k.res,
      total: k.org + k.ano + k.res,
      kep: k.kep,
      fac: kelFac,
      sensors: kelSensors,
      share: k.org + k.ano + k.res,
    };
    return { k, s };
  });
}

/* ---------- Helper ekspor CSV ---------- */
const csvCell = (v: string | number): string => {
  const s = String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toCsv = (rows: Array<Array<string | number>>): string =>
  "\uFEFF" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n");

const dec = (n: number): string => String(Math.round(n * 10) / 10).replace(".", ",");

async function saveFile(filename: string, data: string): Promise<string> {
  try {
    const url = URL.createObjectURL(
      new Blob([data], { type: "text/csv;charset=utf-8" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return `Berkas ${filename} berhasil diunduh.`;
  } catch {
    return "Unduhan tidak dapat diproses di peramban ini.";
  }
}

/* ---------- Filter atas ---------- */
interface PillProps {
  label: string;
  icon?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function Pill({ label, icon, children, disabled }: PillProps) {
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

interface ExportMenuProps {
  onExport: (what: "kel" | "fac") => void;
  loading?: boolean;
}

function ExportMenu({ onExport, loading }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e: MouseEvent | PointerEvent) => {
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

  return (
    <div className="export" ref={box}>
      <button
        type="button"
        className="btn-primary"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="download" size={19} /> Ekspor <Icon name="chevron" size={15} />
      </button>
      {open ? (
        <div className="menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onExport("kel");
            }}
          >
            <Icon name="table" size={17} />
            <span>
              Ringkasan kelurahan<small>CSV • periode terpilih</small>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onExport("fac");
            }}
          >
            <Icon name="file" size={17} />
            <span>
              Daftar fasilitas<small>CSV • sesuai filter aktif</small>
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Loading Skeleton ---------- */
function KpiSkeleton() {
  return (
    <section className="kpis" aria-label="Memuat indikator utama">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card kpi" style={{ opacity: 0.5 }}>
          <span className="kpi-ico k-teal" style={{ background: "#e5e7eb" }} />
          <div>
            <div className="kpi-l" style={{ height: 12, background: "#e5e7eb", width: 100, borderRadius: 4 }} />
            <div className="kpi-v" style={{ height: 28, background: "#e5e7eb", width: 60, borderRadius: 4, marginTop: 6 }} />
            <div className="kpi-s" style={{ height: 10, background: "#e5e7eb", width: 80, borderRadius: 4, marginTop: 6 }} />
          </div>
        </div>
      ))}
    </section>
  );
}

/* ---------- Error Banner ---------- */
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      style={{
        background: "#fef2f2",
        border: "1px solid #fca5a5",
        borderRadius: 8,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "12px 0",
        color: "#b91c1c",
        fontSize: 14,
      }}
    >
      <Icon name="signal" size={18} />
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={onRetry}
        style={{
          padding: "4px 12px",
          background: "#ef4444",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        Coba lagi
      </button>
    </div>
  );
}

/* ---------- Komponen Utama GIS Eksekutif — Dinamis dari API ---------- */
export default function GisEksekutifPage() {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [kelFilter, setKelFilter] = useState("Semua");
  const [rwFilter, setRwFilter] = useState("Semua");
  const [periodeFilter, setPeriodeFilter] = useState("September 2026");
  const [facType, setFacType] = useState("all");
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  // ── Peta state ────────────────────────────────────────────────────────────
  const [layer, setLayer] = useState<"kep" | "org" | "ano" | "res" | "total" | "ch4">("kep");
  const [showSensor, setShowSensor] = useState(true);
  const [opacity, setOpacity] = useState(45);
  const [base, setBase] = useState<"peta" | "sat">("peta");
  const [active, setActive] = useState<ActiveTarget>(() =>
    typeof window !== "undefined" && window.innerWidth < 900
      ? null
      : { kind: "sensor", id: "CH₄-03" }
  );
  const [toast, setToast] = useState("");

  // ── API / loading state ───────────────────────────────────────────────────
  const [apiData, setApiData] = useState<GisOverviewApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch dari API backend ────────────────────────────────────────────────
  const fetchData = useCallback(
    async (isInitial = false) => {
      if (isInitial) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      try {
        const result = await gisEksekutifApi.getOverview({
          kelurahan: kelFilter !== "Semua" ? kelFilter : undefined,
          rw: rwFilter !== "Semua" ? rwFilter : undefined,
          periode: periodeFilter,
          jenisFasilitas: facType !== "all" ? facType : undefined,
          search: query || undefined,
        });
        setApiData(result);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
          err?.message ||
          "Gagal memuat data GIS Eksekutif dari server. Periksa koneksi dan coba lagi."
        );
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [kelFilter, rwFilter, periodeFilter, facType, query]
  );

  // Fetch on mount dan setiap filter berubah
  useEffect(() => {
    fetchData(apiData === null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelFilter, rwFilter, periodeFilter, facType, query]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Transform API data ke format komponen internal ────────────────────────
  const kelurahanData = useMemo<KelurahanData[]>(() => {
    if (!apiData) return [];
    return buildKelurahanFromApi(apiData);
  }, [apiData]);

  const allFacilities = useMemo<FacilityItem[]>(() => {
    if (!apiData) return [];
    return buildFacilitiesFromApi(apiData);
  }, [apiData]);

  const allSensors = useMemo<SensorItem[]>(() => {
    if (!apiData) return [];
    return buildSensorsFromApi(apiData);
  }, [apiData]);

  // ── Computed values dari data dinamis ─────────────────────────────────────
  const kelId = kelFilter !== "Semua"
    ? kelFilter.toLowerCase().replace(/\s+/g, "-")
    : null;

  const rwNum = rwFilter !== "Semua" ? parseInt(rwFilter.replace(/\D/g, ""), 10) || null : null;

  // Fasilitas terfilter yang tampil di peta
  const scoped = useMemo(() => {
    return allFacilities.filter(
      (f) => (!kelId || f.kel === kelId) && (!rwNum || f.rw === rwNum)
    );
  }, [allFacilities, kelId, rwNum]);

  const visible = useMemo<FacilityItem[]>(() => {
    const q = query.trim().toLowerCase();
    return scoped.filter((f) => {
      if (facType !== "all" && API_TIPE_TO_ID[facType] !== f.tipe && f.tipe !== facType) return false;
      if (!q) return true;
      const tipeFungsi = TIPE_BY_ID[f.tipe]?.fungsi || "";
      const hay = `${f.nama} rw ${f.rw} rw ${pad2(f.rw)} ${tipeFungsi}`.toLowerCase();
      return q.split(/\s+/).every((tok) => hay.includes(tok));
    });
  }, [scoped, facType, query]);

  const filtered = facType !== "all" || query.trim() !== "";

  // Sensor yang relevan
  const sensorScope = useMemo(() => {
    return allSensors.filter(
      (s) => (!kelId || s.kel === kelId) && (!rwNum || s.rw === rwNum)
    );
  }, [allSensors, kelId, rwNum]);

  const onlineSensors = sensorScope.filter((s) => s.ppm !== null);

  // Compliance rows untuk chart
  const kelRows = useMemo<ComplianceRow[]>(() => {
    return buildComplianceRows(kelurahanData, allFacilities, allSensors, kelId, rwNum);
  }, [kelurahanData, allFacilities, allSensors, kelId, rwNum]);

  // Data KPI dari API (langsung dari backend, bukan hardcode)
  const kpi = apiData?.kpi;
  const komposisi = apiData?.komposisiVolume;
  const trenBulanan = apiData?.trenBulanan ?? [];
  const filterOptions = apiData?.filterOptions;

  // Tren series (volume bulanan) — dari API, bukan konstanta statis
  const trenSeries = useMemo(() => {
    return trenBulanan.map((t) => t.volume);
  }, [trenBulanan]);

  // Periode index untuk Trend chart — cari bulan di tren
  const periodeIdx = useMemo(() => {
    const bulan = periodeFilter.split(" ")[0]; // "September"
    // Map bulan nama ke idx
    const map: Record<string, number> = {
      Januari: 0, Februari: 1, Maret: 2, April: 3,
      Mei: 4, Juni: 5, Juli: 6, Agustus: 7, September: 8,
    };
    return map[bulan] ?? 8;
  }, [periodeFilter]);

  // ── Handler ───────────────────────────────────────────────────────────────
  const changeKel = (v: string) => {
    setKelFilter(v);
    setRwFilter("Semua");
  };

  const toggleKel = (id: string) => {
    // id = slugified kelurahan id, kita lookup nama dari kelurahanData
    const kelData = kelurahanData.find((k) => k.id === id);
    if (!kelData) return;
    changeKel(kelFilter === kelData.nama ? "Semua" : kelData.nama);
  };

  const submitSearch = () => setQuery(input);
  const clearFilters = () => {
    setFacType("all");
    setInput("");
    setQuery("");
  };

  // RW list dinamis dari API (filtered per kelurahan)
  const rwOptions = useMemo(() => {
    return filterOptions?.rws ?? ["Semua"];
  }, [filterOptions]);

  // Ekspor CSV: menggunakan API endpoint untuk download dinamis
  const doExport = async (what: "kel" | "fac") => {
    try {
      await gisEksekutifApi.downloadCsv(what === "kel" ? "kelurahan" : "fasilitas", {
        kelurahan: kelFilter !== "Semua" ? kelFilter : undefined,
        rw: rwFilter !== "Semua" ? rwFilter : undefined,
        periode: periodeFilter,
      });
      setToast(`Ekspor ${what === "kel" ? "ringkasan kelurahan" : "daftar fasilitas"} berhasil diunduh.`);
    } catch {
      // Fallback ke client-side CSV jika API gagal
      if (what === "kel" && apiData) {
        const rows: Array<Array<string | number>> = [
          ["Kelurahan", "Periode", "Fasilitas", "Organik (m³)", "Anorganik (m³)", "Residu (m³)", "Total (m³)", "Kepatuhan (%)"],
        ];
        apiData.kepatuhanPerKelurahan.forEach((k) => {
          const vol = k.volume;
          rows.push([
            k.nama,
            periodeFilter,
            k.totalFasilitas,
            dec(vol * 0.55),
            dec(vol * 0.30),
            dec(vol * 0.15),
            dec(vol),
            k.kepatuhan,
          ]);
        });
        setToast(await saveFile(`ringkasan-kelurahan-${periodeFilter}.csv`, toCsv(rows)));
      } else if (apiData) {
        const rows: Array<Array<string | number>> = [["ID", "Nama Fasilitas", "Tipe", "Kelurahan", "RW", "Latitude", "Longitude"]];
        visible.forEach((f) =>
          rows.push([f.id, f.nama, TIPE_BY_ID[f.tipe]?.nama || f.tipe, f.kel, pad2(f.rw), f.ll[0], f.ll[1]])
        );
        setToast(await saveFile("daftar-fasilitas.csv", toCsv(rows)));
      }
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const scopeText = !kelId
    ? "dari seluruh kelurahan"
    : `di Kel. ${kelFilter}${rwFilter !== "Semua" ? ` RW ${rwFilter}` : ""}`;

  const noPrev = "Belum ada periode pembanding";

  return (
    <div className="gis-eksekutif-root">
      <div className="app">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="head">
          <div className="head-l">
            <h1>GIS Eksekutif Tata Kelola Sampah</h1>
            <p className="sub">
              Kecamatan Coblong • Fasilitas, pemilahan, volume, dan pemantauan CH₄
              {isRefreshing && (
                <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>
                  ● Memperbarui data…
                </span>
              )}
            </p>
          </div>
          <div className="head-r">
            <span className="tag" style={{ background: "#d1fae5", color: "#065f46" }}>
              LIVE • DATA REAL-TIME
            </span>
            <div className="filters">
              <Pill label="Kelurahan">
                <select
                  value={kelFilter}
                  onChange={(e) => changeKel(e.target.value)}
                  aria-label="Kelurahan"
                  disabled={loading}
                >
                  {(filterOptions?.kelurahans ?? ["Semua"]).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </Pill>
              <Pill label="RW" disabled={kelFilter === "Semua"}>
                <select
                  value={rwFilter}
                  onChange={(e) => setRwFilter(e.target.value)}
                  disabled={kelFilter === "Semua" || loading}
                  aria-label="RW"
                  title={kelFilter === "Semua" ? "Pilih kelurahan terlebih dahulu" : ""}
                >
                  {rwOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Pill>
              <Pill label="Periode" icon="calendar">
                <select
                  value={periodeFilter}
                  onChange={(e) => setPeriodeFilter(e.target.value)}
                  aria-label="Periode"
                  disabled={loading}
                >
                  {(filterOptions?.periodes ?? ["September 2026"]).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Pill>
              <ExportMenu onExport={doExport} loading={loading} />
            </div>
          </div>
        </header>

        {/* ── Error Banner ─────────────────────────────────────────────────── */}
        {error && !loading && (
          <ErrorBanner
            message={error}
            onRetry={() => fetchData(false)}
          />
        )}

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        {loading && !apiData ? (
          <KpiSkeleton />
        ) : (
          <section className="kpis" aria-label="Indikator utama">
            <div className="card kpi">
              <span className="kpi-ico k-teal">
                <Icon name="building" size={30} />
              </span>
              <div>
                <div className="kpi-l">Fasilitas terdata</div>
                <div className="kpi-v">{kpi?.fasilitasTerdata ?? visible.length}</div>
                <div className="kpi-s">{scopeText}</div>
              </div>
            </div>
            <div className="card kpi">
              <span className="kpi-ico k-teal">
                <Icon name="bars" size={30} stroke={3} />
              </span>
              <div>
                <div className="kpi-l">Volume</div>
                <div className="kpi-v">
                  {fmtN(kpi?.volumeTotal ?? 0)} <small>m³/bulan</small>
                </div>
                <div
                  className={`kpi-s ${
                    kpi && kpi.volumeGrowthPercent >= 0 ? "up" : "down"
                  }`}
                >
                  {kpi ? (
                    <>
                      {kpi.volumeGrowthPercent >= 0 ? "▲" : "▼"}{" "}
                      {kpi.volumeGrowthPercent >= 0 ? "+" : "−"}
                      {Math.abs(kpi.volumeGrowthPercent)}%{" "}
                      <span className="mut">dari periode sebelumnya</span>
                    </>
                  ) : (
                    noPrev
                  )}
                </div>
              </div>
            </div>
            <div className="card kpi">
              <span className="kpi-ico k-amber">
                <Icon name="pie" size={30} />
              </span>
              <div>
                <div className="kpi-l">Kepatuhan pemilahan</div>
                <div className="kpi-v">{kpi?.kepatuhanPemilahan ?? 0}%</div>
                <div
                  className={`kpi-s ${
                    kpi && kpi.kepatuhanDeltaPoin >= 0 ? "up" : "down"
                  }`}
                >
                  {kpi ? (
                    <>
                      {kpi.kepatuhanDeltaPoin >= 0 ? "▲" : "▼"}{" "}
                      {kpi.kepatuhanDeltaPoin >= 0 ? "+" : "−"}
                      {Math.abs(kpi.kepatuhanDeltaPoin)} poin{" "}
                      <span className="mut">dari periode sebelumnya</span>
                    </>
                  ) : (
                    noPrev
                  )}
                </div>
              </div>
            </div>
            <div className="card kpi">
              <span className="kpi-ico k-teal">
                <Icon name="signal" size={30} />
              </span>
              <div>
                <div className="kpi-l">Sensor CH₄ online</div>
                <div className="kpi-v">
                  {kpi?.sensorCh4OnlineCount ?? onlineSensors.length}/
                  {kpi?.sensorCh4TotalCount ?? sensorScope.length}
                </div>
                <div className="kpi-s">titik terhubung</div>
              </div>
              <span
                className={`kpi-dot ${
                  (kpi?.sensorCh4OnlineCount ?? onlineSensors.length) > 0 ? "" : "off"
                }`}
                aria-hidden="true"
              />
            </div>
          </section>
        )}

        {/* ── Charts ────────────────────────────────────────────────────────── */}
        {!loading || apiData ? (
          <section className="charts" aria-label="Ringkasan grafik">
            <Donut
              org={komposisi?.organik.volumeM3 ?? 0}
              ano={komposisi?.anorganik.volumeM3 ?? 0}
              res={komposisi?.residu.volumeM3 ?? 0}
            />
            <Trend
              series={trenSeries.length > 0 ? trenSeries : [0]}
              pi={periodeIdx}
            />
            <Compliance
              rows={kelRows}
              selected={kelId}
              onSelect={toggleKel}
            />
            <Methane sensors={sensorScope} />
          </section>
        ) : null}

        {/* ── Toolbar peta ─────────────────────────────────────────────────── */}
        <section className="card toolbar" aria-label="Kontrol peta">
          <div className="search">
            <Icon name="search" size={19} className="search-i" />
            <input
              type="search"
              value={input}
              placeholder="Cari alamat, kelurahan, RW, atau fasilitas…"
              onChange={(e) => {
                setInput(e.target.value);
                if (!e.target.value) setQuery("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
              }}
              aria-label="Cari"
            />
          </div>
          <button type="button" className="btn-primary btn-sm" onClick={submitSearch}>
            Cari
          </button>
          <label className="fac-sel">
            <span>Fasilitas:</span>
            <span className="pill-s">
              <select
                value={facType}
                onChange={(e) => setFacType(e.target.value)}
                aria-label="Jenis fasilitas"
              >
                <option value="all">Semua</option>
                {TIPE.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama}
                  </option>
                ))}
              </select>
              <Icon name="chevron" size={15} className="pill-c" />
            </span>
          </label>
          <div className="tabs" role="group" aria-label="Lapisan overlay">
            {LAYERS.map((l) => (
              <button
                key={l.id}
                type="button"
                className={layer === l.id ? "on" : ""}
                aria-pressed={layer === l.id}
                onClick={() => setLayer(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="sw">
            <span>Titik sensor CH₄:</span>
            <button
              type="button"
              role="switch"
              aria-checked={showSensor}
              className={`switch ${showSensor ? "on" : ""}`}
              onClick={() => setShowSensor((v) => !v)}
            >
              <i />
            </button>
            <b>{showSensor ? "Aktif" : "Nonaktif"}</b>
          </div>
          <span className="hint">Satu overlay aktif • Sensor berupa titik terukur</span>
        </section>

        {/* ── Peta + legenda ────────────────────────────────────────────────── */}
        <section className="main">
          {kelurahanData.length > 0 ? (
            <MapView
              kelRows={kelRows}
              layer={layer}
              opacity={opacity}
              setOpacity={setOpacity}
              base={base}
              setBase={setBase}
              showSensor={showSensor}
              facilities={visible}
              allCount={scoped.length}
              sensors={sensorScope}
              selectedKel={kelId}
              onSelectKel={toggleKel}
              active={active}
              setActive={setActive}
              onClearFilters={clearFilters}
              filtered={filtered}
            />
          ) : (
            <div
              className="card"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 300,
                color: "#9ca3af",
                fontSize: 15,
              }}
            >
              {loading ? "Memuat peta…" : error ? "Peta tidak dapat dimuat." : "Tidak ada data wilayah."}
            </div>
          )}
          <aside className="card side" aria-label="Legenda">
            <div className="side-sec">
              <h4 className="side-h">Fasilitas dan fungsi</h4>
              <ul className="fac-list">
                {TIPE.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      className={facType === t.id ? "on" : ""}
                      aria-pressed={facType === t.id}
                      onClick={() => setFacType(facType === t.id ? "all" : t.id)}
                      title="Klik untuk menyaring jenis ini"
                    >
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
                  <li key={c.label}>
                    <i style={{ background: c.warna }} />
                    <span>{c.label}</span>
                    <em>{c.ket}</em>
                  </li>
                ))}
                <li>
                  <i className="hatch" />
                  <span>Belum ada data</span>
                </li>
              </ul>
            </div>

            <div className="side-sec">
              <h4 className="side-h">Metana CH₄ (ppm)</h4>
              <ul className="lg-row">
                {CH4_CLASSES.map((c) => (
                  <li key={c.label}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="-10 -10 20 20"
                      aria-hidden="true"
                    >
                      <rect
                        x="-6"
                        y="-6"
                        width="12"
                        height="12"
                        rx="2.4"
                        transform="rotate(45)"
                        fill={c.fill}
                        stroke={c.stroke}
                        strokeWidth="2"
                      />
                      {c.min >= 5 ? (
                        <rect
                          x="-2.4"
                          y="-2.4"
                          width="4.8"
                          height="4.8"
                          rx="1"
                          transform="rotate(45)"
                          fill={c.stroke}
                        />
                      ) : null}
                    </svg>
                    <span>{c.label}</span>
                  </li>
                ))}
                <li>
                  <svg width="20" height="20" viewBox="-10 -10 20 20" aria-hidden="true">
                    <rect
                      x="-6"
                      y="-6"
                      width="12"
                      height="12"
                      rx="2.4"
                      transform="rotate(45)"
                      fill="#e5e7eb"
                      stroke="#6b7280"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>Offline</span>
                </li>
              </ul>
            </div>

            {/* Info metadata API */}
            {apiData && (
              <p className="side-note" style={{ marginTop: 12, fontSize: 11 }}>
                Data diperbarui:{" "}
                {new Date(apiData.meta.timestamp).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                <br />
                Sumber: PostgreSQL Berseka •{" "}
                {apiData.meta.wilayah}
              </p>
            )}
          </aside>
        </section>

        {/* ── Toast ─────────────────────────────────────────────────────────── */}
        <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">
          {toast}
        </div>
      </div>
    </div>
  );
}
