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
  ShieldCheck, 
  FilePlus, 
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
  Shield
} from "lucide-react";

import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../store/useAuthStore";
import type { UserRole } from "../../../store/useAuthStore";

import type { LucideIcon } from "lucide-react";

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
    return location.pathname === to;
  }, [to, location.pathname, currentPathWithSearch]);

  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-3 rounded-r-xl transition-all text-[13px] ${
        isCurrentActive
          ? "bg-secondary-fixed text-on-secondary-fixed-variant border-l-4 border-secondary font-bold"
          : "text-on-surface-variant hover:bg-surface-container-high"
      }`}
    >
      <Icon className="mr-3 text-[20px]" size={20} />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">{badge}</span>
      )}
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
    (sub) => location.pathname === sub.to || currentPath === sub.to
  );

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center px-4 py-2.5 rounded-r-xl transition-all text-[13px] w-full text-left cursor-pointer ${
          isAnySubActive
            ? "bg-slate-100/80 text-slate-900 font-bold border-l-3 border-emerald-600"
            : "text-slate-600 hover:bg-slate-100/60"
        }`}
      >
        <Icon className="mr-3 text-[20px]" size={20} />
        <span className="flex-1 font-bold">{label}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="ml-6 pl-2 border-l border-slate-200 my-1 space-y-1">
          {items.map((sub) => {
            const isActive = currentPath === sub.to || (sub.to === "/manajemen-pengguna" && location.pathname === "/manajemen-pengguna" && !location.search);
            return (
              <NavLink
                key={sub.to}
                to={sub.to}
                className={`block px-3 py-1.5 rounded-md text-[12px] transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-600 pl-2.5"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                }`}
              >
                {sub.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-4 py-2 text-[10px] uppercase font-bold text-primary tracking-wider mt-4 mb-1 border-t border-outline-variant/20 pt-3 first:border-t-0 first:pt-0 first:mt-2">
    {label}
  </div>
);

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = React.useState<boolean>(false);

  const getProfilePhotoUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
    const host = baseUrl.replace("/api/v1", "");
    return `${host}${path}`;
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    toast.success("Berhasil keluar sistem");
    navigate("/login");
  };

  const currentRole = user?.peran || "WARGA";
  const hasAccess = (allowed: UserRole[]) => allowed.includes(currentRole as UserRole);

  const ALL_ROLES: UserRole[] = [
    "SUPER_ADMIN",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "RT",
    "PETUGAS_RESIDU",
    "MAHASISWA_KKN",
    "WARGA",
  ];

  const menuSections = [
    {
      header: "Layanan Utama",
      items: [
        { to: "/", icon: LayoutDashboard, label: "Dashboard", allowed: ALL_ROLES },
        { to: "/monitoring", icon: Activity, label: "Monitoring Wilayah", allowed: ["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT"] as UserRole[] },
        { to: "/dashboard-dpl", icon: GraduationCap, label: "Dashboard DPL", allowed: ["DPL", "DOSEN_PEMBIMBING", "SUPER_ADMIN", "ADMIN_DLH"] as UserRole[] },
        { to: "/kkn-portal", icon: Compass, label: "Portal Pendampingan", allowed: ["MAHASISWA_KKN"] as UserRole[] },
        { to: "/residu-portal", icon: Shield, label: "Portal Pengawasan", allowed: ["PETUGAS_RESIDU"] as UserRole[] },
        { to: "/rw/approval", icon: ShieldCheck, label: "Approval Bin & Petugas", allowed: ["RW", "RT"] as UserRole[] },
        { to: "/input-manual", icon: FilePlus, label: "Input Setoran Residu Hilir", allowed: ["PETUGAS_RESIDU"] as UserRole[] },
      ],
    },
    {
      header: "Panel Dosen Pembimbing (DPL)",
      items: [
        { to: "/dashboard-dpl?tab=OVERVIEW", icon: LayoutDashboard, label: "Ringkasan Bimbingan", allowed: ["DPL", "DOSEN_PEMBIMBING", "SUPER_ADMIN", "ADMIN_DLH"] as UserRole[] },
        { to: "/dashboard-dpl?tab=KELOMPOK", icon: Users, label: "Kelompok Bimbingan", allowed: ["DPL", "DOSEN_PEMBIMBING", "SUPER_ADMIN", "ADMIN_DLH"] as UserRole[] },
        { to: "/dashboard-dpl?tab=MAHASISWA", icon: GraduationCap, label: "Mahasiswa & Dampak Warga", allowed: ["DPL", "DOSEN_PEMBIMBING", "SUPER_ADMIN", "ADMIN_DLH"] as UserRole[] },
        { to: "/dashboard-dpl?tab=APPROVAL", icon: ClipboardCheck, label: "Persetujuan Sakit / Izin", allowed: ["DPL", "DOSEN_PEMBIMBING", "SUPER_ADMIN", "ADMIN_DLH"] as UserRole[] },
        { to: "/dashboard-dpl?tab=MAP", icon: MapPin, label: "Peta Sebaran RW", allowed: ["DPL", "DOSEN_PEMBIMBING", "SUPER_ADMIN", "ADMIN_DLH"] as UserRole[] },
      ],
    },
    {
      header: "Aktivitas Tata Kelola Sampah",
      items: [
        { to: "/setor-sampah", icon: ScanLine, label: "Monitoring Pemilahan Warga", allowed: ALL_ROLES },
        { to: "/manajemen-pengangkutan", icon: Truck, label: "Pengangkutan Sampah", allowed: ["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "PETUGAS_RESIDU"] as UserRole[] },
        { to: "/pemanfaatan-sampah", icon: Sprout, label: "Pemanfaatan Sampah", allowed: ["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT"] as UserRole[] },
        { to: "/hasil-pemanfaatan", icon: Archive, label: "Hasil Pemanfaatan", allowed: ["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT"] as UserRole[] },
      ],
    },
    {
      header: "Manajemen Data",
      items: [
        {
          type: "group",
          icon: Users,
          label: "Master Pengguna",
          allowed: ["SUPER_ADMIN", "ADMIN_DLH"] as UserRole[],
          children: [
            { to: "/manajemen-pengguna", label: "Semua Pengguna" },
            { to: "/manajemen-pengguna?role=ADMIN_DLH", label: "Admin & Eksekutif" },
            { to: "/manajemen-pengguna?role=RW", label: "Pengurus RW / RT" },
            { to: "/manajemen-pengguna?role=PETUGAS_RESIDU", label: "Petugas Residu Hilir" },
            { to: "/manajemen-pengguna?role=MAHASISWA_KKN", label: "Mahasiswa KKN" },
            { to: "/manajemen-pengguna?role=WARGA", label: "Warga" },
          ],
        },
        { to: "/manajemen-mahasiswa", icon: GraduationCap, label: "Manajemen Mahasiswa", allowed: ["SUPER_ADMIN"] as UserRole[] },
        { to: "/manajemen-tempat-sampah", icon: Trash2, label: "Manajemen Tempat Sampah", allowed: ["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT", "PETUGAS_RESIDU", "MAHASISWA_KKN"] as UserRole[] },
        { to: "/manajemen-lokasi", icon: MapPin, label: "Manajemen Lokasi", allowed: ["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT"] as UserRole[] },
        { to: "/rw/fasilitas", icon: Sprout, label: "Fasilitas & Ide", allowed: ["RW", "RT"] as UserRole[] },
      ],
    },
    {
      header: "Laporan & Validasi",
      items: [
        { to: "/superadmin/discrepancies", icon: ClipboardCheck, label: "Review Diskrepansi AI", allowed: ["SUPER_ADMIN", "ADMIN_DLH"] as UserRole[] },
        { to: "/monitoring-absen", icon: Compass, label: "Monitoring Absen KKN", allowed: ["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT"] as UserRole[] },
        { to: "/rekap-setoran", icon: Receipt, label: "Rekap Setoran", allowed: ["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT", "PETUGAS_RESIDU", "MAHASISWA_KKN"] as UserRole[] },
        { to: "/laporan-analitik", icon: LineChart, label: "Laporan & Analitik", allowed: ["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT"] as UserRole[] },
      ],
    },
    {
      header: "Edukasi & Gamifikasi",
      items: [
        { to: "/leaderboard", icon: Trophy, label: "Leaderboard", allowed: ALL_ROLES },
        { to: "/poin-warga", icon: Star, label: "Poin Warga", allowed: ALL_ROLES },
        { to: "/ide-daur-ulang", icon: Lightbulb, label: "Ide Daur Ulang", allowed: ALL_ROLES },
        { to: "/jadwal-kegiatan", icon: Calendar, label: "Jadwal Kegiatan", allowed: ALL_ROLES },
        { to: "/kategori-sampah", icon: Tags, label: "Kategori Sampah", allowed: ["SUPER_ADMIN", "ADMIN_DLH"] as UserRole[] },
      ],
    },
    {
      header: "Sistem",
      items: [
        { to: "/notifikasi", icon: Bell, label: "Notifikasi", allowed: ALL_ROLES },
        { to: "/pengaturan", icon: Settings, label: "Pengaturan", allowed: ALL_ROLES },
        { to: "/tentang", icon: Info, label: "Tentang Aplikasi", allowed: ALL_ROLES },
      ],
    },
    {
      header: "Super Admin Panel",
      items: [
        { to: "/superadmin/configs", icon: Sliders, label: "Rule Engine", allowed: ["SUPER_ADMIN"] as UserRole[] },
        { to: "/superadmin/qr-master", icon: QrCode, label: "Master QR & Inaktif", allowed: ["SUPER_ADMIN"] as UserRole[] },
        { to: "/superadmin/audit", icon: FileText, label: "Audit Trail", allowed: ["SUPER_ADMIN"] as UserRole[] },
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
      <aside className={`w-[260px] h-screen fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant flex flex-col z-50 transition-transform duration-300 ease-in-out transform lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Brand Header */}
        <div className="px-6 py-5 flex items-center justify-center border-b border-outline-variant/35 bg-white">
          <img
            src="/logo.png"
            alt="TrashCare - Sampah Terdata, Lingkungan Tertata"
            className="h-20 w-auto object-contain mix-blend-multiply"
          />
        </div>

        {/* Navigation Menu */}
        <nav
          className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#bccabc transparent" }}
          onClick={() => {
            if (window.innerWidth < 1024) onClose();
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
      <div className="p-4 border-t border-outline-variant bg-surface-container-low">
        <div className="bg-primary/10 p-3 rounded-xl mb-4 text-center">
          <p className="text-[11px] text-primary font-bold">
            Bersama memilah sampah, bersama jaga bumi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full ${user?.avatarBg || "bg-blue-100"} ${user?.avatarColor || "text-blue-700"} flex items-center justify-center font-bold text-xs shadow-sm border border-outline-variant/20 flex-shrink-0 overflow-hidden`}
          >
            {user?.fotoProfil ? (
              <img
                src={getProfilePhotoUrl(user.fotoProfil) || undefined}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              user?.avatar || "U"
            )}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-[12px] text-on-surface font-bold truncate">
              {user?.name || "Pengguna"}
            </p>
            <p className="text-[10px] text-on-surface-variant truncate font-semibold">
              {user?.peran?.replace("_", " ")}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-auto text-on-surface-variant hover:text-error transition-colors flex-shrink-0"
            title="Keluar Sistem"
          >
            <LogOut size={20} />
          </button>
        </div>
        <div className="mt-3 text-[9px] text-on-surface-variant/65 text-center">
          © 2026 PT Makerindo.
        </div>
      </div>
    </aside>

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
              onClick={confirmLogout}
              className="flex-1 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition shadow-sm cursor-pointer"
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
