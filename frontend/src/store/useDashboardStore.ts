import { create } from 'zustand';
import api from '../utils/api';

export interface KPI {
  totalWarga: number;
  totalSampahKg: number;
  averageAiAccuracy: number;
  alertTongPenuh: number;
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
        api.get('/dashboard/kpi'),
        api.get('/dashboard/transactions'),
      ]);

      set({
        kpi: (kpiRes as any).data,
        transactions: (txRes as any).data,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err.message || 'Failed to fetch dashboard data',
        isLoading: false,
      });
    }
  },
}));
