import React, { useRef, useState } from "react";
import { Icon, useSize } from "./ui";
import {
  CH4_CLASSES,
  MONTHS,
  ch4Class,
  kepClass,
  niceScale,
  type KelurahanData,
  type SensorItem,
  type StatsKelResult,
} from "./data";

const nf1 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
export const fmtN = (n: number): string => nf1.format(n);

interface CardTitleProps {
  icon: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}

export function CardTitle({ icon, children, right }: CardTitleProps) {
  return (
    <div className="card-title">
      <span className="card-title-ico">
        <Icon name={icon} size={15} />
      </span>
      <h3>{children}</h3>
      {right ? <span className="card-title-r">{right}</span> : null}
    </div>
  );
}

/* ---------- Komposisi volume ---------- */
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
  const isAvailable = hasData !== undefined ? hasData : sum > 0;
  const displayTotal = totalM3 !== undefined && totalM3 > 0 ? totalM3 : sum;

  // Persentase per kategori
  const pOrg = orgPersen !== undefined ? orgPersen : (sum > 0 ? Math.round((org / sum) * 100) : 0);
  const pAno = anoPersen !== undefined ? anoPersen : (sum > 0 ? Math.round((ano / sum) * 100) : 0);
  const pRes = resPersen !== undefined ? resPersen : (sum > 0 ? Math.max(0, 100 - pOrg - pAno) : 0);

  const parts = [
    { k: "Organik", key: "org", v: org || 0, pct: pOrg, kg: orgKg, c: "#10b981", bgSoft: "rgba(16, 185, 129, 0.12)" },
    { k: "Anorganik", key: "ano", v: ano || 0, pct: pAno, kg: anoKg, c: "#f59e0b", bgSoft: "rgba(245, 158, 11, 0.12)" },
    { k: "Residu", key: "res", v: res || 0, pct: pRes, kg: resKg, c: "#64748b", bgSoft: "rgba(100, 116, 139, 0.12)" },
  ];

  const activePart = hoveredKey ? parts.find((p) => p.key === hoveredKey) : null;
  const centerValue = activePart ? fmtN(activePart.v) : fmtN(displayTotal);
  const centerLabel = activePart ? `${activePart.k} (${activePart.pct}%)` : "m³/bulan";

  const r = 44;
  const C = 2 * Math.PI * r;
  const gap = 2.2;
  let off = 0;

  // State: Belum Ada Data
  if (!isAvailable || displayTotal === 0) {
    return (
      <section className="card chart-card" aria-label="Komposisi volume">
        <CardTitle icon="pie" right={wilayahLabel}>Komposisi volume</CardTitle>
        <div className="donut-wrap is-empty">
          <svg viewBox="0 0 120 120" className="donut" role="img" aria-label="Data survei belum tersedia">
            <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="16" strokeDasharray="5 4" />
            <text x="60" y="58" textAnchor="middle" className="donut-n" style={{ fill: "var(--muted)", fontSize: 18 }}>
              —
            </text>
            <text x="60" y="73" textAnchor="middle" className="donut-u">
              m³/bulan
            </text>
          </svg>
          <div className="donut-empty-box">
            <div className="donut-empty-badge">Data Survei Belum Tersedia</div>
            <p className="donut-empty-text">
              Belum ada data timbulan & komposisi sampah yang tercatat untuk wilayah ini.
            </p>
            <div className="donut-empty-list">
              {parts.map((p) => (
                <div key={p.k} className="donut-empty-row">
                  <i style={{ background: p.c }} />
                  <span>{p.k}:</span>
                  <b>—</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // State: Data Tersedia
  const calcSum = sum > 0 ? sum : 1;
  return (
    <section className="card chart-card" aria-label="Komposisi volume">
      <CardTitle icon="pie" right={wilayahLabel}>Komposisi volume</CardTitle>
      <div className="donut-wrap">
        <svg
          viewBox="0 0 120 120"
          className="donut"
          role="img"
          aria-label={parts
            .map((p) => `${p.k} ${p.pct} persen (${fmtN(p.v)} meter kubik)`)
            .join(", ")}
          onPointerLeave={() => setHoveredKey(null)}
        >
          <g transform="rotate(-90 60 60)">
            <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="18" />
            {parts.map((p) => {
              const len = (p.v / calcSum) * C;
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
                  strokeWidth={isHovered ? 21 : 18}
                  strokeDasharray={`${dash} ${C - dash}`}
                  strokeDashoffset={-off}
                  style={{
                    opacity: isDimmed ? 0.35 : 1,
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
            y={activePart ? "57" : "60"}
            textAnchor="middle"
            className="donut-n"
            style={{
              fill: activePart ? activePart.c : "var(--ink)",
              fontSize: activePart ? 18 : 20,
              fontWeight: 800,
            }}
          >
            {centerValue}
          </text>
          <text
            x="60"
            y={activePart ? "73" : "75"}
            textAnchor="middle"
            className="donut-u"
            style={{
              fill: activePart ? activePart.c : "var(--ink-2)",
              fontSize: activePart ? 8 : 8.5,
              fontWeight: activePart ? 700 : 600,
            }}
          >
            {centerLabel}
          </text>
        </svg>

        <ul className="donut-legend">
          {parts.map((p) => {
            const isHovered = hoveredKey === p.key;
            const isDimmed = hoveredKey !== null && !isHovered;
            return (
              <li
                key={p.k}
                className={`donut-item ${isHovered ? "is-hovered" : ""} ${isDimmed ? "is-dimmed" : ""}`}
                onMouseEnter={() => setHoveredKey(p.key)}
                onMouseLeave={() => setHoveredKey(null)}
                style={{
                  background: isHovered ? p.bgSoft : "transparent",
                  borderColor: isHovered ? p.c : "transparent",
                }}
              >
                <div className="donut-item-head">
                  <div className="donut-item-label">
                    <i className="donut-item-dot" style={{ background: p.c }} />
                    <span className="donut-item-name">{p.k}</span>
                  </div>
                  <b className="donut-item-pct" style={{ color: p.c }}>{p.pct}%</b>
                </div>

                <div className="donut-item-metrics">
                  <span className="donut-item-vol">
                    {fmtN(p.v)} <span className="donut-item-unit">m³/bln</span>
                  </span>
                  {p.kg != null && p.kg > 0 ? (
                    <span className="donut-item-kg">{fmtN(p.kg)} kg/hr</span>
                  ) : null}
                </div>

                <div className="donut-item-track" aria-hidden="true">
                  <i style={{ width: `${Math.min(p.pct, 100)}%`, background: p.c }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Tren volume bulanan ---------- */
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

export function Trend({ series, pi }: TrendProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { w } = useSize(ref, { w: 380, h: 140 });
  const [hover, setHover] = useState<number | null>(null);
  const H = 148;
  const m = { l: 38, r: 12, t: 20, b: 20 };

  // Pastikan dataset memiliki 12 titik (Jan–Des) agar kurva dan axis selalu stabil
  const safeSeries = (!series || series.length === 0)
    ? new Array(MONTHS.length).fill(0)
    : (series.length < MONTHS.length
        ? [...series, ...new Array(MONTHS.length - series.length).fill(0)]
        : series);

  const { step, top } = niceScale(Math.max(...safeSeries, 1));
  const denom = Math.max(1, safeSeries.length - 1);
  const x = (i: number) => m.l + ((w - m.l - m.r) * i) / denom;
  const y = (v: number) => m.t + (H - m.t - m.b) * (1 - (v ?? 0) / top);
  const pts: [number, number][] = safeSeries.map((v, i) => [x(i), y(v)]);
  const line = smoothPath(pts);
  const base = y(0);
  const area = pts.length > 0 ? `${line} L${x(safeSeries.length - 1)},${base} L${x(0)},${base} Z` : "";
  const ticks = [0, 1, 2, 3].map((i) => i * step);

  const safePi = Math.max(0, Math.min(safeSeries.length - 1, pi < 0 ? safeSeries.length - 1 : pi));
  const active = hover ?? safePi;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - m.l) / (w - m.l - m.r)) * (safeSeries.length - 1));
    setHover(Math.max(0, Math.min(safeSeries.length - 1, i)));
  };
  const tipW = 84;
  const activeX = x(active);
  const tipX = Math.max(m.l, Math.min(w - tipW - 4, activeX - tipW / 2));

  return (
    <section className="card chart-card" aria-label="Tren volume bulanan">
      <CardTitle icon="bars" right="Kec. Coblong">
        Tren volume bulanan
      </CardTitle>
      <div ref={ref} className="trend">
        <svg
          width={w}
          height={H}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label={`Tren volume: ${series
            .map((v, i) => `${MONTHS[i]} ${Math.round(v)}`)
            .join(", ")} meter kubik per bulan`}
        >
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#14b8a6" stopOpacity=".32" />
              <stop offset="1" stopColor="#14b8a6" stopOpacity=".03" />
            </linearGradient>
          </defs>

          {/* Indikator Satuan Sumbu Y di sisi atas */}
          <text
            x={m.l}
            y={m.t - 8}
            textAnchor="start"
            style={{ fontSize: 10, fontWeight: 600, fill: "var(--ink-2)" }}
          >
            Volume (m³/bulan)
          </text>

          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
              <text x={m.l - 8} y={y(t) + 4} textAnchor="end" className="ax">
                {t}
              </text>
            </g>
          ))}
          <path d={area} fill="url(#trendFill)" />
          <path d={line} fill="none" stroke="#0f9c94" strokeWidth="2.2" strokeLinecap="round" />
          {MONTHS.map((mo, i) => (
            <text
              key={mo}
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              className={`ax ${i === pi ? "ax-on" : ""}`}
            >
              {mo}
            </text>
          ))}
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={p[0]}
              cy={p[1]}
              r={i === active ? 5 : 3}
              fill="#0f9c94"
              stroke="var(--card)"
              strokeWidth="1.5"
            />
          ))}
          <line
            x1={x(active)}
            x2={x(active)}
            y1={m.t}
            y2={base}
            stroke="#0f9c94"
            strokeOpacity=".35"
            strokeDasharray="3 3"
          />
          <g
            transform={`translate(${tipX} ${Math.max(2, y(safeSeries[active] ?? 0) - 34)})`}
            pointerEvents="none"
          >
            <rect width={tipW} height="24" rx="7" fill="var(--ink)" />
            <text x={tipW / 2} y="16" textAnchor="middle" className="tip-t">
              {MONTHS[active] ?? "Sep"}: {fmtN(safeSeries[active] ?? 0)} m³
            </text>
          </g>
        </svg>
      </div>
    </section>
  );
}

/* ---------- Kepatuhan per kelurahan ---------- */
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
  return (
    <section className="card chart-card" aria-label="Kepatuhan per kelurahan">
      <CardTitle icon="clipboard">Kepatuhan per kelurahan</CardTitle>
      <ul className="bars">
        {rows.map(({ k, s }) => {
          const c = kepClass(s.kep);
          const dim = selected && selected !== k.id;
          return (
            <li key={k.id}>
              <button
                type="button"
                className={`bar-row ${selected === k.id ? "is-on" : ""} ${dim ? "is-dim" : ""}`}
                onClick={() => onSelect(k.id)}
                aria-pressed={selected === k.id}
                title={`${k.nama}: ${s.kep}% (${c.ket})`}
              >
                <span className="bar-name">{k.nama}</span>
                <span className="bar-track">
                  <i style={{ width: `${s.kep}%`, background: c.warna }} />
                </span>
                <b className="bar-val">{s.kep}%</b>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------- Pemantauan CH₄ ---------- */
interface MethaneProps {
  sensors: SensorItem[];
}

export function Methane({ sensors }: MethaneProps) {
  const live = sensors.filter((s) => s.ppm !== null) as Array<SensorItem & { ppm: number }>;
  const ppms = live.map((s) => s.ppm).sort((a, b) => a - b);
  const range = !ppms.length
    ? "—"
    : ppms[0] === ppms[ppms.length - 1]
    ? `${ppms[0]} ppm`
    : `${ppms[0]} – ${ppms[ppms.length - 1]} ppm`;
  const MAXP = 20;

  if (!live.length) {
    return (
      <section className="card chart-card" aria-label="Pemantauan metana">
        <CardTitle icon="activity" right="Smart City IoT">
          Pemantauan Gas CH₄
        </CardTitle>
        <div style={{ padding: "8px 4px 4px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>Tahap Integrasi Jaringan IoT</span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "var(--muted)", lineHeight: 1.4 }}>
            Infrastruktur telemetri sensor gas Metana (CH₄) dipersiapkan untuk pemantauan real-time emisi di titik TPS & fasilitas pengolahan sampah.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, fontSize: 10.5, color: "var(--ink-2)", background: "var(--bg)", padding: "5px 10px", borderRadius: 6, border: "1px solid var(--line)" }}>
            <div>Cakupan: <b>Coblong</b></div>
            <div>•</div>
            <div>Satuan: <b>ppm</b></div>
            <div>•</div>
            <div>Status: <span style={{ color: "#10b981", fontWeight: 700 }}>Hardware Ready</span></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="card chart-card" aria-label="Pemantauan metana">
      <CardTitle icon="activity">Pemantauan CH₄</CardTitle>
      <div className="ch4">
        <div className="ch4-range">{range}</div>
        <div className="ch4-count">
          <b>{live.length}</b> titik pengukuran
        </div>
        <div className="ch4-strip" aria-hidden="true">
          <span className="ch4-line" />
          {live.map((s) => {
            const c = ch4Class(s.ppm);
            const size = c === CH4_CLASSES[0] ? 9 : c === CH4_CLASSES[1] ? 11 : 14;
            return (
              <i
                key={s.id}
                title={`${s.id}: ${s.ppm} ppm`}
                style={{
                  left: `${(Math.min(s.ppm, MAXP) / MAXP) * 100}%`,
                  width: size,
                  height: size,
                  background: c.area,
                  borderColor: c.stroke,
                }}
              />
            );
          })}
          <em className="ch4-min">0</em>
          <em className="ch4-max">{MAXP}+ ppm</em>
        </div>
        <p className="note">
          Rentang konsentrasi terbaru (ppm)
          <br />
          Kelas tampilan, bukan ambang keselamatan.
        </p>
      </div>
    </section>
  );
}
