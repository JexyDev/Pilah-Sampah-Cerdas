import { create } from 'zustand';

export type UserRole = 'ADMIN' | 'PETUGAS_KELURAHAN' | 'PETUGAS_RW' | 'PETUGAS_RT' | 'WARGA';

export interface User {
  nama: string;
  peran: UserRole;
  wilayah: string;
  avatar: string;
  avatarBg: string;
  avatarColor: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateWilayah: (newWilayah: string) => void;
}

const getInitialUser = (): User | null => {
  const stored = localStorage.getItem('psc_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  isAuthenticated: !!localStorage.getItem('psc_user'),
  login: async (email: string, password?: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || 'password123' })
      });
      const data = await res.json();
      
      if (data.data?.accessToken) {
        localStorage.setItem('psc_token', data.data.accessToken);
        
        const backendUser = data.data.user;
        const role = backendUser.role as UserRole;
        
        let details: User = {
          nama: backendUser.name || 'Pengguna',
          peran: role,
          wilayah: 'Sistem Pusat',
          avatar: backendUser.name ? backendUser.name.substring(0, 2).toUpperCase() : 'U',
          avatarBg: 'bg-primary-container',
          avatarColor: 'text-primary'
        };

        switch (role) {
          case 'ADMIN':
            details.avatarBg = 'bg-blue-100'; details.avatarColor = 'text-blue-700'; details.wilayah = 'Sistem Pusat'; break;
          case 'PETUGAS_KELURAHAN':
            details.avatarBg = 'bg-pink-100'; details.avatarColor = 'text-pink-700'; details.wilayah = 'Kelurahan Dago'; break;
          case 'PETUGAS_RW':
            details.avatarBg = 'bg-teal-100'; details.avatarColor = 'text-teal-700'; details.wilayah = 'RW 06 Dago'; break;
          case 'PETUGAS_RT':
            details.avatarBg = 'bg-orange-100'; details.avatarColor = 'text-orange-700'; details.wilayah = 'RT 02 / RW 06'; break;
          case 'WARGA':
            details.avatarBg = 'bg-green-100'; details.avatarColor = 'text-green-700'; details.wilayah = 'RT 04 / RW 06'; break;
        }

        localStorage.setItem('psc_user', JSON.stringify(details));
        set({ user: details, isAuthenticated: true });
        return true;
      }
      return false;
    } catch (e) {
      console.error("Login failed:", e);
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem('psc_user');
    set({ user: null, isAuthenticated: false });
  },
  updateWilayah: (newWilayah: string) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, wilayah: newWilayah };
      localStorage.setItem('psc_user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  }
}));
