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
  isLoading: boolean;
  error: string | null;
  fetchLeaderboard: () => Promise<void>;
}

import api from "../services/api";

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  users: [],
  isLoading: false,
  error: null,
  fetchLeaderboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/points/leaderboard");
      // format response to LeaderboardUser
      const users: LeaderboardUser[] = response.data.data.map((u: any, index: number) => ({
        id: u.userId,
        rank: index + 1,
        name: u.user?.name || "Unknown",
        points: u.totalPoints,
        wilayah: typeof u.user?.rtRw === 'string' ? u.user.rtRw : (u.user?.rtRw?.name || u.user?.wilayah || "-"),
      }));

      set({
        users,
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
