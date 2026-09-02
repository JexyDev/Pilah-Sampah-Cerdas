/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Mobile Form Modal for Mahasiswa KKN Logbook Entry (iOS Safari Camera Optimized)
 */

import React, { useState, useRef } from "react";
import {
  X,
  Camera,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { logbookApiService } from "../../services/logbookService";
import { compressImage } from "../../utils/compressImage";
import showToast from "../../utils/showToast";
import { useAuthStore } from "../../store/useAuthStore";

interface MahasiswaLogbookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prokerList?: Array<{ id: string; judul?: string; deskripsi: string }>;
}

export const MahasiswaLogbookFormModal: React.FC<MahasiswaLogbookFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  prokerList = [],
}) => {
  const { user } = useAuthStore();

  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [waktuMulai, setWaktuMulai] = useState("08:00");
  const [waktuSelesai, setWaktuSelesai] = useState("12:00");
  const [tempat, setTempat] = useState(user?.wilayah || "Wilayah KKN");
  const [deskripsi, setDeskripsi] = useState("");
  const [selectedProkerId, setSelectedProkerId] = useState("");
  const [tipeAktivitas, setTipeAktivitas] = useState<"INDIVIDU" | "KELOMPOK">("KELOMPOK");

  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 });
      setFotoFile(compressed);
      setFotoPreview(URL.createObjectURL(compressed));
      showToast.success("Foto bukti kegiatan berhasil dimuat!");
    } catch {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    } finally {
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deskripsi.trim()) {
      showToast.error("Deskripsi aktivitas wajib diisi!");
      return;
    }

    if (!fotoFile) {
      showToast.error("Wajib melampirkan foto bukti kegiatan!");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("tanggalKegiatan", tanggal);
      formData.append("waktuMulai", waktuMulai);
      formData.append("waktuSelesai", waktuSelesai);
      formData.append("tempat", tempat);
      formData.append("deskripsi", deskripsi.trim());
      formData.append("tipeAktivitas", tipeAktivitas);
      if (selectedProkerId) {
        formData.append("programKerjaId", selectedProkerId);
      }
      formData.append("foto", fotoFile);

      await logbookApiService.createMahasiswaLogbook(formData);
      showToast.success("Logbook kegiatan KKN berhasil disimpan!");
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal menyimpan logbook kegiatan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header Modal */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText size={18} className="text-emerald-600" />
              Catat Logbook Kegiatan
            </h3>
            <p className="text-[10px] text-slate-500">Laporan harian aktivitas KKN mahasiswa</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Tipe Aktivitas (Kelompok vs Individu) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipe Aktivitas</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipeAktivitas("KELOMPOK")}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer border ${
                  tipeAktivitas === "KELOMPOK"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-500"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}
              >
                👥 Bersama Kelompok
              </button>
              <button
                type="button"
                onClick={() => setTipeAktivitas("INDIVIDU")}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer border ${
                  tipeAktivitas === "INDIVIDU"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-500"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}
              >
                👤 Mandiri / Individu
              </button>
            </div>
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="col-span-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Mulai</label>
              <input
                type="time"
                value={waktuMulai}
                onChange={(e) => setWaktuMulai(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="col-span-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Selesai</label>
              <input
                type="time"
                value={waktuSelesai}
                onChange={(e) => setWaktuSelesai(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Tempat Kegiatan */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Lokasi / Tempat *</label>
            <input
              type="text"
              value={tempat}
              onChange={(e) => setTempat(e.target.value)}
              placeholder="Contoh: Posko RW 06 Dago / Bank Sampah Unit"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Program Kerja Terkait (Opsional) */}
          {prokerList.length > 0 && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Program Kerja (Opsional)</label>
              <select
                value={selectedProkerId}
                onChange={(e) => setSelectedProkerId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Tidak Terikat Proker Khusus --</option>
                {prokerList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.judul || p.deskripsi?.slice(0, 40) + "..."}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Deskripsi Aktivitas */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Deskripsi Kegiatan Lengkap *</label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={3}
              placeholder="Jelaskan secara detail kegiatan apa saja yang dilakukan, hasil yang dicapai, dan pihak yang terlibat..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Foto Bukti Kegiatan (Kamera Langsung & Unggah Galeri) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Foto Bukti Kegiatan *</label>
              <span className="text-[9px] text-slate-400">Kamera atau Galeri</span>
            </div>

            {/* Input khusus Kamera Langsung (iOS / Android Camera Viewfinder) */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoCapture}
            />

            {/* Input khusus Unggah File / Galeri Foto */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoCapture}
            />

            {fotoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 max-h-48 shadow-sm">
                <img src={fotoPreview} alt="Bukti Kegiatan" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-black/30 pointer-events-none" />
                
                {/* Tombol Hapus */}
                <button
                  type="button"
                  onClick={() => {
                    setFotoFile(null);
                    setFotoPreview(null);
                    if (cameraInputRef.current) cameraInputRef.current.value = "";
                    if (galleryInputRef.current) galleryInputRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition cursor-pointer shadow-md"
                  title="Hapus Foto"
                >
                  <X size={14} />
                </button>

                {/* Bottom Bar Info & Action */}
                <div className="absolute bottom-2 left-2 right-2 py-1.5 px-3 bg-slate-900/85 backdrop-blur-md rounded-xl text-[10px] text-white flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span className="font-semibold truncate">{fotoFile?.name || "Foto Siap Dikirim"}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="text-[10px] font-bold text-emerald-300 hover:text-emerald-200 underline cursor-pointer"
                    >
                      Kamera
                    </button>
                    <span className="text-slate-500">|</span>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="text-[10px] font-bold text-teal-300 hover:text-teal-200 underline cursor-pointer"
                    >
                      Galeri
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-3.5 px-2.5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 rounded-2xl flex flex-col items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 transition cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Camera size={18} />
                  </div>
                  <span className="font-bold text-[11px] text-center">Ambil Foto Langsung</span>
                  <span className="text-[9px] text-slate-400 text-center">Buka kamera gawai</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="py-3.5 px-2.5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 rounded-2xl flex flex-col items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 transition cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ImageIcon size={18} />
                  </div>
                  <span className="font-bold text-[11px] text-center">Pilih dari Galeri</span>
                  <span className="text-[9px] text-slate-400 text-center">Unggah file album/dokumen</span>
                </button>
              </div>
            )}
          </div>

          {/* Tombol Simpan */}
          <button
            type="submit"
            disabled={isSubmitting || !deskripsi.trim() || !fotoFile}
            className="w-full py-3.5 bg-[#035941] hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Menyimpan Logbook...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Kirim Logbook ke DPL</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
