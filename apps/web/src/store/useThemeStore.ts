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
  setTheme: (theme: "light" | "dark") => void;
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
  
  toggleTheme: () => {
    const current = get().theme;
    const nextTheme = current === "light" ? "dark" : "light";
    localStorage.setItem("trashcare-theme", nextTheme);
    applyThemeToDOM(nextTheme);
    set({ theme: nextTheme });
  },

  setTheme: (theme: "light" | "dark") => {
    localStorage.setItem("trashcare-theme", theme);
    applyThemeToDOM(theme);
    set({ theme });
  },

  initTheme: () => {
    let saved = localStorage.getItem("trashcare-theme") as "light" | "dark" | null;
    if (saved !== "dark") {
      saved = "light";
    }
    applyThemeToDOM(saved);
    set({ theme: saved });
  },
}));
