/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Component: PemantauanDanRekapitulasi (Tata Kelola Sampah)
 * - Tab 1: Grafik & Pemantauan Visual Pemilahan Sampah
 * - Tab 2: Rekapitulasi Transaksi Setoran Sampah (Audit & Log Fisik)
 */

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart3, Receipt, Activity } from "lucide-react";
import { AktivitasMonitoring } from "../SuperUser/AktivitasMonitoring";
import RekapSetoran from "../RekapSetoran/RekapSetoran";

export default function PemantauanDanRekapitulasi() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "rekap" ? "rekap" : "monitoring";
  const [activeTab, setActiveTab] = useState<"monitoring" | "rekap">(initialTab);

  const handleTabChange = (tab: "monitoring" | "rekap") => {
    setActiveTab(tab);
    setSearchParams(tab === "rekap" ? { tab: "rekap" } : {});
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Header Switcher */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 pt-4 pb-0 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-[#009966]/10 text-[#009966] flex items-center justify-center">
                <Activity size={18} />
              </span>
              Pemantauan & Rekapitulasi Tata Kelola Sampah
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Monitoring capaian pemilahan sampah real-time dan rekapitulasi audit transaksi setoran warga.
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-3 md:mb-0">
            <button
              type="button"
              onClick={() => handleTabChange("monitoring")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "monitoring"
                  ? "bg-white text-[#009966] shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 size={15} />
              Grafik & Pemantauan
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("rekap")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "rekap"
                  ? "bg-white text-[#009966] shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Receipt size={15} />
              Rekap Data Setoran
            </button>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === "monitoring" ? (
          <AktivitasMonitoring />
        ) : (
          <RekapSetoran />
        )}
      </div>
    </div>
  );
}
