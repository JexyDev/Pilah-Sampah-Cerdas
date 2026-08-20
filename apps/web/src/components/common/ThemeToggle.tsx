/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * ThemeToggle Component — Switcher Dark Mode & Light Mode
 */

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "../../store/useThemeStore";
import { useAuthStore } from "../../store/useAuthStore";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "", showLabel = false }) => {
  const { theme, toggleTheme } = useThemeStore();
  const user = useAuthStore((s) => s.user);

  const role = (user?.peran || user?.role || "").toUpperCase();
  const isDeveloper = role === "DEVELOPER" || role === "SUPER_USER";

  // Sembunyikan tombol Theme Toggle sepenuhnya jika bukan role Developer / Super User
  if (!isDeveloper) {
    return null;
  }
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-300 border border-slate-200/80 dark:border-slate-700/80 transition-all duration-200 cursor-pointer shadow-2xs active:scale-95 btn-polish ${className}`}
      title={isDark ? "Ganti ke Mode Terang (Light Mode)" : "Ganti ke Mode Gelap (Dark Mode)"}
      aria-label={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun
          size={18}
          className={`absolute transition-all duration-300 transform ${
            isDark ? "opacity-0 rotate-90 scale-0 text-amber-400" : "opacity-100 rotate-0 scale-100 text-amber-500"
          }`}
        />
        <Moon
          size={18}
          className={`absolute transition-all duration-300 transform ${
            isDark ? "opacity-100 rotate-0 scale-100 text-amber-300" : "opacity-0 -rotate-90 scale-0 text-slate-600"
          }`}
        />
      </div>
      {showLabel && (
        <span className="ml-2 text-xs font-semibold select-none">
          {isDark ? "Mode Gelap" : "Mode Terang"}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
