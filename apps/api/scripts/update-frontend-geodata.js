import fs from 'fs';
import path from 'path';

const gisData = JSON.parse(fs.readFileSync('./scripts/coblong_lapak_gis_full.json', 'utf-8'));

const geoDataPath = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\scratch\\pilahsampah-id\\apps\\web\\src\\constants\\coblongGeoData.ts';

const template = `/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Master Geospatial Data & Leaflet Helper Utilities for Kecamatan Coblong, Kota Bandung.
 * Single Source of Truth across Manajemen Lokasi, Monitoring Wilayah, Monitoring Absen, & Tempat Sampah.
 * High-Precision GIS Boundary Polygons sourced directly from LapakGIS / OpenStreetMap Official Boundary Relations.
 */

import L from "leaflet";

// Central Coordinates of Kecamatan Coblong, Kota Bandung
export class CoblongGeo {
  public static readonly CENTER: [number, number] = [-6.8906, 107.6150];
  public static readonly DEFAULT_ZOOM: number = 14;
}

export interface KelurahanGeoFeature {
  id: string;
  name: string;
  centroid: [number, number];
  color: string;
  rwCount: number;
  bounds: [number, number][];
  rws: Array<{
    name: string;
    rtCount: number;
    centroid: [number, number];
    bounds: [number, number][];
  }>;
}

// Authentic High-Precision Boundary Polygons for the 6 Kelurahan of Kecamatan Coblong (Source: LapakGIS / OSM Real Data)
export const KELURAHAN_GEODATA: Record<string, KelurahanGeoFeature> = {
  DAGO: {
    id: "DAGO",
    name: "Dago",
    centroid: ${JSON.stringify(gisData["Dago"].centroid)},
    color: "#10b981", // Emerald
    rwCount: 21,
    bounds: ${JSON.stringify(gisData["Dago"].bounds)},
    rws: [
      {
        name: "RW 01",
        rtCount: 4,
        centroid: [-6.8750, 107.6160],
        bounds: [],
      },
    ],
  },
  LEBAK_SILIWANGI: {
    id: "LEBAK_SILIWANGI",
    name: "Lebak Siliwangi",
    centroid: ${JSON.stringify(gisData["Lebak Siliwangi"].centroid)},
    color: "#3b82f6", // Blue
    rwCount: 7,
    bounds: ${JSON.stringify(gisData["Lebak Siliwangi"].bounds)},
    rws: [],
  },
  LEBAK_GEDE: {
    id: "LEBAK_GEDE",
    name: "Lebak Gede",
    centroid: ${JSON.stringify(gisData["Lebak Gede"].centroid)},
    color: "#8b5cf6", // Purple
    rwCount: 17,
    bounds: ${JSON.stringify(gisData["Lebak Gede"].bounds)},
    rws: [],
  },
  SEKELOA: {
    id: "SEKELOA",
    name: "Sekeloa",
    centroid: ${JSON.stringify(gisData["Sekeloa"].centroid)},
    color: "#f59e0b", // Amber
    rwCount: 15,
    bounds: ${JSON.stringify(gisData["Sekeloa"].bounds)},
    rws: [],
  },
  SADANG_SERANG: {
    id: "SADANG_SERANG",
    name: "Sadang Serang",
    centroid: ${JSON.stringify(gisData["Sadang Serang"].centroid)},
    color: "#ec4899", // Pink
    rwCount: 15,
    bounds: ${JSON.stringify(gisData["Sadang Serang"].bounds)},
    rws: [],
  },
  CIPAGANTI: {
    id: "CIPAGANTI",
    name: "Cipaganti",
    centroid: ${JSON.stringify(gisData["Cipaganti"].centroid)},
    color: "#06b6d4", // Cyan
    rwCount: 10,
    bounds: ${JSON.stringify(gisData["Cipaganti"].bounds)},
    rws: [],
  },
};

// Custom Leaflet DivIcon Generators (Standardized Across All Pages)
export const createMapBinIcon = (status: string) => {
  let color = "#10b981"; // Normal (Emerald)
  if (status === "Sedang" || status === "waspada" || status === "Waspada") color = "#f59e0b"; // Orange/Amber
  if (status === "Penuh" || status === "penuh" || status === "Kritis") color = "#ef4444"; // Red

  return L.divIcon({
    className: "custom-bin-icon",
    html: \`
      <div style="background-color: \${color}; width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </div>
    \`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

export const createHouseIcon = () => {
  return L.divIcon({
    className: "custom-house-icon",
    html: \`
      <div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 6px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
    \`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export const createRwZonaIcon = (rwName: string, patuh: number) => {
  let color = "#10b981"; // green
  if (patuh < 60) color = "#ef4444"; // red
  else if (patuh < 85) color = "#f97316"; // orange

  const match = rwName.match(/(\\d+)/);
  const num = match ? match[1].padStart(2, "0") : "01";

  return L.divIcon({
    className: "custom-div-icon",
    html: \`
      <div style="background-color: \${color}; width: 42px; height: 42px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-weight: 800; line-height: 1.05;">
        <span style="font-size: 10px; font-weight: 900;">RW \${num}</span>
        <span style="font-size: 9px; opacity: 0.95;">\${patuh}%</span>
      </div>
    \`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
};

export const createKelurahanPinIcon = (kelName: string, rwCount: number) => {
  return L.divIcon({
    className: "custom-kelurahan-pin-icon",
    html: \`
      <div style="background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 6px 14px; border-radius: 20px; border: 2.5px solid #10b981; box-shadow: 0 4px 16px rgba(0,0,0,0.35); font-family: sans-serif; display: flex; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap;">
        <span style="background-color: #10b981; width: 10px; height: 10px; border-radius: 50%; display: inline-block;"></span>
        <span style="font-weight: 800; font-size: 12px;">Kel. \${kelName}</span>
        <span style="background-color: rgba(16,185,129,0.25); color: #34d399; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 10px;">\${rwCount} RW</span>
      </div>
    \`,
    iconSize: [130, 36],
    iconAnchor: [65, 18],
  });
};

export const createKknMhsIcon = (status: "PRESENT" | "SICK" | "PERMIT" | "ABSENT") => {
  let color = "#10b981";
  if (status === "SICK" || status === "PERMIT") color = "#f59e0b";
  if (status === "ABSENT") color = "#ef4444";

  return L.divIcon({
    className: "custom-mhs-icon",
    html: \`
      <div style="background-color: \${color}; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
      </div>
    \`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};
`;

fs.writeFileSync(geoDataPath, template);
console.log("SUCCESS_UPDATED_COBLONG_GEODATA_WITH_FULL_LAPAK_GIS");
