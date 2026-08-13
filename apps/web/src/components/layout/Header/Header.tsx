/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Bell, 
  LayoutGrid, 
  BookOpen, 
  Settings, 
  LogOut, 
  ChevronRight,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react";
import showToast from "../../../utils/showToast";
import { useAuthStore } from "../../../store/useAuthStore";
import { getProfilePhotoUrl, handleAvatarError } from "../../../utils/photoUtils";
import api from "../../../services/api";

interface HeaderProps {
  onToggleSidebar: () => void;
  isCollapsed?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  // Dropdown visibility states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showBrosur, setShowBrosur] = useState(false);

  // Refs for closing on outside click
  const notifRef = useRef<HTMLDivElement>(null);
  const profRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifications(false);
      if (profRef.current && !profRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // EYD & KBBI Indonesian Standard Page Breadcrumb Titles
  const getBreadcrumbItems = (pathname: string, search: string = ""): string[] => {
    const fullPath = `${pathname}${search}`;

    if (pathname === "/dashboard-kkn") {
      return ["Dashboard KKN"];
    }

    if (pathname === "/manajemen-ekosistem-kkn") {
      if (search.includes("tab=MAHASISWA")) return ["Ekosistem KKN", "Portofolio Mahasiswa"];
      if (search.includes("tab=APPROVAL")) return ["Ekosistem KKN", "Persetujuan Sakit & Izin"];
      return ["Ekosistem KKN", "Kelompok KKN"];
    }

    if (pathname.startsWith("/superUser/data-survei-kkn/")) {
      return ["Data Survei KKN", "Detail Survei"];
    }

    switch (pathname) {
      case "/dashboard":
      case "/":
        return ["Dasbor Utama"];
      case "/monitoring":
        return ["Pemantauan Wilayah"];
      case "/monitoring-absen":
        return ["Presensi & Absensi KKN"];
      case "/monitoring-aktivitas":
        return ["Pemantauan Aktivitas"];
      case "/superUser/data-survei-kkn":
      case "/data-survei-kkn":
        return ["Data Survei KKN"];
      case "/superUser/import-survei-kkn":
      case "/import-survei-kkn":
        return ["Impor Survei KKN"];
      case "/evaluasi-dampak-kkn":
      case "/evaluasi-dampak":
        return ["Evaluasi Dampak KKN"];
      case "/manajemen-pengangkutan":
        return ["Pengangkutan Sampah"];
      case "/master-pengguna":
      case "/master-data-pengguna":
      case "/manajemen-pengguna":
      case "/users":
      case "/admin/users": {
        const params = new URLSearchParams(search);
        const role = params.get("role") || params.get("roleName") || params.get("type");
        if (role) {
          const roleMap: Record<string, string> = {
            developer: "Developer",
            admin: "Super User",
            superuser: "Super User",
            pimpinan: "Pimpinan",
            pemimpin: "Pimpinan",
            taskforce: "Task Force",
            dpl: "Dosen Pembimbing Lapangan",
            dlh: "Dinas Lingkungan Hidup",
            camat: "Camat",
            lurah: "Lurah",
            rw: "Rukun Warga",
            "petugas-residu": "Petugas Residu",
            mahasiswa: "Mahasiswa",
            warga: "Warga",
          };
          const label = roleMap[role.toLowerCase()];
          if (label) return ["Master Pengguna", label];
        }
        return ["Master Pengguna"];
      }
      case "/manajemen-tempat-sampah":
        return ["Manajemen Tempat Sampah"];
      case "/manajemen-lokasi":
      case "/peta":
        return ["Manajemen Lokasi"];
      case "/dashboard-dpl":
        return ["Dasbor DPL"];
      case "/role-permissions":
        return ["Hak Akses & Peran"];
      case "/manajemen-ekosistem-kkn":
        return ["Ekosistem Program KKN"];
      case "/kkn-portal":
        return ["Portal KKN"];
      case "/residu-portal":
        return ["Portal Petugas Residu"];
      case "/pemanfaatan-sampah":
        return ["Pemanfaatan Sampah"];
      case "/hasil-pemanfaatan":
        return ["Hasil Pemanfaatan"];
      case "/setor-sampah":
      case "/setor":
        return ["Setoran Sampah Warga"];
      case "/jadwal-kegiatan":
        return ["Jadwal Kegiatan"];
      case "/input-manual":
        return ["Input Setoran Manual"];
      case "/kategori-sampah":
        return ["Kategori Sampah"];
      case "/rekap-setoran":
        return ["Rekapitulasi Setoran"];
      case "/poin-warga":
        return ["Poin Warga"];
      case "/leaderboard":
        return ["Papan Peringkat Warga"];
      case "/laporan-analitik":
        return ["Laporan & Analitik"];
      case "/notifikasi":
        return ["Notifikasi"];
      case "/pengaturan":
        return ["Pengaturan"];
      case "/evaluasi-ai":
      case "/superUser/discrepancies":
        return ["Evaluasi Selisih AI"];
      case "/superUser/configs":
        return ["Konfigurasi Sistem"];
      case "/superUser/audit":
        return ["Jejak Audit"];
      case "/superUser/qr-master":
        return ["Master Kode QR"];
      case "/rw/approval":
        return ["Persetujuan Tempat Sampah"];
      case "/rw/fasilitas":
        return ["Fasilitas & Ide"];
      case "/ide-daur-ulang":
        return ["Ide Daur Ulang"];
      case "/panduan":
        return ["Panduan Pemilahan"];
      case "/tentang":
        return ["Tentang Aplikasi"];
      default:
        return ["Dasbor Utama"];
    }
  };

  const breadcrumbItems = getBreadcrumbItems(location.pathname, location.search);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState<boolean>(false);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const roleParam = user?.peran || "WARGA";
      const response = await api.get(`/notifications?role=${roleParam}`);
      if (response.data?.data && Array.isArray(response.data.data)) {
        setNotifications(response.data.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to fetch notifications in Header:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s auto refresh
    return () => clearInterval(interval);
  }, [user?.peran]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkNotificationRead = async (notifId: string | number) => {
    try {
      if (typeof notifId === "string" && !notifId.startsWith("crit-") && !notifId.startsWith("sched-") && !notifId.startsWith("my-crit-")) {
        await api.put(`/notifications/${notifId}/read`);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleLogout = () => {
    logout();
    showToast.success("Berhasil keluar sistem");
    navigate("/login");
  };

  return (
    <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 transition-all shadow-2xs">
      {/* Left Section: Sidebar Toggle & Dynamic Breadcrumb Pills */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Toggle Sidebar Button (Green Squircle Icon Button) */}
        <button
          onClick={onToggleSidebar}
          title={isCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          className="w-10 h-10 rounded-2xl bg-[#e5f7ed] text-[#009966] hover:bg-[#d0f2df] active:scale-95 transition-all flex items-center justify-center border border-[#009966]/10 cursor-pointer shadow-2xs shrink-0"
        >
          <LayoutGrid size={19} />
        </button>

        {breadcrumbItems.map((item, idx) => (
          <React.Fragment key={idx}>
            {/* Breadcrumb Separator */}
            <ChevronRight size={14} className="text-slate-300 shrink-0 mx-0.5" />

            {/* Dynamic Breadcrumb Pill */}
            <div className={`border rounded-2xl px-4 py-2 shadow-2xs font-extrabold text-[13px] tracking-tight flex items-center gap-2 shrink-0 select-none ${
              idx === breadcrumbItems.length - 1
                ? "bg-white border-slate-200/80 text-slate-800"
                : "bg-slate-50/80 border-slate-200/60 text-slate-500"
            }`}>
              <span>{item}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Right Section: Notifications & Profile Card */}
      <div className="flex items-center gap-3 shrink-0">

        {/* Notification Bell Button */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-[#009966] hover:bg-slate-50 transition shadow-2xs relative cursor-pointer"
            title="Notifikasi Pemberitahuan Sistem"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#009966] rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notifications Popover Dropdown (Presisi Gambar 2) */}
          {showNotifications && (
            <div className="absolute top-12 right-0 w-[340px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Popover Header */}
              <div className="p-4 bg-gradient-to-r from-[#f0faf4] via-[#e5f7ed]/70 to-white border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#009966]/15 flex items-center justify-center text-[#009966]">
                    <Radio size={15} className="animate-pulse" />
                  </div>
                  <span className="text-xs font-black text-slate-800 tracking-tight">Notifikasi Sistem</span>
                </div>
                <span className="text-[11px] bg-[#e5f7ed] text-[#009966] px-3 py-1 rounded-full font-black border border-[#009966]/20 shrink-0">
                  {unreadCount > 0 ? `${unreadCount} Belum Dibaca` : `${notifications.length} Peristiwa`}
                </span>
              </div>

              {/* Popover List Body */}
              <div className="divide-y divide-slate-100/80 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                {loadingNotifs && notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs font-semibold text-slate-400">
                    Memuat notifikasi aktual...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs font-bold text-slate-400 flex flex-col items-center gap-1.5">
                    <Bell size={24} className="text-slate-300 mb-1" />
                    <span>Tidak ada notifikasi baru</span>
                    <span className="text-[10.5px] font-normal text-slate-400">Sistem dalam kondisi normal & optimal.</span>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isCritical = n.title?.toLowerCase().includes("kritis") || n.title?.toLowerCase().includes("penuh") || n.type === "TONG_PENUH";
                    const isSuccess = n.title?.toLowerCase().includes("sukses") || n.title?.toLowerCase().includes("setuju") || n.type === "POIN_BERTAMBAH";

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleMarkNotificationRead(n.id)}
                        className={`p-4 flex gap-3 transition-all hover:bg-slate-50/80 cursor-pointer ${
                          !n.isRead ? "bg-emerald-50/30" : ""
                        }`}
                      >
                        {/* Soft Squircle Icon Badge */}
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${
                            isCritical
                              ? "bg-rose-50 border-rose-100 text-rose-500"
                              : isSuccess
                              ? "bg-emerald-50 border-emerald-100 text-[#009966]"
                              : "bg-sky-50 border-sky-100 text-sky-600"
                          }`}
                        >
                          {isCritical ? (
                            <AlertTriangle size={18} />
                          ) : isSuccess ? (
                            <CheckCircle2 size={18} />
                          ) : (
                            <Info size={18} />
                          )}
                        </div>

                        {/* Text & Time Body */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline gap-2">
                            <p className="text-xs font-black text-slate-800 truncate leading-tight">{n.title}</p>
                            <span className="text-[10px] text-slate-400 font-semibold shrink-0">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed mt-1 font-medium line-clamp-2">
                            {n.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Popover Footer Button */}
              <button
                onClick={() => {
                  setShowNotifications(false);
                  navigate("/notifikasi");
                }}
                className="w-full text-center py-3 bg-slate-50/90 border-t border-slate-100 text-xs font-black text-[#009966] hover:bg-emerald-50/60 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Lihat Semua Notifikasi</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Vertical Separator */}
        <div className="h-6 w-px bg-slate-200 mx-0.5 shrink-0" />

        {/* User Profile Pill Card (1:1 Presisi Simetris Referensi Design) */}
        <div className="relative" ref={profRef}>
          <div
            onClick={() => setShowProfile(!showProfile)}
            className="bg-gradient-to-r from-white via-emerald-50/20 to-emerald-50/60 border border-slate-200/90 hover:border-emerald-300 rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all duration-300 group select-none shadow-2xs"
          >
            <div className="flex flex-col items-center justify-center text-center gap-0.5">
              <span className="text-xs font-black text-slate-900 tracking-tight leading-tight block truncate max-w-[120px]">
                {user?.name || "Super User"}
              </span>
              <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider leading-none">
                {user?.peran ? (
                  user.peran === "SUPER_USER" ? "ADMIN" :
                  user.peran === "DEVELOPER" ? "DEVELOPER" :
                  user.peran === "MAHASISWA_KKN" ? "MAHASISWA" :
                  user.peran === "PANITIA_TASKFORCE" ? "TASK FORCE" :
                  user.peran.replace("_", " ")
                ) : "ADMIN"}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#009966] text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-sm shadow-emerald-600/30 shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300">
              {user?.fotoProfil ? (
                <img
                  src={getProfilePhotoUrl(user?.fotoProfil, user?.name)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => handleAvatarError(e, user?.name)}
                />
              ) : (
                <span>
                  {user?.name ? user.name.trim()[0].toUpperCase() : "S"}
                </span>
              )}
            </div>
          </div>

          {/* Profile Dropdown Popover */}
          {showProfile && (
            <div className="absolute top-11 right-0 w-48 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={() => {
                  setShowProfile(false);
                  navigate("/pengaturan");
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition-all text-left cursor-pointer"
              >
                <Settings size={17} className="text-slate-500" />
                Profil & Pengaturan
              </button>
              <button
                onClick={() => {
                  setShowProfile(false);
                  setShowLogoutModal(true);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-rose-600 hover:bg-rose-50 transition-all text-left border-t border-slate-100 mt-1 cursor-pointer"
              >
                <LogOut size={17} className="text-rose-500" />
                Keluar Sistem
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Brosur Panduan Modal */}
      {showBrosur && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-md w-full flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-[16px] font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="text-[#009966]" size={20} />
                Panduan Klasifikasi Sampah Cerdas
              </h3>
              <button
                onClick={() => setShowBrosur(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed max-h-80 overflow-y-auto pr-1">
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <h4 className="font-bold text-[#009966] mb-1">🌱 1. Sampah Organik (Hijau)</h4>
                <p>Sisa makanan, dedaunan, sayuran, buah busuk, dan bahan alami yang mudah terurai.</p>
              </div>

              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                <h4 className="font-bold text-amber-700 mb-1">📦 2. Sampah Anorganik (Kuning)</h4>
                <p>Botol plastik, kemasan makanan bersih, kertas, karton, dan produk berbahan sintetis.</p>
              </div>

              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                <h4 className="font-bold text-rose-700 mb-1">⚠️ 3. Residu / B3 (Merah)</h4>
                <p>Masker bekas, baterai, oli bekas, tisu kotor, pembalut, dan bahan berbahaya lainnya.</p>
              </div>
            </div>

            <button
              onClick={() => setShowBrosur(false)}
              className="w-full py-2.5 bg-[#009966] text-white font-extrabold text-xs rounded-xl shadow-xs hover:bg-[#008855] transition-all cursor-pointer mt-2"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <LogOut size={24} />
            </div>
            <h3 className="text-center font-black text-slate-900 text-lg">Konfirmasi Keluar</h3>
            <p className="text-center text-slate-500 text-xs mt-1 leading-relaxed">
              Apakah Anda yakin ingin keluar dari akun Anda sekarang?
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 bg-rose-500 text-white font-extrabold text-xs rounded-xl hover:bg-rose-600 transition shadow-xs cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
