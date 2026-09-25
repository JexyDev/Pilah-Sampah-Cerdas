import React, { useRef, useState } from "react";
import { Icon, useSize } from "./ui";
import {
  CH4_CLASSES,
  MONTHS,
  ch4Class,
  type KelurahanData,
  type SensorItem,
  type StatsKelResult,
} from "./data";

const nf1 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const fmtN = (n: number | null | undefined): string => {
  if (n == null) return "—";
  if (Math.abs(n) > 0 && Math.abs(n) < 10) {
    return nf2.format(n);
  }
  return nf1.format(n);
};

const nf0 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
export const fmtInt = (n: number | null | undefined): string => {
  if (n == null) return "—";
  return nf0.format(Math.round(n));
};

interface CardTitleProps {
  icon: string;
  children: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}

export function CardTitle({ icon, children, subtitle, right }: CardTitleProps) {
  return (
    <div className="card-title">
      <div className="card-title-l">
        <span className="card-title-ico">
          <Icon name={icon} size={16} />
        </span>
        <div className="card-title-texts">
          <h3>{children}</h3>
          {subtitle && <p className="card-title-sub">{subtitle}</p>}
        </div>
      </div>
      {right ? <div className="card-title-r">{right}</div> : null}
    </div>
  );
}

/* ---------- 1. Komposisi volume ---------- */
export interface DonutProps {
  org: number;
  ano: number;
  res: number;
  orgPersen?: number;
  anoPersen?: number;
  resPersen?: number;
  orgKg?: number;
  anoKg?: number;
  resKg?: number;
  totalM3?: number;
  totalKg?: number;
  hasData?: boolean;
  wilayahLabel?: string;
  unit?: "kg" | "m³";
}

export function Donut({
  org,
  ano,
  res,
  orgPersen,
  anoPersen,
  resPersen,
  orgKg,
  anoKg,
  resKg,
  totalM3,
  totalKg,
  hasData,
  wilayahLabel,
  unit = "kg",
}: DonutProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const isKg = unit === "kg";
  const sumM3 = (org || 0) + (ano || 0) + (res || 0);
  const displayTotalM3 = totalM3 !== undefined ? totalM3 : sumM3;

  const sumKg = (orgKg || 0) + (anoKg || 0) + (resKg || 0);
  const displayTotalKg = totalKg !== undefined ? totalKg : sumKg;

  const displayTotal = isKg ? displayTotalKg : displayTotalM3;
  const hasRealData = Boolean(hasData && displayTotal != null && displayTotal > 0);

  // Persentase per kategori dihitung dinamis dari data
  const pOrg = hasRealData ? (orgPersen !== undefined ? orgPersen : Math.round(((org || 0) / (displayTotalM3 || 1)) * 100)) : 0;
  const pAno = hasRealData ? (anoPersen !== undefined ? anoPersen : Math.round(((ano || 0) / (displayTotalM3 || 1)) * 100)) : 0;
  const pRes = hasRealData ? (resPersen !== undefined ? resPersen : Math.round(((res || 0) / (displayTotalM3 || 1)) * 100)) : 0;

  const vOrg = hasRealData ? (isKg ? (orgKg || 0) : (org !== undefined && org > 0 ? org : Math.round(((displayTotalM3 || 0) * pOrg) / 100 * 10) / 10)) : 0;
  const vAno = hasRealData ? (isKg ? (anoKg || 0) : (ano !== undefined && ano > 0 ? ano : Math.round(((displayTotalM3 || 0) * pAno) / 100 * 10) / 10)) : 0;
  const vRes = hasRealData ? (isKg ? (resKg || 0) : (res !== undefined && res > 0 ? res : Math.round(((displayTotalM3 || 0) * pRes) / 100 * 10) / 10)) : 0;

  const parts = [
    { k: "Organik", key: "org", v: vOrg, vM3: org, vKg: orgKg, pct: pOrg, c: "#00a86b" },
    { k: "Anorganik", key: "ano", v: vAno, vM3: ano, vKg: anoKg, pct: pAno, c: "#f59e0b" },
    { k: "Residu", key: "res", v: vRes, vM3: res, vKg: resKg, pct: pRes, c: "#5b6b82" },
  ];

  const activePart = hoveredKey ? parts.find((p) => p.key === hoveredKey) : null;
  const centerValue = hasRealData
    ? (activePart ? fmtN(activePart.v) : fmtN(displayTotal))
    : "Belum ada data";
  const centerLabel = hasRealData
    ? (activePart ? `${activePart.k}` : (isKg ? "kg/bulan" : "m³/bulan"))
    : "Survei belum terdata";

  const r = 42;
  const C = 2 * Math.PI * r;
  const gap = 2.0;
  let off = 0;
  const totalVal = parts.reduce((acc, p) => acc + p.v, 0) || 1;

  const cardSubtitle = hasRealData
    ? isKg
      ? `Total ${fmtN(displayTotalKg)} kg/bulan${displayTotalM3 ? ` (~${fmtN(displayTotalM3)} m³)` : ""}`
      : `Total ${fmtN(displayTotalM3)} m³/bulan${displayTotalKg ? ` (~${fmtN(displayTotalKg)} kg)` : ""}`
    : "Belum ada data survei";

  return (
    <section className="card chart-card donut-card-full" aria-label="Komposisi volume">
      <CardTitle
        icon="pie"
        subtitle={cardSubtitle}
      >
        Komposisi volume
      </CardTitle>

      <div className="donut-container">
        {/* Row Atas: Donut SVG 112px + Legenda Bersih */}
        <div className="donut-top-row">
          <svg
            viewBox="0 0 120 120"
            className="donut donut-lg"
            role="img"
            aria-label={hasRealData ? parts.map((p) => `${p.k} ${p.pct}% (${fmtN(p.v)} ${isKg ? "kg" : "m³"})`).join(", ") : "Belum ada data komposisi volume"}
            onPointerLeave={() => setHoveredKey(null)}
          >
            <g transform="rotate(-90 60 60)">
              <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="15" />
              {hasRealData && parts.map((p) => {
                const len = (p.v / totalVal) * C;
                const dash = Math.max(len - gap, 0);
                const isHovered = hoveredKey === p.key;
                const isDimmed = hoveredKey !== null && !isHovered;
                const el = (
                  <circle
                    key={p.k}
                    cx="60"
                    cy="60"
                    r={r}
                    fill="none"
                    stroke={p.c}
                    strokeWidth={isHovered ? 18 : 15}
                    strokeDasharray={`${dash} ${C - dash}`}
                    strokeDashoffset={-off}
                    style={{
                      opacity: isDimmed ? 0.4 : 1,
                      transition: "stroke-width 0.2s ease, opacity 0.2s ease",
                      cursor: "pointer",
                    }}
                    onPointerEnter={() => setHoveredKey(p.key)}
                  />
                );
                off += len;
                return el;
              })}
            </g>
            <text
              x="60"
              y={hasRealData ? (activePart ? "56" : "59") : "58"}
              textAnchor="middle"
              className="donut-n"
              style={{
                fill: hasRealData ? (activePart ? activePart.c : "#0f172a") : "#9ca3af",
                fontSize: hasRealData ? (activePart ? 16 : 17) : 11,
                fontWeight: hasRealData ? 800 : 600,
              }}
            >
              {centerValue}
            </text>
            <text
              x="60"
              y={hasRealData ? (activePart ? "72" : "75") : "72"}
              textAnchor="middle"
              className="donut-u"
              style={{
                fill: hasRealData ? (activePart ? activePart.c : "#64748b") : "#94a3b8",
                fontSize: hasRealData ? (activePart ? 8.5 : 9) : 8,
                fontWeight: 500,
              }}
            >
              {centerLabel}
            </text>
          </svg>

          {/* Legenda vertikal rapi sesuai acuan QC */}
          <ul className="donut-clean-legend">
            {parts.map((p) => (
              <li
                key={p.k}
                className="donut-clean-item"
                onMouseEnter={() => hasRealData && setHoveredKey(p.key)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                <span className="donut-clean-dot" style={{ backgroundColor: p.c }} />
                <div className="donut-clean-info">
                  <span className="donut-clean-title">{p.k}</span>
                  <span className="donut-clean-detail">
                    {hasRealData
                      ? isKg
                        ? `${fmtN(p.v)} kg • ${p.pct}%`
                        : `${fmtN(p.v)} m³ • ${p.pct}%`
                      : `— ${isKg ? "kg" : "m³"} • 0%`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- 2. Tren volume bulanan ---------- */
function smoothPath(pts: [number, number][]): string {
  if (!pts || pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export interface TrendProps {
  series: number[];
  seriesKg?: number[];
  pi: number;
  unit?: "kg" | "m³";
}

export const PROGRAM_MONTH_LABELS = ["Agu", "Sep", "Okt", "Nov", "Des"];

export function Trend({ series, seriesKg, pi, unit = "kg" }: TrendProps) {
  const [isCumulative, setIsCumulative] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { w } = useSize(ref, { w: 420, h: 140 });
  const [hover, setHover] = useState<number | null>(null);

  const currentUnit = unit;
  const isKg = currentUnit === "kg";
  const sourceSeries = (isKg && seriesKg && seriesKg.length > 0) ? seriesKg : series;

  // Mendeteksi bulan nyata berjalan (Real-time Clock)
  const currentMonthReal = new Date().getMonth(); 
  const realWorldIdx = Math.max(0, Math.min(4, currentMonthReal - 7));
  
  // Jika Akumulasi -> Potong array sampai bulan real-time saat ini.
  const visibleLabels = isCumulative 
    ? PROGRAM_MONTH_LABELS.slice(0, realWorldIdx + 1)
    : PROGRAM_MONTH_LABELS;
  // Index aktif default (dari filter dropdown, dibatasi ke range visibleLabels)
  const defaultIdx = Math.min(
    visibleLabels.length - 1,
    pi >= 0 && pi < PROGRAM_MONTH_LABELS.length ? pi : realWorldIdx
  );

  // Mode Per Bulan: Hanya bulan yang sudah berjalan (idx <= defaultIdx) yang memiliki data riil.
  // Bulan ke depan (idx > defaultIdx) adalah null agar tidak menampilkan flatline/hardcode.
  const rawMonthly: (number | null)[] = PROGRAM_MONTH_LABELS.map((_, idx) => {
    if (idx > defaultIdx) return null;
    return (sourceSeries && sourceSeries[idx] != null) ? sourceSeries[idx] : 0;
  });

  // Mode Akumulasi: Hanya akumulasi sampai defaultIdx. Bulan setelahnya null (tidak menggambar garis datar fiktif)
  let runningSum = 0;
  const rawCumulative: (number | null)[] = PROGRAM_MONTH_LABELS.map((_, idx) => {
    if (idx > defaultIdx) return null;
    const v = (sourceSeries && sourceSeries[idx] != null) ? sourceSeries[idx] : 0;
    runningSum += v;
    return Math.round(runningSum * 10) / 10;
  });

  const activeSeries = isCumulative ? rawCumulative : rawMonthly;

  const H = 142;
  const m = { l: 44, r: 16, t: 26, b: 24 };

  const nonNullVals = activeSeries.filter((v): v is number => v !== null);
  const maxValInSeries = nonNullVals.length > 0 ? Math.max(...nonNullVals, 0) : 0;

  // Hitung rentang dan ticks Sumbu Y dinamis proporsional
  let yMin = 0;
  let yMax = isKg ? 2000 : 2;
  let yTicks: number[] = [];

  if (isKg) {
    // Sumbu Y untuk satuan KG
    const targetMax = Math.max(100, Math.ceil(maxValInSeries * 1.2));
    let step = 500;
    if (targetMax <= 200) step = 50;
    else if (targetMax <= 500) step = 100;
    else if (targetMax <= 1000) step = 250;
    else if (targetMax <= 2500) step = 500;
    else if (targetMax <= 5000) step = 1000;
    else step = Math.ceil(targetMax / 4 / 500) * 500;

    const count = Math.max(4, Math.ceil(targetMax / step));
    yMax = count * step;
    const tickStep = yMax / 4;
    yTicks = [0, Math.round(tickStep), Math.round(tickStep * 2), Math.round(tickStep * 3), yMax];
  } else {
    // Sumbu Y untuk satuan m³
    const targetMax = Math.max(0.4, maxValInSeries * 1.25);
    let step = 0.5;
    if (targetMax <= 0.5) step = 0.1;
    else if (targetMax <= 1) step = 0.25;
    else if (targetMax <= 2.5) step = 0.5;
    else if (targetMax <= 5) step = 1;
    else step = Math.ceil(targetMax / 4);

    const count = Math.max(4, Math.ceil(targetMax / step));
    yMax = Math.round(count * step * 100) / 100;
    const tickStep = yMax / 4;
    yTicks = [
      0,
      Math.round(tickStep * 100) / 100,
      Math.round(tickStep * 2 * 100) / 100,
      Math.round(tickStep * 3 * 100) / 100,
      yMax,
    ];
  }

  const denom = Math.max(1, PROGRAM_MONTH_LABELS.length - 1);
  const x = (i: number) => m.l + ((w - m.l - m.r) * i) / denom;
  const y = (v: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, v));
    return m.t + (H - m.t - m.b) * (1 - (clamped - yMin) / Math.max(1, yMax - yMin));
  };

  // Hanya plot kurva dan titik untuk bulan yang memiliki nilai (tidak null)
  const validPts: { idx: number; pt: [number, number]; val: number }[] = [];
  activeSeries.forEach((v, i) => {
    if (v !== null) {
      validPts.push({ idx: i, pt: [x(i), y(v)], val: v });
    }
  });

  const linePts = validPts.map((p) => p.pt);
  const line = smoothPath(linePts);
  const base = y(yMin);
  const area = validPts.length > 0
    ? `${line} L${validPts[validPts.length - 1].pt[0]},${base} L${validPts[0].pt[0]},${base} Z`
    : "";

  const activeIdx = hover ?? defaultIdx;
  const activeVal = activeSeries[activeIdx];
  const activeMonth = PROGRAM_MONTH_LABELS[activeIdx] ?? "Sep";
  const unitLabel = isKg ? (isCumulative ? "kg" : "kg/bln") : (isCumulative ? "m³" : "m³/bln");

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - m.l) / (w - m.l - m.r)) * (PROGRAM_MONTH_LABELS.length - 1));
    setHover(Math.max(0, Math.min(PROGRAM_MONTH_LABELS.length - 1, i)));
  };

  const tipW = 108;
  const activeX = x(activeIdx);
  const tipX = Math.max(m.l, Math.min(w - tipW - 4, activeX - tipW / 2));
  const tipY = activeVal != null ? Math.max(4, y(activeVal) - 34) : m.t;

  return (
    <section className="card chart-card" aria-label="Tren volume bulanan">
      <CardTitle
        icon="bars"
        subtitle={maxValInSeries > 0 ? undefined : "Belum ada log produksi tercatat"}
        right={
          <div className="trend-actions">
            <div className="trend-toggle-group" role="group" aria-label="Mode Tampilan Data Volume">
              <button
                type="button"
                className={`trend-toggle-btn ${!isCumulative ? "is-active" : ""}`}
                onClick={() => setIsCumulative(false)}
                title={`Tampilkan volume per bulan (${isKg ? "kg/bulan" : "m³/bulan"})`}
              >
                Per Bulan
              </button>
              <button
                type="button"
                className={`trend-toggle-btn ${isCumulative ? "is-active" : ""}`}
                onClick={() => setIsCumulative(true)}
                title={`Tampilkan total akumulasi volume sampah tahun berjalan (${isKg ? "kg" : "m³"})`}
              >
                Akumulasi
              </button>
            </div>
          </div>
        }
      >
        {isCumulative ? "Akumulasi volume sampah" : "Tren volume bulanan"}
      </CardTitle>

      <div ref={ref} className="trend">
        <svg
          width={w}
          height={H}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label="Grafik tren volume bulanan"
        >
          <defs>
            <linearGradient id="trendGradientFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#009966" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#009966" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Label Sumbu Y */}
          <text
            x={m.l - 4}
            y={m.t - 10}
            textAnchor="start"
            style={{ fontSize: 10.5, fontWeight: 500, fill: "#64748b" }}
          >
            {isCumulative
              ? `Volume (${isKg ? "kg" : "m³"} kumulatif)`
              : `Volume (${isKg ? "kg/bln" : "m³/bln"})`}
          </text>

          {/* Gridlines & Ticks Sumbu Y */}
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={m.l}
                x2={w - m.r}
                y1={y(t)}
                y2={y(t)}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray={t === yMin ? "none" : "3 3"}
              />
              <text x={m.l - 8} y={y(t) + 3.5} textAnchor="end" className="trend-ax-y">
                {fmtN(t)}
              </text>
            </g>
          ))}

          {/* Area & Kurva — Hanya menggambar hingga bulan aktif yang ada datanya */}
          {area && <path d={area} fill="url(#trendGradientFill)" />}
          {line && <path d={line} fill="none" stroke="#009966" strokeWidth="2.4" strokeLinecap="round" />}

          {/* Labels Sumbu X (Bulan Linimasa KKN) */}
          {PROGRAM_MONTH_LABELS.map((mo, i) => (
            <text
              key={mo}
              x={x(i)}
              y={H - 6}
              textAnchor="middle"
              className={`trend-ax-x ${i === activeIdx ? "is-active" : ""}`}
              style={{
                opacity: i > defaultIdx ? 0.45 : 1,
              }}
            >
              {mo}
            </text>
          ))}

          {/* Titik Point Lingkaran untuk Bulan Berjalan */}
          {validPts.map(({ idx, pt }) => (
            <circle
              key={idx}
              cx={pt[0]}
              cy={pt[1]}
              r={idx === activeIdx ? 5.5 : 3.5}
              fill={idx === activeIdx ? "#009966" : "#ffffff"}
              stroke="#009966"
              strokeWidth={idx === activeIdx ? 2 : 2}
            />
          ))}

          {/* Indikator titik kosong halus untuk bulan mendatang (Okt, Nov, Des) */}
          {PROGRAM_MONTH_LABELS.map((_, i) => {
            if (i <= defaultIdx) return null;
            return (
              <circle
                key={`future-${i}`}
                cx={x(i)}
                cy={base}
                r={2.5}
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeDasharray="2 2"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Garis Vertikal Titik Aktif */}
          {activeVal != null && (
            <line
              x1={x(activeIdx)}
              x2={x(activeIdx)}
              y1={m.t}
              y2={base}
              stroke="#009966"
              strokeOpacity="0.3"
              strokeDasharray="3 3"
            />
          )}

          {/* Tooltip Pill pada Titik Aktif */}
          <g transform={`translate(${tipX}, ${tipY})`} pointerEvents="none">
            <rect
              width={tipW}
              height="24"
              rx="6"
              fill="#064e3b"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
            />
            {/* Panah kecil ke bawah */}
            <polygon
              points={`${activeX - tipX - 4},24 ${activeX - tipX + 4},24 ${activeX - tipX},28`}
              fill="#064e3b"
            />
            <text x={tipW / 2} y="16" textAnchor="middle" className="trend-tooltip-text">
              {activeVal != null
                ? `${activeMonth} • ${fmtN(activeVal)} ${unitLabel}`
                : `${activeMonth} • Belum berjalan`}
            </text>
          </g>
        </svg>
      </div>

      {/* Tabel Nilai Volume Sesuai Mode Tampilan */}
      <div className="trend-table-wrap">
        <div className="trend-table-title">
          {isCumulative
            ? `Nilai volume akumulatif (${isKg ? "kg" : "m³"})`
            : `Nilai volume per bulan (${isKg ? "kg/bulan" : "m³/bulan"})`}
        </div>
        <div className="trend-table-grid">
          <div className="trend-table-row trend-table-head">
            {PROGRAM_MONTH_LABELS.map((m, i) => (
              <div key={m} className={`trend-table-cell ${i === activeIdx ? "is-active" : ""}`}>
                {m}
              </div>
            ))}
          </div>
          <div className="trend-table-row trend-table-body">
            {activeSeries.map((v, i) => (
              <div key={i} className={`trend-table-cell ${i === activeIdx ? "is-active" : ""}`}>
                {v != null ? fmtN(v) : "—"}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 3. Kepatuhan per kelurahan ---------- */
export interface ComplianceRow {
  k: KelurahanData;
  s: StatsKelResult;
}

interface ComplianceProps {
  rows: ComplianceRow[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export function Compliance({ rows, selected, onSelect }: ComplianceProps) {
  // Susun data dari baris API secara dinamis berdasarkan data kelurahan
  const kelList = (rows && rows.length > 0
    ? rows.map((r) => {
        const kep = r.s.kep;
        const hasSurvei = kep !== null && kep !== undefined;
        let color = "#9ca3af";
        if (hasSurvei) {
          if (kep >= 80) color = "#00a86b";
          else if (kep >= 50) color = "#f59e0b";
          else color = "#ef4444";
        }

        return {
          id: r.k.id,
          nama: r.k.nama,
          kepatuhan: kep,
          hasSurvei,
          color,
          totalSetoran: r.s.totalSetoran ?? 0,
          patuhSetoran: r.s.patuhSetoran ?? 0,
        };
      })
    : []
  ).sort((a, b) => {
    if (!a.hasSurvei && !b.hasSurvei) return a.nama.localeCompare(b.nama);
    if (!a.hasSurvei) return 1;
    if (!b.hasSurvei) return -1;
    return (b.kepatuhan ?? 0) - (a.kepatuhan ?? 0);
  });

  // Skala maks sumbu X adalah 100%
  const MAX_SCALE = 100;
  // Posisi target KKN 80% (persentase lebar track)
  const TARGET_KKN = 80;

  return (
    <section className="card chart-card" aria-label="Kepatuhan per kelurahan">
      <CardTitle
        icon="pinCircle"
        right={
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", background: "#fef3c7", color: "#92400e", fontWeight: 600, border: "1px solid #fde68a" }}>
              Sampel Selama Giat KKN
            </span>
            <span className="compliance-target-label" style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" }}>
              Target 80%
            </span>
          </div>
        }
      >
        Kepatuhan per kelurahan
      </CardTitle>

      <div style={{ fontSize: "11px", color: "#64748b", margin: "-6px 0 10px 0" }}>
        *Tingkat validasi pemilahan sampah warga binaan dari catatan transaksi aplikasi selama kegiatan KKN Tematik
      </div>

      <div className="compliance-container">
        <div className="compliance-bars-wrap">
          {/* Garis Putus-putus Target 80% menembus semua bar */}
          <div
            className="compliance-target-line"
            style={{ left: `calc(100px + (100% - 145px) * 0.8)` }}
            title="Garis Target Kepatuhan 80% (KKN)"
          />

          <ul className="compliance-list">
            {kelList.map((item) => {
              const widthPct = item.hasSurvei && item.kepatuhan != null
                ? Math.min((item.kepatuhan / MAX_SCALE) * 100, 100)
                : 0;
              const isSelected = selected === item.id;
              return (
                <li key={item.id} className="compliance-item">
                  <button
                    type="button"
                    className={`compliance-row-btn ${isSelected ? "is-selected" : ""}`}
                    onClick={() => onSelect(item.id)}
                    title={
                      item.hasSurvei && item.kepatuhan != null
                        ? `${item.nama}: ${item.kepatuhan}% (${item.patuhSetoran}/${item.totalSetoran} transaksi valid)`
                        : `${item.nama}: Belum ada data transaksi`
                    }
                  >
                    <span className="compliance-name">{item.nama}</span>
                    <div className="compliance-track">
                      {item.hasSurvei && item.kepatuhan != null ? (
                        <div
                          className="compliance-bar"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      ) : (
                        <div
                          className="compliance-bar is-empty"
                          style={{
                            width: "100%",
                            backgroundColor: "transparent",
                            backgroundImage: "repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 4px, #e2e8f0 4px, #e2e8f0 8px)",
                          }}
                        />
                      )}
                    </div>
                    
                    {/* UI Rasio Ganda Kanan */}
                    <div
                      className="compliance-val-col"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        minWidth: 46,
                        flexShrink: 0,
                        lineHeight: 1,
                      }}
                    >
                      <span
                        className="compliance-val"
                        style={{
                          color: item.hasSurvei ? undefined : "#9ca3af",
                          width: "auto",
                          lineHeight: 1.1,
                          fontSize: "11px",
                        }}
                      >
                        {item.hasSurvei && item.kepatuhan != null ? `${item.kepatuhan}%` : "—"}
                      </span>
                      {item.hasSurvei && item.totalSetoran > 0 && (
                        <span
                          style={{
                            fontSize: "8.5px",
                            color: "#64748b",
                            fontWeight: 500,
                            lineHeight: 1,
                            marginTop: "1.5px",
                            fontVariantNumeric: "tabular-nums",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.patuhSetoran}/{item.totalSetoran} setor
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Sumbu X Ticks di bawah bar (0%, 25%, 50%, 80%, 100%) */}
          <div className="compliance-x-axis">
            <span className="compliance-x-label" style={{ left: "100px" }}>
              0%
            </span>
            <span
              className="compliance-x-label"
              style={{ left: `calc(100px + (100% - 145px) * 0.25)` }}
            >
              25%
            </span>
            <span
              className="compliance-x-label"
              style={{ left: `calc(100px + (100% - 145px) * 0.5)` }}
            >
              50%
            </span>
            <span
              className="compliance-x-label"
              style={{ left: `calc(100px + (100% - 145px) * 0.8)`, color: "#065f46", fontWeight: 700 }}
            >
              80%
            </span>
            <span
              className="compliance-x-label"
              style={{ left: `calc(100px + (100% - 145px) * 1)` }}
            >
              100%
            </span>
          </div>
        </div>

        {/* Legenda Kategori Kepatuhan Sesuai Acuan QC */}
        <div className="compliance-legend">
          <div className="compliance-legend-item">
            <span className="compliance-legend-dot" style={{ background: "#00a86b" }} />
            <span>≥ 80% (mencapai target KKN)</span>
          </div>
          <div className="compliance-legend-item">
            <span className="compliance-legend-dot" style={{ background: "#f59e0b" }} />
            <span>50 – 79% (perlu peningkatan)</span>
          </div>
          <div className="compliance-legend-item">
            <span className="compliance-legend-dot" style={{ background: "#ef4444" }} />
            <span>&lt; 50% (perlu perhatian)</span>
          </div>
          <div className="compliance-legend-item">
            <span className="compliance-legend-dot" style={{ background: "#9ca3af" }} />
            <span>Belum ada data transaksi</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 4. Pemantauan Gas CH₄ ---------- */
interface MethaneProps {
  sensors: SensorItem[];
  metaCh4?: {
    status?: string;
    statusDeskripsi?: string;
    cakupan?: string;
    satuan?: string;
    sensorOnline?: string;
    placeholderVal?: string;
    placeholderStatus?: string;
    placeholderSub?: string;
  };
}

export function Methane({ sensors, metaCh4 }: MethaneProps) {
  const onlineCount = sensors ? sensors.filter((s) => s.ppm !== null).length : 0;
  const sensorOnlineText = metaCh4?.sensorOnline || `${onlineCount}/12`;

  return (
    <section className="card chart-card" aria-label="Pemantauan Gas CH₄">
      <CardTitle icon="activity">Pemantauan Gas CH₄</CardTitle>

      <div className="ch4-qc-wrap">
        {/* Status Integrasi IoT */}
        <div className="ch4-qc-status-row">
          <span className="ch4-qc-dot" />
          <span className="ch4-qc-status-title">
            {metaCh4?.status || "Integrasi jaringan IoT"}
          </span>
        </div>

        {/* Deskripsi Status */}
        <p className="ch4-qc-desc">
          {metaCh4?.statusDeskripsi ||
            "Telemetri belum aktif. Infrastruktur gateway dan sensor sedang disiapkan."}
        </p>

        {/* 3-Kolom Metrik Telemetri */}
        <div className="ch4-qc-stats-grid">
          <div className="ch4-qc-stat-col">
            <span className="ch4-qc-stat-label">Cakupan:</span>
            <b className="ch4-qc-stat-val">{metaCh4?.cakupan || "Coblong"}</b>
          </div>
          <div className="ch4-qc-stat-col">
            <span className="ch4-qc-stat-label">Satuan:</span>
            <b className="ch4-qc-stat-val">{metaCh4?.satuan || "ppm"}</b>
          </div>
          <div className="ch4-qc-stat-col">
            <span className="ch4-qc-stat-label">Sensor online:</span>
            <b className="ch4-qc-stat-val">{sensorOnlineText}</b>
          </div>
        </div>

        {/* Box Placeholder Sensor Belum Ada Data */}
        <div className="ch4-qc-placeholder-box">
          <div className="ch4-qc-cloud-icon">
            <Icon name="cloud" size={44} stroke={1.5} />
          </div>
          <div className="ch4-qc-placeholder-val">
            {metaCh4?.placeholderVal || "— ppm"}
          </div>
          <div className="ch4-qc-placeholder-status">
            {metaCh4?.placeholderStatus || "Belum ada data"}
          </div>
          <div className="ch4-qc-placeholder-sub">
            {metaCh4?.placeholderSub || "Aktivasi direncanakan Okt 2026"}
          </div>
        </div>
      </div>
    </section>
  );
}
