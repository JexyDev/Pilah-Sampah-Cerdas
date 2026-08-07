/**
 * Component: Footer (Footstep Layout Component)
 * Clean, modern, user-friendly footer for TrashCare Web App
 * Copyright: UNIKOM
 */

import React from "react";
import { Link } from "react-router-dom";
import { FileText, HelpCircle, ShieldCheck } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-1 sm:mt-2 pt-3 pb-3 border-t border-slate-200/80 bg-white/70 backdrop-blur-xs rounded-2xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium shadow-2xs transition-all">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
        <span className="font-extrabold text-slate-900 tracking-tight">
          © 2026 UNIVERSITAS KOMPUTER INDONESIA.
        </span>
        <span className="hidden sm:inline text-slate-300">•</span>
        <span className="text-slate-600 font-semibold">
          TrashCare Ecosystem — Sampah Terdata, Lingkungan Tertata
        </span>
      </div>

      <div className="flex items-center gap-4 text-slate-600 font-bold">
        <Link
          to="/panduan"
          className="hover:text-emerald-600 transition flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-emerald-50"
        >
          <FileText size={14} className="text-emerald-600" />
          <span>Buku Panduan</span>
        </Link>
        <Link
          to="/tentang"
          className="hover:text-emerald-600 transition flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-emerald-50"
        >
          <HelpCircle size={14} className="text-emerald-600" />
          <span>Tentang Aplikasi</span>
        </Link>
        <span className="text-slate-300">|</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
          <ShieldCheck size={12} />
          <span>v1.0.0</span>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
