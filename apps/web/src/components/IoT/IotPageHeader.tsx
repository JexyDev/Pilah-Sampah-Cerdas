import React from "react";
import { type LucideIcon } from "lucide-react";

interface IotPageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badgeText?: string;
  actions?: React.ReactNode;
}

export const IotPageHeader: React.FC<IotPageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  badgeText = "Dalam Pengembangan",
  actions,
}) => {
  return (
    <div className="mb-6">
      {/* Main Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 md:p-6">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {title}
              </h1>
              {badgeText && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300/80 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {badgeText}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed font-normal">
              {description}
            </p>
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default IotPageHeader;
