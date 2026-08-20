/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo.
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
  Database,
  Trophy,
  Info,
  GraduationCap,
  ChevronDown,
  Clock,
  Tags,
  Recycle,
  ShieldCheck,
  Award,
  BookOpen,
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
      className={`relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-200 ease-out text-[12.5px] group overflow-hidden transform-gpu ${
        isCurrentActive
          ? "bg-emerald-50/90 dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 font-semibold shadow-[0_2px_10px_rgba(0,153,102,0.12)] border border-[#009966]/15 dark:border-emerald-700/30 scale-[1.01]"
          : "text-slate-600 dark:text-slate-400 hover:text-[#009966] dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:translate-x-1 font-medium active:scale-[0.98]"
      }`}
    >
      {/* Left Curved Green Accent Indicator */}
      {isCurrentActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#009966] dark:bg-emerald-500 rounded-r-full shadow-xs" />
      )}

      <Icon className={`shrink-0 transition-transform duration-200 ease-out ${isCurrentActive ? "text-[#009966] dark:text-emerald-400 scale-105" : "text-slate-500 dark:text-slate-400 group-hover:text-[#009966] dark:group-hover:text-emerald-400 group-hover:scale-105"}`} size={16} />
      <span className="flex-1 truncate tracking-tight">{label}</span>
      {badge !== undefined && (
        <span className="bg-[#009966] dark:bg-emerald-600 text-white text-[9.5px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs group-hover:scale-105 transition-transform">{badge}</span>
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
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center my-0.5 transition-all group cursor-pointer shrink-0 ${
        isCurrentActive
          ? "bg-[#009966] dark:bg-emerald-600 text-white shadow-md shadow-emerald-900/20 scale-105"
          : "text-slate-500 dark:text-slate-400 hover:text-[#009966] dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      <Icon size={16} />
      <span className="absolute left-14 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-[70] border border-slate-700/60">
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

  const isSubActive = (subTo: string, index: number) => {
    if (currentPath === subTo) return true;
    if (
      !location.search &&
      ["/master-pengguna", "/master-data-pengguna", "/manajemen-pengguna"].includes(location.pathname) &&
      subTo.startsWith("/master-pengguna")
    ) {
      return index === 0;
    }
    if (
      ["/master-pengguna", "/master-data-pengguna", "/manajemen-pengguna"].includes(location.pathname) &&
      subTo.startsWith("/master-pengguna?role=")
    ) {
      const subRole = subTo.split("?role=")[1]?.toLowerCase();
      const currentRole = (new URLSearchParams(location.search).get("role") || "").toLowerCase();
      if (subRole === currentRole) return true;
      if (subRole === "su" && ["su", "admin", "superuser", "super_user"].includes(currentRole)) return true;
      if (subRole === "petugas-residu" && ["petugas-residu", "petugas_residu", "petugas"].includes(currentRole)) return true;
      if (subRole === "mahasiswa" && ["mahasiswa", "mahasiswa-kkn", "mahasiswa_kkn"].includes(currentRole)) return true;
      if (subRole === "taskforce" && ["taskforce", "task-force", "panitia_taskforce"].includes(currentRole)) return true;
    }
    return false;
  };

  const isAnySubActive = items.some(
    (item, idx) =>
      isSubActive(item.to, idx) ||
      (location.pathname === "/master-pengguna" && item.to.startsWith("/master-pengguna"))
  );

  React.useEffect(() => {
    if (isAnySubActive) {
      setIsOpen(true);
    }
  }, [isAnySubActive]);

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-200 text-[12.5px] text-left group relative overflow-hidden ${
          isAnySubActive
            ? "bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 font-semibold"
            : "text-slate-600 dark:text-slate-400 hover:text-[#009966] dark:hover:text-emerald-400 hover:bg-slate-50/80 dark:bg-slate-800/80 dark:hover:bg-slate-800/80 font-medium"
        }`}
      >
        {isAnySubActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#009966] dark:bg-emerald-500 rounded-r-full" />
        )}

        <Icon className={`shrink-0 transition-colors ${isAnySubActive ? "text-[#009966] dark:text-emerald-400" : "text-slate-500 dark:text-slate-400 group-hover:text-[#009966] dark:group-hover:text-emerald-400"}`} size={16} />
        <span className="flex-1 font-semibold text-slate-700 dark:text-slate-300 truncate">{label}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 text-slate-400 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="ml-3.5 pl-2 border-l-2 border-slate-200/80 dark:border-slate-800 my-0.5 space-y-0.5">
          {items.map((sub, idx) => {
            const isActive = isSubActive(sub.to, idx);
            return (
              <NavLink
                key={sub.to}
                to={sub.to}
                title={sub.label}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] transition-all group ${
                  isActive
                    ? "bg-[#e5f7ed] dark:bg-emerald-950/60 text-[#009966] dark:text-emerald-400 font-semibold shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-[#009966] dark:hover:text-emerald-400 hover:translate-x-0.5 font-medium active:scale-[0.98]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                    isActive
                      ? "bg-[#009966] dark:bg-emerald-400 scale-125 ring-2 ring-emerald-200 dark:ring-emerald-800"
                      : "bg-slate-300 dark:bg-slate-600 group-hover:bg-[#009966] dark:group-hover:bg-emerald-400"
                  }`}
                />
                <span className="truncate">{sub.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-4 pt-4 pb-1.5 text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
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
        }).replace(/:/g, ".") + " WIB"
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
    "ADMIN_DLH",
    "CAMAT",
    "LURAH",
    "RW",
    "PETUGAS_RESIDU",
    "MAHASISWA_KKN",
    "DPL",
    "DOSEN_PEMBIMBING",
    "PANITIA_TASKFORCE",
    "PEMIMPIN",
    "WARGA",
  ];

  const hasAccess = (allowed: UserRole[]) =>
    userRole === "DEVELOPER" || allowed.includes(userRole);

  const getFilteredGroupChildren = (
    groupLabel: string,
    items: Array<{ to: string; label: string; allowed?: UserRole[] }>
  ) => {
    if (groupLabel === "Wilayah" || groupLabel === "Data Wilayah") {
      if (userRole === "DEVELOPER" || userRole === "SUPER_USER" || userRole === "ADMIN_DLH") {
        return items;
      }
      return [];
    }

    if (groupLabel === "Dataset") {
      if (userRole === "DEVELOPER") {
        return items;
      }
      return [];
    }

    return items.filter((c) => !c.allowed || hasAccess(c.allowed));
  };

  const menuSections = [
    {
      header: "OPERASIONAL",
      items: [
        {
          to: "/dasbor",
          icon: LayoutDashboard,
          label: "Dasbor",
          allowed: ALL_ROLES,
        },
        {
          to: "/monitoring-wilayah",
          icon: MapPin,
          label: "Peta Wilayah",
          allowed: [
            "DEVELOPER",
            "SUPER_USER",
            "ADMIN_DLH",
            "CAMAT",
            "LURAH",
            "RW",
            "PETUGAS_RESIDU",
            "PANITIA_TASKFORCE",
            "PEMIMPIN",
          ] as UserRole[],
        },
      ],
    },
    {
      header: "PROGRAM KKN",
      items: [
        {
          type: "group",
          label: "Pelaksanaan KKN",
          icon: GraduationCap,
          allowed: [
            "DEVELOPER",
            "SUPER_USER",
            "ADMIN_DLH",
            "DPL",
            "DOSEN_PEMBIMBING",
            "PANITIA_TASKFORCE",
            "PEMIMPIN",
          ] as UserRole[],
          children: [
            {
              to: "/dashboard-dpl",
              label: "Dasbor DPL",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "ADMIN_DLH",
                "DPL",
                "DOSEN_PEMBIMBING",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
              ] as UserRole[],
            },
            {
              to: "/jadwal-kegiatan",
              label: "Linimasa Kegiatan",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "ADMIN_DLH",
                "DPL",
                "DOSEN_PEMBIMBING",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
              ] as UserRole[],
            },
            {
              to: "/manajemen-ekosistem-kkn",
              label: "Kelompok KKN",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "ADMIN_DLH",
                "DPL",
                "DOSEN_PEMBIMBING",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
              ] as UserRole[],
            },
            {
              to: "/program-kerja-kkn",
              label: "Program Kerja",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "ADMIN_DLH",
                "DPL",
                "DOSEN_PEMBIMBING",
                "PANITIA_TASKFORCE",
              ] as UserRole[],
            },
            {
              to: "/monitoring-absen",
              label: "Presensi",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "ADMIN_DLH",
                "DPL",
                "DOSEN_PEMBIMBING",
                "PANITIA_TASKFORCE",
              ] as UserRole[],
            },
            {
              to: "/ajuan-absensi",
              label: "Pengajuan Izin/Sakit",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "ADMIN_DLH",
                "DPL",
                "DOSEN_PEMBIMBING",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
              ] as UserRole[],
            },
          ],
        },
        {
          type: "group",
          label: "Penilaian KKN",
          icon: Award,
          allowed: [
            "DEVELOPER",
            "DPL",
            "DOSEN_PEMBIMBING",
            "ADMIN_DLH",
            "LURAH",
            "CAMAT",
            "RW",
            "SUPER_USER",
            "PANITIA_TASKFORCE",
            "PEMIMPIN",
          ] as UserRole[],
          children: [
            {
              to: "/penilaian-kkn/mahasiswa",
              label: "Penilaian Individu",
              allowed: [
                "DEVELOPER",
                "DPL",
                "DOSEN_PEMBIMBING",
                "ADMIN_DLH",
                "LURAH",
                "CAMAT",
                "RW",
                "SUPER_USER",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
              ] as UserRole[],
            },
            {
              to: "/penilaian-kkn/program-kerja",
              label: "Penilaian Program Kerja",
              allowed: [
                "DEVELOPER",
                "DPL",
                "DOSEN_PEMBIMBING",
                "SUPER_USER",
                "PANITIA_TASKFORCE",
              ] as UserRole[],
            },
            {
              to: "/penilaian-kkn/laporan-akhir",
              label: "Penilaian Laporan Akhir",
              allowed: [
                "DEVELOPER",
                "DPL",
                "DOSEN_PEMBIMBING",
                "SUPER_USER",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
              ] as UserRole[],
            },
            {
              to: "/penilaian-kkn/rekap",
              label: "Rekap & Nilai Akhir",
              allowed: [
                "DEVELOPER",
                "DPL",
                "DOSEN_PEMBIMBING",
                "ADMIN_DLH",
                "LURAH",
                "CAMAT",
                "RW",
                "SUPER_USER",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
              ] as UserRole[],
            },
          ],
        },
        {
          type: "group",
          label: "Survei & Dampak",
          icon: FileText,
          allowed: [
            "DEVELOPER",
            "SUPER_USER",
            "DPL",
            "DOSEN_PEMBIMBING",
            "PANITIA_TASKFORCE",
            "PEMIMPIN",
            "ADMIN_DLH",
            "CAMAT",
            "LURAH",
          ] as UserRole[],
          children: [
            {
              to: "/superUser/data-survei-baseline",
              label: "Survei Baseline",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "DPL",
                "DOSEN_PEMBIMBING",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
              ] as UserRole[],
            },
            {
              to: "/superUser/data-survei-endline",
              label: "Survei Endline",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "DPL",
                "DOSEN_PEMBIMBING",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
              ] as UserRole[],
            },
            {
              to: "/evaluasi-dampak-kkn",
              label: "Evaluasi & Dampak",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "DPL",
                "DOSEN_PEMBIMBING",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
              ] as UserRole[],
            },
            {
              to: "/superUser/import-survei-kkn",
              label: "Impor Data Survei",
              allowed: ["DEVELOPER", "SUPER_USER", "PANITIA_TASKFORCE"] as UserRole[],
            },
          ],
        },
      ],
    },
    {
      header: "TATA KELOLA SAMPAH",
      items: [
        {
          type: "group",
          label: "Pemilahan & Angkut",
          icon: Trash2,
          allowed: [
            "DEVELOPER",
            "SUPER_USER",
            "ADMIN_DLH",
            "CAMAT",
            "LURAH",
            "RW",
            "PETUGAS_RESIDU",
            "WARGA",
          ] as UserRole[],
          children: [
            {
              to: "/master-data/manajemen-tempat-sampah",
              label: "Tempat Sampah",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PETUGAS_RESIDU",
              ] as UserRole[],
            },
            {
              to: "/penyetoran-sampah",
              label: "Setor Sampah",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PETUGAS_RESIDU",
                "WARGA",
              ] as UserRole[],
            },
            {
              to: "/pengangkutan-residu",
              label: "Pengangkutan Residu",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PETUGAS_RESIDU",
              ] as UserRole[],
            },
          ],
        },
        {
          type: "group",
          label: "Pemanfaatan & Hasil",
          icon: Recycle,
          allowed: [
            "DEVELOPER",
            "SUPER_USER",
            "ADMIN_DLH",
            "CAMAT",
            "LURAH",
            "RW",
            "PEMIMPIN",
            "PANITIA_TASKFORCE",
            "PETUGAS_RESIDU",
            "WARGA",
          ] as UserRole[],
          children: [
            {
              to: "/pemantauan-rekapitulasi",
              label: "Rekapitulasi Setoran",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
                "PETUGAS_RESIDU",
              ] as UserRole[],
            },
            {
              to: "/pengelolaan-sampah",
              label: "Inovasi Pengolahan",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "WARGA",
              ] as UserRole[],
            },
            {
              to: "/hasil-pemanfaatan",
              label: "Hasil Pemanfaatan",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "WARGA",
              ] as UserRole[],
            },
          ],
        },
      ],
    },
    {
      header: "DATA MASTER",
      items: [
        {
          type: "group",
          label: "Pengguna",
          icon: Users,
          allowed: ["DEVELOPER", "SUPER_USER", "PANITIA_TASKFORCE", "PEMIMPIN", "RW"] as UserRole[],
          children: [
            { to: "/master-pengguna?role=developer", label: "Developer", allowed: ["DEVELOPER"] as UserRole[] },
            { to: "/master-pengguna?role=su", label: "Admin", allowed: ["DEVELOPER", "SUPER_USER"] as UserRole[] },
            { to: "/master-pengguna?role=pimpinan", label: "Pimpinan", allowed: ["DEVELOPER", "SUPER_USER", "PEMIMPIN"] as UserRole[] },
            { to: "/master-pengguna?role=taskforce", label: "Task Force", allowed: ["DEVELOPER", "SUPER_USER", "PANITIA_TASKFORCE", "PEMIMPIN"] as UserRole[] },
            { to: "/master-pengguna?role=dpl", label: "DPL", allowed: ["DEVELOPER", "SUPER_USER", "PANITIA_TASKFORCE", "PEMIMPIN"] as UserRole[] },
            { to: "/master-pengguna?role=dlh", label: "DLH", allowed: ["DEVELOPER", "SUPER_USER"] as UserRole[] },
            { to: "/master-pengguna?role=camat", label: "Camat", allowed: ["DEVELOPER", "SUPER_USER"] as UserRole[] },
            { to: "/master-pengguna?role=lurah", label: "Lurah", allowed: ["DEVELOPER", "SUPER_USER"] as UserRole[] },
            { to: "/master-pengguna?role=rw", label: "RW", allowed: ["DEVELOPER", "SUPER_USER"] as UserRole[] },
            { to: "/master-pengguna?role=petugas-residu", label: "Petugas Residu", allowed: ["DEVELOPER", "SUPER_USER", "RW"] as UserRole[] },
            { to: "/master-pengguna?role=mahasiswa", label: "Mahasiswa", allowed: ["DEVELOPER", "SUPER_USER", "PANITIA_TASKFORCE", "PEMIMPIN"] as UserRole[] },
            { to: "/master-pengguna?role=warga", label: "Warga", allowed: ["DEVELOPER", "SUPER_USER", "RW"] as UserRole[] },
          ],
        },
        {
          type: "group",
          label: "Wilayah",
          icon: MapPin,
          allowed: ["DEVELOPER", "SUPER_USER", "ADMIN_DLH"] as UserRole[],
          children: [
            { to: "/master-data/provinsi", label: "Provinsi" },
            { to: "/master-data/kota-kabupaten", label: "Kota / Kabupaten" },
            { to: "/master-data/kecamatan", label: "Kecamatan" },
            { to: "/master-data/kelurahan", label: "Kelurahan" },
            { to: "/master-data/rukun-warga", label: "RW" },
          ],
        },
        {
          type: "group",
          label: "Panduan & Edukasi",
          icon: BookOpen,
          allowed: ["DEVELOPER", "SUPER_USER", "ADMIN_DLH"] as UserRole[],
          children: [
            { to: "/master-data/panduan", label: "Buku Panduan" },
            { to: "/master-data/kegiatan-sampah", label: "Kegiatan Sampah" },
          ],
        },
        {
          type: "group",
          label: "Dataset",
          icon: Database,
          allowed: ["DEVELOPER"] as UserRole[],
          children: [
            { to: "/dataset/hasil-klasifikasi", label: "Hasil Klasifikasi" },
          ],
        },
      ],
    },
    {
      header: "ANALITIK",
      items: [
        {
          to: "/peringkat",
          icon: Trophy,
          label: "Peringkat Warga",
          allowed: [
            "DEVELOPER",
            "SUPER_USER",
            "ADMIN_DLH",
            "CAMAT",
            "LURAH",
            "RW",
            "PETUGAS_RESIDU",
            "MAHASISWA_KKN",
            "PANITIA_TASKFORCE",
            "PEMIMPIN",
            "WARGA",
          ] as UserRole[],
        },
      ],
    },
    {
      header: "ADMINISTRASI",
      items: [
        {
          type: "group",
          label: "Audit & Log",
          icon: FileText,
          allowed: ["DEVELOPER", "SUPER_USER", "ADMIN_DLH", "PANITIA_TASKFORCE"] as UserRole[],
          children: [
            { to: "/log-aktivitas", label: "Log Aktivitas", allowed: ["DEVELOPER", "SUPER_USER"] as UserRole[] },
            { to: "/pengguna-online", label: "Pengguna Online", allowed: ["DEVELOPER", "SUPER_USER", "ADMIN_DLH", "PANITIA_TASKFORCE"] as UserRole[] },
          ],
        },
        {
          type: "group",
          label: "Verifikasi & QR",
          icon: ShieldCheck,
          allowed: ["DEVELOPER", "SUPER_USER", "ADMIN_DLH", "PANITIA_TASKFORCE"] as UserRole[],
          children: [
            { to: "/superUser/discrepancies", label: "Diskrepansi AI", allowed: ["DEVELOPER", "SUPER_USER", "ADMIN_DLH", "PANITIA_TASKFORCE"] as UserRole[] },
            { to: "/superUser/master-qr", label: "Batch QR Code", allowed: ["DEVELOPER"] as UserRole[] },
          ],
        },
      ],
    },
    {
      header: "PENGATURAN & PANDUAN",
      items: [
        {
          type: "group",
          label: "Akun & Sistem",
          icon: Settings,
          allowed: ALL_ROLES,
          children: [
            { to: "/pengaturan", label: "Profil", allowed: ALL_ROLES },
            { to: "/notifikasi", label: "Notifikasi", allowed: ALL_ROLES },
            { to: "/master-data/rule-engine", label: "Rule Engine", allowed: ["DEVELOPER", "SUPER_USER", "ADMIN_DLH"] as UserRole[] },
          ],
        },
        {
          to: "/panduan",
          icon: Info,
          label: "Buku Panduan",
          allowed: ALL_ROLES,
        },
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
        } h-screen fixed left-0 top-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col z-50 transition-all duration-300 ease-in-out transform lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Render Collapsed Mini Sidebar */}
        {isCollapsed ? (
          <div className="flex flex-col h-full items-center justify-between py-3">
            {/* Top Brand Logo & Clock */}
            <div className="flex flex-col items-center w-full border-b border-slate-100 dark:border-slate-800 pb-2 mb-1 gap-2 shrink-0">
              <div
                title="BERSEKA"
                className="w-12 h-12 rounded-2xl bg-[#e5f7ed] dark:bg-emerald-950/60 border border-[#009966]/20 dark:border-emerald-700/30 flex items-center justify-center p-1.5 shadow-sm hover:scale-105 transition-all cursor-pointer"
              >
                <img
                  src="/image/berseka-icon.png"
                  alt="BERSEKA Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Collapsed Clock Button */}
              <div
                title={timeStr ? `${dateStr} - ${timeStr}` : "Jam Sistem"}
                className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 flex items-center justify-center relative group cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all"
              >
                <Clock size={17} className="text-[#009966] dark:text-emerald-400" />
                <span className="absolute left-16 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-[60] border border-slate-700/60">
                  {dateStr ? `${dateStr} • ${timeStr}` : timeStr || "Jam Sistem"}
                </span>
              </div>
            </div>

            {/* Centered Icons Navigation List */}
            <nav className="flex-1 overflow-y-auto w-full px-2 py-2 space-y-1 flex flex-col items-center scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
              {menuSections.map((sec, idx) => {
                const visibleItems = sec.items.filter((item) => hasAccess(item.allowed));
                if (visibleItems.length === 0) return null;
                return (
                  <React.Fragment key={sec.header}>
                    {idx > 0 && <div className="w-6 h-px bg-slate-200/80 dark:bg-slate-800 my-1.5 mx-auto shrink-0" />}
                    {visibleItems.map((item: any) =>
                      item.type === "group" ? (
                        <NavItemCollapsed
                          key={item.label}
                          to={getFilteredGroupChildren(item.label, item.children)[0]?.to || "/master-pengguna"}
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
            <div className="flex flex-col items-center pt-2 border-t border-slate-100 dark:border-slate-800 w-full px-2 shrink-0">
              <button
                onClick={handleLogout}
                title="Keluar Sistem"
                className="w-10 h-10 rounded-2xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-all relative group cursor-pointer"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* Render Full Sidebar */
          <div className="flex flex-col h-full justify-between overflow-hidden">
            {/* Top Brand Logo Header Section with Real-Time Clock */}
            <div className="pt-4 pb-3 px-3.5 border-b border-slate-100/80 dark:border-slate-800 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-emerald-50/20 dark:from-emerald-950/20 via-transparent to-transparent shrink-0 group">
              {/* Four Animated Eco Background Watermarks */}
              <Sprout size={16} className="absolute top-3 left-4 text-[#009966]/40 dark:text-emerald-500/30 animate-pulse [animation-duration:2.5s] transition-transform group-hover:scale-110" />
              <Tags size={16} className="absolute top-3 right-4 text-[#009966]/40 dark:text-emerald-500/30 animate-pulse [animation-duration:3s] transition-transform group-hover:scale-110" />
              <Recycle size={16} className="absolute bottom-3 left-4 text-[#009966]/40 dark:text-emerald-500/30 animate-spin [animation-duration:12s] transition-transform group-hover:scale-110" />
              <Trash2 size={16} className="absolute bottom-3 right-4 text-[#0284c7]/40 dark:text-sky-500/30 animate-pulse [animation-duration:2.8s] transition-transform group-hover:scale-110" />

              <Link to="/dasbor" className="flex flex-col items-center group cursor-pointer relative z-10 mb-3 px-2">
                <img
                  src="/image/berseka-logo.png"
                  alt="BERSEKA - Bersih, Sehat, Kampung Asri"
                  className="h-11 w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </Link>

              {/* Real-time System Clock Card (Placed at top) */}
              <div className="w-full bg-slate-50/90 dark:bg-slate-800/90 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs text-center space-y-0.5 transition-all relative z-10">
                <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 mb-0.5">
                  <Clock size={12} className="text-[#009966] dark:text-emerald-400" />
                  <p className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 truncate">
                    {dateStr || "Jumat, 14 Agustus 2026"}
                  </p>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-wider font-mono">
                  {timeStr || "02.59.16 WIB"}
                </p>
              </div>
            </div>

            {/* Scrollable Navigation Sections */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
              {menuSections.map((sec) => {
                const visibleItems = sec.items.filter((item) => hasAccess(item.allowed));
                if (visibleItems.length === 0) return null;
                return (
                  <div key={sec.header} className="space-y-0.5">
                    <SectionHeader label={sec.header} />
                    {visibleItems.map((item: any) => {
                      if (item.type === "group") {
                        const childrenToRender = getFilteredGroupChildren(item.label, item.children);
                        if (childrenToRender.length === 0) return null;
                        if (
                          childrenToRender.length === 1 &&
                          !["Pengguna", "Data Pengguna", "Wilayah", "Data Wilayah", "Dataset"].includes(item.label)
                        ) {
                          return (
                            <NavItem
                              key={childrenToRender[0].to}
                              to={childrenToRender[0].to}
                              icon={item.icon}
                              label={childrenToRender[0].label}
                            />
                          );
                        }
                        return (
                          <NavGroup
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            items={childrenToRender}
                          />
                        );
                      }
                      return (
                        <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
                      );
                    })}
                  </div>
                );
              })}
            </nav>

            {/* Bottom Section: Logout Link */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-start gap-3 px-4 py-2.5 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-all cursor-pointer group font-semibold text-[13px]"
              >
                <LogOut size={18} className="text-rose-500 dark:text-rose-400 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-rose-600 dark:text-rose-400 font-bold text-xs">Keluar Sistem</span>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 space-y-4 text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-2xs">
              <LogOut size={26} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Konfirmasi Sesi Keluar</h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                Apakah Anda yakin ingin mengakhiri sesi dan keluar dari sistem BERSEKA?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-2xs cursor-pointer"
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
