/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Mobile Logbook List & Detail View for Mahasiswa KKN
 */

import React, { useState, useEffect } from "react";
import {
  FileText,
  PlusCircle,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw,
  Search,
  Filter,
  X,
} from "lucide-react";
import { logbookApiService, type LogbookMahasiswaItem } from "../../services/logbookService";
import showToast from "../../utils/showToast";

interface MahasiswaLogbookMobileProps {
  onOpenCreateModal: () => void;
}

export const MahasiswaLogbookMobile: React.FC<MahasiswaLogbookMobileProps> = ({
  onOpenCreateModal,
}) => {
  const [logbooks, setLogbooks] = useState<LogbookMahasiswaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedLogbook, setSelectedLogbook] = useState<LogbookMahasiswaItem | null>(null);

  useEffect(() => {
    fetchLogbooks();
  }, []);

  const fetchLogbooks = async () => {
    try {
      setIsLoading(true);
      const data = await logbookApiService.getMahasiswaLogbooks();
      setLogbooks(data);
    } catch (err) {
      console.error("Gagal memuat logbook", err);
      showToast.error("Gagal memuat daftar logbook");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logbooks.filter((log) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "APPROVED") return log.statusApproval === "DISETUJUI_DPL";
    if (statusFilter === "PENDING") return log.statusApproval === "MENUNGGU_VERIFIKASI_DPL" || log.statusApproval === "MENUNGGU_PERSETUJUAN_KETUA";
    if (statusFilter === "REVISION") return log.statusApproval === "PERLU_REVISI_DPL" || log.statusApproval === "DITOLAK_KETUA";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 1. Header Banner & Action Button */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Logbook KKN Mahasiswa</h2>
            <p className="text-[11px] text-slate-500">Laporan harian aktivitas &amp; validasi DPL</p>
          </div>
          <button
            onClick={fetchLogbooks}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* CTA Button */}
        <button
          onClick={onOpenCreateModal}
          className="w-full py-3 bg-[#035941] hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle size={16} />
          <span>+ Catat Logbook Kegiatan Baru</span>
        </button>

        {/* Status Filter Segmented Controls */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-[10px] font-bold">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`py-1.5 rounded-xl transition ${
              statusFilter === "ALL"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Semua ({logbooks.length})
          </button>
          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={`py-1.5 rounded-xl transition ${
              statusFilter === "APPROVED"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Valid DPL
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`py-1.5 rounded-xl transition ${
              statusFilter === "PENDING"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Menunggu
          </button>
          <button
            onClick={() => setStatusFilter("REVISION")}
            className={`py-1.5 rounded-xl transition ${
              statusFilter === "REVISION"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Revisi
          </button>
        </div>
      </div>

      {/* 2. Logbook List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={24} className="animate-spin text-emerald-600" />
            <span>Memuat logbook...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400 space-y-2">
            <FileText size={32} className="mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold">Tidak ada data logbook</p>
            <p className="text-[11px]">Belum ada aktivitas pada filter ini.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => setSelectedLogbook(log)}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-2xs hover:border-emerald-500 transition cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider ${
                    log.statusApproval === "DISETUJUI_DPL"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : log.statusApproval === "PERLU_REVISI_DPL" || log.statusApproval === "DITOLAK_KETUA"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {log.statusApproval === "DISETUJUI_DPL"
                    ? "✓ Disetujui DPL"
                    : log.statusApproval === "PERLU_REVISI_DPL"
                    ? "⚠ Perlu Revisi"
                    : "⏳ Menunggu Validasi"}
                </span>

                <span className="text-[10px] font-bold text-slate-400">
                  Pekan ke-{log.pekanKe || 1}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                  {log.deskripsi}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(log.tanggalKegiatan).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {log.waktuMulai} - {log.waktuSelesai}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={11} />
                    {log.tempat}
                  </span>
                </div>
              </div>

              {log.fotoBuktiUrl && (
                <div className="h-32 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
                  <img src={log.fotoBuktiUrl} alt="Bukti Foto" className="w-full h-full object-cover" />
                </div>
              )}

              {log.catatanDpl && (
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 space-y-0.5">
                  <span className="font-bold text-[10px] uppercase">Catatan DPL:</span>
                  <p>{log.catatanDpl}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 3. Modal Detail Logbook */}
      {selectedLogbook && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[88vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Detail Logbook Kegiatan</h3>
              <button
                onClick={() => setSelectedLogbook(null)}
                className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status Validasi:</span>
                <span className="font-bold text-emerald-600">{selectedLogbook.statusApproval}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tanggal:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {new Date(selectedLogbook.tanggalKegiatan).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Waktu &amp; Durasi:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedLogbook.waktuMulai} - {selectedLogbook.waktuSelesai}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Lokasi:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLogbook.tempat}</span>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Deskripsi Lengkap:</span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  {selectedLogbook.deskripsi}
                </p>
              </div>

              {selectedLogbook.fotoBuktiUrl && (
                <div className="space-y-1 pt-2">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Foto Bukti Lapangan:</span>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={selectedLogbook.fotoBuktiUrl} alt="Foto Bukti" className="w-full h-auto object-contain" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 shrink-0">
              <button
                onClick={() => setSelectedLogbook(null)}
                className="w-full py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-bold rounded-xl text-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
