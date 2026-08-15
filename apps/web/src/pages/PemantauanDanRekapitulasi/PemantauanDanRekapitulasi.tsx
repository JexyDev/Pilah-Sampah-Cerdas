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
import { BarChart3, Receipt } from "lucide-react";
import { AktivitasMonitoring } from "../SuperUser/AktivitasMonitoring";
import RekapSetoran from "../RekapSetoran/RekapSetoran";
import SegmentedTabs from "../../components/common/SegmentedTabs";

export default function PemantauanDanRekapitulasi() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "rekap" ? "rekap" : "monitoring";
  const [activeTab, setActiveTab] = useState<"monitoring" | "rekap">(initialTab);

  const handleTabChange = (tab: "monitoring" | "rekap") => {
    setActiveTab(tab);
    setSearchParams(tab === "rekap" ? { tab: "rekap" } : {});
  };

  return (
    <div className="space-y-6">
      {/* Top Segmented Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <SegmentedTabs
          tabs={[
            { key: "monitoring", label: "Grafik & Pemantauan Wilayah", icon: BarChart3 },
            { key: "rekap", label: "Rekapitulasi Data Setoran", icon: Receipt },
          ]}
          activeTab={activeTab}
          onChange={(tab) => handleTabChange(tab as "monitoring" | "rekap")}
        />
      </div>

      {/* Content Container */}
      <div>
        {activeTab === "monitoring" ? (
          <AktivitasMonitoring />
        ) : (
          <RekapSetoran />
        )}
      </div>
    </div>
  );
}
