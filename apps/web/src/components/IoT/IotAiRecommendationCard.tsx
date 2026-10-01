import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  CheckCircle2,
  Cpu,
  Clock,
  BookOpen,
  Sparkles,
  Radio,
} from "lucide-react";
import type { SystemRecommendation } from "../../services/iotService";

interface IotAiRecommendationCardProps {
  recommendation: SystemRecommendation | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const IotAiRecommendationCard: React.FC<IotAiRecommendationCardProps> = ({
  recommendation,
  isLoading,
  onRefresh,
}) => {
  const getStatusBadge = (level?: string) => {
    switch (level) {
      case "BAHAYA":
        return {
          icon: AlertOctagon,
          label: "Tindakan Kritis / Darurat",
          style: "bg-rose-100 text-rose-800 border-rose-300",
          cardBorder: "border-rose-200",
          iconBg: "bg-rose-600 text-white",
        };
      case "PERINGATAN":
        return {
          icon: AlertTriangle,
          label: "Perhatian & Mitigasi Aktif",
          style: "bg-amber-100 text-amber-800 border-amber-300",
          cardBorder: "border-amber-200",
          iconBg: "bg-amber-500 text-white",
        };
      case "NORMAL":
      default:
        return {
          icon: ShieldCheck,
          label: "Kondisi Terkendali & Aman",
          style: "bg-emerald-100 text-emerald-800 border-emerald-300",
          cardBorder: "border-emerald-200",
          iconBg: "bg-emerald-600 text-white",
        };
    }
  };

  const badge = getStatusBadge(recommendation?.statusLevel);
  const StatusIcon = badge.icon;
  const isAi = Boolean(recommendation?.isAiIntegrated || (recommendation?.modelAnalisis && !recommendation.modelAnalisis.includes("Baku Mutu")));

  return (
    <div
      className={`bg-white rounded-2xl border ${badge.cardBorder} shadow-xs p-5 relative overflow-hidden transition-all`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${badge.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
            <StatusIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Rekomendasi Sistem
              </h3>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge.style}`}
              >
                {badge.label}
              </span>
              {isAi ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>Gemini AI ({recommendation?.modelAnalisis || "Aktif"})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                  <span>Standar Baku Mutu</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              {isAi
                ? "Analisis cerdas terintegrasi Google Gemini AI berdasarkan data telemetri real-time"
                : "Evaluasi dinamika gas metana berbasis standar baku mutu lingkungan dan operasional"}
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-600" : "text-slate-500"}`} />
          <span>{isLoading ? "Menganalisis..." : "Perbarui Rekomendasi"}</span>
        </button>
      </div>

      {/* Body Content */}
      {isLoading && !recommendation ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-xs font-medium">Memproses sintesis parameter dan kalkulasi sistem...</p>
        </div>
      ) : recommendation ? (
        <div className="mt-4 space-y-4">
          {/* Ringkasan Kondisi */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Ringkasan Kondisi
            </div>
            <p className="text-sm text-slate-800 leading-relaxed font-normal">
              {recommendation.ringkasanKondisi || (recommendation as any).recommendation || "Evaluasi telemetri sistem pemantauan sensor CH₄."}
            </p>
          </div>

          {/* Evaluasi Fisika-Kimia */}
          <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/60">
            <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span>Evaluasi Parameter Fisika & Kimia</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed font-normal">
              {recommendation.evaluasiFisikaKimia || (recommendation as any).recommendation || "Evaluasi baku mutu lingkungan berdasarkan data telemetri real-time."}
            </p>
          </div>

          {/* Grid: SOP & Rekomendasi Teknis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Langkah Penanganan SOP */}
            <div className="border border-slate-200/80 rounded-xl p-3.5 bg-white">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Prosedur Operasional Standar (SOP)</span>
              </h4>
              <ul className="space-y-2">
                {(recommendation.langkahPenangananSop || []).map((step, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-mono">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
                {(!recommendation.langkahPenangananSop || recommendation.langkahPenangananSop.length === 0) && (
                  <li className="text-xs text-slate-500 italic">
                    Pertahankan ventilasi udara terbuka dan ikuti jadwal pengangkutan berkala.
                  </li>
                )}
              </ul>
            </div>

            {/* Rekomendasi Teknis */}
            <div className="border border-slate-200/80 rounded-xl p-3.5 bg-white">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                <span>Tindakan Teknis Infrastruktur</span>
              </h4>
              <ul className="space-y-2">
                {(recommendation.rekomendasiTeknis || []).map((rek, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    <span className="leading-snug">{rek}</span>
                  </li>
                ))}
                {(!recommendation.rekomendasiTeknis || recommendation.rekomendasiTeknis.length === 0) && (
                  <li className="text-xs text-slate-500 italic">
                    Periksa daya baterai dan konektivitas jaringan perangkat sensor secara rutin.
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Waktu Analisis:{" "}
                  <span className="font-medium text-slate-700">
                    {new Date(recommendation.dianalisisPada || (recommendation as any).generatedAt || Date.now()).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}{" "}
                    WIB
                  </span>
                </span>
              </div>

              {recommendation.targetDevice ? (
                <div className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-mono text-[10px]">
                  <Radio className="w-3 h-3 text-emerald-600" />
                  <span>Target: {recommendation.targetDevice.name} ({recommendation.targetDevice.nodeCode})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                  <span>Target: Semua Perangkat TPS</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-medium">
                Model: <span className="font-semibold text-slate-700">{recommendation.modelAnalisis}</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                {recommendation.isCached ? "Tersimpan di Cache (5 Menit)" : "Analisis Terverifikasi"}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default IotAiRecommendationCard;
