import { create } from 'zustand';
import api from '../utils/api';

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
      const res = await api.get('/bins');
      set({
        bins: (res as any).data,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err.message || 'Failed to fetch bins',
        isLoading: false,
      });
    }
  },
}));
