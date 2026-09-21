import React, { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";
import { Icon, TIPE_ICON } from "./ui.jsx";
import { Donut, Trend, Compliance, Methane, fmtN } from "./charts.jsx";
import MapView, { LAYERS } from "./MapView.jsx";
import {
  CH4_CLASSES, CURRENT, FASILITAS, KEL_BY_ID, KELURAHAN, KEP_CLASSES, MONTHLY_TOTAL, MONTH_LONG,
  SENSORS, TIPE, TIPE_BY_ID, YEAR, pad2, statsAll, statsKel,
} from "./data.js";

/* ---------- Pembantu ---------- */
const csvCell = (v) => {
  const s = String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows) => "\uFEFF" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
const dec = (n) => String(Math.round(n * 10) / 10).replace(".", ",");

async function saveFile(filename, data) {
  try {
    const d = window.claude && window.claude.use ? await window.claude.use("downloads") : null;
    if (d) {
      await d.save({ filename, data });
      return "Berkas siap disimpan.";
    }
  } catch (err) {
    if (err && err.code === "declined") return "Unduhan dibatalkan.";
  }
  try {
    const url = URL.createObjectURL(new Blob([data], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return "Berkas diunduh.";
  } catch (_) {
    return "Unduhan tidak tersedia di tampilan ini.";
  }
}

/* ---------- Filter atas ---------- */
function Pill({ label, icon, children, disabled }) {
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

function ExportMenu({ onExport }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className="export" ref={box}>
      <button type="button" className="btn-primary" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Icon name="download" size={19} /> Ekspor <Icon name="chevron" size={15} />
      </button>
      {open ? (
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
      ) : null}
    </div>
  );
}

/* ---------- Aplikasi ---------- */
export default function App() {
  const [kel, setKel] = useState("all");
  const [rw, setRw] = useState("all");
  const [pi, setPi] = useState(CURRENT);
  const [layer, setLayer] = useState("kep");
  const [showSensor, setShowSensor] = useState(true);
  const [facType, setFacType] = useState("all");
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [opacity, setOpacity] = useState(45);
  const [base, setBase] = useState("peta");
  const [active, setActive] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 900 ? null : { kind: "sensor", id: "CH₄-03" });
  const [toast, setToast] = useState("");

  const kelId = kel === "all" ? null : kel;
  const rwN = rw === "all" ? null : Number(rw);

  const stats = useMemo(() => statsAll(kelId, rwN, pi), [kelId, rwN, pi]);
  const prev = useMemo(() => (pi > 0 ? statsAll(kelId, rwN, pi - 1) : null), [kelId, rwN, pi]);
  const volDelta = prev ? (stats.total / prev.total - 1) * 100 : null;
  const kepDelta = prev ? stats.kep - prev.kep : null;

  const kelRows = useMemo(
    () => KELURAHAN.map((k) => ({ k, s: statsKel(k, kelId === k.id ? rwN : null, pi) })),
    [kelId, rwN, pi],
  );

  const series = useMemo(
    () => MONTHLY_TOTAL.map((v) => (v / MONTHLY_TOTAL[CURRENT]) * stats.baseTotal),
    [stats.baseTotal],
  );

  // Fasilitas yang tampil di peta
  const scoped = useMemo(
    () => FASILITAS.filter((f) => (!kelId || f.kel === kelId) && (!rwN || f.rw === rwN)),
    [kelId, rwN],
  );
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped.filter((f) => {
      if (facType !== "all" && f.tipe !== facType) return false;
      if (!q) return true;
      const hay = `${f.nama} ${KEL_BY_ID[f.kel].nama} rw ${f.rw} rw ${pad2(f.rw)} ${TIPE_BY_ID[f.tipe].fungsi}`.toLowerCase();
      return q.split(/\s+/).every((tok) => hay.includes(tok));
    });
  }, [scoped, facType, query]);
  const filtered = facType !== "all" || query.trim() !== "";

  const sensorScope = SENSORS; // seluruh titik selalu terlihat di peta
  const online = stats.sensors.filter((z) => z.ppm !== null).length;

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const changeKel = (v) => { setKel(v); setRw("all"); };
  const toggleKel = (id) => changeKel(kel === id ? "all" : id);
  const submitSearch = () => setQuery(input);
  const clearFilters = () => { setFacType("all"); setInput(""); setQuery(""); };

  const doExport = async (what) => {
    let rows, name;
    if (what === "kel") {
      rows = [["Kelurahan", "Periode", "Fasilitas", "Organik (m³)", "Anorganik (m³)", "Residu (m³)", "Total (m³)", "Kepatuhan (%)", "Sensor CH₄ online", "CH₄ tertinggi (ppm)"]];
      KELURAHAN.forEach((k) => {
        const s = statsKel(k, null, pi);
        const live = s.sensors.filter((z) => z.ppm !== null);
        rows.push([k.nama, `${MONTH_LONG[pi]} ${YEAR}`, s.fac, dec(s.org), dec(s.ano), dec(s.res), dec(s.total), s.kep,
          `${live.length}/${s.sensors.length}`, live.length ? Math.max(...live.map((z) => z.ppm)) : ""]);
      });
      name = `ringkasan-kelurahan-${MONTH_LONG[pi].toLowerCase()}-${YEAR}.csv`;
    } else {
      rows = [["ID", "Nama fasilitas", "Jenis", "Fungsi", "Kelurahan", "RW"]];
      visible.forEach((f) => rows.push([f.id, f.nama, TIPE_BY_ID[f.tipe].nama, TIPE_BY_ID[f.tipe].fungsi, KEL_BY_ID[f.kel].nama, pad2(f.rw)]));
      name = "daftar-fasilitas.csv";
    }
    setToast(await saveFile(name, toCsv(rows)));
  };

  const scopeText = !kelId ? "dari seluruh kelurahan" : `di Kel. ${KEL_BY_ID[kelId].nama}${rwN ? ` RW ${pad2(rwN)}` : ""}`;
  const totalRounded = stats.total >= 100 ? Math.round(stats.total) : Math.round(stats.total * 10) / 10;
  const noPrev = "Belum ada periode pembanding";

  return (
    <div className="app">
      {/* Header */}
      <header className="head">
        <div className="head-l">
          <h1>GIS Eksekutif Tata Kelola Sampah</h1>
          <p className="sub">Kecamatan Coblong • Fasilitas, pemilahan, volume, dan pemantauan CH₄</p>
        </div>
        <div className="head-r">
          <span className="tag">MOCKUP • DATA ILUSTRATIF</span>
          <div className="filters">
            <Pill label="Kelurahan">
              <select value={kel} onChange={(e) => changeKel(e.target.value)} aria-label="Kelurahan">
                <option value="all">Semua</option>
                {KELURAHAN.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </Pill>
            <Pill label="RW" disabled={!kelId}>
              <select value={rw} onChange={(e) => setRw(e.target.value)} disabled={!kelId} aria-label="RW"
                title={kelId ? "" : "Pilih kelurahan terlebih dahulu"}>
                <option value="all">Semua</option>
                {kelId ? Array.from({ length: KEL_BY_ID[kelId].rw }, (_, i) => <option key={i + 1} value={i + 1}>{pad2(i + 1)}</option>) : null}
              </select>
            </Pill>
            <Pill label="Periode" icon="calendar">
              <select value={pi} onChange={(e) => setPi(Number(e.target.value))} aria-label="Periode">
                {MONTH_LONG.map((m, i) => <option key={m} value={i}>{m} {YEAR}</option>).reverse()}
              </select>
            </Pill>
            <ExportMenu onExport={doExport} />
          </div>
        </div>
      </header>

      {/* KPI */}
      <section className="kpis" aria-label="Indikator utama">
        <div className="card kpi">
          <span className="kpi-ico k-teal"><Icon name="building" size={30} /></span>
          <div>
            <div className="kpi-l">Fasilitas terdata</div>
            <div className="kpi-v">{stats.fac}</div>
            <div className="kpi-s">{scopeText}</div>
          </div>
        </div>
        <div className="card kpi">
          <span className="kpi-ico k-teal"><Icon name="bars" size={30} stroke={3} /></span>
          <div>
            <div className="kpi-l">Volume</div>
            <div className="kpi-v">{fmtN(totalRounded)} <small>m³/bulan</small></div>
            <div className={`kpi-s ${volDelta === null ? "" : volDelta >= 0 ? "up" : "down"}`}>
              {volDelta === null ? noPrev : (<>{volDelta >= 0 ? "▲" : "▼"} {volDelta >= 0 ? "+" : "−"}{Math.abs(Math.round(volDelta))}% <span className="mut">dari periode sebelumnya</span></>)}
            </div>
          </div>
        </div>
        <div className="card kpi">
          <span className="kpi-ico k-amber"><Icon name="pie" size={30} /></span>
          <div>
            <div className="kpi-l">Kepatuhan pemilahan</div>
            <div className="kpi-v">{stats.kep}%</div>
            <div className={`kpi-s ${kepDelta === null ? "" : kepDelta >= 0 ? "up" : "down"}`}>
              {kepDelta === null ? noPrev : (<>{kepDelta >= 0 ? "▲" : "▼"} {kepDelta >= 0 ? "+" : "−"}{Math.abs(kepDelta)} poin <span className="mut">dari periode sebelumnya</span></>)}
            </div>
          </div>
        </div>
        <div className="card kpi">
          <span className="kpi-ico k-teal"><Icon name="signal" size={30} /></span>
          <div>
            <div className="kpi-l">Sensor CH₄ online</div>
            <div className="kpi-v">{online}/{stats.sensors.length}</div>
            <div className="kpi-s">titik terhubung</div>
          </div>
          <span className={`kpi-dot ${online > 0 ? "" : "off"}`} aria-hidden="true" />
        </div>
      </section>

      {/* Grafik */}
      <section className="charts" aria-label="Ringkasan grafik">
        <Donut org={stats.org} ano={stats.ano} res={stats.res} />
        <Trend series={series} pi={pi} />
        <Compliance rows={kelRows} selected={kelId} onSelect={toggleKel} />
        <Methane sensors={stats.sensors} />
      </section>

      {/* Bilah alat peta */}
      <section className="card toolbar" aria-label="Kontrol peta">
        <div className="search">
          <Icon name="search" size={19} className="search-i" />
          <input type="search" value={input} placeholder="Cari alamat, kelurahan, RW, atau fasilitas…"
            onChange={(e) => { setInput(e.target.value); if (!e.target.value) setQuery(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") submitSearch(); }} aria-label="Cari" />
        </div>
        <button type="button" className="btn-primary btn-sm" onClick={submitSearch}>Cari</button>
        <label className="fac-sel">
          <span>Fasilitas:</span>
          <span className="pill-s">
            <select value={facType} onChange={(e) => setFacType(e.target.value)} aria-label="Jenis fasilitas">
              <option value="all">Semua</option>
              {TIPE.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
            </select>
            <Icon name="chevron" size={15} className="pill-c" />
          </span>
        </label>
        <div className="tabs" role="group" aria-label="Lapisan overlay">
          {LAYERS.map((l) => (
            <button key={l.id} type="button" className={layer === l.id ? "on" : ""} aria-pressed={layer === l.id} onClick={() => setLayer(l.id)}>{l.label}</button>
          ))}
        </div>
        <div className="sw">
          <span>Titik sensor CH₄:</span>
          <button type="button" role="switch" aria-checked={showSensor} className={`switch ${showSensor ? "on" : ""}`} onClick={() => setShowSensor((v) => !v)}>
            <i />
          </button>
          <b>{showSensor ? "Aktif" : "Nonaktif"}</b>
        </div>
        <span className="hint">Satu overlay aktif • Sensor berupa titik terukur</span>
      </section>

      {/* Peta + legenda */}
      <section className="main">
        <MapView
          kelRows={kelRows} layer={layer} opacity={opacity} setOpacity={setOpacity} base={base} setBase={setBase}
          showSensor={showSensor} facilities={visible} allCount={scoped.length} sensors={sensorScope}
          selectedKel={kelId} onSelectKel={toggleKel} active={active} setActive={setActive}
          onClearFilters={clearFilters} filtered={filtered}
        />
        <aside className="card side" aria-label="Legenda">
          <div className="side-sec">
          <h4 className="side-h">Fasilitas dan fungsi</h4>
          <ul className="fac-list">
            {TIPE.map((t) => (
              <li key={t.id}>
                <button type="button" className={facType === t.id ? "on" : ""} aria-pressed={facType === t.id}
                  onClick={() => setFacType(facType === t.id ? "all" : t.id)} title="Klik untuk menyaring jenis ini">
                  <span className="fac-ico" style={{ background: t.warna }}><Icon name={TIPE_ICON[t.id]} size={17} stroke={2.2} /></span>
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
          <p className="side-note">Lokasi, batas, angka, dan grafik bersifat ilustratif; bukan laporan aktual.</p>
        </aside>
      </section>

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
