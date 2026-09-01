/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Mobile Presensi GPS Geofencing Component for Mahasiswa KKN (iOS Safari Optimized)
 */

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Navigation,
  ShieldCheck,
  Send,
  Loader2,
  Image as ImageIcon,
  Check,
  History,
  X,
  Compass,
  Calendar,
  CalendarX,
  Info,
} from "lucide-react";
import api from "../../utils/api";
import showToast from "../../utils/showToast";
import { compressImage } from "../../utils/compressImage";
import { useAuthStore } from "../../store/useAuthStore";

// Haversine Formula untuk menghitung jarak dalam meter
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export const MahasiswaPresensiMobile: React.FC = () => {
  const { user } = useAuthStore();

  // Location State
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Posko Info
  const [posko, setPosko] = useState<{ name: string; lat: number; lng: number; radius: number } | null>(null);
  const [distanceToPosko, setDistanceToPosko] = useState<number | null>(null);

  // Active Session State
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Active Kegiatan Schedule State
  const [kegiatanList, setKegiatanList] = useState<any[]>([]);
  const [isLoadingKegiatan, setIsLoadingKegiatan] = useState(true);

  // Skip Modal State
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [selectedKegiatanToSkip, setSelectedKegiatanToSkip] = useState<any | null>(null);
  const [alasanSkip, setAlasanSkip] = useState("");
  const [isSubmittingSkip, setIsSubmittingSkip] = useState(false);

  // Form State
  const [deskripsi, setDeskripsi] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Ambil Data Posko, Jadwal Kegiatan Aktif, & Riwayat Presensi
  useEffect(() => {
    fetchPoskoData();
    fetchKegiatanAktif();
    fetchRiwayatPresensi();
  }, []);

  // 2. Timer untuk Sesi Aktif
  useEffect(() => {
    let interval: any;
    const startWaktu = activeSession?.jamMasuk || activeSession?.checkInAt;
    if (activeSession && startWaktu) {
      const updateTimer = () => {
        const start = new Date(startWaktu).getTime();
        const now = Date.now();
        const diffSec = Math.max(0, Math.floor((now - start) / 1000));
        const hrs = String(Math.floor(diffSec / 3600)).padStart(2, "0");
        const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, "0");
        const secs = String(diffSec % 60).padStart(2, "0");
        setElapsedTime(`${hrs}:${mins}:${secs}`);
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const fetchPoskoData = async () => {
    try {
      const res = await api.get("/areas/posko");
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        const myPosko = list[0];
        if (myPosko.latitude && myPosko.longitude) {
          setPosko({
            name: myPosko.nama || myPosko.name || "Posko KKN Utama",
            lat: Number(myPosko.latitude),
            lng: Number(myPosko.longitude),
            radius: myPosko.radiusMeters || 150,
          });
        }
      }
    } catch {
      setPosko({
        name: "Posko KKN Kelurahan",
        lat: -6.8856,
        lng: 107.6135,
        radius: 200,
      });
    }
  };

  const fetchKegiatanAktif = async () => {
    try {
      setIsLoadingKegiatan(true);
      const res = await api.get("/kkn/kegiatan-aktif");
      const list = res.data?.data || [];
      setKegiatanList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Gagal memuat kegiatan aktif", err);
    } finally {
      setIsLoadingKegiatan(false);
    }
  };

  const fetchRiwayatPresensi = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await api.get("/presensi/mandiri/saya");
      const rawData = res.data?.data;
      const list: any[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.items)
        ? rawData.items
        : [];
      setHistoryList(list);

      const active = list.find(
        (item: any) =>
          item.status === "AKTIF" ||
          item.statusPresensi === "AKTIF" ||
          (!item.checkOutAt && !item.jamPulang)
      );
      if (active) {
        setActiveSession({
          id: active.presensiId || active.id,
          jamMasuk: active.checkInAt || active.jamMasuk,
          jamPulang: active.checkOutAt || active.jamPulang,
          deskripsiKegiatan: active.deskripsiKegiatan,
          fotoBuktiUrl: active.fotoUrl || active.fotoBuktiUrl,
          status: active.status || active.statusPresensi,
          ...active,
        });
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat presensi", err);
      setHistoryList([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 3. Ambil Lokasi GPS Presisi Tinggi (iOS Safari Compatible)
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Perangkat Anda tidak mendukung fitur lokasi GPS.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCoords({ latitude, longitude, accuracy });
        setIsLocating(false);

        if (posko) {
          const dist = calculateDistanceMeters(latitude, longitude, posko.lat, posko.lng);
          setDistanceToPosko(dist);
        }

        if (accuracy > 100) {
          showToast.warning("Akurasi GPS rendah (>100m). Pastikan fitur 'Lokasi Tepat' aktif di iPhone Anda.");
        } else {
          showToast.success("Koordinat GPS berhasil dikunci secara akurat!");
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setLocationError("Izin lokasi ditolak. Buka Pengaturan iPhone > Privasi & Keamanan > Layanan Lokasi > Safari > Izinkan.");
        } else if (err.code === 2) {
          setLocationError("Sinyal GPS tidak tersedia. Silakan berpindah ke tempat terbuka.");
        } else {
          setLocationError("Gagal mengambil lokasi GPS dalam batas waktu (Timeout). Coba lagi.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Trigger GPS saat pertama kali membuka halaman presensi
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // 4. Penanganan Kamera & Kompresi Foto
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Kompres foto langsung di sisi browser iPhone (convert HEIC/PNG ke compressed JPG)
      const compressed = await compressImage(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.75 });
      setFotoFile(compressed);

      const previewUrl = URL.createObjectURL(compressed);
      setFotoPreview(previewUrl);
      showToast.success("Foto kegiatan berhasil diambil & dioptimasi!");
    } catch (err) {
      console.error("Gagal memproses foto", err);
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  // 5. Submit Presensi Check-In
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!coords) {
      showToast.error("Wajib mengunci titik koordinat GPS terlebih dahulu!");
      getCurrentLocation();
      return;
    }

    if (!fotoFile) {
      showToast.error("Wajib mengambil foto bukti kegiatan di lokasi!");
      return;
    }

    if (!deskripsi.trim()) {
      showToast.error("Deskripsi kegiatan wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("foto", fotoFile);
      formData.append("deskripsiKegiatan", deskripsi.trim());
      formData.append("latitude", String(coords.latitude));
      formData.append("longitude", String(coords.longitude));

      const res = await api.post("/presensi/mandiri", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success || res.status === 200 || res.status === 201) {
        showToast.success("Presensi mandiri berhasil dicatat! Selamat bertugas.");
        setFotoFile(null);
        setFotoPreview(null);
        setDeskripsi("");
        fetchRiwayatPresensi();
        fetchKegiatanAktif();
      }
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal melakukan presensi mandiri.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Submit Presensi Check-Out
  const handleCheckOut = async () => {
    if (!activeSession) return;
    const targetId = activeSession.id || activeSession.presensiId;
    if (!targetId) return;

    setIsSubmitting(true);
    try {
      const res = await api.patch(`/presensi/mandiri/${targetId}/checkout`, {
        deskripsiKegiatan: activeSession.deskripsiKegiatan,
      });

      if (res.data?.success || res.status === 200) {
        showToast.success("Check-out berhasil! Sesi presensi hari ini telah selesai.");
        setActiveSession(null);
        fetchRiwayatPresensi();
        fetchKegiatanAktif();
      }
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal melakukan check-out presensi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Handler Skip Kegiatan (Tidak Ada Kegiatan)
  const handleOpenSkipModal = (kegiatan: any) => {
    setSelectedKegiatanToSkip(kegiatan);
    setAlasanSkip("Tidak ada kegiatan di posko pada hari ini");
    setShowSkipModal(true);
  };

  const handleConfirmSkip = async () => {
    if (!selectedKegiatanToSkip) return;

    setIsSubmittingSkip(true);
    try {
      const res = await api.post(`/kkn/kegiatan/${selectedKegiatanToSkip.id}/skip`, {
        alasan: alasanSkip.trim() || "Tidak ada kegiatan",
      });

      if (res.data?.success || res.status === 200) {
        showToast.success("Jadwal kegiatan berhasil ditandai sebagai: Tidak Ada Kegiatan.");
        setShowSkipModal(false);
        setSelectedKegiatanToSkip(null);
        fetchKegiatanAktif();
        fetchRiwayatPresensi();
      }
    } catch (err: any) {
      showToast.error(err.response?.data?.message || "Gagal menandai tidak ada kegiatan.");
    } finally {
      setIsSubmittingSkip(false);
    }
  };

  const primaryKegiatan = kegiatanList.length > 0 ? kegiatanList[0] : null;
  const isSkippedToday =
    primaryKegiatan?.statusKehadiran === "TIDAK_ADA_KEGIATAN" ||
    primaryKegiatan?.attendanceStatus === "TIDAK_ADA_KEGIATAN";

  const isDplOrKetuaOrAdmin =
    user?.peran === "DPL" ||
    user?.peran === "DOSEN_PEMBIMBING" ||
    user?.peran === "SUPER_USER" ||
    user?.peran === "DEVELOPER" ||
    user?.peran === "ADMIN_DLH" ||
    Boolean((user as any)?.isKetua) ||
    Boolean((user as any)?.studentKkn?.isKetua);

  return (
    <div className="space-y-4">
      {/* 1. Header Card Banner */}
      <div className="bg-gradient-to-br from-[#035941] via-[#024633] to-[#013325] text-white p-4 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              GPS Geofencing Mobile
            </span>
            <button
              onClick={() => {
                getCurrentLocation();
                fetchKegiatanAktif();
              }}
              disabled={isLocating}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
            >
              <RefreshCw size={12} className={isLocating ? "animate-spin" : ""} />
              <span>{isLocating ? "Mencari..." : "Segarkan"}</span>
            </button>
          </div>
          <h2 className="text-xl font-black tracking-tight pt-1">Presensi Lapangan KKN</h2>
          <p className="text-[11px] text-emerald-100/90 leading-snug">
            Verifikasi kehadiran berbasis koordinat GPS nyata & foto kegiatan langsung.
          </p>
        </div>
      </div>

      {/* 2. Kartu Jadwal Kegiatan Aktif Hari Ini (KegiatanKknCard) */}
      {isLoadingKegiatan ? (
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 size={16} className="animate-spin text-emerald-600" />
          <span>Memeriksa jadwal kegiatan aktif...</span>
        </div>
      ) : primaryKegiatan ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <Calendar size={12} className="text-emerald-600" />
                <span>Jadwal Kegiatan Hari Ini</span>
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white truncate mt-0.5">
                {primaryKegiatan.namaKegiatan || "Kegiatan Harian Posko KKN"}
              </h3>
            </div>

            {/* Badge Status Kegiatan */}
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                isSkippedToday
                  ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                  : primaryKegiatan.statusKehadiran === "HADIR" || primaryKegiatan.statusKehadiran === "HADIR_MEMENUHI"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : primaryKegiatan.statusKehadiran === "BERLANGSUNG"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse"
                  : "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
              }`}
            >
              {isSkippedToday
                ? "⚪ Tidak Ada Kegiatan"
                : primaryKegiatan.statusDisplay || primaryKegiatan.status || "Aktif"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-400 font-medium">Jam Kegiatan</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {primaryKegiatan.jamMulai && primaryKegiatan.jamSelesai
                  ? `${primaryKegiatan.jamMulai} - ${primaryKegiatan.jamSelesai} WIB`
                  : primaryKegiatan.time || "08:00 - 16:00 WIB"}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-400 font-medium">Durasi Wajib</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {primaryKegiatan.durasiWajibMenit || 120} Menit
              </p>
            </div>
          </div>

          {/* Banner jika di-Skip */}
          {isSkippedToday && (
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <Info size={14} className="text-slate-500" />
                <span>Kegiatan Diliburkan / Dikosongkan</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Alasan: "{primaryKegiatan.keteranganSkip || "Tidak ada kegiatan pada hari ini"}". Anda tidak
                diwajibkan melakukan presensi dan tidak dikenakan sanksi Alpa.
              </p>
            </div>
          )}

          {/* Tombol Skip Kegiatan untuk Ketua Kelompok / DPL */}
          {isDplOrKetuaOrAdmin && !isSkippedToday && !activeSession && (
            <button
              onClick={() => handleOpenSkipModal(primaryKegiatan)}
              className="w-full py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CalendarX size={14} className="text-slate-500" />
              <span>Tandai: Tidak Ada Kegiatan</span>
            </button>
          )}
        </div>
      ) : null}

      {/* 3. Status Lokasi & Geofence Posko */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Compass size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white">Status GPS iPhone</p>
              <p className="text-[10px] text-slate-500">
                {coords ? `Akurasi: ±${Math.round(coords.accuracy)}m` : "Sedang mendeteksi satelit..."}
              </p>
            </div>
          </div>

          {coords && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                coords.accuracy <= 50
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {coords.accuracy <= 50 ? "Akurasi Tinggi" : "Perlu Stabilisasi"}
            </span>
          )}
        </div>

        {coords && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-[11px] font-mono text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>📍 {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}</span>
            <button
              onClick={getCurrentLocation}
              className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
            >
              Update
            </button>
          </div>
        )}

        {locationError && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-500" />
            <div className="space-y-1">
              <p className="font-bold">Kendala Izin Lokasi</p>
              <p className="text-[11px] leading-relaxed">{locationError}</p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Tampilan Sesi Aktif ATAU Form Check-In Baru */}
      {isSkippedToday ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xs text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <CalendarX size={24} />
          </div>
          <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">Presensi Hari Ini Dinonaktifkan</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Jadwal kegiatan posko hari ini telah ditandai sebagai "Tidak Ada Kegiatan".
          </p>
          <div className="pt-2">
            <button
              disabled
              className="w-full py-3.5 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl text-xs font-black uppercase tracking-wider cursor-not-allowed"
            >
              Tidak Ada Kegiatan
            </button>
          </div>
        </div>
      ) : activeSession ? (
        /* KARTU SESI SEDANG BERLANGSUNG */
        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Sesi Presensi Aktif
            </span>
            <div className="flex items-center gap-1 text-xs font-mono font-black text-slate-700 dark:text-slate-200">
              <Clock size={14} className="text-emerald-600" />
              <span>{elapsedTime}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Waktu Masuk:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {(activeSession.jamMasuk || activeSession.checkInAt)
                  ? new Date(activeSession.jamMasuk || activeSession.checkInAt).toLocaleTimeString("id-ID")
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between items-start text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-400">Deskripsi:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[200px]">
                {activeSession.deskripsiKegiatan || "-"}
              </span>
            </div>
          </div>

          {(activeSession.fotoBuktiUrl || activeSession.fotoUrl) && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48">
              <img
                src={activeSession.fotoBuktiUrl || activeSession.fotoUrl}
                alt="Bukti Kehadiran"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <button
            onClick={handleCheckOut}
            disabled={isSubmitting}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Memproses Checkout...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Akhiri Sesi &amp; Check-Out</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* FORM CHECK-IN PRESENSI MANDIRI BARU */
        <form onSubmit={handleCheckIn} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xs space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Formulir Presensi Masuk</h3>
            <p className="text-[11px] text-slate-500">Ambil foto kegiatan lapangan dan berikan ringkasan tugas.</p>
          </div>

          {/* Trigger Kamera Langsung (iOS Safari Native Camera) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              1. Foto Bukti Kegiatan (Kamera Langsung) *
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoCapture}
            />

            {fotoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-sm max-h-52">
                <img src={fotoPreview} alt="Preview Foto" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setFotoFile(null);
                    setFotoPreview(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/80 text-white rounded-full hover:bg-slate-900 transition cursor-pointer"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-2 left-2 right-2 py-1 px-2.5 bg-slate-900/75 backdrop-blur-sm rounded-xl text-[10px] text-white font-bold flex items-center justify-between">
                  <span>Foto Terkompresi Siap Kirim</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="underline text-emerald-300"
                  >
                    Ulangi Foto
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-2xl flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/40 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera size={24} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Buka Kamera iPhone / Ambil Foto
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Mendukung format foto &amp; otomatis kompresi</p>
                </div>
              </button>
            )}
          </div>

          {/* Deskripsi Kegiatan */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              2. Deskripsi Aktivitas Hari Ini *
            </label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Contoh: Edukasi pemilahan sampah organik ke warga RW 06 dan monitoring fasilitas Loseda..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Wajib diisi ringkas dan jelas</span>
              <span>{deskripsi.length} / 500</span>
            </div>
          </div>

          {/* Tombol Check-In */}
          <button
            type="submit"
            disabled={isSubmitting || !coords || !fotoFile || !deskripsi.trim()}
            className="w-full py-3.5 bg-[#035941] hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Menyimpan Presensi...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Simpan Presensi Masuk</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* 5. Riwayat Presensi Singkat */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
            <History size={16} className="text-emerald-600" />
            <span>Riwayat Kehadiran Terakhir</span>
          </div>
          <span className="text-[10px] text-slate-400">{(Array.isArray(historyList) ? historyList : []).length} Sesi</span>
        </div>

        {isLoadingHistory ? (
          <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 size={20} className="animate-spin text-emerald-600" />
            <span>Memuat riwayat...</span>
          </div>
        ) : (Array.isArray(historyList) ? historyList : []).length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Belum ada catatan presensi.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(Array.isArray(historyList) ? historyList : []).slice(0, 5).map((item, idx) => (
              <div key={item.id || item.presensiId || idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {item.deskripsiKegiatan || "Aktivitas Lapangan"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {(item.jamMasuk || item.checkInAt) ? new Date(item.jamMasuk || item.checkInAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"}{" "}
                    • Masuk: {(item.jamMasuk || item.checkInAt) ? new Date(item.jamMasuk || item.checkInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${
                    item.statusPresensi === "TIDAK_ADA_KEGIATAN" || item.status === "TIDAK_ADA_KEGIATAN"
                      ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      : (item.jamPulang || item.checkOutAt)
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {item.statusPresensi === "TIDAK_ADA_KEGIATAN" || item.status === "TIDAK_ADA_KEGIATAN"
                    ? "Tidak Ada Kegiatan"
                    : (item.jamPulang || item.checkOutAt)
                    ? "Selesai"
                    : "Sedang Aktif"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Modal Konfirmasi Skip Kegiatan */}
      {showSkipModal && selectedKegiatanToSkip && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Tandai "Tidak Ada Kegiatan"?
                </h4>
                <p className="text-[10px] text-slate-500 font-mono">
                  {selectedKegiatanToSkip.namaKegiatan || "Jadwal KKN"}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Seluruh anggota kelompok pada jadwal ini akan mendapatkan status{" "}
              <span className="font-bold text-slate-900 dark:text-white">"Tidak Ada Kegiatan"</span> dan tidak
              diwajibkan hadir. Tindakan ini tidak dapat dibatalkan oleh mahasiswa biasa.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Alasan Ketiadaan Kegiatan:</label>
              <input
                type="text"
                value={alasanSkip}
                onChange={(e) => setAlasanSkip(e.target.value)}
                placeholder="Contoh: Libur posko / Koordinasi luar wilayah"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowSkipModal(false);
                  setSelectedKegiatanToSkip(null);
                }}
                disabled={isSubmittingSkip}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmSkip}
                disabled={isSubmittingSkip}
                className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSubmittingSkip ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Ya, Tandai</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
