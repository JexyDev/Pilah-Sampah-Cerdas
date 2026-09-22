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
export const fmtN = (n: number | null | undefined): string => {
  if (n == null) return "—";
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
  hasData?: boolean;
  wilayahLabel?: string;
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
  hasData,
  wilayahLabel,
}: DonutProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const sum = (org || 0) + (ano || 0) + (res || 0);
  const displayTotal = totalM3 !== undefined ? totalM3 : sum;
  const hasRealData = Boolean(hasData && displayTotal != null && displayTotal > 0);

  // Persentase per kategori dihitung dinamis dari data
  const pOrg = hasRealData ? (orgPersen !== undefined ? orgPersen : Math.round(((org || 0) / (displayTotal || 1)) * 100)) : 0;
  const pAno = hasRealData ? (anoPersen !== undefined ? anoPersen : Math.round(((ano || 0) / (displayTotal || 1)) * 100)) : 0;
  const pRes = hasRealData ? (resPersen !== undefined ? resPersen : Math.round(((res || 0) / (displayTotal || 1)) * 100)) : 0;

  const vOrg = hasRealData ? (org !== undefined && org > 0 ? org : Math.round(((displayTotal || 0) * pOrg) / 100 * 10) / 10) : 0;
  const vAno = hasRealData ? (ano !== undefined && ano > 0 ? ano : Math.round(((displayTotal || 0) * pAno) / 100 * 10) / 10) : 0;
  const vRes = hasRealData ? (res !== undefined && res > 0 ? res : Math.round(((displayTotal || 0) * pRes) / 100 * 10) / 10) : 0;

  // Nilai timbulan harian kg/hari dihitung dinamis dari data survei
  const kgOrg = hasRealData ? (orgKg != null && orgKg > 0 ? orgKg : Math.round((vOrg * 1000) / 30)) : 0;
  const kgAno = hasRealData ? (anoKg != null && anoKg > 0 ? anoKg : Math.round((vAno * 1000) / 30)) : 0;
  const kgRes = hasRealData ? (resKg != null && resKg > 0 ? resKg : Math.round((vRes * 1000) / 30)) : 0;
  const totalKgHari = kgOrg + kgAno + kgRes;
  const totalTonHari = totalKgHari > 0 ? Math.round((totalKgHari / 1000) * 10) / 10 : 0;

  const parts = [
    { k: "Organik", key: "org", v: vOrg, pct: pOrg, c: "#00a86b" },
    { k: "Anorganik", key: "ano", v: vAno, pct: pAno, c: "#f59e0b" },
    { k: "Residu", key: "res", v: vRes, pct: pRes, c: "#5b6b82" },
  ];

  const activePart = hoveredKey ? parts.find((p) => p.key === hoveredKey) : null;
  const centerValue = hasRealData
    ? (activePart ? fmtN(activePart.v) : fmtN(displayTotal))
    : "Belum ada data";
  const centerLabel = hasRealData
    ? (activePart ? `${activePart.k}` : "m³/bulan")
    : "Survei belum terdata";

  const r = 42;
  const C = 2 * Math.PI * r;
  const gap = 2.0;
  let off = 0;
  const totalVal = parts.reduce((acc, p) => acc + p.v, 0) || 1;

  return (
    <section className="card chart-card donut-card-full" aria-label="Komposisi volume">
      <CardTitle
        icon="pie"
        subtitle={hasRealData ? `Total ${fmtN(displayTotal)} m³/bulan` : "Belum ada data survei"}
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
            aria-label={hasRealData ? parts.map((p) => `${p.k} ${p.pct}% (${fmtN(p.v)} m³)`).join(", ") : "Belum ada data komposisi volume"}
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
                fontSize: hasRealData ? (activePart ? 18 : 20) : 11,
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
                    {hasRealData ? `${fmtN(p.v)} m³ • ${p.pct}%` : "— m³ • 0%"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bar Proporsi Stacked 100% Horizontal */}
        <div className="donut-stacked-wrap">
          <div className="donut-stacked-head">
            <span className="donut-stacked-title">Proporsi Akumulasi</span>
            <span className="donut-stacked-total">
              {hasRealData ? `~${fmtN(totalTonHari)} ton/hari` : "— ton/hari"}
            </span>
          </div>
          <div className="donut-stacked-bar">
            {hasRealData ? (
              <>
                <div
                  className="donut-stacked-segment"
                  style={{ width: `${pOrg}%`, backgroundColor: "#00a86b" }}
                  title={`Organik: ${pOrg}%`}
                />
                <div
                  className="donut-stacked-segment"
                  style={{ width: `${pAno}%`, backgroundColor: "#f59e0b" }}
                  title={`Anorganik: ${pAno}%`}
                />
                <div
                  className="donut-stacked-segment"
                  style={{ width: `${pRes}%`, backgroundColor: "#5b6b82" }}
                  title={`Residu: ${pRes}%`}
                />
              </>
            ) : (
              <div
                className="donut-stacked-segment is-empty"
                style={{ width: "100%" }}
              />
            )}
          </div>
        </div>

        {/* 3-Kolom Timbulan Harian (kg/hari) */}
        <div className="donut-daily-grid">
          <div className="donut-daily-col">
            <div className="donut-daily-head">
              <span className="donut-daily-dot" style={{ backgroundColor: "#00a86b" }} />
              <span className="donut-daily-label">Organik</span>
            </div>
            <div className="donut-daily-val">
              {hasRealData ? fmtInt(kgOrg) : "—"}
            </div>
            <div className="donut-daily-unit">kg/hari</div>
          </div>

          <div className="donut-daily-col">
            <div className="donut-daily-head">
              <span className="donut-daily-dot" style={{ backgroundColor: "#f59e0b" }} />
              <span className="donut-daily-label">Anorganik</span>
            </div>
            <div className="donut-daily-val">
              {hasRealData ? fmtInt(kgAno) : "—"}
            </div>
            <div className="donut-daily-unit">kg/hari</div>
          </div>

          <div className="donut-daily-col">
            <div className="donut-daily-head">
              <span className="donut-daily-dot" style={{ backgroundColor: "#5b6b82" }} />
              <span className="donut-daily-label">Residu</span>
            </div>
            <div className="donut-daily-val">
              {hasRealData ? fmtInt(kgRes) : "—"}
            </div>
            <div className="donut-daily-unit">kg/hari</div>
          </div>
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

interface TrendProps {
  series: number[];
  pi: number;
}

const MONTH_LABELS_9 = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep"];

export function Trend({ series, pi }: TrendProps) {
  const [isCumulative, setIsCumulative] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { w } = useSize(ref, { w: 420, h: 140 });
  const [hover, setHover] = useState<number | null>(null);

  // Ambil 9 bulan hingga September secara dinamis dari data series API
  const rawMonthly = MONTH_LABELS_9.map((_, idx) => {
    return (series && series[idx] != null) ? series[idx] : 0;
  });

  // Hitung kumulatif jika mode kumulatif aktif
  let runningSum = 0;
  const rawCumulative = rawMonthly.map((v) => {
    runningSum += v;
    return Math.round(runningSum * 10) / 10;
  });

  const activeSeries = isCumulative ? rawCumulative : rawMonthly;

  const H = 142;
  const m = { l: 44, r: 16, t: 26, b: 24 };

  const maxValInSeries = Math.max(...activeSeries, 0);
  const yMin = 0;
  let computedMax = Math.max(isCumulative ? 100 : 20, Math.ceil(maxValInSeries * 1.25));
  if (computedMax <= 50) computedMax = 50;
  else if (computedMax <= 200) computedMax = 200;
  else if (computedMax <= 500) computedMax = 500;
  else if (computedMax <= 2000) computedMax = 2000;
  else if (computedMax <= 5000) computedMax = 5000;
  else computedMax = Math.ceil(computedMax / 1000) * 1000;

  const yMax = computedMax;
  const step = yMax / 4;
  const yTicks = [0, Math.round(step), Math.round(step * 2), Math.round(step * 3), yMax];

  const denom = Math.max(1, activeSeries.length - 1);
  const x = (i: number) => m.l + ((w - m.l - m.r) * i) / denom;
  const y = (v: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, v));
    return m.t + (H - m.t - m.b) * (1 - (clamped - yMin) / (yMax - yMin));
  };

  const pts: [number, number][] = activeSeries.map((v, i) => [x(i), y(v)]);
  const line = smoothPath(pts);
  const base = y(yMin);
  const area = pts.length > 0 ? `${line} L${x(activeSeries.length - 1)},${base} L${x(0)},${base} Z` : "";

  // Index aktif default adalah September (idx 8)
  const activeIdx = hover ?? (pi >= 0 && pi < activeSeries.length ? pi : activeSeries.length - 1);
  const activeVal = activeSeries[activeIdx] ?? activeSeries[activeSeries.length - 1];
  const activeMonth = MONTH_LABELS_9[activeIdx] ?? "Sep";

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - m.l) / (w - m.l - m.r)) * (activeSeries.length - 1));
    setHover(Math.max(0, Math.min(activeSeries.length - 1, i)));
  };

  const tipW = 104;
  const activeX = x(activeIdx);
  const tipX = Math.max(m.l, Math.min(w - tipW - 4, activeX - tipW / 2));
  const tipY = Math.max(4, y(activeVal) - 34);

  return (
    <section className="card chart-card" aria-label="Tren volume bulanan">
      <CardTitle
        icon="bars"
        subtitle={maxValInSeries > 0 ? undefined : "Belum ada log produksi tercatat"}
        right={
          <div className="trend-toggle-group">
            <button
              type="button"
              className={`trend-toggle-btn ${!isCumulative ? "is-active" : ""}`}
              onClick={() => setIsCumulative(false)}
            >
              Bulanan
            </button>
            <button
              type="button"
              className={`trend-toggle-btn ${isCumulative ? "is-active" : ""}`}
              onClick={() => setIsCumulative(true)}
            >
              Kumulatif
            </button>
          </div>
        }
      >
        Tren volume bulanan
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
            Volume (m³/bulan)
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

          {/* Area & Kurva */}
          <path d={area} fill="url(#trendGradientFill)" />
          <path d={line} fill="none" stroke="#009966" strokeWidth="2.4" strokeLinecap="round" />

          {/* Labels Sumbu X (Bulan) */}
          {MONTH_LABELS_9.map((mo, i) => (
            <text
              key={mo}
              x={x(i)}
              y={H - 6}
              textAnchor="middle"
              className={`trend-ax-x ${i === activeIdx ? "is-active" : ""}`}
            >
              {mo}
            </text>
          ))}

          {/* Titik Point Lingkaran */}
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={p[0]}
              cy={p[1]}
              r={i === activeIdx ? 5.5 : 3.5}
              fill={i === activeIdx ? "#009966" : "#ffffff"}
              stroke="#009966"
              strokeWidth={i === activeIdx ? "2" : "2"}
            />
          ))}

          {/* Garis Vertikal Titik Aktif */}
          <line
            x1={x(activeIdx)}
            x2={x(activeIdx)}
            y1={m.t}
            y2={base}
            stroke="#009966"
            strokeOpacity="0.3"
            strokeDasharray="3 3"
          />

          {/* Tooltip Pill pada Titik Aktif (Sep • 1.609,2 m³) */}
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
              {activeMonth} • {fmtN(activeVal)} m³
            </text>
          </g>
        </svg>
      </div>

      {/* Tabel Nilai Volume Bulanan Sesuai Acuan QC */}
      <div className="trend-table-wrap">
        <div className="trend-table-title">Nilai volume (m³/bulan)</div>
        <div className="trend-table-grid">
          <div className="trend-table-row trend-table-head">
            {MONTH_LABELS_9.map((m) => (
              <div key={m} className="trend-table-cell">
                {m}
              </div>
            ))}
          </div>
          <div className="trend-table-row trend-table-body">
            {activeSeries.map((v, i) => (
              <div key={i} className="trend-table-cell">
                {fmtN(v)}
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
          if (kep >= 25) color = "#00a86b";
          else if (kep >= 10) color = "#f59e0b";
          else color = "#ef4444";
        }

        return {
          id: r.k.id,
          nama: r.k.nama,
          kepatuhan: kep,
          hasSurvei,
          color,
        };
      })
    : []
  ).sort((a, b) => {
    if (!a.hasSurvei && !b.hasSurvei) return a.nama.localeCompare(b.nama);
    if (!a.hasSurvei) return 1;
    if (!b.hasSurvei) return -1;
    return (b.kepatuhan ?? 0) - (a.kepatuhan ?? 0);
  });

  // Skala maks sumbu X adalah 30%
  const MAX_SCALE = 30;
  // Posisi target 25% (persentase lebar track)
  const targetLeftPercent = (25 / MAX_SCALE) * 100;

  return (
    <section className="card chart-card" aria-label="Kepatuhan per kelurahan">
      <CardTitle
        icon="pinCircle"
        right={<span className="compliance-target-label">Target 25%</span>}
      >
        Kepatuhan per kelurahan
      </CardTitle>

      <div className="compliance-container">
        <div className="compliance-bars-wrap">
          {/* Garis Putus-putus Target 25% menembus semua bar */}
          <div
            className="compliance-target-line"
            style={{ left: `calc(100px + (100% - 145px) * ${25 / MAX_SCALE})` }}
            title="Garis Target Kepatuhan 25%"
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
                    title={item.hasSurvei && item.kepatuhan != null ? `${item.nama}: ${item.kepatuhan}%` : `${item.nama}: Belum ada data survei`}
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
                    <span className="compliance-val" style={{ color: item.hasSurvei ? undefined : "#9ca3af" }}>
                      {item.hasSurvei && item.kepatuhan != null ? `${item.kepatuhan}%` : "Belum ada"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Sumbu X Ticks di bawah bar (0%, 10%, 20%, 30%) */}
          <div className="compliance-x-axis">
            <span className="compliance-x-label" style={{ left: "100px" }}>
              0%
            </span>
            <span
              className="compliance-x-label"
              style={{ left: `calc(100px + (100% - 145px) * ${10 / MAX_SCALE})` }}
            >
              10%
            </span>
            <span
              className="compliance-x-label"
              style={{ left: `calc(100px + (100% - 145px) * ${20 / MAX_SCALE})` }}
            >
              20%
            </span>
            <span
              className="compliance-x-label"
              style={{ left: `calc(100px + (100% - 145px) * ${30 / MAX_SCALE})` }}
            >
              30%
            </span>
          </div>
        </div>

        {/* Legenda Kategori Kepatuhan Sesuai Acuan QC */}
        <div className="compliance-legend">
          <div className="compliance-legend-item">
            <span className="compliance-legend-dot" style={{ background: "#00a86b" }} />
            <span>≥ 25% (mencapai target)</span>
          </div>
          <div className="compliance-legend-item">
            <span className="compliance-legend-dot" style={{ background: "#f59e0b" }} />
            <span>10 – 24% (perlu peningkatan)</span>
          </div>
          <div className="compliance-legend-item">
            <span className="compliance-legend-dot" style={{ background: "#ef4444" }} />
            <span>&lt; 10% (perlu perhatian)</span>
          </div>
          <div className="compliance-legend-item">
            <span className="compliance-legend-dot" style={{ background: "#9ca3af" }} />
            <span>Belum ada data survei</span>
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
