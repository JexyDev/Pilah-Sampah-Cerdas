/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Zustand Store — Preferensi Tampilan Dark / Light Mode (Khusus Menu/Dashboard Setelah Login)
 */

import { create } from "zustand";

interface ThemeState {
  theme: "light" | "dark";
  isInsideMainLayout: boolean;
  setInsideMainLayout: (inside: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  applyTheme: () => void;
  resetThemeToLight: () => void;
  initTheme: () => void;
}

const applyThemeToDOM = (theme: "light" | "dark") => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    root.style.colorScheme = "light";
  }
};

const isPublicPath = (pathname: string) => {
  const publicPaths = ["/", "/login", "/register", "/register-mahasiswa", "/download"];
  return publicPaths.includes(pathname);
};

const getInitialLayoutState = () => {
  if (typeof window === "undefined") return false;
  return !isPublicPath(window.location.pathname);
};

const checkIsDeveloper = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const rawUser = localStorage.getItem("psc_user") || sessionStorage.getItem("psc_user");
    if (!rawUser) return false;
    const parsed = JSON.parse(rawUser);
    const role = (parsed?.peran || parsed?.role || "").toUpperCase();
    return role === "DEVELOPER" || role === "SUPER_USER";
  } catch {
    return false;
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: typeof window !== "undefined" && checkIsDeveloper() && (localStorage.getItem("trashcare-theme") as "light" | "dark") === "dark" ? "dark" : "light",
  isInsideMainLayout: getInitialLayoutState(),

  setInsideMainLayout: (inside: boolean) => {
    set({ isInsideMainLayout: inside });
    if (inside && checkIsDeveloper()) {
      applyThemeToDOM(get().theme);
    } else {
      applyThemeToDOM("light");
    }
  },

  toggleTheme: () => {
    if (!checkIsDeveloper()) {
      applyThemeToDOM("light");
      set({ theme: "light" });
      return;
    }
    const current = get().theme;
    const nextTheme = current === "light" ? "dark" : "light";
    localStorage.setItem("trashcare-theme", nextTheme);
    if (get().isInsideMainLayout) {
      applyThemeToDOM(nextTheme);
    }
    set({ theme: nextTheme });
  },

  setTheme: (theme: "light" | "dark") => {
    if (!checkIsDeveloper() && theme === "dark") {
      applyThemeToDOM("light");
      set({ theme: "light" });
      return;
    }
    localStorage.setItem("trashcare-theme", theme);
    if (get().isInsideMainLayout && checkIsDeveloper()) {
      applyThemeToDOM(theme);
    } else {
      applyThemeToDOM("light");
    }
    set({ theme });
  },

  applyTheme: () => {
    if (checkIsDeveloper()) {
      applyThemeToDOM(get().theme);
    } else {
      applyThemeToDOM("light");
    }
  },

  resetThemeToLight: () => {
    applyThemeToDOM("light");
  },

  initTheme: () => {
    if (!checkIsDeveloper()) {
      localStorage.removeItem("trashcare-theme");
      applyThemeToDOM("light");
      set({ theme: "light", isInsideMainLayout: false });
      return;
    }
    let saved = localStorage.getItem("trashcare-theme") as "light" | "dark" | null;
    if (saved !== "dark") {
      saved = "light";
    }
    const insideLayout = typeof window !== "undefined" ? !isPublicPath(window.location.pathname) : false;
    set({ theme: saved, isInsideMainLayout: insideLayout });
    if (insideLayout) {
      applyThemeToDOM(saved);
    } else {
      applyThemeToDOM("light");
    }
  },
}));

