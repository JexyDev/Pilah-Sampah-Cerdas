/**
 * Component: Footer (Footstep Layout Component)
 * Clean, modern, user-friendly footer for TrashCare Web App
 * Copyright: UNIKOM
 */

import React from "react";
import { Link } from "react-router-dom";
import { HelpCircle, ShieldCheck } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-4 py-3 px-6 border border-slate-200/70 bg-white/80 backdrop-blur-md rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium shadow-2xs transition-all">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
        <span className="font-extrabold text-slate-900 tracking-tight">
          © 2026 Universitas Komputer Indonesia
        </span>
        <span className="hidden sm:inline text-slate-300">•</span>
        <span className="text-slate-600 font-semibold">
          Sampah Terdata, Lingkungan Tertata
        </span>
      </div>

      <div className="flex items-center gap-3.5 text-slate-600 font-bold">
        <Link
          to="/tentang"
          className="hover:text-emerald-600 transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-xl hover:bg-emerald-50 text-slate-600 font-semibold"
        >
          <HelpCircle size={14} className="text-emerald-600" />
          <span>Tentang Aplikasi</span>
        </Link>
        <span className="text-slate-200">|</span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200/80 shadow-2xs">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>v1.0.0</span>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
