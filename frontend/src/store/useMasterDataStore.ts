import { create } from 'zustand';
// import api from '../utils/api'; // Discomment when real API is ready

export interface UserItem {
  id: string;
  name: string;
  role: string;
  points: number;
}

export interface BinItem {
  id: string;
  name: string;
  maxCapacityLiter: number;
  currentVolumeLiter: number;
  status: 'aman' | 'waspada' | 'penuh';
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

// Mock API delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useMasterDataStore = create<MasterDataState>((set) => ({
  users: [],
  bins: [],
  isLoading: false,
  error: null,
  fetchMasterData: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with real API calls when ready
      // const res = await api.get('/users');
      await delay(800); // simulate network
      
      const mockUsers: UserItem[] = [
        { id: 'usr-1', name: 'Bapak Asep', role: 'WARGA', points: 1500 },
        { id: 'usr-2', name: 'Ibu Siti', role: 'WARGA', points: 420 },
        { id: 'usr-3', name: 'Admin Pusat', role: 'STAFF', points: 0 },
      ];
      
      const mockBins: BinItem[] = [
        { id: 'bin-1', name: 'Tong Organik 01', maxCapacityLiter: 100, currentVolumeLiter: 10, status: 'aman' },
        { id: 'bin-2', name: 'Tong Anorganik 01', maxCapacityLiter: 100, currentVolumeLiter: 95, status: 'penuh' },
        { id: 'bin-3', name: 'Tong Organik 02', maxCapacityLiter: 100, currentVolumeLiter: 75, status: 'waspada' },
      ];

      set({
        users: mockUsers,
        bins: mockBins,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err.message || 'Gagal memuat master data',
        isLoading: false,
      });
    }
  },
  deleteUser: async (id: string) => {
    // TODO: Replace with real API delete
    await delay(500);
    set((state) => ({
      users: state.users.filter(u => u.id !== id)
    }));
  },
  deleteBin: async (id: string) => {
    // TODO: Replace with real API delete
    await delay(500);
    set((state) => ({
      bins: state.bins.filter(b => b.id !== id)
    }));
  }
}));
