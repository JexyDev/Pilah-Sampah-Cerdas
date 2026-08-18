/**
 * Component: EmptyTableState
 * Standardized Empty State component for TrashCare Data Tables & Lists
 * 
 * Features:
 * - Differentiates between "Search / Filter Empty" vs "No Data Available (Initial)"
 * - Supports automatic colSpan wrapping when rendered directly inside <tbody>
 * - Consistent typography, squircle icon badge, and action/reset button
 */

import React from "react";
import { Search, Inbox, RotateCcw, type LucideIcon } from "lucide-react";

export interface EmptyTableStateProps {
  /** Optional custom title */
  title?: string;
  /** Optional custom description */
  description?: string;
  /** Name of the entity (e.g. "Survei Baseline", "Warga", "Tempat Sampah") */
  entityName?: string;
  /** True if the empty state is triggered by a search/filter query */
  isSearch?: boolean;
  /** The current search query string (used for dynamic subtitle) */
  searchQuery?: string;
  /** Callback to clear/reset the search filter */
  onResetSearch?: () => void;
  /** Custom icon component */
  icon?: LucideIcon;
  /** Table column span if rendered inside a table <tbody> */
  colSpan?: number;
  /** Custom action button (e.g., "Tambah Data") */
  actionButton?: React.ReactNode;
  /** Additional container CSS classes */
  className?: string;
}

export const EmptyTableState: React.FC<EmptyTableStateProps> = ({
  title,
  description,
  entityName = "Data",
  isSearch = false,
  searchQuery = "",
  onResetSearch,
  icon,
  colSpan,
  actionButton,
  className = "",
}) => {
  const IconComponent = icon || (isSearch || searchQuery ? Search : Inbox);

  const displayTitle =
    title ||
    (isSearch || searchQuery
      ? "Tidak Ada Data Ditemukan"
      : `Belum Ada Data ${entityName}`);

  const displayDescription =
    description ||
    (isSearch || searchQuery
      ? searchQuery
        ? `Tidak ada ${entityName.toLowerCase()} yang cocok dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
        : `Tidak ada ${entityName.toLowerCase()} yang cocok dengan kriteria filter saat ini.`
      : `Belum ada ${entityName.toLowerCase()} yang tersimpan di dalam sistem.`);

  const content = (
    <div className={`py-12 px-6 flex flex-col items-center justify-center text-center select-none ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 mb-3 shadow-2xs">
        <IconComponent size={24} className="text-slate-400 dark:text-slate-500" />
      </div>
      <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 tracking-tight">
        {displayTitle}
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-sm mt-1 leading-relaxed">
        {displayDescription}
      </p>

      {/* Action / Reset Button */}
      {isSearch && onResetSearch && (
        <button
          type="button"
          onClick={onResetSearch}
          className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold transition-all shadow-2xs cursor-pointer border border-slate-200 dark:border-slate-700"
        >
          <RotateCcw size={13} />
          <span>Reset Pencarian</span>
        </button>
      )}

      {actionButton && <div className="mt-4">{actionButton}</div>}
    </div>
  );

  if (colSpan !== undefined) {
    return (
      <tr>
        <td colSpan={colSpan}>{content}</td>
      </tr>
    );
  }

  return content;
};

export default EmptyTableState;
