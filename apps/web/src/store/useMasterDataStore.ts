/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { create } from "zustand";
import api from "../utils/api";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  totalPoin: number;
  createdAt: string;
}

export interface BinItem {
  id: string;
  qrCode: string;
  category: { name: string };
  maxCapacityLiter: number;
  currentVolumeLiter: number;
  rtRw?: { name: string };
  status: "aman" | "waspada" | "penuh";
}

interface MasterDataState {
  users: UserItem[];
  bins: BinItem[];
  isLoading: boolean;
  error: string | null;
  fetchMasterData: () => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  deleteBin: (id: string) => Promise<void>;
}

const getBinStatus = (current: number, max: number): "aman" | "waspada" | "penuh" => {
  const pct = current / max;
  if (pct >= 0.9) return "penuh";
  if (pct >= 0.7) return "waspada";
  return "aman";
};

export const useMasterDataStore = create<MasterDataState>((set) => ({
  users: [],
  bins: [],
  isLoading: false,
  error: null,

  fetchMasterData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [usersRes, binsRes] = await Promise.all([api.get("/users"), api.get("/bins")]);

      const users: UserItem[] = usersRes.data.data || [];
      const rawBins = binsRes.data.data || [];

      const bins: BinItem[] = rawBins.map((b: any) => ({
        id: b.id,
        qrCode: b.qrCode,
        category: b.category,
        maxCapacityLiter: Number(b.maxCapacityLiter),
        currentVolumeLiter: Number(b.currentVolumeLiter),
        rtRw: b.rtRw,
        status: getBinStatus(Number(b.currentVolumeLiter), Number(b.maxCapacityLiter)),
      }));

      set({ users, bins, isLoading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err.message || "Gagal memuat master data",
        isLoading: false,
      });
    }
  },

  deleteUser: async (id: string) => {
    await api.delete(`/users/${id}`);
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
  },

  deleteBin: async (id: string) => {
    await api.delete(`/bins/${id}`);
    set((state) => ({ bins: state.bins.filter((b) => b.id !== id) }));
  },
}));
