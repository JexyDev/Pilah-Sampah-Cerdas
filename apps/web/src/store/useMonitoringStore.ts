/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { create } from "zustand";
import api from "../utils/api";

export interface Bin {
  id: string;
  qrCode: string;
  kode?: string;
  latitude: number | null;
  longitude: number | null;
  maxCapacityLiter: string | number;
  currentVolumeLiter: string | number;
  category?: {
    id?: string;
    name: string;
  } | null;
  status?: string;
  realStatus?: string;
  userId?: string | null;
  wargaName?: string | null;
  wargaPhone?: string | null;
  wargaAddress?: string | null;
  address?: string | null;
  kknName?: string | null;
  rtRw?: string | null;
  rw?: string | null;
  kelurahan?: string | null | { name?: string };
  user?: {
    id?: string;
    name?: string;
    phone?: string;
    address?: string | null;
  } | null;
  lokasi?: string;
  kapasitas?: number;
  lastUpdate?: string;
  verifiedAt?: string;
  gpsFormatted?: string;
  altitude?: number;
  categoryId?: string | null;
  rwId?: number | null;
  needsInspection?: boolean;
  lastActivityLog?: string;
}

interface MonitoringState {
  bins: Bin[];
  isLoading: boolean;
  error: string | null;
  fetchBins: () => Promise<void>;
}

export const useMonitoringStore = create<MonitoringState>((set) => ({
  bins: [],
  isLoading: false,
  error: null,
  fetchBins: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get("/bins");
      set({
        bins: res.data.data || [],
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err.message || "Failed to fetch bins",
        isLoading: false,
      });
    }
  },
}));
