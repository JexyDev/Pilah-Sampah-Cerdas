/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React, { useMemo } from "react";
import {
  LayoutDashboard,
  Trash2,
  Users,
  Settings,
  MapPin,
  FileText,
  LogOut,
  Sprout,
  LineChart,
  Trophy,
  Info,
  Bell,
  Sliders,
  QrCode,
  ClipboardCheck,
  Star,
  Lightbulb,
  Calendar,
  Tags,
  Activity,
  Receipt,
  ScanLine,
  Truck,
  Compass,
  GraduationCap,
  Archive,
  Shield,
  ChevronDown,
  Clock,
  BarChart3,
  Recycle
} from "lucide-react";

import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import type { UserRole } from "../../../store/useAuthStore";
import showToast from "../../../utils/showToast";
import type { LucideIcon } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
}

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, badge }) => {
  const location = useLocation();
  const currentPathWithSearch = location.pathname + location.search;

  const isCurrentActive = useMemo(() => {
    if (to.includes("?")) {
      return currentPathWithSearch === to;
    }
    if (location.pathname !== to) return false;
    if (!location.search) return true;
    return currentPathWithSearch === to || location.search === "?tab=OVERVIEW" || location.search === "?tab=KELOMPOK";
  }, [to, location.pathname, location.search, currentPathWithSearch]);

  return (
    <Link
      to={to}
      className={`relative flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 ease-out text-[13px] group overflow-hidden transform-gpu ${
        isCurrentActive
          ? "bg-emerald-50/90 text-[#009966] font-extrabold shadow-[0_2px_10px_rgba(0,153,102,0.12)] border border-[#009966]/15 scale-[1.01]"
          : "text-slate-600 hover:text-[#009966] hover:bg-slate-50 hover:translate-x-1.5 font-semibold active:scale-[0.98]"
      }`}
    >
      {/* Left Curved Green Accent Indicator */}
      {isCurrentActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-1.5 bg-[#009966] rounded-r-full shadow-xs" />
      )}

      <Icon className={`shrink-0 transition-transform duration-200 ease-out ${isCurrentActive ? "text-[#009966] scale-110" : "text-slate-500 group-hover:text-[#009966] group-hover:scale-110 group-hover:-rotate-3"}`} size={19} />
      <span className="flex-1 truncate tracking-tight">{label}</span>
      {badge !== undefined && (
        <span className="bg-[#009966] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs group-hover:scale-105 transition-transform">{badge}</span>
      )}
    </Link>
  );
};

const NavItemCollapsed: React.FC<NavItemProps> = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const currentPathWithSearch = location.pathname + location.search;

  const isCurrentActive = useMemo(() => {
    if (to.includes("?")) return currentPathWithSearch === to;
    if (location.pathname !== to) return false;
    if (!location.search) return true;
    return currentPathWithSearch === to;
  }, [to, location.pathname, location.search, currentPathWithSearch]);

  return (
    <Link
      to={to}
      title={label}
      className={`relative w-10 h-10 rounded-2xl flex items-center justify-center my-0.5 transition-all group cursor-pointer shrink-0 ${
        isCurrentActive
          ? "bg-[#009966] text-white shadow-md shadow-emerald-900/20 scale-105"
          : "text-slate-500 hover:text-[#009966] hover:bg-slate-100"
      }`}
    >
      <Icon size={19} />
      {/* Hover Tooltip appearing on right */}
      <span className="absolute left-16 bg-slate-900 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-[70]">
        {label}
      </span>
    </Link>
  );
};

const NavGroup: React.FC<{
  icon: LucideIcon;
  label: string;
  items: Array<{ to: string; label: string }>;
}> = ({ icon: Icon, label, items }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const location = useLocation();
  const currentPath = location.pathname + location.search;

  const isAnySubActive = items.some(
    (item) => currentPath === item.to || (["/master-pengguna", "/master-data-pengguna", "/manajemen-pengguna"].includes(item.to) && ["/master-pengguna", "/master-data-pengguna", "/manajemen-pengguna"].includes(location.pathname) && !location.search)
  );

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 text-[13px] text-left group relative overflow-hidden ${
          isAnySubActive
            ? "bg-[#e5f7ed] text-[#009966] font-extrabold"
            : "text-slate-600 hover:text-[#009966] hover:bg-slate-50/80 font-semibold"
        }`}
      >
        {isAnySubActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1.5 bg-[#009966] rounded-r-full" />
        )}

        <Icon className={`shrink-0 transition-colors ${isAnySubActive ? "text-[#009966]" : "text-slate-500 group-hover:text-[#009966]"}`} size={19} />
        <span className="flex-1 font-extrabold truncate">{label}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 text-slate-400 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="ml-4 pl-1.5 border-l-2 border-slate-200/80 my-1 space-y-1">
          {items.map((sub) => {
            const isActive = currentPath === sub.to || (["/master-pengguna", "/master-data-pengguna", "/manajemen-pengguna"].includes(sub.to) && ["/master-pengguna", "/master-data-pengguna", "/manajemen-pengguna"].includes(location.pathname) && !location.search);
            return (
              <NavLink
                key={sub.to}
                to={sub.to}
                title={sub.label}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[12px] transition-all group ${
                  isActive
                    ? "bg-[#e5f7ed] text-[#009966] font-extrabold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#009966] hover:translate-x-1 font-semibold active:scale-[0.98]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                    isActive
                      ? "bg-[#009966] scale-125 ring-2 ring-emerald-200"
                      : "bg-slate-300 group-hover:bg-[#009966]"
                  }`}
                />
                <span className="truncate leading-normal">{sub.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-4 pt-4 pb-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
    {label}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed = false }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const userRole = (user?.peran || "WARGA") as UserRole;
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  // Live real-time clock state
  const [timeStr, setTimeStr] = React.useState("");
  const [dateStr, setDateStr] = React.useState("");

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB"
      );
      setDateStr(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    showToast.success("Berhasil keluar sistem");
    navigate("/login");
  };

  const ALL_ROLES: UserRole[] = [
    "DEVELOPER",
    "SUPER_USER",
    "WARGA",
    "PETUGAS_RESIDU",
    "MAHASISWA_KKN",
    "PEMIMPIN",
    "RW",
    "RT",
    "DPL",
    "DOSEN_PEMBIMBING",
    "CAMAT",
    "LURAH",
    "ADMIN_DLH",
    "PANITIA_TASKFORCE",
  ];

  const hasAccess = (allowed: UserRole[]) => userRole === "DEVELOPER" || allowed.includes(userRole);

  const menuSections = [
    {
      header: "NAVIGASI UTAMA",
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dasbor Utama", allowed: ALL_ROLES },
        { to: "/monitoring", icon: MapPin, label: "Pemantauan Wilayah", allowed: ALL_ROLES },
      ],
    },
    {
      header: "OPERASIONAL PERSAMPAHAN",
      items: [
        { to: "/setor-sampah", icon: ScanLine, label: "Penyetoran Sampah", allowed: ALL_ROLES },
        { to: "/manajemen-pengangkutan", icon: Truck, label: "Pengangkutan Residu", allowed: ["SUPER_USER", "PETUGAS_RESIDU", "ADMIN_DLH", "PEMIMPIN"] as UserRole[] },
        { to: "/rekap-setoran", icon: Receipt, label: "Rekapitulasi Setoran", allowed: ["SUPER_USER", "ADMIN_DLH", "RW", "PETUGAS_RESIDU"] as UserRole[] },
      ],
    },
    {
      header: "PENGOLAHAN & KKN",
      items: [
        { to: "/dashboard-kkn", icon: LayoutDashboard, label: "Dashboard KKN", allowed: ["SUPER_USER", "ADMIN_DLH", "MAHASISWA_KKN", "DPL", "PEMIMPIN", "PANITIA_TASKFORCE"] as UserRole[] },
        { to: "/manajemen-ekosistem-kkn", icon: GraduationCap, label: "Ekosistem Program KKN", allowed: ["SUPER_USER", "ADMIN_DLH", "DPL", "KOORDINATOR_KECAMATAN"] as UserRole[] },
        { to: "/superUser/data-survei-kkn", icon: FileText, label: "Data Survei KKN", allowed: ["SUPER_USER", "DPL"] as UserRole[] },
        { to: "/superUser/import-survei-kkn", icon: FileText, label: "Impor Survei KKN", allowed: ["SUPER_USER"] as UserRole[] },
        { to: "/evaluasi-dampak-kkn", icon: BarChart3, label: "Evaluasi Dampak KKN", allowed: ["SUPER_USER", "DPL", "PANITIA_TASKFORCE", "PEMIMPIN"] as UserRole[] },
        { to: "/pemanfaatan-sampah", icon: Sprout, label: "Pengolahan Daur Ulang", allowed: ALL_ROLES },
        { to: "/hasil-pemanfaatan", icon: Archive, label: "Produk & Hasil Olahan", allowed: ALL_ROLES },
        { to: "/monitoring-absen", icon: ClipboardCheck, label: "Presensi & Absensi KKN", allowed: ["SUPER_USER", "ADMIN_DLH", "DPL", "KOORDINATOR_KECAMATAN"] as UserRole[] },
      ],
    },
    {
      header: "MANAJEMEN DATA MASTER",
      items: [
        {
          type: "group",
          label: "Master Pengguna",
          icon: Users,
          allowed: ["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "PEMIMPIN", "RW", "DPL", "KOORDINATOR_KECAMATAN"] as UserRole[],
          children: [
            { to: "/master-pengguna?role=developer", label: "Developer" },
            { to: "/master-pengguna?role=su", label: "Super User" },
            { to: "/master-pengguna?role=pimpinan", label: "Pimpinan" },
            { to: "/master-pengguna?role=taskforce", label: "Task Force" },
            { to: "/master-pengguna?role=dpl", label: "Dosen Pembimbing Lapangan" },
            { to: "/master-pengguna?role=dlh", label: "Dinas Lingkungan Hidup" },
            { to: "/master-pengguna?role=camat", label: "Camat" },
            { to: "/master-pengguna?role=lurah", label: "Lurah" },
            { to: "/master-pengguna?role=rw", label: "Rukun Warga" },
            { to: "/master-pengguna?role=petugas-residu", label: "Petugas Residu" },
            { to: "/master-pengguna?role=mahasiswa", label: "Mahasiswa" },
            { to: "/master-pengguna?role=warga", label: "Warga" },
          ],
        },
        {
          type: "group",
          label: "Master Data",
          icon: Trash2,
          allowed: ["SUPER_USER", "DEVELOPER", "ADMIN_DLH", "PEMIMPIN", "RW", "PETUGAS_RESIDU"] as UserRole[],
          children: [
            { to: "/master-provinsi", label: "Provinsi" },
            { to: "/master-kabupaten", label: "Kota, Kabupaten" },
            { to: "/master-kecamatan", label: "Kecamatan" },
            { to: "/master-kelurahan", label: "Kelurahan" },
            { to: "/master-rw", label: "Rukun Warga" },
            { to: "/manajemen-tempat-sampah", label: "Manajemen Tempat Sampah" },
          ],
        },
        { to: "/manajemen-lokasi", icon: Compass, label: "Wilayah & Titik TPS", allowed: ["SUPER_USER", "ADMIN_DLH", "PEMIMPIN"] as UserRole[] },
      ],
    },
    {
      header: "ANALITIK & GAMIFIKASI",
      items: [
        { to: "/laporan-analitik", icon: LineChart, label: "Laporan & Analitik Eksekutif", allowed: ["SUPER_USER", "ADMIN_DLH", "PEMIMPIN"] as UserRole[] },
        { to: "/leaderboard", icon: Trophy, label: "Peringkat & Poin Warga", allowed: ALL_ROLES },
        { to: "/poin-warga", icon: Star, label: "Tabungan Poin Warga", allowed: ALL_ROLES },
        { to: "/ide-daur-ulang", icon: Lightbulb, label: "Katalis Ide Daur Ulang", allowed: ALL_ROLES },
        { to: "/jadwal-kegiatan", icon: Calendar, label: "Agenda & Jadwal Kegiatan", allowed: ALL_ROLES },
      ],
    },
    {
      header: "ADMINISTRASI SISTEM",
      items: [
        { to: "/superUser/configs", icon: Sliders, label: "Aturan Sistem & Bobot Poin", allowed: ["SUPER_USER"] as UserRole[] },
        { to: "/superUser/qr-master", icon: QrCode, label: "Master Kode QR & Inaktif", allowed: ["SUPER_USER"] as UserRole[] },
        { to: "/role-permissions", icon: Shield, label: "Hak Akses & Peran (RBAC)", allowed: ["SUPER_USER"] as UserRole[] },
        { to: "/superUser/audit", icon: FileText, label: "Log Audit Sistem", allowed: ["SUPER_USER"] as UserRole[] },
        { to: "/monitoring-aktivitas", icon: Activity, label: "Monitoring Aktivitas", allowed: ["SUPER_USER", "ADMIN_DLH", "PEMIMPIN"] as UserRole[] },
      ],
    },
    {
      header: "BANTUAN & PENGATURAN",
      items: [
        { to: "/notifikasi", icon: Bell, label: "Notifikasi Pemberitahuan", allowed: ALL_ROLES },
        { to: "/panduan", icon: FileText, label: "Panduan Penggunaan", allowed: ALL_ROLES },
        { to: "/pengaturan", icon: Settings, label: "Pengaturan Profil", allowed: ALL_ROLES },
        { to: "/tentang", icon: Info, label: "Informasi Aplikasi", allowed: ALL_ROLES },
      ],
    },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`${
          isCollapsed ? "w-[84px]" : "w-[280px]"
        } h-screen fixed left-0 top-0 bg-white border-r border-slate-200/80 flex flex-col z-50 transition-all duration-300 ease-in-out transform lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Render Collapsed Mini Sidebar */}
        {isCollapsed ? (
          <div className="flex flex-col h-full items-center justify-between py-3">
            {/* Top Brand Original Full-Color Logo (Preserving Original Image) */}
            <div className="flex flex-col items-center w-full border-b border-slate-100 pb-3 mb-2">
              <div
                title="TrashCare"
                className="w-12 h-12 rounded-2xl bg-[#e5f7ed] border border-[#009966]/20 flex items-center justify-center p-1.5 shadow-sm hover:scale-105 transition-all cursor-pointer"
              >
                <img
                  src="/image/trashcare-icon.png"
                  alt="TrashCare Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Centered Icons Navigation List with Section Dividers & Smooth Scroll */}
            <nav className="flex-1 overflow-y-auto w-full px-2 py-2 space-y-1 flex flex-col items-center max-h-[calc(100vh-170px)] scrollbar-thin scrollbar-thumb-slate-200">
              {menuSections.map((sec, idx) => {
                const visibleItems = sec.items.filter((item) => hasAccess(item.allowed));
                if (visibleItems.length === 0) return null;
                return (
                  <React.Fragment key={sec.header}>
                    {idx > 0 && <div className="w-6 h-px bg-slate-200/80 my-1.5 mx-auto shrink-0" />}
                    {visibleItems.map((item: any) =>
                      item.type === "group" ? (
                        <NavItemCollapsed
                          key={item.label}
                          to={item.children[0]?.to || "/manajemen-pengguna"}
                          icon={item.icon}
                          label={item.label}
                        />
                      ) : (
                        <NavItemCollapsed
                          key={item.to}
                          to={item.to}
                          icon={item.icon}
                          label={item.label}
                        />
                      )
                    )}
                  </React.Fragment>
                );
              })}
            </nav>

            {/* Bottom Actions for Collapsed Mode */}
            <div className="flex flex-col items-center gap-2 pt-3 border-t border-slate-100 w-full px-2 shrink-0">
              {/* System Clock Pill Icon */}
              <div
                title={timeStr ? `${dateStr} - ${timeStr}` : "Jam Sistem"}
                className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-600 flex items-center justify-center relative group cursor-pointer hover:bg-slate-100 transition-all"
              >
                <Clock size={19} />
                <span className="absolute left-16 bg-slate-900 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-[60]">
                  {timeStr || "Jam Sistem"}
                </span>
              </div>

              {/* Logout Button Icon */}
              <button
                onClick={handleLogout}
                title="Keluar Sistem"
                className="w-11 h-11 rounded-2xl text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all relative group cursor-pointer"
              >
                <LogOut size={19} />
                <span className="absolute left-16 bg-slate-900 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-[60]">
                  Keluar Sistem
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Render Full-Width Sidebar Mode */
          <>
            {/* Brand Header */}
            <div className="p-5 border-b border-slate-100 flex flex-col items-center text-center bg-white shrink-0 relative overflow-hidden group">
              <div className="absolute top-2 w-28 h-28 bg-gradient-to-tr from-emerald-200/50 via-teal-100/40 to-sky-200/40 rounded-full blur-2xl pointer-events-none animate-pulse" />
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-100/40 rounded-full blur-xl pointer-events-none animate-pulse" style={{ animationDelay: "1s" }} />

              <div className="absolute top-3 left-4 opacity-35 text-emerald-600 animate-bounce pointer-events-none" style={{ animationDuration: "3.5s" }}>
                <Sprout size={16} />
              </div>
              <div className="absolute bottom-3 right-5 opacity-35 text-sky-600 animate-bounce pointer-events-none" style={{ animationDuration: "4.5s", animationDelay: "1.2s" }}>
                <Trash2 size={15} />
              </div>
              <div className="absolute top-4 right-4 opacity-30 text-teal-600 animate-pulse pointer-events-none" style={{ animationDuration: "2.8s" }}>
                <Tags size={14} />
              </div>
              <div className="absolute bottom-3 left-4 opacity-35 text-emerald-600 animate-pulse pointer-events-none" style={{ animationDuration: "3.8s", animationDelay: "0.6s" }}>
                <Recycle size={15} />
              </div>

              <div className="relative z-10 w-14 h-14 mb-1 flex items-center justify-center transition-all duration-300 transform-gpu group-hover:scale-108 group-hover:-rotate-2">
                <img
                  src="/image/trashcare-icon.png"
                  alt="TrashCare Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,153,102,0.2)]"
                />
              </div>

              <h1 className="relative z-10 text-2xl font-black tracking-tight leading-tight">
                <span className="text-[#0284c7]">Trash</span>
                <span className="text-[#009966]">Care</span>
              </h1>
            </div>

            {/* Navigation Menu */}
            <nav
              className="flex-1 overflow-y-auto px-2 space-y-0.5 py-3"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) onClose();
              }}
            >
              {menuSections.map((sec) => {
                const visibleItems = sec.items.filter((item) => hasAccess(item.allowed));
                if (visibleItems.length === 0) return null;
                return (
                  <React.Fragment key={sec.header}>
                    <SectionHeader label={sec.header} />
                    {visibleItems.map((item: any) =>
                      item.type === "group" ? (
                        <NavGroup
                          key={item.label}
                          icon={item.icon}
                          label={item.label}
                          items={item.children}
                        />
                      ) : (
                        <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
                      )
                    )}
                  </React.Fragment>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-3 text-center shadow-2xs mb-2.5">
                <p className="text-[11px] font-bold text-slate-500 leading-tight">{dateStr || "Selasa, 11 Agustus 2026"}</p>
                <p className="text-lg font-black text-slate-800 tracking-tight font-mono leading-snug mt-0.5">{timeStr || "00:00:00"}</p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[#e11d48] hover:bg-rose-50 font-extrabold text-[13px] transition-all cursor-pointer group"
              >
                <LogOut size={19} className="text-[#e11d48] group-hover:-translate-x-0.5 transition-transform" />
                <span>Keluar Sistem</span>
              </button>
            </div>
          </>
        )}
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
              <LogOut size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">Konfirmasi Keluar</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Apakah Anda yakin ingin keluar dari aplikasi TrashCare?</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 bg-rose-500 text-white font-extrabold text-xs rounded-xl hover:bg-rose-600 transition shadow-xs cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
