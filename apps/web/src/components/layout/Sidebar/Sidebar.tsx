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
  Globe
} from "lucide-react";

import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../store/useAuthStore";
import type { UserRole } from "../../../store/useAuthStore";
import { getProfilePhotoUrl, handleAvatarError } from "../../../utils/photoUtils";

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
    if (location.pathname !== to) return false;
    if (!location.search) return true;
    return currentPathWithSearch === to || location.search === "?tab=OVERVIEW" || location.search === "?tab=KELOMPOK";
  }, [to, location.pathname, location.search, currentPathWithSearch]);

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
    "SUPER_USER",
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "RT",
    "DPL",
    "PEMIMPIN",
    "PANITIA_TASKFORCE",
  ];

  const menuSections = [
    {
      header: "Layanan Utama",
      items: [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard Utama", allowed: ALL_ROLES },
        { to: "/monitoring", icon: Activity, label: "Monitoring Wilayah", allowed: ["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT"] as UserRole[] },
      ],
    },
    {
      header: "Dashboard Kegiatan KKN",
      items: [
        { to: "/dashboard-kkn", icon: Users, label: "Kelompok KKN", allowed: ["SUPER_USER", "DPL", "PEMIMPIN", "PANITIA_TASKFORCE"] as UserRole[] },
        { to: "/dashboard-kkn?tab=MAHASISWA", icon: GraduationCap, label: "Portofolio Mahasiswa", allowed: ["SUPER_USER", "DPL", "PEMIMPIN", "PANITIA_TASKFORCE"] as UserRole[] },
        { to: "/dashboard-kkn?tab=APPROVAL", icon: ClipboardCheck, label: "Persetujuan Sakit / Izin", allowed: ["SUPER_USER", "DPL", "PEMIMPIN", "PANITIA_TASKFORCE"] as UserRole[] },
      ],
    },
    {
      header: "Tata Kelola Sampah",
      items: [
        { to: "/setor-sampah", icon: ScanLine, label: "Pemilahan Sampah Warga", allowed: ALL_ROLES },
        { to: "/rw/approval", icon: ShieldCheck, label: "Approval Tempat Sampah & Petugas", allowed: ["SUPER_USER", "RW", "RT"] as UserRole[] },
        { to: "/manajemen-pengangkutan", icon: Truck, label: "Pengangkutan Sampah", allowed: ["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "PEMIMPIN", "PANITIA_TASKFORCE"] as UserRole[] },
        { to: "/pemanfaatan-sampah", icon: Sprout, label: "Entri Pemanfaatan Sampah", allowed: ["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT", "PEMIMPIN", "PANITIA_TASKFORCE"] as UserRole[] },
        { to: "/hasil-pemanfaatan", icon: Archive, label: "Laporan & Hasil Panen", allowed: ["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT", "PEMIMPIN", "PANITIA_TASKFORCE"] as UserRole[] },
      ],
    },
    {
      header: "Manajemen Data",
      items: [
        {
          type: "group",
          icon: Users,
          label: "Master Pengguna",
          allowed: ["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE"] as UserRole[],
          children: [
            { to: "/manajemen-pengguna?role=SUPER_USER", label: "Super User" },
            { to: "/manajemen-pengguna?role=ADMIN_DLH", label: "Dinas Lingkungan Hidup" },
            { to: "/manajemen-pengguna?role=CAMAT", label: "Camat" },
            { to: "/manajemen-pengguna?role=LURAH", label: "Lurah" },
            { to: "/manajemen-pengguna?role=RW", label: "Rukun Warga" },
            { to: "/manajemen-pengguna?role=PEMIMPIN", label: "Pimpinan" },
            { to: "/manajemen-pengguna?role=PANITIA_TASKFORCE", label: "Task Force" },
            { to: "/manajemen-pengguna?role=DPL", label: "Dosen Pembimbing Lapangan" },
            { to: "/manajemen-pengguna?role=PETUGAS_RESIDU", label: "Petugas Residu" },
            { to: "/manajemen-pengguna?role=MAHASISWA_KKN", label: "Mahasiswa" },
            { to: "/manajemen-pengguna?role=WARGA", label: "Warga" },
          ],
        },
        {
          type: "group",
          icon: MapPin,
          label: "Master Data Wilayah",
          allowed: ["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE"] as UserRole[],
          children: [
            { to: "/master-wilayah?tab=kecamatan", label: "Kecamatan" },
            { to: "/master-wilayah?tab=kelurahan", label: "Kelurahan" },
            { to: "/master-wilayah?tab=rw", label: "Rukun Warga (RW)" },
          ],
        },
        { to: "/pengguna-online", icon: Globe, label: "Pengguna Online (Live)", allowed: ["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE"] as UserRole[] },
        { to: "/manajemen-tempat-sampah", icon: Trash2, label: "Manajemen Tempat Sampah", allowed: ["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT", "PEMIMPIN", "PANITIA_TASKFORCE"] as UserRole[] },
        { to: "/manajemen-lokasi", icon: MapPin, label: "Manajemen Lokasi", allowed: ["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT", "PEMIMPIN", "PANITIA_TASKFORCE"] as UserRole[] },
        { to: "/rw/fasilitas", icon: Sprout, label: "Fasilitas & Ide", allowed: ["SUPER_USER", "RW", "RT"] as UserRole[] },
      ],

    },
    {
      header: "Laporan & Validasi",
      items: [
        { to: "/superUser/discrepancies", icon: ClipboardCheck, label: "Review Diskrepansi AI", allowed: ["SUPER_USER", "ADMIN_DLH", "PEMIMPIN"] as UserRole[] },
        { to: "/monitoring-absen", icon: Compass, label: "Monitoring Absen KKN", allowed: ["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT", "PEMIMPIN", "PANITIA_TASKFORCE"] as UserRole[] },
        { to: "/rekap-setoran", icon: Receipt, label: "Rekap Setoran", allowed: ["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT", "PEMIMPIN", "PANITIA_TASKFORCE"] as UserRole[] },
        { to: "/laporan-analitik", icon: LineChart, label: "Laporan & Analitik", allowed: ["SUPER_USER", "ADMIN_DLH", "CAMAT", "LURAH", "RW", "RT", "PEMIMPIN", "PANITIA_TASKFORCE"] as UserRole[] },
      ],
    },
    {
      header: "Edukasi & Gamifikasi",
      items: [
        { to: "/leaderboard", icon: Trophy, label: "Leaderboard", allowed: ALL_ROLES },
        { to: "/poin-warga", icon: Star, label: "Poin Warga", allowed: ALL_ROLES },
        { to: "/ide-daur-ulang", icon: Lightbulb, label: "Ide Daur Ulang", allowed: ALL_ROLES },
        { to: "/jadwal-kegiatan", icon: Calendar, label: "Jadwal Kegiatan", allowed: ALL_ROLES },
        { to: "/kategori-sampah", icon: Tags, label: "Kategori Sampah", allowed: ["SUPER_USER", "ADMIN_DLH", "PEMIMPIN", "PANITIA_TASKFORCE"] as UserRole[] },
      ],
    },
    {
      header: "Sistem & Bantuan",
      items: [
        { to: "/panduan", icon: FileText, label: "Menu Panduan", allowed: ALL_ROLES },
        { to: "/notifikasi", icon: Bell, label: "Notifikasi", allowed: ALL_ROLES },
        { to: "/pengaturan", icon: Settings, label: "Pengaturan", allowed: ALL_ROLES },
        { to: "/tentang", icon: Info, label: "Tentang Aplikasi", allowed: ALL_ROLES },
      ],
    },
    {
      header: "SUPER USER Panel",
      items: [
        { to: "/superUser/configs", icon: Sliders, label: "Rule Engine", allowed: ["SUPER_USER"] as UserRole[] },
        { to: "/superUser/qr-master", icon: QrCode, label: "Master QR & Inaktif", allowed: ["SUPER_USER"] as UserRole[] },
        { to: "/superUser/audit", icon: FileText, label: "Audit Trail", allowed: ["SUPER_USER"] as UserRole[] },
        { to: "/role-permissions", icon: Shield, label: "Hak Akses (RBAC)", allowed: ["SUPER_USER"] as UserRole[] },
        { to: "/simulasi-model-ai", icon: FileText, label: "Simulasi Model AI", allowed: ["SUPER_USER", "ADMIN_DLH"] as UserRole[] },
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
        <div className="px-5 py-4 border-b border-outline-variant/30 bg-slate-50/40 flex items-center justify-center">
          <div className="relative group w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-gradient-to-b from-emerald-50/70 to-white/90 border border-emerald-100/70 shadow-2xs transition-all duration-300 hover:shadow-xs hover:scale-[1.01]">
            <img
              src="/logo.png"
              alt="TrashCare Logo"
              className="h-16 w-auto object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
            />
          </div>
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
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm border border-outline-variant/20 flex-shrink-0 overflow-hidden bg-slate-100"
          >
            <img
              src={getProfilePhotoUrl(user?.fotoProfil, user?.name)}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={(e) => handleAvatarError(e, user?.name)}
            />
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
        <div className="mt-3 text-[9px] text-on-surface-variant/65 text-center leading-relaxed">
          © 2026 UNIVERSITAS KOMPUTER INDONESIA  ALL RIGHTS RESERVED.
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
