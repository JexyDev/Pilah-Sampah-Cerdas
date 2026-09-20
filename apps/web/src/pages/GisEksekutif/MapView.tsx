import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Icon, TIPE_ICON, iconMarkup } from "./ui";
import {
  BASE_LINES,
  KEL_BY_ID,
  KELURAHAN,
  KEP_CLASSES,
  PLACES,
  TIPE_BY_ID,
  ch4Class,
  clamp,
  kepClass,
  pad2,
  type FacilityItem,
  type SensorItem,
} from "./data";
import { fmtN, type ComplianceRow } from "./charts";

export interface LayerItem {
  id: "kep" | "org" | "ano" | "res" | "total" | "ch4";
  label: string;
}

export const LAYERS: LayerItem[] = [
  { id: "kep", label: "Kepatuhan" },
  { id: "org", label: "Organik" },
  { id: "ano", label: "Anorganik" },
  { id: "res", label: "Residu" },
  { id: "total", label: "Volume total" },
  { id: "ch4", label: "Metana CH₄" },
];

const RAMP: Record<"org" | "ano" | "res" | "total", [string, string]> = {
  org: ["#c4ebc9", "#1f8f3d"],
  ano: ["#c3dcff", "#1a68dc"],
  res: ["#d8dce3", "#535e6c"],
  total: ["#e0d3fc", "#7434e8"],
};

export const TILES = {
  peta: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  },
  sat: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: 'Citra &copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a>',
  },
};

const ALL_BOUNDS = L.latLngBounds(
  KELURAHAN.flatMap((k) => k.ring.map(([lat, lng]) => L.latLng(lat, lng)))
);
const KEL_BOUNDS = Object.fromEntries(
  KELURAHAN.map((k) => [
    k.id,
    L.latLngBounds(k.ring.map(([lat, lng]) => L.latLng(lat, lng))),
  ])
);
const COMPACT_ZOOM = 14.35; // zoom awal di layar sempit

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const [A, B] = [hex(a), hex(b)];
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
};

const esc = (s: string | number) =>
  String(s).replace(
    /[&<>"]/g,
    (c) =>
      (({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
      })[c] || c)
  );

function pinSize(map: L.Map) {
  const mpp =
    (156543.03392 * Math.cos((map.getCenter().lat * Math.PI) / 180)) / 2 ** map.getZoom();
  return clamp(Math.round((34 * (1000 / mpp)) / 205), 18, 27);
}

export type ActiveTarget =
  | { kind: "sensor"; id: string }
  | { kind: "fac"; id: string }
  | null;

interface ActiveSensorObj {
  kind: "sensor";
  z: SensorItem;
}

interface ActiveFacObj {
  kind: "fac";
  f: FacilityItem;
}

type ActiveObject = ActiveSensorObj | ActiveFacObj;

function popupHtml(o: ActiveObject) {
  if (o.kind === "sensor") {
    const z = o.z;
    const status =
      z.ppm === null
        ? '<span class="dot dot--off"></span> Offline • tidak ada pembacaan'
        : `CH₄ <b>${z.ppm} ppm</b> <span class="dot"></span> Online`;
    return `<b class="popup-t">${esc(z.id)} • ${esc(z.lokasi)} RW ${pad2(z.rw)}</b>
      <div class="popup-r">${status}</div>
      <div class="popup-m">${
        z.ppm === null
          ? "Terakhir terhubung: 16 Sep 2026, 09.10"
          : "Terakhir: 18 Sep 2026, 16.30"
      }</div>
      <div class="popup-m">Kel. ${esc(KEL_BY_ID[z.kel]?.nama || z.kel)}</div>
      <div class="popup-m">Jenis: konsentrasi gas, bukan laju emisi.</div>`;
  }
  const f = o.f;
  return `<b class="popup-t">${esc(f.nama)}</b>
    <div class="popup-r">${esc(TIPE_BY_ID[f.tipe]?.fungsi || f.tipe)}</div>
    <div class="popup-m">Kel. ${esc(KEL_BY_ID[f.kel]?.nama || f.kel)} • RW ${pad2(f.rw)}</div>
    <div class="popup-m">ID fasilitas: ${esc(f.id)}</div>`;
}

interface MapViewProps {
  kelRows: ComplianceRow[];
  layer: "kep" | "org" | "ano" | "res" | "total" | "ch4";
  opacity: number;
  setOpacity: (v: number) => void;
  base: "peta" | "sat";
  setBase: (v: "peta" | "sat") => void;
  showSensor: boolean;
  facilities: FacilityItem[];
  allCount: number;
  sensors: SensorItem[];
  selectedKel: string | null;
  onSelectKel: (id: string) => void;
  active: ActiveTarget;
  setActive: (v: ActiveTarget) => void;
  onClearFilters: () => void;
  filtered: boolean;
}

export default function MapView({
  kelRows,
  layer,
  opacity,
  setOpacity,
  base,
  setBase,
  showSensor,
  facilities,
  allCount,
  sensors,
  selectedKel,
  onSelectKel,
  active,
  setActive,
  onClearFilters,
  filtered,
}: MapViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const groups = useRef<Record<string, L.LayerGroup>>({});
  const popRef = useRef<L.Popup | null>(null);
  const closing = useRef(false);
  const firstOpen = useRef(true);
  const cb = useRef<{
    onSelectKel: (id: string) => void;
    setActive: (v: ActiveTarget) => void;
    selectedKel: string | null;
  }>({ onSelectKel, setActive, selectedKel });
  cb.current = { onSelectKel, setActive, selectedKel };

  const [zoom, setZoom] = useState(0);
  const [minZ, setMinZ] = useState(0);
  const [maxZ, setMaxZ] = useState(19);
  const [full, setFull] = useState(false);
  const [tiles, setTiles] = useState<"unknown" | "ok" | "fail">("unknown");
  const sat = base === "sat";

  /* ---------- Inisialisasi peta (sekali) ---------- */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const map = L.map(host, {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 90,
      maxZoom: 19,
      scrollWheelZoom: false,
    });
    mapRef.current = map;
    (host as any)._map = map;

    ["vec:150", "place:640", "klabel:650"].forEach((s) => {
      const [n, z] = s.split(":");
      const pane = map.createPane(n);
      pane.style.zIndex = z;
    });
    const placePane = map.getPane("place");
    if (placePane) placePane.style.pointerEvents = "none";
    const klabelPane = map.getPane("klabel");
    if (klabelPane) klabelPane.style.pointerEvents = "none";

    ["vec", "poly", "klabel", "fac", "sens", "place"].forEach((k) => {
      groups.current[k] = L.layerGroup().addTo(map);
    });

    L.control
      .attribution({
        prefix: '<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>',
      })
      .addTo(map);
    L.control.scale({ position: "bottomright", imperial: false, maxWidth: 110 }).addTo(map);

    map.setView(ALL_BOUNDS.getCenter(), 18, { animate: false });
    const applyBounds = () => {
      map.invalidateSize({ pan: false });
      const fitZ = map.getBoundsZoom(ALL_BOUNDS.pad(0.08));
      map.setMinZoom(fitZ);
      setMinZ(fitZ);
      setMaxZ(map.getMaxZoom());
      host.style.setProperty("--pin", `${pinSize(map)}px`);
      return fitZ;
    };
    const fitZ = applyBounds();
    const compact = host.clientWidth < 700;
    map.setView(
      ALL_BOUNDS.getCenter(),
      compact ? Math.max(fitZ, COMPACT_ZOOM) : fitZ,
      { animate: false }
    );
    map.setMaxBounds(ALL_BOUNDS.pad(0.6));
    setZoom(map.getZoom());

    map.on("zoomend", () => {
      setZoom(map.getZoom());
      host.style.setProperty("--pin", `${pinSize(map)}px`);
    });
    map.on("popupclose", (e) => {
      if (e.popup === popRef.current && !closing.current) cb.current.setActive(null);
    });
    map.on("click", () => map.scrollWheelZoom.enable());
    map.on("mouseout blur", () => map.scrollWheelZoom.disable());
    host.setAttribute("role", "application");
    host.setAttribute("aria-label", "Peta Kecamatan Coblong");

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => applyBounds())
        : null;
    if (ro) ro.observe(host);

    return () => {
      if (ro) ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* ---------- Peta dasar: tile daring + cadangan vektor ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    const cfg = TILES[base];
    let loaded = 0;
    let errors = 0;
    setTiles("unknown");

    const layerT = L.tileLayer(cfg.url, {
      attribution: cfg.attr,
      maxZoom: 19,
      maxNativeZoom: 19,
    });
    layerT.on("tileload", () => {
      loaded++;
      setTiles("ok");
    });
    layerT.on("tileerror", () => {
      errors++;
      if (!loaded && errors >= 3) setTiles("fail");
    });
    layerT.addTo(map);

    const timer = setTimeout(() => {
      if (!loaded) setTiles("fail");
    }, 6000);

    return () => {
      clearTimeout(timer);
      map.removeLayer(layerT);
    };
  }, [base]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hostRef.current) return;
    const gv = groups.current.vec;
    if (!gv) return;
    gv.clearLayers();
    hostRef.current.classList.toggle("is-sat", sat);
    const o: L.PolylineOptions = {
      pane: "vec",
      interactive: false,
      lineCap: "round",
      lineJoin: "round",
    };
    gv.addLayer(
      L.polyline(BASE_LINES.river as [number, number][], {
        ...o,
        color: sat ? "#1e3a4a" : "#cfe4f1",
        weight: 16,
      })
    );
    BASE_LINES.minor.forEach((l) =>
      gv.addLayer(
        L.polyline(l as [number, number][], {
          ...o,
          color: sat ? "rgba(255,255,255,.12)" : "#ffffff",
          weight: 3,
        })
      )
    );
    BASE_LINES.major.forEach((l) =>
      gv.addLayer(
        L.polyline(l as [number, number][], {
          ...o,
          color: sat ? "rgba(255,240,200,.28)" : "#f5e28f",
          weight: 6,
        })
      )
    );
  }, [sat]);

  useEffect(() => {
    const gp = groups.current.place;
    if (!gp) return;
    gp.clearLayers();
    if (tiles === "ok") return;

    PLACES.forEach((p) =>
      gp.addLayer(
        L.marker(p.ll, {
          pane: "place",
          interactive: false,
          keyboard: false,
          icon: L.divIcon({
            className: "pl-wrap",
            iconSize: [0, 0],
            html: `<div class="pl ${p.nama.startsWith("←") ? "pl--b" : ""}">${esc(
              p.nama
            )}</div>`,
          }),
        })
      )
    );
  }, [tiles, sat]);

  /* ---------- Warna & label lapisan ---------- */
  const maxVal = useMemo(() => {
    const m: Record<string, number> = {};
    (["org", "ano", "res", "total"] as const).forEach((k) => {
      m[k] = Math.max(...kelRows.map((r) => r.s[k]), 0.0001);
    });
    return m;
  }, [kelRows]);

  const styleFor = (row: ComplianceRow) => {
    const { k, s: st } = row;
    if (layer === "kep") return { fill: kepClass(st.kep).warna, text: `${st.kep}%` };
    if (layer === "ch4") {
      const live = sensors.filter((z) => z.kel === k.id && z.ppm !== null);
      if (!live.length) return { fill: "#cbd5e1", text: "—" };
      const mx = Math.max(...live.map((z) => z.ppm as number));
      return { fill: ch4Class(mx).area, text: `${mx} ppm` };
    }
    const t = st[layer] / maxVal[layer];
    return {
      fill: mix(RAMP[layer][0], RAMP[layer][1], 0.15 + 0.85 * t),
      text: `${fmtN(st[layer])} m³`,
    };
  };

  /* ---------- Poligon kelurahan + label ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const gp = groups.current.poly;
    const gl = groups.current.klabel;
    if (!gp || !gl) return;
    gp.clearLayers();
    gl.clearLayers();

    kelRows.forEach((row) => {
      const { k } = row;
      const st = styleFor(row);
      const dim = selectedKel && selectedKel !== k.id;
      const on = selectedKel === k.id;
      const baseStyle: L.PathOptions = {
        color: "#17324f",
        weight: on ? 2.6 : 1.5,
        dashArray: on ? undefined : "6 4",
        lineJoin: "round",
        fillColor: st.fill,
        fillOpacity: (opacity / 100) * (dim ? 0.45 : 1),
      };
      const poly = L.polygon(k.ring as [number, number][], baseStyle);
      poly.bindTooltip(`${k.nama} — ${st.text}. Klik untuk memfokuskan.`, {
        sticky: true,
        className: "gis-tip",
      });
      poly.on("mouseover", () =>
        poly.setStyle({
          weight: 2.6,
          dashArray: undefined,
          fillOpacity: Math.min(1, (baseStyle.fillOpacity || 0.45) + 0.1),
        })
      );
      poly.on("mouseout", () => poly.setStyle(baseStyle));
      poly.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        cb.current.onSelectKel(k.id);
      });
      gp.addLayer(poly);

      gl.addLayer(
        L.marker(k.labelLL, {
          pane: "klabel",
          interactive: false,
          keyboard: false,
          icon: L.divIcon({
            className: "kl-wrap",
            iconSize: [0, 0],
            html: `<div class="kl ${dim ? "kl--dim" : ""}"><b>${esc(k.nama)}</b><span>${esc(
              st.text
            )}</span></div>`,
          }),
        })
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelRows, layer, opacity, selectedKel, maxVal, sensors]);

  /* ---------- Penanda fasilitas ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const gf = groups.current.fac;
    if (!gf) return;
    gf.clearLayers();

    facilities.forEach((f) => {
      const t = TIPE_BY_ID[f.tipe];
      const isA = active && active.kind === "fac" && active.id === f.id;
      const m = L.marker(f.ll, {
        title: f.nama,
        alt: f.nama,
        keyboard: true,
        icon: L.divIcon({
          className: `fw ${isA ? "is-active" : ""}`,
          iconSize: [0, 0],
          html: `<div class="fpin" style="background:${t ? t.warna : "#0b6a78"}">${iconMarkup(
            TIPE_ICON[f.tipe] || "trash"
          )}</div>`,
        }),
      });
      const open = () => cb.current.setActive({ kind: "fac", id: f.id });
      m.on("click", open);
      m.on("keypress", (e: any) => {
        if (e.originalEvent.keyCode === 13) open();
      });
      gf.addLayer(m);
    });
  }, [facilities, active]);

  /* ---------- Penanda sensor ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const gs = groups.current.sens;
    if (!gs) return;
    gs.clearLayers();
    if (!showSensor) return;

    sensors.forEach((z) => {
      const off = z.ppm === null;
      const c = off ? null : ch4Class(z.ppm as number);
      const label = off ? "Offline" : `${z.ppm} ppm`;
      const isA = active && active.kind === "sensor" && active.id === z.id;
      const fill = off ? "#e5e7eb" : c!.fill;
      const stroke = off ? "#6b7280" : c!.stroke;
      const inner =
        !off && c!.min >= 5
          ? `<i class="dia-in" style="background:${stroke}"></i>`
          : "";
      const m = L.marker(z.ll, {
        title: `${z.id} — ${label}`,
        alt: `Sensor ${z.id}, ${label}`,
        keyboard: true,
        zIndexOffset: 500,
        icon: L.divIcon({
          className: `sn ${isA ? "is-active" : ""}`,
          iconSize: [0, 0],
          html: `<div class="spin"><i class="dia" style="background:${fill};border-color:${stroke}"></i>${inner}<span class="ppm-pill ${
            off ? "is-off" : ""
          }">${label}</span></div>`,
        }),
      });
      const open = () => cb.current.setActive({ kind: "sensor", id: z.id });
      m.on("click", open);
      m.on("keypress", (e: any) => {
        if (e.originalEvent.keyCode === 13) open();
      });
      gs.addLayer(m);
    });
  }, [sensors, showSensor, active]);

  /* ---------- Popup ---------- */
  const activeObj = useMemo<ActiveObject | null>(() => {
    if (!active) return null;
    if (active.kind === "sensor") {
      const z = sensors.find((q) => q.id === active.id);
      return z && showSensor ? { kind: "sensor", z } : null;
    }
    const f = facilities.find((q) => q.id === active.id);
    return f ? { kind: "fac", f } : null;
  }, [active, sensors, facilities, showSensor]);

  const popKey = activeObj ? `${activeObj.kind}:${active?.id}` : "";

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeObj) return undefined;
    const ll = activeObj.kind === "sensor" ? activeObj.z.ll : activeObj.f.ll;
    const popup = L.popup({
      className: "gis-popup",
      maxWidth: 250,
      minWidth: 210,
      closeButton: true,
      offset: [0, activeObj.kind === "sensor" ? -10 : -14],
      autoPan: !firstOpen.current,
      autoPanPadding: [24, 24],
    })
      .setLatLng(ll)
      .setContent(popupHtml(activeObj));

    firstOpen.current = false;
    closing.current = false;
    popRef.current = popup;
    popup.openOn(map);

    return () => {
      closing.current = true;
      if (map.hasLayer(popup)) map.closePopup(popup);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popKey]);

  /* ---------- Fokus otomatis ke kelurahan ---------- */
  const goHome = (targetKelId: string | null, animate = true) => {
    const map = mapRef.current;
    if (!map || !hostRef.current) return;
    if (targetKelId && KEL_BOUNDS[targetKelId]) {
      map.fitBounds(KEL_BOUNDS[targetKelId], {
        padding: [56, 56],
        maxZoom: 17,
        animate,
      });
    } else {
      const compact = hostRef.current.clientWidth < 700;
      const fitZ = map.getBoundsZoom(ALL_BOUNDS.pad(0.08));
      map.setView(
        ALL_BOUNDS.getCenter(),
        compact ? Math.max(fitZ, COMPACT_ZOOM) : fitZ,
        { animate }
      );
    }
  };

  const firstFocus = useRef(true);
  useEffect(() => {
    if (firstFocus.current) {
      firstFocus.current = false;
      return;
    }
    goHome(selectedKel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKel]);

  useEffect(() => {
    if (!full) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  useEffect(() => {
    const t = setTimeout(() => mapRef.current && mapRef.current.invalidateSize(), 80);
    return () => clearTimeout(t);
  }, [full]);

  const currentLayerObj = LAYERS.find((l) => l.id === layer);
  const layerLabel = currentLayerObj ? currentLayerObj.label : "Kepatuhan";

  return (
    <div className={`card map ${full ? "map--full" : ""} ${sat ? "map--sat" : ""}`}>
      <div className="map-stage" data-layer={layerLabel}>
        <div ref={hostRef} className="leaflet-host" />

        {tiles === "fail" ? (
          <div className="map-note" role="status">
            Peta dasar daring tidak dapat dimuat — memakai peta vektor ilustratif.
          </div>
        ) : null}

        <div className="mc mc--tl">
          <div className="mc-group">
            <button
              type="button"
              aria-label="Perbesar"
              onClick={() => mapRef.current && mapRef.current.zoomIn(1)}
              disabled={zoom >= maxZ - 0.01}
            >
              <Icon name="plus" size={20} />
            </button>
            <button
              type="button"
              aria-label="Perkecil"
              onClick={() => mapRef.current && mapRef.current.zoomOut(1)}
              disabled={zoom <= minZ + 0.01}
            >
              <Icon name="minus" size={20} />
            </button>
          </div>
          <button
            type="button"
            className="mc-single"
            aria-label="Kembali ke tampilan awal (utara di atas)"
            title="Reset tampilan"
            onClick={() => goHome(selectedKel)}
          >
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
              <text
                x="12"
                y="9"
                textAnchor="middle"
                fontSize="9"
                fontWeight="800"
                fill="#10263f"
              >
                N
              </text>
              <path d="M12 11 8 21l4-2.4 4 2.4z" fill="#10263f" />
            </svg>
          </button>
          <button
            type="button"
            className="mc-single"
            aria-label={full ? "Keluar layar penuh" : "Layar penuh"}
            onClick={() => setFull((v) => !v)}
          >
            <Icon name={full ? "shrink" : "expand"} size={20} />
          </button>
        </div>

        {filtered ? (
          <div className="map-badge">
            <span>
              {facilities.length} dari {allCount} fasilitas
            </span>
            <button type="button" onClick={onClearFilters}>
              Hapus filter
            </button>
          </div>
        ) : null}
      </div>

      <div className="map-foot">
        <div className="mc-bl">
          <label className="opacity">
            <span>
              Opasitas overlay: <b>{opacity}%</b>
            </span>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              aria-label="Opasitas overlay"
            />
          </label>
          <p className="ovl">
            {layer === "kep" ? (
              <>Overlay kepatuhan: {KEP_CLASSES.map((c) => c.ket.toLowerCase()).join(" • ")}</>
            ) : layer === "ch4" ? (
              <>Overlay metana: konsentrasi tertinggi per kelurahan (ppm)</>
            ) : (
              <>
                Overlay volume: <span className="c-g">hijau organik</span> •{" "}
                <span className="c-b">biru anorganik</span> •{" "}
                <span className="c-k">abu residu</span> •{" "}
                <span className="c-p">ungu total</span> (m³/bulan)
              </>
            )}
          </p>
        </div>
        <div className="mc-br">
          <div className="seg" role="group" aria-label="Jenis peta dasar">
            <button
              type="button"
              className={!sat ? "on" : ""}
              aria-pressed={!sat}
              onClick={() => setBase("peta")}
            >
              Peta
            </button>
            <button
              type="button"
              className={sat ? "on" : ""}
              aria-pressed={sat}
              onClick={() => setBase("sat")}
            >
              Satelit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
