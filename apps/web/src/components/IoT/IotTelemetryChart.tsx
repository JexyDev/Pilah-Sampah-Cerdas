import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  Activity,
  Flame,
  Battery,
  Wifi,
} from "lucide-react";

interface TelemetryPoint {
  time: string;
  timestamp: string;
  ch4Ppm: number;
  baterai: number | null;
  rssi: number | null;
}

interface IotTelemetryChartProps {
  data: TelemetryPoint[];
  title?: string;
  heightClass?: string;
  warningThreshold?: number;
  dangerThreshold?: number;
}

type MetricKey = "ch4Ppm" | "baterai" | "rssi";

export const IotTelemetryChart: React.FC<IotTelemetryChartProps> = ({
  data,
  title = "Dinamika Telemetri Sensor Waktu Nyata",
  heightClass = "h-72",
  warningThreshold = 1000,
  dangerThreshold = 5000,
}) => {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("ch4Ppm");

  const metricsConfig = {
    ch4Ppm: {
      label: "Konsentrasi CH₄",
      unit: "ppm",
      color: "#10b981",
      icon: Flame,
      yMin: 0,
      yMax: (max: number) => Math.max(dangerThreshold * 1.1, Math.ceil(max * 1.2)),
    },
    baterai: {
      label: "Daya Baterai",
      unit: "%",
      color: "#3b82f6",
      icon: Battery,
      yMin: 0,
      yMax: 100,
    },
    rssi: {
      label: "Kekuatan Sinyal (RSSI)",
      unit: "dBm",
      color: "#8b5cf6",
      icon: Wifi,
      yMin: -120,
      yMax: -30,
    },
  };

  const current = metricsConfig[activeMetric];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
      {/* Header with Title & Metric Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 font-normal">
              Fluktuasi pembacaan parameter fisika atmosfer berdasarkan waktu pencatatan
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-xl">
          {(Object.keys(metricsConfig) as MetricKey[]).map((key) => {
            const m = metricsConfig[key];
            const Icon = m.icon;
            const isSelected = activeMetric === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveMetric(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-white text-slate-900 font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon
                  className="w-3.5 h-3.5"
                  style={{ color: isSelected ? m.color : undefined }}
                />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className={`w-full mt-4 ${heightClass}`}>
        {data.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs italic">
            <Activity className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
            Belum ada rekaman telemetri time-series pada filter ini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={current.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={current.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload as TelemetryPoint;
                    return (
                      <div className="bg-slate-900/95 backdrop-blur-xs text-white p-2.5 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                        <div className="text-[10px] text-slate-400 font-mono">
                          Waktu: {label}
                        </div>
                        <div className="font-bold flex items-center justify-between gap-3">
                          <span className="text-slate-300">{current.label}:</span>
                          <span className="font-mono text-emerald-400">
                            {payload[0].value} {current.unit}
                          </span>
                        </div>
                        {activeMetric === "ch4Ppm" && (
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between gap-3">
                            <span>Baterai: {row.baterai != null ? `${row.baterai}%` : "-"}</span>
                            <span>RSSI: {row.rssi != null ? `${row.rssi} dBm` : "-"}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {activeMetric === "ch4Ppm" && (
                <>
                  <ReferenceLine
                    y={warningThreshold}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{
                      value: `Ambang Waspada (${warningThreshold.toLocaleString("id-ID")} ppm)`,
                      fill: "#f59e0b",
                      fontSize: 10,
                      position: "insideTopRight",
                    }}
                  />
                  <ReferenceLine
                    y={dangerThreshold}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{
                      value: `Ambang Bahaya (${dangerThreshold.toLocaleString("id-ID")} ppm)`,
                      fill: "#ef4444",
                      fontSize: 10,
                      position: "insideTopRight",
                    }}
                  />
                </>
              )}

              <Area
                type="monotone"
                dataKey={activeMetric}
                stroke={current.color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#grad-${activeMetric})`}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default IotTelemetryChart;
