import React, { useEffect, useState, useMemo } from "react";
import {
  Download,
  RotateCcw,
  MapPin,
  Tag,
  TrendingUp,
  Leaf,
  Building2,
  Calendar,
  Loader2,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import pemanfaatanApiService, { type PemanfaatanProgram } from "../../services/pemanfaatanService";
import { useAuthStore } from "../../store/useAuthStore";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";
import PageHeader from "../../components/common/PageHeader";

const COBLONG_KELURAHANS = [
  "Cipaganti",
  "Dago",
  "Lebak Gede",
  "Lebak Siliwangi",
  "Sadang Serang",
  "Sekeloa",
];

export const DampakNilaiEkonomis: React.FC = () => {
  const { user } = useAuthStore();

  const [programs, setPrograms] = useState<PemanfaatanProgram[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterKelurahan, setFilterKelurahan] = useState<string>("ALL");
  const [filterKategori, setFilterKategori] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchProgramList = async () => {
    try {
      setLoading(true);
      const data = await pemanfaatanApiService.getPrograms();
      setPrograms(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.warn("[DampakNilaiEkonomis] Gagal memuat program:", e?.message || e);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgramList();
  }, []);

  const availableKelurahans = useMemo(() => {
    const set = new Set<string>(COBLONG_KELURAHANS);
    programs.forEach((p) => {
      const k = p.rw?.kelurahan?.name;
      if (k) set.add(k);
    });
    return Array.from(set).sort();
  }, [programs]);

  const filteredPrograms = useMemo(() => {
    let result = programs.filter((p) => {
      const kelName = p?.rw?.kelurahan?.name || "";
      const kategoriBahan = p?.kategoriBahan || "";
      const jenisOlahan = p?.jenisProgram || "";
      
      // Filter Kelurahan
      if (filterKelurahan !== "ALL") {
        if (!kelName || !kelName.toLowerCase().includes(filterKelurahan.toLowerCase())) {
          return false;
        }
      }

      // Filter Kategori
      if (filterKategori !== "ALL") {
        const itemIsAnorg =
          kategoriBahan.toUpperCase().includes("ANORGANIK") ||
          jenisOlahan.toLowerCase().includes("bank") ||
          jenisOlahan.toLowerCase().includes("plastik");
        const itemIsRes =
          kategoriBahan.toUpperCase().includes("RESIDU") ||
          jenisOlahan.toLowerCase().includes("residu");
        const itemIsOrg = !itemIsAnorg && !itemIsRes;

        if (filterKategori === "ORGANIK" && !itemIsOrg) return false;
        if (filterKategori === "ANORGANIK" && !itemIsAnorg) return false;
        if (filterKategori === "RESIDU" && !itemIsRes) return false;
      }

      // Filter Date
      if (dateFrom && p.tanggalPencatatan) {
        if (new Date(p.tanggalPencatatan) < new Date(dateFrom)) return false;
      }
      if (dateTo && p.tanggalPencatatan) {
        const dTo = new Date(dateTo);
        dTo.setHours(23, 59, 59, 999);
        if (new Date(p.tanggalPencatatan) > dTo) return false;
      }

      return true;
    });
    
    // Sort chronological desc
    result.sort((a, b) => {
      const da = new Date(a.tanggalPencatatan || a.createdAt || 0).getTime();
      const db = new Date(b.tanggalPencatatan || b.createdAt || 0).getTime();
      return db - da;
    });
    
    return result;
  }, [programs, filterKelurahan, filterKategori, dateFrom, dateTo]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterKelurahan, filterKategori, dateFrom, dateTo, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredPrograms.length / itemsPerPage));
  const paginatedPrograms = filteredPrograms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Metrics
  const totalNilaiEkonomi = filteredPrograms.reduce((acc, curr) => acc + (curr.nilaiEkonomiRp || 0), 0);
  const totalTermanfaatkan = filteredPrograms.reduce((acc, curr) => acc + (curr.jumlahHasilKg || 0), 0);
  const totalMasuk = filteredPrograms.reduce((acc, curr) => acc + (curr.jumlahBahanMasukKg || 0), 0);
  const totalProgram = filteredPrograms.length;
  
  const persentasePengurangan = totalMasuk > 0 ? ((totalTermanfaatkan / totalMasuk) * 100).toFixed(1) : "0.0";

  // Chart Data
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    availableKelurahans.forEach(k => map.set(k, 0));
    map.set("Lainnya", 0);
    
    filteredPrograms.forEach(p => {
      const kel = p.rw?.kelurahan?.name || "";
      const val = p.nilaiEkonomiRp || 0;
      let found = false;
      for (const k of availableKelurahans) {
        if (kel.toLowerCase().includes(k.toLowerCase())) {
          map.set(k, (map.get(k) || 0) + val);
          found = true;
          break;
        }
      }
      if (!found) {
        map.set("Lainnya", (map.get("Lainnya") || 0) + val);
      }
    });

    const data = Array.from(map.entries()).map(([name, nilai]) => ({
      name,
      nilai
    }));
    return data;
  }, [filteredPrograms, availableKelurahans]);

  const isFilterActive = filterKelurahan !== "ALL" || filterKategori !== "ALL" || dateFrom !== "" || dateTo !== "";

  const resetAllFilters = () => {
    setFilterKelurahan("ALL");
    setFilterKategori("ALL");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const exportData = filteredPrograms.map((p, idx) => ({
      "No": idx + 1,
      "Nama Program": p.namaProgram || "-",
      "Jenis Olahan": p.jenisProgram || "-",
      "Kategori": p.kategoriBahan || "-",
      "Kelurahan": p.rw?.kelurahan?.name || "-",
      "RW": p.rw?.name || (p.rwId ? `RW ${p.rwId}` : "-"),
      "Bahan Masuk (Kg)": p.jumlahBahanMasukKg || 0,
      "Hasil Panen/Olahan (Kg)": p.jumlahHasilKg || 0,
      "Nilai Ekonomi (Rp)": p.nilaiEkonomiRp || 0,
      "Target Penerima": p.targetPenerimaManfaat || "-",
      "Status": p.status || "-",
      "Tanggal": p.tanggalPencatatan ? new Date(p.tanggalPencatatan).toLocaleDateString("id-ID") : "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DampakNilaiEkonomi");
    XLSX.writeFile(wb, "Data_Dampak_Nilai_Ekonomi.xlsx");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELESAI":
      case "DISTRIBUSI":
      case "PANEN":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50">
            <CheckCircle2 size={13} /> {status === "DISTRIBUSI" ? "Didistribusikan" : "Siap Panen"}
          </span>
        );
      case "DALAM_PROSES":
      case "PROSES":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700/50">
            <Clock size={13} /> Proses
          </span>
        );
      case "DITOLAK":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700/50">
            <XCircle size={13} /> Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50">
            <AlertCircle size={13} /> Terencana
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      <PageHeader
        icon={TrendingUp}
        category="Pengolahan & Pemanfaatan"
        scope={
          user?.peran === "DPL" || user?.peran === "DOSEN_PEMBIMBING"
            ? user?.wilayah || (user?.kelurahan ? `Kel. ${user.kelurahan}` : "Wilayah Dampingan KKN")
            : user?.peran === "RW"
            ? `RW ${user?.rw || user?.rtRwId || ""}`
            : user?.peran === "LURAH"
            ? `Kelurahan ${user?.kelurahan || ""}`
            : "Kecamatan Coblong"
        }
        title="Dampak & Nilai Ekonomis"
        description="Analitik dampak ekonomi dan pengurangan timbulan sampah dari seluruh program pemanfaatan."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase">Total Nilai Ekonomi</p>
            <p className="text-base font-black text-slate-900 dark:text-slate-100 truncate">
              Rp {totalNilaiEkonomi.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 rounded-xl">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase">Termanfaatkan</p>
            <p className="text-base font-black text-slate-900 dark:text-slate-100 truncate">
              {totalTermanfaatkan.toLocaleString("id-ID", { maximumFractionDigits: 2 })} <span className="text-xs">kg</span>
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase">Program Aktif</p>
            <p className="text-base font-black text-slate-900 dark:text-slate-100 truncate">
              {totalProgram} <span className="text-xs">Program</span>
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase">Pengurangan Timbulan</p>
            <p className="text-base font-black text-slate-900 dark:text-slate-100 truncate">
              {persentasePengurangan}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold mb-4">Nilai Ekonomi Berdasarkan Kelurahan</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11 }} 
                tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}M`}
              />
              <RechartsTooltip 
                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, "Nilai Ekonomi"]}
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              <Bar dataKey="nilai" name="Nilai Ekonomi (Rp)" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <MapPin size={14} className="text-emerald-600" />
              <select
                value={filterKelurahan}
                onChange={(e) => setFilterKelurahan(e.target.value)}
                className="bg-transparent text-xs font-bold w-full outline-none"
              >
                <option value="ALL">Semua Kelurahan</option>
                {availableKelurahans.map((k) => (
                  <option key={k} value={k}>Kel. {k}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Tag size={14} className="text-emerald-600" />
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="bg-transparent text-xs font-bold w-full outline-none"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="ORGANIK">Organik</option>
                <option value="ANORGANIK">Anorganik</option>
                <option value="RESIDU">Residu</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar size={14} className="text-emerald-600" />
              <input 
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="bg-transparent text-xs font-bold outline-none"
              />
              <span className="text-xs mx-1">-</span>
              <input 
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="bg-transparent text-xs font-bold outline-none"
              />
            </div>
            {isFilterActive && (
              <button
                onClick={resetAllFilters}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <Download size={14} /> Export XLSX
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">No</th>
                <th className="px-4 py-3.5">Nama Program</th>
                <th className="px-4 py-3.5">Lokasi</th>
                <th className="px-4 py-3.5">Jenis Olahan</th>
                <th className="px-4 py-3.5 text-center">Masuk (kg)</th>
                <th className="px-4 py-3.5 text-center">Hasil (kg)</th>
                <th className="px-4 py-3.5 text-right">Nilai Ekonomi</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-emerald-600" size={24} />
                      <p className="text-xs font-bold">Memuat data nilai ekonomi...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedPrograms.length > 0 ? (
                paginatedPrograms.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3.5 text-center font-bold text-slate-400">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="px-4 py-3.5 font-bold">{p.namaProgram || "-"}</td>
                    <td className="px-4 py-3.5">
                      {p.rw?.kelurahan?.name ? `Kel. ${p.rw.kelurahan.name}` : "-"}
                      <br/>
                      <span className="text-[10px] text-slate-400">{p.rw?.name || (p.rwId ? `RW ${p.rwId}` : "")}</span>
                    </td>
                    <td className="px-4 py-3.5 font-medium">{p.jenisProgram || "-"}</td>
                    <td className="px-4 py-3.5 text-center">{p.jumlahBahanMasukKg || 0}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-emerald-600">{p.jumlahHasilKg || 0}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-amber-600">
                      {p.nilaiEkonomiRp ? `Rp ${p.nilaiEkonomiRp.toLocaleString('id-ID')}` : "-"}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {p.tanggalPencatatan ? new Date(p.tanggalPencatatan).toLocaleDateString('id-ID') : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyTableState
                  colSpan={9}
                  entityName="Data Dampak Ekonomi"
                  isSearch={isFilterActive}
                />
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={filteredPrograms.length}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DampakNilaiEkonomis;
