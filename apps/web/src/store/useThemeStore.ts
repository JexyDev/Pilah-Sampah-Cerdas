/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Zustand Store — Preferensi Tampilan Dark / Light Mode
 */

import { create } from "zustand";

interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: (localStorage.getItem("trashcare-theme") as "light" | "dark") || "light",
  
  toggleTheme: () => {
    const current = get().theme;
    const nextTheme = current === "light" ? "dark" : "light";
    localStorage.setItem("trashcare-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    set({ theme: nextTheme });
  },

  initTheme: () => {
    const saved = (localStorage.getItem("trashcare-theme") as "light" | "dark") || "light";
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    set({ theme: saved });
  },
}));
