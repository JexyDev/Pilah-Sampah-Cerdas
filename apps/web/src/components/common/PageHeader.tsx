import type { ReactNode, FC } from "react";
import type { LucideIcon } from "lucide-react";

export interface PageHeaderProps {
  icon?: LucideIcon;
  category?: string;
  scope?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader: FC<PageHeaderProps> = ({
  icon: Icon,
  category,
  scope = "Kecamatan Coblong",
  title,
  description,
  actions,
  className = "",
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${className}`}
    >
      <div className="space-y-1">
        {(category || Icon) && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            {Icon && <Icon size={16} className="text-emerald-600 shrink-0" />}
            {category && <span>{category}</span>}
            {scope && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-normal">{scope}</span>
              </>
            )}
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-slate-500 text-xs sm:text-sm max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-stretch md:self-auto justify-end">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
