/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 */

import React, { useState, useEffect } from "react";
import {
  Search,
  Save,
  Loader2,
  CalendarCheck,
  Trophy
} from "lucide-react";
import toast from "react-hot-toast";
import { dplService, type StudentDetail } from "../../services/dplService";
import api from "../../services/api";
import { Pagination } from "../../components/common/Pagination";
import { EmptyTableState } from "../../components/common/EmptyTableState";

export const PenilaianMahasiswaPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [kelompokList, setKelompokList] = useState<any[]>([]);
  const [selectedKelompokId, setSelectedKelompokId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Local score & note state map
  const [scoreMap, setScoreMap] = useState<Record<string, number>>({});
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const kelRes = await api.get("/kelompok");
      if (kelRes.data?.success && Array.isArray(kelRes.data.data)) {
        setKelompokList(kelRes.data.data);
      }

      const data = await dplService.getStudents(
        selectedKelompokId !== "ALL" ? selectedKelompokId : undefined
      );
      setStudents(data);

      const initialScores: Record<string, number> = {};
      const initialNotes: Record<string, string> = {};
      data.forEach((st) => {
        initialScores[st.id] = st.assessmentScore || 0;
        initialNotes[st.id] = (st as any).assessmentNote || "";
      });
      setScoreMap(initialScores);
      setNoteMap(initialNotes);
    } catch (err) {
      toast.error("Gagal memuat daftar mahasiswa bimbingan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedKelompokId]);

  const handleSaveScore = async (student: StudentDetail) => {
    const score = Number(scoreMap[student.id] || 0);
    const note = noteMap[student.id] || "";

    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Nilai harus berupa angka di rentang 0 - 100");
      return;
    }

    setSavingStudentId(student.id);
    try {
      await dplService.assessStudent(student.id, score, note);
      toast.success(`Nilai untuk ${student.name} berhasil disimpan!`);
      // Update local state
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, assessmentScore: score } : s))
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan nilai");
    } finally {
      setSavingStudentId(null);
    }
  };

  const filteredStudents = students.filter((s) => {
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100">
      {/* Clean Flat Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Penilaian Mahasiswa KKN</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Form evaluasi performa, inisiatif lapangan, dan keaktifan individu mahasiswa KKN dampingan Dosen Pendamping Lapangan (DPL).
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-2.5 rounded-xl text-center shadow-2xs">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">Total Mahasiswa</span>
          <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{students.length} Mahasiswa</span>
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
            placeholder="Cari nama, NIM, jurusan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <span className="text-xs font-semibold">Memuat daftar mahasiswa...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <EmptyTableState
            entityName="Penilaian Mahasiswa"
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
                <tr className="bg-slate-50/90 dark:bg-slate-800/90 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Mahasiswa & NIM</th>
                  <th className="py-3.5 px-4 w-40">Kelompok & Prodi</th>
                  <th className="py-3.5 px-4 w-32 text-center">Presensi & Poin</th>
                  <th className="py-3.5 px-4 w-28 text-center">Nilai (0-100)</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Catatan Asesmen DPL</th>
                  <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {paginatedStudents.map((st, idx) => {
                  const isSaving = savingStudentId === st.id;

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 dark:bg-slate-800/80 dark:hover:bg-slate-800/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {st.name}
                          {st.isKetua && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md font-extrabold">
                              Ketua
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {st.nim || "-"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{st.kelompokName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                          {st.jurusan}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
                          <CalendarCheck size={13} className="text-indigo-600" />
                          <span>{st.attendanceRate}%</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                          <Trophy size={11} className="text-amber-500" />
                          <span>{st.individualPoints} Poin</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={scoreMap[st.id] ?? ""}
                          onChange={(e) =>
                            setScoreMap({
                              ...scoreMap,
                              [st.id]: Number(e.target.value),
                            })
                          }
                          className="w-20 px-2 py-1.5 text-center font-black text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          placeholder="Catatan evaluasi individu..."
                          value={noteMap[st.id] || ""}
                          onChange={(e) =>
                            setNoteMap({
                              ...noteMap,
                              [st.id]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleSaveScore(st)}
                          disabled={isSaving}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
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

export default PenilaianMahasiswaPage;
