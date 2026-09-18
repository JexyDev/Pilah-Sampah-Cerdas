/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * Halaman Dashboard Mitra Pembimbing Lapangan (MPL)
 * 4 Tab: Dashboard | Pelaksanaan (Program Kerja) | Monitoring | Penilaian
 *
 * Role: MPL, MITRA_PEMBIMBING_LAPANGAN, MITRA_PENDAMPING_LAPANGAN, MITRA
 * TIDAK ADA Log Aktivitas.
 * TIDAK ADA tombol approve presensi/sakit.
 * Penilaian: 8 aspek, guard PENILAIAN_DPL_BELUM_SELESAI.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Eye,
  Star,
  Users,
  MapPin,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  BookOpen,
  Award,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import api from "../../services/api";
import showToast from "../../utils/showToast";
import { isTestKelompok, isTestStudent, isTestProker } from "../../utils/filterTestingUtils";

// ── Tipe Data ─────────────────────────────────────────────────────────────────
interface MplDashboardData {
  kelurahan: string;
  totalKelompok: number;
  totalAnggota: number;
  kelurahanList?: string[];
}

interface MplKelompok {
  id: string;
  name: string;
  kelurahan: string;
  rw?: string;
  studentCount: number;
  dpl?: { name: string };
  ketua?: { name: string };
}

interface MplProker {
  id: string;
  namaProker: string;
  kelompokName: string;
  kelompokId: string;
  kelurahan?: string;
  statusPelaksanaan: string;
  target?: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
}

interface MplMonitoring {
  kelompokId: string;
  kelompokName: string;
  kelurahan: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  totalSesi: number;
}

interface MplMahasiswa {
  id: string;
  name: string;
  nim: string;
  kelompokId: string;
  kelompokName: string;
  jurusan?: string;
  penilaian?: {
    sudahDinilai: boolean;
    skorKehadiran?: number;
    skorWargaBinaan?: number;
    skorProker?: number;
    skorKomunikasi?: number;
    skorTanggungJawab?: number;
    skorBuktiKegiatan?: number;
    skorDampak?: number;
    skorInisiatif?: number;
  };
  dplSudahMenilai?: boolean;
}

// ── Daftar Kelurahan ──────────────────────────────────────────────────────────
const KELURAHAN_OPTIONS = [
  "Semua Kelurahan",
  "Cipaganti",
  "Dago",
  "Lebak Gede",
  "Lebak Siliwangi",
  "Sadang Serang",
  "Sekeloa",
];

const ITEMS_PER_PAGE = 15;

// ── Helper Format Tanggal ─────────────────────────────────────────────────────
const fmtDate = (iso?: string): string => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
};

// ── Status Proker Badge ───────────────────────────────────────────────────────
const getProkerBadge = (status: string) => {
  const s = status?.toUpperCase() ?? "";
  if (s === "SELESAI" || s.includes("SELESAI")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s === "SEDANG_BERJALAN" || s.includes("BERJALAN")) return "bg-blue-100 text-blue-700 border-blue-200";
  if (s === "DISETUJUI" || s.includes("SETUJU")) return "bg-teal-100 text-teal-700 border-teal-200";
  if (s === "DITOLAK" || s.includes("TOLAK")) return "bg-rose-100 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

const getProkerLabel = (status: string) => {
  const s = status?.toUpperCase() ?? "";
  if (s === "SELESAI") return "Selesai";
  if (s === "SEDANG_BERJALAN") return "Sedang Berjalan";
  if (s === "DIUSULKAN") return "Diusulkan";
  if (s === "DISETUJUI") return "Disetujui";
  if (s === "DITOLAK") return "Ditolak";
  return status || "-";
};

// ── Aspek Penilaian MPL ───────────────────────────────────────────────────────
const ASPEK_PENILAIAN = [
  { key: "skorKehadiran", label: "Kehadiran" },
  { key: "skorWargaBinaan", label: "Warga Binaan" },
  { key: "skorProker", label: "Program Kerja" },
  { key: "skorKomunikasi", label: "Komunikasi" },
  { key: "skorTanggungJawab", label: "Tanggung Jawab" },
  { key: "skorBuktiKegiatan", label: "Bukti Kegiatan" },
  { key: "skorDampak", label: "Dampak" },
  { key: "skorInisiatif", label: "Inisiatif" },
];

type AspekKey =
  | "skorKehadiran" | "skorWargaBinaan" | "skorProker" | "skorKomunikasi"
  | "skorTanggungJawab" | "skorBuktiKegiatan" | "skorDampak" | "skorInisiatif";

// ── Komponen Utama MplDashboardPage ──────────────────────────────────────────
const MplDashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  // Role check MPL
  const userRole = String(user?.peran || (user as any)?.role || "").toUpperCase();
  const isMpl = ["MPL", "MITRA_PEMBIMBING_LAPANGAN", "MITRA_PENDAMPING_LAPANGAN", "MITRA"].some(r => userRole.includes(r));

  // ── Tab aktif ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"dashboard" | "pelaksanaan" | "monitoring" | "penilaian">("dashboard");

  // ── Tab Dashboard ─────────────────────────────────────────────────────────────
  const [dashData, setDashData] = useState<MplDashboardData | null>(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState("");

  // Kelurahan MPL Binaan yang terkunci
  const mplKelurahan = useMemo(() => {
    if (dashData?.kelurahan && dashData.kelurahan !== "Tidak Diketahui") return dashData.kelurahan;
    if ((user as any)?.kelurahan) return (user as any).kelurahan;
    if (user?.address) return user.address.replace(/^Kel\.\s*/i, "").trim();
    return "";
  }, [dashData?.kelurahan, user]);

  const fetchDashboard = useCallback(async () => {
    setDashLoading(true);
    setDashError("");
    try {
      const res = await api.get("/mpl/dashboard");
      if (res.data?.success || res.data?.data) {
        const raw = res.data.data ?? res.data;
        const cleanKelompokList = (raw.kelompokList || []).filter((k: any) => !isTestKelompok(k));
        setDashData({
          ...raw,
          totalKelompok: cleanKelompokList.length,
          totalAnggota: cleanKelompokList.reduce((acc: number, k: any) => acc + (k.jumlahAnggota || 0), 0),
          kelompokList: cleanKelompokList,
        });
      } else {
        setDashData(null);
      }
    } catch {
      setDashError("Gagal memuat data dashboard MPL.");
    } finally {
      setDashLoading(false);
    }
  }, []);

  // ── Tab Pelaksanaan (Proker) ──────────────────────────────────────────────────
  const [pelKelurahan, setPelKelurahan] = useState("Semua Kelurahan");
  const [pelRw, setPelRw] = useState("");
  const [pelKelompokId, setPelKelompokId] = useState("");
  const [kelompokList, setKelompokList] = useState<MplKelompok[]>([]);
  const [prokerList, setProkerList] = useState<MplProker[]>([]);
  const [prokerLoading, setProkerLoading] = useState(false);
  const [prokerPage, setProkerPage] = useState(1);

  const fetchKelompok = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (pelKelurahan !== "Semua Kelurahan") params.kelurahan = pelKelurahan;
      if (pelRw.trim()) params.rw = pelRw.trim();
      const res = await api.get("/mpl/groups", { params });
      if (res.data?.success || Array.isArray(res.data?.data)) {
        const list = res.data.data ?? [];
        setKelompokList(list.filter((k: any) => !isTestKelompok(k)));
      }
    } catch {
      setKelompokList([]);
    }
  }, [pelKelurahan, pelRw]);

  const fetchProker = useCallback(async () => {
    setProkerLoading(true);
    try {
      const params: Record<string, string> = {};
      if (pelKelompokId) params.kelompokId = pelKelompokId;
      if (pelKelurahan !== "Semua Kelurahan") params.kelurahan = pelKelurahan;
      if (pelRw.trim()) params.rw = pelRw.trim();
      const res = await api.get("/mpl/program-kerja", { params });
      if (res.data?.success || Array.isArray(res.data?.data)) {
        const list = res.data.data ?? [];
        setProkerList(
          list.filter(
            (p: any) =>
              !isTestProker(p) &&
              !isTestKelompok({ name: p.kelompokName || p.kelompok?.name })
          )
        );
      } else {
        setProkerList([]);
      }
    } catch {
      setProkerList([]);
    } finally {
      setProkerLoading(false);
      setProkerPage(1);
    }
  }, [pelKelompokId, pelKelurahan, pelRw]);

  // ── Tab Monitoring ────────────────────────────────────────────────────────────
  const [monKelurahan, setMonKelurahan] = useState("Semua Kelurahan");
  const [monData, setMonData] = useState<MplMonitoring[]>([]);
  const [monLoading, setMonLoading] = useState(false);
  const [monSearch, setMonSearch] = useState("");
  const [monPage, setMonPage] = useState(1);

  const fetchMonitoring = useCallback(async () => {
    setMonLoading(true);
    try {
      const params: Record<string, string> = {};
      if (monKelurahan !== "Semua Kelurahan") params.kelurahan = monKelurahan;
      const res = await api.get("/mpl/monitoring", { params });
      if (res.data?.success || Array.isArray(res.data?.data)) {
        const list = res.data.data ?? [];
        setMonData(list.filter((m: any) => !isTestKelompok({ name: m.kelompokName })));
      } else {
        setMonData([]);
      }
    } catch {
      setMonData([]);
    } finally {
      setMonLoading(false);
      setMonPage(1);
    }
  }, [monKelurahan]);

  // ── Tab Penilaian ─────────────────────────────────────────────────────────────
  const [nilaiKelompokId, setNilaiKelompokId] = useState("");
  const [mahasiswaList, setMahasiswaList] = useState<MplMahasiswa[]>([]);
  const [nilaiLoading, setNilaiLoading] = useState(false);
  const [nilaiSearch, setNilaiSearch] = useState("");
  const [activeMhsId, setActiveMhsId] = useState<string | null>(null);
  const [formNilai, setFormNilai] = useState<Record<AspekKey, number>>({
    skorKehadiran: 3,
    skorWargaBinaan: 3,
    skorProker: 3,
    skorKomunikasi: 3,
    skorTanggungJawab: 3,
    skorBuktiKegiatan: 3,
    skorDampak: 3,
    skorInisiatif: 3,
  });
  const [saving, setSaving] = useState(false);

  const fetchMahasiswaPenilaian = useCallback(async () => {
    if (!nilaiKelompokId) { setMahasiswaList([]); return; }
    setNilaiLoading(true);
    try {
      const res = await api.get(`/mpl/penilaian`, { params: { kelompokId: nilaiKelompokId } });
      if (res.data?.success || Array.isArray(res.data?.data)) {
        const list = res.data.data ?? [];
        setMahasiswaList(
          list.filter(
            (m: any) =>
              !isTestStudent(m) &&
              !isTestKelompok({ name: m.kelompokName })
          )
        );
      } else {
        setMahasiswaList([]);
      }
    } catch {
      setMahasiswaList([]);
    } finally {
      setNilaiLoading(false);
    }
  }, [nilaiKelompokId]);

  // ── Load data sesuai tab aktif & scoping MPL ─────────────────────────────────
  // Selalu muat ringkasan dashboard agar wilayah MPL diketahui
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Kunci kelurahan otomatis bila user adalah MPL
  useEffect(() => {
    if (isMpl && mplKelurahan) {
      setPelKelurahan(mplKelurahan);
      setMonKelurahan(mplKelurahan);
    }
  }, [isMpl, mplKelurahan]);

  useEffect(() => {
    if (activeTab === "pelaksanaan" || activeTab === "penilaian") {
      fetchKelompok();
    }
  }, [activeTab, fetchKelompok]);

  useEffect(() => {
    if (activeTab === "pelaksanaan") {
      fetchProker();
    }
  }, [activeTab, fetchProker]);

  useEffect(() => {
    if (activeTab === "monitoring") fetchMonitoring();
  }, [activeTab, fetchMonitoring]);

  useEffect(() => {
    if (activeTab === "penilaian") fetchMahasiswaPenilaian();
  }, [activeTab, fetchMahasiswaPenilaian]);

  // ── Simpan penilaian ─────────────────────────────────────────────────────────
  const handleSaveNilai = async (studentId: string) => {
    setSaving(true);
    try {
      await api.post("/mpl/penilaian/assess", {
        studentId,
        skorMitraKehadiran: formNilai.skorKehadiran,
        skorMitraWargaBinaan: formNilai.skorWargaBinaan,
        skorMitraProker: formNilai.skorProker,
        skorMitraKomunikasi: formNilai.skorKomunikasi,
        skorMitraTanggungJawab: formNilai.skorTanggungJawab,
        skorMitraBuktiKegiatan: formNilai.skorBuktiKegiatan,
        skorMitraDampak: formNilai.skorDampak,
        skorMitraInisiatif: formNilai.skorInisiatif,
        ...formNilai,
      });
      showToast.success("Penilaian berhasil disimpan!");
      setActiveMhsId(null);
      fetchMahasiswaPenilaian();
    } catch (err: any) {
      const code = err?.response?.data?.code ?? "";
      if (code === "PENILAIAN_DPL_BELUM_SELESAI") {
        showToast.error("DPL belum menyelesaikan penilaian. Tunggu DPL menilai terlebih dahulu.");
      } else if (err?.response?.status === 403) {
        showToast.error("Akses ditolak. Anda tidak memiliki izin menilai mahasiswa ini.");
      } else {
        showToast.error(err?.response?.data?.message ?? "Gagal menyimpan penilaian.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Buka form penilaian untuk mahasiswa ──────────────────────────────────────
  const openNilaiForm = (mhs: MplMahasiswa) => {
    if (!mhs.dplSudahMenilai) return; // Guard: DPL belum menilai
    setActiveMhsId(mhs.id);
    const p = mhs.penilaian;
    setFormNilai({
      skorKehadiran: p?.skorKehadiran ?? 3,
      skorWargaBinaan: p?.skorWargaBinaan ?? 3,
      skorProker: p?.skorProker ?? 3,
      skorKomunikasi: p?.skorKomunikasi ?? 3,
      skorTanggungJawab: p?.skorTanggungJawab ?? 3,
      skorBuktiKegiatan: p?.skorBuktiKegiatan ?? 3,
      skorDampak: p?.skorDampak ?? 3,
      skorInisiatif: p?.skorInisiatif ?? 3,
    });
  };

  // ── Filtered Proker ───────────────────────────────────────────────────────────
  const prokerPages = Math.max(1, Math.ceil(prokerList.length / ITEMS_PER_PAGE));
  const paginatedProker = prokerList.slice((prokerPage - 1) * ITEMS_PER_PAGE, prokerPage * ITEMS_PER_PAGE);

  // ── Filtered Monitoring ───────────────────────────────────────────────────────
  const filteredMon = useMemo(() => {
    if (!monSearch.trim()) return monData;
    const q = monSearch.toLowerCase();
    return monData.filter(m =>
      m.kelompokName?.toLowerCase().includes(q) ||
      m.kelurahan?.toLowerCase().includes(q)
    );
  }, [monData, monSearch]);
  const monPages = Math.max(1, Math.ceil(filteredMon.length / ITEMS_PER_PAGE));
  const paginatedMon = filteredMon.slice((monPage - 1) * ITEMS_PER_PAGE, monPage * ITEMS_PER_PAGE);

  // ── Filtered Mahasiswa Penilaian ──────────────────────────────────────────────
  const filteredMhs = useMemo(() => {
    if (!nilaiSearch.trim()) return mahasiswaList;
    const q = nilaiSearch.toLowerCase();
    return mahasiswaList.filter(m =>
      m.name?.toLowerCase().includes(q) ||
      m.nim?.toLowerCase().includes(q)
    );
  }, [mahasiswaList, nilaiSearch]);

  // ── Tabs Definition ───────────────────────────────────────────────────────────
  const TABS = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={15} /> },
    { key: "pelaksanaan", label: "Pelaksanaan", icon: <ClipboardList size={15} /> },
    { key: "monitoring", label: "Monitoring", icon: <Eye size={15} /> },
    { key: "penilaian", label: "Penilaian", icon: <Star size={15} /> },
  ] as const;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-12 font-sans">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center border border-purple-200/60 dark:border-purple-700/40">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Portal Mitra Pembimbing Lapangan
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pemantauan program kerja, kehadiran, dan penilaian mahasiswa KKN binaan Mitra.
            </p>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {user.name || user.email}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold border border-purple-200 dark:border-purple-800">
              MPL
            </span>
          </div>
        )}
      </div>

      {/* ── Tab Switcher ───────────────────────────────────────────────────── */}
      <div className="bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-1 w-fit shadow-xs overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-black"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <span className={activeTab === tab.key ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* =====================================================================
          TAB 1: DASHBOARD
      ===================================================================== */}
      {activeTab === "dashboard" && (
        <div className="space-y-5">
          {dashLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="w-10 h-10 border-3 border-purple-600/20 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : dashError ? (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-5 flex items-center gap-3">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <p className="text-sm text-rose-700 dark:text-rose-300">{dashError}</p>
            </div>
          ) : (
            <>
              {/* Kartu Ringkasan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Kelurahan MPL */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs border-t-4 border-t-purple-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 text-white rounded-xl flex items-center justify-center shadow-xs">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Wilayah MPL</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                        {dashData?.kelurahan || "-"}
                      </p>
                    </div>
                  </div>
                  {dashData?.kelurahanList && dashData.kelurahanList.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {dashData.kelurahanList.map(k => (
                        <span key={k} className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-[10px] font-bold border border-purple-200/60">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Kelompok */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs border-t-4 border-t-blue-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-xs">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Kelompok Binaan</p>
                      <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                        {dashData?.totalKelompok ?? 0}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">Kelompok KKN dalam cakupan wilayah MPL</p>
                </div>

                {/* Total Anggota */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs border-t-4 border-t-emerald-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-xs">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Mahasiswa Binaan</p>
                      <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                        {dashData?.totalAnggota ?? 0}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">Mahasiswa aktif terdaftar di semua kelompok binaan</p>
                </div>
              </div>

              {/* Info Role MPL */}
              {!isMpl && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Anda mengakses halaman MPL dengan role <strong>{userRole}</strong>. Beberapa fitur mungkin terbatas.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: PELAKSANAAN (PROGRAM KERJA) — READ-ONLY
      ===================================================================== */}
      {activeTab === "pelaksanaan" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Filter Kelurahan */}
              {isMpl && mplKelurahan ? (
                <div className="flex items-center justify-between gap-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin size={13} className="text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      Kel. {mplKelurahan}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 shrink-0">
                    <Lock size={10} /> Wilayah Binaan
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
                  <MapPin size={13} className="text-emerald-600 shrink-0" />
                  <select
                    value={pelKelurahan}
                    onChange={(e) => { setPelKelurahan(e.target.value); setPelKelompokId(""); }}
                    className="bg-transparent outline-none text-xs font-semibold text-slate-700 dark:text-slate-200 w-full cursor-pointer"
                    aria-label="Filter Kelurahan Proker"
                  >
                    {KELURAHAN_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              )}

              {/* Filter RW */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
                <MapPin size={13} className="text-blue-500 shrink-0" />
                <input
                  type="text"
                  placeholder="RW (opsional)"
                  value={pelRw}
                  onChange={(e) => setPelRw(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { fetchKelompok(); fetchProker(); } }}
                  className="bg-transparent outline-none text-xs font-semibold text-slate-700 dark:text-slate-200 w-full placeholder:text-slate-400"
                />
              </div>

              {/* Filter Kelompok */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
                <Users size={13} className="text-purple-600 shrink-0" />
                <select
                  value={pelKelompokId}
                  onChange={(e) => setPelKelompokId(e.target.value)}
                  className="bg-transparent outline-none text-xs font-semibold text-slate-700 dark:text-slate-200 w-full cursor-pointer"
                  aria-label="Filter Kelompok Proker"
                >
                  <option value="">Semua Kelompok</option>
                  {kelompokList.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={fetchProker}
                disabled={prokerLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={13} className={prokerLoading ? "animate-spin" : ""} />
                <span>Muat Data</span>
              </button>
            </div>
          </div>

          {/* Tabel Program Kerja (Read-Only) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <ClipboardList size={16} className="text-purple-600" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Program Kerja KKN</h3>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">Read-Only</span>
            </div>
            {prokerLoading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-purple-600/20 border-t-purple-600 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                        <th className="p-3 text-left text-slate-400 font-bold uppercase tracking-wide w-8">No</th>
                        <th className="p-3 text-left text-slate-400 font-bold uppercase tracking-wide">Nama Program Kerja</th>
                        <th className="p-3 text-left text-slate-400 font-bold uppercase tracking-wide">Kelompok</th>
                        <th className="p-3 text-left text-slate-400 font-bold uppercase tracking-wide">Target</th>
                        <th className="p-3 text-left text-slate-400 font-bold uppercase tracking-wide">Mulai</th>
                        <th className="p-3 text-left text-slate-400 font-bold uppercase tracking-wide">Selesai</th>
                        <th className="p-3 text-left text-slate-400 font-bold uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginatedProker.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                            Tidak ada data program kerja untuk filter yang dipilih.
                          </td>
                        </tr>
                      ) : (
                        paginatedProker.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="p-3 text-slate-500">{(prokerPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                            <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                              {p.namaProker || (p as any).judul || (p as any).deskripsi || "-"}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">
                              {p.kelompokName || (p as any).kelompok?.name || "-"}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">
                              {p.target || (p as any).waktuPelaksanaan || (p as any).kategori || "-"}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">
                              {fmtDate(p.tanggalMulai || (p as any).createdAt)}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">
                              {fmtDate(p.tanggalSelesai || (p as any).updatedAt)}
                            </td>
                            <td className="p-3">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getProkerBadge(p.statusPelaksanaan)}`}>
                                {getProkerLabel(p.statusPelaksanaan)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {prokerPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-xs text-slate-500">{prokerList.length} program kerja</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" disabled={prokerPage === 1} onClick={() => setProkerPage(p => Math.max(1, p - 1))} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer" aria-label="Sebelumnya">
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">{prokerPage} / {prokerPages}</span>
                      <button type="button" disabled={prokerPage === prokerPages} onClick={() => setProkerPage(p => Math.min(prokerPages, p + 1))} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer" aria-label="Berikutnya">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: MONITORING — READ-ONLY (hadir/izin/sakit/alpa per kelompok)
      ===================================================================== */}
      {activeTab === "monitoring" && (
        <div className="space-y-4">
          {/* Filter & Tombol */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Filter Kelurahan */}
            {isMpl && mplKelurahan ? (
              <div className="flex items-center justify-between gap-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin size={13} className="text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    Kel. {mplKelurahan}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 shrink-0">
                  <Lock size={10} /> Wilayah Binaan
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl flex-1">
                <MapPin size={13} className="text-emerald-600 shrink-0" />
                <select
                  value={monKelurahan}
                  onChange={(e) => setMonKelurahan(e.target.value)}
                  className="bg-transparent outline-none text-xs font-semibold text-slate-700 dark:text-slate-200 w-full cursor-pointer"
                  aria-label="Filter Kelurahan Monitoring"
                >
                  {KELURAHAN_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            )}
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kelompok..."
                value={monSearch}
                onChange={(e) => { setMonSearch(e.target.value); setMonPage(1); }}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-purple-500 transition"
              />
            </div>
            <button
              type="button"
              onClick={fetchMonitoring}
              disabled={monLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer shrink-0"
            >
              <RefreshCw size={13} className={monLoading ? "animate-spin" : ""} />
              <span>Perbarui</span>
            </button>
          </div>

          {/* Tabel Monitoring Read-Only */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Eye size={16} className="text-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Ringkasan Presensi per Kelompok</h3>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">Read-Only</span>
            </div>
            {monLoading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-purple-600/20 border-t-purple-600 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                        <th className="p-3 text-left text-slate-400 font-bold uppercase tracking-wide w-8">No</th>
                        <th className="p-3 text-left text-slate-400 font-bold uppercase tracking-wide">Kelompok</th>
                        <th className="p-3 text-left text-slate-400 font-bold uppercase tracking-wide">Kelurahan</th>
                        <th className="p-3 text-center text-emerald-600 font-bold uppercase tracking-wide">Hadir</th>
                        <th className="p-3 text-center text-blue-600 font-bold uppercase tracking-wide">Izin</th>
                        <th className="p-3 text-center text-amber-600 font-bold uppercase tracking-wide">Sakit</th>
                        <th className="p-3 text-center text-rose-600 font-bold uppercase tracking-wide">Alpa</th>
                        <th className="p-3 text-center text-slate-400 font-bold uppercase tracking-wide">Total Sesi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginatedMon.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                            Tidak ada data monitoring untuk filter yang dipilih.
                          </td>
                        </tr>
                      ) : (
                        paginatedMon.map((m, idx) => (
                          <tr key={m.kelompokId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="p-3 text-slate-500">{(monPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                            <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{m.kelompokName}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{m.kelurahan}</td>
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                <CheckCircle2 size={10} />{m.hadir}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                                <Clock size={10} />{m.izin}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">{m.sakit}</span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">{m.alpa}</span>
                            </td>
                            <td className="p-3 text-center text-slate-600 dark:text-slate-400 font-bold">{m.totalSesi}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {monPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-xs text-slate-500">{filteredMon.length} kelompok</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" disabled={monPage === 1} onClick={() => setMonPage(p => Math.max(1, p - 1))} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer" aria-label="Sebelumnya"><ChevronLeft size={14} /></button>
                      <span className="text-xs font-bold px-2 text-slate-700 dark:text-slate-300">{monPage} / {monPages}</span>
                      <button type="button" disabled={monPage === monPages} onClick={() => setMonPage(p => Math.min(monPages, p + 1))} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer" aria-label="Berikutnya"><ChevronRight size={14} /></button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: PENILAIAN (8 ASPEK MITRA)
      ===================================================================== */}
      {activeTab === "penilaian" && (
        <div className="space-y-4">
          {/* Filter Kelompok */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl flex-1">
              <Users size={13} className="text-purple-600 shrink-0" />
              <select
                value={nilaiKelompokId}
                onChange={(e) => { setNilaiKelompokId(e.target.value); setActiveMhsId(null); }}
                className="bg-transparent outline-none text-xs font-semibold text-slate-700 dark:text-slate-200 w-full cursor-pointer"
                aria-label="Pilih Kelompok untuk Penilaian"
              >
                <option value="">-- Pilih Kelompok --</option>
                {kelompokList.map(k => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
            </div>
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari mahasiswa / NIM..."
                value={nilaiSearch}
                onChange={(e) => setNilaiSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          {/* Info panduan */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-3">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Catatan Penilaian MPL:</p>
              <p className="mt-0.5">Penilaian 8 aspek Mitra hanya dapat dilakukan setelah DPL menyelesaikan penilaiannya terlebih dahulu. Mahasiswa dengan badge <strong>"Menunggu DPL"</strong> belum dapat dinilai.</p>
            </div>
          </div>

          {/* Daftar Mahasiswa */}
          {!nilaiKelompokId ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-xs">
              Pilih kelompok untuk melihat daftar mahasiswa yang dapat dinilai.
            </div>
          ) : nilaiLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="w-10 h-10 border-3 border-purple-600/20 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMhs.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-xs">
                  Tidak ada mahasiswa untuk kelompok ini.
                </div>
              ) : (
                filteredMhs.map((mhs) => (
                  <div
                    key={mhs.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden"
                  >
                    {/* Baris Mahasiswa */}
                    <div className="flex items-center justify-between p-4 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center font-black text-sm shrink-0">
                          {((mhs.name || (mhs as any).nama) || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{mhs.name || (mhs as any).nama}</p>
                          <p className="text-xs text-slate-500">{mhs.nim} {mhs.jurusan ? `• ${mhs.jurusan}` : ""}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status DPL */}
                        {!(mhs.dplSudahMenilai ?? (mhs as any).sudahDinilaiDpl) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock size={10} />Menunggu DPL
                          </span>
                        ) : mhs.penilaian?.sudahDinilai ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={10} />Sudah Dinilai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <Award size={10} />Belum Dinilai
                          </span>
                        )}

                        {/* Tombol Nilai */}
                        {(mhs.dplSudahMenilai ?? (mhs as any).sudahDinilaiDpl) && (
                          <button
                            type="button"
                            onClick={() => activeMhsId === (mhs.id || (mhs as any).studentId) ? setActiveMhsId(null) : openNilaiForm(mhs)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
                          >
                            {activeMhsId === (mhs.id || (mhs as any).studentId) ? "Tutup" : mhs.penilaian?.sudahDinilai ? "Edit Nilai" : "Nilai"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Form Penilaian (collapsed) */}
                    {activeMhsId === mhs.id && mhs.dplSudahMenilai && (
                      <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-800/40 space-y-4">
                        <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Penilaian 8 Aspek Mitra — {mhs.name}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {ASPEK_PENILAIAN.map((aspek) => (
                            <div key={aspek.key} className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                  {aspek.label}
                                </label>
                                <span className="text-sm font-black text-purple-700 dark:text-purple-400">
                                  {formNilai[aspek.key as AspekKey]} / 4
                                </span>
                              </div>
                              <input
                                type="range"
                                min={1}
                                max={4}
                                step={1}
                                value={formNilai[aspek.key as AspekKey]}
                                onChange={(e) => setFormNilai(prev => ({
                                  ...prev,
                                  [aspek.key]: parseInt(e.target.value),
                                }))}
                                className="w-full accent-purple-600 cursor-pointer"
                                aria-label={`Nilai ${aspek.label}`}
                              />
                              <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                                <span>1 (Kurang)</span>
                                <span>2 (Cukup)</span>
                                <span>3 (Baik)</span>
                                <span>4 (Sangat Baik)</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Rata-rata */}
                        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-3 flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Nilai Rata-Rata</span>
                          <span className="text-xl font-black text-purple-800 dark:text-purple-300">
                            {(Object.values(formNilai).reduce((a, b) => a + b, 0) / 8).toFixed(2)} / 4
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveMhsId(null)}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNilai(mhs.id)}
                            disabled={saving}
                            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
                          >
                            {saving ? "Menyimpan..." : "Simpan Penilaian"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MplDashboardPage;
