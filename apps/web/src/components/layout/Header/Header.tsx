import { Bell, LayoutGrid, BookOpen, Settings, LogOut, Leaf, GlassWater, Menu } from "lucide-react";
/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../store/useAuthStore";
import { getProfilePhotoUrl, handleAvatarError } from "../../../utils/photoUtils";

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  // Dropdown visibility states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showApps, setShowApps] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Integrated Modal states
  const [showBrosur, setShowBrosur] = useState(false);

  // Refs for closing on outside click
  const notifRef = useRef<HTMLDivElement>(null);
  const appsRef = useRef<HTMLDivElement>(null);
  const profRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifications(false);
      if (appsRef.current && !appsRef.current.contains(e.target as Node)) setShowApps(false);
      if (profRef.current && !profRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const getHeaderInfo = (pathname: string, search: string = "") => {
    const fullPath = pathname + search;

    if (fullPath.includes("/dashboard-kkn")) {
      if (search.includes("tab=MAHASISWA")) {
        return {
          title: "Portofolio Mahasiswa KKN",
          subtitle: "Pantau data aktivitas, logbook, dan rekapan presensi mahasiswa KKN.",
        };
      }
      if (search.includes("tab=APPROVAL")) {
        return {
          title: "Persetujuan Sakit & Izin KKN",
          subtitle: "Validasi dan evaluasi permohonan izin/sakit mahasiswa KKN.",
        };
      }
      return {
        title: "Kelompok KKN",
        subtitle: "Ringkasan data kelompok bimbingan KKN, wilayah, dan statistik presensi.",
      };
    }

    switch (pathname) {
      case "/dashboard":
      case "/":
        return {
          title: `Selamat datang kembali, ${user?.name || "Pengguna"} 👋`,
          subtitle:
            user?.peran === "WARGA"
              ? "Pantau poin Anda, temukan tempat sampah terdekat, dan mulai memilah sampah secara pintar."
              : "Kelola data, pantau aktivitas, dan wujudkan lingkungan yang lebih bersih.",
        };
      case "/monitoring":
        return {
          title: "Monitoring Wilayah",
          subtitle: "Pantau peta GIS, distribusi tempat sampah, dan statistik timbulan residu wilayah.",
        };
      case "/monitoring-absen":
        return {
          title: "Monitoring Absen KKN",
          subtitle: "Pemantauan kehadiran dan presensi lokasi mahasiswa KKN secara real-time.",
        };
      case "/monitoring-aktivitas":
        return {
          title: "Monitoring Aktivitas",
          subtitle: "Pantau log aktivitas sistem dan tindakan operasional petugas.",
        };
      case "/manajemen-pengangkutan":
        return {
          title: "Pengangkutan Sampah",
          subtitle: "Kelola penugasan dispatch dan armada penjemputan residu.",
        };
      case "/manajemen-pengguna":
        return {
          title: "Manajemen Pengguna",
          subtitle: "Kelola daftar akun, hak akses, dan data warga Kecamatan Coblong.",
        };
      case "/manajemen-tempat-sampah":
        return {
          title: "Manajemen Tempat Sampah",
          subtitle: "Pantau status kapasitas dan lokasi titik kumpul tempat sampah.",
        };
      case "/manajemen-lokasi":
      case "/peta":
        return {
          title: "Manajemen Lokasi",
          subtitle: "Daftar wilayah dan RT/RW yang dilayani oleh sistem.",
        };
      case "/dashboard-dpl":
        return {
          title: "Dashboard DPL",
          subtitle: "Ringkasan pengawasan kelompok KKN dan evaluasi lapangan.",
        };
      case "/role-permissions":
        return {
          title: "Hak Akses & Role (RBAC)",
          subtitle: "Pengaturan izin dan kewenangan peran pengguna sistem.",
        };
      case "/manajemen-ekosistem-kkn":
        return {
          title: "Manajemen Ekosistem KKN",
          subtitle: "Kelola data kelompok KKN, wilayah dampingan, dan DPL.",
        };
      case "/pemanfaatan-sampah":
        return {
          title: "Pemanfaatan Sampah",
          subtitle: "Pencatatan pengolahan kompos, loseda, bata terawang, dan maggot.",
        };
      case "/hasil-pemanfaatan":
        return {
          title: "Hasil Pemanfaatan",
          subtitle: "Catatan produksi pupuk, panen maggot, dan hasil pengolahan.",
        };
      case "/setor-sampah":
      case "/setor":
        return {
          title: "Monitoring Pemilahan Warga",
          subtitle: "Pantau setoran sampah warga dan hasil pemilahan AI.",
        };
      case "/jadwal-kegiatan":
        return {
          title: "Jadwal Kegiatan",
          subtitle: "Agenda sosialisasi, pelatihan, dan pengangkutan sampah.",
        };
      case "/input-manual":
        return {
          title: "Input Setoran Manual",
          subtitle: "Input manual timbulan residu industri dan fisik oleh petugas residu.",
        };
      case "/kategori-sampah":
        return {
          title: "Kategori Sampah",
          subtitle: "Pengaturan jenis dan nilai tukar sampah (poin/rupiah).",
        };
      case "/rekap-setoran":
        return {
          title: "Rekap Setoran",
          subtitle: "Laporan transaksi harian, bulanan, dan total penimbangan.",
        };
      case "/poin-warga":
        return {
          title: "Poin Warga",
          subtitle: "Kelola perolehan poin gamifikasi dan leaderboard warga.",
        };
      case "/leaderboard":
        return {
          title: "Leaderboard Warga",
          subtitle: "Peringkat warga terbaik dalam pemilahan sampah.",
        };
      case "/laporan-analitik":
        return {
          title: "Laporan & Analitik",
          subtitle: "Visualisasi dan statistik progres pemilahan sampah.",
        };
      case "/notifikasi":
        return {
          title: "Notifikasi",
          subtitle: "Pusat pemberitahuan sistem dan pembaruan aplikasi.",
        };
      case "/pengaturan":
        return {
          title: "Pengaturan",
          subtitle: "Konfigurasi akun dan preferensi aplikasi.",
        };
      case "/evaluasi-ai":
      case "/superUser/discrepancies":
        return {
          title: "Review Diskrepansi AI",
          subtitle: "Evaluasi dan persetujuan selisih klasifikasi AI vs manual.",
        };
      case "/superUser/configs":
        return {
          title: "Rule Engine & Konfigurasi",
          subtitle: "Pengaturan parameter sistem dan tarif poin.",
        };
      case "/superUser/audit":
        return {
          title: "Audit Trail",
          subtitle: "Catatan riwayat perubahan data dan keamanan sistem.",
        };
      case "/superUser/qr-master":
        return {
          title: "Master QR Code",
          subtitle: "Kelola batch QR code dan aktivasi tempat sampah.",
        };
      case "/rw/approval":
        return {
          title: "Persetujuan Aktivasi Tempat Sampah",
          subtitle: "Persetujuan registrasi tempat sampah dan akun petugas dari warga.",
        };
      case "/rw/fasilitas":
        return {
          title: "Input Fasilitas & Ide",
          subtitle: "Pendaftaran fasilitas pengolahan sampah dan ide daur ulang.",
        };
      case "/ide-daur-ulang":
        return {
          title: "Ide Daur Ulang",
          subtitle: "Kumpulan karya dan inspirasi daur ulang sampah warga.",
        };
      case "/panduan":
        return {
          title: "Menu Panduan",
          subtitle: "Panduan penggunaan aplikasi dan tata cara pemilahan sampah.",
        };
      case "/tentang":
        return {
          title: "Tentang Aplikasi",
          subtitle: "Informasi versi aplikasi TrashCare Kecamatan Coblong.",
        };
      default:
        return {
          title: "Dashboard Utama",
          subtitle: "Sistem pemilahan sampah cerdas terintegrasi Kecamatan Coblong.",
        };
    }
  };

  const headerInfo = getHeaderInfo(location.pathname, location.search);

  const handleLogout = () => {
    logout();
    toast.success("Berhasil keluar sistem");
    navigate("/login");
  };


  const notifications = [
    {
      id: 1,
      title: "Kapasitas Tempat Sampah Kritis",
      desc: "Tempat Sampah Anorganik #2 - RT 02 terisi 88%. Harap setor ke titik lain.",
      time: "5 menit yang lalu",
      unread: true,
    },
    {
      id: 2,
      title: "Sukses Penimbangan",
      desc: "Setoran Organik 1.5kg berhasil terdata. +15 Poin ditambahkan.",
      time: "2 jam yang lalu",
      unread: false,
    },
    {
      id: 3,
      title: "Agenda Esok Hari",
      desc: "Sosialisasi pemilahan sampah mandiri Dago pukul 09.00 WIB.",
      time: "1 hari yang lalu",
      unread: false,
    },
  ];


  return (
    <header className="sticky top-0 h-[72px] bg-white border-b border-outline-variant px-container-margin flex items-center justify-between z-40">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-on-surface-variant hover:bg-surface-container rounded-lg lg:hidden cursor-pointer"
        >
          <Menu size={24} />
        </button>
        <div className="min-w-0">
          <h2 className="font-headline-lg text-[18px] sm:text-[20px] font-bold text-on-surface truncate">
            {headerInfo.title}
          </h2>
          <p className="text-body-md text-[11px] sm:text-[14px] text-on-surface-variant truncate">{headerInfo.subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-gutter flex-shrink-0">
        {/* Icons */}
        <div className="flex items-center gap-3">
          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-all border border-outline-variant/30 cursor-pointer"
            >
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-4 h-4 bg-error text-white text-[9px] flex items-center justify-center rounded-full border border-white font-bold">
                3
              </span>
            </button>

            {showNotifications && (
              <div className="absolute top-11 right-0 w-80 bg-white rounded-xl shadow-xl border border-outline-variant/50 flex flex-col z-50 overflow-hidden">
                <div className="p-3 bg-surface-container-low border-b border-outline-variant/30 flex justify-between items-center">
                  <span className="text-xs font-bold text-on-surface">Pemberitahuan Baru</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                    3 Belum Dibaca
                  </span>
                </div>
                <div className="divide-y divide-outline-variant/20 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 flex gap-2.5 transition-all hover:bg-surface-container-lowest ${n.unread ? "bg-primary/5" : ""}`}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] ${n.title.includes("Kritis") ? "text-error" : "text-primary"} mt-0.5`}
                      >
                        {n.title.includes("Kritis") ? "warning" : "info"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{n.title}</p>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                          {n.desc}
                        </p>
                        <p className="text-[9px] text-on-surface-variant mt-1 font-semibold">
                          {n.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate("/notifikasi");
                  }}
                  className="w-full text-center py-2.5 bg-slate-50 border-t border-outline-variant/30 text-xs font-bold text-primary hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Lihat Semua Notifikasi
                </button>
              </div>
            )}
          </div>

          {/* Apps 9-Dot Popover */}
          <div className="relative" ref={appsRef}>
            <button
              onClick={() => setShowApps(!showApps)}
              className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-all border border-outline-variant/30 cursor-pointer"
            >
              <LayoutGrid size={22} />
            </button>

            {showApps && (
              <div className="absolute top-11 right-0 w-72 bg-white rounded-xl shadow-xl border border-outline-variant/50 p-4 flex flex-col gap-3 z-50">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20 pb-2">
                  Layanan Terintegrasi Warga
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => {
                      setShowBrosur(true);
                      setShowApps(false);
                    }}
                    className="flex flex-col items-center p-3 rounded-lg border border-outline-variant/40 hover:bg-blue-50 hover:border-blue-600 transition-all text-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="text-blue-600" size={24} />
                    <span className="text-[11px] font-bold text-on-surface">
                      Panduan Pemilahan Sampah
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Avatar Clickable Dropdown */}
        <div className="relative" ref={profRef}>
          <div
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 ml-2 border-l border-outline-variant pl-4 cursor-pointer hover:opacity-90 select-none"
          >
            <div className="text-right hidden sm:block">
              <p className="text-label-md font-bold text-on-surface leading-tight">
                {user?.name || "Pengguna"}
              </p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                {user?.peran?.replace("_", " ") || "WARGA"}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border border-outline-variant/20 flex-shrink-0 overflow-hidden bg-slate-100"
            >
              <img
                src={getProfilePhotoUrl(user?.fotoProfil, user?.name)}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => handleAvatarError(e, user?.name)}
              />
            </div>
          </div>

          {showProfile && (
            <div className="absolute top-12 right-0 w-48 bg-white rounded-xl shadow-xl border border-outline-variant/50 p-2 flex flex-col gap-1 z-50">
              <button
                onClick={() => {
                  setShowProfile(false);
                  navigate("/pengaturan");
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container transition-all text-left cursor-pointer"
              >
                <Settings size={18} />
                Profil & Pengaturan
              </button>
              <button
                onClick={() => {
                  setShowProfile(false);
                  setShowLogoutModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-error hover:bg-red-50 transition-all text-left border-t border-outline-variant/20 mt-1 cursor-pointer"
              >
                <LogOut size={18} />
                Keluar Sistem
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Brosur Panduan Modal */}
      {showBrosur && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-outline-variant shadow-2xl p-6 max-w-md w-full flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <h3 className="text-[16px] font-bold text-on-surface flex items-center gap-1.5">
                <BookOpen className="text-primary" size={20} />
                Panduan Klasifikasi Sampah Cerdas
              </h3>
              <button
                onClick={() => setShowBrosur(false)}
                className="material-symbols-outlined text-[20px] text-on-surface-variant hover:text-primary cursor-pointer"
              >
                close
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
              {/* Organik */}
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <p className="text-xs font-bold text-green-800 uppercase tracking-wider flex items-center gap-1">
                  <Leaf size={16} />
                  Sampah Organik (Hijau)
                </p>
                <p className="text-[11px] text-green-700 leading-relaxed mt-1">
                  Sampah alami yang mudah membusuk dan dapat diolah menjadi kompos pupuk organik.
                </p>
                <ul className="text-[10px] text-green-800 list-disc list-inside mt-2 space-y-0.5 font-semibold">
                  <li>Sisa makanan & sayur dapur</li>
                  <li>Dedaunan kering & ranting</li>
                  <li>Kulit buah-buahan</li>
                  <li>Sisa tulang daging / ikan</li>
                </ul>
              </div>

              {/* Anorganik */}
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                  <GlassWater size={16} />
                  Sampah Anorganik (Biru)
                </p>
                <p className="text-[11px] text-blue-700 leading-relaxed mt-1">
                  Sampah buatan manusia yang sulit membusuk dan bernilai tinggi untuk proses daur
                  ulang industri.
                </p>
                <ul className="text-[10px] text-blue-800 list-disc list-inside mt-2 space-y-0.5 font-semibold">
                  <li>Botol plastik PET & gelas air mineral</li>
                  <li>Kardus box & kertas koran bekas</li>
                  <li>Kaleng aluminium makanan / minuman</li>
                  <li>Plastik kantong bening bersih</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowBrosur(false)}
              className="w-full h-10 bg-primary text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Saya Paham
            </button>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-100 text-center space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto font-bold text-lg">
              !
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900">Konfirmasi Keluar</h3>
              <p className="text-xs text-gray-500 mt-1">Apakah Anda yakin ingin keluar dari aplikasi TrashCare?</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  handleLogout();
                }}
                className="flex-1 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition shadow-sm cursor-pointer"
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
