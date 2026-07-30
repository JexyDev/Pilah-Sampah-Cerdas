/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Utility Skala Warna Polygon Warga (Partisipasi Warga - 5 Level UI Hex Palette)
 */

export interface PolygonColorLevel {
  level: number;
  label: string;
  minPercent: number;
  maxPercent: number;
  fillColor: string; // Kode Hex UI
  strokeColor: string;
  badgeClass: string;
}

export const POLYGON_COLOR_PALETTE: PolygonColorLevel[] = [
  {
    level: 1,
    label: "Sangat Rendah",
    minPercent: 0,
    maxPercent: 20,
    fillColor: "#EF4444", // Red 500
    strokeColor: "#B91C1C", // Red 700
    badgeClass: "bg-red-100 text-red-800 border-red-300",
  },
  {
    level: 2,
    label: "Rendah",
    minPercent: 21,
    maxPercent: 40,
    fillColor: "#F97316", // Orange 500
    strokeColor: "#C2410C", // Orange 700
    badgeClass: "bg-orange-100 text-orange-800 border-orange-300",
  },
  {
    level: 3,
    label: "Sedang",
    minPercent: 41,
    maxPercent: 60,
    fillColor: "#EAB308", // Yellow 500
    strokeColor: "#A16207", // Yellow 700
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  {
    level: 4,
    label: "Tinggi",
    minPercent: 61,
    maxPercent: 80,
    fillColor: "#84CC16", // Lime 500 / Green light
    strokeColor: "#4D7C0F", // Lime 700
    badgeClass: "bg-lime-100 text-lime-800 border-lime-300",
  },
  {
    level: 5,
    label: "Sangat Tinggi",
    minPercent: 81,
    maxPercent: 100,
    fillColor: "#15803D", // Emerald 700 / Dark Green
    strokeColor: "#166534", // Emerald 800
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
];

/**
 * Mendapatkan konfigurasi warna polygon berdasarkan persentase partisipasi warga (0 - 100)
 */
export function getPolygonColorByParticipation(participationPercent: number): PolygonColorLevel {
  const percent = Math.max(0, Math.min(100, participationPercent));

  if (percent <= 20) return POLYGON_COLOR_PALETTE[0];
  if (percent <= 40) return POLYGON_COLOR_PALETTE[1];
  if (percent <= 60) return POLYGON_COLOR_PALETTE[2];
  if (percent <= 80) return POLYGON_COLOR_PALETTE[3];
  return POLYGON_COLOR_PALETTE[4];
}
