import { create } from 'zustand';
import api from '../utils/api';

export type UserRole = 'ADMIN' | 'PETUGAS_KELURAHAN' | 'PETUGAS_RW' | 'PETUGAS_RT' | 'WARGA';

export interface User {
  id: string;
  name: string;
  email: string;
  peran: UserRole;
  wilayah: string;
  avatar: string;
  avatarBg: string;
  avatarColor: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateWilayah: (newWilayah: string) => void;
}

const getAvatarConfig = (role: string): { avatarBg: string; avatarColor: string } => {
  switch (role) {
    case 'ADMIN': return { avatarBg: 'bg-blue-100', avatarColor: 'text-blue-700' };
    case 'PETUGAS_KELURAHAN': return { avatarBg: 'bg-pink-100', avatarColor: 'text-pink-700' };
    case 'PETUGAS_RW': return { avatarBg: 'bg-teal-100', avatarColor: 'text-teal-700' };
    case 'PETUGAS_RT': return { avatarBg: 'bg-orange-100', avatarColor: 'text-orange-700' };
    case 'WARGA': return { avatarBg: 'bg-green-100', avatarColor: 'text-green-700' };
    default: return { avatarBg: 'bg-gray-100', avatarColor: 'text-gray-700' };
  }
};

const getWilayahByRole = (role: string): string => {
  switch (role) {
    case 'ADMIN': return 'Sistem Pusat';
    case 'PETUGAS_KELURAHAN': return 'Kelurahan Dago';
    case 'PETUGAS_RW': return 'RW 06 Dago';
    case 'PETUGAS_RT': return 'RT 02 / RW 06';
    case 'WARGA': return 'RT 04 / RW 06';
    default: return 'Kecamatan Coblong';
  }
};

const getInitialUser = (): User | null => {
  try {
    const stored = localStorage.getItem('psc_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  isAuthenticated: !!localStorage.getItem('psc_access_token'),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Axios returns { data, status, ... }; backend body is { message, data: { user, accessToken, refreshToken } }
      const response = await api.post('/auth/login', { email, password });
      const payload = response.data?.data ?? response.data;

      if (!payload?.user || !payload?.accessToken) {
        throw new Error('Response tidak valid dari server');
      }

      const { user: backendUser, accessToken, refreshToken } = payload;

      // Simpan token
      localStorage.setItem('psc_access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('psc_refresh_token', refreshToken);
      }

      // Buat user object untuk store
      const avatarConfig = getAvatarConfig(backendUser.role);
      const user: User = {
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        peran: backendUser.role as UserRole,
        wilayah: getWilayahByRole(backendUser.role),
        avatar: backendUser.name.substring(0, 2).toUpperCase(),
        ...avatarConfig,
      };

      localStorage.setItem('psc_user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false, error: null });
      return true;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Login gagal, periksa email dan password';
      set({ isLoading: false, error: message, isAuthenticated: false });
      return false;
    }
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('psc_refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('psc_access_token');
      localStorage.removeItem('psc_refresh_token');
      localStorage.removeItem('psc_user');
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  updateWilayah: (newWilayah: string) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, wilayah: newWilayah };
      localStorage.setItem('psc_user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
}));
