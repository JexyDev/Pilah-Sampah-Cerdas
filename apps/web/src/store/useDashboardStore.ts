/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { create } from "zustand";
import api from "../utils/api";

export interface KPI {
  totalWarga: number;
  totalSampahKg: number;
  averageAiAccuracy: number;
  alertTongPenuh: number;
  tempatSampahAktif: number;
  lokasiTerdaftar: number;
  setoranHariIniKg: number;
  totalPoin: number;
  komposisiSampah: {
    organikKg: number;
    anorganikKg: number;
  };
}

export interface Transaction {
  id: string;
  nama: string;
  waktu: string;
  tipe: string;
  volume: string;
  poin: string;
}

interface DashboardState {
  kpi: KPI | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  kpi: null,
  transactions: [],
  isLoading: false,
  error: null,
  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [kpiRes, txRes] = await Promise.all([
        api.get("/dashboard/kpi"),
        api.get("/dashboard/transactions"),
      ]);

      // Backend returns { success: true, data: { ... } }
      set({
        kpi: kpiRes.data.data,
        transactions: txRes.data.data || [],
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err.message || "Gagal memuat data dashboard",
        isLoading: false,
      });
    }
  },
}));
