/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React from "react";
import { LogOut, LayoutDashboard, ScanLine, Compass, Shield, Users, ClipboardCheck, Trash2, MapPin, ShieldCheck, Sprout, Calendar, Tags, Receipt, Star, LineChart, Bell, Settings, Sliders, QrCode, FileText, FilePlus, Lightbulb, Info, GraduationCap } from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
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

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, badge }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-4 py-3 rounded-r-xl transition-all text-[13px] ${
        isActive
          ? "bg-secondary-fixed text-on-secondary-fixed-variant border-l-4 border-secondary font-bold"
          : "text-on-surface-variant hover:bg-surface-container-high"
      }`
    }
  >
    <Icon className="mr-3 text-[20px]" size={20} />
    <span className="flex-1">{label}</span>
    {badge !== undefined && (
      <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">{badge}</span>
    )}
  </NavLink>
);

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

  const getProfilePhotoUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
    const host = baseUrl.replace("/api/v1", "");
    return `${host}${path}`;
  };

  const handleLogout = () => {
    logout();
    toast.success("Berhasil keluar sistem");
    navigate("/login");
  };

  const currentRole = user?.peran || "WARGA";

  // Role based helper
  const hasAccess = (allowed: UserRole[]) => allowed.includes(currentRole);

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
            className="h-20 w-auto object-contain"
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
          <SectionHeader label="Layanan Utama" />
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />

        {hasAccess(["WARGA"]) && (
          <NavItem to="/setor" icon={ScanLine} label="Setor Sampah" />
        )}

        {hasAccess(["MAHASISWA_KKN"]) && (
          <NavItem to="/kkn-portal" icon={Compass} label="Portal Pendampingan" />
        )}

        {hasAccess(["PETUGAS_RESIDU"]) && (
          <NavItem to="/residu-portal" icon={Shield} label="Portal Pengawasan" />
        )}

        {hasAccess(["RW"]) && (
          <NavItem to="/rw/approval" icon={ShieldCheck} label="Approval Bin & Petugas" />
        )}

        {hasAccess(["PETUGAS_RESIDU", "SUPER_ADMIN", "ADMIN_DLH"]) && (
          <NavItem to="/input-manual" icon={FilePlus} label="Input Setoran Manual" />
        )}

        <SectionHeader label="Manajemen Data" />
        {hasAccess(["SUPER_ADMIN", "ADMIN_DLH"]) && (
          <NavItem to="/manajemen-pengguna" icon={Users} label="Manajemen Pengguna" />
        )}

        {hasAccess(["SUPER_ADMIN"]) && (
          <NavItem to="/manajemen-mahasiswa" icon={GraduationCap} label="Manajemen Mahasiswa" />
        )}

        {hasAccess([
          "SUPER_ADMIN",
          "ADMIN_DLH",
          "CAMAT",
          "LURAH",
          "RW",
          "PETUGAS_RESIDU",
          "MAHASISWA_KKN",
        ]) && (
          <NavItem to="/manajemen-tempat-sampah" icon={Trash2} label="Manajemen Tempat Sampah" />
        )}

        {hasAccess(["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW"]) && (
          <NavItem to="/manajemen-lokasi" icon={MapPin} label="Manajemen Lokasi" />
        )}

        {hasAccess(["RW"]) && (
          <NavItem to="/rw/fasilitas" icon={Sprout} label="Fasilitas & Ide" />
        )}

        <SectionHeader label="Laporan & Validasi" />
        {hasAccess(["SUPER_ADMIN", "ADMIN_DLH"]) && (
          <NavItem to="/superadmin/discrepancies" icon={ClipboardCheck} label="Review Diskrepansi AI" />
        )}

        {hasAccess([
          "SUPER_ADMIN",
          "ADMIN_DLH",
          "CAMAT",
          "LURAH",
          "RW",
          "PETUGAS_RESIDU",
          "MAHASISWA_KKN",
        ]) && <NavItem to="/rekap-setoran" icon={Receipt} label="Rekap Setoran" />}

        {hasAccess(["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW"]) && (
          <NavItem to="/laporan-analitik" icon={LineChart} label="Laporan & Analitik" />
        )}

        <SectionHeader label="Edukasi & Gamifikasi" />
        <NavItem to="/poin-warga" icon={Star} label="Poin Warga" />
        <NavItem to="/ide-daur-ulang" icon={Lightbulb} label="Ide Daur Ulang" />
        <NavItem to="/jadwal-kegiatan" icon={Calendar} label="Jadwal Kegiatan" />
        {hasAccess(["SUPER_ADMIN", "ADMIN_DLH"]) && (
          <NavItem to="/kategori-sampah" icon={Tags} label="Kategori Sampah" />
        )}

        <SectionHeader label="Sistem" />
        <NavItem to="/notifikasi" icon={Bell} label="Notifikasi" badge={8} />
        {hasAccess([
          "SUPER_ADMIN",
          "ADMIN_DLH",
          "CAMAT",
          "LURAH",
          "RW",
          "PETUGAS_RESIDU",
          "MAHASISWA_KKN",
          "WARGA",
        ]) && <NavItem to="/pengaturan" icon={Settings} label="Pengaturan" />}
        <NavItem to="/tentang" icon={Info} label="Tentang Aplikasi" />

        {hasAccess(["SUPER_ADMIN"]) && (
          <>
            <SectionHeader label="Super Admin Panel" />
            <NavItem to="/superadmin/configs" icon={Sliders} label="Rule Engine" />
            <NavItem to="/superadmin/qr-master" icon={QrCode} label="Master QR & Inaktif" />
            <NavItem to="/superadmin/audit" icon={FileText} label="Audit Trail" />
          </>
        )}
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
          © 2026 PT Makerindo. Developed by Jeremy Darrell & Muhammad
          Habil Putrawan.
        </div>
      </div>
    </aside>
  </>
);
};

export default Sidebar;
