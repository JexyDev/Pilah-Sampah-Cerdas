import React, { useRef, useState } from "react";
import { Icon, useSize } from "./ui.jsx";
import { CH4_CLASSES, KELURAHAN, MONTHS, ch4Class, kepClass, niceScale } from "./data.js";

const nf1 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
export const fmtN = (n) => nf1.format(n);

export function CardTitle({ icon, children, right }) {
  return (
    <div className="card-title">
      <span className="card-title-ico"><Icon name={icon} size={18} /></span>
      <h3>{children}</h3>
      {right ? <span className="card-title-r">{right}</span> : null}
    </div>
  );
}

/* ---------- Komposisi volume ---------- */
export function Donut({ org, ano, res }) {
  const parts = [
    { k: "Organik", v: org, c: "#3aa64a" },
    { k: "Anorganik", v: ano, c: "#1f7aec" },
    { k: "Residu", v: res, c: "#7d8597" },
  ];
  const sum = org + ano + res || 1;
  const r = 44, C = 2 * Math.PI * r, gap = 2.2;
  let off = 0;
  return (
    <section className="card chart-card" aria-label="Komposisi volume">
      <CardTitle icon="pie">Komposisi volume</CardTitle>
      <div className="donut-wrap">
        <svg viewBox="0 0 120 120" className="donut" role="img"
          aria-label={parts.map((p) => `${p.k} ${Math.round((p.v / sum) * 100)} persen`).join(", ")}>
          <g transform="rotate(-90 60 60)">
            <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="19" />
            {parts.map((p) => {
              const len = (p.v / sum) * C;
              const dash = Math.max(len - gap, 0);
              const el = (
                <circle key={p.k} cx="60" cy="60" r={r} fill="none" stroke={p.c} strokeWidth="19"
                  strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-off} />
              );
              off += len;
              return el;
            })}
          </g>
          <text x="60" y="61" textAnchor="middle" className="donut-n">{fmtN(sum)}</text>
          <text x="60" y="75" textAnchor="middle" className="donut-u">m³/bulan</text>
        </svg>
        <ul className="donut-legend">
          {parts.map((p) => (
            <li key={p.k}>
              <i style={{ background: p.c }} />
              <span>{p.k}</span>
              <b>{Math.round((p.v / sum) * 100)}%</b>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Tren volume bulanan ---------- */
function smoothPath(pts) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export function Trend({ series, pi }) {
  const ref = useRef(null);
  const { w } = useSize(ref, { w: 420, h: 170 });
  const [hover, setHover] = useState(null);
  const H = 172, m = { l: 34, r: 12, t: 12, b: 24 };
  const { step, top } = niceScale(Math.max(...series));
  const x = (i) => m.l + ((w - m.l - m.r) * i) / (series.length - 1);
  const y = (v) => m.t + (H - m.t - m.b) * (1 - v / top);
  const pts = series.map((v, i) => [x(i), y(v)]);
  const line = smoothPath(pts);
  const base = y(0);
  const area = `${line} L${x(series.length - 1)},${base} L${x(0)},${base} Z`;
  const ticks = [0, 1, 2, 3].map((i) => i * step);
  const active = hover ?? pi;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - m.l) / (w - m.l - m.r)) * (series.length - 1));
    setHover(Math.max(0, Math.min(series.length - 1, i)));
  };
  const tipW = 92;
  const tipX = Math.max(m.l, Math.min(w - tipW - 4, x(active) - tipW / 2));

  return (
    <section className="card chart-card" aria-label="Tren volume bulanan">
      <CardTitle icon="bars" right="m³/bulan">Tren volume bulanan</CardTitle>
      <div ref={ref} className="trend">
        <svg width={w} height={H} onPointerMove={onMove} onPointerLeave={() => setHover(null)}
          role="img" aria-label={`Tren volume: ${series.map((v, i) => `${MONTHS[i]} ${Math.round(v)}`).join(", ")} meter kubik per bulan`}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#14b8a6" stopOpacity=".32" />
              <stop offset="1" stopColor="#14b8a6" stopOpacity=".03" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
              <text x={m.l - 8} y={y(t) + 4} textAnchor="end" className="ax">{t}</text>
            </g>
          ))}
          <path d={area} fill="url(#trendFill)" />
          <path d={line} fill="none" stroke="#0f9c94" strokeWidth="2.2" strokeLinecap="round" />
          {MONTHS.map((mo, i) => (
            <text key={mo} x={x(i)} y={H - 6} textAnchor="middle" className={`ax ${i === pi ? "ax-on" : ""}`}>{mo}</text>
          ))}
          {pts.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={i === active ? 5 : 3} fill="#0f9c94" stroke="var(--card)" strokeWidth="1.5" />
          ))}
          <line x1={x(active)} x2={x(active)} y1={m.t} y2={base} stroke="#0f9c94" strokeOpacity=".35" strokeDasharray="3 3" />
          <g transform={`translate(${tipX} ${Math.max(2, y(series[active]) - 34)})`} pointerEvents="none">
            <rect width={tipW} height="24" rx="7" fill="var(--ink)" />
            <text x={tipW / 2} y="16" textAnchor="middle" className="tip-t">{MONTHS[active]}: {fmtN(series[active])} m³</text>
          </g>
        </svg>
      </div>
    </section>
  );
}

/* ---------- Kepatuhan per kelurahan ---------- */
export function Compliance({ rows, selected, onSelect }) {
  return (
    <section className="card chart-card" aria-label="Kepatuhan per kelurahan">
      <CardTitle icon="clipboard">Kepatuhan per kelurahan</CardTitle>
      <ul className="bars">
        {rows.map(({ k, s }) => {
          const c = kepClass(s.kep);
          const dim = selected && selected !== k.id;
          return (
            <li key={k.id}>
              <button type="button" className={`bar-row ${selected === k.id ? "is-on" : ""} ${dim ? "is-dim" : ""}`}
                onClick={() => onSelect(k.id)} aria-pressed={selected === k.id}
                title={`${k.nama}: ${s.kep}% (${c.ket})`}>
                <span className="bar-name">{k.nama}</span>
                <span className="bar-track"><i style={{ width: `${s.kep}%`, background: c.warna }} /></span>
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
export function Methane({ sensors }) {
  const live = sensors.filter((s) => s.ppm !== null);
  const ppms = live.map((s) => s.ppm).sort((a, b) => a - b);
  const range = !ppms.length ? "—" : ppms[0] === ppms[ppms.length - 1] ? `${ppms[0]} ppm` : `${ppms[0]} – ${ppms[ppms.length - 1]} ppm`;
  const MAXP = 20;
  return (
    <section className="card chart-card" aria-label="Pemantauan metana">
      <CardTitle icon="activity">Pemantauan CH₄</CardTitle>
      <div className="ch4">
        <div className="ch4-range">{range}</div>
        <div className="ch4-count"><b>{live.length}</b> titik pengukuran</div>
        <div className="ch4-strip" aria-hidden="true">
          <span className="ch4-line" />
          {live.map((s) => {
            const c = ch4Class(s.ppm);
            const size = c === CH4_CLASSES[0] ? 9 : c === CH4_CLASSES[1] ? 11 : 14;
            return (
              <i key={s.id} title={`${s.id}: ${s.ppm} ppm`}
                style={{ left: `${(Math.min(s.ppm, MAXP) / MAXP) * 100}%`, width: size, height: size, background: c.area, borderColor: c.stroke }} />
            );
          })}
          <em className="ch4-min">0</em><em className="ch4-max">{MAXP}+ ppm</em>
        </div>
        <p className="note">Rentang konsentrasi terbaru<br />Kelas tampilan, bukan ambang keselamatan.</p>
      </div>
    </section>
  );
}
