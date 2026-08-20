/**
 * Project: BERSEKA
 * Component: TaskforceDashboardPage (Dasbor Panitia Taskforce KKN)
 * Focused on managing DPLs, 32 KKN Groups, 560 Students, and Attendance/Survey Progress.
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  FileText,
  BarChart3,
  Search,
  UserCheck,
  AlertCircle,
  MapPin,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Filter,
  Layers,
  Award
} from "lucide-react";
import api from "../../services/api";
import showToast from "../../utils/showToast";

interface KelompokItem {
  id: number;
  name: string;
  kelurahan: string;
  cakupanRw: number[];
  dplId?: number | null;
  dplNamaMentah?: string;
  dpl?: {
    id: number;
    name: string;
    nip?: string;
  } | null;
  students?: Array<{
    id: number;
    userId: number;
    isKetua: boolean;
    user?: {
      id: number;
      name: string;
    };
  }>;
}

export const TaskforceDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelurahan, setSelectedKelurahan] = useState("SEMUA");
  const [selectedStatusKetua, setSelectedStatusKetua] = useState("SEMUA");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [kelompokList, setKelompokList] = useState<KelompokItem[]>([]);
  const [totalMahasiswaDB, setTotalMahasiswaDB] = useState(0);
  const [totalSurveiKelurahan, setTotalSurveiKelurahan] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch KKN Groups (limit=0 = semua kelompok)
      const resKelompok = await api.get("/kelompok?limit=0");
      const groupsData = resKelompok.data?.groups || resKelompok.data?.data || (Array.isArray(resKelompok.data) ? resKelompok.data : []);
      const safeGroups = Array.isArray(groupsData) ? groupsData : [];
      setKelompokList(safeGroups);

      // 2. Fetch total mahasiswa KKN dari DB (bukan dari kelompok list)
      try {
        const resMhs = await api.get("/users?roleName=MAHASISWA_KKN&limit=0");
        const mhsData = resMhs.data?.data || [];
        const totalMhs = Array.isArray(mhsData) ? mhsData.length : 0;
        setTotalMahasiswaDB(totalMhs);
      } catch {
        // fallback: hitung dari students dalam kelompok
        const fallbackTotal = safeGroups.reduce(
          (acc: number, k: any) => acc + (Array.isArray(k?.students) ? k.students.length : 0), 0
        );
        setTotalMahasiswaDB(fallbackTotal);
      }

      // 3. Fetch total kelurahan yang sudah ada data survei dari DB
      try {
        const resSurvei = await api.get("/survei-kkn?limit=0");
        const surveiData = resSurvei.data?.data || [];
        if (Array.isArray(surveiData) && surveiData.length > 0) {
          // Deduplikasi berdasarkan kelurahan
          const uniqueKelurahan = new Set(
            surveiData.map((s: any) => (s.kelurahan || "").toLowerCase()).filter(Boolean)
          );
          setTotalSurveiKelurahan(uniqueKelurahan.size);
        } else {
          // fallback: hitung dari meta.total jika tersedia
          const metaTotal = resSurvei.data?.meta?.total || 0;
          setTotalSurveiKelurahan(metaTotal);
        }
      } catch {
        setTotalSurveiKelurahan(0);
      }
    } catch (err) {
      console.error("Gagal memuat data dasbor taskforce:", err);
      showToast.error("Gagal memuat data Dasbor Panitia Task Force");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Stats calculations directly computed from live database API payload
  const safeKelompokList = Array.isArray(kelompokList) ? kelompokList : [];
  const totalKelompok = safeKelompokList.length;
  const kelompokWithLeader = safeKelompokList.filter(
    (k) => k?.students && Array.isArray(k.students) && k.students.some((s) => s.isKetua)
  ).length;
  const kelompokWithoutLeader = totalKelompok - kelompokWithLeader;
  const totalDplCount =
    new Set(safeKelompokList.map((k) => k?.dplId || k?.dplNamaMentah).filter(Boolean)).size;
  // totalMahasiswaDB di-fetch langsung dari GET /users?roleName=MAHASISWA_KKN (100% dari DB)
  const totalStudentsCount = totalMahasiswaDB > 0
    ? totalMahasiswaDB
    : safeKelompokList.reduce(
        (acc, curr) => acc + (Array.isArray(curr?.students) ? curr.students.length : 0), 0
      );

  // Multi-Filter & Search Logic
  const filteredGroups = safeKelompokList.filter((k) => {
    if (!k || typeof k !== "object") return false;
    const q = searchQuery.toLowerCase();
    const matchName = (k.name || "").toLowerCase().includes(q);
    const matchKel = (k.kelurahan || "").toLowerCase().includes(q);
    const matchDpl = (k.dpl?.name || k.dplNamaMentah || "").toLowerCase().includes(q);
    const matchSearch = matchName || matchKel || matchDpl;

    const matchKelFilter =
      selectedKelurahan === "SEMUA" ||
      (k.kelurahan || "").toLowerCase() === selectedKelurahan.toLowerCase();

    const hasLeader = k.students && Array.isArray(k.students) && k.students.some((s) => s.isKetua);
    const matchStatusFilter =
      selectedStatusKetua === "SEMUA" ||
      (selectedStatusKetua === "ADA_KETUA" && hasLeader) ||
      (selectedStatusKetua === "TANPA_KETUA" && !hasLeader);

    return matchSearch && matchKelFilter && matchStatusFilter;
  });

  // Pagination Logic
  const totalPages = itemsPerPage === 0 ? 1 : Math.ceil(filteredGroups.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = itemsPerPage === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage;
  const paginatedGroups = itemsPerPage === 0 ? filteredGroups : filteredGroups.slice(startIndex, startIndex + itemsPerPage);

  const startRecord = filteredGroups.length === 0 ? 0 : startIndex + 1;
  const endRecord = itemsPerPage === 0 ? filteredGroups.length : Math.min(startIndex + itemsPerPage, filteredGroups.length);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-teal-700 to-emerald-800 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-amber-100 text-xs font-black tracking-wider uppercase mb-3">
              <ShieldCheck size={14} className="text-amber-200" />
              <span>Panitia Task Force KKN UNIKOM</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
              Dasbor Pengelolaan KKN
            </h1>
            <p className="text-emerald-100 text-sm mt-2 max-w-2xl font-medium leading-relaxed">
              Pusat kendali operasional panitia untuk mengelola {totalKelompok} Kelompok KKN, {totalDplCount} Dosen Pendamping Lapangan (DPL), {totalStudentsCount} Mahasiswa, serta validasi survei kelurahan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/manajemen-ekosistem-kkn"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl font-extrabold text-xs shadow-md transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <GraduationCap size={16} />
              <span>Kelola Ekosistem KKN</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Kelompok KKN */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold text-teal-600 dark:text-teal-400 tracking-wider">
              Kelompok KKN
            </span>
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl">
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">{totalKelompok}</h3>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} /> {kelompokWithLeader} Ada Ketua
              </span>
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle size={13} /> {kelompokWithoutLeader} Tanpa Ketua
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Dosen Pendamping Lapangan (DPL) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
              DPL Terdaftar
            </span>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Award size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">{totalDplCount}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              Terhubung 1-to-1 ke 32 Kelompok KKN
            </p>
          </div>
        </div>

        {/* Card 3: Total Mahasiswa KKN */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider">
              Mahasiswa KKN
            </span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">{totalStudentsCount}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              Terdaftar &amp; Tersebar di {totalSurveiKelurahan > 0 ? totalSurveiKelurahan : safeKelompokList.length > 0 ? new Set(safeKelompokList.map(k => k.kelurahan).filter(Boolean)).size : "-"} Kelurahan
            </p>
          </div>
        </div>

        {/* Card 4: Survei & Evaluasi */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold text-amber-600 dark:text-amber-400 tracking-wider">
              Survei Kelurahan
            </span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <FileText size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {loading ? "..." : totalSurveiKelurahan > 0 ? `${totalSurveiKelurahan} Kelurahan` : "Belum Ada Data"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              Baseline vs Endline KKN
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/manajemen-ekosistem-kkn"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl hover:border-teal-500 hover:shadow-md transition group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition">
              <GraduationCap size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Ekosistem KKN</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Plotting Kelompok &amp; DPL</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          to="/monitoring-absen"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl hover:border-indigo-500 hover:shadow-md transition group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Presensi Mahasiswa</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Audit Absensi &amp; Izin</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          to="/superUser/data-survei-kkn"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl hover:border-amber-500 hover:shadow-md transition group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Data Survei</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Edit &amp; Impor Survei</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          to="/evaluasi-dampak-kkn"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl hover:border-emerald-500 hover:shadow-md transition group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
              <BarChart3 size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Evaluasi & Dampak</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Validasi Baseline vs Endline</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition" />
        </Link>
      </div>

      {/* Main Table Section: Kelola Kelompok KKN */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Top Controls: Title, Search & Multi-Filters */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers size={20} className="text-teal-600 dark:text-teal-400" />
                <span>Daftar Pengelolaan Kelompok KKN ({filteredGroups.length})</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Pantau DPL pengampu, status ketua kelompok, dan alokasi mahasiswa di seluruh kelompok KKN.
              </p>
            </div>

            <div className="relative min-w-[260px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari kelompok, kelurahan, atau DPL..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 transition"
              />
            </div>
          </div>

          {/* Multi-Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
              <Filter size={14} className="text-teal-600 dark:text-teal-400" />
              <span>Filter:</span>
            </div>

            {/* Filter Kelurahan */}
            <select
              value={selectedKelurahan}
              onChange={(e) => {
                setSelectedKelurahan(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="SEMUA">Semua Kelurahan</option>
              {Array.from(new Set(safeKelompokList.map((k) => k.kelurahan).filter(Boolean)))
                .sort()
                .map((kel) => (
                  <option key={kel} value={kel}>
                    Kel. {kel}
                  </option>
                ))}
            </select>

            {/* Filter Status Ketua */}
            <select
              value={selectedStatusKetua}
              onChange={(e) => {
                setSelectedStatusKetua(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="SEMUA">Semua Status Ketua</option>
              <option value="ADA_KETUA">Ada Ketua</option>
              <option value="TANPA_KETUA">Tanpa Ketua / Lepas</option>
            </select>

            {/* Items Per Page Select */}
            <div className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span>Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value={5}>5 Per Halaman</option>
                <option value={10}>10 Per Halaman</option>
                <option value={20}>20 Per Halaman</option>
                <option value={50}>50 Per Halaman</option>
                <option value={0}>Semua Data</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 dark:bg-slate-800/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Kelompok &amp; Wilayah</th>
                <th className="px-6 py-4">DPL Pengampu</th>
                <th className="px-6 py-4">Ketua Kelompok</th>
                <th className="px-6 py-4 text-center">Jumlah Mahasiswa</th>
                <th className="px-6 py-4 text-right">Aksi Manajerial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-400 font-semibold">
                    <Loader2 className="animate-spin text-teal-600 mx-auto mb-2" size={24} />
                    <span>Memuat daftar kelompok KKN...</span>
                  </td>
                </tr>
              ) : paginatedGroups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500 dark:text-slate-400 font-semibold">
                    Tidak ada kelompok KKN yang cocok dengan filter atau kata kunci pencarian.
                  </td>
                </tr>
              ) : (
                paginatedGroups.map((group) => {
                  const leaderStudent = group.students?.find(s => s.isKetua);
                  const leaderName = leaderStudent?.user?.name || "Belum Ada Ketua";
                  const dplName = group.dpl?.name || group.dplNamaMentah || "Belum Ada DPL";
                  const dplNip = group.dpl?.nip || "NIP -";
                  const rwCoverage = group.cakupanRw && Array.isArray(group.cakupanRw) ? group.cakupanRw.join(", ") : "-";

                  return (
                    <tr key={group.id} className="hover:bg-slate-50/70 dark:bg-slate-800/70 dark:hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-sm">{group.name}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="text-teal-600 dark:text-teal-400" />
                          Kel. {group.kelurahan} (RW {rwCoverage})
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{dplName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">NIP: {dplNip}</span>
                      </td>

                      <td className="px-6 py-4">
                        {leaderStudent ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] border border-emerald-200 dark:border-emerald-700/40">
                            <UserCheck size={12} />
                            {leaderName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold text-[11px] border border-amber-200 dark:border-amber-700/40">
                            <AlertCircle size={12} />
                            Tanpa Ketua / Lepas
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                        {group.students?.length || 0} Mhs
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          to="/manajemen-ekosistem-kkn"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 dark:hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer border border-slate-200 dark:border-slate-700"
                        >
                          <span>Kelola / Plotting</span>
                          <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Pagination Bar */}
        {!loading && filteredGroups.length > 0 && (
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/70 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
            <div>
              Menampilkan <span className="font-black text-slate-900 dark:text-slate-100">{startRecord}</span> - <span className="font-black text-slate-900 dark:text-slate-100">{endRecord}</span> dari <span className="font-black text-slate-900 dark:text-slate-100">{filteredGroups.length}</span> data kelompok
            </div>

            {itemsPerPage > 0 && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer font-bold text-slate-700 dark:text-slate-300"
                >
                  <ChevronLeft size={14} /> Prev
                </button>

                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === safeCurrentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-black transition cursor-pointer ${
                          isActive
                            ? "bg-teal-600 text-white shadow-xs"
                            : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer font-bold text-slate-700 dark:text-slate-300"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskforceDashboardPage;
