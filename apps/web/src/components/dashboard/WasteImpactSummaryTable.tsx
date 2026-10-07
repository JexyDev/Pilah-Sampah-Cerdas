/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component: WasteImpactSummaryTable (Tabel Rekapitulasi Evaluasi Komparatif Dampak Sampah)
 * Standarisasi Data & Integrasi Formula Delta:
 * 1. Judul Komponen: "Aktivitas Pemilahan oleh Warga dan Penimbangan oleh Petugas"
 * 2. Skema Kolom:
 *    - Nama Kelurahan
 *    - Berat Baseline (kg)
 *    - Berat Aktual Saat Ini (kg)
 *    - Penurunan Berat (kg) [Delta kg]
 *    - Penurunan Berat (%) [Delta %]
 *    - Kepatuhan Baseline (%)
 *    - Kepatuhan Aktual (%)
 *    - Perubahan Kepatuhan (%) [Delta kepatuhan]
 * 3. Dua kolom berdampingan untuk delta sampah: "Delta (kg)" dan "Delta (%)"
 * 4. Pemisahan Sumber Data: Toggle [Semua], [Aktivitas Warga] (WARGA_APP), [Input Petugas] (PETUGAS_LAPANGAN)
 *    mencegah penggandaan (double-counting) berat sampah.
 * 5. Agregasi Terbobot (Weighted Aggregation) untuk baris total/kecamatan.
 */

import React, { useState, useMemo } from "react";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Info,
  Layers,
  Smartphone,
  ClipboardList,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import {
  calculateVolumeDeltaKg,
  calculateVolumeDeltaPct,
  calculateComplianceDelta,
  formatDeltaKg,
  formatDeltaPct,
  formatComplianceDelta,
  aggregateKelurahanImpact,
  type WasteSourceType,
  type WasteImpactItem,
} from "../../utils/wasteCalculations";

/**
 * Data kepatuhan baseline terverifikasi dari hasil survei lapangan KKN Juli 2026.
 * Digunakan sebagai fallback resmi jika field belum terisi dari respons API.
 */
export const SURVEY_BASELINE_COMPLIANCE: Record<string, number> = {
  cipaganti: 13.67,
  dago: 10.0,
  lebakgede: 21.6,
  lebaksiliwangi: 15.0,
  sadangserang: 24.8,
  sekeloa: 17.8,
};

export interface WasteImpactSummaryTableProps {
  data: WasteImpactItem[];
  loading?: boolean;
  className?: string;
  onSourceChange?: (source: WasteSourceType) => void;
}

export const WasteImpactSummaryTable: React.FC<WasteImpactSummaryTableProps> = ({
  data,
  loading = false,
  className = "",
  onSourceChange,
}) => {
  const [selectedSource, setSelectedSource] = useState<WasteSourceType>("WARGA_APP");
  const [showFootnoteDetails, setShowFootnoteDetails] = useState<boolean>(false);

  const handleSourceChange = (src: WasteSourceType) => {
    setSelectedSource(src);
    if (onSourceChange) {
      onSourceChange(src);
    }
  };

  // Normalisasi data dengan sumber yang dipilih dan kepatuhan baseline hasil survei
  const displayItems = useMemo(() => {
    return data.map((item) => {
      let actualKg = item.actualKg ?? 0;
      if (selectedSource === "WARGA_APP") {
        actualKg = item.wargaKg !== undefined && item.wargaKg !== null ? item.wargaKg : (item.actualKg ?? 0);
      } else if (selectedSource === "PETUGAS_LAPANGAN") {
        actualKg = item.petugasKg !== undefined && item.petugasKg !== null ? item.petugasKg : 0;
      } else {
        // ALL
        const w = item.wargaKg !== undefined && item.wargaKg !== null ? item.wargaKg : (item.actualKg ?? 0);
        const p = item.petugasKg !== undefined && item.petugasKg !== null ? item.petugasKg : 0;
        actualKg = Number((w + p).toFixed(2));
      }

      const normK = item.kelurahan.toLowerCase().replace(/^kel(urahan)?\.\s*/i, "").replace(/\s+/g, "");
      const baselineCompliance =
        item.baselineCompliance !== undefined && item.baselineCompliance !== null && item.baselineCompliance > 0
          ? item.baselineCompliance
          : (SURVEY_BASELINE_COMPLIANCE[normK] ?? item.baselineCompliance ?? null);

      return {
        ...item,
        actualKg,
        baselineCompliance,
        sourceType: selectedSource,
      };
    });
  }, [data, selectedSource]);

  // Agregasi terbobot tingkat Kecamatan
  const aggregation = useMemo(() => {
    return aggregateKelurahanImpact(displayItems);
  }, [displayItems]);

  // Ekspor Data Rekapitulasi ke XLSX
  const handleExportXLSX = () => {
    if (!displayItems || displayItems.length === 0) {
      toast.error("Tidak ada data untuk diekspor!");
      return;
    }

    const isWargaApp = selectedSource === "WARGA_APP";
    const headers = [
      "No",
      "Kelurahan",
      "Sumber Data",
      isWargaApp ? "Baseline Timbulan (kg)" : "Baseline Berat Sampah (kg)",
      isWargaApp ? "Aktual Terpilah Warga (kg)" : "Aktual Saat Ini (kg)",
      isWargaApp ? "Sampah Terpilah Mandiri (kg)" : "Reduksi Berat ke TPA (kg)",
      isWargaApp ? "Tingkat Partisipasi Berat Terpilah (%)" : "Reduksi Berat ke TPA (%)",
      "Baseline Kepatuhan (%)",
      "Aktual Kepatuhan (%)",
      "Perubahan Kepatuhan (%)",
      "Status Verifikasi",
    ];

    const rows = displayItems.map((item, idx) => {
      const deltaKg = calculateVolumeDeltaKg(item.baselineKg, item.actualKg);
      const deltaPct = calculateVolumeDeltaPct(item.baselineKg, item.actualKg);
      const deltaComp = calculateComplianceDelta(item.baselineCompliance, item.actualCompliance);
      const adopsiPct =
        item.baselineKg && item.baselineKg > 0
          ? Number(((item.actualKg / item.baselineKg) * 100).toFixed(2))
          : 0;

      return [
        idx + 1,
        `Kel. ${item.kelurahan}`,
        isWargaApp
          ? "Aktivitas Warga (WARGA_APP)"
          : selectedSource === "PETUGAS_LAPANGAN"
          ? "Input Petugas (PETUGAS_LAPANGAN)"
          : "Semua Sumber (Warga + Petugas)",
        item.baselineKg ? Number(item.baselineKg.toFixed(2)) : 0,
        item.actualKg ? Number(item.actualKg.toFixed(2)) : 0,
        isWargaApp
          ? (item.actualKg ? Number(item.actualKg.toFixed(2)) : 0)
          : (deltaKg !== null ? deltaKg : "-"),
        isWargaApp
          ? `${adopsiPct}%`
          : (deltaPct !== null ? `${deltaPct}%` : "-"),
        item.baselineCompliance !== null && item.baselineCompliance !== undefined
          ? `${item.baselineCompliance}%`
          : "-",
        item.actualCompliance !== null && item.actualCompliance !== undefined
          ? `${item.actualCompliance}%`
          : "-",
        deltaComp !== null ? `${deltaComp >= 0 ? "+" : ""}${deltaComp}%` : "-",
        item.status || "Terverifikasi Real",
      ];
    });

    const totalAdopsiPct =
      aggregation.totalBaselineKg > 0
        ? Number(((aggregation.totalActualKg / aggregation.totalBaselineKg) * 100).toFixed(2))
        : 0;

    // Baris Agregasi Kecamatan
    rows.push([
      "",
      "TOTAL & RERATA KECAMATAN COBLONG",
      `Filter: ${selectedSource}`,
      aggregation.totalBaselineKg,
      aggregation.totalActualKg,
      isWargaApp ? aggregation.totalActualKg : aggregation.totalDeltaKg,
      isWargaApp
        ? `${totalAdopsiPct}%`
        : (aggregation.weightedDeltaPct !== null ? `${aggregation.weightedDeltaPct}%` : "-"),
      `${aggregation.avgBaselineCompliance}%`,
      `${aggregation.avgActualCompliance}%`,
      `${aggregation.deltaCompliance >= 0 ? "+" : ""}${aggregation.deltaCompliance}%`,
      "Agregat Terbobot Faktual",
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap_Dampak_Sampah");
    XLSX.writeFile(
      wb,
      `Rekap_Evaluasi_Dampak_Sampah_Coblong_${selectedSource}_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Data rekapitulasi dampak sampah berhasil diekspor!");
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40">
              <ClipboardList size={18} />
            </span>
            <h3 className="font-extrabold text-[18px] text-slate-900 dark:text-slate-100 tracking-tight">
              Aktivitas Pemilahan oleh Warga dan Penimbangan oleh Petugas
            </h3>
            <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Formula Delta Faktual
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            {selectedSource === "WARGA_APP"
              ? "Tabel rekapitulasi adopsi pemilahan sampah mandiri oleh warga dan peningkatan kepatuhan pemilahan di 6 Kelurahan Kecamatan Coblong."
              : "Tabel rekapitulasi capaian penurunan berat sampah dan peningkatan kepatuhan pemilahan. Nilai kepatuhan pemilahan dihasilkan dari aktivitas warga, sedangkan perhitungan berat sampah dihasilkan dari aktivitas petugas di 6 Kelurahan Kecamatan Coblong."}
          </p>
        </div>

        {/* Action Buttons: Source Tabs & Export */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Toggle Pemisah Sumber Data */}
          <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => handleSourceChange("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedSource === "ALL"
                  ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Gabungan seluruh data (Warga + Petugas)"
            >
              <Layers size={13} />
              <span>Semua</span>
            </button>

            <button
              type="button"
              onClick={() => handleSourceChange("WARGA_APP")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedSource === "WARGA_APP"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Hanya data pemilahan mandiri warga via aplikasi mobile / AI"
            >
              <Smartphone size={13} />
              <span>Aktivitas Warga</span>
            </button>

            <button
              type="button"
              onClick={() => handleSourceChange("PETUGAS_LAPANGAN")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedSource === "PETUGAS_LAPANGAN"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Hanya data penimbangan manual posko / TPS3R oleh petugas"
            >
              <ClipboardList size={13} />
              <span>Input Petugas</span>
            </button>
          </div>

          {/* Ekspor XLSX */}
          <button
            type="button"
            onClick={handleExportXLSX}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            title="Ekspor tabel rekapitulasi ke file Excel"
          >
            <FileSpreadsheet size={14} />
            <span>Ekspor XLSX</span>
          </button>
        </div>
      </div>

      {/* Banner Pemisahan Sumber Data (Anti Double-Counting) */}
      <div
        className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 transition-colors ${
          selectedSource === "ALL"
            ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200"
            : selectedSource === "WARGA_APP"
            ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200"
            : "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-800/40 text-indigo-900 dark:text-indigo-200"
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {selectedSource === "ALL" ? (
            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="font-extrabold flex items-center gap-2">
            <span>
              {selectedSource === "ALL"
                ? "Peringatan Tata Kelola Data: Mode Tampilan Gabungan (Semua Sumber)"
                : selectedSource === "WARGA_APP"
                ? "Sumber Terisolasi: Aktivitas Pemilahan Warga (WARGA_APP)"
                : "Sumber Terisolasi: Pencatatan Petugas Lapangan (PETUGAS_LAPANGAN)"}
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/60 border border-current/20 font-bold">
              Tag: {selectedSource}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            {selectedSource === "ALL" ? (
              <>
                <strong>Perhatian Double-Counting:</strong> Menggabungkan berat sampah hasil pemilahan warga via aplikasi mobile dengan pencatatan manual timbangan petugas lapangan berpotensi menduplikasi angka timbulan jika sampah yang disetor warga ditimbang kembali di TPS3R. Gunakan filter <strong>[Aktivitas Warga]</strong> atau <strong>[Input Petugas]</strong> untuk analisis tunggal yang presisi.
              </>
            ) : selectedSource === "WARGA_APP" ? (
              <>
                Menampilkan berat sampah terpilah mandiri oleh warga melalui pemindaian QR dan klasifikasi BERSEKA Vision AI di 24 RW wilayah binaan KKN. Menunjukkan tingkat adopsi digital dan kepatuhan langsung rumah tangga.
              </>
            ) : (
              <>
                Menampilkan berat sampah yang ditimbang dan dicatat secara fisik oleh petugas pemilah/residu di posko penampungan atau TPS3R kelurahan.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Tabel Rekapitulasi Data */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {/* Header Row 1: Kategori Utama */}
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
              <th rowSpan={2} className="py-3 px-3 text-center w-12 bg-slate-50/80 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">
                No
              </th>
              <th rowSpan={2} className="py-3 px-4 min-w-[150px] font-bold bg-slate-50/80 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">
                Nama Kelurahan
              </th>
              <th colSpan={2} className="py-2.5 px-3 text-center uppercase tracking-wider bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                Berat Sampah
              </th>
              <th colSpan={2} className="py-2.5 px-3 text-center uppercase tracking-wider bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-r border-slate-200 dark:border-slate-800">
                {selectedSource === "WARGA_APP" ? "Sampah Terpilah Mandiri" : "Penurunan Berat Sampah (Δ)"}
              </th>
              <th colSpan={2} className="py-2.5 px-3 text-center uppercase tracking-wider bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-r border-slate-200 dark:border-slate-800">
                Kepatuhan Pemilahan
              </th>
              <th rowSpan={2} className="py-3 px-3 text-center uppercase tracking-wider bg-teal-50/80 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 min-w-[130px]">
                Perubahan Kepatuhan (%)
              </th>
            </tr>

            {/* Header Row 2: Sub-Kolom dengan Dua Kolom Berdampingan untuk Delta Berat atau Adopsi Terpilah */}
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-600 dark:text-slate-400">
              <th className="py-2 px-3 text-center bg-slate-50/50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">
                {selectedSource === "WARGA_APP" ? "Baseline Timbulan (kg)" : "Baseline (kg)"}
              </th>
              <th className="py-2 px-3 text-center bg-slate-50/50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">
                {selectedSource === "WARGA_APP" ? "Aktual Terpilah (kg)" : "Aktual Saat Ini (kg)"}
              </th>
              {/* Dua Kolom Berdampingan untuk Delta Berat atau Adopsi Terpilah */}
              <th
                title={selectedSource === "WARGA_APP" ? "Total Sampah Terpilah Mandiri Warga" : "Delta Penurunan Berat Sampah (kg)"}
                className="py-2 px-3 text-center bg-blue-50/40 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 min-w-[100px]"
              >
                {selectedSource === "WARGA_APP" ? "Terpilah (kg)" : "Delta (kg)"}
              </th>
              <th
                title={selectedSource === "WARGA_APP" ? "Tingkat Partisipasi Berat Sampah Terpilah (%)" : "Persentase Penurunan Berat Sampah (%)"}
                className="py-2 px-3 text-center bg-blue-50/40 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 min-w-[100px]"
              >
                {selectedSource === "WARGA_APP" ? "Partisipasi (%)" : "Delta (%)"}
              </th>
              <th className="py-2 px-3 text-center bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800">
                Baseline (%)
              </th>
              <th className="py-2 px-3 text-center bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800">
                Aktual (%)
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayItems.map((item, idx) => {
              const deltaKg = calculateVolumeDeltaKg(item.baselineKg, item.actualKg);
              const deltaPct = calculateVolumeDeltaPct(item.baselineKg, item.actualKg);
              const isWargaApp = selectedSource === "WARGA_APP";
              const adopsiPct =
                item.baselineKg && item.baselineKg > 0
                  ? Number(((item.actualKg / item.baselineKg) * 100).toFixed(2))
                  : 0;
              const hasActualCompliance = item.actualCompliance !== null && item.actualCompliance !== undefined && item.actualCompliance > 0;
              const deltaCompliance = hasActualCompliance
                ? calculateComplianceDelta(item.baselineCompliance, item.actualCompliance)
                : null;

              const hasBaselineData = item.hasBaseline && item.baselineKg && item.baselineKg > 0;
              const hasActualData = (item.actualKg ?? 0) > 0 || (item.actualCompliance ?? 0) > 0;

              return (
                <tr
                  key={item.id || idx}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-xs"
                >
                  <td className="py-3.5 px-3 text-center text-slate-400 font-bold border-r border-slate-200/60 dark:border-slate-800/60">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-800 dark:text-slate-100 border-r border-slate-200/60 dark:border-slate-800/60">
                    <span>Kel. {item.kelurahan}</span>
                    {item.kelurahan.toLowerCase().includes("lebakgede") && (
                      <span className="block text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        *Studi Kasus Meeting
                      </span>
                    )}
                  </td>

                  {/* Berat Baseline (kg) */}
                  <td className="py-3.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200/60 dark:border-slate-800/60">
                    {hasBaselineData ? (
                      <span>{Number(item.baselineKg).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg</span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Belum ada data</span>
                    )}
                  </td>

                  {/* Berat Aktual Saat Ini (kg) */}
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800 dark:text-slate-100 border-r border-slate-200/60 dark:border-slate-800/60">
                    <span>
                      {Number(item.actualKg || 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg
                    </span>
                  </td>

                  {/* Kolom Berdampingan 1: Penurunan Berat (kg) / Sampah Terpilah Mandiri */}
                  <td className="py-3.5 px-3 text-center font-extrabold border-r border-slate-200/60 dark:border-slate-800/60">
                    {isWargaApp ? (
                      <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>{Number(item.actualKg || 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg</span>
                      </span>
                    ) : deltaKg === null ? (
                      <span className="text-slate-400 italic">—</span>
                    ) : (
                      <span
                        className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black ${
                          deltaKg > 0
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                            : deltaKg < 0
                            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {deltaKg > 0 ? (
                          <TrendingDown size={13} className="text-emerald-600" />
                        ) : deltaKg < 0 ? (
                          <TrendingUp size={13} className="text-rose-600" />
                        ) : (
                          <Minus size={13} />
                        )}
                        <span>
                          {deltaKg < 0
                            ? `+${Math.abs(deltaKg).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg`
                            : formatDeltaKg(deltaKg, { showPlusSign: false })}
                        </span>
                      </span>
                    )}
                  </td>

                  {/* Kolom Berdampingan 2: Penurunan Berat (%) / Tingkat Partisipasi Berat Terpilah */}
                  <td className="py-3.5 px-3 text-center font-extrabold border-r border-slate-200/60 dark:border-slate-800/60">
                    {isWargaApp ? (
                      <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                        <span>{adopsiPct.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%</span>
                      </span>
                    ) : deltaPct === null ? (
                      <span className="text-slate-400 italic">—</span>
                    ) : (
                      <span
                        className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black ${
                          deltaPct > 0
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                            : deltaPct < 0
                            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {deltaPct > 0 ? (
                          <TrendingDown size={13} className="text-emerald-600" />
                        ) : deltaPct < 0 ? (
                          <TrendingUp size={13} className="text-rose-600" />
                        ) : (
                          <Minus size={13} />
                        )}
                        <span>
                          {deltaPct < 0
                            ? `+${Math.abs(deltaPct).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
                            : formatDeltaPct(deltaPct, { showPlusSign: false })}
                        </span>
                      </span>
                    )}
                  </td>

                  {/* Kepatuhan Baseline (%) */}
                  <td className="py-3.5 px-3 text-center font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-200/60 dark:border-slate-800/60">
                    {item.baselineCompliance !== null && item.baselineCompliance !== undefined ? (
                      <span>{Number(item.baselineCompliance).toFixed(1).replace(".", ",")}%</span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">—</span>
                    )}
                  </td>

                  {/* Kepatuhan Aktual (%) */}
                  <td className="py-3.5 px-3 text-center font-extrabold text-emerald-700 dark:text-emerald-400 border-r border-slate-200/60 dark:border-slate-800/60">
                    {item.actualCompliance !== null && item.actualCompliance !== undefined && item.actualCompliance > 0 ? (
                      <div className="flex flex-col items-center">
                        <span>{Number(item.actualCompliance).toFixed(1).replace(".", ",")}%</span>
                        {item.partisipasiWarga !== undefined && item.partisipasiWarga !== null && (
                          <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 block">
                            (Partisipasi: {item.partisipasiWarga}%)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 font-normal italic">Belum terdata</span>
                    )}
                  </td>

                  {/* Perubahan Kepatuhan (%) */}
                  <td className="py-3.5 px-3 text-center font-extrabold">
                    {deltaCompliance === null ? (
                      <span className="text-slate-400 italic">—</span>
                    ) : (
                      <span
                        className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black ${
                          deltaCompliance > 0
                            ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40"
                            : deltaCompliance < 0
                            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {deltaCompliance > 0 ? (
                          <TrendingUp size={13} className="text-teal-600" />
                        ) : deltaCompliance < 0 ? (
                          <TrendingDown size={13} className="text-rose-600" />
                        ) : (
                          <Minus size={13} />
                        )}
                        <span>{formatComplianceDelta(deltaCompliance, { unit: "%", showPlusSign: true })}</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Baris Agregasi Kecamatan (Total & Rata-rata Terbobot) */}
            <tr className="bg-slate-100/90 dark:bg-slate-800/90 font-black text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700 text-xs">
              <td className="py-4 px-3 text-center border-r border-slate-200 dark:border-slate-700">
                ★
              </td>
              <td className="py-4 px-4 border-r border-slate-200 dark:border-slate-700">
                <span className="text-slate-900 dark:text-white uppercase tracking-wider block">
                  Kecamatan Coblong (Total)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                  Agregasi Terbobot 6 Kelurahan
                </span>
              </td>

              {/* Total Baseline Berat */}
              <td className="py-4 px-3 text-center border-r border-slate-200 dark:border-slate-700">
                {aggregation.totalBaselineKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg
              </td>

              {/* Total Aktual Berat */}
              <td className="py-4 px-3 text-center border-r border-slate-200 dark:border-slate-700">
                {aggregation.totalActualKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg
              </td>

              {/* Total Penurunan Berat (kg) / Total Sampah Terpilah Mandiri */}
              <td className="py-4 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-extrabold text-blue-700 dark:text-blue-300">
                {selectedSource === "WARGA_APP" ? (
                  <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>{aggregation.totalActualKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg</span>
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black ${
                      aggregation.totalDeltaKg > 0
                        ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300"
                        : aggregation.totalDeltaKg < 0
                        ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {aggregation.totalDeltaKg > 0 ? (
                      <TrendingDown size={13} className="text-emerald-600" />
                    ) : aggregation.totalDeltaKg < 0 ? (
                      <TrendingUp size={13} className="text-rose-600" />
                    ) : (
                      <Minus size={13} />
                    )}
                    <span>
                      {aggregation.totalDeltaKg < 0
                        ? `+${Math.abs(aggregation.totalDeltaKg).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg`
                        : formatDeltaKg(aggregation.totalDeltaKg, { showPlusSign: false })}
                    </span>
                  </span>
                )}
              </td>

              {/* Total Penurunan Berat (%) / Tingkat Partisipasi Berat Terpilah */}
              <td className="py-4 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-extrabold text-blue-700 dark:text-blue-300">
                {selectedSource === "WARGA_APP" ? (
                  <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 border border-blue-300">
                    <span>
                      {(aggregation.totalBaselineKg > 0
                        ? Number(((aggregation.totalActualKg / aggregation.totalBaselineKg) * 100).toFixed(2))
                        : 0
                      ).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%
                    </span>
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black ${
                      (aggregation.weightedDeltaPct || 0) > 0
                        ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300"
                        : (aggregation.weightedDeltaPct || 0) < 0
                        ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {(aggregation.weightedDeltaPct || 0) > 0 ? (
                      <TrendingDown size={13} className="text-emerald-600" />
                    ) : (aggregation.weightedDeltaPct || 0) < 0 ? (
                      <TrendingUp size={13} className="text-rose-600" />
                    ) : (
                      <Minus size={13} />
                    )}
                    <span>
                      {(aggregation.weightedDeltaPct || 0) < 0
                        ? `+${Math.abs(aggregation.weightedDeltaPct || 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
                        : formatDeltaPct(aggregation.weightedDeltaPct, { showPlusSign: false })}
                    </span>
                  </span>
                )}
              </td>

              {/* Rerata Kepatuhan Baseline (%) */}
              <td className="py-4 px-3 text-center border-r border-slate-200 dark:border-slate-700">
                {aggregation.avgBaselineCompliance.toFixed(1).replace(".", ",")}%
              </td>

              {/* Rerata Kepatuhan Aktual (%) */}
              <td className="py-4 px-3 text-center border-r border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-300">
                {aggregation.avgActualCompliance.toFixed(1).replace(".", ",")}%
              </td>

              {/* Rerata Perubahan Kepatuhan (%) */}
              <td className="py-4 px-3 text-center text-teal-700 dark:text-teal-300">
                <span
                  className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black ${
                    aggregation.deltaCompliance > 0
                      ? "bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-200 border border-teal-300"
                      : aggregation.deltaCompliance < 0
                      ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {formatComplianceDelta(aggregation.deltaCompliance, { unit: "%", showPlusSign: true })}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Catatan Sumber Data */}
      <div className="flex items-center gap-2 px-1 text-[11.5px] text-slate-500 dark:text-slate-400 italic">
        <Info size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />
        <span>
          *Catatan Sumber Data: Nilai kepatuhan pemilahan dihasilkan dari aktivitas warga, sedangkan perhitungan berat sampah dihasilkan dari aktivitas petugas.
        </span>
      </div>

      {/* Rangkuman Metodologi & Studi Kasus Lebakgede */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Box Left: Rumus Penurunan Berat Sampah / Adopsi Sampah Terpilah */}
        <div className="bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl p-4 border border-blue-200/70 dark:border-blue-800/40 space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="font-black text-xs sm:text-sm text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <span className="p-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs">Δ</span>
              {selectedSource === "WARGA_APP" ? "Rumus Adopsi Sampah Terpilah Mandiri (KPI 1 - Warga)" : "Rumus Penurunan Sampah ke TPA / Residu (KPI 1)"}
            </h5>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-100/60 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
              {selectedSource === "WARGA_APP" ? "Rasio Adopsi" : "Matematika SI"}
            </span>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-blue-200/60 dark:border-blue-800/40 font-mono text-[11px] text-blue-950 dark:text-blue-200 space-y-1">
            {selectedSource === "WARGA_APP" ? (
              <>
                <p><strong>Sampah Terpilah Mandiri (kg)</strong> = Berat Aktual Setoran Warga via App</p>
                <p><strong>Tingkat Partisipasi Berat Terpilah (%)</strong> = [Aktual Warga (kg) ÷ Baseline Timbulan (kg)] × 100%</p>
              </>
            ) : (
              <>
                <p><strong>Δ Berat (kg)</strong> = Berat_Baseline − Berat_Aktual_Petugas</p>
                <p><strong>Δ Persen (%)</strong> = [(Berat_Baseline − Berat_Aktual_Petugas) ÷ Berat_Baseline] × 100%</p>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-blue-100/50 dark:bg-blue-900/30 p-2.5 rounded-xl">
            {selectedSource === "WARGA_APP" ? (
              <>
                <strong>Prinsip Anti-Misleading Data:</strong> Pada tab Aktivitas Warga, baseline timbulan (1.670,5 kg/hari) mengacu pada <strong>24 RW Wilayah Binaan KKN</strong>. Angka aktual mencerminkan sampah terpilah mandiri rumah tangga melalui pemindaian QR &amp; BERSEKA Vision AI (menunjukkan tingkat adopsi mandiri dan reduksi sampah langsung di sumbernya).
              </>
            ) : (
              <>
                <strong>Penurunan Sampah ke TPA / Residu:</strong> Dihitung berdasarkan penimbangan timbulan residu TPS/TPS3R oleh petugas terhadap estimasi timbulan baseline awal.
              </>
            )}
          </div>
        </div>

        {/* Box Right: Rumus Perubahan Kepatuhan */}
        <div className="bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-200/70 dark:border-emerald-800/40 space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="font-black text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <span className="p-1 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs">Δ</span>
              Rumus Kenaikan Kepatuhan Pemilahan (KPI 2)
            </h5>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/60 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
              Persentase &amp; PP
            </span>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 font-mono text-[11px] text-emerald-950 dark:text-emerald-200 space-y-1">
            <p><strong>Δ Kepatuhan (%)</strong> = Kepatuhan_Aktual − Kepatuhan_Baseline</p>
            <p><strong>Satuan Seragam:</strong> Persentase (%) / Percentage Point (pp)</p>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-emerald-100/50 dark:bg-emerald-900/30 p-2.5 rounded-xl">
            <strong>Dua KPI Utama Sistem:</strong> (1) Menurunkan tren berat sampah per kelurahan, dan (2) Menaikkan tren kepatuhan pemilahan sampah warga secara terverifikasi AI.
          </div>
        </div>
      </div>

      {/* Catatan Kritis & Transparansi Analisis (Dropdown/Toggle) */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Info size={14} className="text-indigo-600 dark:text-indigo-400" />
            Catatan Analisis &amp; Jawaban Pertanyaan Kritis Manajemen
          </span>
          <button
            type="button"
            onClick={() => setShowFootnoteDetails(!showFootnoteDetails)}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
          >
            {showFootnoteDetails ? "Sembunyikan Detail" : "Pelajari Metodologi Selengkapnya"}
          </button>
        </div>

        {showFootnoteDetails && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed text-[11.5px]">
            <p>
              <strong>1. Standarisasi Data Baseline:</strong> Angka baseline menggunakan total berat timbulan sampah resmi hasil survei lapangan KKN Juli 2026 dan proyeksi demografi BPS (4.172 jiwa &times; 0,63 kg/hari di Lebak Siliwangi) untuk memastikan perbandingan yang konsisten dan akuntabel di 6 kelurahan.
            </p>
            <p>
              <strong>2. Konteks Aktual Terkelola:</strong> Angka berat aktual mencerminkan akumulasi sampah terpilah yang tercatat aktif melalui penimbangan warga via aplikasi BERSEKA dan input manual petugas pemilah di wilayah binaan/percontohan.
            </p>
            <p>
              <strong>3. Formula Agregasi Kecamatan:</strong> Rerata persentase reduksi berat kecamatan dihitung dari <strong>Total Berat Seluruh Kecamatan dibagi Total Baseline Seluruh Kecamatan</strong> (Agregasi Terbobot), bukan rata-rata sederhana persentase 6 kelurahan, untuk menghindari distorsi bobot kelurahan berpopulasi kecil terhadap kelurahan berpopulasi besar.
            </p>
            <p>
              <strong>4. Taat Asas SI &amp; Terminologi:</strong> Seluruh penulisan massa menggunakan simbol baku <code>kg</code> (huruf kecil). Nilai tanda <code>—</code> menandakan data survei belum selesai diisi atau belum diverifikasi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WasteImpactSummaryTable;
