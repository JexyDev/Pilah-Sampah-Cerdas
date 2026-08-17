/**
 * Project: TrashCare Modern Confirmation Modal Component
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
      ? "bg-rose-100 text-rose-600 border-rose-200"
      : type === "warning"
      ? "bg-amber-100 text-amber-600 border-amber-200"
      : "bg-emerald-100 text-emerald-600 border-emerald-200";

  const confirmBtnClass =
    type === "danger"
      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
      : type === "warning"
      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-scaleUp">
        
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
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Title & Message */}
        <div className="space-y-2 mb-6">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 h-11 text-xs font-extrabold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
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
