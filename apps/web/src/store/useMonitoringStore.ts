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
  latitude: number | null;
  longitude: number | null;
  maxCapacityLiter: string;
  currentVolumeLiter: string;
  category: {
    name: string;
  };
  status?: string;
  userId?: string;
  wargaName?: string;
  kknName?: string;
  rtRw?: string;
  lokasi?: string;
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
