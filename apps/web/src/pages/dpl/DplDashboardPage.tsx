/**
 * Project: BERSEKA
 * Component: DplDashboardPage (Portal Dosen Pembimbing Lapangan)
 * Single Navigation via Sidebar - Clean, Simple, & Intuitive UX
 */

import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import {
  CalendarCheck,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  MapPin,
  FileCheck,
  Search,
  Eye,
  ChevronRight,
  ChevronLeft,
  Users,
  GraduationCap,
  X,
  ClipboardCheck,
  FileText,
  Award,
  Clock,
  ArrowLeft,
  Crown,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  dplService,
  type GroupSummary,
  type StudentDetail,
  type DplAlerts,
  type ApprovalHistoryLog,
  type ProgramKerjaItem,
} from "../../services/dplService";

export const DplDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = String(user?.peran || (user as any)?.role || "").toUpperCase();

  const location = useLocation();
  const navigate = useNavigate();
  const isAjuanAbsensiPage =
    location.pathname === "/ajuan-absensi" ||
    location.pathname === "/monitoring-kegiatan/pengajuan-izin" ||
    location.pathname === "/validasi-absensi";

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [alerts, setAlerts] = useState<DplAlerts | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryLog[]>([]);
  const [prokers, setProkers] = useState<ProgramKerjaItem[]>([]);

  // Filter & Pagination States
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState<string>("ALL");

  const [approvalPage, setApprovalPage] = useState(1);
  const ITEMS_PER_PAGE = 8;


  // Detail Kelompok Modal State (Mendukung hingga 44+ mahasiswa dengan pencarian & paginasi)
  const [selectedGroupForDetail, setSelectedGroupForDetail] = useState<GroupSummary | null>(null);
  const [groupStudentSearchQuery, setGroupStudentSearchQuery] = useState("");
  const [groupStudentPage, setGroupStudentPage] = useState(1);
  const MODAL_STUDENTS_PER_PAGE = 8;

  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [previewEvidence, setPreviewEvidence] = useState<{ url: string; title: string } | null>(null);
  const [decidingLeaveId, setDecidingLeaveId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [groupsData, studentsData, alertsData, historyData, prokersData] = await Promise.all([
        dplService.getGroupSummary(),
        dplService.getStudents(),
        dplService.getAlerts(),
        dplService.getApprovalHistory(),
        dplService.getProgramKerja(),
      ]);

      setGroups(groupsData || []);
      setStudents(studentsData || []);
      setAlerts(alertsData || null);
      setApprovalHistory(historyData || []);
      setProkers(prokersData || []);
    } catch (err: any) {
      console.error("Failed loading DPL dashboard data:", err);
      toast.error("Gagal memuat data Dashboard DPL");
    } finally {
      setLoading(false);
    }
  };

  const effectiveProkers = useMemo(() => {
    if (prokers && prokers.length > 0) return prokers;
    return groups.flatMap((g: any) => g.programKerja || []);
  }, [prokers, groups]);

  const handleDecideLeave = async (
    requestId: string,
    status: "APPROVED" | "REJECTED" | "ESCALATED",
    note?: string
  ) => {
    setDecidingLeaveId(requestId);
    try {
      await dplService.decideLeaveRequest(requestId, status, note);
      if (status === "APPROVED") {
        toast.success("Pengajuan izin berhasil disetujui");
      } else if (status === "ESCALATED") {
        toast.success("Pengajuan izin berhasil dieskalasi ke Panitia Taskforce");
      } else {
        toast.success("Pengajuan izin berhasil ditolak");
      }
      setRejectingRequestId(null);
      setRejectionReasonInput("");
      const [updatedAlerts, updatedHistory] = await Promise.all([
        dplService.getAlerts(),
        dplService.getApprovalHistory(),
      ]);
      setAlerts(updatedAlerts);
      setApprovalHistory(updatedHistory);
    } catch {
      toast.error("Gagal memproses pengajuan izin");
    } finally {
      setDecidingLeaveId(null);
    }
  };

  const handleDecideCancelLeave = async (
    requestId: string,
    action: "APPROVE_HADIR" | "REJECT_CANCEL",
    note?: string
  ) => {
    setDecidingLeaveId(requestId);
    try {
      await dplService.decideCancelLeaveRequest(requestId, action, note);
      toast.success(
        action === "APPROVE_HADIR"
          ? "Permohonan pembatalan disetujui! Status presensi diubah menjadi Hadir."
          : "Permohonan pembatalan ditolak. Status izin tetap berlaku."
      );
      const [updatedAlerts, updatedHistory] = await Promise.all([
        dplService.getAlerts(),
        dplService.getApprovalHistory(),
      ]);
      setAlerts(updatedAlerts);
      setApprovalHistory(updatedHistory);
    } catch {
      toast.error("Gagal memproses permohonan pembatalan izin");
    } finally {
      setDecidingLeaveId(null);
    }
  };

  const gradeDistribution = useMemo(() => {
    let countA = 0;
    let countB = 0;
    let countC = 0;
    let countD = 0;
    let countUnassessed = 0;
    let totalHadir = 0;
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlpha = 0;

    students.forEach((s) => {
      totalHadir += s.attendedCount || 0;
      totalSakit += s.sickCount || 0;
      totalIzin += s.izinCount || 0;
      totalAlpha += s.alphaCount || 0;

      if (s.assessmentScore === null || s.assessmentScore === undefined || s.assessmentScore === 0) {
        countUnassessed++;
      } else if (s.assessmentScore >= 85) {
        countA++;
      } else if (s.assessmentScore >= 75) {
        countB++;
      } else if (s.assessmentScore >= 65) {
        countC++;
      } else {
        countD++;
      }
    });

    const totalStudents = students.length;
    const assessedCount = totalStudents - countUnassessed;
    const percentAssessed = totalStudents > 0 ? Math.round((assessedCount / totalStudents) * 100) : 0;

    return {
      countA,
      countB,
      countC,
      countD,
      countUnassessed,
      assessedCount,
      totalStudents,
      percentAssessed,
      totalHadir,
      totalSakit,
      totalIzin,
      totalAlpha,
    };
  }, [students]);

  // Normalizer Status Usulan & Pelaksanaan Program Kerja
  const normalizeStatusUsulan = (statusUsulan?: string, legacyStatus?: string): "BELUM_DISETUJUI" | "DISETUJUI" | "DITOLAK" => {
    let u = statusUsulan;
    const leg = String(legacyStatus || "").toUpperCase();
    if (!u) {
      if (leg === "DITERIMA" || leg === "DISETUJUI" || leg === "SEDANG_BERJALAN" || leg === "SELESAI") u = "DISETUJUI";
      else if (leg === "DITOLAK" || leg === "TIDAK_DISETUJUI") u = "DITOLAK";
      else u = "BELUM_DISETUJUI";
    }
    if (u === "DISETUJUI" || u === "DITERIMA") return "DISETUJUI";
    if (u === "DITOLAK" || u === "TIDAK_DISETUJUI") return "DITOLAK";
    return "BELUM_DISETUJUI";
  };

  const normalizeStatusPelaksanaan = (statusPelaksanaan?: string, legacyStatus?: string): "BELUM_MULAI" | "SEDANG_BERJALAN" | "SELESAI" => {
    let p = statusPelaksanaan;
    const leg = String(legacyStatus || "").toUpperCase();
    if (!p) {
      if (leg === "SELESAI") p = "SELESAI";
      else if (leg === "SEDANG_BERJALAN" || leg === "SEDANG_DILAKSANAKAN" || leg === "BERJALAN") p = "SEDANG_BERJALAN";
      else p = "BELUM_MULAI";
    }
    if (p === "SELESAI") return "SELESAI";
    if (p === "SEDANG_BERJALAN" || p === "SEDANG_DILAKSANAKAN" || p === "BERJALAN") return "SEDANG_BERJALAN";
    return "BELUM_MULAI";
  };

  // Filtered & Paginated Students for Modal Detail Kelompok (Mendukung 44+ Mahasiswa)
  const modalGroupStudents = useMemo(() => {
    if (!selectedGroupForDetail) return [];
    return students.filter((s) => s.kelompokName === selectedGroupForDetail.name);
  }, [selectedGroupForDetail, students]);

  const filteredModalGroupStudents = useMemo(() => {
    if (!groupStudentSearchQuery.trim()) return modalGroupStudents;
    const q = groupStudentSearchQuery.toLowerCase();
    return modalGroupStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nim.toLowerCase().includes(q) ||
        s.jurusan.toLowerCase().includes(q) ||
        (s.fakultas && s.fakultas.toLowerCase().includes(q))
    );
  }, [modalGroupStudents, groupStudentSearchQuery]);

  const totalModalStudentPages = Math.max(1, Math.ceil(filteredModalGroupStudents.length / MODAL_STUDENTS_PER_PAGE));
  const paginatedModalGroupStudents = useMemo(() => {
    const start = (groupStudentPage - 1) * MODAL_STUDENTS_PER_PAGE;
    return filteredModalGroupStudents.slice(start, start + MODAL_STUDENTS_PER_PAGE);
  }, [filteredModalGroupStudents, groupStudentPage]);


  // Filtered & Paginated Approvals History
  const filteredApprovalHistory = useMemo(() => {
    return approvalHistory.filter((log) => {
      return selectedApprovalStatus === "ALL" ? true : log.status === selectedApprovalStatus;
    });
  }, [approvalHistory, selectedApprovalStatus]);

  const paginatedApprovalHistory = useMemo(() => {
    const start = (approvalPage - 1) * ITEMS_PER_PAGE;
    return filteredApprovalHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredApprovalHistory, approvalPage]);

  const totalApprovalPages = Math.max(1, Math.ceil(filteredApprovalHistory.length / ITEMS_PER_PAGE));

  // Dynamic Kecamatan, Kelurahan & RW calculation from DPL groups (Real Database Relations)
  const dplKecamatanList = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((g) => {
      if (g.kecamatan && g.kecamatan.trim() !== "") {
        set.add(g.kecamatan.trim());
      }
    });
    if (set.size === 0) {
      if ((user as any)?.kecamatan && String((user as any).kecamatan).trim() !== "") {
        set.add(String((user as any).kecamatan).trim());
      } else if ((user as any)?.kabupaten && String((user as any).kabupaten).trim() !== "") {
        set.add(String((user as any).kabupaten).trim());
      } else if (user?.wilayah && user.wilayah.trim() !== "") {
        set.add(user.wilayah.trim());
      } else {
        set.add("Coblong");
      }
    }
    return Array.from(set);
  }, [groups, user]);

  const kecamatanBadgeLabel = useMemo(() => {
    if (dplKecamatanList.length === 0) return "Kec. Coblong";
    if (dplKecamatanList.length === 1) return `Kec. ${dplKecamatanList[0]}`;
    if (dplKecamatanList.length <= 2) return `Kec. ${dplKecamatanList.join(", ")}`;
    return `${dplKecamatanList.length} Kecamatan (${dplKecamatanList.slice(0, 2).map((k) => `Kec. ${k}`).join(", ")}...)`;
  }, [dplKecamatanList]);

  // Dynamic Kelurahan & RW calculation from DPL groups & student allocations
  const dplKelurahanList = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((g) => {
      if (g.kelurahan && g.kelurahan.trim() !== "") {
        set.add(g.kelurahan.trim());
      }
    });
    if (set.size === 0 && students.length > 0) {
      students.forEach((s) => {
        if ((s as any).kelurahan && String((s as any).kelurahan).trim() !== "") {
          set.add(String((s as any).kelurahan).trim());
        }
      });
    }
    if (set.size === 0) {
      if ((user as any)?.kelurahan && String((user as any).kelurahan).trim() !== "") {
        set.add(String((user as any).kelurahan).trim());
      } else if (user?.wilayah && user.wilayah.trim() !== "") {
        set.add(user.wilayah.trim());
      } else {
        set.add("Sadang Serang");
      }
    }
    return Array.from(set);
  }, [groups, students, user]);

  const dplRwList = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((g) => {
      if (!g.cakupanRw) return;
      if (Array.isArray(g.cakupanRw)) {
        g.cakupanRw.forEach((rw) => {
          const cleaned = String(rw).trim().replace(/^RW\s*/i, "");
          if (cleaned) set.add(/^\d+$/.test(cleaned) ? cleaned.padStart(2, "0") : cleaned);
        });
      } else if (typeof g.cakupanRw === "string") {
        g.cakupanRw.split(/[,&/]/).forEach((part) => {
          const cleaned = part.trim().replace(/^RW\s*/i, "");
          if (cleaned) set.add(/^\d+$/.test(cleaned) ? cleaned.padStart(2, "0") : cleaned);
        });
      } else if (typeof g.cakupanRw === "number") {
        set.add(String(g.cakupanRw).padStart(2, "0"));
      }
    });
    if (set.size === 0 && students.length > 0) {
      students.forEach((s) => {
        const rwName = (s as any).assignedRw?.name || (s as any).rwName || (s as any).rw;
        if (rwName) {
          const cleaned = String(rwName).trim().replace(/^RW\s*/i, "");
          if (cleaned) set.add(/^\d+$/.test(cleaned) ? cleaned.padStart(2, "0") : cleaned);
        }
      });
    }
    if (set.size === 0 && groups.length > 0 && groups[0]?.name) {
      const gName = groups[0].name.toLowerCase();
      const numMatch = gName.match(/\d+/);
      const n = numMatch ? parseInt(numMatch[0], 10) : 1;
      const kel = (groups[0].kelurahan || "").toLowerCase();
      if (kel.includes("sadang serang")) {
        const start = (n - 1) * 2 + 1;
        set.add(String(start).padStart(2, "0"));
        if (start + 1 <= 21) set.add(String(start + 1).padStart(2, "0"));
      } else {
        set.add(String((n - 1) * 2 + 1).padStart(2, "0"));
        set.add(String((n - 1) * 2 + 2).padStart(2, "0"));
      }
    }
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [groups, students]);

  const kelurahanBadgeLabel = useMemo(() => {
    if (dplKelurahanList.length === 0) return "Kelurahan Binaan";
    if (dplKelurahanList.length === 1) return `Kel. ${dplKelurahanList[0]}`;
    if (dplKelurahanList.length <= 2) return `Kel. ${dplKelurahanList.join(", ")}`;
    return `${dplKelurahanList.length} Kelurahan (${dplKelurahanList.slice(0, 2).map((k) => `Kel. ${k}`).join(", ")}...)`;
  }, [dplKelurahanList]);

  const rwBadgeLabel = useMemo(() => {
    if (dplRwList.length === 0) return "RW Binaan";
    if (dplRwList.length <= 5) return `RW ${dplRwList.join(", ")}`;
    return `${dplRwList.length} RW (${dplRwList.slice(0, 4).map((r) => `RW ${r}`).join(", ")}...)`;
  }, [dplRwList]);

  const totalAllStudents = Math.max(students.length, groups.reduce((acc, g) => acc + (g.studentCount || 0), 0));
  const avgOverallAttendance =
    groups.length > 0 && groups.some((g) => (g.avgAttendanceRate || 0) > 0)
      ? Math.round(groups.reduce((acc, g) => acc + (g.avgAttendanceRate || 0), 0) / groups.length)
      : 0;

  const renderActionModals = () => {
    return (
      <>
        {/* MODAL: PENOLAKAN IZIN DENGAN CATATAN */}
        {rejectingRequestId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-red-600 dark:text-rose-400 flex items-center gap-1.5">
                  <XCircle size={18} /> Alasan Penolakan Izin
                </h3>
                <button onClick={() => setRejectingRequestId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Tuliskan Alasan Penolakan untuk Mahasiswa:</label>
                <textarea
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Contoh: Bukti surat sakit tidak melampirkan keterangan dokter resmi..."
                  className="w-full p-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-red-500"
                />

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setRejectingRequestId(null)}
                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleDecideLeave(rejectingRequestId, "REJECTED", rejectionReasonInput)}
                    className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition cursor-pointer"
                  >
                    Konfirmasi Penolakan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: PREVIEW BUKTI DOKUMEN / SURAT SAKIT */}
        {previewEvidence && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-800 text-white">
                <div className="flex items-center gap-2.5">
                  <FileCheck size={18} className="text-emerald-400" />
                  <h3 className="font-bold text-white text-sm truncate">{previewEvidence.title}</h3>
                </div>
                <button
                  onClick={() => setPreviewEvidence(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 flex flex-col items-center justify-center space-y-4">
                <div className="max-h-[60vh] w-full overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2 flex items-center justify-center">
                  <img
                    src={previewEvidence.url}
                    alt={previewEvidence.title}
                    className="max-h-[55vh] w-auto max-w-full object-contain rounded-xl shadow-xs"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                      (e.currentTarget.parentElement as HTMLElement).innerHTML = `<div class="p-8 text-center text-xs text-slate-500 font-semibold">Gagal memuat pratinjau gambar bukti surat.<br><a href="${previewEvidence.url}" target="_blank" rel="noreferrer" class="text-emerald-600 underline font-bold mt-2 inline-block">Buka File di Tab Baru</a></div>`;
                    }}
                  />
                </div>
                <div className="flex justify-between items-center w-full gap-3">
                  <a
                    href={previewEvidence.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                  >
                    <Eye size={14} /> Buka Tab Baru
                  </a>
                  <button
                    onClick={() => setPreviewEvidence(null)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* MODAL 5: DETAIL KELOMPOK DAMPINGAN & DAFTAR MAHASISWA */}
        {selectedGroupForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
              {/* Header Modal */}
              <div className="flex justify-between items-start px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 text-white shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10.5px] font-extrabold uppercase tracking-wider">
                      Master Penempatan KKN
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs font-semibold text-slate-300">
                      Kel. {selectedGroupForDetail.kelurahan || "-"} {selectedGroupForDetail.kecamatan ? `• Kec. ${selectedGroupForDetail.kecamatan}` : ""}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Users size={20} className="text-emerald-400" />
                    <span>{selectedGroupForDetail.name}</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedGroupForDetail(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body with Scroll */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
                {/* Ringkasan Profil & Wilayah Kelompok */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold text-[10.5px] uppercase block">Total Mahasiswa</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {modalGroupStudents.length || selectedGroupForDetail.studentCount || 0}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Orang Terdaftar</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold text-[10.5px] uppercase block">Cakupan Wilayah RW</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                      RW {Array.isArray(selectedGroupForDetail.cakupanRw) ? selectedGroupForDetail.cakupanRw.join(", ") : selectedGroupForDetail.cakupanRw || "-"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold text-[10.5px] uppercase block">Ketua Kelompok</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate" title={selectedGroupForDetail.ketua?.name || "-"}>
                      {selectedGroupForDetail.ketua?.name || "-"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold text-[10.5px] uppercase block">Posko KKN</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate" title={selectedGroupForDetail.posko?.nama || selectedGroupForDetail.posko?.alamat || "-"}>
                      {selectedGroupForDetail.posko?.nama || "-"}
                    </span>
                    {selectedGroupForDetail.posko?.latitude && selectedGroupForDetail.posko?.longitude && (
                      <a href={`https://www.google.com/maps?q=${selectedGroupForDetail.posko.latitude},${selectedGroupForDetail.posko.longitude}`} target="_blank" rel="noreferrer" className="text-[10px] flex items-center gap-1 text-blue-500 hover:underline">
                        <MapPin size={10} /> Buka Peta
                      </a>
                    )}
                  </div>
                </div>

                {selectedGroupForDetail.facilities && selectedGroupForDetail.facilities.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <h4 className="text-[10.5px] font-bold text-slate-400 uppercase mb-2">Fasilitas Kelompok (Bata Terawang, Loseda, Dll)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedGroupForDetail.facilities.map((f, i) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                          <span className="block font-bold text-slate-700 dark:text-slate-300">{f.nama}</span>
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400">{f.jenis.replace(/_/g, " ")} • {f.statusApproval}</span>
                          {f.latitude && f.longitude && (
                            <a href={`https://www.google.com/maps?q=${f.latitude},${f.longitude}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-[10px] items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline">
                              <MapPin size={10} /> Lokasi Map
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filter & Pencarian Mahasiswa dalam Kelompok */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>Daftar Anggota Mahasiswa</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40">
                        Total {modalGroupStudents.length} Mahasiswa
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Gunakan fitur pencarian untuk menemukan mahasiswa berdasarkan nama, NIM, atau program studi.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={groupStudentSearchQuery}
                      onChange={(e) => {
                        setGroupStudentSearchQuery(e.target.value);
                        setGroupStudentPage(1);
                      }}
                      placeholder="Cari nama / NIM / prodi..."
                      className="w-full pl-8.5 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                    {groupStudentSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setGroupStudentSearchQuery("");
                          setGroupStudentPage(1);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabel Mahasiswa Kelompok */}
                {filteredModalGroupStudents.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs">
                    {groupStudentSearchQuery
                      ? `Tidak ada mahasiswa di kelompok ini yang cocok dengan kata kunci "${groupStudentSearchQuery}".`
                      : "Belum ada mahasiswa yang terdaftar dalam kelompok ini."}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10.5px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                          <th className="py-3 px-3 text-center w-10">No</th>
                          <th className="py-3 px-3">NIM</th>
                          <th className="py-3 px-3">Nama Mahasiswa</th>
                          <th className="py-3 px-3">Program Studi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                        {paginatedModalGroupStudents.map((st, idx) => (
                          <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                              {(groupStudentPage - 1) * MODAL_STUDENTS_PER_PAGE + idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {st.nim || "-"}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-slate-100">{st.name}</span>
                                {st.isKetua && (
                                  <span className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[9px] px-1.5 py-0.2 rounded font-extrabold border border-amber-200 dark:border-amber-700 flex items-center gap-0.5">
                                    <Crown size={9} />
                                    <span>Ketua</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              {st.jurusan || "-"} {st.fakultas ? `(${st.fakultas})` : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Modal Pagination Controls */}
                {totalModalStudentPages > 1 && (
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Menampilkan {(groupStudentPage - 1) * MODAL_STUDENTS_PER_PAGE + 1} - {Math.min(groupStudentPage * MODAL_STUDENTS_PER_PAGE, filteredModalGroupStudents.length)} dari {filteredModalGroupStudents.length} Mahasiswa
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={groupStudentPage === 1}
                        onClick={() => setGroupStudentPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
                      >
                        <ChevronLeft size={13} />
                        <span>Sebelumnya</span>
                      </button>
                      <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                        {groupStudentPage} / {totalModalStudentPages}
                      </span>
                      <button
                        type="button"
                        disabled={groupStudentPage === totalModalStudentPages}
                        onClick={() => setGroupStudentPage((p) => Math.min(totalModalStudentPages, p + 1))}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
                      >
                        <span>Selanjutnya</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 shrink-0">
                <Link
                  to="/manajemen-ekosistem-kkn"
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Buka di Modul Manajemen Ekosistem KKN</span>
                  <ChevronRight size={13} />
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedGroupForDetail(null)}
                  className="px-5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Memuat Data Portal DPL...</p>
      </div>
    );
  }

  // ==========================================
  // VIEW A: HALAMAN PERSILANGAN / AJUAN IZIN & SAKIT
  // ==========================================
  if (isAjuanAbsensiPage) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-200">
        {/* Header Ajuan Absensi */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <GraduationCap size={16} />
              <span>Portal DPL</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-slate-500 dark:text-slate-400 font-normal">{user?.wilayah || "Wilayah Dampingan"}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Verifikasi Ajuan Izin &amp; Sakit
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-2xl">
              Validasi bukti surat keterangan sakit/izin, putusan persetujuan, dan riwayat presensi mahasiswa KKN bimbingan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/monitoring-absen"
              className="bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-emerald-200 dark:border-emerald-700/40 shadow-xs"
              title="Buka Halaman Presensi Mahasiswa"
            >
              <ClipboardCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Lihat Presensi Mahasiswa</span>
            </Link>
            <Link
              to="/dasbor"
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700 shadow-xs"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Dasbor</span>
            </Link>
          </div>
        </div>

        {/* Permohonan Menunggu Verifikasi */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCheck size={18} className="text-amber-500" /> Permohonan Izin / Sakit Menunggu Verifikasi DPL
            </h3>
            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-700/40 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {alerts?.pendingRequests?.length || 0} Menunggu Verifikasi
            </span>
          </div>

          {alerts?.pendingRequests && alerts.pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {alerts.pendingRequests.map((req) => {
                const hoursElapsed = (Date.now() - new Date(req.createdAt).getTime()) / (1000 * 60 * 60);
                const isOver24Hours = hoursElapsed >= 24;
                const canTakeover = ["PANITIA_TASKFORCE", "SUPER_USER", "DEVELOPER", "ADMIN_DLH"].includes(userRole);
                const isCancelReq = req.status === "CANCEL_REQUESTED";
                const isBusy = decidingLeaveId === req.id;

                return (
                  <div
                    key={req.id}
                    className={`p-4 border rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${
                      isCancelReq
                        ? "border-cyan-300 dark:border-cyan-700/60 bg-cyan-50/40 dark:bg-cyan-950/30"
                        : isOver24Hours
                        ? "border-rose-300 dark:border-rose-700/60 bg-rose-50/40 dark:bg-rose-950/30 shadow-xs"
                        : "border-amber-200/80 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/30"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{req.studentName}</span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            req.type === "SAKIT"
                              ? "bg-red-100 dark:bg-rose-950 text-red-800 dark:text-rose-300 border border-red-200 dark:border-rose-700"
                              : "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
                          }`}
                        >
                          {req.type}
                        </span>
                        {isCancelReq && (
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700 flex items-center gap-1">
                            <CheckCircle size={11} /> Permohonan Batal Izin (Ingin Hadir)
                          </span>
                        )}
                        {!isCancelReq && isOver24Hours && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 flex items-center gap-1">
                            <Clock size={11} /> &gt;24 Jam (Siap Diambil Alih Panitia Taskforce)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Alasan:</span> {req.reason}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Diajukan:{" "}
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {new Date(req.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} ({Math.floor(hoursElapsed)} jam lalu)
                          </span>
                          {req.startDate && (
                            <span className="ml-2 font-medium text-slate-600 dark:text-slate-300">
                              (Periode: {new Date(req.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                              {req.endDate && req.endDate !== req.startDate ? ` - ${new Date(req.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` : ""})
                            </span>
                          )}
                        </p>
                        {req.evidenceUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewEvidence({ url: req.evidenceUrl!, title: `Surat Bukti ${req.type}: ${req.studentName}` })}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 px-2 py-0.5 rounded-md cursor-pointer transition"
                          >
                            <Eye size={12} /> Lihat Surat / Foto Bukti
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {isCancelReq ? (
                        <>
                          <button
                            disabled={isBusy}
                            onClick={() => handleDecideCancelLeave(req.id, "REJECT_CANCEL")}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1 border border-slate-300 dark:border-slate-700 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle size={14} /> Tolak Batal
                          </button>
                          <button
                            disabled={isBusy}
                            onClick={() => handleDecideCancelLeave(req.id, "APPROVE_HADIR")}
                            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle size={14} /> Setujui Batal &amp; Jadikan Hadir
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            disabled={isBusy}
                            onClick={() => setRejectingRequestId(req.id)}
                            className="px-3 py-1.5 bg-red-50 dark:bg-rose-950/60 text-red-700 dark:text-rose-400 font-bold text-xs rounded-lg hover:bg-red-100 dark:hover:bg-rose-900/60 transition flex items-center gap-1 border border-red-200 dark:border-rose-700/40 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle size={14} /> {isOver24Hours && canTakeover ? "Ambil Alih & Tolak" : "Tolak"}
                          </button>
                          <button
                            disabled={isBusy}
                            onClick={() => handleDecideLeave(req.id, "APPROVED")}
                            className={`px-3.5 py-1.5 font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50 ${
                              isOver24Hours && canTakeover
                                ? "bg-rose-600 hover:bg-rose-700 text-white"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                          >
                            <CheckCircle size={14} /> {isOver24Hours && canTakeover ? "Ambil Alih & Setujui" : "Setujui"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic p-4 text-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
              Tidak ada permohonan sakit/izin yang membutuhkan verifikasi saat ini.
            </p>
          )}
        </div>

        {/* Riwayat Validasi Log */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Riwayat Validasi Izin &amp; Sakit</h3>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedApprovalStatus}
                onChange={(e) => {
                  setSelectedApprovalStatus(e.target.value);
                  setApprovalPage(1);
                }}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="ALL">Semua Keputusan</option>
                <option value="APPROVED">Disetujui</option>
                <option value="REJECTED">Ditolak</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="px-4 py-3.5">Nama Mahasiswa</th>
                  <th className="px-4 py-3.5">Jenis Izin</th>
                  <th className="px-4 py-3.5">Tanggal / Periode</th>
                  <th className="px-4 py-3.5 min-w-[240px]">Alasan / Catatan</th>
                  <th className="px-4 py-3.5 text-center">Status Keputusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedApprovalHistory.map((log) => {
                  const st = (log.status || "").toUpperCase();
                  const isAppr = st === "APPROVED";
                  const isRej = st === "REJECTED";
                  const isEsc = st === "ESCALATED";
                  const isCanc = st === "CANCELLED";
                  const isOverr = st === "OVERRIDDEN_HADIR";

                  let badgeClass = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
                  let badgeLabel = log.status || "-";

                  if (isAppr) {
                    badgeClass = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/40";
                    badgeLabel = "Disetujui";
                  } else if (isRej) {
                    badgeClass = "bg-red-50 dark:bg-rose-950/60 text-red-700 dark:text-rose-400 border-red-200 dark:border-rose-700/40";
                    badgeLabel = "Ditolak";
                  } else if (isEsc) {
                    badgeClass = "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/40";
                    badgeLabel = "Dieskalasi ke Taskforce";
                  } else if (isCanc) {
                    badgeClass = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700";
                    badgeLabel = "Dibatalkan Mahasiswa";
                  } else if (isOverr) {
                    badgeClass = "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-700/40";
                    badgeLabel = "Batal Izin (Hadir)";
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:bg-slate-800/80 dark:hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">{log.studentName}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                            log.type === "SAKIT"
                              ? "bg-red-50 dark:bg-rose-950 text-red-700 dark:text-rose-300 border-red-200 dark:border-rose-700"
                              : "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
                          }`}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-semibold text-[11.5px]">
                        {log.startDate ? (
                          <span>
                            {new Date(log.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            {log.endDate && log.endDate.split("T")[0] !== log.startDate.split("T")[0]
                              ? ` - ${new Date(log.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                              : ""}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={log.reason}>
                        {log.reason}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${badgeClass}`}>
                          {isAppr || isOverr ? <CheckCircle size={12} /> : isRej ? <XCircle size={12} /> : null}
                          {badgeLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {paginatedApprovalHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                      Belum ada data riwayat persetujuan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalApprovalPages > 1 && (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-4 py-3 border-t border-slate-200/80 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Halaman {approvalPage} dari {totalApprovalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={approvalPage === 1}
                  onClick={() => setApprovalPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Sebelumnya
                </button>
                <button
                  disabled={approvalPage === totalApprovalPages}
                  onClick={() => setApprovalPage((p) => Math.min(totalApprovalPages, p + 1))}
                  className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals for Action & Proof Preview */}
        {renderActionModals()}
      </div>
    );
  }

  // ==========================================
  // VIEW B: DASBOR DPL TUNGGAL (RINGKASAN EKSEKUTIF)
  // ==========================================
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-200">
      {/* Clean Academic Portal Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <GraduationCap size={16} />
            <span>Portal DPL</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-normal">
              {dplKelurahanList.length > 0
                ? `${kecamatanBadgeLabel} • ${kelurahanBadgeLabel}`
                : user?.wilayah || "Wilayah Dampingan"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Dasbor KKN DPL
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-2xl">
            Ringkasan eksekutif ekosistem KKN binaan, capaian presensi lapangan, dan status penilaian akademik.
          </p>
        </div>

        {alerts && alerts.pendingApprovalsCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/monitoring-kegiatan/pengajuan-izin"
              className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700/40 text-amber-800 dark:text-amber-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer shadow-xs animate-pulse"
            >
              <AlertTriangle size={14} className="text-amber-600 shrink-0" />
              <span>{alerts.pendingApprovalsCount} Ajuan Izin/Sakit</span>
            </Link>
          </div>
        )}
      </div>

      {/* Card Terpadu: Hierarki Wilayah 3-Tingkat */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-700/40 shrink-0">
              <MapPin size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Hierarki Wilayah &amp; Ekosistem Dampingan KKN
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Struktur 3 tingkatan wilayah binaan KKN terintegrasi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40 rounded-lg font-extrabold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Tingkat 1: {kecamatanBadgeLabel}
            </span>
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700/40 rounded-lg font-extrabold">
              Tingkat 2: {kelurahanBadgeLabel}
            </span>
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/40 rounded-lg font-extrabold">
              Tingkat 3: {rwBadgeLabel}
            </span>
          </div>
        </div>

        {/* Grid 4 Metrik Kunci KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-slate-50/80 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700 flex flex-col justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Mahasiswa Dampingan</span>
            <div className="mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalAllStudents}</span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1.5">Orang</span>
            </div>
            <span className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">
              {groups.reduce((acc, g) => acc + ((g as any).activeTodayCount || 0), 0)} Aktif Hari Ini
            </span>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700 flex flex-col justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Jam Presensi KKN</span>
            <div className="mt-1">
              <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400">
                {groups.reduce((acc, g) => acc + ((g as any).actualHours || 0), 0).toFixed(2)}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1.5">Jam</span>
            </div>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              Total Presensi Lapangan
            </span>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700 flex flex-col justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Tempat Sampah Teraktivasi</span>
            <div className="mt-1">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {groups.reduce((acc, g) => acc + (g.activatedBinsCount || 0), 0)}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1.5">Unit</span>
            </div>
            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
              {groups.reduce((acc, g) => acc + (g.organikBinsCount || 0), 0)} Organik • {groups.reduce((acc, g) => acc + (g.anorganikBinsCount || 0), 0)} Anorganik
            </span>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700 flex flex-col justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Sampah Terpilah</span>
            <div className="mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {groups.reduce((acc, g) => acc + (g.totalWasteWeight || 0), 0).toFixed(2)}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1.5">Kg</span>
            </div>
            <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium mt-1">
              Total Terkumpul &amp; Terdata
            </span>
          </div>
        </div>
      </div>

      {/* 4 Quick Action Navigation Cards (Pintu Akses Operasional) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/manajemen-ekosistem-kkn"
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl hover:border-emerald-500 hover:shadow-md transition group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition">
              <Users size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Kelompok KKN</h4>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">Data kelompok &amp; profil anggota</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          to="/monitoring-absen"
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl hover:border-amber-500 hover:shadow-md transition group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Presensi Lapangan</h4>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">Logbook &amp; presensi harian</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          to="/program-kerja-kkn"
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl hover:border-blue-500 hover:shadow-md transition group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Program Kerja</h4>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">Usulan proker &amp; anggaran</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          to="/penilaian-kkn/mahasiswa"
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl hover:border-emerald-500 hover:shadow-md transition group flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
              <Award size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Penilaian KKN</h4>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400">Form asesmen DPL &amp; mitra</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition" />
        </Link>
      </div>

      {/* Metrik Agregat Presensi & Program Kerja */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Metrik Presensi Mahasiswa */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Presensi Lapangan
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                Tingkat Presensi Mahasiswa
              </h3>
            </div>
            <Link
              to="/monitoring-absen"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 group"
              title="Buka Halaman Presensi"
            >
              <span>Presensi</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          <Link
            to="/monitoring-absen"
            className="flex items-center justify-between gap-4 bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700/40 p-4 rounded-xl transition group cursor-pointer"
            title="Lihat Detail Presensi Lapangan"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 group-hover:bg-emerald-700 text-white flex items-center justify-center font-extrabold shadow-sm shrink-0 transition">
                <CalendarCheck size={24} />
              </div>
              <div>
                <span className="text-2xl font-black text-emerald-900 dark:text-emerald-300">
                  {groups.length > 0 ? avgOverallAttendance : 0}%
                </span>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">Rerata Presensi Kelompok</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition shrink-0" />
          </Link>

          <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-around gap-1 text-xs font-medium">
            <Link
              to="/monitoring-kegiatan/pengajuan-izin"
              className="text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-bold px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition cursor-pointer flex items-center gap-1"
              title="Buka Halaman Pengajuan Izin (Filter Sakit)"
            >
              <span>{gradeDistribution.totalSakit} Sakit</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <Link
              to="/monitoring-kegiatan/pengajuan-izin"
              className="text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:underline font-bold px-2 py-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/50 transition cursor-pointer flex items-center gap-1"
              title="Buka Halaman Pengajuan Izin (Filter Izin)"
            >
              <span>{gradeDistribution.totalIzin} Izin</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <Link
              to="/monitoring-absen"
              className="text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:underline font-bold px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer flex items-center gap-1"
              title="Buka Halaman Presensi (Tanpa Keterangan)"
            >
              <span>{gradeDistribution.totalAlpha} Tanpa Keterangan</span>
            </Link>
          </div>
        </div>

        {/* Right: Program Kerja yang Diusulkan */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Rencana &amp; Eksekusi Lapangan
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                Program Kerja yang Diusulkan
              </h3>
            </div>
            <Link
              to="/program-kerja-kkn"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 group"
              title="Buka Halaman Manajemen Program Kerja KKN"
            >
              <span>Semua Proker</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {effectiveProkers.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs">
                Belum ada program kerja yang diusulkan oleh mahasiswa di kelompok dampingan.
              </div>
            ) : (
              effectiveProkers.slice(0, 4).map((p: any) => {
                const normU = normalizeStatusUsulan(p.statusUsulan, p.status);
                const normP = normalizeStatusPelaksanaan(p.statusPelaksanaan, p.status);
                return (
                  <Link
                    key={p.id}
                    to={`/program-kerja-kkn?search=${encodeURIComponent(p.deskripsi || p.judul || "")}`}
                    className="p-3 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-emerald-50/60 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs group cursor-pointer"
                    title="Klik untuk membuka detail program kerja di Halaman Program Kerja KKN"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition truncate">
                          {p.deskripsi || p.judul}
                        </p>
                        {p.kategori && (
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-extrabold border bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600">
                            {p.kategori}
                          </span>
                        )}
                        {p.kelompokName && (
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                            {p.kelompokName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Kebutuhan: Rp {Number(p.kebutuhanBiaya || 0).toLocaleString("id-ID")}
                        {p.waktuPelaksanaan && <span className="ml-2">• {p.waktuPelaksanaan}</span>}
                      </p>
                    </div>

                    {/* Dual Status Badges: Usulan & Pelaksanaan */}
                    <div className="shrink-0 flex items-center gap-1.5 flex-wrap">
                      {/* 1. Status Usulan */}
                      {normU === "DISETUJUI" && (
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400" />
                          <span>Disetujui</span>
                        </span>
                      )}
                      {normU === "DITOLAK" && (
                        <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-700/40 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                          <XCircle size={11} className="text-rose-600 dark:text-rose-400" />
                          <span>Ditolak</span>
                        </span>
                      )}
                      {normU === "BELUM_DISETUJUI" && (
                        <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                          <Clock size={11} className="text-amber-600 dark:text-amber-400" />
                          <span>Menunggu</span>
                        </span>
                      )}

                      {/* 2. Status Pelaksanaan (Indikator Hijau UI/UX Friendly untuk Sedang Berjalan) */}
                      {normP === "SEDANG_BERJALAN" && (
                        <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 dark:border-emerald-500/50 rounded-full font-black text-[10px] inline-flex items-center gap-1.5 shadow-2xs">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span>Sedang Berlangsung</span>
                        </span>
                      )}
                      {normP === "SELESAI" && (
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700/40 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 size={11} className="text-blue-600 dark:text-blue-400" />
                          <span>Selesai</span>
                        </span>
                      )}
                      {normP === "BELUM_MULAI" && (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-full font-bold text-[10px]">
                          Belum Mulai
                        </span>
                      )}

                      <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition shrink-0 ml-0.5" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
              <span className="font-semibold">
                Total Proker: <strong className="text-slate-800 dark:text-slate-200">{effectiveProkers.length} Kegiatan</strong>
              </span>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-[10.5px]">
                {/* Rekap Status Usulan */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Usulan:</span>
                  <Link
                    to="/program-kerja-kkn?statusUsulan=BELUM_DISETUJUI"
                    className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40 rounded-md font-bold transition cursor-pointer"
                    title="Filter Program Kerja Menunggu Persetujuan"
                  >
                    Menunggu: {effectiveProkers.filter((p: any) => normalizeStatusUsulan(p.statusUsulan, p.status) === "BELUM_DISETUJUI").length}
                  </Link>
                  <Link
                    to="/program-kerja-kkn?statusUsulan=DISETUJUI"
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40 rounded-md font-bold transition cursor-pointer"
                    title="Filter Program Kerja Disetujui"
                  >
                    Disetujui: {effectiveProkers.filter((p: any) => normalizeStatusUsulan(p.statusUsulan, p.status) === "DISETUJUI").length}
                  </Link>
                  <Link
                    to="/program-kerja-kkn?statusUsulan=DITOLAK"
                    className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-700/40 rounded-md font-bold transition cursor-pointer"
                    title="Filter Program Kerja Ditolak"
                  >
                    Ditolak: {effectiveProkers.filter((p: any) => normalizeStatusUsulan(p.statusUsulan, p.status) === "DITOLAK").length}
                  </Link>
                </div>

                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>

                {/* Rekap Status Pelaksanaan */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Pelaksanaan:</span>
                  <Link
                    to="/program-kerja-kkn?statusPelaksanaan=SEDANG_BERJALAN"
                    className="px-2 py-0.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 dark:border-emerald-500/50 rounded-md font-black transition cursor-pointer"
                    title="Filter Program Kerja Sedang Berlangsung"
                  >
                    Berlangsung: {effectiveProkers.filter((p: any) => normalizeStatusPelaksanaan(p.statusPelaksanaan, p.status) === "SEDANG_BERJALAN").length}
                  </Link>
                  <Link
                    to="/program-kerja-kkn?statusPelaksanaan=SELESAI"
                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700/40 rounded-md font-bold transition cursor-pointer"
                    title="Filter Program Kerja Selesai"
                  >
                    Selesai: {effectiveProkers.filter((p: any) => normalizeStatusPelaksanaan(p.statusPelaksanaan, p.status) === "SELESAI").length}
                  </Link>
                  <Link
                    to="/program-kerja-kkn?statusPelaksanaan=BELUM_MULAI"
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md font-bold transition cursor-pointer"
                    title="Filter Program Kerja Belum Mulai"
                  >
                    Belum Mulai: {effectiveProkers.filter((p: any) => normalizeStatusPelaksanaan(p.statusPelaksanaan, p.status) === "BELUM_MULAI").length}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Callout if pending approvals exist */}
      {alerts?.pendingRequests && alerts.pendingRequests.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/40 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                Membutuhkan Persetujuan ({alerts.pendingRequests.length} Pengajuan Izin/Sakit)
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-400">
                Beberapa mahasiswa bimbingan mengajukan surat izin / sakit yang memerlukan validasi DPL.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/monitoring-kegiatan/pengajuan-izin")}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition shadow-xs whitespace-nowrap cursor-pointer"
          >
            Validasi Sekarang
          </button>
        </div>
      )}

      {/* Daftar Kelompok Binaan DPL (Clean Table / Card Overview) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Daftar Kelompok Dampingan</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelompok KKN binaan beserta cakupan wilayah RW dan progress aktivitas.
            </p>
          </div>
          <Link
            to="/manajemen-ekosistem-kkn"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Kelola di Menu Kelompok</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs">
            Belum ada kelompok dampingan yang terdaftar untuk akun DPL ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {groups.map((g) => {
              const rwFormatted = Array.isArray(g.cakupanRw)
                ? g.cakupanRw.join(", ")
                : typeof g.cakupanRw === "string"
                ? g.cakupanRw
                : "-";
              return (
                <div
                  key={g.id}
                  className="bg-slate-50/70 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-emerald-500/40 transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{g.name}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40">
                        {g.studentCount || 0} Mahasiswa
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Kel. {g.kelurahan || "-"} {g.kecamatan ? `• Kec. ${g.kecamatan}` : ""} • RW {rwFormatted}
                    </p>
                    {g.ketua && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1 truncate">
                        <span className="text-slate-400 font-normal">Ketua:</span> {g.ketua.name} ({g.ketua.nim})
                      </p>
                    )}
                    {g.posko && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center justify-between" title={g.posko.alamat}>
                        <span><span className="font-semibold text-slate-600 dark:text-slate-300">Posko:</span> {g.posko.nama}</span>
                        {g.posko.latitude && g.posko.longitude && (
                          <a href={`https://www.google.com/maps?q=${g.posko.latitude},${g.posko.longitude}`} target="_blank" rel="noreferrer" className="text-[10px] flex items-center gap-1 text-blue-500 hover:underline">
                            <MapPin size={10} /> Lokasi
                          </a>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-[10.5px] text-slate-400 block">Tempat Sampah</span>
                      <strong className="text-slate-900 dark:text-slate-100">{g.activatedBinsCount || 0} Unit</strong>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-slate-400 block">Sampah Terpilah</span>
                      <strong className="text-slate-900 dark:text-slate-100">{Number(g.totalWasteWeight || 0).toFixed(1)} Kg</strong>
                    </div>
                    <div className="col-span-2 flex items-center justify-between pt-1">
                      <span className="text-[10.5px] text-slate-400">Rerata Presensi</span>
                      <strong className="text-emerald-700 dark:text-emerald-400">{g.avgAttendanceRate || 0}%</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGroupForDetail(g);
                        setGroupStudentSearchQuery("");
                        setGroupStudentPage(1);
                      }}
                      className="flex-1 py-2 px-3 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Users size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Detail Anggota ({g.studentCount || 0})</span>
                    </button>
                    <Link
                      to="/manajemen-ekosistem-kkn"
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs transition flex items-center justify-center cursor-pointer"
                      title="Kelola Struktur & Logbook di Manajemen Ekosistem"
                    >
                      <ChevronRight size={15} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

        {/* Render Action Modals */}
        {renderActionModals()}
      </div>
    );
  };

  export default DplDashboardPage;
