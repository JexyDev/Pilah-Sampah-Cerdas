import React, { useState } from "react";
import {
  RotateCcw,
  type LucideIcon,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from "recharts";

export interface SparklinePoint {
  time: string;
  value: number;
}

interface SensorFlipCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  statusBadge: {
    label: string;
    variant: "success" | "warning" | "danger" | "info" | "neutral";
  };
  trend?: {
    direction: "up" | "down" | "flat";
    value: string;
  };
  sparklineData?: SparklinePoint[];
  colorScheme: "emerald" | "amber" | "rose" | "blue" | "indigo";
  statsBack?: {
    avg?: string | number;
    max?: string | number;
    min?: string | number;
    standardNote?: string;
    parameterRef?: string;
  };
}

export const SensorFlipCard: React.FC<SensorFlipCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  statusBadge,
  trend,
  sparklineData = [],
  colorScheme,
  statsBack,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Palette mapper
  const colorMap = {
    emerald: {
      bgLinear: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      iconBg: "bg-emerald-100 text-emerald-700",
      accent: "#10b981",
      badge: {
        success: "bg-emerald-100 text-emerald-800 border-emerald-300",
        warning: "bg-amber-100 text-amber-800 border-amber-300",
        danger: "bg-rose-100 text-rose-800 border-rose-300",
        info: "bg-blue-100 text-blue-800 border-blue-300",
        neutral: "bg-slate-100 text-slate-700 border-slate-300",
      },
    },
    amber: {
      bgLinear: "from-amber-500/10 via-amber-500/5 to-transparent",
      iconBg: "bg-amber-100 text-amber-700",
      accent: "#f59e0b",
      badge: {
        success: "bg-emerald-100 text-emerald-800 border-emerald-300",
        warning: "bg-amber-100 text-amber-800 border-amber-300",
        danger: "bg-rose-100 text-rose-800 border-rose-300",
        info: "bg-blue-100 text-blue-800 border-blue-300",
        neutral: "bg-slate-100 text-slate-700 border-slate-300",
      },
    },
    rose: {
      bgLinear: "from-rose-500/10 via-rose-500/5 to-transparent",
      iconBg: "bg-rose-100 text-rose-700",
      accent: "#ef4444",
      badge: {
        success: "bg-emerald-100 text-emerald-800 border-emerald-300",
        warning: "bg-amber-100 text-amber-800 border-amber-300",
        danger: "bg-rose-100 text-rose-800 border-rose-300",
        info: "bg-blue-100 text-blue-800 border-blue-300",
        neutral: "bg-slate-100 text-slate-700 border-slate-300",
      },
    },
    blue: {
      bgLinear: "from-blue-500/10 via-blue-500/5 to-transparent",
      iconBg: "bg-blue-100 text-blue-700",
      accent: "#3b82f6",
      badge: {
        success: "bg-emerald-100 text-emerald-800 border-emerald-300",
        warning: "bg-amber-100 text-amber-800 border-amber-300",
        danger: "bg-rose-100 text-rose-800 border-rose-300",
        info: "bg-blue-100 text-blue-800 border-blue-300",
        neutral: "bg-slate-100 text-slate-700 border-slate-300",
      },
    },
    indigo: {
      bgLinear: "from-indigo-500/10 via-indigo-500/5 to-transparent",
      iconBg: "bg-indigo-100 text-indigo-700",
      accent: "#6366f1",
      badge: {
        success: "bg-emerald-100 text-emerald-800 border-emerald-300",
        warning: "bg-amber-100 text-amber-800 border-amber-300",
        danger: "bg-rose-100 text-rose-800 border-rose-300",
        info: "bg-blue-100 text-blue-800 border-blue-300",
        neutral: "bg-slate-100 text-slate-700 border-slate-300",
      },
    },
  };

  const scheme = colorMap[colorScheme] || colorMap.emerald;
  const gradientId = `grad-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  return (
    <div
      className="relative w-full h-56 transition-transform duration-500 select-none"
      style={{ perspective: "1000px" }}
    >
      <div
        className="w-full h-full relative transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* FRONT SIDE */}
        <div
          className={`absolute inset-0 w-full h-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-slate-300 hover:shadow-md ${
            isFlipped ? "opacity-0 pointer-events-none invisible" : "opacity-100 visible"
          }`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {/* Subtle gradient splash */}
          <div
            className={`absolute top-0 right-0 w-44 h-44 bg-linear-to-br ${scheme.bgLinear} rounded-bl-full pointer-events-none -z-0`}
          />

          {/* Top row: Title + Icon + Flip Button */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl ${scheme.iconBg} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  {title}
                </span>
                <span
                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${scheme.badge[statusBadge.variant] || scheme.badge.neutral} mt-0.5`}
                >
                  {statusBadge.label}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFlipped(true)}
              aria-label="Lihat detail statistik"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Balik kartu untuk rincian statistik"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Middle row: Big Value + Trend */}
          <div className="relative z-10 my-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                {value}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-500">
                {unit}
              </span>
            </div>

            {trend && (
              <div className="flex items-center gap-1 mt-0.5 text-[11px] font-medium text-slate-500">
                {trend.direction === "up" && (
                  <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                )}
                {trend.direction === "down" && (
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                )}
                {trend.direction === "flat" && (
                  <Minus className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{trend.value}</span>
              </div>
            )}
          </div>

          {/* Bottom row: Sparkline chart */}
          <div className="relative z-10 w-full h-14 -mb-1">
            {sparklineData && sparklineData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={scheme.accent} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={scheme.accent} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900/90 text-white text-[10px] px-2 py-1 rounded-md shadow-md backdrop-blur-xs font-mono">
                            {payload[0].value} {unit}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={scheme.accent}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#${gradientId})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-400 italic">
                Data tren telemetri belum terkumpul
              </div>
            )}
          </div>
        </div>

        {/* BACK SIDE */}
        <div
          className={`absolute inset-0 w-full h-full bg-white text-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-slate-300 hover:shadow-md ${
            !isFlipped ? "opacity-0 pointer-events-none invisible" : "opacity-100 visible"
          }`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Back Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg ${scheme.iconBg} flex items-center justify-center shrink-0`}>
                <Info className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Rincian Parameter & Statistik
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFlipped(false)}
              aria-label="Kembali ke grafik"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 my-1 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Rata-rata</div>
              <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                {statsBack?.avg ?? "-"}
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Tertinggi</div>
              <div className="text-sm font-bold text-rose-600 font-mono mt-0.5">
                {statsBack?.max ?? "-"}
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Terendah</div>
              <div className="text-sm font-bold text-emerald-600 font-mono mt-0.5">
                {statsBack?.min ?? "-"}
              </div>
            </div>
          </div>

          {/* Parameter Baku Mutu Note */}
          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 text-[11px] text-slate-600 leading-snug">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>{statsBack?.parameterRef || "Standar Baku Mutu"}</span>
            </div>
            <p className="text-slate-500 mt-0.5 line-clamp-2">
              {statsBack?.standardNote ||
                "Konsentrasi gas metana terukur pada sensor semikonduktor SnO2 dengan kalibrasi berkala."}
            </p>
          </div>

          {/* Return footer button */}
          <button
            type="button"
            onClick={() => setIsFlipped(false)}
            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-all text-center cursor-pointer shadow-2xs"
          >
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>
  );
};

export default SensorFlipCard;
