/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo.
 */

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Camera,
  X,
  Upload,
  Star,
  ShieldAlert,
  Loader2,
  ImageOff,
  RefreshCcw,
  Truck,
  ChevronRight
} from "lucide-react";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import { ConfirmModal } from "../../components/common/ConfirmModal";

const NotificationModal = ({
  notif,
  role,
  onClose,
  onSubmitEmpty,
  onApprove,
  onReject,
}: {
  notif: any;
  role: string;
  onClose: () => void;
  onSubmitEmpty: (evidencePhotoUrl: string) => Promise<void>;
  onApprove?: () => void;
  onReject?: () => void;
}) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (notif?.desc) {
        const reqIdMatch = notif.desc.match(/\[REQ-([\w-]+)\]/);
        if (reqIdMatch) {
          const reqId = reqIdMatch[1];
          try {
            const res = await api.get(`/bins/reset-request/${reqId}`);
            if (res.data.success && res.data.data.evidencePhotoUrl) {
              const url = res.data.data.evidencePhotoUrl;
              if (url.startsWith("/uploads")) {
                const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
                const host = baseUrl.replace("/api/v1", "");
                setEvidencePhoto(`${host}${url}`);
              } else {
                setEvidencePhoto(url);
              }
            }
          } catch (e) {
            console.error("Failed to fetch reset request detail:", e);
          }
        }
      }
    };
    fetchDetail();
  }, [notif]);

  if (!notif) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhoto(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async () => {
    if (!photoFile) return;
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("image", photoFile);
      const uploadRes = await api.post("/waste/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const evidencePhotoUrl = uploadRes.data.data.imageUrl;
      await onSubmitEmpty(evidencePhotoUrl);
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunggah foto bukti");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdminOrPetugas = [
    "DEVELOPER",
    "SUPER_USER",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
    "DPL",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "RT",
    "PETUGAS_RESIDU",
    "MAHASISWA_KKN",
  ].includes(role.toUpperCase());

  const renderContent = () => {
    if (
      (notif.type === "TONG_PENUH" || notif.type === "PENGAJUAN_PENGOSONGAN") &&
      isAdminOrPetugas
    ) {
      return (
        <div className="mt-4 space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex gap-3">
            <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="text-xs text-amber-900">
              <p className="font-black mb-0.5">Tindakan Review Diperlukan</p>
              <p className="leading-relaxed">
                Warga telah mengajukan pengosongan tempat sampah. Tinjau pengajuan ini dan tentukan tindakan Anda.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-white">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                Detail Pengajuan
              </p>
              <p className="text-xs text-slate-800 font-extrabold">{notif.desc}</p>
            </div>
            <div className="p-4 bg-slate-50 flex flex-col gap-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                Foto Bukti dari Warga
              </p>
              {evidencePhoto ? (
                <img
                  src={evidencePhoto}
                  alt="Bukti tempat sampah penuh"
                  className="w-full h-48 object-cover rounded-xl border border-slate-200 shadow-2xs"
                />
              ) : (
                <div className="w-full h-36 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200">
                  <ImageOff size={32} />
                  <p className="text-xs text-slate-400 font-semibold mt-1">Foto bukti belum diunggah oleh warga</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onReject}
              className="flex-1 py-2.5 rounded-xl text-xs font-extrabold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
            >
              ✕ Tolak Pengajuan
            </button>
            <button
              onClick={onApprove}
              className="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-[#009966] hover:bg-[#008855] text-white transition-all shadow-2xs cursor-pointer"
            >
              ✓ Setujui &amp; Reset
            </button>
          </div>
        </div>
      );
    }

    if (notif.type === "TONG_PENUH" && !isAdminOrPetugas) {
      return (
        <div className="mt-4 space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex gap-3">
            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
            <div className="text-xs text-rose-900">
              <p className="font-black mb-0.5">Aksi Diperlukan</p>
              <p className="leading-relaxed">
                Tempat sampah Anda telah mencapai kapasitas kritis. Silakan ambil foto bukti kondisi tempat sampah yang penuh untuk mengajukan pengosongan ke petugas RW.
              </p>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-50">
            {photo ? (
              <div className="relative w-full">
                <img
                  src={photo}
                  alt="Bukti tempat sampah penuh"
                  className="w-full h-48 object-cover rounded-xl border border-slate-200"
                />
                <button
                  onClick={() => {
                    setPhoto(null);
                    setPhotoFile(null);
                  }}
                  className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full hover:bg-white shadow-sm transition-colors cursor-pointer"
                >
                  <X size={16} className="text-slate-700" />
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white p-3 rounded-2xl shadow-2xs mb-3 text-[#009966]">
                  <Camera size={24} />
                </div>
                <p className="text-xs font-black text-slate-800 mb-0.5">Unggah Foto Bukti tempat Sampah</p>
                <p className="text-[11px] text-slate-400 font-semibold mb-4">Format JPG, PNG, WEBP max 2MB</p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border border-slate-200 hover:border-[#009966] hover:text-[#009966] text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
                >
                  <Upload size={15} /> Buka Kamera / Pilih File
                </button>
              </>
            )}
          </div>

          <button
            disabled={!photo || isSubmitting}
            onClick={handleFormSubmit}
            className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-2 ${
              photo && !isSubmitting
                ? "bg-[#009966] hover:bg-[#008855] text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCcw className="animate-spin" size={15} />
                <span>Mengirim Pengajuan...</span>
              </>
            ) : (
              "Ajukan Pengosongan"
            )}
          </button>
        </div>
      );
    }

    if (notif.type === "PENGAJUAN_DISETUJUI") {
      return (
        <div className="mt-4 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#009966] flex items-center justify-center mb-3">
            <CheckCircle size={28} />
          </div>
          <h4 className="font-black text-emerald-900 text-sm mb-1">Pengosongan Disetujui</h4>
          <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
            Petugas telah memverifikasi foto bukti Anda dan mereset kapasitas tempat sampah menjadi 0%. Terima kasih atas partisipasi Anda.
          </p>
        </div>
      );
    }

    if (notif.type === "POIN_BERTAMBAH") {
      return (
        <div className="mt-4 p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
            <Star size={28} />
          </div>
          <h4 className="font-black text-amber-900 text-sm mb-1">Poin Insentif Bertambah!</h4>
          <p className="text-xs text-amber-800 font-semibold leading-relaxed">
            Selamat! Anda mendapatkan tambahan poin insentif dari setoran pemilahan sampah. Kumpulkan terus poin untuk reward kebersihan lingkungan.
          </p>
        </div>
      );
    }

    if (
      notif.type === "JADWAL_JEMPUT" ||
      notif.type === "SCHEDULE" ||
      notif.title?.toLowerCase().includes("jadwal jemput") ||
      notif.desc?.toLowerCase().includes("tempat sampah yang perlu diangkut")
    ) {
      return (
        <div className="mt-4 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs font-semibold text-emerald-900 leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-black text-emerald-800">
            <Truck size={16} className="text-[#009966]" />
            <span>Pengingat Penjemputan Sampah</span>
          </div>
          <p>{notif.desc}</p>
        </div>
      );
    }

    return (
      <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 leading-relaxed">
        {notif.desc}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-[#009966] text-white">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-white text-base">Detail Notifikasi</h3>
            <span
              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                notif.type === "TONG_PENUH" || notif.type === "TEMPAT_SAMPAH_PENUH"
                  ? "bg-rose-400/20 text-rose-200 border border-rose-300/30"
                  : notif.type === "PENGAJUAN_PENGOSONGAN"
                  ? "bg-amber-400/20 text-amber-200 border border-amber-300/30"
                  : notif.type === "JADWAL_JEMPUT"
                  ? "bg-sky-400/20 text-sky-200 border border-sky-300/30"
                  : "bg-emerald-400/20 text-emerald-100 border border-emerald-300/30"
              }`}
            >
              {notif.type === "TONG_PENUH" || notif.type === "TEMPAT_SAMPAH_PENUH"
                ? "Peringatan Kritis"
                : notif.type === "PENGAJUAN_PENGOSONGAN"
                ? "Pengajuan Warga"
                : notif.type === "JADWAL_JEMPUT"
                ? "Jadwal Pengangkutan"
                : "Informasi Sistem"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-[#009966] flex items-center justify-center shrink-0 shadow-2xs font-bold">
              <Bell size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 leading-tight mb-0.5">
                {notif.title}
              </h4>
              <p className="text-[11px] text-slate-400 font-bold">{notif.time}</p>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-600 leading-relaxed">{notif.desc}</p>

          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const Notifikasi: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [filterTab, setFilterTab] = useState<"SEMUA" | "CRITICAL" | "INFO">("SEMUA");
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const { user } = useAuthStore();
  const rawRole = user?.peran || (user as any)?.role || "WARGA";
  const role = typeof rawRole === "string" ? rawRole : (rawRole as any)?.name || "WARGA";

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(true), 10000); // 10s real-time live sync
    return () => clearInterval(interval);
  }, [role]);

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get(`/notifications?role=${role}`);
      if (response.data?.data && Array.isArray(response.data.data)) {
        setNotifications(response.data.data);
      } else {
        setNotifications([]);
      }
    } catch (err: any) {
      console.error("Gagal mengambil notifikasi dari API:", err);
      if (!silent) setError("Gagal memuat log notifikasi sistem");
      if (!silent) setNotifications([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all").catch(() => {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("Semua notifikasi ditandai dibaca");
    } catch (_error) {
      toast.error("Gagal menandai notifikasi");
    }
  };

  const handleClearAll = () => {
    setIsClearAllModalOpen(true);
  };

  const handleConfirmClearAll = async () => {
    try {
      setIsClearingAll(true);
      await api.delete("/notifications/all").catch(() => {});
      setNotifications([]);
      toast.success("Semua log notifikasi berhasil dihapus!");
      setIsClearAllModalOpen(false);
    } catch (_error) {
      toast.error("Gagal menghapus notifikasi");
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleViewDetail = (notif: any) => {
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
    setSelectedNotif(notif);
  };

  const handleSubmitEmpty = async (evidencePhotoUrl: string) => {
    try {
      const getTargetBinId = async (desc: string, title: string) => {
        const qrMatch = desc.match(/(TS-\d+|BIN-\d+)/i);
        if (qrMatch) {
          const qr = qrMatch[1];
          const allBinsRes = await api.get("/bins").catch(() => ({ data: { data: [] } }));
          const found = allBinsRes.data.data.find(
            (b: any) => b.qrCode.toLowerCase() === qr.toLowerCase()
          );
          if (found) return found.id;
        }
        const myBinsRes = await api.get("/bins/my-bins").catch(() => ({ data: { data: [] } }));
        const myBins = myBinsRes.data.data;
        if (myBins && myBins.length > 0) {
          const isOrganic =
            title.toLowerCase().includes("organik") || desc.toLowerCase().includes("organik");
          const matched = myBins.find((b: any) =>
            isOrganic ? b.category === "ORGANIC" : b.category === "NON_ORGANIC"
          );
          if (matched) return matched.id;
          return myBins[0].id;
        }
        return null;
      };

      const binId = await getTargetBinId(selectedNotif.desc, selectedNotif.title);
      if (!binId) {
        toast.error("Gagal mendeteksi ID tempat sampah");
        return;
      }

      await api.post("/bins/reset-request", { binId, evidencePhotoUrl });
      toast.success("Pengajuan pengosongan berhasil dikirim ke petugas RW!");
      setSelectedNotif(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal mengirim pengajuan pengosongan");
    }
  };

  const handleApprove = async () => {
    if (!selectedNotif) return;
    const reqIdMatch = selectedNotif.desc.match(/\[REQ-([\w-]+)\]/);
    const requestId = reqIdMatch ? reqIdMatch[1] : null;

    if (requestId) {
      try {
        await api.put(`/bins/reset-request/${requestId}/review`, { status: "APPROVED" });
        toast.success("Pengajuan disetujui! Kapasitas tempat sampah berhasil direset.");
        setNotifications((prev) => prev.filter((n) => n.id !== selectedNotif.id));
        setSelectedNotif(null);
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || "Gagal menyetujui pengajuan");
      }
    } else {
      toast.success("Pengajuan disetujui! Kapasitas tempat sampah berhasil direset.");
      setNotifications((prev) => prev.filter((n) => n.id !== selectedNotif.id));
      setSelectedNotif(null);
    }
  };

  const handleReject = async () => {
    if (!selectedNotif) return;
    const reqIdMatch = selectedNotif.desc.match(/\[REQ-([\w-]+)\]/);
    const requestId = reqIdMatch ? reqIdMatch[1] : null;

    if (requestId) {
      try {
        await api.put(`/bins/reset-request/${requestId}/review`, { status: "REJECTED" });
        toast.error("Pengajuan ditolak.");
        setNotifications((prev) => prev.filter((n) => n.id !== selectedNotif.id));
        setSelectedNotif(null);
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || "Gagal menolak pengajuan");
      }
    } else {
      toast.error("Pengajuan ditolak.");
      setNotifications((prev) => prev.filter((n) => n.id !== selectedNotif.id));
      setSelectedNotif(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const criticalCount = notifications.filter(
    (n) => n.category === "CRITICAL" || n.type === "TEMPAT_SAMPAH_PENUH" || n.type === "TONG_PENUH" || n.type === "JADWAL_JEMPUT"
  ).length;
  const infoCount = notifications.length - criticalCount;

  const filteredNotifications = notifications.filter((n) => {
    if (filterTab === "CRITICAL") {
      return n.category === "CRITICAL" || n.type === "TEMPAT_SAMPAH_PENUH" || n.type === "TONG_PENUH" || n.type === "JADWAL_JEMPUT";
    }
    if (filterTab === "INFO") {
      return n.category !== "CRITICAL" && n.type !== "TEMPAT_SAMPAH_PENUH" && n.type !== "TONG_PENUH" && n.type !== "JADWAL_JEMPUT";
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* 1. GLASSMORPHISM HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#009966] to-emerald-950 text-white p-6 sm:p-8 shadow-xl shadow-emerald-900/10 border border-emerald-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-xs font-black backdrop-blur-md">
                <Bell size={13} /> Pusat Notifikasi
              </div>
              {unreadCount > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/80 text-white text-xs font-black backdrop-blur-md border border-rose-400/40">
                  {unreadCount} Belum Dibaca
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Pusat Notifikasi &amp; Aktivitas
            </h1>

            <p className="text-emerald-100/90 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
              Daftar pemberitahuan terkini mengenai pemantauan tempat sampah, jadwal penjemputan residu, dan aktivitas KKN wilayah Coblong.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-black flex items-center gap-2 backdrop-blur-md transition-all cursor-pointer"
            >
              <CheckCheck size={16} /> Tandai Dibaca Semua
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 text-xs font-black flex items-center gap-2 backdrop-blur-md transition-all cursor-pointer"
            >
              <Trash2 size={16} /> Hapus Semua
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS HIGHLIGHT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#009966] flex items-center justify-center shrink-0 font-bold">
            <Bell size={24} />
          </div>
          <div>
            <p className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Total Notifikasi</p>
            <h3 className="text-2xl font-black text-slate-800">{notifications.length}</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">Tercatat di Sistem</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 font-bold">
            <Info size={24} />
          </div>
          <div>
            <p className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Belum Dibaca</p>
            <h3 className="text-2xl font-black text-slate-800">{unreadCount}</h3>
            <p className="text-[10px] font-bold text-sky-600 mt-0.5">Perlu Ditinjau</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Peristiwa Kritis</p>
            <h3 className="text-2xl font-black text-slate-800">{criticalCount}</h3>
            <p className="text-[10px] font-bold text-rose-600 mt-0.5">Kapasitas Tempat Sampah &gt;90%</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Informasi Layanan</p>
            <h3 className="text-2xl font-black text-slate-800">{infoCount}</h3>
            <p className="text-[10px] font-bold text-indigo-600 mt-0.5">Jadwal &amp; Poin Insentif</p>
          </div>
        </div>
      </div>

      {/* 3. FILTER TABS & SEARCH BAR */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterTab("SEMUA")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              filterTab === "SEMUA"
                ? "bg-[#009966] text-white shadow-md shadow-emerald-700/20"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Semua ({notifications.length})
          </button>
          <button
            onClick={() => setFilterTab("CRITICAL")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === "CRITICAL"
                ? "bg-rose-600 text-white shadow-md shadow-rose-700/20"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <AlertCircle size={15} /> Kritis / Aksi ({criticalCount})
          </button>
          <button
            onClick={() => setFilterTab("INFO")}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === "INFO"
                ? "bg-sky-600 text-white shadow-md shadow-sky-700/20"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Info size={15} /> Informasi ({infoCount})
          </button>
        </div>

        <button
          onClick={() => fetchNotifications(false)}
          className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin text-[#009966]" : ""} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 4. NOTIFICATION ITEMS LIST */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 space-y-3 min-h-[380px]">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3 font-bold text-xs">
            <Loader2 className="animate-spin text-[#009966]" size={32} />
            <p>Memuat log notifikasi real-time dari server...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-rose-600 font-extrabold text-xs">
            {error}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-semibold text-xs flex flex-col items-center justify-center gap-2">
            <BellOff size={36} className="text-slate-300 mb-1" />
            <p>Belum ada notifikasi pada kategori ini.</p>
            <p className="text-[11px] text-slate-400 font-normal">Sistem beroperasi normal tanpa peringatan kritis.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isCritical =
              notif.category === "CRITICAL" ||
              notif.type === "TONG_PENUH" ||
              notif.type === "TEMPAT_SAMPAH_PENUH";
            const isSuccess = notif.type === "PENGAJUAN_DISETUJUI" || notif.type === "POIN_BERTAMBAH";

            return (
              <div
                key={notif.id}
                onClick={() => handleViewDetail(notif)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group flex items-start gap-4 ${
                  !notif.isRead
                    ? "bg-emerald-50/40 border-emerald-300/80 shadow-2xs"
                    : "bg-white border-slate-200/80 hover:bg-slate-50/80"
                }`}
              >
                {/* Visual Icon Badge */}
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                    isCritical
                      ? "bg-rose-100 text-rose-700 border-rose-200"
                      : isSuccess
                      ? "bg-emerald-100 text-[#009966] border-emerald-200"
                      : "bg-sky-100 text-sky-700 border-sky-200"
                  }`}
                >
                  {isCritical ? (
                    <AlertTriangle size={20} />
                  ) : isSuccess ? (
                    <CheckCircle size={20} />
                  ) : (
                    <Info size={20} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className={`text-xs sm:text-sm truncate ${!notif.isRead ? "font-black text-slate-900" : "font-extrabold text-slate-700"}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10.5px] font-extrabold text-slate-400 shrink-0">
                      {notif.time}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed pr-2">
                    {notif.desc}
                  </p>

                  {!notif.isRead && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[10.5px] font-black text-[#009966] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Tinjau Detail <ChevronRight size={12} />
                      </span>
                    </div>
                  )}
                </div>

                {/* Unread Pill Dot */}
                {!notif.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#009966] shrink-0 mt-1.5 ring-4 ring-emerald-100 animate-pulse" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Inspection Modal */}
      {selectedNotif && (
        <NotificationModal
          notif={selectedNotif}
          role={role}
          onClose={() => setSelectedNotif(null)}
          onSubmitEmpty={handleSubmitEmpty}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Confirmation Modal Hapus Semua Notifikasi */}
      <ConfirmModal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        onConfirm={handleConfirmClearAll}
        isLoading={isClearingAll}
        title="Hapus Semua Notifikasi"
        message="Apakah Anda yakin ingin menghapus seluruh riwayat notifikasi sistem? Data notifikasi yang dihapus tidak dapat dipulihkan."
        confirmText="Ya, Hapus Semua"
        type="danger"
      />
    </div>
  );
};

export default Notifikasi;
