/**
 * Project: BERSEKA Dynamic Island Toast Standard
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React from "react";
import toast, { type ToastOptions } from "react-hot-toast";

interface CustomToastProps {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  visible: boolean;
  duration?: number;
}

const DynamicIslandToast: React.FC<CustomToastProps> = ({ id, message, type, visible }) => {
  React.useEffect(() => {
    if (!visible) {
      // Clean up toast record completely from memory after fade-out
      const removeTimer = setTimeout(() => {
        toast.remove(id);
      }, 300);
      return () => clearTimeout(removeTimer);
    }
  }, [id, visible]);


  return (
    <div
      className={`transform transition-all duration-300 ease-out flex items-center gap-3 px-5 py-3.5 rounded-full shadow-md border-2 backdrop-blur-md pointer-events-auto max-w-md w-auto min-w-[260px] sm:min-w-[300px] ${
        visible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-4 opacity-0 scale-95"
      } ${
        type === "success"
          ? "bg-[#e8f8f0] border-emerald-300/90 text-[#065f46] shadow-emerald-900/10"
          : type === "error"
          ? "bg-[#feeef0] border-rose-300/90 text-[#991b1b] shadow-rose-900/10"
          : type === "warning"
          ? "bg-[#fffbe6] border-amber-300/90 text-[#92400e] shadow-amber-900/10"
          : "bg-[#f0f9ff] border-sky-300/90 text-[#075985] shadow-sky-900/10"
      }`}
    >
      {/* Dynamic Solid Icon Badge */}
      <div className="flex-shrink-0 flex items-center justify-center">
        {type === "success" && (
          <div className="w-6 h-6 rounded-full bg-[#009966] flex items-center justify-center text-white shadow-xs shrink-0">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {type === "error" && (
          <div className="w-6 h-6 rounded-full bg-[#e11d48] flex items-center justify-center text-white shadow-xs shrink-0">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {type === "warning" && (
          <div className="w-6 h-6 rounded-full bg-[#d97706] flex items-center justify-center text-white shadow-xs shrink-0">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {type === "info" && (
          <div className="w-6 h-6 rounded-full bg-[#0284c7] flex items-center justify-center text-white shadow-xs shrink-0">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs sm:text-sm font-extrabold leading-snug tracking-tight">
          {message}
        </p>
      </div>
    </div>
  );
};

export const showToast = {
  success: (msg: string, opts?: ToastOptions) => {
    toast.dismiss();
    return toast.custom((t) => <DynamicIslandToast id={t.id} message={msg} type="success" visible={t.visible} />, {
      position: "top-center",
      duration: opts?.duration || 2500,
      ...opts,
    });
  },

  error: (msg: string, opts?: ToastOptions) => {
    toast.dismiss();
    return toast.custom((t) => <DynamicIslandToast id={t.id} message={msg} type="error" visible={t.visible} />, {
      position: "top-center",
      duration: opts?.duration || 3000,
      ...opts,
    });
  },

  warning: (msg: string, opts?: ToastOptions) => {
    toast.dismiss();
    return toast.custom((t) => <DynamicIslandToast id={t.id} message={msg} type="warning" visible={t.visible} />, {
      position: "top-center",
      duration: opts?.duration || 2500,
      ...opts,
    });
  },

  info: (msg: string, opts?: ToastOptions) => {
    toast.dismiss();
    return toast.custom((t) => <DynamicIslandToast id={t.id} message={msg} type="info" visible={t.visible} />, {
      position: "top-center",
      duration: opts?.duration || 2500,
      ...opts,
    });
  },

  dismiss: (id?: string) => {
    if (id) {
      toast.dismiss(id);
      setTimeout(() => toast.remove(id), 250);
    } else {
      toast.dismiss();
      setTimeout(() => toast.remove(), 250);
    }
  },
};

export default showToast;
