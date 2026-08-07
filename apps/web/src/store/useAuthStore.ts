/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import { create } from "zustand";
import api from "../utils/api";

export type UserRole =
  | "SUPER_USER"
  | "ADMIN_DLH"
  | "CAMAT"
  | "LURAH"
  | "RW"
  | "RT"
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
  wilayah: string;
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
  login: (phone: string, password: string) => Promise<boolean>;
  requestOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (phone: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateWilayah: (newWilayah: string) => void;
  updateUser: (updatedFields: Partial<User>) => void;
}

const normalizeRole = (role: string): UserRole => {
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
    case "RT":
      return { avatarBg: "bg-cyan-100", avatarColor: "text-cyan-700" };
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
    case "RT":
      return "RT 04 / RW 06 Dago";
    case "PETUGAS_RESIDU":
      return "RT 02 / RW 06";
    case "WARGA":
      return "RT 04 / RW 06";
    case "MAHASISWA_KKN":
      return "Area KKN Dago";
    default:
      return "Kecamatan Coblong";
  }
};

export const WEB_DISABLED_ROLES: UserRole[] = ["WARGA", "MAHASISWA_KKN", "PETUGAS_RESIDU"];

const getInitialUser = (): User | null => {
  try {
    const stored = localStorage.getItem("psc_user");
    if (!stored) return null;
    const user = JSON.parse(stored);
    if (user && WEB_DISABLED_ROLES.includes(user.peran)) {
      localStorage.removeItem("psc_user");
      localStorage.removeItem("psc_access_token");
      localStorage.removeItem("psc_refresh_token");
      return null;
    }
    if (user && (user.wilayah === "Sistem Pusat" || user.wilayah === "Dinas Lingkungan Hidup")) {
      user.wilayah = "Kecamatan Coblong";
      localStorage.setItem("psc_user", JSON.stringify(user));
    }
    return user;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  isAuthenticated: !!localStorage.getItem("psc_access_token") && (!getInitialUser() ? false : true),
  isLoading: false,
  error: null,

  login: async (phone: string, password: string) => {
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
        localStorage.removeItem("psc_access_token");
        localStorage.removeItem("psc_refresh_token");
        localStorage.removeItem("psc_user");
        set({ isLoading: false, error: "ROLE_NOT_ALLOWED_ON_WEB", isAuthenticated: false, user: null });
        return false;
      }

      // Simpan token
      localStorage.setItem("psc_access_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("psc_refresh_token", refreshToken);
      }

      // Buat user object untuk store
      const avatarConfig = getAvatarConfig(normalizedRole);
      const user: User = {
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        peran: normalizedRole,
        wilayah: getWilayahByRole(normalizedRole),
        avatar: backendUser.name.substring(0, 2).toUpperCase(),
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
        avatar: backendUser.name.substring(0, 2).toUpperCase(),
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
      const refreshToken = localStorage.getItem("psc_refresh_token");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken }).catch(() => {});
      }
    } finally {
      localStorage.removeItem("psc_access_token");
      localStorage.removeItem("psc_refresh_token");
      localStorage.removeItem("psc_user");
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  updateWilayah: (newWilayah: string) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, wilayah: newWilayah };
      localStorage.setItem("psc_user", JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },

  updateUser: (updatedFields: Partial<User>) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updatedFields };
      localStorage.setItem("psc_user", JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
}));
