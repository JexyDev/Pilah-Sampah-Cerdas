import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileCheck,
  Percent,
  Weight,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Edit3,
  Sprout,
  Download,
  Calendar,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import { evaluasiDampakApiService } from "../../services/evaluasiDampakService";
import type { BaselineData, EndlineData, KomparasiData } from "../../services/evaluasiDampakService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import EditSurveiModal from "../SuperUser/EditSurveiModal";

type TabType = "BASELINE" | "ENDLINE" | "KOMPARASI";

export const EvaluasiDampakKkn: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("BASELINE");
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [baselineList, setBaselineList] = useState<BaselineData[]>([]);
  const [endlineList, setEndlineList] = useState<EndlineData[]>([]);
  const [komparasiList, setKomparasiList] = useState<KomparasiData[]>([]);

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<"SEMUA" | "BULAN_INI" | "30_HARI" | "CUSTOM">("SEMUA");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Validation modal state
  const [validatingItem, setValidatingItem] = useState<{ id: number; type: "BASELINE" | "ENDLINE" } | null>(null);
  const [validationNote, setValidationNote] = useState("");

  // Edit survey modal state
  const [selectedEditKelurahanId, setSelectedEditKelurahanId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isValidator = ["SUPER_USER", "PANITIA_TASKFORCE"].includes(user?.peran || "");
  const canEdit = ["SUPER_USER", "PANITIA_TASKFORCE"].includes(user?.peran || "");

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "BASELINE") {
        const data = await evaluasiDampakApiService.getBaseline();
        setBaselineList(data);
      } else if (activeTab === "ENDLINE") {
        const data = await evaluasiDampakApiService.getEndline();
        setEndlineList(data);
      } else if (activeTab === "KOMPARASI") {
        const data = await evaluasiDampakApiService.getKomparasi();
        setKomparasiList(data);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Gagal memuat data evaluasi dampak");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleExportData = () => {
    let sourceData: any[] = [];
    if (activeTab === "BASELINE") sourceData = baselineList;
    else if (activeTab === "ENDLINE") sourceData = endlineList;
    else sourceData = komparasiList;

    if (!sourceData || sourceData.length === 0) {
      toast.error("Tidak ada data evaluasi dampak untuk diekspor!");
      return;
    }

    // Filter by period if date exists
    let filtered = [...sourceData];
    const now = new Date();

    if (exportPeriod === "BULAN_INI") {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      filtered = filtered.filter((item) => {
        if (!item.tanggalSurvei) return true;
        const d = new Date(item.tanggalSurvei);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    } else if (exportPeriod === "30_HARI") {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((item) => {
        if (!item.tanggalSurvei) return true;
        const d = new Date(item.tanggalSurvei);
        return d >= past30 && d <= now;
      });
    } else if (exportPeriod === "CUSTOM") {
      if (!startDate || !endDate) {
        toast.error("Harap tentukan tanggal mulai dan tanggal selesai!");
        return;
      }
      const s = new Date(startDate);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      filtered = filtered.filter((item) => {
        if (!item.tanggalSurvei) return true;
        const d = new Date(item.tanggalSurvei);
        return d >= s && d <= e;
      });
    }

    if (filtered.length === 0) {
      toast.error("Data tidak ditemukan pada periode waktu yang dipilih!");
      return;
    }

    let csvContent = "";
    if (activeTab === "BASELINE" || activeTab === "ENDLINE") {
      const headers = [
        "No",
        "Kelurahan",
        "Kecamatan",
        "Tanggal Survei",
        "Enumerator",
        "Rumah Memilah",
        "Total Rumah",
        "Tingkat Pemilahan (%)",
        "Volume Organik (kg/hari)",
        "Volume Anorganik (kg/hari)",
        "Volume Residu (kg/hari)",
        "Total Volume (kg/hari)",
        "Status Validasi",
      ];
      const rows = filtered.map((item, idx) => [
        idx + 1,
        `"${item.namaKelurahan || "-"}"`,
        `"${item.kecamatan || "-"}"`,
        `"${item.tanggalSurvei ? new Date(item.tanggalSurvei).toLocaleDateString("id-ID") : "-"}"`,
        `"${item.enumerator || "-"}"`,
        item.pemilahanSampah?.jumlahRumahMemilah ?? 0,
        item.pemilahanSampah?.totalJumlahRumahDiRw ?? 0,
        item.pemilahanSampah?.persentasePemilahan ?? 0,
        item.volumeSampah?.organikKgPerHari ?? 0,
        item.volumeSampah?.anorganikKgPerHari ?? 0,
        item.volumeSampah?.residuKgPerHari ?? 0,
        item.volumeSampah?.totalVolumeKgPerHari ?? 0,
        `"${item.statusValidasi || "-"}"`,
      ]);
      csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    } else {
      const headers = [
        "No",
        "Kelurahan",
        "Baseline Pemilahan (%)",
        "Endline Pemilahan (%)",
        "Delta Pemilahan (%)",
        "Baseline Vol (kg/hari)",
        "Endline Vol (kg/hari)",
        "Reduksi Residu (kg/hari)",
        "Status Dampak",
      ];
      const rows = filtered.map((item, idx) => [
        idx + 1,
        `"${item.namaKelurahan || "-"}"`,
        item.baseline?.persentasePemilahan ?? 0,
        item.endline?.persentasePemilahan ?? 0,
        item.delta?.persentasePemilahan ?? 0,
        item.baseline?.totalVolumeKgPerHari ?? 0,
        item.endline?.totalVolumeKgPerHari ?? 0,
        item.delta?.residuKgPerHari ?? 0,
        `"${item.statusEvaluasi || "TERVERIFIKASI"}"`,
      ]);
      csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Evaluasi_Dampak_KKN_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExportModalOpen(false);
    toast.success(`Data ${activeTab.toLowerCase()} berhasil diekspor!`);
  };

  const handleValidate = async (status: "VALID" | "REVISI") => {
    if (!validatingItem) return;
    try {
      if (validatingItem.type === "BASELINE") {
        await evaluasiDampakApiService.validateBaseline(validatingItem.id, status, validationNote);
        toast.success(`Data baseline berhasil di-set: ${status}`);
      } else {
        await evaluasiDampakApiService.validateEndline(validatingItem.id, status, validationNote);
        toast.success(`Data endline berhasil di-set: ${status}`);
      }
      setValidatingItem(null);
      setValidationNote("");
      loadData();
    } catch (err) {
      toast.error("Gagal memproses validasi");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VALID":
        return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit"><CheckCircle size={12} /> Valid</span>;
      case "REVISI":
        return <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit"><XCircle size={12} /> Perlu Revisi</span>;
      default:
        return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit"><Clock size={12} /> Menunggu</span>;
    }
  };

  const filteredBaseline = baselineList.filter(item => 
    item.namaKelurahan.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredEndline = endlineList.filter(item => 
    item.namaKelurahan.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredKomparasi = komparasiList.filter(item => 
    item.namaKelurahan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold w-fit mb-2 border border-indigo-100">
            <BarChart3 size={14} /> Perubahan dan Dampak KKN
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Perubahan dan Dampak Program KKN
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring komparasi evaluasi baseline (awal) vs endline (akhir) program KKN di seluruh kelurahan binaan.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95"
          >
            <Download size={15} />
            Ekspor Data
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center w-full md:w-auto p-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
          <button
            onClick={() => setActiveTab("BASELINE")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "BASELINE"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            Data Baseline
          </button>
          <button
            onClick={() => setActiveTab("ENDLINE")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "ENDLINE"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            Data Endline
          </button>
          <button
            onClick={() => setActiveTab("KOMPARASI")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "KOMPARASI"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            Perubahan dan Dampak
          </button>
        </div>

        <div className="relative w-full md:w-64 px-2 pb-2 md:pb-0 md:pr-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 md:translate-y-[-50%] text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari kelurahan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
          <p className="text-sm font-medium text-slate-500">Memuat data survei...</p>
        </div>
      ) : activeTab === "BASELINE" || activeTab === "ENDLINE" ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 font-bold">Kelurahan</th>
                  <th className="px-4 py-3 font-bold">Tgl Survei</th>
                  <th className="px-4 py-3 font-bold">Pemilahan</th>
                  <th className="px-4 py-3 font-bold">Vol. Sampah/Hari</th>
                  <th className="px-4 py-3 font-bold">Bank Sampah</th>
                  <th className="px-4 py-3 font-bold">Status Validasi</th>
                  <th className="px-4 py-3 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800">
                {(activeTab === "BASELINE" ? filteredBaseline : filteredEndline).map((item: any) => (
                  <tr key={item.kelurahanId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                      Kel. {item.namaKelurahan}
                      <span className="block text-[10px] text-slate-400 font-medium">Kec. {item.kecamatan || "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {item.tanggalSurvei ? new Date(item.tanggalSurvei).toLocaleDateString("id-ID") : "-"}
                      <span className="block text-[10px] text-slate-400">Oleh: {item.enumerator || "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {item.pemilahanSampah?.persentasePemilahan !== null && item.pemilahanSampah?.persentasePemilahan !== undefined
                        ? `${(item.pemilahanSampah.persentasePemilahan * 100).toFixed(1)}%` 
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {item.volumeSampah?.totalVolumeKgPerHari ? `${item.volumeSampah.totalVolumeKgPerHari} Kg` : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {item.bankSampahPengolahan?.bankSampahAktif !== null && item.bankSampahPengolahan?.bankSampahAktif !== undefined
                        ? `${item.bankSampahPengolahan.bankSampahAktif} Aktif` 
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(item.statusValidasi)}
                      {item.validasiDpl && (
                        <span className="block text-[10px] text-slate-400 mt-1 truncate max-w-[120px]">
                          DPL: {item.validasiDpl.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex items-center justify-center gap-2">
                      {canEdit && activeTab === "BASELINE" && (
                        <button
                          onClick={() => {
                            setSelectedEditKelurahanId(item.kelurahanId);
                            setIsEditModalOpen(true);
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-emerald-200 cursor-pointer shadow-2xs"
                          title="Edit Data Baseline"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                      )}
                      {isValidator && item.statusValidasi !== "VALID" && (
                        <button
                          onClick={() => setValidatingItem({ id: item.kelurahanId, type: activeTab })}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-indigo-200 cursor-pointer shadow-2xs"
                        >
                          <FileCheck size={14} /> Validasi
                        </button>
                      )}
                      {item.statusValidasi === "VALID" && isValidator && (
                        <button
                          onClick={() => setValidatingItem({ id: item.kelurahanId, type: activeTab })}
                          className="bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 cursor-pointer shadow-2xs"
                        >
                           Revisi
                        </button>
                      )}
                      {!canEdit && !isValidator && (
                        <span className="text-slate-400 text-xs italic">Read-Only</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(activeTab === "BASELINE" ? filteredBaseline : filteredEndline).length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertTriangle className="text-amber-400 mb-2" size={32} />
                        Belum ada data {activeTab === "BASELINE" ? "baseline" : "endline"} untuk kelurahan yang dicari.
                        {activeTab === "ENDLINE" && <span className="text-xs text-slate-400 block mt-1">Mahasiswa perlu mengisi survei akhir (endline).</span>}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB KOMPARASI DAMPAK */
        <div className="space-y-6">
          {/* 3 Delta Summary KPI Cards */}
          {(() => {
            const completedItems = komparasiList.filter((k) => k.hasEndline);
            const avgDeltaPemilahan =
              completedItems.length > 0
                ? completedItems.reduce((acc, curr) => acc + (curr.pemilahan?.delta || 0), 0) /
                  completedItems.length
                : 0;
            const avgDeltaVolume =
              completedItems.length > 0
                ? completedItems.reduce((acc, curr) => acc + (curr.volumeSampah?.delta || 0), 0) /
                  completedItems.length
                : 0;
            const avgDeltaKegiatan =
              completedItems.length > 0
                ? completedItems.reduce(
                    (acc, curr) => acc + (curr.kegiatanPemanfaatan?.delta || 0),
                    0
                  ) / completedItems.length
                : 0;

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Delta 1: Kepatuhan Pemilahan */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold text-indigo-600 tracking-wider">
                      1. Δ Kepatuhan Pemilahan
                    </span>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Percent size={18} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                        {avgDeltaPemilahan > 0 ? "+" : ""}
                        {(avgDeltaPemilahan * 100).toFixed(1)}%
                      </h3>
                      <span
                        className={`text-xs font-bold flex items-center gap-0.5 ${
                          avgDeltaPemilahan >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {avgDeltaPemilahan >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        Rata-rata
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Perubahan persentase pemilahan sampah warga (Baseline vs Endline).
                    </p>
                  </div>
                </div>

                {/* Delta 2: Volume Sampah */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold text-rose-600 tracking-wider">
                      2. Δ Volume Sampah
                    </span>
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                      <Weight size={18} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                        {avgDeltaVolume > 0 ? "+" : ""}
                        {avgDeltaVolume.toFixed(1)} Kg
                      </h3>
                      <span
                        className={`text-xs font-bold flex items-center gap-0.5 ${
                          avgDeltaVolume <= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {avgDeltaVolume <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                        {avgDeltaVolume <= 0 ? "Tereduksi" : "Bertambah"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Perubahan timbulan sampah total per hari yang dibuang.
                    </p>
                  </div>
                </div>

                {/* Delta 3: Kegiatan Pemanfaatan Sampah */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold text-emerald-600 tracking-wider">
                      3. Δ Kegiatan Pemanfaatan
                    </span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Sprout size={18} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                        {avgDeltaKegiatan > 0 ? "+" : ""}
                        {avgDeltaKegiatan.toFixed(1)} Kegiatan
                      </h3>
                      <span
                        className={`text-xs font-bold flex items-center gap-0.5 ${
                          avgDeltaKegiatan >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {avgDeltaKegiatan >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        Fasilitas Aktif
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Penambahan fasilitas kompos, maggot, biopori, dan daur ulang.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart: Persentase Pemilahan */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Percent size={16} className="text-indigo-600" /> Komparasi Kepatuhan Pemilahan (%)
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredKomparasi.filter(k => k.hasEndline)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="namaKelurahan" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `${val * 100}%`} />
                    <RechartsTooltip 
                      formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, '']}
                      cursor={{fill: '#f1f5f9'}} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontWeight: 600 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                    <Bar dataKey="pemilahan.baseline" name="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="pemilahan.endline" name="Endline" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Volume Sampah */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Weight size={16} className="text-rose-600" /> Komparasi Volume Sampah (Kg/Hari)
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredKomparasi.filter(k => k.hasEndline)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="namaKelurahan" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <RechartsTooltip 
                      formatter={(val: any) => [`${val} Kg`, '']}
                      cursor={{fill: '#f1f5f9'}} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontWeight: 600 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                    <Bar dataKey="volumeSampah.baseline" name="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="volumeSampah.endline" name="Endline" fill="#e11d48" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden mt-6">
             <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
               <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                 Tabel Komparasi Metrik Dampak KKN
               </h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                      <th className="px-4 py-3">Kelurahan</th>
                      <th className="px-4 py-3">Status Data</th>
                      <th className="px-4 py-3">Metrik Kepatuhan Pemilahan</th>
                      <th className="px-4 py-3">Metrik Volume Sampah</th>
                      <th className="px-4 py-3">Metrik Kegiatan Pemanfaatan</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredKomparasi.map(item => (
                      <tr key={item.kelurahanId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                          Kel. {item.namaKelurahan}
                        </td>
                        <td className="px-4 py-3">
                          {item.hasEndline ? (
                             <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold">Lengkap</span>
                          ) : (
                             <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-md text-[10px] font-bold">Menunggu Endline</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {item.pemilahan.delta !== null ? (
                            <span className={item.pemilahan.delta > 0 ? "text-emerald-600 flex items-center gap-1" : item.pemilahan.delta < 0 ? "text-rose-600 flex items-center gap-1" : "text-slate-500 flex items-center gap-1"}>
                               {item.pemilahan.delta > 0 ? <TrendingUp size={14}/> : item.pemilahan.delta < 0 ? <TrendingDown size={14}/> : <Minus size={14}/>}
                               {item.pemilahan.delta > 0 ? '+' : ''}{(item.pemilahan.delta * 100).toFixed(1)}%
                            </span>
                          ) : "-"}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {item.volumeSampah.delta !== null ? (
                            <span className={item.volumeSampah.delta < 0 ? "text-emerald-600 flex items-center gap-1" : item.volumeSampah.delta > 0 ? "text-rose-600 flex items-center gap-1" : "text-slate-500 flex items-center gap-1"}>
                               {item.volumeSampah.delta > 0 ? <TrendingUp size={14}/> : item.volumeSampah.delta < 0 ? <TrendingDown size={14}/> : <Minus size={14}/>}
                               {item.volumeSampah.delta > 0 ? '+' : ''}{item.volumeSampah.delta} Kg
                            </span>
                          ) : "-"}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {item.kegiatanPemanfaatan?.delta !== null && item.kegiatanPemanfaatan?.delta !== undefined ? (
                            <span className={item.kegiatanPemanfaatan.delta > 0 ? "text-emerald-600 flex items-center gap-1" : item.kegiatanPemanfaatan.delta < 0 ? "text-rose-600 flex items-center gap-1" : "text-slate-500 flex items-center gap-1"}>
                               {item.kegiatanPemanfaatan.delta > 0 ? <TrendingUp size={14}/> : item.kegiatanPemanfaatan.delta < 0 ? <TrendingDown size={14}/> : <Minus size={14}/>}
                               {item.kegiatanPemanfaatan.delta > 0 ? '+' : ''}{item.kegiatanPemanfaatan.delta} Kegiatan
                            </span>
                          ) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {/* Validasi Modal */}
      {validatingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-800">
             <div className="flex justify-between items-start mb-4">
               <div>
                 <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                   Validasi Data {validatingItem.type === "BASELINE" ? "Baseline" : "Endline"}
                 </h2>
                 <p className="text-xs text-slate-500">Tentukan status kelayakan data survei yang disubmit.</p>
               </div>
               <button onClick={() => setValidatingItem(null)} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-lg cursor-pointer">
                 <XCircle size={20} />
               </button>
             </div>
             
             <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Catatan Evaluasi / Revisi (Opsional)</label>
                  <textarea 
                    value={validationNote}
                    onChange={(e) => setValidationNote(e.target.value)}
                    rows={4}
                    placeholder="Masukkan catatan jika ada revisi yang perlu dilakukan..."
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800/60 focus:bg-white transition"
                  />
                </div>
                
                <div className="flex items-center gap-3 pt-2">
                  <button 
                    onClick={() => handleValidate("REVISI")}
                    className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-sm transition border border-rose-200 cursor-pointer"
                  >
                    Minta Revisi
                  </button>
                  <button 
                    onClick={() => handleValidate("VALID")}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition shadow-sm cursor-pointer"
                  >
                    Setujui (Valid)
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Export Modal with Period & Custom Date Range */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-800 text-white">
              <div className="flex items-center gap-2.5">
                <Download size={18} className="text-emerald-400" />
                <h3 className="font-black text-white text-base">Ekspor Data Evaluasi Dampak</h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 text-white/80 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-xs text-emerald-900 font-semibold">
                Data yang akan diekspor: <strong className="text-emerald-950 uppercase">{activeTab} ({activeTab === "KOMPARASI" ? komparasiList.length : activeTab === "BASELINE" ? baselineList.length : endlineList.length} baris data)</strong>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-500" /> Pilih Filter Periode Waktu:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "SEMUA", label: "Semua Data" },
                    { id: "BULAN_INI", label: "Bulan Berjalan" },
                    { id: "30_HARI", label: "30 Hari Terakhir" },
                    { id: "CUSTOM", label: "Tanggal Kustom" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setExportPeriod(p.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-left flex items-center justify-between ${
                        exportPeriod === p.id
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span>{p.label}</span>
                      {exportPeriod === p.id && <CheckCircle size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {exportPeriod === "CUSTOM" && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Tanggal Mulai:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Tanggal Selesai:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition shadow-sm flex items-center justify-center gap-2"
                >
                  <Download size={14} />
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Survei Modal */}
      {selectedEditKelurahanId && (
        <EditSurveiModal
          isOpen={isEditModalOpen}
          kelurahanId={selectedEditKelurahanId}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEditKelurahanId(null);
          }}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default EvaluasiDampakKkn;
