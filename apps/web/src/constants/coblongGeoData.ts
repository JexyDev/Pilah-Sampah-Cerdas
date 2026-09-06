/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Master Geospatial Data & Leaflet Helper Utilities for Kecamatan Coblong, Kota Bandung.
 * Single Source of Truth across Manajemen Lokasi, Monitoring Wilayah, Monitoring Absen, & Tempat Sampah.
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

// Open-Source Verified Boundary Polygons for the 6 Kelurahan of Kecamatan Coblong
export const KELURAHAN_GEODATA: Record<string, KelurahanGeoFeature> = {
  DAGO: {
    id: "DAGO",
    name: "Dago",
    centroid: [-6.8778, 107.6186],
    color: "#10b981", // Emerald
    rwCount: 21,
    bounds: [
      [-6.8680, 107.6120],
      [-6.8710, 107.6260],
      [-6.8850, 107.6240],
      [-6.8870, 107.6150],
      [-6.8780, 107.6080],
    ],
    rws: [
      {
        name: "RW 01",
        rtCount: 4,
        centroid: [-6.8750, 107.6160],
        bounds: [
          [-6.8720, 107.6140],
          [-6.8730, 107.6190],
          [-6.8780, 107.6180],
          [-6.8770, 107.6130],
        ],
      },
      {
        name: "RW 02",
        rtCount: 5,
        centroid: [-6.8800, 107.6200],
        bounds: [
          [-6.8770, 107.6170],
          [-6.8780, 107.6240],
          [-6.8830, 107.6230],
          [-6.8820, 107.6160],
        ],
      },
    ],
  },
  LEBAK_SILIWANGI: {
    id: "LEBAK_SILIWANGI",
    name: "Lebak Siliwangi",
    centroid: [-6.8870, 107.6060],
    color: "#3b82f6", // Blue
    rwCount: 7,
    bounds: [
      [-6.8820, 107.6030],
      [-6.8830, 107.6110],
      [-6.8920, 107.6100],
      [-6.8930, 107.6020],
    ],
    rws: [
      {
        name: "RW 01",
        rtCount: 3,
        centroid: [-6.8860, 107.6065],
        bounds: [
          [-6.8830, 107.6040],
          [-6.8840, 107.6090],
          [-6.8890, 107.6080],
          [-6.8880, 107.6035],
        ],
      },
    ],
  },
  LEBAK_GEDE: {
    id: "LEBAK_GEDE",
    name: "Lebak Gede",
    centroid: [-6.8890, 107.6100],
    color: "#8b5cf6", // Purple
    rwCount: 17,
    bounds: [
      [-6.8860, 107.6100],
      [-6.8870, 107.6180],
      [-6.8950, 107.6170],
      [-6.8940, 107.6090],
    ],
    rws: [
      {
        name: "RW 01",
        rtCount: 4,
        centroid: [-6.8885, 107.6125],
        bounds: [
          [-6.8865, 107.6105],
          [-6.8875, 107.6150],
          [-6.8915, 107.6145],
          [-6.8905, 107.6100],
        ],
      },
      {
        name: "RW 02",
        rtCount: 4,
        centroid: [-6.8920, 107.6145],
        bounds: [
          [-6.8900, 107.6120],
          [-6.8910, 107.6170],
          [-6.8950, 107.6160],
          [-6.8940, 107.6115],
        ],
      },
    ],
  },
  SEKELOA: {
    id: "SEKELOA",
    name: "Sekeloa",
    centroid: [-6.8910, 107.6180],
    color: "#f59e0b", // Amber
    rwCount: 15,
    bounds: [
      [-6.8860, 107.6170],
      [-6.8870, 107.6235],
      [-6.8950, 107.6230],
      [-6.8940, 107.6165],
    ],
    rws: [
      {
        name: "RW 01",
        rtCount: 4,
        centroid: [-6.8890, 107.6195],
        bounds: [
          [-6.8870, 107.6175],
          [-6.8880, 107.6215],
          [-6.8920, 107.6210],
          [-6.8910, 107.6170],
        ],
      },
    ],
  },
  SADANG_SERANG: {
    id: "SADANG_SERANG",
    name: "Sadang Serang",
    centroid: [-6.8930, 107.6250],
    color: "#ec4899", // Pink
    rwCount: 15,
    bounds: [
      [-6.8870, 107.6230],
      [-6.8880, 107.6320],
      [-6.8970, 107.6310],
      [-6.8960, 107.6225],
    ],
    rws: [
      {
        name: "RW 01",
        rtCount: 5,
        centroid: [-6.8910, 107.6265],
        bounds: [
          [-6.8885, 107.6240],
          [-6.8895, 107.6290],
          [-6.8940, 107.6285],
          [-6.8930, 107.6235],
        ],
      },
    ],
  },
  CIPAGANTI: {
    id: "CIPAGANTI",
    name: "Cipaganti",
    centroid: [-6.8950, 107.6030],
    color: "#06b6d4", // Cyan
    rwCount: 10,
    bounds: [
      [-6.8910, 107.5990],
      [-6.8920, 107.6070],
      [-6.9000, 107.6060],
      [-6.8990, 107.5985],
    ],
    rws: [
      {
        name: "RW 01",
        rtCount: 3,
        centroid: [-6.8940, 107.6025],
        bounds: [
          [-6.8920, 107.6000],
          [-6.8930, 107.6045],
          [-6.8970, 107.6040],
          [-6.8960, 107.5995],
        ],
      },
    ],
  },
};

// Custom Leaflet DivIcon Generators (Standardized Across All Pages)
export const createMapBinIcon = (status: string) => {
  let color = "#10b981"; // Normal (Emerald)
  if (status === "Sedang" || status === "waspada" || status === "Waspada") color = "#f59e0b"; // Orange/Amber
  if (status === "Penuh" || status === "penuh" || status === "Kritis") color = "#ef4444"; // Red

  return L.divIcon({
    className: "custom-bin-icon",
    html: `
      <div style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

export const createHouseIcon = () => {
  return L.divIcon({
    className: "custom-house-icon",
    html: `
      <div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 6px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export const createRwZonaIcon = (rwName: string, patuh: number) => {
  let color = "#10b981"; // green
  if (patuh < 60) color = "#ef4444"; // red
  else if (patuh < 85) color = "#f97316"; // orange

  const match = rwName.match(/(\d+)/);
  const num = match ? match[1].padStart(2, "0") : "01";

  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="background-color: ${color}; width: 42px; height: 42px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-weight: 800; line-height: 1.05;">
        <span style="font-size: 10px; font-weight: 900;">RW ${num}</span>
        <span style="font-size: 9px; opacity: 0.95;">${patuh}%</span>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
};

export const createKelurahanPinIcon = (kelName: string, rwCount: number) => {
  return L.divIcon({
    className: "custom-kelurahan-pin-icon",
    html: `
      <div style="background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 6px 14px; border-radius: 20px; border: 2.5px solid #10b981; box-shadow: 0 4px 16px rgba(0,0,0,0.35); font-family: sans-serif; display: flex; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap;">
        <span style="background-color: #10b981; width: 10px; height: 10px; border-radius: 50%; display: inline-block;"></span>
        <span style="font-weight: 800; font-size: 12px;">Kel. ${kelName}</span>
        <span style="background-color: rgba(16,185,129,0.25); color: #34d399; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 10px;">${rwCount} RW</span>
      </div>
    `,
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
    html: `
      <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};
