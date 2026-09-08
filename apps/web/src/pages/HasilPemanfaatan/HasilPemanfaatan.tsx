/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Page: Monitoring Pemanfaatan & Hasil Olahan
 * Sesuai Notulensi Review Sistem BERSEKA 8 September 2026:
 * - Fitur Aspirasi dihapus (fokus murni pada monitoring hasil pemanfaatan & luaran).
 * - Filter bertingkat: Wilayah (Kelurahan) -> RW -> Produk Luaran.
 * - Data produk luaran mengacu pada Data Master Luaran.
 * - Mendukung sinkronisasi query parameter kategori (ORGANIK, ANORGANIK, RESIDU) dan jenis (bank_sampah).
 */

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Sparkles,
  Search,
  Filter,
  Loader2,
  Building2,
  Leaf,
  Boxes,
  TrendingUp,
  MapPin,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Tag,
} from "lucide-react";
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

export const HasilPemanfaatan: React.FC = () => {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Program / Product Outputs State
  const [programs, setPrograms] = useState<PemanfaatanProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [masterLuaranList, setMasterLuaranList] = useState<
    Array<{ id: number; nama: string; kategori: string; deskripsi?: string; satuanDefault?: string; hargaEstimasiPerSatuan?: number }>
  >([]);

  // Search & Dynamic Tiered Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKelurahan, setFilterKelurahan] = useState<string>("ALL");
  const [filterRw, setFilterRw] = useState<string>("ALL");
  const [filterLuaran, setFilterLuaran] = useState<string>("ALL");
  const [filterKategori, setFilterKategori] = useState<string>(() => {
    const qKategori = searchParams.get("kategori");
    if (qKategori) return qKategori.toUpperCase();
    return "ALL";
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchProgramList = async () => {
    try {
      setLoading(true);
      const data = await pemanfaatanApiService.getPrograms();
      setPrograms(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.warn("[HasilPemanfaatan] Gagal memuat program:", e?.message || e);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgramList();
    pemanfaatanApiService.getMasterLuaran().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setMasterLuaranList(data);
      }
    });
  }, []);

  // Sync with URL Query Parameters (from sidebar navigation e.g. ?kategori=ORGANIK)
  useEffect(() => {
    const urlKat = searchParams.get("kategori");
    const urlJenis = searchParams.get("jenis");

    if (urlKat) {
      setFilterKategori(urlKat.toUpperCase());
    }
    if (urlJenis && urlJenis.toLowerCase().includes("bank")) {
      setFilterLuaran("Bank Sampah");
    }
  }, [searchParams]);

  // Dynamic available Kelurahans from dataset merged with official Coblong list
  const availableKelurahans = useMemo(() => {
    const set = new Set<string>(COBLONG_KELURAHANS);
    programs.forEach((p) => {
      const k = p.rw?.kelurahan?.name;
      if (k) set.add(k);
    });
    return Array.from(set).sort();
  }, [programs]);

  // Dynamic available RWs based on selected Kelurahan
  const availableRws = useMemo(() => {
    const rwMap = new Map<string, string>();
    programs.forEach((p) => {
      const kelName = p.rw?.kelurahan?.name || "";
      if (filterKelurahan === "ALL" || kelName.toLowerCase() === filterKelurahan.toLowerCase()) {
        const rwName = p.rw?.name || (p.rwId ? `RW ${p.rwId}` : "");
        if (rwName) {
          rwMap.set(rwName, rwName);
        }
      }
    });
    return Array.from(rwMap.values()).sort();
  }, [programs, filterKelurahan]);

  // Reset RW filter if chosen Kelurahan changes and current RW is not part of it
  useEffect(() => {
    if (filterKelurahan !== "ALL" && filterRw !== "ALL") {
      const exists = availableRws.includes(filterRw);
      if (!exists) setFilterRw("ALL");
    }
  }, [filterKelurahan, availableRws, filterRw]);

  // Filtered Programs Calculation
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const q = (searchQuery || "").toLowerCase().trim();
      const rwName = p?.rw?.name || (p?.rwId ? `RW ${p.rwId}` : "");
      const kelName = p?.rw?.kelurahan?.name || "";
      const jenisOlahan = p?.jenisProgram || "";
      const kategoriBahan = p?.kategoriBahan || "";

      // 1. Text Search Query
      const matchesSearch =
        !q ||
        (p?.namaProgram || "").toLowerCase().includes(q) ||
        jenisOlahan.toLowerCase().includes(q) ||
        (p?.lokasiFasilitas || "").toLowerCase().includes(q) ||
        (p?.targetPenerimaManfaat || "").toLowerCase().includes(q) ||
        rwName.toLowerCase().includes(q) ||
        kelName.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // 2. Filter Wilayah / Kelurahan
      if (filterKelurahan !== "ALL") {
        if (!kelName || !kelName.toLowerCase().includes(filterKelurahan.toLowerCase())) {
          return false;
        }
      }

      // 3. Filter RW
      if (filterRw !== "ALL") {
        if (!rwName || !rwName.toLowerCase().includes(filterRw.toLowerCase())) {
          return false;
        }
      }

      // 4. Filter Kategori Bahan (ORGANIK, ANORGANIK, RESIDU)
      if (filterKategori !== "ALL") {
        const isOrgFilter = filterKategori === "ORGANIK" || filterKategori === "ORGANIC";
        const isAnorgFilter = filterKategori === "ANORGANIK" || filterKategori === "NON_ORGANIC";
        const isResFilter = filterKategori === "RESIDU";

        const itemIsAnorg =
          kategoriBahan.toUpperCase().includes("ANORGANIK") ||
          jenisOlahan.toLowerCase().includes("bank") ||
          jenisOlahan.toLowerCase().includes("plastik");

        const itemIsRes =
          kategoriBahan.toUpperCase().includes("RESIDU") ||
          jenisOlahan.toLowerCase().includes("residu");

        const itemIsOrg = !itemIsAnorg && !itemIsRes;

        if (isOrgFilter && !itemIsOrg) return false;
        if (isAnorgFilter && !itemIsAnorg) return false;
        if (isResFilter && !itemIsRes) return false;
      }

      // 5. Filter Produk Luaran (Master Luaran / Jenis)
      if (filterLuaran !== "ALL") {
        const target = filterLuaran.toLowerCase();
        if (!jenisOlahan.toLowerCase().includes(target)) {
          return false;
        }
      }

      return true;
    });
  }, [programs, searchQuery, filterKelurahan, filterRw, filterKategori, filterLuaran]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterKelurahan, filterRw, filterKategori, filterLuaran, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredPrograms.length / itemsPerPage));
  }, [filteredPrograms.length, itemsPerPage]);

  const paginatedPrograms = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPrograms.slice(start, start + itemsPerPage);
  }, [filteredPrograms, currentPage, itemsPerPage]);

  // Metrics Summary
  const totalPanenKg = useMemo(() => {
    return filteredPrograms.reduce((acc, curr) => acc + (curr.jumlahHasilKg || 0), 0);
  }, [filteredPrograms]);

  const totalNilaiEkonomi = useMemo(() => {
    return filteredPrograms.reduce((acc, curr) => acc + (curr.nilaiEkonomiRp || 0), 0);
  }, [filteredPrograms]);

  const totalBahanMasukKg = useMemo(() => {
    return filteredPrograms.reduce((acc, curr) => acc + (curr.jumlahBahanMasukKg || 0), 0);
  }, [filteredPrograms]);

  const resetAllFilters = () => {
    setSearchQuery("");
    setFilterKelurahan("ALL");
    setFilterRw("ALL");
    setFilterLuaran("ALL");
    setFilterKategori("ALL");
    setSearchParams({});
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELESAI":
      case "DISTRIBUSI":
      case "PANEN":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50">
            <CheckCircle2 size={13} /> {status === "DISTRIBUSI" ? "Didistribusikan" : "Siap Panen / Terkonversi"}
          </span>
        );
      case "DALAM_PROSES":
      case "PROSES":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700/50">
            <Clock size={13} /> Dalam Pengolahan
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

  const getCategoryBadge = (jenis: string) => {
    const j = (jenis || "").toLowerCase();
    if (j.includes("maggot") || j.includes("bsf")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50">
          Maggot BSF
        </span>
      );
    }
    if (j.includes("poc") || j.includes("pupuk cair") || j.includes("cair")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700/50">
          Pupuk POC
        </span>
      );
    }
    if (j.includes("bank") || j.includes("anorganik")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700/50">
          Bank Sampah
        </span>
      );
    }
    if (j.includes("loseda")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-lime-50 dark:bg-lime-950/60 text-lime-800 dark:text-lime-300 border border-lime-200 dark:border-lime-700/50">
          Loseda
        </span>
      );
    }
    if (j.includes("bata") || j.includes("terawang")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50">
          Bata Terawang
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50">
        {jenis || "Kompos Organik"}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* Page Header */}
      <PageHeader
        icon={Sparkles}
        category="Tata Kelola Sampah • Pemanfaatan"
        scope={
          user?.peran === "DPL" || user?.peran === "DOSEN_PEMBIMBING"
            ? user?.wilayah || (user?.kelurahan ? `Kel. ${user.kelurahan}` : "Wilayah Dampingan KKN")
            : user?.peran === "RW"
            ? `RW ${user?.rw || user?.rtRwId || ""}`
            : user?.peran === "LURAH"
            ? `Kelurahan ${user?.kelurahan || ""}`
            : "Kecamatan Coblong"
        }
        title="Monitoring Pemanfaatan & Dampak"
        description="Pusat pemantauan konversi pengolahan sampah terpilah menjadi produk bernilai guna (Kompos, Maggot BSF, Pupuk Organik Cair, dan Bank Sampah) berbasis Master Luaran."
      />

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-4.5 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5 min-w-0">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl shrink-0 border border-emerald-100 dark:border-emerald-700/50">
            <Leaf className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-wider truncate">
              Hasil Panen Olahan
            </p>
            <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">
              {totalPanenKg.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}{" "}
              <span className="text-xs font-semibold text-slate-400">Kg / L</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-4.5 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5 min-w-0">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl shrink-0 border border-slate-200 dark:border-slate-700">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-wider truncate">
              Nilai Ekonomi Daur
            </p>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 truncate" title={`Rp ${totalNilaiEkonomi.toLocaleString("id-ID")}`}>
              Rp {totalNilaiEkonomi.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-4.5 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5 min-w-0">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl shrink-0 border border-slate-200 dark:border-slate-700">
            <Boxes className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-wider truncate">
              Bahan Terolah
            </p>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 truncate">
              {totalBahanMasukKg.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}{" "}
              <span className="text-xs font-semibold text-slate-400">Kg</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-4.5 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5 min-w-0">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl shrink-0 border border-emerald-100 dark:border-emerald-700/50">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-wider truncate">
              Titik Program &amp; Fasilitas
            </p>
            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 truncate">
              {filteredPrograms.length}{" "}
              <span className="text-xs font-semibold text-slate-400">Program</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tiered Search & Filters Bar (Wilayah -> RW -> Produk Luaran) */}
      <div className="bg-white dark:bg-slate-900 p-4.5 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama program, jenis olahan, lokasi fasilitas, atau penerima manfaat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-10 pr-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#009966] focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          {/* Reset Filters */}
          {(searchQuery || filterKelurahan !== "ALL" || filterRw !== "ALL" || filterLuaran !== "ALL" || filterKategori !== "ALL") && (
            <button
              onClick={resetAllFilters}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <RotateCcw size={13} /> Reset Filter
            </button>
          )}
        </div>

        {/* Tiered Select Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          {/* 1. Filter Wilayah (Kelurahan) */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <MapPin size={14} className="text-[#009966] shrink-0" />
            <select
              value={filterKelurahan}
              onChange={(e) => setFilterKelurahan(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 w-full outline-none cursor-pointer"
            >
              <option value="ALL">Semua Kelurahan</option>
              {availableKelurahans.map((k) => (
                <option key={k} value={k}>
                  Kel. {k}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Filter RW (Bertingkat setelah Kelurahan) */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Building2 size={14} className="text-[#009966] shrink-0" />
            <select
              value={filterRw}
              onChange={(e) => setFilterRw(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 w-full outline-none cursor-pointer"
            >
              <option value="ALL">Semua Rukun Warga</option>
              {availableRws.map((rw) => (
                <option key={rw} value={rw}>
                  {rw}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filter Kategori Sampah / Bahan */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Tag size={14} className="text-[#009966] shrink-0" />
            <select
              value={filterKategori}
              onChange={(e) => {
                const val = e.target.value;
                setFilterKategori(val);
                if (val !== "ALL") {
                  setSearchParams({ kategori: val });
                } else {
                  setSearchParams({});
                }
              }}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 w-full outline-none cursor-pointer"
            >
              <option value="ALL">Semua Aliran Sampah</option>
              <option value="ORGANIK">Organik</option>
              <option value="ANORGANIK">Anorganik</option>
              <option value="RESIDU">Residu</option>
            </select>
          </div>

          {/* 4. Filter Produk Luaran (Master Data Luaran Lookup) */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Filter size={14} className="text-[#009966] shrink-0" />
            <select
              value={filterLuaran}
              onChange={(e) => setFilterLuaran(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 w-full outline-none cursor-pointer"
            >
              <option value="ALL">Semua Produk Luaran (Master)</option>
              {masterLuaranList.length > 0 ? (
                masterLuaranList.map((m) => (
                  <option key={m.id} value={m.nama}>
                    {m.nama} ({m.kategori})
                  </option>
                ))
              ) : (
                <>
                  <option value="Kompos">Kompos Organik (Buruan Sae)</option>
                  <option value="Maggot">Maggot BSF</option>
                  <option value="POC">Pupuk Organik Cair (POC)</option>
                  <option value="Bank Sampah">Bank Sampah Anorganik</option>
                  <option value="Loseda">Loseda</option>
                  <option value="Bata Terawang">Bata Terawang</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Table Hasil Olahan & Distribusi */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">No</th>
                <th className="px-4 py-3.5">Nama Program &amp; Fasilitas</th>
                <th className="px-4 py-3.5">Jenis Olahan (Master)</th>
                <th className="px-4 py-3.5">Wilayah RW &amp; Kelurahan</th>
                <th className="px-4 py-3.5 text-center">Bahan Masuk</th>
                <th className="px-4 py-3.5 text-center">Hasil Panen</th>
                <th className="px-4 py-3.5 text-center">Nilai Ekonomi</th>
                <th className="px-4 py-3.5">Penerima Manfaat</th>
                <th className="px-4 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#009966]/10 text-[#009966] dark:text-emerald-400 flex items-center justify-center border border-[#009966]/20 shadow-xs">
                        <Loader2 className="animate-spin text-[#009966]" size={24} />
                      </div>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Memuat data monitoring pemanfaatan...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedPrograms.length > 0 ? (
                paginatedPrograms.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3.5 text-center font-bold text-slate-400">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-sm">
                        {(() => {
                          const raw = p.namaProgram || "Program Pengolahan Mandiri";
                          const noMarkdown = raw.replace(/\*\*/g, "").replace(/\*/g, "").trim();
                          let clean = noMarkdown.split("\n")[0].trim();
                          if (clean.includes(" - ")) clean = clean.split(" - ")[0].trim();
                          else if (clean.includes(" : ")) clean = clean.split(" : ")[0].trim();
                          else if (clean.includes(" – ")) clean = clean.split(" – ")[0].trim();
                          return clean;
                        })()}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                        <MapPin size={12} /> {p.lokasiFasilitas || "Fasilitas Komunal RW"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {getCategoryBadge(p.jenisProgram)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/50 px-2.5 py-0.5 rounded-md text-[11px] inline-block">
                        {(() => {
                          const rwText = p.rw?.name || (p.rwId ? `RW ${p.rwId}` : "RW 01");
                          const kelText = p.rw?.kelurahan?.name;
                          if (kelText && !rwText.toLowerCase().includes(kelText.toLowerCase())) {
                            return `${rwText} (${kelText})`;
                          }
                          return rwText;
                        })()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                      {Number(p.jumlahBahanMasukKg || 0).toLocaleString("id-ID", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}{" "}
                      Kg
                    </td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-emerald-700 dark:text-emerald-400">
                      {Number(p.jumlahHasilKg || 0).toLocaleString("id-ID", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {p.unitHasil || "Kg"}
                    </td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-amber-600 dark:text-amber-400">
                      {p.nilaiEkonomiRp ? `Rp ${Number(p.nilaiEkonomiRp).toLocaleString("id-ID")}` : "-"}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                      {p.targetPenerimaManfaat || "Warga Sekitar RW"}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {getStatusBadge(p.status)}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyTableState
                  colSpan={9}
                  entityName="Produk Hasil Pemanfaatan"
                  isSearch={Boolean(searchQuery || filterKelurahan !== "ALL" || filterRw !== "ALL" || filterLuaran !== "ALL")}
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

export default HasilPemanfaatan;
