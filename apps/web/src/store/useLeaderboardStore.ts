/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import { create } from "zustand";
import api from "../services/api";

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
  kknStudents: any[];
  kknGroups: any[];
  isLoading: boolean;
  error: string | null;
  fetchLeaderboard: () => Promise<void>;
  fetchLeaderboardKkn: () => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  users: [],
  regions: [],
  rtRw: [],
  mahasiswa: [],
  pengangkut: [],
  kknStudents: [],
  kknGroups: [],
  isLoading: false,
  error: null,
  fetchLeaderboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/gamification/leaderboard");
      const { citizens, regions, rw, rtRw, mahasiswa, pengangkut } = response.data.data;
      const rawRw = rtRw || rw || [];

      const users: LeaderboardUser[] = (citizens || []).map((u: any, index: number) => ({
        id: u.id,
        rank: index + 1,
        name: u.name || "Unknown",
        points: u.totalPoints,
        wilayah: u.wilayah || "-",
      }));

      set({
        users,
        regions: regions || [],
        rtRw: rawRw,
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
  fetchLeaderboardKkn: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/gamification/leaderboard-kkn");
      const { students, groups } = response.data.data;
      set({
        kknStudents: students || [],
        kknGroups: groups || [],
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err.message || "Gagal memuat leaderboard KKN",
        isLoading: false,
      });
    }
  },
}));
