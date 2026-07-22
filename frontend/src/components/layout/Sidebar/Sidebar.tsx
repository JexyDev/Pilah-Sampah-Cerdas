/**
 * Project: Pilah Sampah Cerdas
 * Developed by: Jeremy Darrell & Muhammad Habil Putrawan
 * Copyright (c) 2026 Jeremy Darrell & Muhammad Habil Putrawan. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo, tanpa perjanjian tertulis mengenai kepemilikan hak cipta.
 */

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../store/useAuthStore";
import type { UserRole } from "../../../store/useAuthStore";

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, badge }) => (
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
    <span className="material-symbols-outlined mr-3 text-[20px]">{icon}</span>
    <span className="flex-1">{label}</span>
    {badge !== undefined && (
      <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">{badge}</span>
    )}
  </NavLink>
);

const Sidebar: React.FC = () => {
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
    <aside className="w-[260px] h-screen fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant flex flex-col z-50">
      {/* Brand Header */}
      <div className="px-6 py-5 flex items-center justify-center border-b border-outline-variant/35 bg-white">
        <img
          src="/logo.png"
          alt="Pilah Sampah Cerdas - Sampah Terdata, Lingkungan Tertata"
          className="h-20 w-auto object-contain"
        />
      </div>

      {/* Navigation Menu */}
      <nav
        className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#bccabc transparent" }}
      >
        <NavItem to="/" icon="dashboard" label="Dashboard" />

        {hasAccess(["WARGA"]) && (
          <NavItem to="/setor" icon="qr_code_scanner" label="Setor Sampah" />
        )}

        {hasAccess(["MAHASISWA_KKN"]) && (
          <NavItem to="/kkn-portal" icon="explore" label="Portal Pendampingan" />
        )}

        {hasAccess(["PETUGAS_RESIDU"]) && (
          <NavItem to="/residu-portal" icon="shield" label="Portal Pengawasan" />
        )}

        {hasAccess(["SUPER_ADMIN", "ADMIN_DLH"]) && (
          <NavItem to="/manajemen-pengguna" icon="group" label="Manajemen Pengguna" />
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
          <NavItem to="/manajemen-tempat-sampah" icon="delete" label="Manajemen Tempat Sampah" />
        )}

        {hasAccess(["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW"]) && (
          <NavItem to="/manajemen-lokasi" icon="location_on" label="Manajemen Lokasi" />
        )}

        <NavItem to="/jadwal-kegiatan" icon="calendar_today" label="Jadwal Kegiatan" />

        {hasAccess(["SUPER_ADMIN", "ADMIN_DLH"]) && (
          <NavItem to="/kategori-sampah" icon="category" label="Kategori Sampah" />
        )}

        {hasAccess([
          "SUPER_ADMIN",
          "ADMIN_DLH",
          "CAMAT",
          "LURAH",
          "RW",
          "PETUGAS_RESIDU",
          "MAHASISWA_KKN",
        ]) && <NavItem to="/rekap-setoran" icon="receipt_long" label="Rekap Setoran" />}

        <NavItem to="/poin-warga" icon="stars" label="Poin Warga" />

        {hasAccess(["SUPER_ADMIN", "ADMIN_DLH", "CAMAT", "LURAH", "RW"]) && (
          <NavItem to="/laporan-analitik" icon="analytics" label="Laporan & Analitik" />
        )}

        <NavItem to="/notifikasi" icon="notifications" label="Notifikasi" badge={8} />

        {hasAccess([
          "SUPER_ADMIN",
          "ADMIN_DLH",
          "CAMAT",
          "LURAH",
          "RW",
          "PETUGAS_RESIDU",
          "MAHASISWA_KKN",
          "WARGA",
        ]) && <NavItem to="/pengaturan" icon="settings" label="Pengaturan" />}
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
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
        <div className="mt-3 text-[9px] text-on-surface-variant/65 text-center">
          © 2026 Jeremy Darrell & Muhammad Habil Putrawan. Developed by Jeremy Darrell & Muhammad
          Habil Putrawan.
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
