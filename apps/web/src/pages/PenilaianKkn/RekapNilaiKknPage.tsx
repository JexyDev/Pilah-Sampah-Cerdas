/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useEffect } from "react";
import {
  Download,
  Search,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { dplService, type RekapNilaiResponse } from "../../services/dplService";
import api from "../../services/api";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";

export const RekapNilaiKknPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [rekapData, setRekapData] = useState<RekapNilaiResponse>({
    groups: [],
    students: [],
    stats: { totalStudents: 0, rerataNilai: 0, rerataKehadiran: 0 },
  });
  const [kelompokList, setKelompokList] = useState<any[]>([]);
  const [selectedKelompokId, setSelectedKelompokId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const kelRes = await api.get("/kelompok");
      if (kelRes.data?.success && Array.isArray(kelRes.data.data)) {
        setKelompokList(kelRes.data.data);
      }

      const data = await dplService.getRekapNilaiAkhir(
        selectedKelompokId !== "ALL" ? selectedKelompokId : undefined
      );
      setRekapData(data);
    } catch {
      toast.error("Gagal memuat rekapitulasi nilai akhir KKN");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedKelompokId]);

  const filteredStudents = rekapData.students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nim || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.jurusan || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.kelompokName || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedKelompokId]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  const handleExportCsv = () => {
    if (filteredStudents.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const headers = [
      "No",
      "NIM",
      "Nama Mahasiswa",
      "Prodi / Jurusan",
      "Kelompok",
      "Nilai Individu (40%)",
      "Nilai Proker (30%)",
      "Kehadiran (30%)",
      "Poin Dampingan",
      "Nilai Akhir",
      "Huruf Mutu",
      "Status Kelulusan",
    ];
    const rows = filteredStudents.map((s, idx) => [
      idx + 1,
      `"${s.nim}"`,
      `"${s.name}"`,
      `"${s.jurusan}"`,
      `"${s.kelompokName}"`,
      s.skorIndividu,
      s.skorProkerKelompok,
      s.tingkatKehadiran,
      s.poinDampingan,
      s.nilaiAkhir,
      s.hurufMutu,
      s.statusLulus,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Nilai_Akhir_KKN_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Rekap nilai akhir berhasil diekspor!");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Clean Flat Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Rekapitulasi & Lembar Nilai Akhir KKN</h1>
          <p className="text-slate-500 text-sm mt-1">
            Kompilasi perhitungan nilai akhir kumulatif (40% Individu, 30% Output Proker, 30% Presensi) siap diekspor resmi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Download size={15} />
            Ekspor Nilai (CSV)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">Total Mahasiswa Dampingan</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{rekapData.stats.totalStudents}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-emerald-600 font-semibold">Rerata Nilai Akhir Angkatan</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{rekapData.stats.rerataNilai.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-indigo-600 font-semibold">Rerata Tingkat Kehadiran</span>
          <p className="text-2xl font-black text-indigo-700 mt-1">{rekapData.stats.rerataKehadiran.toFixed(2)}%</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-600">Kelompok:</span>
          <select
            value={selectedKelompokId}
            onChange={(e) => setSelectedKelompokId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Kelompok Binaan</option>
            {kelompokList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} ({k.kelurahan || "Coblong"})
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari mahasiswa, NIM, prodi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <span className="text-xs font-semibold">Menghitung rekapitulasi nilai akhir...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <EmptyTableState
            entityName="Rekapitulasi Nilai KKN"
            isSearch={!!(searchQuery || selectedKelompokId !== "ALL")}
            searchQuery={searchQuery}
            onResetSearch={() => {
              setSearchQuery("");
              setSelectedKelompokId("ALL");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Mahasiswa & NIM</th>
                  <th className="py-3.5 px-4 w-36">Kelompok</th>
                  <th className="py-3.5 px-4 w-28 text-center">Individu (40%)</th>
                  <th className="py-3.5 px-4 w-28 text-center">Proker (30%)</th>
                  <th className="py-3.5 px-4 w-28 text-center">Presensi (30%)</th>
                  <th className="py-3.5 px-4 w-28 text-center">Poin Dampingan</th>
                  <th className="py-3.5 px-4 w-28 text-center font-black text-slate-900">Nilai Akhir</th>
                  <th className="py-3.5 px-4 w-24 text-center font-black">Huruf</th>
                  <th className="py-3.5 px-4 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedStudents.map((st, idx) => {
                  let letterColor = "text-slate-600 bg-slate-100";
                  if (st.hurufMutu === "A") letterColor = "text-emerald-700 bg-emerald-50 border border-emerald-200 font-black";
                  else if (st.hurufMutu === "B") letterColor = "text-blue-700 bg-blue-50 border border-blue-200 font-black";
                  else if (st.hurufMutu === "C") letterColor = "text-amber-700 bg-amber-50 border border-amber-200 font-bold";
                  else letterColor = "text-rose-700 bg-rose-50 border border-rose-200 font-bold";

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {st.name}
                          {st.isKetua && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md font-extrabold">
                              Ketua
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {st.nim} • {st.jurusan}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {st.kelompokName}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {st.skorIndividu.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {st.skorProkerKelompok.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-700">
                        {st.tingkatKehadiran.toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-600">
                        {st.poinDampingan}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-sm text-slate-900">
                        {st.nilaiAkhir.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-xl text-xs ${letterColor}`}>
                          {st.hurufMutu}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            st.statusLulus === "LULUS"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {st.statusLulus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filteredStudents.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredStudents.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[10, 25, 50]}
          />
        )}
      </div>
    </div>
  );
};

export default RekapNilaiKknPage;
