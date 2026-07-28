/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { create } from "zustand";

export interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  points: number;
  avatarUrl?: string;
  wilayah?: string;
}

interface LeaderboardState {
  users: LeaderboardUser[];
  regions: any[];
  rtRw: any[];
  mahasiswa: any[];
  pengangkut: any[];
  isLoading: boolean;
  error: string | null;
  fetchLeaderboard: () => Promise<void>;
}

import api from "../services/api";

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  users: [],
  regions: [],
  rtRw: [],
  mahasiswa: [],
  pengangkut: [],
  isLoading: false,
  error: null,
  fetchLeaderboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/gamification/leaderboard");
      const { citizens, regions, rtRw, mahasiswa, pengangkut } = response.data.data;

      // format response to LeaderboardUser
      const users: LeaderboardUser[] = citizens.map((u: any, index: number) => ({
        id: u.id,
        rank: index + 1,
        name: u.name || "Unknown",
        points: u.totalPoints,
        wilayah: u.wilayah || "-",
      }));

      set({
        users,
        regions: regions || [],
        rtRw: rtRw || [],
        mahasiswa: mahasiswa || [],
        pengangkut: pengangkut || [],
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err.message || "Gagal memuat leaderboard",
        isLoading: false,
      });
    }
  },
}));
