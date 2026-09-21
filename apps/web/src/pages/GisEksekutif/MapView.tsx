/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * MapView — Komponen Peta GIS Interaktif Tata Kelola Sampah
 * Diadopsi dari arsitektur Menu Fasilitas Persampahan (PemanfaatanSampah.tsx):
 * - Citra Satelit Google Hybrid resolusi tinggi (GOOGLE_SATELLITE_URL) + opsi Peta OSM
 * - Batas poligon resmi 6 Kelurahan Kecamatan Coblong (KELURAHAN_GEODATA)
 * - Pin icon fasilitas terstandarisasi (createFacilityIcon)
 * - Interaktif zoom: scroll roda mouse (scrollWheelZoom: true)
 * - Search auto zoom-in: kamera peta terbang (flyTo / fitBounds) ke fasilitas/wilayah yang dicari
 * - Popup fasilitas lengkap: Badge jenis, Nama, Foto, PIC, Kontak, Alamat, dan Koordinat
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Icon, TIPE_ICON } from "./ui";
import {
  KELURAHAN_GEODATA,
  createFacilityIcon,
  CoblongGeo,
} from "../../constants/coblongGeoData";
import { resolveImageUrl } from "../../utils/imageUrl";
import { fmtN, type ComplianceRow } from "./charts";

export interface LayerItem {
  id: "kep" | "org" | "ano" | "res" | "total";
  label: string;
}

export const LAYERS: LayerItem[] = [
  { id: "kep", label: "Kepatuhan" },
  { id: "org", label: "Organik" },
  { id: "ano", label: "Anorganik" },
  { id: "res", label: "Residu" },
  { id: "total", label: "Volume total" },
];

export const TILES = {
  sat: {
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attr: '&copy; <a href="https://maps.google.com" target="_blank" rel="noopener">Google Maps</a> Citra Satelit Hybrid',
  },
  peta: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  },
};

// Hitung batas terluar 6 kelurahan Coblong dari KELURAHAN_GEODATA
const ALL_COBLONG_POINTS = Object.values(KELURAHAN_GEODATA).flatMap((kg) =>
  kg.bounds.map(([lat, lng]) => L.latLng(lat, lng))
);
const ALL_BOUNDS = L.latLngBounds(ALL_COBLONG_POINTS);

const KEL_BOUNDS = Object.fromEntries(
  Object.values(KELURAHAN_GEODATA).map((kg) => [
    kg.name.toLowerCase().replace(/\s+/g, "-"),
    L.latLngBounds(kg.bounds.map(([lat, lng]) => L.latLng(lat, lng))),
  ])
);

export interface FacilityForMap {
  id: string;
  tipe: string;
  kel: string;
  rw: number | string;
  x?: number;
  y?: number;
  nama: string;
  ll: [number, number];
  pic?: string | null;
  kontak?: string | null;
  foto?: string | null;
  alamat?: string | null;
  kapasitas?: number | null;
}

export type ActiveTarget = { kind: "fac"; id: string } | null;

const esc = (s: string | number) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) =>
      (({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
      })[c] || c)
  );

function formatFacilityLabel(jenis: string): string {
  const t = (jenis || "").toLowerCase();
  if (t === "bank_sampah") return "Bank Sampah";
  if (t === "rumah_maggot") return "Rumah Maggot";
  if (t === "buruan_sae") return "Buruan Sae";
  if (t === "loseda") return "Loseda";
  if (t === "bata_terawang") return "Bata Terawang";
  if (t === "poc") return "POC / Pupuk Organik";
  if (t === "posko_kkn" || t === "posko") return "Posko KKN";
  if (t === "tps") return "TPS";
  return jenis ? jenis.replace(/_/g, " ").toUpperCase() : "Fasilitas";
}

function getFacilityBadgeColor(jenis: string): { bg: string; text: string; border: string } {
  const t = (jenis || "").toLowerCase();
  if (t === "bank_sampah") return { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" };
  if (t === "rumah_maggot") return { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" };
  if (t === "buruan_sae") return { bg: "#f7fee7", text: "#4d7c0f", border: "#d9f99d" };
  if (t === "loseda") return { bg: "#f0fdfa", text: "#0f766e", border: "#99f6e4" };
  if (t === "bata_terawang") return { bg: "#fffbeb", text: "#b45309", border: "#fde68a" };
  if (t === "tps") return { bg: "#f8fafc", text: "#334155", border: "#cbd5e1" };
  return { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" };
}

function createPopupHtml(f: FacilityForMap, onPreview?: (url: string) => void): string {
  const badge = getFacilityBadgeColor(f.tipe);
  const label = formatFacilityLabel(f.tipe);
  const resolvedFoto = f.foto ? resolveImageUrl(f.foto) : null;
  const rwStr = typeof f.rw === "number" ? `RW ${String(f.rw).padStart(2, "0")}` : String(f.rw || "-");

  let fotoHtml = `
    <div style="margin: 8px 0; padding: 10px 8px; text-align: center; color: #94a3b8; font-size: 11px; background: #f8fafc; border: 1px dashed #e2e8f0; border-radius: 8px;">
      <span>📷 Foto fasilitas belum diunggah</span>
    </div>
  `;

  if (resolvedFoto) {
    fotoHtml = `
      <div style="margin: 8px 0; border-radius: 8px; overflow: hidden; position: relative; max-height: 120px; background: #f1f5f9; border: 1px solid #e2e8f0;">
        <img src="${esc(resolvedFoto)}" alt="${esc(f.nama)}" 
          style="width: 100%; height: 115px; object-fit: cover; border-radius: 7px; display: block;" 
          onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'padding:12px;text-align:center;color:#64748b;font-size:11px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:6px;\\'>📷 Gagal memuat foto fasilitas</div>';" />
      </div>
    `;
  }

  // Kontak PIC: Format link WhatsApp & Call secara interaktif
  const cleanDigits = f.kontak ? String(f.kontak).replace(/\D/g, "") : "";
  const hasValidPhone = cleanDigits.length >= 8;
  const waNumber = cleanDigits.startsWith("0") ? "62" + cleanDigits.slice(1) : cleanDigits;

  let kontakHtml = `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; font-size: 11px; color: #94a3b8; padding: 3px 0;">
      <span><strong style="color: #475569;">Kontak PIC:</strong> Belum terdaftar</span>
    </div>
  `;

  if (hasValidPhone) {
    kontakHtml = `
      <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #e2e8f0;">
        <div style="font-size: 11px; margin-bottom: 4px;"><strong style="color: #0f172a;">Kontak:</strong> ${esc(f.kontak || "-")}</div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <a href="https://wa.me/${waNumber}" target="_blank" rel="noopener noreferrer"
            style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 700; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; text-decoration: none; cursor: pointer;">
            <span>💬 WhatsApp</span>
          </a>
          <a href="tel:${cleanDigits}"
            style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 700; background: #f8fafc; color: #334155; border: 1px solid #cbd5e1; text-decoration: none; cursor: pointer;">
            <span>📞 Hubungi</span>
          </a>
        </div>
      </div>
    `;
  }

  // Hyperlink Google Maps Navigation
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${f.ll[0]},${f.ll[1]}`;

  return `
    <div style="font-family: inherit; font-size: 13px; color: #0f172a; line-height: 1.45; min-width: 230px; max-width: 290px; padding: 4px 2px;">
      <div style="margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; background: ${badge.bg}; color: ${badge.text}; border: 1px solid ${badge.border};">
          ${esc(label)}
        </span>
        <span style="font-size: 10.5px; color: #64748b; font-weight: 600;">${esc(rwStr)}</span>
      </div>
      <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.3;">
        ${esc(f.nama)}
      </h3>
      ${fotoHtml}
      <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; flex-direction: column; gap: 3px; font-size: 11.5px; color: #334155;">
        ${f.pic ? `<div><strong style="color:#0f172a;">PIC:</strong> ${esc(f.pic)}</div>` : ""}
        <div><strong style="color:#0f172a;">Wilayah:</strong> Kel. ${esc(f.kel)}</div>
        ${f.alamat ? `<div><strong style="color:#0f172a;">Alamat:</strong> ${esc(f.alamat)}</div>` : ""}
        ${kontakHtml}
        <div style="font-family: monospace; font-size: 10px; color: #94a3b8; margin-top: 4px;">
          📍 ${f.ll[0].toFixed(5)}, ${f.ll[1].toFixed(5)}
        </div>
      </div>
      <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer"
        style="margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 12px; background: #055c46; color: #ffffff; border-radius: 6px; font-size: 11px; font-weight: 700; text-decoration: none; text-align: center; box-shadow: 0 1px 3px rgba(5,92,70,0.2);">
        <span>Buka Rute di Google Maps ↗</span>
      </a>
    </div>
  `;
}

interface MapViewProps {
  kelRows: ComplianceRow[];
  layer: "kep" | "org" | "ano" | "res" | "total" | "ch4";
  base: "peta" | "sat";
  setBase: (v: "peta" | "sat") => void;
  facilities: FacilityForMap[];
  allCount: number;
  selectedKel: string | null;
  onSelectKel: (id: string) => void;
  active: ActiveTarget;
  setActive: (v: ActiveTarget) => void;
  onClearFilters: () => void;
  filtered: boolean;
  searchQuery?: string;
  onPreviewImage?: (img: { url: string; title: string; subtitle?: string }) => void;
  opacity?: number;
  setOpacity?: (v: number) => void;
  showSensor?: boolean;
  sensors?: any[];
}

export default function MapView({
  kelRows,
  layer,
  base = "sat",
  setBase,
  facilities,
  allCount,
  selectedKel,
  onSelectKel,
  active,
  setActive,
  onClearFilters,
  filtered,
  searchQuery = "",
}: MapViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const groups = useRef<Record<string, L.LayerGroup>>({});
  const markerMap = useRef<Record<string, L.Marker>>({});
  const popRef = useRef<L.Popup | null>(null);
  const closing = useRef(false);

  const [zoom, setZoom] = useState(CoblongGeo.DEFAULT_ZOOM);
  const [full, setFull] = useState(false);
  const sat = base === "sat";

  /* ---------- 1. Inisialisasi Peta (Leaflet Vanilla dengan Scroll Interaktif) ---------- */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Aktifkan scrollWheelZoom interaktif
    const map = L.map(host, {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 60,
      maxZoom: 20,
      minZoom: 12,
      scrollWheelZoom: true, // Interaktif scroll zoom in & out
      touchZoom: true,
      doubleClickZoom: true,
    });
    mapRef.current = map;
    (host as any)._map = map;

    // Panes untuk layering teratur
    ["poly:200", "klabel:300", "fac:400"].forEach((s) => {
      const [n, z] = s.split(":");
      const pane = map.createPane(n);
      pane.style.zIndex = z;
    });

    const klabelPane = map.getPane("klabel");
    if (klabelPane) klabelPane.style.pointerEvents = "none";

    ["poly", "klabel", "fac"].forEach((k) => {
      groups.current[k] = L.layerGroup().addTo(map);
    });

    L.control
      .attribution({
        prefix: '<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>',
        position: "bottomright",
      })
      .addTo(map);
    L.control.scale({ position: "bottomright", imperial: false, maxWidth: 110 }).addTo(map);

    // Initial View ke Kecamatan Coblong
    map.fitBounds(ALL_BOUNDS.pad(0.06), { animate: false });
    setZoom(map.getZoom());

    map.on("zoomend", () => {
      setZoom(map.getZoom());
    });

    map.on("popupclose", (e) => {
      if (e.popup === popRef.current && !closing.current) {
        setActive(null);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* ---------- 2. Tile Layer: Google Satellite Hybrid (Acuan Fasilitas) / OSM ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileCfg = sat ? TILES.sat : TILES.peta;
    const tileLayer = L.tileLayer(tileCfg.url, {
      attribution: tileCfg.attr,
      maxZoom: 20,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
  }, [sat]);

  /* ---------- 3. Poligon Batas 6 Kelurahan Resmi (Sesuai Menu Fasilitas) ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const gp = groups.current.poly;
    const gl = groups.current.klabel;
    if (!gp || !gl) return;

    gp.clearLayers();
    gl.clearLayers();

    Object.values(KELURAHAN_GEODATA).forEach((kg) => {
      const kelId = kg.name.toLowerCase().replace(/\s+/g, "-");
      const isSelected = selectedKel === kelId;
      const isDim = selectedKel && !isSelected;

      // Cari kepatuhan/volume untuk tooltip
      const row = kelRows.find(
        (r) => r.k.nama.toLowerCase() === kg.name.toLowerCase()
      );
      const kepVal = row?.s.kep != null ? `${row.s.kep}% Kepatuhan` : "Data KKN";

      const baseStyle: L.PathOptions = {
        color: kg.color,
        weight: isSelected ? 3.5 : 2.5,
        fillColor: kg.color,
        fillOpacity: isSelected ? 0.28 : isDim ? 0.04 : 0.12,
        dashArray: isSelected ? undefined : "4 4",
      };

      const poly = L.polygon(kg.bounds as [number, number][], baseStyle);
      poly.bindTooltip(`<b>Kel. ${kg.name}</b> • ${kepVal}`, {
        sticky: true,
        className: "gis-tip",
      });

      poly.on("mouseover", () => {
        poly.setStyle({
          weight: 3.5,
          fillOpacity: Math.min(0.4, (baseStyle.fillOpacity as number) + 0.12),
        });
      });

      poly.on("mouseout", () => {
        poly.setStyle(baseStyle);
      });

      poly.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectKel(kelId);
      });

      gp.addLayer(poly);

      // Label centroid nama kelurahan
      gl.addLayer(
        L.marker(kg.centroid, {
          pane: "klabel",
          interactive: false,
          keyboard: false,
          icon: L.divIcon({
            className: "kl-wrap",
            iconSize: [0, 0],
            html: `
              <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px); color: white; border: 1.5px solid ${kg.color}; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 800; white-space: nowrap; transform: translate(-50%, -50%); box-shadow: 0 2px 8px rgba(0,0,0,0.35);">
                ${kg.name}
              </div>
            `,
          }),
        })
      );
    });
  }, [kelRows, selectedKel, onSelectKel]);

  /* ---------- 4. Penanda Fasilitas Aktual (createFacilityIcon) ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const gf = groups.current.fac;
    if (!gf) return;

    gf.clearLayers();
    markerMap.current = {};

    facilities.forEach((f) => {
      if (!f.ll || !f.ll[0] || !f.ll[1]) return;
      const isA = active && active.kind === "fac" && active.id === f.id;

      const icon = createFacilityIcon(f.tipe, f.nama);
      const marker = L.marker(f.ll, {
        title: f.nama,
        alt: f.nama,
        icon,
        zIndexOffset: isA ? 1000 : 100,
      });

      const openPopup = () => {
        setActive({ kind: "fac", id: f.id });
      };

      marker.on("click", openPopup);
      gf.addLayer(marker);
      markerMap.current[f.id] = marker;
    });
  }, [facilities, active, setActive]);

  /* ---------- 5. Popup Interaktif Fasilitas ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !active || active.kind !== "fac") return;

    const f = facilities.find((item) => item.id === active.id);
    if (!f || !f.ll) return;

    const popup = L.popup({
      className: "gis-popup",
      maxWidth: 290,
      minWidth: 230,
      closeButton: true,
      offset: [0, -12],
      autoPan: true,
      autoPanPadding: [24, 24],
    })
      .setLatLng(f.ll)
      .setContent(createPopupHtml(f));

    closing.current = false;
    popRef.current = popup;
    popup.openOn(map);

    return () => {
      closing.current = true;
      if (map.hasLayer(popup)) map.closePopup(popup);
    };
  }, [active, facilities]);

  /* ---------- 6. Search Auto Zoom-In (Fit / FlyTo saat user mencari query) ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    // Cek apakah query cocok dengan nama kelurahan
    const matchedKelKey = Object.keys(KELURAHAN_GEODATA).find((k) =>
      KELURAHAN_GEODATA[k].name.toLowerCase().includes(q)
    );

    if (matchedKelKey) {
      const kg = KELURAHAN_GEODATA[matchedKelKey];
      const bounds = L.latLngBounds(kg.bounds.map(([lat, lng]) => L.latLng(lat, lng)));
      map.fitBounds(bounds.pad(0.08), { maxZoom: 16, animate: true, duration: 1.2 });
      return;
    }

    // Cek kecocokan fasilitas
    const matchingFacs = facilities.filter((f) => {
      const hay = `${f.nama} ${f.kel} ${f.rw} ${formatFacilityLabel(f.tipe)} ${f.alamat || ""}`.toLowerCase();
      return q.split(/\s+/).every((tok) => hay.includes(tok));
    });

    if (matchingFacs.length === 1) {
      // 1 fasilitas ditemukan persis -> Zoom in tajam & buka popup
      const target = matchingFacs[0];
      map.flyTo(target.ll, 18, { duration: 1.2 });
      setActive({ kind: "fac", id: target.id });
    } else if (matchingFacs.length > 1) {
      // Beberapa fasilitas cocok -> Zoom menyesuaikan seluruh hasil
      const bounds = L.latLngBounds(matchingFacs.map((f) => L.latLng(f.ll[0], f.ll[1])));
      map.fitBounds(bounds.pad(0.18), { maxZoom: 17, animate: true, duration: 1.2 });
    }
  }, [searchQuery, facilities, setActive]);

  /* ---------- 7. Fokus Otomatis saat Kelurahan Dipilih dari Filter Dropdown ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedKel && KEL_BOUNDS[selectedKel]) {
      map.fitBounds(KEL_BOUNDS[selectedKel].pad(0.06), {
        maxZoom: 16.5,
        animate: true,
        duration: 1,
      });
    }
  }, [selectedKel]);

  /* ---------- Kontrol Tombol Zoom & Reset ---------- */
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetView = () => {
    if (selectedKel && KEL_BOUNDS[selectedKel]) {
      mapRef.current?.fitBounds(KEL_BOUNDS[selectedKel].pad(0.06), { animate: true, duration: 1 });
    } else {
      mapRef.current?.fitBounds(ALL_BOUNDS.pad(0.06), { animate: true, duration: 1 });
    }
  };

  const toggleFullScreen = () => {
    const el = hostRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setFull(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setFull(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={hostRef}
      className={`card map ${full ? "map--full" : ""}`}
      role="region"
      aria-label="Peta interaktif GIS Fasilitas Coblong"
    >
      {/* Kontrol Navigasi Peta (Floating Kiri Atas) */}
      <div className="mc mc--tl">
        <div className="mc-group" role="group" aria-label="Kontrol zoom">
          <button
            type="button"
            title="Perbesar (Zoom In)"
            aria-label="Perbesar"
            onClick={handleZoomIn}
          >
            <Icon name="plus" size={17} />
          </button>
          <button
            type="button"
            title="Perkecil (Zoom Out)"
            aria-label="Perkecil"
            onClick={handleZoomOut}
          >
            <Icon name="minus" size={17} />
          </button>
          <button
            type="button"
            title="Pusatkan Peta Coblong"
            aria-label="Pusatkan peta"
            onClick={handleResetView}
          >
            <Icon name="home" size={17} />
          </button>
        </div>
        <button
          type="button"
          className="mc-single"
          title={full ? "Keluar layar penuh" : "Layar penuh"}
          aria-label="Layar penuh"
          onClick={toggleFullScreen}
        >
          <Icon name={full ? "shrink" : "expand"} size={17} />
        </button>
      </div>

      {/* Floating Info Wilayah & Filter Aktif (Kiri Atas sebelah kontrol zoom) */}
      {filtered && (
        <div className="map-badge">
          <span>
            Menampilkan <b>{facilities.length}</b> dari {allCount} fasilitas
          </span>
          <button type="button" onClick={onClearFilters}>
            Reset
          </button>
        </div>
      )}

      {/* Footer Peta: Keterangan Wilayah & Switcher Tipe Peta (Tanpa Slider Opasitas) */}
      <div className="map-foot">
        <div className="mc-bl">
          <p className="ovl" style={{ margin: 0 }}>
            Wilayah Kecamatan Coblong • Batas 6 Kelurahan (LapakGIS / OSM) • {facilities.length} Fasilitas
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
              Peta Jalan
            </button>
            <button
              type="button"
              className={sat ? "on" : ""}
              aria-pressed={sat}
              onClick={() => setBase("sat")}
            >
              Satelit Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
