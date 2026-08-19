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
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { getProfilePhotoUrl, handleAvatarError } from "../../../utils/photoUtils";
import api from "../../../services/api";
import { ThemeToggle } from "../../common/ThemeToggle";

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSec < 60) return "Baru saja";
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin} menit lalu`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours} jam lalu`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

interface HeaderProps {
  onToggleSidebar: () => void;
  isCollapsed?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Dropdown visibility states
  const [showNotifications, setShowNotifications] = useState(false);

  // Refs for closing on outside click
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // EYD & KBBI Indonesian Standard Page Breadcrumb Titles
  const getBreadcrumbItems = (pathname: string, search: string = ""): string[] => {
    if (pathname === "/dashboard-kkn") {
      return ["Dasbor KKN"];
    }

    if (pathname === "/manajemen-ekosistem-kkn") {
      if (search.includes("tab=MAHASISWA")) return ["Dampingan KKN", "Portofolio Mahasiswa"];
      return ["Dampingan KKN", "Kelompok Dampingan"];
    }

    if (pathname.startsWith("/superUser/data-survei-kkn/")) {
      return ["Survei", "Detail Survei"];
    }

    switch (pathname) {
      case "/dasbor":
      case "/dashboard":
      case "/":
        return ["Dasbor"];
      case "/monitoring-wilayah":
      case "/monitoring":
        return ["Peta Wilayah"];
      case "/monitoring-absen":
        return ["Program KKN", "Presensi"];
      case "/ajuan-absensi":
      case "/validasi-absensi":
        return ["Program KKN", "Ajuan Ketidakhadiran"];
      case "/program-kerja-kkn":
      case "/program-kerja":
        return ["Program KKN", "Program Kerja"];
      case "/pemantauan-rekapitulasi":
      case "/monitoring-pemilahan":
      case "/monitoring-aktivitas":
        return ["Tata Kelola Sampah", "Rekapitulasi Setoran"];
      case "/superUser/data-survei-baseline":
      case "/data-survei-baseline":
      case "/superUser/data-survei-kkn":
      case "/data-survei-kkn":
        return ["Program KKN", "Survei Baseline"];
      case "/superUser/data-survei-endline":
      case "/data-survei-endline":
        return ["Program KKN", "Survei Endline"];
      case "/superUser/import-survei-kkn":
      case "/import-survei-kkn":
        return ["Program KKN", "Impor Data Survei"];
      case "/evaluasi-dampak-kkn":
      case "/evaluasi-dampak":
        return ["Program KKN", "Evaluasi Dampak"];
      case "/penilaian-kkn/mahasiswa":
        return ["Penilaian KKN", "Penilaian Individu"];
      case "/penilaian-kkn/program-kerja":
        return ["Penilaian KKN", "Penilaian Program Kerja"];
      case "/penilaian-kkn/laporan-akhir":
        return ["Penilaian KKN", "Penilaian Laporan Akhir"];
      case "/penilaian-kkn/rekap":
        return ["Penilaian KKN", "Rekap & Nilai Akhir"];
      case "/pengangkutan-residu":
      case "/manajemen-pengangkutan":
        return ["Tata Kelola Sampah", "Pengangkutan Residu"];
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
            admin: "Admin",
            superuser: "Admin",
            pimpinan: "Pimpinan",
            pemimpin: "Pimpinan",
            taskforce: "Task Force",
            dpl: "DPL",
            dlh: "DLH",
            camat: "Camat",
            lurah: "Lurah",
            rw: "RW",
            "petugas-residu": "Petugas Residu",
            mahasiswa: "Mahasiswa",
            warga: "Warga",
          };
          const label = roleMap[role.toLowerCase()];
          if (label) return ["Pengguna", label];
        }
        return ["Pengguna"];
      }
      case "/master-data/manajemen-tempat-sampah":
      case "/manajemen-tempat-sampah":
        return ["Tata Kelola Sampah", "Tempat Sampah"];
      case "/master-data/rule-engine":
      case "/master-rule-engine":
      case "/rule-engine":
      case "/pengaturan/rule-engine":
        return ["Pengaturan", "Rule Engine"];
      case "/master-data/provinsi":
      case "/master-provinsi":
        return ["Wilayah", "Provinsi"];
      case "/master-data/kota-kabupaten":
      case "/master-kota-kabupaten":
      case "/master-kabupaten":
        return ["Wilayah", "Kota / Kabupaten"];
      case "/master-data/kecamatan":
      case "/master-data/kecematan":
      case "/master-kecamatan":
        return ["Wilayah", "Kecamatan"];
      case "/master-data/kelurahan":
      case "/master-kelurahan":
        return ["Wilayah", "Kelurahan"];
      case "/master-data/rukun-warga":
      case "/master-rw":
        return ["Wilayah", "RW"];
      case "/manajemen-lokasi":
      case "/peta":
        return ["Manajemen Lokasi"];
      case "/dashboard-dpl":
        return ["Dasbor"];
      case "/role-permissions":
        return ["Hak Akses"];
      case "/manajemen-ekosistem-kkn":
        return ["Program KKN", "Kelompok Dampingan"];
      case "/kkn-portal":
        return ["Dashboard KKN"];
      case "/residu-portal":
        return ["Dashboard Petugas Residu"];
      case "/pengelolaan-sampah":
      case "/pemanfaatan-sampah":
        return ["Tata Kelola Sampah", "Inovasi Pengolahan"];
      case "/hasil-pemanfaatan":
        return ["Tata Kelola Sampah", "Hasil Pemanfaatan"];
      case "/setor-sampah":
      case "/setor":
        return ["Tata Kelola Sampah", "Setor Sampah"];
      case "/jadwal-kegiatan":
        return ["Program KKN", "Timeline"];
      case "/input-manual":
        return ["Input Manual"];
      case "/penyetoran-sampah":
        return ["Tata Kelola Sampah", "Setor Sampah"];
      case "/rekapitulasi-setoran":
      case "/rekap-setoran":
        return ["Tata Kelola Sampah", "Rekapitulasi Setoran"];
      case "/dataset/hasil-klasifikasi":
      case "/master-dataset-klasifikasi":
      case "/dataset-klasifikasi":
        return ["Dataset", "Hasil Klasifikasi"];
      case "/poin-warga":
        return ["Poin Warga"];
      case "/peringkat":
      case "/leaderboard":
        return ["Peringkat Warga"];
      case "/laporan-analitik":
        return ["Laporan & Analitik"];
      case "/notifikasi":
        return ["Notifikasi"];
      case "/pengaturan":
        return ["Pengaturan"];
      case "/pengguna-online":
        return ["Administrasi", "Pengguna Online"];
      case "/log-aktivitas":
      case "/superUser/audit":
        return ["Administrasi", "Log Aktivitas"];
      case "/evaluasi-ai":
      case "/superUser/discrepancies":
        return ["Administrasi", "Diskrepansi AI"];
      case "/superUser/configs":
        return ["Pengaturan", "Konfigurasi Sistem"];
      case "/superUser/master-qr":
      case "/superUser/qr-master":
        return ["Administrasi", "Batch QR Code"];
      case "/rw/approval":
        return ["Verifikasi Tempat Sampah"];
      case "/rw/fasilitas":
        return ["Fasilitas & Ide"];
      case "/ide-daur-ulang":
        return ["Ide Daur Ulang"];
      case "/panduan":
        return ["Buku Panduan"];
      case "/informasi":
      case "/tentang":
        return ["Informasi"];
      default:
        return ["Dasbor"];
    }
  };

  const breadcrumbItems = getBreadcrumbItems(location.pathname, location.search);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState<boolean>(false);

  // Auto Fetch System Notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await api.get("/notifications");
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications in Header:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      const targetNotif = notifications.find((n) => n.id === notifId);
      if (targetNotif && !targetNotif.isRead) {
        await api.put(`/notifications/${notifId}/read`);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  return (
    <header className="bg-white/85 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 transition-all shadow-2xs">
      {/* Left Section: Sidebar Toggle & Dynamic Breadcrumb Pills */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Toggle Sidebar Button (Green Squircle Icon Button) */}
        <button
          onClick={onToggleSidebar}
          title={isCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          className="w-10 h-10 rounded-2xl bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 hover:bg-[#d0f2df] dark:hover:bg-emerald-900/60 active:scale-95 transition-all flex items-center justify-center border border-[#009966]/10 dark:border-emerald-700/20 cursor-pointer shadow-2xs shrink-0"
        >
          <LayoutGrid size={19} />
        </button>

        {breadcrumbItems.map((item, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
            <span
              className={`text-xs px-3.5 py-1.5 rounded-full border transition-all truncate max-w-[140px] sm:max-w-[200px] ${
                idx === breadcrumbItems.length - 1
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200/90 dark:border-slate-700 font-black shadow-2xs"
                  : "bg-slate-50/90 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 font-extrabold"
              }`}
            >
              {item}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Right Section: System Actions & User Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Notifications Popover Trigger & Container */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center relative transition-all border border-slate-200/80 dark:border-slate-700/80 cursor-pointer shadow-2xs active:scale-95"
            title="Notifikasi Sistem"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-black text-[10px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs animate-bounce">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {showNotifications && (
            <div className="absolute top-12 right-0 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Popover Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-850">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/70 text-[#009966] dark:text-emerald-400 flex items-center justify-center">
                    <Bell size={15} />
                  </div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 tracking-tight">Notifikasi Sistem</span>
                </div>
                <span className="text-[11px] bg-[#e5f7ed] dark:bg-emerald-950 text-[#009966] dark:text-emerald-300 px-3 py-1 rounded-full font-black border border-[#009966]/20 dark:border-emerald-700/30 shrink-0">
                  {unreadCount > 0 ? `${unreadCount} Belum Dibaca` : `${notifications.length} Peristiwa`}
                </span>
              </div>

              {/* Popover List Body */}
              <div className="divide-y divide-slate-100/80 dark:divide-slate-800 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {loadingNotifs && notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Memuat notifikasi aktual...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs font-bold text-slate-400 dark:text-slate-500 flex flex-col items-center gap-1.5">
                    <Bell size={24} className="text-slate-300 dark:text-slate-600 mb-1" />
                    <span>Tidak ada notifikasi baru</span>
                    <span className="text-[10.5px] font-normal text-slate-400 dark:text-slate-500">Sistem dalam kondisi normal & optimal.</span>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isCritical = n.title?.toLowerCase().includes("kritis") || n.title?.toLowerCase().includes("penuh") || n.type === "TEMPAT_SAMPAH_PENUH" || n.type === "TONG_PENUH";
                    const isSuccess = n.title?.toLowerCase().includes("sukses") || n.title?.toLowerCase().includes("setuju") || n.type === "POIN_BERTAMBAH";

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleMarkNotificationRead(n.id)}
                        className={`p-4 flex gap-3 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/80 cursor-pointer ${
                          !n.isRead ? "bg-emerald-50/30 dark:bg-emerald-950/20" : ""
                        }`}
                      >
                        {/* Soft Squircle Icon Badge */}
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${
                            isCritical
                              ? "bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-900/60 text-rose-500"
                              : isSuccess
                              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900/60 text-[#009966] dark:text-emerald-400"
                              : "bg-blue-50 dark:bg-sky-950/60 border-blue-100 dark:border-sky-900/60 text-blue-500 dark:text-sky-400"
                          }`}
                        >
                          {isCritical ? (
                            <AlertTriangle size={17} />
                          ) : isSuccess ? (
                            <CheckCircle2 size={17} />
                          ) : (
                            <Info size={17} />
                          )}
                        </div>

                        {/* Text Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                              {n.title}
                            </h4>
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                            {formatTimeAgo(n.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Popover Footer: Go to Full Inbox Page */}
              <button
                onClick={() => {
                  setShowNotifications(false);
                  navigate("/notifikasi");
                }}
                className="w-full py-2.5 bg-slate-50 dark:bg-slate-850 hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#009966] dark:hover:text-emerald-400 text-xs font-black border-t border-slate-100 dark:border-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Lihat Semua Notifikasi</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Vertical Separator */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0" />

        {/* User Profile Pill Card (Direct Navigation to Pengaturan) */}
        <div
          onClick={() => navigate("/pengaturan")}
          title="Pengaturan Profil"
          className="bg-gradient-to-r from-white dark:from-slate-900 via-emerald-50/20 dark:via-emerald-950/20 to-emerald-50/60 dark:to-emerald-950/40 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600 rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all duration-300 group select-none shadow-2xs"
        >
          <div className="flex flex-col items-center justify-center text-center gap-0.5">
            <span className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight block truncate max-w-[120px]">
              {user?.name || "Super User"}
            </span>
            <span className="inline-flex items-center justify-center bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider leading-none">
              {user?.peran ? (
                user.peran === "SUPER_USER" ? "ADMIN" :
                user.peran === "DEVELOPER" ? "DEVELOPER" :
                user.peran === "MAHASISWA_KKN" ? "MAHASISWA" :
                user.peran === "PANITIA_TASKFORCE" ? "TASK FORCE" :
                user.peran.replace("_", " ")
              ) : "ADMIN"}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#009966] text-white font-black text-xs flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm shadow-emerald-600/30 shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300">
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
      </div>
    </header>
  );
};

export default Header;
