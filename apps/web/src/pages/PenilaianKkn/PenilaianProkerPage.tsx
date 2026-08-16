/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Save,
  Search,
  Loader2,
  Building,
  Award
} from "lucide-react";
import toast from "react-hot-toast";
import { dplService, type ProgramKerjaItem } from "../../services/dplService";
import api from "../../services/api";

export const PenilaianProkerPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [prokerList, setProkerList] = useState<ProgramKerjaItem[]>([]);
  const [kelompokList, setKelompokList] = useState<any[]>([]);
  const [selectedKelompokId, setSelectedKelompokId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-on-surface">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-3">
            <Award size={14} />
            Submenu Penilaian KKN (2 / 3)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Penilaian Output Program Kerja</h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
            Evaluasi capaian riil, kebermanfaatan, serta akuntabilitas program kerja kelompok mahasiswa KKN di lapangan.
          </p>
        </div>

        <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[160px]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">Total Program Kerja</span>
          <p className="text-2xl font-black text-white mt-0.5">{prokerList.length}</p>
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
            placeholder="Cari deskripsi program kerja..."
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
            <span className="text-xs font-semibold">Memuat penilaian program kerja...</span>
          </div>
        ) : filteredProkers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileSpreadsheet className="mx-auto text-slate-300" size={48} />
            <h3 className="text-sm font-bold text-slate-700 mt-2">Tidak Ada Data Program Kerja</h3>
            <p className="text-xs text-slate-400">Belum ada program kerja yang terdaftar di kelompok ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 w-44">Kelompok</th>
                  <th className="py-3.5 px-4 min-w-[240px]">Rencana & Output Kegiatan</th>
                  <th className="py-3.5 px-4 w-28 text-center">Status</th>
                  <th className="py-3.5 px-4 w-28 text-center">Skor (0-100)</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Evaluasi Dampak DPL</th>
                  <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProkers.map((p, idx) => {
                  const isSaving = savingId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                        {p.nomor || idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.kelompokName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building size={12} className="text-slate-400" />
                          <span>Kel. {p.kelurahan}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-900 font-normal leading-relaxed">{p.deskripsi}</p>
                        <div className="text-[11px] text-slate-500 mt-1 font-mono">
                          Anggaran: Rp {Number(p.kebutuhanBiaya || 0).toLocaleString("id-ID")}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            p.status === "DITERIMA"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : p.status === "DITOLAK"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {p.status === "DITERIMA"
                            ? "Diterima"
                            : p.status === "DITOLAK"
                            ? "Ditolak"
                            : "Belum Disetujui"}
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
                          className="w-20 px-2 py-1.5 text-center font-black text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
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
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
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
      </div>
    </div>
  );
};

export default PenilaianProkerPage;
