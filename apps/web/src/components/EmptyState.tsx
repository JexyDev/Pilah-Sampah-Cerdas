import React from "react";
import { BarChart2, Database, MapPin, Users, FileText, ClipboardList } from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  bar_chart: <BarChart2 className="text-slate-300" size={48} strokeWidth={1.5} />,
  database: <Database className="text-slate-300" size={48} strokeWidth={1.5} />,
  map_pin: <MapPin className="text-slate-300" size={48} strokeWidth={1.5} />,
  users: <Users className="text-slate-300" size={48} strokeWidth={1.5} />,
  file_text: <FileText className="text-slate-300" size={48} strokeWidth={1.5} />,
  clipboard: <ClipboardList className="text-slate-300" size={48} strokeWidth={1.5} />,
};

interface EmptyStateProps {
  /** Key dari ICON_MAP atau custom ReactNode */
  icon?: keyof typeof ICON_MAP | React.ReactNode;
  title?: string;
  description?: string;
  /** Komponen tambahan, misal tombol aksi */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Komponen empty state reusable untuk grafik, tabel, dan list yang belum ada datanya.
 * Tampilkan ilustrasi + teks deskriptif. Jangan tampilkan grafik kosong atau null.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "bar_chart",
  title = "Belum Ada Data",
  description = "Data akan muncul di sini setelah tersedia.",
  action,
  className = "",
}) => {
  const iconNode =
    typeof icon === "string" ? (ICON_MAP[icon] ?? ICON_MAP["bar_chart"]) : icon;

  return (
    <div
      className={`flex flex-col items-center justify-center py-14 px-6 text-center select-none ${className}`}
    >
      <div className="mb-4 opacity-70">{iconNode}</div>
      <h3 className="text-slate-600 font-semibold text-base mb-1">{title}</h3>
      <p className="text-slate-400 text-sm max-w-xs leading-relaxed">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default EmptyState;
