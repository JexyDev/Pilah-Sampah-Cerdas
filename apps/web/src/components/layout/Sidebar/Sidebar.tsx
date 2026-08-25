/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * Dikembangkan sebagai bagian dari program PKL di PT Makerindo.
 */

import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  Trash2,
  Users,
  User as UserIcon,
  MapPin,
  FileText,
  LogOut,
  Database,
  Briefcase,
  ChevronDown,
  Clock,
  Award,
  ClipboardList,
  Bot,
  Truck,
  Recycle,
} from "lucide-react";

import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import type { UserRole } from "../../../store/useAuthStore";
import showToast from "../../../utils/showToast";
import type { LucideIcon } from "lucide-react";
// import FallingLeavesBackground from "./FallingLeavesBackground";

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

// Helper penentu rute aktif yang akurat
const checkRouteActive = (
  targetUrl: string,
  pathname: string,
  search: string,
  index?: number
): boolean => {
  const [targetPath, targetQuery] = targetUrl.split("?");
  const currentPathWithSearch = pathname + search;

  if (currentPathWithSearch === targetUrl) return true;

  // Path alias mapping
  const isPathMatch = (tPath: string, cPath: string, tQuery?: string) => {
    if (tPath === cPath) return true;
    const logbookAliases = ["/log-aktivitas/mahasiswa", "/logbook-kkn", "/dpl/logbook", "/logbook"];
    if (logbookAliases.includes(tPath) && logbookAliases.includes(cPath)) return true;
    const dplLogAliases = [
      "/log-aktivitas/dosen-pembimbing-lapangan",
      "/log-aktivitas-dpl",
      "/dpl/log-aktivitas",
      "/catat-kegiatan-dpl",
      "/dpl/catat-kegiatan",
    ];
    if (dplLogAliases.includes(tPath) && dplLogAliases.includes(cPath)) return true;
    if (tQuery?.includes("tab=dpl") && dplLogAliases.includes(cPath) && logbookAliases.includes(tPath)) return true;
    const userMasterAliases = ["/pengguna", "/master-pengguna", "/master-data-pengguna", "/manajemen-pengguna"];
    if (userMasterAliases.includes(tPath) && userMasterAliases.includes(cPath)) return true;
    const fasilitasAliases = ["/monitoring-pengelolaan/fasilitas", "/pengelolaan-sampah", "/pemanfaatan-sampah", "/fasilitas-dan-posko"];
    if (fasilitasAliases.includes(tPath) && fasilitasAliases.includes(cPath)) return true;

    const tempatSampahAliases = ["/monitoring-pengelolaan/tempat-sampah", "/master-data/manajemen-tempat-sampah"];
    if (tempatSampahAliases.includes(tPath) && tempatSampahAliases.includes(cPath)) return true;

    const penyetoranAliases = ["/monitoring-pemilahan/penyetoran-sampah", "/penyetoran-sampah", "/setor-sampah", "/setor"];
    if (penyetoranAliases.includes(tPath) && penyetoranAliases.includes(cPath)) return true;

    const pengangkutanAliases = ["/monitoring-pemilahan/pengangkutan-sampah", "/pengangkutan-residu", "/residu", "/manajemen-pengangkutan"];
    if (pengangkutanAliases.includes(tPath) && pengangkutanAliases.includes(cPath)) return true;

    const peringkatAliases = ["/monitoring-pemilahan/peringkat-warga", "/peringkat", "/leaderboard", "/poin-warga"];
    if (peringkatAliases.includes(tPath) && peringkatAliases.includes(cPath)) return true;

    const rekapSetoranAliases = [
      "/monitoring-pemilahan/rekapitulasi-setoran",
      "/pemantauan-rekapitulasi",
      "/rekapitulasi-setoran",
      "/rekap-setoran",
      "/monitoring-pemilahan",
      "/monitoring-aktivitas",
    ];
    if (rekapSetoranAliases.includes(tPath) && rekapSetoranAliases.includes(cPath)) return true;

    const pemanfaatanAliases = ["/monitoring-pemanfaatan", "/hasil-pemanfaatan"];
    if (pemanfaatanAliases.includes(tPath) && pemanfaatanAliases.includes(cPath)) return true;

    const historiSistemAliases = ["/master-data/histori-sistem", "/log-aktivitas", "/superUser/audit", "/audit-trail", "/audit-log"];
    if (historiSistemAliases.includes(tPath) && historiSistemAliases.includes(cPath)) return true;

    const onlineUsersAliases = ["/master-data/pengguna-online", "/pengguna-online", "/master-data/pengguna-daring", "/pengguna-daring"];
    if (onlineUsersAliases.includes(tPath) && onlineUsersAliases.includes(cPath)) return true;

    const provAliases = ["/wilayah/provinsi", "/master-data/provinsi", "/master-provinsi"];
    if (provAliases.includes(tPath) && provAliases.includes(cPath)) return true;

    const kabAliases = ["/wilayah/kota-kabupaten", "/master-data/kota-kabupaten", "/master-kota-kabupaten", "/master-kabupaten"];
    if (kabAliases.includes(tPath) && kabAliases.includes(cPath)) return true;

    const kecAliases = ["/wilayah/kecamatan", "/master-data/kecamatan", "/master-kecamatan", "/master-data/kecematan"];
    if (kecAliases.includes(tPath) && kecAliases.includes(cPath)) return true;

    const kelAliases = ["/wilayah/kelurahan", "/master-data/kelurahan", "/master-kelurahan"];
    if (kelAliases.includes(tPath) && kelAliases.includes(cPath)) return true;

    const rwAliases = ["/wilayah/rw", "/master-data/rukun-warga", "/master-rw", "/wilayah/rukun-warga"];
    if (rwAliases.includes(tPath) && rwAliases.includes(cPath)) return true;

    const poskoAliases = ["/pelaksanaan/posko", "/posko-kkn", "/posko", "/fasilitas-posko"];
    if (poskoAliases.includes(tPath) && poskoAliases.includes(cPath)) return true;

    const linimasaAliases = ["/pelaksanaan/linimasa-kegiatan", "/jadwal-kegiatan"];
    if (linimasaAliases.includes(tPath) && linimasaAliases.includes(cPath)) return true;

    const kelompokAliases = ["/pelaksanaan/kelompok", "/manajemen-ekosistem-kkn", "/ekosistem-dampingan"];
    if (kelompokAliases.includes(tPath) && kelompokAliases.includes(cPath)) return true;

    const prokerAliases = ["/pelaksanaan/program-kerja", "/program-kerja-kkn", "/program-kerja"];
    if (prokerAliases.includes(tPath) && prokerAliases.includes(cPath)) return true;

    const presensiAliases = ["/monitoring-kegiatan/presensi", "/monitoring-absen"];
    if (presensiAliases.includes(tPath) && presensiAliases.includes(cPath)) return true;

    const izinAliases = ["/monitoring-kegiatan/pengajuan-izin", "/ajuan-absensi", "/validasi-absensi"];
    if (izinAliases.includes(tPath) && izinAliases.includes(cPath)) return true;

    const nilaiMhsAliases = ["/penilaian/mahasiswa", "/penilaian-kkn/individu"];
    if (nilaiMhsAliases.includes(tPath) && nilaiMhsAliases.includes(cPath)) return true;

    const nilaiProkerAliases = ["/penilaian/program-kerja", "/penilaian-kkn/program-kerja"];
    if (nilaiProkerAliases.includes(tPath) && nilaiProkerAliases.includes(cPath)) return true;

    const nilaiLaporanAliases = ["/penilaian/laporan-akhir", "/penilaian-kkn/laporan-akhir"];
    if (nilaiLaporanAliases.includes(tPath) && nilaiLaporanAliases.includes(cPath)) return true;

    const nilaiRekapAliases = ["/penilaian/rekapitulasi-nilai-akhir", "/penilaian-kkn/rekap"];
    if (nilaiRekapAliases.includes(tPath) && nilaiRekapAliases.includes(cPath)) return true;

    const baselineAliases = ["/hasil-survei/baseline", "/survei/baseline", "/superUser/data-survei-baseline", "/data-survei-baseline"];
    if (baselineAliases.includes(tPath) && baselineAliases.includes(cPath)) return true;

    const endlineAliases = ["/hasil-survei/endline", "/survei/endline", "/superUser/data-survei-endline", "/data-survei-endline"];
    if (endlineAliases.includes(tPath) && endlineAliases.includes(cPath)) return true;

    const evaluasiAliases = ["/hasil-survei/evaluasi-dan-dampak", "/evaluasi-dampak-kkn", "/evaluasi-dampak"];
    if (evaluasiAliases.includes(tPath) && evaluasiAliases.includes(cPath)) return true;

    const importSurveiAliases = ["/hasil-survei/data-survei", "/superUser/import-survei-kkn", "/import-survei-kkn"];
    if (importSurveiAliases.includes(tPath) && importSurveiAliases.includes(cPath)) return true;

    return false;
  };

  // Jika path dasar tidak cocok, tidak mungkin aktif
  if (!isPathMatch(targetPath, pathname, targetQuery)) {
    return false;
  }

  // Jika target memiliki query parameter (contoh: ?tab=mahasiswa, ?role=dpl)
  if (targetQuery) {
    const targetParams = new URLSearchParams(targetQuery);
    const currentParams = new URLSearchParams(search);

    // Tab parameter handling
    if (targetParams.has("tab")) {
      const targetTab = (targetParams.get("tab") || "").toLowerCase();
      let currentTab = (currentParams.get("tab") || "").toLowerCase();
      if (!currentTab) {
        if (["/log-aktivitas-dpl", "/dpl/log-aktivitas", "/catat-kegiatan-dpl", "/dpl/catat-kegiatan"].includes(pathname)) {
          currentTab = "dpl";
        } else {
          currentTab = "mahasiswa";
        }
      }
      return targetTab === currentTab;
    }

    // Role parameter handling
    if (targetParams.has("role")) {
      const targetRole = (targetParams.get("role") || "").toLowerCase();
      const currentRole = (currentParams.get("role") || "").toLowerCase();
      if (!search && index !== undefined) {
        return index === 0;
      }
      if (targetRole === currentRole) return true;
      if (targetRole === "su" && ["su", "admin", "superuser", "super_user"].includes(currentRole)) return true;
      if (targetRole === "petugas-pemilah" || targetRole === "petugas-residu") {
        return ["petugas-pemilah", "petugas-residu", "petugas_residu", "petugas"].includes(currentRole);
      }
      if (targetRole === "mahasiswa" && ["mahasiswa", "mahasiswa-kkn", "mahasiswa_kkn"].includes(currentRole)) return true;
      if (targetRole === "taskforce" && ["taskforce", "task-force", "panitia_taskforce"].includes(currentRole)) return true;
      return false;
    }

    return search === "?" + targetQuery;
  }

  // Target tidak memiliki query parameter
  if (!search) return true;
  const currentParams = new URLSearchParams(search);
  if (currentParams.has("tab") || currentParams.has("role")) {
    return false;
  }
  return true;
};

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, badge }) => {
  const location = useLocation();

  const isCurrentActive = useMemo(() => {
    return checkRouteActive(to, location.pathname, location.search);
  }, [to, location.pathname, location.search]);

  return (
    <Link
      to={to}
      className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-300 ease-out text-[12.5px] group overflow-hidden transform-gpu z-10 ${
        isCurrentActive
          ? "bg-[#f2f8f4]/90 dark:bg-emerald-950/80 text-[#035941] dark:text-emerald-300 font-bold shadow-xs border border-[#c8e6b2]/90 dark:border-emerald-700/50 scale-[1.01] backdrop-blur-[2px]"
          : "text-slate-600 dark:text-slate-300 hover:text-[#035941] dark:hover:text-emerald-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 hover:translate-x-1 font-medium active:scale-[0.98]"
      }`}
    >
      {/* Left Curved Accent Indicator Bar */}
      {isCurrentActive && (
        <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#58A621] dark:bg-emerald-500 rounded-r-full shadow-xs" />
      )}

      <Icon className={`shrink-0 transition-all duration-300 ease-out ${isCurrentActive ? "text-[#035941] dark:text-emerald-400 scale-110" : "text-slate-400 dark:text-slate-400 group-hover:text-[#035941] dark:group-hover:text-emerald-400 group-hover:scale-110"}`} size={17} />
      <span className="flex-1 truncate tracking-tight">{label}</span>
      {badge !== undefined && (
        <span className="bg-[#58A621] dark:bg-emerald-600 text-white text-[9.5px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs group-hover:scale-105 transition-transform">{badge}</span>
      )}
    </Link>
  );
};

const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};

const NavItemCollapsed: React.FC<NavItemProps> = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const [isHovered, setIsHovered] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const containerRef = React.useRef<HTMLAnchorElement>(null);

  const isCurrentActive = useMemo(() => {
    return checkRouteActive(to, location.pathname, location.search);
  }, [to, location.pathname, location.search]);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({ top: rect.top + (rect.height - 30) / 2, left: rect.right + 12 });
    }
    setIsHovered(true);
  };

  return (
    <Link
      ref={containerRef}
      to={to}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-10 h-10 rounded-xl flex items-center justify-center my-0.5 transition-all duration-200 group cursor-pointer shrink-0 ${
        isCurrentActive
          ? "bg-[#035941] dark:bg-emerald-600 text-white shadow-md shadow-emerald-900/20 scale-105"
          : "text-slate-500 dark:text-slate-400 hover:text-[#035941] dark:hover:text-emerald-400 hover:bg-[#f2f8f4] dark:hover:bg-slate-800"
      }`}
    >
      <Icon size={17} className="transition-transform duration-200 group-hover:scale-110" />
      {isHovered && (
        <Portal>
          <div
            style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
            className="fixed bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap z-[999999] border border-slate-700/60 pointer-events-none animate-in fade-in slide-in-from-left-2 duration-150"
          >
            {label}
          </div>
        </Portal>
      )}
    </Link>
  );
};

const CollapsedClockButton: React.FC<{ dateStr: string; timeStr: string }> = ({ dateStr, timeStr }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({ top: rect.top + (rect.height - 30) / 2, left: rect.right + 12 });
    }
    setIsHovered(true);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 flex items-center justify-center relative group cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all shrink-0"
    >
      <Clock size={17} className="text-[#035941] dark:text-emerald-400" />
      {isHovered && (
        <Portal>
          <div
            style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
            className="fixed bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap z-[999999] border border-slate-700/60 pointer-events-none animate-in fade-in slide-in-from-left-2 duration-150"
          >
            {dateStr ? `${dateStr} • ${timeStr}` : timeStr || "Jam Sistem"}
          </div>
        </Portal>
      )}
    </div>
  );
};

const CollapsedLogoutButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const containerRef = React.useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({ top: rect.top + (rect.height - 30) / 2, left: rect.right + 12 });
    }
    setIsHovered(true);
  };

  return (
    <button
      ref={containerRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      className="w-10 h-10 rounded-2xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-all relative group cursor-pointer shrink-0"
    >
      <LogOut size={18} />
      {isHovered && (
        <Portal>
          <div
            style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
            className="fixed bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap z-[999999] border border-slate-700/60 pointer-events-none animate-in fade-in slide-in-from-left-2 duration-150"
          >
            Keluar
          </div>
        </Portal>
      )}
    </button>
  );
};

const NavGroupCollapsed: React.FC<{
  icon: LucideIcon;
  label: string;
  items: Array<{ to: string; label: string }>;
}> = ({ icon: Icon, label, items }) => {
  const location = useLocation();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isClickedOpen, setIsClickedOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const isSubActive = (subTo: string, index: number) => {
    return checkRouteActive(subTo, location.pathname, location.search, index);
  };

  const isAnySubActive = useMemo(() => {
    return items.some((item, idx) => isSubActive(item.to, idx));
  }, [items, location.pathname, location.search]);

  const updateCoordinates = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({ top: rect.top, left: rect.right + 12 });
    }
  };

  const handleMouseEnter = () => {
    updateCoordinates();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateCoordinates();
    setIsClickedOpen((prev) => !prev);
  };

  const handleSubItemClick = () => {
    setIsHovered(false);
    setIsClickedOpen(false);
  };

  // Close dropdown if clicked outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isClickedOpen &&
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsClickedOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isClickedOpen]);

  const isVisible = isHovered || isClickedOpen;

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center justify-center my-0.5 shrink-0"
    >
      <button
        type="button"
        onClick={handleIconClick}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isAnySubActive || isVisible
            ? "bg-[#035941] dark:bg-emerald-600 text-white shadow-md shadow-emerald-900/20 scale-105"
            : "text-slate-500 dark:text-slate-400 hover:text-[#035941] dark:hover:text-emerald-400 hover:bg-[#f2f8f4] dark:hover:bg-slate-800"
        }`}
      >
        <Icon size={17} className="transition-transform duration-200" />
      </button>

      {isVisible && (
        <Portal>
          <div
            ref={dropdownRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
            className="fixed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 px-1.5 min-w-[210px] z-[999999] flex flex-col animate-in fade-in slide-in-from-left-2 duration-150 text-left pointer-events-auto"
          >
            <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
              {label}
            </div>
            {items.map((sub, idx) => {
              const isActive = isSubActive(sub.to, idx);
              return (
                <Link
                  key={sub.to}
                  to={sub.to}
                  onClick={handleSubItemClick}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition-all ${
                    isActive
                      ? "bg-[#f2f8f4] dark:bg-emerald-950/70 text-[#035941] dark:text-emerald-400 font-bold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-[#035941] dark:hover:text-emerald-400"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isActive
                        ? "bg-[#58A621] dark:bg-emerald-400"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  />
                  <span className="truncate">{sub.label}</span>
                </Link>
              );
            })}
          </div>
        </Portal>
      )}
    </div>
  );
};

const NavGroup: React.FC<{
  icon: LucideIcon;
  label: string;
  items: Array<{ to: string; label: string }>;
}> = ({ icon: Icon, label, items }) => {
  const location = useLocation();

  const isSubActive = (subTo: string, index: number) => {
    return checkRouteActive(subTo, location.pathname, location.search, index);
  };

  const isAnySubActive = useMemo(() => {
    return items.some((item, idx) => isSubActive(item.to, idx));
  }, [items, location.pathname, location.search]);

  const [isOpen, setIsOpen] = React.useState(isAnySubActive);

  React.useEffect(() => {
    if (isAnySubActive) {
      setIsOpen(true);
    }
  }, [isAnySubActive]);

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-[12.5px] text-left group relative overflow-hidden ${
          isAnySubActive
            ? "bg-[#f2f8f4] dark:bg-emerald-950/70 text-[#035941] dark:text-emerald-400 font-semibold border border-[#c8e6b2]/80 dark:border-emerald-700/40"
            : "text-slate-600 dark:text-slate-400 hover:text-[#035941] dark:hover:text-emerald-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 font-medium"
        }`}
      >
        {isAnySubActive && (
          <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#58A621] dark:bg-emerald-500 rounded-r-full" />
        )}

        <Icon className={`shrink-0 transition-all duration-200 ${isAnySubActive ? "text-[#035941] dark:text-emerald-400 scale-110" : "text-slate-400 dark:text-slate-500 group-hover:text-[#035941] dark:group-hover:text-emerald-400 group-hover:scale-110"}`} size={17} />
        <span className={`flex-1 truncate tracking-tight ${isAnySubActive ? "font-semibold text-[#035941] dark:text-emerald-400" : "font-medium text-slate-600 dark:text-slate-300 group-hover:text-[#035941] dark:group-hover:text-emerald-400"}`}>{label}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-300 ${isOpen ? "rotate-180 text-[#035941] dark:text-emerald-400" : "text-slate-400"}`}
        />
      </button>
      {isOpen && (
        <div className="ml-4 pl-3 border-l-2 border-slate-200/80 dark:border-slate-800 my-1 space-y-0.5 transition-all">
          {items.map((sub, idx) => {
            const isActive = isSubActive(sub.to, idx);
            return (
              <NavLink
                key={sub.to}
                to={sub.to}
                title={sub.label}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] transition-all duration-200 group ${
                  isActive
                    ? "bg-[#f2f8f4] dark:bg-emerald-950/70 text-[#035941] dark:text-emerald-400 font-bold border border-[#c8e6b2]/60 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-[#035941] dark:hover:text-emerald-400 hover:translate-x-1 font-medium active:scale-[0.98]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                    isActive
                      ? "bg-[#58A621] dark:bg-emerald-400 scale-125 ring-3 ring-[#58A621]/30 dark:ring-emerald-800"
                      : "bg-slate-300 dark:bg-slate-600 group-hover:bg-[#58A621] dark:group-hover:bg-emerald-400"
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
  <div className="px-3.5 pt-4 pb-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
    {label}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed = false }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const userRole = (((user?.peran || (user as any)?.role || "WARGA") as string).toUpperCase()) as UserRole;
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
        }).replace(/:/g, ".")
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
    showToast.success("Berhasil keluar dari sistem");
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

  const hasAccess = (allowed?: UserRole[]) =>
    !allowed ||
    userRole === "DEVELOPER" ||
    userRole === "SUPER_USER" ||
    userRole === "PEMIMPIN" ||
    allowed.includes(userRole);

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
      return items.filter((c) => !c.allowed || hasAccess(c.allowed));
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
      ],
    },
    {
      header: "KULIAH KERJA NYATA",
      items: [
        {
          type: "group",
          label: "Pelaksanaan",
          icon: Briefcase,
          allowed: [
            "DEVELOPER",
            "SUPER_USER",
            "ADMIN_DLH",
            "DPL",
            "DOSEN_PEMBIMBING",
            "PANITIA_TASKFORCE",
            "PEMIMPIN",
            "MAHASISWA_KKN",
            "CAMAT",
            "LURAH",
            "RW",
            "WARGA",
          ] as UserRole[],
          children: [
            {
              to: "/pelaksanaan/linimasa-kegiatan",
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
              to: "/pelaksanaan/kelompok",
              label: "Kelompok",
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
              to: "/pelaksanaan/posko",
              label: "Posko",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "ADMIN_DLH",
                "DPL",
                "DOSEN_PEMBIMBING",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
                "MAHASISWA_KKN",
                "CAMAT",
                "LURAH",
                "RW",
                "WARGA",
              ] as UserRole[],
            },
            {
              to: "/pelaksanaan/program-kerja",
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
          ],
        },
        {
          type: "group",
          label: "Monitoring Kegiatan",
          icon: Clock,
          allowed: [
            "DEVELOPER",
            "SUPER_USER",
            "ADMIN_DLH",
            "DPL",
            "DOSEN_PEMBIMBING",
            "PANITIA_TASKFORCE",
            "PEMIMPIN",
            "MAHASISWA_KKN",
            "CAMAT",
            "LURAH",
            "RW",
            "WARGA",
          ] as UserRole[],
          children: [
            {
              to: "/monitoring-kegiatan/presensi",
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
              to: "/monitoring-kegiatan/pengajuan-izin",
              label: "Pengajuan Izin",
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
          label: "Penilaian",
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
              to: "/penilaian/mahasiswa",
              label: "Mahasiswa",
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
              to: "/penilaian/program-kerja",
              label: "Program Kerja",
              allowed: [
                "DEVELOPER",
                "DPL",
                "DOSEN_PEMBIMBING",
                "SUPER_USER",
                "PANITIA_TASKFORCE",
              ] as UserRole[],
            },
            {
              to: "/penilaian/laporan-akhir",
              label: "Laporan Akhir",
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
              to: "/penilaian/rekapitulasi-nilai-akhir",
              label: "Rekapitulasi Nilai Akhir",
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
          label: "Log Aktivitas",
          icon: ClipboardList,
          allowed: ALL_ROLES,
          children: [
            {
              to: "/log-aktivitas/mahasiswa",
              label: "Mahasiswa",
              allowed: ALL_ROLES,
            },
            {
              to: "/log-aktivitas/dosen-pembimbing-lapangan",
              label: "Dosen Pembimbing Lapangan",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "ADMIN_DLH",
                "DPL",
                "DOSEN_PEMBIMBING",
                "PANITIA_TASKFORCE",
                "PEMIMPIN",
                "LURAH",
                "CAMAT",
                "RW",
              ] as UserRole[],
            },
          ],
        },
        {
          type: "group",
          label: "Hasil Survei",
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
              to: "/hasil-survei/baseline",
              label: "Baseline",
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
              to: "/hasil-survei/endline",
              label: "Endline",
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
              to: "/hasil-survei/evaluasi-dan-dampak",
              label: "Evaluasi dan Dampak",
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
              to: "/hasil-survei/data-survei",
              label: "Data Survei",
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
          to: "/monitoring-wilayah",
          icon: MapPin,
          label: "Monitoring Wilayah",
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
        {
          type: "group",
          label: "Monitoring Pengelolaan",
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
            "PEMIMPIN",
            "PANITIA_TASKFORCE",
            "MAHASISWA_KKN",
          ] as UserRole[],
          children: [
            {
              to: "/monitoring-pengelolaan/tempat-sampah",
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
              to: "/monitoring-pengelolaan/fasilitas",
              label: "Fasilitas",
              allowed: [
                "DEVELOPER",
                "SUPER_USER",
                "ADMIN_DLH",
                "CAMAT",
                "LURAH",
                "RW",
                "PETUGAS_RESIDU",
                "WARGA",
                "PEMIMPIN",
                "PANITIA_TASKFORCE",
                "MAHASISWA_KKN",
              ] as UserRole[],
            },
          ],
        },
        {
          type: "group",
          label: "Monitoring Pemilahan",
          icon: Truck,
          allowed: [
            "DEVELOPER",
            "SUPER_USER",
            "ADMIN_DLH",
            "CAMAT",
            "LURAH",
            "RW",
            "PETUGAS_RESIDU",
            "WARGA",
            "MAHASISWA_KKN",
            "PANITIA_TASKFORCE",
            "PEMIMPIN",
          ] as UserRole[],
          children: [
            {
              to: "/monitoring-pemilahan/penyetoran-sampah",
              label: "Penyetoran Sampah",
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
              to: "/monitoring-pemilahan/rekapitulasi-setoran",
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
              to: "/monitoring-pemilahan/pengangkutan-sampah",
              label: "Pengangkutan Sampah",
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
              to: "/monitoring-pemilahan/peringkat-warga",
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
          to: "/monitoring-pemanfaatan",
          icon: Recycle,
          label: "Monitoring Pemanfaatan",
          allowed: [
            "DEVELOPER",
            "SUPER_USER",
            "ADMIN_DLH",
            "CAMAT",
            "LURAH",
            "RW",
            "PETUGAS_RESIDU",
            "WARGA",
            "PEMIMPIN",
            "PANITIA_TASKFORCE",
            "MAHASISWA_KKN",
          ] as UserRole[],
        },
      ],
    },
    {
      header: "MASTER DATA",
      items: [
        {
          type: "group",
          label: "Pengguna",
          icon: Users,
          allowed: ["DEVELOPER", "SUPER_USER", "PANITIA_TASKFORCE", "PEMIMPIN", "RW"] as UserRole[],
          children: [
            { to: "/pengguna?role=developer", label: "Developer", allowed: ["DEVELOPER"] as UserRole[] },
            { to: "/pengguna?role=su", label: "Admin", allowed: ["DEVELOPER", "SUPER_USER"] as UserRole[] },
            { to: "/pengguna?role=pimpinan", label: "Pimpinan", allowed: ["DEVELOPER", "SUPER_USER", "PEMIMPIN"] as UserRole[] },
            { to: "/pengguna?role=dpl", label: "Dosen Pembimbing Lapangan", allowed: ["DEVELOPER", "SUPER_USER", "PANITIA_TASKFORCE", "PEMIMPIN"] as UserRole[] },
            { to: "/pengguna?role=mahasiswa", label: "Mahasiswa", allowed: ["DEVELOPER", "SUPER_USER", "PANITIA_TASKFORCE", "PEMIMPIN"] as UserRole[] },
            { to: "/pengguna?role=warga", label: "Warga", allowed: ["DEVELOPER", "SUPER_USER", "RW"] as UserRole[] },
            { to: "/pengguna?role=petugas-pemilah", label: "Petugas Pemilah", allowed: ["DEVELOPER", "SUPER_USER", "RW"] as UserRole[] },
            // { to: "/pengguna?role=dlh", label: "Dinas Lingkungan Hidup", allowed: ["DEVELOPER", "SUPER_USER"] as UserRole[] },
            // { to: "/pengguna?role=camat", label: "Camat", allowed: ["DEVELOPER", "SUPER_USER"] as UserRole[] },
            // { to: "/pengguna?role=lurah", label: "Lurah", allowed: ["DEVELOPER", "SUPER_USER"] as UserRole[] },
            // { to: "/pengguna?role=rw", label: "Rukun Warga", allowed: ["DEVELOPER", "SUPER_USER"] as UserRole[] },
          ],
        },
        {
          type: "group",
          label: "Wilayah",
          icon: MapPin,
          allowed: ["DEVELOPER", "SUPER_USER", "ADMIN_DLH"] as UserRole[],
          children: [
            { to: "/wilayah/provinsi", label: "Provinsi" },
            { to: "/wilayah/kota-kabupaten", label: "Kota / Kabupaten" },
            { to: "/wilayah/kecamatan", label: "Kecamatan" },
            { to: "/wilayah/kelurahan", label: "Kelurahan" },
            { to: "/wilayah/rw", label: "Rukun Warga" },
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
        {
          to: "/peraturan",
          icon: Bot,
          label: "Peraturan",
          allowed: ["DEVELOPER", "SUPER_USER", "ADMIN_DLH"] as UserRole[],
        },
        {
          to: "/histori-sistem",
          icon: FileText,
          label: "Histori Sistem",
          allowed: ["DEVELOPER", "SUPER_USER"] as UserRole[],
        },
        {
          to: "/pengguna-daring",
          icon: UserIcon,
          label: "Pengguna Daring",
          allowed: ["DEVELOPER", "SUPER_USER"] as UserRole[],
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
        } h-screen fixed left-0 top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800 flex flex-col z-50 transition-all duration-300 ease-in-out transform lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } overflow-hidden shadow-lg`}
      >
        {/* Render Collapsed Mini Sidebar */}
        {isCollapsed ? (
          <div className="relative z-10 flex flex-col h-full items-center justify-between py-3">
            {/* Top Brand Logo */}
            <div className="flex flex-col items-center w-full border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div
                title="BERSEKA"
                className="w-12 h-12 rounded-2xl bg-[#f2f8f4] dark:bg-emerald-950/60 border border-[#035941]/20 dark:border-emerald-700/30 flex items-center justify-center p-1.5 shadow-sm hover:scale-105 transition-all cursor-pointer"
              >
                <img
                  src="/app-logo.png"
                  alt="BERSEKA Logo"
                  className="w-full h-full object-contain"
                />
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
                        <NavGroupCollapsed
                          key={item.label}
                          icon={item.icon}
                          label={item.label}
                          items={getFilteredGroupChildren(item.label, item.children)}
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
            <div className="flex flex-col items-center pt-2 border-t border-slate-100 dark:border-slate-800 w-full px-2 shrink-0 gap-2">
              <CollapsedClockButton dateStr={dateStr} timeStr={timeStr} />
              <CollapsedLogoutButton onClick={handleLogout} />
            </div>
          </div>
        ) : (
          /* Render Full Sidebar */
          <div className="relative z-10 flex flex-col h-full justify-between overflow-hidden">
            {/* Top Brand Logo Header Section */}
            <div className="pt-4 pb-4 px-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center relative overflow-hidden bg-white dark:bg-slate-900 shrink-0">
              {/* ponytail: FallingLeavesBackground di-hide sesuai permintaan */}
              {/* <FallingLeavesBackground /> */}
              <Link to="/dasbor" className="flex items-center justify-center gap-3 group cursor-pointer relative z-10 px-2 w-full text-center">
                <img
                  src="/app-logo.png"
                  alt="BERSEKA Logo"
                  className="h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105 shrink-0"
                />
                <div className="flex flex-col justify-center text-left min-w-0">
                  {/* ponytail: static header layout; abstract to brand config if dynamic multi-tenant text is required */}
                  <h1 className="text-[20px] font-black tracking-wide text-[#035941] dark:text-emerald-400 uppercase leading-none mb-1 truncate transition-opacity group-hover:opacity-90">
                    BERSEKA
                  </h1>
                  <p className="text-[10px] font-bold text-[#58A621] dark:text-emerald-500 tracking-tight leading-tight truncate">
                    Bersih, Sehat, Kampung Asri
                  </p>
                </div>
              </Link>
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

            {/* Bottom Footer Section: Real-time System Clock Card & Clean Logout Button */}
            <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-3.5">
              {/* Real-time System Clock Card */}
              <div className="w-full bg-[#f2f8f4]/90 dark:bg-slate-800/90 hover:bg-[#ebf7ee] dark:hover:bg-slate-700/90 p-2.5 rounded-2xl border border-[#c8e6b2]/80 dark:border-slate-700/80 shadow-xs text-center space-y-0.5 transition-all duration-300 relative z-10 hover:scale-[1.02] backdrop-blur-xs">
                <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 mb-0.5">
                  <Clock size={13} className="text-[#035941] dark:text-emerald-400" />
                  <p className="text-[10.5px] font-black text-slate-600 dark:text-slate-300 truncate">
                    {dateStr || "Kamis, 20 Agustus 2026"}
                  </p>
                </div>
                <p className="text-sm font-black text-[#035941] dark:text-emerald-400">
                  {timeStr || "09.55.12"}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-start gap-3 px-3.5 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-all duration-200 cursor-pointer group font-semibold text-xs border border-transparent hover:border-rose-200 dark:hover:border-rose-800/60 active:scale-[0.98]"
              >
                <LogOut size={16} className="text-rose-500 dark:text-rose-400 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-rose-600 dark:text-rose-400 font-bold text-xs">Keluar</span>
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
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Konfirmasi Keluar</h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                Apakah Anda yakin ingin keluar dari sistem BERSEKA?
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
