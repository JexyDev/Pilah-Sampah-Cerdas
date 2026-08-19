/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useEffect } from "react";
import {
  Save,
  Search,
  Loader2,
  Building
} from "lucide-react";
import toast from "react-hot-toast";
import { dplService, type ProgramKerjaItem } from "../../services/dplService";
import api from "../../services/api";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";

export const PenilaianProkerPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [prokerList, setProkerList] = useState<ProgramKerjaItem[]>([]);
  const [kelompokList, setKelompokList] = useState<any[]>([]);
  const [selectedKelompokId, setSelectedKelompokId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const [scoreMap, setScoreMap] = useState<Record<string, number>>({});
  const [evalMap, setEvalMap] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const kelRes = await api.get("/kelompok");
      if (kelRes.data?.success && Array.isArray(kelRes.data.data)) {
        setKelompokList(kelRes.data.data);
      }

      const data = await dplService.getProgramKerja(
        selectedKelompokId !== "ALL" ? selectedKelompokId : undefined
      );
      // Only accepted proker or all proker
      setProkerList(data);

      const initialScores: Record<string, number> = {};
      const initialEvals: Record<string, string> = {};
      data.forEach((p) => {
        initialScores[p.id] = p.skorPenilaian ?? 0;
        initialEvals[p.id] = p.evaluasiDpl ?? "";
      });
      setScoreMap(initialScores);
      setEvalMap(initialEvals);
    } catch {
      toast.error("Gagal memuat daftar program kerja");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedKelompokId]);

  const handleSaveScore = async (proker: ProgramKerjaItem) => {
    const score = Number(scoreMap[proker.id] || 0);
    const evaluasi = evalMap[proker.id] || "";

    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Skor penilaian harus berada di antara 0 sampai 100");
      return;
    }

    setSavingId(proker.id);
    try {
      await dplService.assessProgramKerja(proker.id, score, evaluasi);
      toast.success(`Penilaian output proker berhasil disimpan!`);
      setProkerList((prev) =>
        prev.map((p) => (p.id === proker.id ? { ...p, skorPenilaian: score, evaluasiDpl: evaluasi } : p))
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan penilaian proker");
    } finally {
      setSavingId(null);
    }
  };

  const filteredProkers = prokerList.filter((p) => {
    const matchesSearch =
      p.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kelompokName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kelurahan.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedKelompokId]);

  const totalPages = Math.ceil(filteredProkers.length / itemsPerPage) || 1;
  const paginatedProkers = filteredProkers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100">
      {/* Clean Flat Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Penilaian Program Kerja KKN</h1>
          <p className="text-slate-500 text-sm mt-1">
            Evaluasi capaian output, dampak kebermanfaatan, serta akuntabilitas program kerja mahasiswa di lapangan.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2.5 rounded-xl text-center shadow-2xs">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">Total Program Kerja</span>
          <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{prokerList.length} Proker</span>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Kelompok:</span>
          <select
            value={selectedKelompokId}
            onChange={(e) => setSelectedKelompokId(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Kelompok Binaan</option>
            {kelompokList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} ({k.kelurahan ? `Kel. ${k.kelurahan}` : "Wilayah Dampingan"})
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari deskripsi program kerja..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <span className="text-xs font-semibold">Memuat penilaian program kerja...</span>
          </div>
        ) : filteredProkers.length === 0 ? (
          <EmptyTableState
            entityName="Program Kerja KKN"
            isSearch={!!(searchQuery || selectedKelompokId !== "ALL")}
            searchQuery={searchQuery}
            onResetSearch={() => {
              setSearchQuery("");
              setSelectedKelompokId("ALL");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 w-44">Kelompok</th>
                  <th className="py-3.5 px-4 min-w-[240px]">Rencana & Output Kegiatan</th>
                  <th className="py-3.5 px-4 w-28 text-center">Status</th>
                  <th className="py-3.5 px-4 w-28 text-center">Skor (0-100)</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Evaluasi Dampak DPL</th>
                  <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {paginatedProkers.map((p, idx) => {
                  const isSaving = savingId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{p.kelompokName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building size={12} className="text-slate-400" />
                          <span>Kel. {p.kelurahan}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-900 dark:text-slate-100 font-normal leading-relaxed">{p.deskripsi}</p>
                        <div className="text-[11px] text-slate-500 mt-1 font-mono">
                          Anggaran: Rp {Number(p.kebutuhanBiaya || 0).toLocaleString("id-ID")}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            (p.status as string) === "DITERIMA" || (p.status as string) === "DISETUJUI"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40"
                              : (p.status as string) === "DITOLAK" || (p.status as string) === "TIDAK_DISETUJUI"
                              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-700/40"
                              : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700/40"
                          }`}
                        >
                          {(p.status as string) === "DITERIMA" || (p.status as string) === "DISETUJUI"
                            ? "Disetujui"
                            : (p.status as string) === "DITOLAK" || (p.status as string) === "TIDAK_DISETUJUI"
                            ? "Ditolak"
                            : "Sedang Dilaksanakan"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={scoreMap[p.id] ?? ""}
                          onChange={(e) =>
                            setScoreMap({
                              ...scoreMap,
                              [p.id]: Number(e.target.value),
                            })
                          }
                          className="w-20 px-2 py-1.5 text-center font-black text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          placeholder="Catatan evaluasi dampak output..."
                          value={evalMap[p.id] || ""}
                          onChange={(e) =>
                            setEvalMap({
                              ...evalMap,
                              [p.id]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleSaveScore(p)}
                          disabled={isSaving}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
                        >
                          {isSaving ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Save size={13} />
                          )}
                          Simpan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filteredProkers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProkers.length}
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

export default PenilaianProkerPage;
