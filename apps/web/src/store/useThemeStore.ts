/**
 * Project: TrashCare
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

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: typeof window !== "undefined" && (localStorage.getItem("trashcare-theme") as "light" | "dark") === "dark" ? "dark" : "light",
  isInsideMainLayout: false,

  setInsideMainLayout: (inside: boolean) => {
    set({ isInsideMainLayout: inside });
    if (inside) {
      applyThemeToDOM(get().theme);
    } else {
      applyThemeToDOM("light");
    }
  },

  toggleTheme: () => {
    const current = get().theme;
    const nextTheme = current === "light" ? "dark" : "light";
    localStorage.setItem("trashcare-theme", nextTheme);
    if (get().isInsideMainLayout) {
      applyThemeToDOM(nextTheme);
    }
    set({ theme: nextTheme });
  },

  setTheme: (theme: "light" | "dark") => {
    localStorage.setItem("trashcare-theme", theme);
    if (get().isInsideMainLayout) {
      applyThemeToDOM(theme);
    }
    set({ theme });
  },

  applyTheme: () => {
    applyThemeToDOM(get().theme);
  },

  resetThemeToLight: () => {
    applyThemeToDOM("light");
  },

  initTheme: () => {
    let saved = localStorage.getItem("trashcare-theme") as "light" | "dark" | null;
    if (saved !== "dark") {
      saved = "light";
    }
    // Set theme state without unconditionally forcing dark mode on public pages
    set({ theme: saved });
    if (get().isInsideMainLayout) {
      applyThemeToDOM(saved);
    } else {
      applyThemeToDOM("light");
    }
  },
}));

