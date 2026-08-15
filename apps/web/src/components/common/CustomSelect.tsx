/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Custom Interactive Dropdown Select with Max-Height Scroll
 */

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  icon?: React.ReactNode;
  label?: string;
  placeholder?: string;
  variant?: "emerald" | "slate" | "primary";
  className?: string;
  maxHeightClass?: string;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  icon,
  label,
  placeholder = "Pilih...",
  variant = "slate",
  className = "",
  maxHeightClass = "max-h-56",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const variantStyles = {
    emerald: {
      btn: "bg-emerald-50/90 border-emerald-200/90 text-emerald-900 hover:bg-emerald-100/90 hover:border-emerald-300 shadow-xs",
      label: "text-emerald-700 font-bold",
      selectedItem: "bg-emerald-100/80 text-emerald-900 font-bold shadow-2xs",
      hoverItem: "hover:bg-emerald-50 hover:text-emerald-800",
      checkIcon: "text-emerald-600",
    },
    slate: {
      btn: "bg-slate-50 border-slate-200/90 text-slate-800 hover:bg-slate-100 hover:border-slate-300 shadow-xs",
      label: "text-slate-500 font-bold",
      selectedItem: "bg-slate-100 text-slate-900 font-bold shadow-2xs",
      hoverItem: "hover:bg-slate-50 hover:text-slate-900",
      checkIcon: "text-slate-600",
    },
    primary: {
      btn: "bg-primary/5 border-primary/20 text-primary-dark hover:bg-primary/10 shadow-xs",
      label: "text-primary font-bold",
      selectedItem: "bg-primary/10 text-primary-dark font-bold shadow-2xs",
      hoverItem: "hover:bg-primary/5 hover:text-primary-dark",
      checkIcon: "text-primary",
    },
  };

  const style = variantStyles[variant] || variantStyles.slate;

  return (
    <div className={`relative inline-block text-left ${isOpen ? "z-50" : "z-10"} ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-200 select-none ${
          disabled ? "opacity-90 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-700" : `cursor-pointer ${style.btn}`
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {label && <span className={`text-[11px] uppercase tracking-wider hidden sm:inline ${style.label}`}>{label}</span>}
        <span className="truncate max-w-[160px] sm:max-w-[220px] text-left">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`flex-shrink-0 transition-transform duration-200 ${
            disabled ? "opacity-30" : isOpen ? "rotate-180 opacity-100" : "opacity-60"
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 mt-1.5 w-64 bg-white/95 backdrop-blur-lg border border-slate-200/90 rounded-2xl shadow-xl z-50 p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Scrollable Container with max height & custom scrollbar */}
          <div
            className={`overflow-y-auto ${maxHeightClass} space-y-0.5 pr-1 custom-scrollbar`}
            role="listbox"
            style={{
              maxHeight: "220px", // max height constraint (scrollable)
            }}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all duration-150 ${
                    isSelected ? style.selectedItem : `${style.hoverItem} text-slate-700`
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    {opt.icon && <span className="flex-shrink-0 opacity-80">{opt.icon}</span>}
                    <div className="truncate">
                      <div className="font-bold truncate">{opt.label}</div>
                      {opt.sublabel && <div className="text-[10px] text-slate-400 font-normal truncate">{opt.sublabel}</div>}
                    </div>
                  </div>

                  {isSelected && <Check size={14} className={`flex-shrink-0 ${style.checkIcon}`} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
