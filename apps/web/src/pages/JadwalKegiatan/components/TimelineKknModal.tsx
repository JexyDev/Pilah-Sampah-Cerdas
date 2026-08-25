/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useEffect } from "react";
import { X, Calendar, Users, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";

interface TimelineKknModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem?: any | null;
  groups: any[];
  defaultKelompokId?: string;
  kelurahanList?: string[];
}

const FASE_OPTIONS = [
  "Pra-Kegiatan",
  "Fase 1: Persiapan & Observasi",
  "Fase 2: Pilot Project",
  "Fase 3: Implementasi & Pendampingan",
  "Fase 4: Evaluasi & Penutupan",
];

const KELURAHAN_OPTIONS = [
  "Semua Kelurahan",
  "Dago",
  "Lebak Gede",
  "Lebak Siliwangi",
  "Sadang Serang",
  "Sekeloa",
  "Cipaganti",
];

const BIDANG_OPTIONS = [
  "Tata Kelola & Koordinasi",
  "Pemilahan Sampah",
  "Edukasi Warga & Sosialisasi",
  "Pengangkutan & Logistik",
  "Pengolahan & Bank Sampah",
  "Evaluasi & Pelaporan",
];

const STATUS_OPTIONS = [
  { value: "BELUM_DIMULAI", label: "Belum Dimulai", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  { value: "SEDANG_BERJALAN", label: "Sedang Berlangsung", color: "bg-emerald-500 text-white font-extrabold" },
  { value: "SELESAI", label: "Selesai", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" },
];

export const TimelineKknModal: React.FC<TimelineKknModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editItem,
  groups,
  defaultKelompokId,
  kelurahanList,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tahapMinggu: "Minggu 1",
    tanggal: "",
    startDate: "",
    endDate: "",
    fase: "Fase 1: Persiapan & Observasi",
    kegiatanUtama: "",
    outputTarget: "",
    picKeterangan: "",
    kelurahan: "Semua Kelurahan",
    bidangKegiatan: "Tata Kelola & Koordinasi",
    linkGoogleDrive: "",
    statusPelaksanaan: "BELUM_DIMULAI",
    kelompokId: defaultKelompokId || "GLOBAL",
  });

  useEffect(() => {
    if (editItem) {
      const sDate = editItem.startDate ? new Date(editItem.startDate).toISOString().split("T")[0] : "";
      const eDate = editItem.endDate ? new Date(editItem.endDate).toISOString().split("T")[0] : "";
      setFormData({
        tahapMinggu: editItem.tahapMinggu || "Minggu 1",
        tanggal: editItem.tanggal || "",
        startDate: sDate,
        endDate: eDate,
        fase: editItem.fase || "Fase 1: Persiapan & Observasi",
        kegiatanUtama: editItem.kegiatanUtama || "",
        outputTarget: editItem.outputTarget || "",
        picKeterangan: editItem.picKeterangan || "",
        kelurahan: editItem.kelurahan || editItem.kelompok?.kelurahan || "Semua Kelurahan",
        bidangKegiatan: editItem.bidangKegiatan || "Tata Kelola & Koordinasi",
        linkGoogleDrive: editItem.linkGoogleDrive || "",
        statusPelaksanaan: editItem.statusPelaksanaan || "BELUM_DIMULAI",
        kelompokId: editItem.kelompokId || "GLOBAL",
      });
    } else {
      setFormData({
        tahapMinggu: "Minggu 1",
        tanggal: "",
        startDate: "",
        endDate: "",
        fase: "Fase 1: Persiapan & Observasi",
        kegiatanUtama: "",
        outputTarget: "",
        picKeterangan: "",
        kelurahan: "Semua Kelurahan",
        bidangKegiatan: "Tata Kelola & Koordinasi",
        linkGoogleDrive: "",
        statusPelaksanaan: "BELUM_DIMULAI",
        kelompokId: defaultKelompokId || "GLOBAL",
      });
    }
  }, [editItem, isOpen, defaultKelompokId]);

  // Helper auto-format tanggal tampilan saat user memilih start/end date
  const handleDateChange = (type: "start" | "end", value: string) => {
    const nextStart = type === "start" ? value : formData.startDate;
    const nextEnd = type === "end" ? value : formData.endDate;

    let autoTanggal = formData.tanggal;
    if (nextStart && nextEnd) {
      const d1 = new Date(nextStart);
      const d2 = new Date(nextEnd);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const monthNames = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni",
          "Juli", "Agustus", "September", "Oktober", "November", "Desember",
        ];
        if (d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()) {
          if (d1.getDate() === d2.getDate()) {
            autoTanggal = `${d1.getDate()} ${monthNames[d1.getMonth()]} ${d1.getFullYear()}`;
          } else {
            autoTanggal = `${d1.getDate()} - ${d2.getDate()} ${monthNames[d1.getMonth()]} ${d1.getFullYear()}`;
          }
        } else {
          autoTanggal = `${d1.getDate()} ${monthNames[d1.getMonth()]} - ${d2.getDate()} ${monthNames[d2.getMonth()]} ${d2.getFullYear()}`;
        }
      }
    } else if (nextStart && !nextEnd) {
      const d1 = new Date(nextStart);
      if (!isNaN(d1.getTime())) {
        const monthNames = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni",
          "Juli", "Agustus", "September", "Oktober", "November", "Desember",
        ];
        autoTanggal = `${d1.getDate()} ${monthNames[d1.getMonth()]} ${d1.getFullYear()}`;
      }
    }

    setFormData((prev) => ({
      ...prev,
      startDate: nextStart,
      endDate: nextEnd,
      tanggal: autoTanggal,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tahapMinggu.trim()) {
      toast.error("Tahap / Minggu wajib diisi!");
      return;
    }
    if (!formData.kegiatanUtama.trim()) {
      toast.error("Kegiatan utama wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        tahapMinggu: formData.tahapMinggu.trim(),
        tanggal: formData.tanggal.trim() || (formData.startDate ? formData.startDate : "Sesuai Jadwal"),
        startDate: formData.startDate ? new Date(`${formData.startDate}T00:00:00.000Z`).toISOString() : null,
        endDate: formData.endDate ? new Date(`${formData.endDate}T23:59:59.000Z`).toISOString() : null,
        fase: formData.fase,
        kegiatanUtama: formData.kegiatanUtama.trim(),
        outputTarget: formData.outputTarget.trim() || "-",
        picKeterangan: formData.picKeterangan.trim() || "-",
        kelurahan: formData.kelurahan,
        bidangKegiatan: formData.bidangKegiatan,
        linkGoogleDrive: formData.linkGoogleDrive.trim(),
        statusPelaksanaan: formData.statusPelaksanaan,
        kelompokId: formData.kelompokId === "GLOBAL" ? null : formData.kelompokId,
      };

      if (editItem?.id) {
        await api.put(`/timeline-kkn/${editItem.id}`, payload);
        toast.success("Kegiatan linimasa berhasil diperbarui!");
      } else {
        await api.post("/timeline-kkn", payload);
        toast.success("Kegiatan linimasa berhasil ditambahkan!");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Gagal menyimpan kegiatan linimasa";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40 flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {editItem ? "Edit Rencana Kegiatan KKN" : "Tambah Rencana Kegiatan KKN"}
              </h3>
              <p className="text-xs text-slate-500">
                Lengkapi rincian linimasa, capaian output, cakupan wilayah, dan tautan dokumentasi Google Drive.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Cakupan Wilayah & Kelompok */}
          <div className="bg-slate-50/90 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users size={14} className="text-emerald-600" />
              Cakupan Wilayah & Kelompok Mahasiswa
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Kelurahan Sasaran
                </label>
                <select
                  value={formData.kelurahan}
                  onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition"
                >
                  {(kelurahanList && kelurahanList.length > 0 ? ["Semua Kelurahan", ...kelurahanList] : KELURAHAN_OPTIONS).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Unit Kelompok
                </label>
                <select
                  value={formData.kelompokId}
                  onChange={(e) => setFormData({ ...formData, kelompokId: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition"
                >
                  <option value="GLOBAL">🌐 Global (Acuan Seluruh Mahasiswa)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      👥 {g.name} {g.kelurahan ? `(${g.kelurahan})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Pilih "Global" jika merupakan agenda umum tingkat kecamatan/kampus, atau pilih kelurahan/kelompok spesifik.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tahap / Minggu */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tahap / Minggu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Minggu 1, Pra-Kegiatan"
                value={formData.tahapMinggu}
                onChange={(e) => setFormData({ ...formData, tahapMinggu: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Fase Program */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Fase Program <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.fase}
                onChange={(e) => setFormData({ ...formData, fase: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition"
              >
                {FASE_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Bidang Kegiatan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Bidang Kegiatan
              </label>
              <select
                value={formData.bidangKegiatan}
                onChange={(e) => setFormData({ ...formData, bidangKegiatan: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition"
              >
                {BIDANG_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tanggal Mulai & Tanggal Selesai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tanggal Mulai (Terstruktur)
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleDateChange("start", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tanggal Selesai (Terstruktur)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleDateChange("end", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition cursor-pointer"
              />
            </div>
          </div>

          {/* Label Tanggal Tampilan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Label Teks Tanggal di Tabel</span>
              <span className="text-[11px] font-normal text-slate-400">Terisi otomatis atau dapat disesuaikan</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: 12 - 18 Agustus 2026 atau 6 Agustus 2026 (Kamis)"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Kegiatan Utama */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Kegiatan Utama <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="Jelaskan agenda utama, aktivitas pokok lapangan, atau koordinasi..."
              value={formData.kegiatanUtama}
              onChange={(e) => setFormData({ ...formData, kegiatanUtama: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>

          {/* Output / Target Capaian */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Output / Target Capaian
            </label>
            <textarea
              rows={2}
              placeholder="Target capaian terukur, dokumen luaran, atau indikator keberhasilan..."
              value={formData.outputTarget}
              onChange={(e) => setFormData({ ...formData, outputTarget: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>

          {/* URL Google Drive */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>URL Folder Google Drive (Dokumentasi & Bukti)</span>
              <span className="text-[11px] font-normal text-slate-400">Opsional / Tautan Cloud</span>
            </label>
            <input
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={formData.linkGoogleDrive}
              onChange={(e) => setFormData({ ...formData, linkGoogleDrive: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PIC / Penanggung Jawab */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                PIC / Penanggung Jawab / Mitra
              </label>
              <input
                type="text"
                placeholder="Contoh: Mahasiswa KKN, DPL, DLH, Pengurus RW"
                value={formData.picKeterangan}
                onChange={(e) => setFormData({ ...formData, picKeterangan: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Status Pelaksanaan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Status Pelaksanaan
              </label>
              <select
                value={formData.statusPelaksanaan}
                onChange={(e) => setFormData({ ...formData, statusPelaksanaan: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition cursor-pointer"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>{editItem ? "Simpan Perubahan" : "Tambahkan ke Linimasa"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
