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
  login: (username: string, role: UserRole) => Promise<boolean>;
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
  login: async (username: string, role: UserRole) => {
    // Fetch a real JWT token from the backend using the seeded admin account
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@pilahsampah.id', password: 'password123' })
      });
      const data = await res.json();
      if (data.success && data.data?.accessToken) {
        localStorage.setItem('psc_token', data.data.accessToken);
      }
    } catch (e) {
      console.error("Auth fallback failed:", e);
    }

    // Simulasikan delay API
    await new Promise((resolve) => setTimeout(resolve, 300));

    let details: User = {
      nama: username || 'Pengguna Demo',
      peran: role,
      wilayah: 'Kecamatan Coblong',
      avatar: 'U',
      avatarBg: 'bg-primary-container',
      avatarColor: 'text-primary'
    };

    switch (role) {
      case 'ADMIN':
        details = {
          nama: username || 'Admin Utama',
          peran: 'ADMIN',
          wilayah: 'Sistem Pusat',
          avatar: 'AU',
          avatarBg: 'bg-blue-100',
          avatarColor: 'text-blue-700'
        };
        break;
      case 'PETUGAS_KELURAHAN':
        details = {
          nama: username || 'Siti Kelurahan',
          peran: 'PETUGAS_KELURAHAN',
          wilayah: 'Kelurahan Dago',
          avatar: 'SK',
          avatarBg: 'bg-pink-100',
          avatarColor: 'text-pink-700'
        };
        break;
      case 'PETUGAS_RW':
        details = {
          nama: username || 'Asep RW',
          peran: 'PETUGAS_RW',
          wilayah: 'RW 06 Dago',
          avatar: 'AR',
          avatarBg: 'bg-teal-100',
          avatarColor: 'text-teal-700'
        };
        break;
      case 'PETUGAS_RT':
        details = {
          nama: username || 'Budi RT',
          peran: 'PETUGAS_RT',
          wilayah: 'RT 02 / RW 06',
          avatar: 'BR',
          avatarBg: 'bg-orange-100',
          avatarColor: 'text-orange-700'
        };
        break;
      case 'WARGA':
        details = {
          nama: username || 'Dewi Lestari',
          peran: 'WARGA',
          wilayah: 'RT 04 / RW 06',
          avatar: 'DL',
          avatarBg: 'bg-green-100',
          avatarColor: 'text-green-700'
        };
        break;
    }

    localStorage.setItem('psc_user', JSON.stringify(details));
    set({ user: details, isAuthenticated: true });
    return true;
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
