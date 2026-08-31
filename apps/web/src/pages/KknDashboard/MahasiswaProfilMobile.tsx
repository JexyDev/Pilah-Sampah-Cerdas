/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Mobile Profile & Leave Request View for Mahasiswa KKN
 */

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  LogOut,
  FileText,
  Clock,
  Send,
  Loader2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Building2,
  X,
  Camera,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import api from "../../utils/api";
import showToast from "../../utils/showToast";
import { compressImage } from "../../utils/compressImage";
import { useNavigate } from "react-router-dom";

export const MahasiswaProfilMobile: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [showIzinModal, setShowIzinModal] = useState(false);
  const [tipeIzin, setTipeIzin] = useState<"IZIN" | "SAKIT">("IZIN");
  const [alasan, setAlasan] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split("T")[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState(new Date().toISOString().split("T")[0]);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [riwayatIzin, setRiwayatIzin] = useState<any[]>([]);
  const [isLoadingIzin, setIsLoadingIzin] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRiwayatIzin();
  }, []);

  const fetchRiwayatIzin = async () => {
    try {
      setIsLoadingIzin(true);
      const res = await api.get("/students/leave-request");
      setRiwayatIzin(res.data?.data || []);
    } catch {
      // Fallback
    } finally {
      setIsLoadingIzin(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.8 });
      setFotoFile(compressed);
      setFotoPreview(URL.createObjectURL(compressed));
    } catch {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitIzin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!alasan.trim()) {
      showToast.error("Alasan pengajuan izin wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("type", tipeIzin);
      formData.append("reason", alasan.trim());
      formData.append("startDate", tanggalMulai);
      formData.append("endDate", tanggalSelesai);
      if (fotoFile) {
        formData.append("evidence", fotoFile);
      }

      await api.post("/students/leave-request", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast.success("Pengajuan izin berhasil dikirim ke DPL!");
      setShowIzinModal(false);
      setAlasan("");
      setFotoFile(null);
      setFotoPreview(null);
      fetchRiwayatIzin();
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal mengajukan izin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast.success("Berhasil keluar");
    navigate("/login");
  };

  return (
    <div className="space-y-4">
      {/* 1. Profile Summary Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-600 to-[#035941] text-white flex items-center justify-center text-2xl font-black shadow-md shrink-0">
            {user?.avatar || (user?.name ? user.name[0] : "M")}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white truncate">
                {user?.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              NIM: <strong className="text-slate-800 dark:text-slate-200">{user?.nip || user?.phone || "-"}</strong>
            </p>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              Mahasiswa KKN 2026
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Wilayah KKN:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{user?.wilayah || "Coblong"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">No. Telepon:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{user?.phone || "-"}</span>
          </div>
        </div>
      </div>

      {/* 2. Leave Request Action Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white">Pengajuan Izin / Sakit</h3>
            <p className="text-[10px] text-slate-500">Izin berhalangan hadir kegiatan KKN</p>
          </div>
          <button
            onClick={() => setShowIzinModal(true)}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer transition"
          >
            + Ajukan Izin
          </button>
        </div>

        {/* Riwayat Izin */}
        {isLoadingIzin ? (
          <div className="py-4 text-center text-xs text-slate-400">Memuat riwayat izin...</div>
        ) : riwayatIzin.length === 0 ? (
          <p className="text-[11px] text-slate-400 text-center py-2">Belum ada pengajuan izin/sakit.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {riwayatIzin.map((iz) => (
              <div key={iz.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{iz.reason}</p>
                  <p className="text-[10px] text-slate-400">
                    {iz.type} • {new Date(iz.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    iz.status === "APPROVED" || iz.status === "DISETUJUI"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : iz.status === "REJECTED" || iz.status === "DITOLAK"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {iz.status || "Menunggu"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Logout Button */}
      <div className="pt-2">
        <button
          onClick={handleLogout}
          className="w-full py-3.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut size={16} />
          <span>Keluar dari Akun</span>
        </button>
      </div>

      {/* 4. Modal Pengajuan Izin */}
      {showIzinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/60">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Formulir Izin / Sakit</h3>
              <button
                onClick={() => setShowIzinModal(false)}
                className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitIzin} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Kategori</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipeIzin("IZIN")}
                    className={`py-2 rounded-xl font-bold transition cursor-pointer border ${
                      tipeIzin === "IZIN"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-500"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Izin Keperluan
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipeIzin("SAKIT")}
                    className={`py-2 rounded-xl font-bold transition cursor-pointer border ${
                      tipeIzin === "SAKIT"
                        ? "bg-rose-50 text-rose-700 border-rose-500"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Sakit (Surat Dokter)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Alasan Keterangan *</label>
                <textarea
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan keterangan lengkap alasan izin/sakit..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Foto Surat Keterangan / Bukti</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {fotoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-300 max-h-36">
                    <img src={fotoPreview} alt="Bukti" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setFotoFile(null);
                        setFotoPreview(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-slate-900/80 text-white rounded-full"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-500"
                  >
                    <Camera size={18} />
                    <span>Ambil Foto Surat Keterangan</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !alasan.trim()}
                className="w-full py-3 bg-[#035941] text-white rounded-xl font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Pengajuan Izin"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
