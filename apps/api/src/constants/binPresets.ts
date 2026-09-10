/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

export interface PresetTabung {
  id: string;
  label: string;
  capacity: number;
  diameter: number;
  tinggi: number;
}

export interface PresetKotak {
  id: string;
  label: string;
  capacity: number;
  panjang: number;
  lebar: number;
  tinggi: number;
}

export const PRESET_TEMPAT_SAMPAH_TABUNG: PresetTabung[] = [
  {
    id: "preset-t-1",
    label: "Kecil",
    capacity: 10.0,
    diameter: 23,
    tinggi: 24,
  },
  {
    id: "preset-t-2",
    label: "Sedang",
    capacity: 20.0,
    diameter: 29,
    tinggi: 30,
  },
  {
    id: "preset-t-3",
    label: "Besar",
    capacity: 40.0,
    diameter: 36,
    tinggi: 39,
  },
  {
    id: "preset-t-4",
    label: "Jumbo",
    capacity: 60.0,
    diameter: 40,
    tinggi: 48,
  },
];

export const PRESET_TEMPAT_SAMPAH_KOTAK: PresetKotak[] = [
  {
    id: "preset-k-1",
    label: "Kecil",
    capacity: 12.0,
    panjang: 25,
    lebar: 20,
    tinggi: 24,
  },
  {
    id: "preset-k-2",
    label: "Sedang",
    capacity: 25.0,
    panjang: 40,
    lebar: 25,
    tinggi: 25,
  },
  {
    id: "preset-k-3",
    label: "Besar",
    capacity: 50.0,
    panjang: 40,
    lebar: 35,
    tinggi: 36,
  },
  {
    id: "preset-k-4",
    label: "Jumbo",
    capacity: 70.0,
    panjang: 45,
    lebar: 35,
    tinggi: 45,
  },
];
