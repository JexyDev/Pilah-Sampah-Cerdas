/**
 * Component: Pagination
 * Standardized Pagination component for BERSEKA Data Tables
 * 
 * Features:
 * - Items per page selector ("Tampilkan 10 data per halaman")
 * - Item range info ("Menampilkan 1–10 dari 26 data")
 * - Numbered page buttons with active state matching BERSEKA theme
 * - Chevron Previous/Next navigation
 */

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
  className?: string;
  compact?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
  className = "",
  compact = false,
}) => {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  // Generate array of page numbers with ellipsis for large page counts
  const getPageNumbers = (): (number | string)[] => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 3) {
      return [1, 2, 3, 4, "...", safeTotalPages];
    }

    if (safeCurrentPage >= safeTotalPages - 2) {
      return [
        1,
        "...",
        safeTotalPages - 3,
        safeTotalPages - 2,
        safeTotalPages - 1,
        safeTotalPages,
      ];
    }

    return [
      1,
      "...",
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      "...",
      safeTotalPages,
    ];
  };

  const startItem =
    totalItems === 0
      ? 0
      : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItem =
    totalItems !== undefined
      ? Math.min(safeCurrentPage * itemsPerPage, totalItems)
      : safeCurrentPage * itemsPerPage;

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between gap-2 py-3 px-4 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-800 font-sans text-xs text-slate-600 dark:text-slate-300 shrink-0 select-none ${className}`}
      >
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
          {totalItems !== undefined ? (
            <span>
              <strong className="text-slate-800 dark:text-slate-100">{startItem}–{endItem}</strong> / <strong className="text-emerald-700 dark:text-emerald-400">{totalItems}</strong>
            </span>
          ) : (
            <span>Hal <strong className="text-slate-800 dark:text-slate-100">{safeCurrentPage}</strong> dari {safeTotalPages}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage <= 1}
            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-300 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:hover:text-slate-600 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            {safeCurrentPage}/{safeTotalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage >= safeTotalPages}
            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-300 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:hover:text-slate-600 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
            title="Halaman Selanjutnya"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3.5 px-4 bg-white dark:bg-slate-900 border-t border-slate-100/80 dark:border-slate-800 rounded-b-2xl font-sans text-xs text-slate-600 dark:text-slate-300 ${className}`}
    >
      {/* Left: Items Per Page Selector */}
      <div className="flex items-center gap-2 font-medium">
        {onItemsPerPageChange && (
          <>
            <span className="text-slate-500 dark:text-slate-400">Tampilkan</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer transition"
            >
              {itemsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-slate-500 dark:text-slate-400">data per halaman</span>
          </>
        )}
      </div>

      {/* Right: Info & Page Buttons */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-end">
        {totalItems !== undefined && (
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Menampilkan{" "}
            <span className="font-extrabold text-slate-800 dark:text-slate-100">
              {startItem}–{endItem}
            </span>{" "}
            dari{" "}
            <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
              {totalItems} data
            </span>
          </span>
        )}

        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage <= 1}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-emerald-300 dark:hover:border-emerald-700/50 hover:text-emerald-700 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-300 flex items-center justify-center disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:hover:border-slate-200 disabled:hover:text-slate-600 disabled:cursor-not-allowed transition shadow-2xs"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Mobile Current Page Indicator (xs screens) */}
          <div className="flex sm:hidden items-center px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-bold font-mono text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            Hal {safeCurrentPage} / {safeTotalPages}
          </div>

          {/* Tablet & Desktop Numbered Buttons */}
          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((p, idx) => {
              if (typeof p === "string") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold select-none"
                  >
                    ...
                  </span>
                );
              }

              const isCurrent = p === safeCurrentPage;

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-lg font-extrabold transition shadow-2xs cursor-pointer ${
                    isCurrent
                      ? "bg-emerald-600 text-white border border-emerald-600 shadow-emerald-600/20"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-emerald-300 dark:hover:border-emerald-700/50 hover:text-emerald-700 dark:hover:text-emerald-400"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage >= safeTotalPages}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-emerald-300 dark:hover:border-emerald-700/50 hover:text-emerald-700 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-300 flex items-center justify-center disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:hover:border-slate-200 disabled:hover:text-slate-600 disabled:cursor-not-allowed transition shadow-2xs"
            title="Halaman Selanjutnya"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
