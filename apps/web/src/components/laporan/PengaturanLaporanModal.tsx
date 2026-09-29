/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Komponen: Modal Pengaturan Naskah Dokumen Laporan (CRUD Lengkap)
 * Mengatur Judul Dinamis, Nomor Dokumen, Sifat, Lampiran, dan Penandatangan Eksekutif (Pak Rektor / Bu Umi / Ketua Pelaksana)
 */

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  Sliders,
  RotateCcw,
  CheckCircle2,
  Building,
  UserCheck,
  Calendar,
  Hash,
} from "lucide-react";

export interface ReportCustomConfig {
  judulLaporan: string;
  subjudul: string;
  nomorDokumen: string;
  sifatDokumen: string;
  lampiranDokumen: string;
  perihalDokumen: string;
  wilayahCakupan: string;
  tanggalPengesahan: string;
  penandatangan: {
    preset: "KETUA_PELAKSANA" | "PAK_REKTOR" | "BU_UMI" | "CUSTOM";
    jabatan: string;
    instansi: string;
    nama: string;
    nip: string;
  };
}

export const DEFAULT_REPORT_CONFIG: ReportCustomConfig = {
  judulLaporan: "LAPORAN EKSEKUTIF PELAKSANAAN KULIAH KERJA NYATA (KKN) & TATA KELOLA LINGKUNGAN",
  subjudul: "PENGELOLAAN SAMPAH MANDIRI DAN EKOSISTEM BERSIH (BERSEKA)",
  nomorDokumen: "027/UNIKOM-BERSEKA/KKN-T/2026",
  sifatDokumen: "Penting / Kedinasan Terbuka",
  lampiranDokumen: "1 (Satu) Berkas Rekapitulasi Lengkap",
  perihalDokumen: "Laporan Eksekutif Pelaksanaan KKN dan Tata Kelola Lingkungan",
  wilayahCakupan: "Kecamatan Coblong, Kota Bandung (6 Kelurahan, 86 RW)",
  tanggalPengesahan: "29 September 2026",
  penandatangan: {
    preset: "KETUA_PELAKSANA",
    jabatan: "Ketua Tim Pelaksana Task Force KKN BERSEKA",
    instansi: "Universitas Komputer Indonesia x BERSEKA",
    nama: "Ketua Pelaksana KKN",
    nip: "19800512 200501 1 004",
  },
};

export const DEFAULT_WASTE_REPORT_CONFIG: ReportCustomConfig = {
  judulLaporan: "LAPORAN EVALUASI & AKUNTABILITAS TATA KELOLA PERSAMPAHAN",
  subjudul: "PENGELOLAAN PERSAMPAHAN KECAMATAN COBLONG BERBASIS PLATFORM CERDAS BERSEKA",
  nomorDokumen: "005/BERSEKA-DLH/EVAL/IX/2026",
  sifatDokumen: "Penting / Kedinasan Terbuka",
  lampiranDokumen: "1 (Satu) Berkas Rekapitulasi Lengkap",
  perihalDokumen: "Laporan Akuntabilitas dan Evaluasi Kinerja Tata Kelola Persampahan Berbasis Ekonomi Sirkular",
  wilayahCakupan: "Kecamatan Coblong (6 Kelurahan, 86 RW)",
  tanggalPengesahan: "29 September 2026",
  penandatangan: {
    preset: "KETUA_PELAKSANA",
    jabatan: "Ketua Tim Pelaksana Task Force BERSEKA",
    instansi: "Universitas Komputer Indonesia x BERSEKA",
    nama: "Ketua Tim Pelaksana",
    nip: "19800512 200501 1 004",
  },
};

export const SIGNATORY_PRESETS = {
  KETUA_PELAKSANA: {
    jabatan: "Ketua Tim Pelaksana Task Force KKN BERSEKA",
    instansi: "Universitas Komputer Indonesia x BERSEKA",
    nama: "Ketua Pelaksana KKN",
    nip: "19800512 200501 1 004",
  },
  PAK_REKTOR: {
    jabatan: "Rektor Universitas Komputer Indonesia",
    instansi: "Universitas Komputer Indonesia (UNIKOM)",
    nama: "Prof. Dr. Ir. H. Eddy Soeryanto Soegoto, M.T.",
    nip: "4127.34.01.001",
  },
  BU_UMI: {
    jabatan: "Wakil Rektor Bidang Akademik dan Kemahasiswaan",
    instansi: "Universitas Komputer Indonesia (UNIKOM)",
    nama: "Dr. Hj. Umi Narimawati, Dra., S.E., M.Si.",
    nip: "4127.34.01.002",
  },
};

interface PengaturanLaporanModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ReportCustomConfig;
  onSave: (newConfig: ReportCustomConfig) => void;
  onReset: () => void;
}

export const PengaturanLaporanModal: React.FC<PengaturanLaporanModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onReset,
}) => {
  const [formData, setFormData] = useState<ReportCustomConfig>(config);

  useEffect(() => {
    setFormData(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handlePresetSelect = (presetKey: "KETUA_PELAKSANA" | "PAK_REKTOR" | "BU_UMI") => {
    const selected = SIGNATORY_PRESETS[presetKey];
    setFormData((prev) => ({
      ...prev,
      penandatangan: {
        preset: presetKey,
        ...selected,
      },
    }));
  };

  const handleCustomSignatoryChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      penandatangan: {
        ...prev.penandatangan,
        preset: "CUSTOM",
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pengaturan Naskah Dokumen Laporan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubah judul laporan, nomor dokumen, dan pejabat penandatangan secara dinamis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-medium">
          {/* 1. Bagian Judul Dokumen */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Judul &amp; Identitas Dokumen</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Judul Utama Laporan (Dapat Diubah Bebas):
              </label>
              <textarea
                rows={2}
                value={formData.judulLaporan}
                onChange={(e) => setFormData({ ...formData, judulLaporan: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-bold text-xs"
                placeholder="Masukkan judul laporan resmi..."
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Subjudul Laporan:
              </label>
              <input
                type="text"
                value={formData.subjudul}
                onChange={(e) => setFormData({ ...formData, subjudul: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-semibold text-xs"
                placeholder="Subjudul kegiatan / program..."
                required
              />
            </div>
          </div>

          {/* 2. Bagian Nomor Dokumen & Detail Naskah */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <Hash className="w-4 h-4 text-emerald-600" />
              <span>Detail Nomor &amp; Administrasi Surat (CRUD Manual)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Nomor Dokumen / Naskah:
                </label>
                <input
                  type="text"
                  value={formData.nomorDokumen}
                  onChange={(e) => setFormData({ ...formData, nomorDokumen: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold text-xs"
                  placeholder="Contoh: 027/UNIKOM-BERSEKA/KKN-T/2026"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Tanggal Pengesahan:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.tanggalPengesahan}
                    onChange={(e) => setFormData({ ...formData, tanggalPengesahan: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                    placeholder="Contoh: 29 September 2026"
                    required
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Sifat Dokumen:
                </label>
                <input
                  type="text"
                  value={formData.sifatDokumen}
                  onChange={(e) => setFormData({ ...formData, sifatDokumen: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  placeholder="Penting / Kedinasan Terbuka"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Lampiran Dokumen:
                </label>
                <input
                  type="text"
                  value={formData.lampiranDokumen}
                  onChange={(e) => setFormData({ ...formData, lampiranDokumen: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  placeholder="1 (Satu) Berkas Rekapitulasi Lengkap"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Perihal Dokumen:
                </label>
                <input
                  type="text"
                  value={formData.perihalDokumen}
                  onChange={(e) => setFormData({ ...formData, perihalDokumen: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                  placeholder="Perihal naskah laporan..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Wilayah Cakupan Dokumen:
                </label>
                <input
                  type="text"
                  value={formData.wilayahCakupan}
                  onChange={(e) => setFormData({ ...formData, wilayahCakupan: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  placeholder="Kecamatan Coblong, Kota Bandung (6 Kelurahan, 86 RW)"
                />
              </div>
            </div>
          </div>

          {/* 3. Bagian Pejabat Penandatangan (Tengah Bawah) */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Pejabat Penandatangan Resmi (Tengah Bawah)</span>
            </div>

            {/* Tombol Preset Cepat */}
            <div>
              <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">
                Pilih Preset Pejabat Pengesah:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetSelect("KETUA_PELAKSANA")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    formData.penandatangan.preset === "KETUA_PELAKSANA"
                      ? "border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Ketua Pelaksana</span>
                    {formData.penandatangan.preset === "KETUA_PELAKSANA" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Task Force KKN Berseka</div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect("PAK_REKTOR")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    formData.penandatangan.preset === "PAK_REKTOR"
                      ? "border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Pak Rektor</span>
                    {formData.penandatangan.preset === "PAK_REKTOR" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Prof. Dr. Ir. H. Eddy Soeryanto</div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect("BU_UMI")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    formData.penandatangan.preset === "BU_UMI"
                      ? "border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Bu Umi</span>
                    {formData.penandatangan.preset === "BU_UMI" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Dr. Hj. Umi Narimawati</div>
                </button>
              </div>
            </div>

            {/* Rincian Pejabat (Bisa diedit manual) */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                    Nama Pejabat:
                  </label>
                  <input
                    type="text"
                    value={formData.penandatangan.nama}
                    onChange={(e) => handleCustomSignatoryChange("nama", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                    NIP / NIDN:
                  </label>
                  <input
                    type="text"
                    value={formData.penandatangan.nip}
                    onChange={(e) => handleCustomSignatoryChange("nip", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                    Jabatan Resmi:
                  </label>
                  <input
                    type="text"
                    value={formData.penandatangan.jabatan}
                    onChange={(e) => handleCustomSignatoryChange("jabatan", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                    Instansi / Lembaga:
                  </label>
                  <input
                    type="text"
                    value={formData.penandatangan.instansi}
                    onChange={(e) => handleCustomSignatoryChange("instansi", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onReset();
                setFormData(DEFAULT_REPORT_CONFIG);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standar</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                Terapkan Pengaturan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
