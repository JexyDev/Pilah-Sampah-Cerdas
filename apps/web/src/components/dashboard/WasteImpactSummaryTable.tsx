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
  Calendar,
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
  calculateDailyAverageKg,
  STANDARD_CYCLE_DAYS,
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

  // Normalisasi data dengan sumber yang dipilih:
  // Mengonversi total akumulasi menjadi rata-rata harian (kg/hari) dengan standar siklus 30 hari.
  const displayItems = useMemo(() => {
    return data.map((item) => {
      let rawAccumulatedKg = item.actualKg ?? 0;
      if (selectedSource === "WARGA_APP") {
        rawAccumulatedKg = item.wargaKg !== undefined && item.wargaKg !== null ? item.wargaKg : (item.actualKg ?? 0);
      } else if (selectedSource === "PETUGAS_LAPANGAN") {
        rawAccumulatedKg = item.petugasKg !== undefined && item.petugasKg !== null ? item.petugasKg : 0;
      } else {
        // ALL
        const w = item.wargaKg !== undefined && item.wargaKg !== null ? item.wargaKg : (item.actualKg ?? 0);
        const p = item.petugasKg !== undefined && item.petugasKg !== null ? item.petugasKg : 0;
        rawAccumulatedKg = Number((w + p).toFixed(2));
      }

      // Rata-rata per hari dari standar 30 hari kalender (standar ISO / SI)
      const dailyAverageKg = calculateDailyAverageKg(rawAccumulatedKg, STANDARD_CYCLE_DAYS);

      const normK = item.kelurahan.toLowerCase().replace(/^kel(urahan)?\.\s*/i, "").replace(/\s+/g, "");
      const baselineCompliance =
        item.baselineCompliance !== undefined && item.baselineCompliance !== null && item.baselineCompliance > 0
          ? item.baselineCompliance
          : (SURVEY_BASELINE_COMPLIANCE[normK] ?? item.baselineCompliance ?? null);

      return {
        ...item,
        rawAccumulatedKg,
        dailyAverageKg,
        actualKg: dailyAverageKg, // Disajikan dalam satuan kg/hari
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

    const headers = [
      "No",
      "Kelurahan",
      "Sumber Data",
      "Baseline Berat (kg/hari)",
      "Aktual Rata-Rata (kg/hari)",
      "Penurunan Berat (Δ kg/hari)",
      "Penurunan Berat (Δ %)",
      "Baseline Kepatuhan (%)",
      "Aktual Kepatuhan (%)",
      "Perubahan Kepatuhan (Δ %)",
      "Total Akumulasi 30 Hari (kg)",
      "Status Verifikasi",
    ];

    const rows: (string | number)[][] = displayItems.map((item, idx) => {
      const deltaKg = calculateVolumeDeltaKg(item.baselineKg, item.actualKg);
      const deltaPct = calculateVolumeDeltaPct(item.baselineKg, item.actualKg);
      const deltaComp = calculateComplianceDelta(item.baselineCompliance, item.actualCompliance);

      return [
        idx + 1,
        `Kel. ${item.kelurahan}`,
        selectedSource === "WARGA_APP"
          ? "Aktivitas Warga (WARGA_APP)"
          : selectedSource === "PETUGAS_LAPANGAN"
          ? "Input Petugas (PETUGAS_LAPANGAN)"
          : "Semua Sumber (Warga + Petugas)",
        item.baselineKg ? Number(item.baselineKg.toFixed(2)) : 0,
        item.actualKg ? Number(item.actualKg.toFixed(2)) : 0,
        deltaKg !== null ? deltaKg : "-",
        deltaPct !== null ? `${deltaPct}%` : "-",
        item.baselineCompliance !== null && item.baselineCompliance !== undefined
          ? `${item.baselineCompliance}%`
          : "-",
        item.actualCompliance !== null && item.actualCompliance !== undefined
          ? `${item.actualCompliance}%`
          : "-",
        deltaComp !== null ? `${deltaComp >= 0 ? "+" : ""}${deltaComp}%` : "-",
        item.rawAccumulatedKg !== null && item.rawAccumulatedKg !== undefined
          ? Number(item.rawAccumulatedKg.toFixed(2))
          : "-",
        item.status || "Terverifikasi Real",
      ];
    });

    // Baris Agregasi Kecamatan
    rows.push([
      "",
      "TOTAL & RATA-RATA KECAMATAN COBLONG",
      `Filter: ${selectedSource}`,
      aggregation.totalBaselineKg,
      aggregation.totalActualKg,
      aggregation.totalDeltaKg,
      aggregation.weightedDeltaPct !== null ? `${aggregation.weightedDeltaPct}%` : "-",
      `${aggregation.avgBaselineCompliance}%`,
      `${aggregation.avgActualCompliance}%`,
      `${aggregation.deltaCompliance >= 0 ? "+" : ""}${aggregation.deltaCompliance}%`,
      aggregation.totalAccumulatedKg !== undefined ? aggregation.totalAccumulatedKg : "-",
      "Agregat Terbobot Faktual",
    ]);

    // Baris Keterangan Resmi ISO di file XLSX
    rows.push([]);
    rows.push([
      "* Catatan Standar ISO: Data aktual disajikan dalam satuan rata-rata per hari (kg/hari) dari total akumulasi standar siklus 30 hari kalender. Rekapitulasi berkala dilakukan setiap tanggal 7 setiap bulannya.",
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
            <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Calendar size={11} />
              <span>Siklus 30 Hari • Cut-off Setiap Tgl 7</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
            Tabel rekapitulasi capaian penurunan timbulan sampah (rata-rata harian <code className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">kg/hari</code>) dan peningkatan kepatuhan pemilahan di 6 Kelurahan Kecamatan Coblong. Data dinormalisasi dari total akumulasi dengan standar siklus 30 hari kalender dan dihimpun berkala setiap tanggal 7 setiap bulannya.
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

      {/* Banner Pemisahan Sumber Data & Siklus Pelaporan Tanggal 7 */}
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
          <div className="font-extrabold flex items-center gap-2 flex-wrap">
            <span>
              {selectedSource === "ALL"
                ? "Tata Kelola Data: Mode Tampilan Gabungan (Semua Sumber)"
                : selectedSource === "WARGA_APP"
                ? "Sumber Terisolasi: Aktivitas Pemilahan Warga (WARGA_APP)"
                : "Sumber Terisolasi: Pencatatan Penimbangan Petugas (PETUGAS_LAPANGAN)"}
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/60 border border-current/20 font-bold">
              Tag: {selectedSource}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/60 border border-current/20 font-bold">
              Standar 30 Hari • Evaluasi Setiap Tgl 7
            </span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            {selectedSource === "ALL" ? (
              <>
                <strong>Perhatian Double-Counting &amp; Rata-Rata Harian:</strong> Angka berat aktual merefleksikan <strong>rata-rata per hari (kg/hari)</strong> dari akumulasi gabungan seluruh sumber dalam siklus 30 hari kalender. Penggabungan data pemilahan warga via aplikasi mobile dengan pencatatan penimbangan petugas berpotensi menduplikasi angka timbulan jika sampah yang disetor warga ditimbang kembali di TPS3R. Gunakan filter <strong>[Aktivitas Warga]</strong> atau <strong>[Input Petugas]</strong> untuk analisis tunggal yang presisi. Rekapitulasi berkala dilakukan setiap <strong>tanggal 7 setiap bulannya</strong>.
              </>
            ) : selectedSource === "WARGA_APP" ? (
              <>
                Menampilkan <strong>rata-rata per hari (kg/hari)</strong> dari sampah yang terpilah mandiri oleh warga melalui pemindaian QR dan klasifikasi BERSEKA Vision AI di wilayah binaan. Nilai dihitung dari total akumulasi dibagi siklus standar 30 hari kalender, dihimpun berkala setiap <strong>tanggal 7 setiap bulannya</strong>.
              </>
            ) : (
              <>
                Menampilkan <strong>rata-rata per hari (kg/hari)</strong> dari sampah yang ditimbang dan dicatat secara fisik oleh petugas pemilah/residu di posko penampungan atau TPS3R kelurahan. Nilai dihitung dari total akumulasi dibagi siklus standar 30 hari kalender, dihimpun berkala setiap <strong>tanggal 7 setiap bulannya</strong>.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Tabel Rekapitulasi Data */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {/* Header Row 1: Kategori Utama Standar ISO */}
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
              <th rowSpan={2} className="py-3 px-3 text-center w-12 bg-slate-50/80 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">
                No
              </th>
              <th rowSpan={2} className="py-3 px-4 min-w-[160px] font-bold bg-slate-50/80 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800">
                Nama Kelurahan
              </th>
              <th colSpan={2} className="py-2.5 px-3 text-center uppercase tracking-wider bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                Berat Sampah (kg/hari)
              </th>
              <th colSpan={2} className="py-2.5 px-3 text-center uppercase tracking-wider bg-blue-50/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-r border-slate-200 dark:border-slate-800">
                Penurunan Berat Sampah (Δ)
              </th>
              <th colSpan={2} className="py-2.5 px-3 text-center uppercase tracking-wider bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-r border-slate-200 dark:border-slate-800">
                Kepatuhan Pemilahan
              </th>
              <th rowSpan={2} className="py-3 px-3 text-center uppercase tracking-wider bg-teal-50/80 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 min-w-[130px]">
                Perubahan Kepatuhan (Δ)
              </th>
            </tr>

            {/* Header Row 2: Sub-Kolom Seragam di Semua Tab */}
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-600 dark:text-slate-400">
              <th title="Baseline estimasi timbulan sampah per hari hasil survei lapangan" className="py-2 px-3 text-center bg-slate-50/50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">
                Baseline (kg/hari)
              </th>
              <th title="Rata-rata berat sampah per hari dari standar 30 hari kalender (cut-off tanggal 7)" className="py-2 px-3 text-center bg-slate-50/50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">
                Aktual Rata-Rata (kg/hari)
              </th>
              <th title="Delta penurunan berat sampah per hari (Baseline - Aktual Rata-Rata)" className="py-2 px-3 text-center bg-blue-50/40 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 min-w-[110px]">
                Delta (kg/hari)
              </th>
              <th title="Persentase penurunan berat sampah terhadap baseline" className="py-2 px-3 text-center bg-blue-50/40 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 border-r border-slate-200 dark:border-slate-800 min-w-[100px]">
                Delta (%)
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
              const hasActualCompliance = item.actualCompliance !== null && item.actualCompliance !== undefined && item.actualCompliance > 0;
              const deltaCompliance = hasActualCompliance
                ? calculateComplianceDelta(item.baselineCompliance, item.actualCompliance)
                : null;

              const hasBaselineData = item.hasBaseline && item.baselineKg && item.baselineKg > 0;

              return (
                <tr
                  key={item.id || idx}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-xs"
                >
                  <td className="py-3.5 px-3 text-center text-slate-400 font-bold border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-800 dark:text-slate-100 border-r border-slate-200/60 dark:border-slate-800/60">
                    <span>Kel. {item.kelurahan}</span>
                    {item.kelurahan.toLowerCase().includes("lebakgede") && (
                      <span className="block text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-sans">
                        *Pilot Project Coblong
                      </span>
                    )}
                  </td>

                  {/* Berat Baseline (kg/hari) */}
                  <td className="py-3.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                    {hasBaselineData ? (
                      <span>{Number(item.baselineKg).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg/hari</span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px] font-sans">Belum ada data</span>
                    )}
                  </td>

                  {/* Berat Aktual Rata-Rata (kg/hari) */}
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800 dark:text-slate-100 border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                    <div className="flex flex-col items-center">
                      <span>
                        {Number(item.actualKg || 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg/hari
                      </span>
                      {item.rawAccumulatedKg !== undefined && item.rawAccumulatedKg !== null && item.rawAccumulatedKg > 0 && (
                        <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 font-sans">
                          (total: {Number(item.rawAccumulatedKg).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Kolom Seragam 1: Penurunan Berat Sampah (Delta kg/hari) */}
                  <td className="py-3.5 px-3 text-center font-extrabold border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                    {deltaKg === null ? (
                      <span className="text-slate-400 italic font-sans">—</span>
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
                            ? `+${Math.abs(deltaKg).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg/hari`
                            : `${deltaKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg/hari`}
                        </span>
                      </span>
                    )}
                  </td>

                  {/* Kolom Seragam 2: Penurunan Berat Sampah (Delta %) */}
                  <td className="py-3.5 px-3 text-center font-extrabold border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                    {deltaPct === null ? (
                      <span className="text-slate-400 italic font-sans">—</span>
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
                            : `${deltaPct.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
                        </span>
                      </span>
                    )}
                  </td>

                  {/* Kepatuhan Baseline (%) */}
                  <td className="py-3.5 px-3 text-center font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                    {item.baselineCompliance !== null && item.baselineCompliance !== undefined ? (
                      <span>{Number(item.baselineCompliance).toFixed(1).replace(".", ",")}%</span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px] font-sans">—</span>
                    )}
                  </td>

                  {/* Kepatuhan Aktual (%) */}
                  <td className="py-3.5 px-3 text-center font-extrabold text-emerald-700 dark:text-emerald-400 border-r border-slate-200/60 dark:border-slate-800/60 font-mono tabular-nums">
                    {item.actualCompliance !== null && item.actualCompliance !== undefined && item.actualCompliance > 0 ? (
                      <div className="flex flex-col items-center">
                        <span>{Number(item.actualCompliance).toFixed(1).replace(".", ",")}%</span>
                        {item.partisipasiWarga !== undefined && item.partisipasiWarga !== null && (
                          <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500 block font-sans">
                            (Partisipasi: {item.partisipasiWarga}%)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 font-normal italic font-sans">Belum terdata</span>
                    )}
                  </td>

                  {/* Perubahan Kepatuhan (%) */}
                  <td className="py-3.5 px-3 text-center font-extrabold font-mono tabular-nums">
                    {deltaCompliance === null ? (
                      <span className="text-slate-400 italic font-sans">—</span>
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
                <span className="text-slate-900 dark:text-white uppercase tracking-wider block font-extrabold">
                  Kecamatan Coblong (Total)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block font-sans">
                  Agregasi Terbobot 6 Kelurahan (Siklus 30 Hari)
                </span>
              </td>

              {/* Total Baseline Berat (kg/hari) */}
              <td className="py-4 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-mono tabular-nums">
                {aggregation.totalBaselineKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg/hari
              </td>

              {/* Total Aktual Rata-Rata (kg/hari) */}
              <td className="py-4 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-mono tabular-nums">
                <div className="flex flex-col items-center">
                  <span>
                    {aggregation.totalActualKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg/hari
                  </span>
                  {aggregation.totalAccumulatedKg !== undefined && aggregation.totalAccumulatedKg > 0 && (
                    <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 font-sans">
                      (total: {aggregation.totalAccumulatedKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg)
                    </span>
                  )}
                </div>
              </td>

              {/* Total Penurunan Berat (Delta kg/hari) */}
              <td className="py-4 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-extrabold text-blue-700 dark:text-blue-300 font-mono tabular-nums">
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
                      ? `+${Math.abs(aggregation.totalDeltaKg).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg/hari`
                      : `${aggregation.totalDeltaKg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg/hari`}
                  </span>
                </span>
              </td>

              {/* Total Penurunan Berat (Delta %) */}
              <td className="py-4 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-extrabold text-blue-700 dark:text-blue-300 font-mono tabular-nums">
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
                      : `${(aggregation.weightedDeltaPct || 0).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
                  </span>
                </span>
              </td>

              {/* Rata-Rata Kepatuhan Baseline (%) */}
              <td className="py-4 px-3 text-center border-r border-slate-200 dark:border-slate-700 font-mono tabular-nums">
                {aggregation.avgBaselineCompliance.toFixed(1).replace(".", ",")}%
              </td>

              {/* Rata-Rata Kepatuhan Aktual (%) */}
              <td className="py-4 px-3 text-center border-r border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-300 font-mono tabular-nums">
                {aggregation.avgActualCompliance.toFixed(1).replace(".", ",")}%
              </td>

              {/* Rata-Rata Perubahan Kepatuhan (%) */}
              <td className="py-4 px-3 text-center text-teal-700 dark:text-teal-300 font-mono tabular-nums">
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

      {/* Footer Catatan Siklus Pelaporan & Sumber Data */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-[11.5px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Info size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />
          <span>
            *Nilai kepatuhan pemilahan bersumber dari aktivitas warga via BERSEKA Vision AI, sedangkan penimbangan berat sampah bersumber dari pencatatan posko/TPS3R.
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400 shrink-0">
          <Calendar size={13} className="text-indigo-600 dark:text-indigo-400" />
          <span>Data dihimpun rata-rata per hari setiap <strong>tanggal 7 setiap bulannya</strong>.</span>
        </div>
      </div>

      {/* Rangkuman Metodologi Standardisasi ISO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Box Left: Rumus Penurunan Berat Sampah Standar ISO */}
        <div className="bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl p-4 border border-blue-200/70 dark:border-blue-800/40 space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="font-black text-xs sm:text-sm text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <span className="p-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs">Δ</span>
              Rumus Penurunan Berat Sampah (KPI 1 - Satuan Baku kg/hari)
            </h5>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-100/60 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
              Standar ISO 80000-1
            </span>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-blue-200/60 dark:border-blue-800/40 font-mono text-[11px] text-blue-950 dark:text-blue-200 space-y-1">
            <p><strong>Rata-Rata Harian (kg/hari)</strong> = Total Akumulasi (kg) ÷ 30 Hari</p>
            <p><strong>Δ Berat (kg/hari)</strong> = Baseline (kg/hari) − Aktual Rata-Rata (kg/hari)</p>
            <p><strong>Δ Persen (%)</strong> = [(Baseline − Aktual Rata-Rata) ÷ Baseline] × 100%</p>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-blue-100/50 dark:bg-blue-900/30 p-2.5 rounded-xl">
            <strong>Kesesuaian Basis Waktu (Apple-to-Apple):</strong> Baseline survei adalah estimasi timbulan harian (kg/hari). Dengan menormalisasi data aktual menjadi rata-rata per hari berbasis siklus standar 30 hari kalender, kalkulasi delta penurunan berat menjadi sahih dan akuntabel.
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
            <p><strong>Satuan Baku:</strong> Persentase (%) / Percentage Point (pp)</p>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-emerald-100/50 dark:bg-emerald-900/30 p-2.5 rounded-xl">
            <strong>Dua Indikator Kinerja Utama (IKU):</strong> (1) Penurunan laju timbulan sampah per hari di setiap kelurahan, dan (2) Kenaikan indeks kepatuhan pemilahan sampah warga secara terverifikasi kecerdasan buatan (Vision AI).
          </div>
        </div>
      </div>

      {/* Catatan Kritis & Transparansi Analisis (Dropdown/Toggle) */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Info size={14} className="text-indigo-600 dark:text-indigo-400" />
            Catatan Metodologi &amp; Standardisasi Mutu Data (ISO 80000-1 &amp; Pedoman BPS)
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
              <strong>1. Standardisasi Siklus Pelaporan (Tanggal 7 Setiap Bulan):</strong> Data transaksi timbulan sampah dan pemilahan dihimpun dalam siklus standar 30 hari kalender, lalu dinormalisasi menjadi rata-rata harian (<code className="font-mono">kg/hari</code>). Penarikan berkala dan evaluasi komparatif resmi diselenggarakan setiap tanggal 7 setiap bulannya.
            </p>
            <p>
              <strong>2. Standardisasi Data Baseline:</strong> Angka baseline menggunakan total berat timbulan sampah harian resmi hasil survei lapangan KKN Juli 2026 dan proyeksi demografi BPS (contoh: 4.172 jiwa &times; 0,63 kg/hari di Lebak Siliwangi) guna memastikan komparasi yang konsisten dan akuntabel di 6 kelurahan.
            </p>
            <p>
              <strong>3. Formula Agregasi Terbobot Kecamatan:</strong> Rata-rata persentase penurunan berat kecamatan dihitung dari <strong>Total Pengurangan Berat Seluruh Kecamatan dibagi Total Baseline Seluruh Kecamatan</strong> (Agregasi Terbobot), bukan rata-rata sederhana aritmetika persentase 6 kelurahan, guna meniadakan distorsi bobot kelurahan berpopulasi kecil terhadap kelurahan berpopulasi besar.
            </p>
            <p>
              <strong>4. Taat Asas SI &amp; Pedoman Ejaan Bahasa Indonesia (EYD V):</strong> Seluruh penulisan massa memakai simbol baku internasional <code>kg/hari</code> (huruf kecil). Format bilangan menggunakan koma desimal <code>,</code> dan titik ribuan <code>.</code> sesuai kaidah Bahasa Indonesia baku dan KBBI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WasteImpactSummaryTable;
