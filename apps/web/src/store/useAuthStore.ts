/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { create } from "zustand";
import api from "../utils/api";

export type UserRole =
  | "DEVELOPER"
  | "SUPER_USER"
  | "ADMIN_DLH"
  | "CAMAT"
  | "LURAH"
  | "RW"
  | "PETUGAS_RESIDU"
  | "WARGA"
  | "MAHASISWA_KKN"
  | "DPL"
  | "DOSEN_PEMBIMBING"
  | "PEMIMPIN"
  | "PANITIA_TASKFORCE";

export interface User {
  id: string;
  name: string;
  email: string;
  peran: UserRole;
  role?: string;
  wilayah: string;
  kelurahan?: string;
  kecamatan?: string;
  rw?: string;
  avatar: string;
  avatarBg: string;
  avatarColor: string;
  fotoProfil?: string;
  phone?: string;
  address?: string;
  rtRwId?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (phone: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  requestOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (phone: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateWilayah: (newWilayah: string) => void;
  updateUser: (updatedFields: Partial<User>) => void;
}

const normalizeRole = (role: string): UserRole => {
  if (["DEVELOPER", "Developer", "developer", "dev"].includes(role)) return "DEVELOPER";
  if (["DLH", "DLH_ADMIN", "Admin DLH"].includes(role)) return "ADMIN_DLH";
  if (["ADMIN_KECAMATAN", "Camat", "CAMAT_ADMIN"].includes(role)) return "CAMAT";
  if (["ADMIN_KELURAH", "Lurah", "LURAH_ADMIN"].includes(role)) return "LURAH";
  if (["DOSEN_PEMBIMBING", "DPL"].includes(role)) return "DPL";
  if (["PIMPINAN", "Pemimpin", "Pimpinan"].includes(role)) return "PEMIMPIN";
  if (["TASKFORCE", "Panitia", "TASK_FORCE", "Panitia/Taskforce"].includes(role)) return "PANITIA_TASKFORCE";
  return role as UserRole;
};

const getAvatarConfig = (rawRole: string): { avatarBg: string; avatarColor: string } => {
  const role = normalizeRole(rawRole);
  switch (role) {
    case "DEVELOPER":
      return { avatarBg: "bg-emerald-100", avatarColor: "text-[#009966]" };
    case "SUPER_USER":
      return { avatarBg: "bg-indigo-100", avatarColor: "text-indigo-700" };
    case "ADMIN_DLH":
      return { avatarBg: "bg-blue-100", avatarColor: "text-blue-700" };
    case "CAMAT":
      return { avatarBg: "bg-purple-100", avatarColor: "text-purple-700" };
    case "LURAH":
      return { avatarBg: "bg-pink-100", avatarColor: "text-pink-700" };
    case "RW":
      return { avatarBg: "bg-teal-100", avatarColor: "text-teal-700" };
    case "PETUGAS_RESIDU":
      return { avatarBg: "bg-orange-100", avatarColor: "text-orange-700" };
    case "WARGA":
      return { avatarBg: "bg-green-100", avatarColor: "text-green-700" };
    case "MAHASISWA_KKN":
      return { avatarBg: "bg-amber-100", avatarColor: "text-amber-700" };
    default:
      return { avatarBg: "bg-gray-100", avatarColor: "text-gray-700" };
  }
};

const getWilayahByRole = (role: string): string => {
  switch (role) {
    case "DEVELOPER":
      return "PT Makerindo";
    case "SUPER_USER":
      return "Kecamatan Coblong";
    case "ADMIN_DLH":
      return "Kecamatan Coblong";
    case "CAMAT":
      return "Kecamatan Coblong";
    case "LURAH":
      return "Kelurahan Dago";
    case "RW":
      return "RW 06 Dago";
    case "PETUGAS_RESIDU":
      return "RW 06 Dago";
    case "WARGA":
      return "RW 06 Dago";
    case "MAHASISWA_KKN":
      return "Area KKN Dago";
    default:
      return "Kecamatan Coblong";
  }
};

export const computeAvatarInitials = (name: string = "User"): string => {
  if (!name) return "U";
  const cleanName = name
    .replace(/\b(Assoc\.|Prof\.|Dr\.|Dra\.|Drs\.|S\.Kom\.|M\.Kom\.|M\.Eng\.|S\.E\.|M\.Si\.|S\.T\.|M\.T\.|S\.Ds\.|M\.Ds\.|S\.H\.|M\.H\.|S\.Si\.|S\.Pd\.|M\.Pd\.|S\.IP\.|M\.I\.Pol\.|M\.I\.Kom\.|S\.Sos\.|S\.STP\.|M\.AP\.|A\.KS\.|Ph\.D\.|CIMA|CDMP|CSBA)\b/gi, "")
    .trim();
  const words = (cleanName || name).split(/\s+/).filter(Boolean);
  if (words.length === 0) return "U";
  if (words.length === 1) return words[0][0].toUpperCase();
  return words.slice(0, 3).map((w) => w[0].toUpperCase()).join("");
};

export const WEB_DISABLED_ROLES: UserRole[] = ["WARGA", "MAHASISWA_KKN", "PETUGAS_RESIDU"];

// ─── Helper: Storage abstraction (localStorage vs sessionStorage) ─────────────
const TOKEN_KEYS = ["psc_access_token", "psc_refresh_token", "psc_user"] as const;

function getActiveStorage(): Storage {
  // Jika flag remember_me disimpan di localStorage → localStorage, else → sessionStorage
  return localStorage.getItem("psc_remember_me") === "1" ? localStorage : sessionStorage;
}

function getStoredItem(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? null;
}

function setStoredItem(key: string, value: string, remember: boolean): void {
  if (remember) {
    localStorage.setItem(key, value);
    sessionStorage.removeItem(key); // cleanup other storage
  } else {
    sessionStorage.setItem(key, value);
    localStorage.removeItem(key); // cleanup other storage
  }
}

function clearAllStoredItems(): void {
  TOKEN_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  localStorage.removeItem("psc_remember_me");
}

const getInitialUser = (): User | null => {
  try {
    const stored = getStoredItem("psc_user");
    if (!stored) return null;
    const user = JSON.parse(stored);
    if (user && WEB_DISABLED_ROLES.includes(user.peran)) {
      clearAllStoredItems();
      return null;
    }
    if (user && (user.wilayah === "Sistem Pusat" || user.wilayah === "Dinas Lingkungan Hidup")) {
      user.wilayah = "Kecamatan Coblong";
      const storage = getActiveStorage();
      storage.setItem("psc_user", JSON.stringify(user));
    }
    return user;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  isAuthenticated: !!getStoredItem("psc_access_token") && (!getInitialUser() ? false : true),
  isLoading: false,
  error: null,

  login: async (phone: string, password: string, rememberMe: boolean = true) => {
    set({ isLoading: true, error: null });
    try {
      // Axios returns { data, status, ... }; backend body is { message, data: { user, accessToken, refreshToken } }
      // Send both phone and email for backward compatibility with older VPS backend
      const response = await api.post("/auth/login", { phone, email: phone, password });
      const payload = response.data?.data ?? response.data;

      if (!payload?.user || !payload?.accessToken) {
        throw new Error("Response tidak valid dari server");
      }

      const { user: backendUser, accessToken, refreshToken } = payload;
      const normalizedRole = normalizeRole(backendUser.role);

      if (WEB_DISABLED_ROLES.includes(normalizedRole)) {
        clearAllStoredItems();
        set({ isLoading: false, error: "ROLE_NOT_ALLOWED_ON_WEB", isAuthenticated: false, user: null });
        return false;
      }

      // Simpan flag remember_me di localStorage (selalu persisten sebagai referensi)
      if (rememberMe) {
        localStorage.setItem("psc_remember_me", "1");
      } else {
        localStorage.removeItem("psc_remember_me");
      }

      // Simpan token berdasarkan pilihan "Ingat Saya"
      setStoredItem("psc_access_token", accessToken, rememberMe);
      if (refreshToken) {
        setStoredItem("psc_refresh_token", refreshToken, rememberMe);
      }

      // Buat user object untuk store
      const avatarConfig = getAvatarConfig(normalizedRole);
      const user: User = {
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        peran: normalizedRole,
        wilayah: getWilayahByRole(normalizedRole),
        avatar: computeAvatarInitials(backendUser.name),
        fotoProfil: backendUser.fotoProfil,
        phone: backendUser.phone,
        address: backendUser.address,
        rtRwId: backendUser.rtRwId,
        ...avatarConfig,
      };

      setStoredItem("psc_user", JSON.stringify(user), rememberMe);
      set({ user, isAuthenticated: true, isLoading: false, error: null });
      return true;
    } catch (err: any) {
      const code = err?.response?.data?.code || (err?.response ? "UNKNOWN_ERROR" : "NETWORK_ERROR");
      set({ isLoading: false, error: code, isAuthenticated: false });
      return false;
    }
  },

  requestOtp: async (phone: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/auth/request-otp", { phone });
      set({ isLoading: false, error: null });
      return true;
    } catch (err: any) {
      const code = err?.response?.data?.code || (err?.response ? "UNKNOWN_ERROR" : "NETWORK_ERROR");
      set({ isLoading: false, error: code });
      return false;
    }
  },

  verifyOtp: async (phone: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/auth/verify-otp", { phone, otp });
      const payload = response.data?.data ?? response.data;

      if (!payload?.user || !payload?.accessToken) {
        throw new Error("Response tidak valid dari server");
      }

      const { user: backendUser, accessToken, refreshToken } = payload;
      const normalizedRole = normalizeRole(backendUser.role);

      if (WEB_DISABLED_ROLES.includes(normalizedRole)) {
        localStorage.removeItem("psc_access_token");
        localStorage.removeItem("psc_refresh_token");
        localStorage.removeItem("psc_user");
        set({ isLoading: false, error: "ROLE_NOT_ALLOWED_ON_WEB", isAuthenticated: false, user: null });
        return false;
      }

      localStorage.setItem("psc_access_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("psc_refresh_token", refreshToken);
      }

      const avatarConfig = getAvatarConfig(normalizedRole);
      const user: User = {
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        peran: normalizedRole,
        wilayah: getWilayahByRole(normalizedRole),
        avatar: computeAvatarInitials(backendUser.name),
        fotoProfil: backendUser.fotoProfil,
        phone: backendUser.phone,
        address: backendUser.address,
        rtRwId: backendUser.rtRwId,
        ...avatarConfig,
      };

      localStorage.setItem("psc_user", JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false, error: null });
      return true;
    } catch (err: any) {
      const code = err?.response?.data?.code || (err?.response ? "UNKNOWN_ERROR" : "NETWORK_ERROR");
      set({ isLoading: false, error: code, isAuthenticated: false });
      return false;
    }
  },

  logout: async () => {
    try {
      const refreshToken = getStoredItem("psc_refresh_token");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken }).catch(() => {});
      }
    } finally {
      clearAllStoredItems();
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  updateWilayah: (newWilayah: string) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, wilayah: newWilayah };
      const remember = localStorage.getItem("psc_remember_me") === "1";
      setStoredItem("psc_user", JSON.stringify(updatedUser), remember);
      return { user: updatedUser };
    });
  },

  updateUser: (updatedFields: Partial<User>) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updatedFields };
      const remember = localStorage.getItem("psc_remember_me") === "1";
      setStoredItem("psc_user", JSON.stringify(updatedUser), remember);
      return { user: updatedUser };
    });
  },
}));
