/**
 * Project: BERSEKA Modern Confirmation Modal Component
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React from "react";
import { AlertTriangle, Trash2, X, HelpCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi Tindakan",
  message,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  type = "danger",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const iconBgClass =
    type === "danger"
      ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
      : type === "warning"
      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
      : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60";

  const confirmBtnClass =
    type === "danger"
      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
      : type === "warning"
      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 transform transition-all animate-scaleUp text-slate-800 dark:text-slate-100">
        
        {/* Header Icon & Close Button */}
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${iconBgClass}`}>
            {type === "danger" && <Trash2 size={24} />}
            {type === "warning" && <AlertTriangle size={24} />}
            {type === "info" && <HelpCircle size={24} />}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Title & Message */}
        <div className="space-y-2 mb-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 h-11 text-xs font-extrabold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            disabled={isLoading}
            className={`px-5 h-11 text-xs font-extrabold rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2 ${confirmBtnClass} disabled:opacity-50`}
          >
            {isLoading ? (
              <span className="animate-pulse">Memproses...</span>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
