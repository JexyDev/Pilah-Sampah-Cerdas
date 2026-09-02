import type { LucideIcon } from "lucide-react";

export interface TabItem<T extends string = string> {
  key: T;
  label: string;
  icon?: LucideIcon;
  badge?: number;
}

export interface SegmentedTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
}

export function SegmentedTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: SegmentedTabsProps<T>) {
  return (
    <div
      className={`bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-1 overflow-x-auto scrollbar-none max-w-full ${className}`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              isActive
                ? "bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/60"
            }`}
          >
            {Icon && (
              <Icon
                size={14}
                className={isActive ? "text-emerald-600 dark:text-emerald-400 shrink-0" : "text-slate-400 shrink-0"}
              />
            )}
            <span className="truncate">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 ? (
              <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full leading-none shrink-0">
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedTabs;
