/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * FormulaTooltip: Indikator rumus metrik analitik sistem
 * Standar Desain: ISO 9241 (Ergonomi & UX Interaksi), Palet Berseka #009966,
 * Tipografi Jelas & Elegan, Border Halus, Badge Standar Terstruktur.
 */

import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, Sparkles, BookOpen } from "lucide-react";

interface FormulaTooltipProps {
  title: string;
  formula: string;
  description?: string;
  isoStandard?: string;
}

export const FormulaTooltip: React.FC<FormulaTooltipProps> = ({
  title,
  formula,
  description,
  isoStandard,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [positionClass, setPositionClass] = useState<string>("bottom-full mb-2.5 left-1/2 -translate-x-1/2");
  const [arrowClass, setArrowClass] = useState<string>("top-full left-1/2 -translate-x-1/2 border-t-white dark:border-t-slate-900");

  // Penyesuaian posisi dinamis agar tidak terpotong tepi layar (ISO 9241-110 Accessibility)
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      
      // Jika terlalu mepet kanan
      if (rect.right + 180 > screenWidth) {
        setPositionClass("bottom-full mb-2.5 right-0");
        setArrowClass("top-full right-3 border-t-white dark:border-t-slate-900");
      }
      // Jika terlalu mepet kiri
      else if (rect.left < 180) {
        setPositionClass("bottom-full mb-2.5 left-0");
        setArrowClass("top-full left-3 border-t-white dark:border-t-slate-900");
      } else {
        setPositionClass("bottom-full mb-2.5 left-1/2 -translate-x-1/2");
        setArrowClass("top-full left-1/2 -translate-x-1/2 border-t-white dark:border-t-slate-900");
      }
    }
  }, [open]);

  return (
    <div 
      className="relative inline-flex items-center ml-1.5 align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-[#009966] dark:hover:text-emerald-400 hover:bg-[#e5f7ed]/60 dark:hover:bg-emerald-950/40 transition-colors focus:outline-none cursor-pointer"
        aria-label={`Rumus: ${title}`}
        aria-expanded={open}
      >
        <HelpCircle size={13} strokeWidth={2.2} />
      </button>

      {open && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`absolute z-50 ${positionClass} w-80 sm:w-92 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 text-left transition-all duration-200 animate-in fade-in-0 zoom-in-95 pointer-events-auto`}
        >
          {/* Header Popover */}
          <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Spesifikasi Metrik
              </span>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 leading-snug">
                {title}
              </h4>
            </div>

            {isoStandard && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-[#009966]/20 dark:border-emerald-800/60 text-[10px] font-bold tracking-tight shrink-0 shadow-2xs">
                <BookOpen size={10} />
                <span>{isoStandard}</span>
              </span>
            )}
          </div>

          {/* Blok Formula Matematika */}
          <div className="my-3">
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              <span>Formulasi Perhitungan</span>
              <Sparkles size={11} className="text-[#009966] dark:text-emerald-400" />
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-[11px] text-[#009966] dark:text-emerald-400 font-semibold leading-relaxed break-words select-all shadow-inner">
              {formula}
            </div>
          </div>

          {/* Keterangan Metrik */}
          {description && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pt-1 border-t border-slate-100 dark:border-slate-800/80">
              {description}
            </p>
          )}

          {/* Panah Segitiga (Arrow Drop) */}
          <div 
            className={`absolute border-6 border-transparent ${arrowClass}`}
            style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.05))" }}
          />
        </div>
      )}
    </div>
  );
};

export default FormulaTooltip;
