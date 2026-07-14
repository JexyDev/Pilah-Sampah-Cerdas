import { create } from 'zustand';

export interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  points: number;
  avatarUrl?: string;
}

interface LeaderboardState {
  users: LeaderboardUser[];
  isLoading: boolean;
  error: string | null;
  fetchLeaderboard: () => Promise<void>;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  users: [],
  isLoading: false,
  error: null,
  fetchLeaderboard: async () => {
    set({ isLoading: true, error: null });
    try {
      await delay(600); // simulate network
      
      const mockUsers: LeaderboardUser[] = [
        { id: 'usr-1', rank: 1, name: 'Bapak Asep', points: 1500 },
        { id: 'usr-2', rank: 2, name: 'Ibu Lani', points: 1200 },
        { id: 'usr-3', rank: 3, name: 'Bapak Dedi', points: 850 },
        { id: 'usr-4', rank: 4, name: 'Ibu Siti', points: 420 },
        { id: 'usr-5', rank: 5, name: 'Bapak Jeremy', points: 200 },
      ];

      set({
        users: mockUsers,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Gagal memuat leaderboard',
        isLoading: false,
      });
    }
  },
}));
