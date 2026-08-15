import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";
import {
  QrCode,
  CalendarCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  FileCheck,
  Search,
  Filter,
  Eye,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Users,
  Download,
  Printer,
  GraduationCap,
  LayoutDashboard,
  Sprout,
  Calendar,
  X,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents, useMap } from "react-leaflet";
import { KELURAHAN_GEODATA } from "../../constants/coblongGeoData";
import L from "leaflet";

// Fix default Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapAutoFlyer: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1]) && center[0] < 0 && center[1] > 0) {
      map.flyTo(center, zoom, { duration: 1.1 });
    }
  }, [center, zoom, map]);
  return null;
};

const MapZoomListener: React.FC<{
  selectedKelurahan: string | null;
  setSelectedKelurahan: (kel: string | null) => void;
}> = ({ selectedKelurahan, setSelectedKelurahan }) => {
  const map = useMapEvents({
    zoomend: () => {
      const z = map.getZoom();
      if (z < 15 && selectedKelurahan !== null) {
        setSelectedKelurahan(null);
      }
    },
  });
  return null;
};

const createRwPinIcon = (rwName: string) => {
  const match = rwName.match(/(\d+)/);
  const num = match ? match[1].padStart(2, "0") : "01";
  return L.divIcon({
    className: "custom-rw-dpl-icon",
    html: `
      <div style="background: linear-gradient(135deg, #059669, #10b981); width: 38px; height: 38px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(16,185,129,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-weight: 900; line-height: 1;">
        <span style="font-size: 8px; opacity: 0.85;">RW</span>
        <span style="font-size: 11px;">${num}</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
};

const createKelurahanPinIcon = (kelName: string, rwCount: number, isDplZone: boolean) => {
  const borderColor = isDplZone ? "#10b981" : "#64748b";
  const dotColor = isDplZone ? "#10b981" : "#94a3b8";
  const badgeBg = isDplZone ? "rgba(16,185,129,0.25)" : "rgba(100,116,139,0.25)";
  const badgeColor = isDplZone ? "#34d399" : "#cbd5e1";
  const badgeText = isDplZone ? `${rwCount} RW Binaan` : `${rwCount} RW`;

  return L.divIcon({
    className: "custom-kelurahan-pin-icon",
    html: `
      <div style="background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 5px 12px; border-radius: 20px; border: 2px solid ${borderColor}; box-shadow: 0 4px 14px rgba(0,0,0,0.3); font-family: sans-serif; display: flex; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap;">
        <span style="background-color: ${dotColor}; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>
        <span style="font-weight: 800; font-size: 11px;">Kel. ${kelName}</span>
        <span style="background-color: ${badgeBg}; color: ${badgeColor}; font-size: 9.5px; font-weight: 800; padding: 1.5px 6px; border-radius: 8px;">${badgeText}</span>
      </div>
    `,
    iconSize: [140, 32],
    iconAnchor: [70, 16],
  });
};

const createBinPinIcon = (status: string) => {
  let bg = "#10b981"; // Active / Normal
  if (status === "FULL" || status === "penuh") bg = "#ef4444";
  if (status === "BROKEN" || status === "rusak") bg = "#f59e0b";

  return L.divIcon({
    className: "custom-bin-dpl-icon",
    html: `
      <div style="background-color: ${bg}; width: 28px; height: 28px; border-radius: 8px; border: 2px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};
const formatCakupanRw = (cakupanRw: any): string => {
  if (Array.isArray(cakupanRw)) return cakupanRw.join(", ");
  if (typeof cakupanRw === "string") return cakupanRw;
  if (typeof cakupanRw === "number") return String(cakupanRw);
  return "-";
};

import toast from "react-hot-toast";
import {
  dplService,
  type GroupSummary,
  type StudentDetail,
  type AssistedCitizensResponse,
  type MapCoverage,
  type DplAlerts,
  type ApprovalHistoryLog,
} from "../../services/dplService";

type TabType = "OVERVIEW" | "KELOMPOK" | "MAHASISWA" | "APPROVAL" | "MAP" | "INOVASI";

export const DplDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab")?.toUpperCase() || "OVERVIEW";

  // Normalize tab string alias
  const activeTab: TabType = useMemo(() => {
    if (rawTab === "STUDENTS") return "MAHASISWA";
    if (rawTab === "APPROVALS") return "APPROVAL";
    if (["OVERVIEW", "KELOMPOK", "MAHASISWA", "APPROVAL", "MAP", "INOVASI"].includes(rawTab)) {
      return rawTab as TabType;
    }
    return "OVERVIEW";
  }, [rawTab]);

  const setActiveTab = (newTab: TabType) => {
    setSearchParams({ tab: newTab });
  };

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [alerts, setAlerts] = useState<DplAlerts | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryLog[]>([]);
  const [mapCoverage, setMapCoverage] = useState<MapCoverage | null>(null);
  const [selectedKelurahanMap, setSelectedKelurahanMap] = useState<string | null>(null);
  const [ideList, setIdeList] = useState<any[]>([]);
  const [ideLoading, setIdeLoading] = useState(false);

  const kelurahanCentroids = useMemo(
    () =>
      Object.values(KELURAHAN_GEODATA).map((kg) => ({
        name: kg.name,
        lat: kg.centroid[0],
        lng: kg.centroid[1],
        rwCount: kg.rwCount,
      })),
    []
  );

  // Filters & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("");
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState<string>("ALL");

  const [kelompokPage, setKelompokPage] = useState(1);
  const [mahasiswaPage, setMahasiswaPage] = useState(1);
  const [approvalPage, setApprovalPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Export Modal State with Period Picker
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<"SEMUA" | "BULAN_INI" | "30_HARI" | "CUSTOM">("SEMUA");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

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

  // Drill-down Modal States
  const [selectedStudentForCitizens, setSelectedStudentForCitizens] = useState<StudentDetail | null>(null);
  const [assistedCitizensData, setAssistedCitizensData] = useState<AssistedCitizensResponse | null>(null);
  const [loadingCitizens, setLoadingCitizens] = useState(false);

  // Rejection & Escalation Modal States
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [escalatingRequestId, setEscalatingRequestId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [escalationReasonInput, setEscalationReasonInput] = useState("");

  // Student Assessment Modal States
  const [selectedStudentForAssess, setSelectedStudentForAssess] = useState<StudentDetail | null>(null);
  const [assessScoreInput, setAssessScoreInput] = useState<number>(80);
  const [assessNoteInput, setAssessNoteInput] = useState<string>("");
  const [submittingAssess, setSubmittingAssess] = useState<boolean>(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const fetchIdeKreatif = async () => {
    setIdeLoading(true);
    try {
      const res = await api.get("/ide-daur-ulang?limit=200");
      const raw: any[] = res.data?.data || res.data?.ideas || (Array.isArray(res.data) ? res.data : []);
      const mhsIds = new Set(students.map((s: any) => s.userId || s.id));
      const filtered = raw.filter((ide: any) =>
        ide.submittedBy === "MAHASISWA_KKN" ||
        ide.userRole === "MAHASISWA_KKN" ||
        mhsIds.has(ide.userId) ||
        mhsIds.has(ide.user?.id)
      );
      setIdeList(filtered.length > 0 ? filtered : raw);
    } catch {
      setIdeList([]);
    } finally {
      setIdeLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "INOVASI" && ideList.length === 0 && !ideLoading) {
      fetchIdeKreatif();
    }
  }, [activeTab, students]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [groupsData, studentsData, alertsData, historyData, mapData] = await Promise.all([
        dplService.getGroupSummary(),
        dplService.getStudents(),
        dplService.getAlerts(),
        dplService.getApprovalHistory(),
        dplService.getMapCoverage(),
      ]);

      setGroups(groupsData || []);
      setStudents(studentsData || []);
      setAlerts(alertsData || null);
      setApprovalHistory(historyData || []);
      setMapCoverage(mapData || null);
    } catch (err: any) {
      console.error("Failed loading DPL dashboard data:", err);
      toast.error("Gagal memuat data Dashboard KKN");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCitizensDrilldown = async (student: StudentDetail) => {
    setSelectedStudentForCitizens(student);
    setLoadingCitizens(true);
    try {
      const data = await dplService.getAssistedCitizens(student.id);
      setAssistedCitizensData(data);
    } catch (err: any) {
      toast.error("Gagal memuat detail warga dibantu");
    } finally {
      setLoadingCitizens(false);
    }
  };

  const handleOpenAssessModal = (student: StudentDetail) => {
    setSelectedStudentForAssess(student);
    setAssessScoreInput(student.assessmentScore || 80);
    setAssessNoteInput("");
  };

  const handleSubmitAssessment = async () => {
    if (!selectedStudentForAssess) return;
    setSubmittingAssess(true);
    try {
      await dplService.assessStudent(
        selectedStudentForAssess.userId || selectedStudentForAssess.id,
        assessScoreInput,
        assessNoteInput
      );
      toast.success(`Skor penilaian ${selectedStudentForAssess.name} berhasil disimpan!`);
      setSelectedStudentForAssess(null);
      await loadDashboardData();
    } catch (err: any) {
      toast.error("Gagal menyimpan skor penilaian mahasiswa");
    } finally {
      setSubmittingAssess(false);
    }
  };

  const handleDecideLeave = async (
    requestId: string,
    status: "APPROVED" | "REJECTED" | "ESCALATED",
    note?: string
  ) => {
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
      setEscalatingRequestId(null);
      setRejectionReasonInput("");
      setEscalationReasonInput("");
      const [updatedAlerts, updatedHistory] = await Promise.all([
        dplService.getAlerts(),
        dplService.getApprovalHistory(),
      ]);
      setAlerts(updatedAlerts);
      setApprovalHistory(updatedHistory);
    } catch (err: any) {
      toast.error("Gagal memproses pengajuan izin");
    }
  };

  const getGradeBadge = (score: number | null | undefined) => {
    if (score === null || score === undefined || score === 0) {
      return {
        letter: "-",
        label: "Belum Dinilai",
        bg: "bg-slate-100 text-slate-500 border-slate-200",
      };
    }
    if (score >= 85) {
      return {
        letter: "A",
        label: "Sangat Baik (A)",
        bg: "bg-emerald-100 text-emerald-800 border-emerald-300 font-black",
      };
    }
    if (score >= 75) {
      return {
        letter: "B",
        label: "Baik (B)",
        bg: "bg-blue-100 text-blue-800 border-blue-300 font-bold",
      };
    }
    if (score >= 65) {
      return {
        letter: "C",
        label: "Cukup (C)",
        bg: "bg-amber-100 text-amber-800 border-amber-300 font-bold",
      };
    }
    if (score >= 50) {
      return {
        letter: "D",
        label: "Kurang (D)",
        bg: "bg-orange-100 text-orange-800 border-orange-300 font-bold",
      };
    }
    return {
      letter: "E",
      label: "Tidak Lulus (E)",
      bg: "bg-rose-100 text-rose-800 border-rose-300 font-bold",
    };
  };

  const handleExportPerformanceCsv = () => {
    if (!students || students.length === 0) {
      toast.error("Tidak ada data mahasiswa bimbingan untuk diekspor.");
      return;
    }

    let filtered = [...students];
    if (selectedGroupFilter) {
      filtered = filtered.filter((s) => s.kelompokName === selectedGroupFilter);
    }

    if (filtered.length === 0) {
      toast.error("Data mahasiswa tidak ditemukan untuk filter/periode yang dipilih!");
      return;
    }

    const headers = [
      "No",
      "NIM",
      "Nama Mahasiswa",
      "Peran Kepengurusan",
      "Program Studi / Fakultas",
      "Kelompok KKN",
      "Total Hadir (Kegiatan)",
      "Sakit (Hari)",
      "Izin (Hari)",
      "Alpha (Hari)",
      "Tingkat Kehadiran (%)",
      "Poin Individu",
      "Nilai Asesmen DPL",
      "Huruf Mutu",
      "Status Evaluasi"
    ];
    const rows = filtered.map((s, idx) => {
      const grade = getGradeBadge(s.assessmentScore);
      return [
        idx + 1,
        `"${s.nim || "-"}"`,
        `"${(s.name || "").replace(/"/g, '""')}"`,
        s.isKetua ? '"Ketua Kelompok"' : '"Anggota"',
        `"${((s.jurusan || "") + (s.fakultas ? ` / ${s.fakultas}` : "")).replace(/"/g, '""')}"`,
        `"${(s.kelompokName || "").replace(/"/g, '""')}"`,
        s.attendedCount || 0,
        s.sickCount || 0,
        s.izinCount || 0,
        s.alphaCount || 0,
        s.attendanceRate ? `${s.attendanceRate}%` : "0%",
        s.individualPoints || 0,
        s.assessmentScore !== undefined && s.assessmentScore !== null ? s.assessmentScore : "Belum Dinilai",
        `"${grade.letter}"`,
        s.assessmentScore !== undefined && s.assessmentScore !== null ? '"SUDAH_DINILAI"' : '"BELUM_DINILAI"'
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekapitulasi_Evaluasi_KKN_DPL_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExportModalOpen(false);
    toast.success("Rekapitulasi nilai & kinerja mahasiswa KKN berhasil diekspor!");
  };

  const handlePrintOfficialReport = () => {
    if (!students || students.length === 0) {
      toast.error("Tidak ada data mahasiswa untuk dicetak");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Izinkan popup di browser Anda.");
      return;
    }

    const todayStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const dplName = user?.name || (groups.length > 0 ? groups[0].name : "Dosen Pembimbing Lapangan");

    const studentRowsHtml = students.map((s, i) => {
      const grade = getGradeBadge(s.assessmentScore);
      return `
      <tr>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${i + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace; font-size: 8.5pt;">${s.nim || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${s.name} ${s.isKetua ? '<span style="font-size:7.5pt; background:#fef3c7; color:#92400e; padding:1px 4px; border-radius:4px;">Ketua</span>' : ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">${s.jurusan || "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">${s.kelompokName || "-"}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${s.attendedCount || 0} Sesi</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; color: #047857;">${s.attendanceRate || 0}%</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; color: #1d4ed8;">${s.assessmentScore !== null && s.assessmentScore !== undefined ? s.assessmentScore : '<span style="color:#94a3b8;">-</span>'}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; font-weight: 900;">${grade.letter}</td>
      </tr>
      `;
    }).join("");

    const avgAttendance = students.length > 0
      ? (students.reduce((acc, curr) => acc + (curr.attendanceRate || 0), 0) / students.length).toFixed(1)
      : "0";
    
    const assessedStudents = students.filter(s => s.assessmentScore !== null && s.assessmentScore !== undefined);
    const avgScore = assessedStudents.length > 0
      ? (assessedStudents.reduce((acc, curr) => acc + (curr.assessmentScore || 0), 0) / assessedStudents.length).toFixed(1)
      : "-";

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Rekapitulasi Pembimbingan & Nilai KKN DPL - ${todayStr}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 10pt; color: #0f172a; line-height: 1.4; padding: 10px; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 15px; }
          .header h2 { margin: 0; font-size: 13pt; text-transform: uppercase; letter-spacing: 0.5px; }
          .header h3 { margin: 3px 0 0 0; font-size: 10pt; font-weight: normal; color: #334155; }
          .meta-table { width: 100%; margin-bottom: 12px; font-size: 9.5pt; }
          .meta-table td { padding: 2px 0; }
          table.data { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 9pt; }
          table.data th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; text-align: left; font-size: 8.5pt; }
          .signature-section { margin-top: 30px; display: flex; justify-content: space-between; font-size: 9.5pt; page-break-inside: avoid; }
          .sig-box { width: 240px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>KECAMATAN COBLONG — KOTA BANDUNG & LPPM PERGURUAN TINGGI</h2>
          <h3>REKAPITULASI RESMI PEMBIMBINGAN & EVALUASI NILAI AKADEMIK MAHASISWA KKN</h3>
        </div>

        <table class="meta-table">
          <tr>
            <td width="18%"><strong>Dosen Pembimbing (DPL)</strong></td>
            <td width="42%">: ${dplName}</td>
            <td width="18%"><strong>Tanggal Cetak</strong></td>
            <td width="22%">: ${todayStr}</td>
          </tr>
          <tr>
            <td><strong>Wilayah Dampingan</strong></td>
            <td>: Kecamatan Coblong, Kota Bandung</td>
            <td><strong>Total Mahasiswa</strong></td>
            <td>: ${students.length} Mahasiswa Binaan</td>
          </tr>
        </table>

        <div style="margin-bottom: 10px; font-size: 8.5pt; color: #334155; background: #f8fafc; padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <strong>Ringkasan Eksekutif:</strong> Rata-rata Presensi: <strong>${avgAttendance}%</strong> | Rata-rata Skor DPL: <strong>${avgScore}</strong> | Mahasiswa Terasesmen: <strong>${assessedStudents.length} / ${students.length} Mahasiswa</strong>
        </div>

        <table class="data">
          <thead>
            <tr>
              <th width="4%" style="text-align:center;">No</th>
              <th width="13%">NIM</th>
              <th width="23%">Nama Mahasiswa</th>
              <th width="17%">Program Studi</th>
              <th width="17%">Kelompok KKN</th>
              <th width="8%" style="text-align:center;">Presensi</th>
              <th width="7%" style="text-align:center;">Hadir %</th>
              <th width="6%" style="text-align:center;">Skor DPL</th>
              <th width="5%" style="text-align:center;">Mutu</th>
            </tr>
          </thead>
          <tbody>
            ${studentRowsHtml}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="sig-box">
            <p>Mengetahui,<br><strong>Koordinator Panitia Taskforce KKN</strong></p>
            <div style="height: 55px;"></div>
            <p style="text-decoration: underline; font-weight: bold;">( Panitia Taskforce Coblong )</p>
          </div>
          <div class="sig-box">
            <p>Kota Bandung, ${todayStr}<br><strong>Dosen Pembimbing Lapangan (DPL)</strong></p>
            <div style="height: 55px;"></div>
            <p style="text-decoration: underline; font-weight: bold;">( ${dplName} )</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Filtered & Paginated Kelompok
  const filteredKelompok = useMemo(() => {
    return groups.filter((g) => {
      const query = searchQuery.toLowerCase();
      return (
        g.name.toLowerCase().includes(query) ||
        (g.kelurahan && g.kelurahan.toLowerCase().includes(query))
      );
    });
  }, [groups, searchQuery]);

  const paginatedKelompok = useMemo(() => {
    const start = (kelompokPage - 1) * ITEMS_PER_PAGE;
    return filteredKelompok.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredKelompok, kelompokPage]);

  const totalKelompokPages = Math.max(1, Math.ceil(filteredKelompok.length / ITEMS_PER_PAGE));

  // Filtered & Paginated Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesGroup = selectedGroupFilter ? s.kelompokName === selectedGroupFilter : true;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        s.name.toLowerCase().includes(query) ||
        s.jurusan.toLowerCase().includes(query) ||
        s.nim.toLowerCase().includes(query) ||
        s.kelompokName.toLowerCase().includes(query);
      return matchesGroup && matchesSearch;
    });
  }, [students, selectedGroupFilter, searchQuery]);

  const paginatedStudents = useMemo(() => {
    const start = (mahasiswaPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, mahasiswaPage]);

  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));

  // Filtered & Paginated Approvals History
  const filteredApprovalHistory = useMemo(() => {
    return approvalHistory.filter((log) => {
      const matchesStatus = selectedApprovalStatus === "ALL" ? true : log.status === selectedApprovalStatus;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        log.studentName.toLowerCase().includes(query) ||
        log.reason.toLowerCase().includes(query) ||
        log.type.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [approvalHistory, selectedApprovalStatus, searchQuery]);

  const paginatedApprovalHistory = useMemo(() => {
    const start = (approvalPage - 1) * ITEMS_PER_PAGE;
    return filteredApprovalHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredApprovalHistory, approvalPage]);

  const totalApprovalPages = Math.max(1, Math.ceil(filteredApprovalHistory.length / ITEMS_PER_PAGE));

  const totalAllStudents = Math.max(students.length, groups.reduce((acc, g) => acc + (g.studentCount || 0), 0));
  const avgOverallAttendance =
    groups.length > 0
      ? Math.round(groups.reduce((acc, g) => acc + (g.avgAttendanceRate || 0), 0) / groups.length)
      : 0;


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-600 font-medium">Memuat Data Dashboard KKN...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Clean Academic Portal Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <GraduationCap size={16} />
            <span>Portal Akademik & Pembimbing Lapangan</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-normal">Kecamatan Coblong</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dasbor Pembimbing Lapangan (DPL)
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-2xl">
            Rekapitulasi portofolio mahasiswa KKN, verifikasi presensi lapangan, dan penilaian akademik wilayah Kecamatan Coblong.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {alerts && alerts.pendingApprovalsCount > 0 && (
            <button
              onClick={() => setActiveTab("APPROVAL")}
              className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-amber-100 transition cursor-pointer"
            >
              <AlertTriangle size={14} className="text-amber-600 shrink-0" />
              <span>{alerts.pendingApprovalsCount} Izin Pending</span>
            </button>
          )}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Ekspor Data Kinerja Mahasiswa (CSV/Excel)"
          >
            <Download size={14} className="text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handlePrintOfficialReport}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Cetak Rekapitulasi Nilai & Evaluasi Resmi untuk LPPM/DLH"
          >
            <Printer size={14} />
            <span>Cetak Rekap LPPM</span>
          </button>
          <button
            onClick={loadDashboardData}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/80 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {(
          [
            { key: "OVERVIEW", label: "Ringkasan Eksekutif", icon: LayoutDashboard },
            { key: "KELOMPOK", label: "Kelompok Binaan", icon: Users },
            { key: "MAHASISWA", label: "Mahasiswa & Nilai", icon: GraduationCap },
            { key: "APPROVAL", label: "Validasi Izin", icon: FileCheck, badge: alerts?.pendingApprovalsCount },
            { key: "MAP", label: "Peta Wilayah", icon: MapPin },
            { key: "INOVASI", label: "Inovasi & Hasil", icon: Sprout },
          ] as { key: TabType; label: string; icon: any; badge?: number }[]
        ).map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Icon size={14} className={isActive ? "text-emerald-600" : "text-slate-400"} />
              <span>{t.label}</span>
              {t.badge && t.badge > 0 ? (
                <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full leading-none">
                  {t.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>


      {/* VIEW 1: OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          {/* Ringkasan Ekosistem KKN */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Ringkasan Wilayah & Tim KKN</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Kecamatan</p>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {groups.length > 0 ? 1 : 0} <span className="text-[10px] font-normal text-slate-500">{groups.length > 0 ? "(Coblong)" : ""}</span>
                </h3>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Kelurahan</p>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {new Set(groups.map((g) => g.kelurahan).filter(Boolean)).size}
                </h3>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Mahasiswa</p>
                <h3 className="text-base font-extrabold text-emerald-700 mt-1">
                  {students.length > 0 ? students.length : totalAllStudents} Orang
                </h3>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Kelompok KKN</p>
                <h3 className="text-base font-extrabold text-blue-700 mt-1">{groups.length} Kelompok</h3>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Tempat Sampah Teraktivasi</p>
                <h3 className="text-base font-extrabold text-emerald-700 mt-1">
                  {mapCoverage?.bins?.length ?? groups.reduce((acc, g) => acc + (g.activatedBinsCount || 0), 0)} Unit
                </h3>
              </div>
            </div>
          </div>

          {/* Metrik Agregat Kehadiran & Pie Chart Sebaran Mahasiswa */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Metrik Kehadiran Kelompok Binaan */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">Presensi Lapangan</h4>
                <h3 className="text-base font-extrabold text-slate-900">Tingkat Kehadiran Mahasiswa Binaan</h3>
                <p className="text-xs text-slate-500 mt-1">Persentase rata-rata kehadiran mahasiswa pada kegiatan KKN di kelompok bimbingan Anda.</p>
              </div>

              <div className="flex items-center gap-4 bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold shadow-sm shrink-0">
                  <CalendarCheck size={24} />
                </div>
                <div>
                  <span className="text-2xl font-black text-emerald-900">
                    {groups.length > 0 ? avgOverallAttendance : 0}%
                  </span>
                  <p className="text-[11px] text-emerald-700 font-bold">Rata-Rata Kehadiran Kelompok Binaan</p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between font-medium">
                <span>Cakupan Bimbingan:</span>
                <span className="font-bold text-slate-800">{groups.length} Kelompok KKN</span>
              </div>
            </div>

            {/* Right: Matriks Evaluasi Nilai Akademik & Presensi Binaan */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Evaluasi Akademik & Presensi Binaan
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                    Progres Penilaian DPL & Kedisiplinan Mahasiswa
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    {gradeDistribution.assessedCount} / {gradeDistribution.totalStudents} Mahasiswa Terasesmen ({gradeDistribution.percentAssessed}%)
                  </span>
                </div>
              </div>

              {/* Progress Bar Penilaian */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">Progres Penilaian Akhir DPL</span>
                  <span className="text-emerald-700">{gradeDistribution.percentAssessed}% Selesai</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${gradeDistribution.percentAssessed}%` }}
                  ></div>
                </div>
              </div>

              {/* Grade Distribution Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                <div className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-emerald-800 block">Nilai A (≥85)</span>
                  <span className="text-lg font-black text-emerald-900">{gradeDistribution.countA}</span>
                  <span className="text-[10px] text-emerald-600 block font-medium">Mahasiswa</span>
                </div>
                <div className="bg-blue-50/70 border border-blue-200 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-blue-800 block">Nilai B (75-84)</span>
                  <span className="text-lg font-black text-blue-900">{gradeDistribution.countB}</span>
                  <span className="text-[10px] text-blue-600 block font-medium">Mahasiswa</span>
                </div>
                <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-amber-800 block">Nilai C (65-74)</span>
                  <span className="text-lg font-black text-amber-900">{gradeDistribution.countC}</span>
                  <span className="text-[10px] text-amber-600 block font-medium">Mahasiswa</span>
                </div>
                <div className="bg-orange-50/70 border border-orange-200 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-orange-800 block">Nilai D (&lt;65)</span>
                  <span className="text-lg font-black text-orange-900">{gradeDistribution.countD}</span>
                  <span className="text-[10px] text-orange-600 block font-medium">Mahasiswa</span>
                </div>
                <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-600 block">Belum Dinilai</span>
                  <span className="text-lg font-black text-slate-800">{gradeDistribution.countUnassessed}</span>
                  <span className="text-[10px] text-slate-500 block font-medium">Mahasiswa</span>
                </div>
              </div>

              {/* Presensi Sesi Aggregates */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-500 font-semibold">Total Presensi Sesi:</span>
                  <span className="font-bold text-emerald-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {gradeDistribution.totalHadir} Hadir
                  </span>
                  <span className="font-bold text-blue-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {gradeDistribution.totalSakit} Sakit
                  </span>
                  <span className="font-bold text-purple-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {gradeDistribution.totalIzin} Izin
                  </span>
                  <span className="font-bold text-rose-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {gradeDistribution.totalAlpha} Alpha
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab("MAHASISWA")}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer ml-auto"
                >
                  <span>Buka Form Penilaian</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Action Callout if pending approvals exist */}
          {alerts?.pendingRequests && alerts.pendingRequests.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    Membutuhkan Persetujuan ({alerts.pendingRequests.length} Pengajuan)
                  </h4>
                  <p className="text-xs text-amber-800">
                    Beberapa mahasiswa mengajukan surat izin/sakit yang memerlukan validasi DPL.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("APPROVAL")}
                className="px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-lg hover:bg-amber-700 transition"
              >
                Kelola Persetujuan
              </button>
            </div>
          )}

          {/* Quick Groups Grid */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Kelompok Bimbingan DPL</h3>
                <p className="text-xs text-slate-500">Daftar kelompok KKN yang saat ini berada di bawah pengawasan Anda.</p>
              </div>
              <button
                onClick={() => setActiveTab("KELOMPOK")}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                Lihat Semua ({groups.length}) <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {groups.slice(0, 6).map((grp) => (
                <div
                  key={grp.id}
                  className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-4 space-y-3 hover:border-emerald-300 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                        {grp.kelurahan}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{grp.name}</h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded">
                      RW {formatCakupanRw(grp.cakupanRw)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Mahasiswa</span>
                      <span className="font-bold text-slate-800">{grp.studentCount ?? 0} Orang</span>

                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Kehadiran</span>
                      <span className="font-bold text-emerald-600">{grp.avgAttendanceRate}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedGroupFilter(grp.name);
                      setActiveTab("MAHASISWA");
                    }}
                    className="w-full py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-1"
                  >
                    <Eye size={12} /> Detail Mahasiswa
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: KELOMPOK BIMBINGAN */}
      {activeTab === "KELOMPOK" && (
        <div className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[11px] font-semibold block">Total Kelompok Binaan</span>
              <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{groups.length} Kelompok</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[11px] font-semibold block">Total Mahasiswa Binaan</span>
              <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{students.length} Orang</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[11px] font-semibold block">Tempat Sampah Aktif</span>
              <span className="text-xl font-extrabold text-blue-600 mt-0.5 block">
                {groups.reduce((acc, g) => acc + (g.activatedBinsCount || 0), 0)} Bin
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[11px] font-semibold block">Rata-rata Presensi</span>
              <span className="text-xl font-extrabold text-emerald-600 mt-0.5 block">
                {groups.length > 0 ? Math.round(groups.reduce((acc, g) => acc + (g.avgAttendanceRate || 0), 0) / groups.length) : 0}%
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 w-full sm:w-80 text-xs">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama kelompok atau kelurahan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setKelompokPage(1);
                }}
                className="w-full outline-none bg-transparent"
              />
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Menampilkan {filteredKelompok.length} Kelompok Bimbingan
            </div>
          </div>

          {/* Table Rekap Kelompok */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10.5px]">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">No</th>
                    <th className="px-4 py-3.5">Nama Kelompok</th>
                    <th className="px-4 py-3.5">Kelurahan & Wilayah RW</th>
                    <th className="px-4 py-3.5 text-center">Jumlah Mahasiswa</th>
                    <th className="px-4 py-3.5 text-center">Tempat Sampah Aktif</th>
                    <th className="px-4 py-3.5 text-center">Rata Presensi (%)</th>
                    <th className="px-4 py-3.5 text-center">Total Poin</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedKelompok.map((grp, idx) => (
                    <tr key={grp.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5 text-center font-bold text-slate-400">
                        {(kelompokPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900 block text-sm">{grp.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">ID: {grp.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md text-[11px] inline-block mb-1">
                          {grp.kelurahan || "Coblong"}
                        </span>
                        <p className="text-[11px] text-slate-500 font-mono">
                          RW: {formatCakupanRw(grp.cakupanRw)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-block min-w-[36px]">
                          {grp.studentCount} Orang
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-blue-700">
                        <span className="bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-block min-w-[36px]">
                          {grp.activatedBinsCount} Tempat Sampah
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg inline-block">
                          {grp.avgAttendanceRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-purple-700">
                        <span className="bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 inline-block">
                          {grp.totalGroupPoints} Pts
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => {
                            setSelectedGroupFilter(grp.name);
                            setActiveTab("MAHASISWA");
                          }}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5 border border-emerald-200 cursor-pointer shadow-2xs"
                        >
                          <Eye size={13} />
                          <span>Detail Mahasiswa</span>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {paginatedKelompok.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                        Tidak ada kelompok bimbingan yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalKelompokPages > 1 && (
              <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">
                  Halaman {kelompokPage} dari {totalKelompokPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={kelompokPage === 1}
                    onClick={() => setKelompokPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg disabled:opacity-50 font-medium hover:bg-slate-100 transition"
                  >
                    Sebelumnya
                  </button>
                  <button
                    disabled={kelompokPage === totalKelompokPages}
                    onClick={() => setKelompokPage((p) => Math.min(totalKelompokPages, p + 1))}
                    className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg disabled:opacity-50 font-medium hover:bg-slate-100 transition"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: MAHASISWA & PORTOFOLIO */}
      {activeTab === "MAHASISWA" && (
        <div className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[11px] font-semibold block">Total Mahasiswa</span>
              <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{students.length} Mahasiswa</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[11px] font-semibold block">Sudah Terasesmen</span>
              <span className="text-xl font-extrabold text-emerald-700 mt-0.5 block">
                {students.filter(s => s.assessmentScore !== null && s.assessmentScore !== undefined).length} Mahasiswa
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[11px] font-semibold block">Belum Terasesmen</span>
              <span className="text-xl font-extrabold text-amber-600 mt-0.5 block">
                {students.filter(s => s.assessmentScore === null || s.assessmentScore === undefined).length} Mahasiswa
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[11px] font-semibold block">Rata-rata Skor DPL</span>
              <span className="text-xl font-extrabold text-blue-700 mt-0.5 block">
                {(() => {
                  const assessed = students.filter(s => s.assessmentScore !== null && s.assessmentScore !== undefined);
                  return assessed.length > 0 ? (assessed.reduce((acc, s) => acc + (s.assessmentScore || 0), 0) / assessed.length).toFixed(1) : "-";
                })()}
              </span>
            </div>
          </div>

          {/* Controls Filter & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 w-full sm:w-80 text-xs">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, NIM, jurusan, kelompok..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setMahasiswaPage(1);
                }}
                className="w-full outline-none bg-transparent"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-2 rounded-lg border border-emerald-200 flex items-center gap-1.5 whitespace-nowrap">
                <Users size={14} className="text-emerald-600" />
                {groups.length} Kelompok KKN
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={15} className="text-slate-400" />
                <select
                  value={selectedGroupFilter}
                  onChange={(e) => {
                    setSelectedGroupFilter(e.target.value);
                    setMahasiswaPage(1);
                  }}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none w-full sm:w-auto cursor-pointer"
                >
                  <option value="">Semua Kelompok KKN</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Ekspor CSV Data Mahasiswa"
              >
                <Download size={13} className="text-emerald-600" />
                <span>Ekspor CSV</span>
              </button>
            </div>
          </div>

          {/* Table Rekap Mahasiswa */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10.5px]">
                  <tr>
                    <th className="px-3 py-3.5 text-center w-12">No</th>
                    <th className="px-4 py-3.5">NIM</th>
                    <th className="px-4 py-3.5 min-w-[200px]">Nama Mahasiswa</th>
                    <th className="px-4 py-3.5 min-w-[170px]">Program Studi / Fakultas</th>
                    <th className="px-4 py-3.5 min-w-[130px]">Kelompok KKN</th>
                    <th className="px-4 py-3.5 text-center min-w-[170px]">Presensi (H / S / I / A)</th>
                    <th className="px-4 py-3.5 text-center min-w-[90px]">Poin</th>
                    <th className="px-4 py-3.5 text-center min-w-[130px]">Nilai Asesmen DPL</th>
                    <th className="px-4 py-3.5 text-center min-w-[120px]">Status</th>
                    <th className="px-4 py-3.5 text-center min-w-[180px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.map((st, idx) => {
                    const grade = getGradeBadge(st.assessmentScore);
                    const hasScore = st.assessmentScore !== null && st.assessmentScore !== undefined && st.assessmentScore > 0;
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-3 py-3.5 text-center font-bold text-slate-400">
                          {(mahasiswaPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-700">
                          {st.nim || "-"}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs border border-emerald-200 shrink-0 shadow-2xs">
                              {st.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{st.name}</span>
                                {st.isKetua && (
                                  <span className="bg-amber-100 text-amber-900 text-[9px] px-1.5 py-0.2 rounded font-extrabold border border-amber-200">
                                    Ketua
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-800 block">{st.jurusan || "-"}</span>
                          {st.fakultas && <span className="text-[10px] text-slate-400 block">{st.fakultas}</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200">
                            {st.kelompokName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex items-center gap-2">
                            <span className={`font-extrabold px-2 py-0.5 rounded text-xs border ${
                              st.attendanceRate >= 80
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : st.attendanceRate >= 60
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}>
                              {st.attendanceRate}%
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono font-medium">
                              ({st.attendedCount}H / {st.sickCount}S / {st.izinCount}I / {st.alphaCount}A)
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg text-xs inline-block">
                            {st.individualPoints ?? 0} Pts
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {hasScore ? (
                            <div className="inline-flex items-center gap-1.5">
                              <span className="font-black text-slate-900 text-sm">{st.assessmentScore}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${grade.bg}`}>
                                {grade.letter}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {hasScore ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                              <CheckCircle size={12} className="text-emerald-600" /> Sudah Dinilai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                              <AlertTriangle size={12} className="text-amber-600" /> Belum Dinilai
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleOpenAssessModal(st)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg transition flex items-center gap-1.5 text-xs border border-blue-200 cursor-pointer shadow-2xs"
                              title="Beri / Edit Skor Penilaian DPL"
                            >
                              <FileCheck size={13} /> <span>Penilaian</span>
                            </button>
                            <button
                              onClick={() => handleOpenCitizensDrilldown(st)}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg transition flex items-center gap-1.5 text-xs border border-emerald-200 cursor-pointer shadow-2xs"
                              title="Detail Portofolio Pendampingan Warga"
                            >
                              <QrCode size={13} /> <span>Portofolio</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedStudents.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 italic text-xs">
                        Tidak ada data mahasiswa bimbingan yang cocok dengan kriteria filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalStudentPages > 1 && (
              <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">
                  Mahasiswa {(mahasiswaPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(mahasiswaPage * ITEMS_PER_PAGE, filteredStudents.length)} dari {filteredStudents.length}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={mahasiswaPage === 1}
                    onClick={() => setMahasiswaPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg disabled:opacity-50 font-medium hover:bg-slate-100 transition"
                  >
                    Sebelumnya
                  </button>
                  <button
                    disabled={mahasiswaPage === totalStudentPages}
                    onClick={() => setMahasiswaPage((p) => Math.min(totalStudentPages, p + 1))}
                    className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg disabled:opacity-50 font-medium hover:bg-slate-100 transition"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: PERSETUJUAN SAKIT / IZIN */}
      {activeTab === "APPROVAL" && (
        <div className="space-y-6">
          {/* Pending Approval Requests */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck size={18} className="text-amber-500" /> Permohonan Izin / Sakit Menunggu Verification
              </h3>
              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {alerts?.pendingRequests?.length || 0} Pending
              </span>
            </div>

            {alerts?.pendingRequests && alerts.pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {alerts.pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 border border-amber-200/80 bg-amber-50/40 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{req.studentName}</span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${req.type === "SAKIT" ? "bg-red-100 text-red-800" : "bg-purple-100 text-purple-800"
                            }`}
                        >
                          {req.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Alasan:</span> {req.reason}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Diajukan pada: {new Date(req.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <button
                        onClick={() => setRejectingRequestId(req.id)}
                        className="px-3 py-1.5 bg-red-50 text-red-700 font-bold text-xs rounded-lg hover:bg-red-100 transition flex items-center gap-1 border border-red-200 cursor-pointer"
                      >
                        <XCircle size={14} /> Tolak
                      </button>
                      <button
                        onClick={() => setEscalatingRequestId(req.id)}
                        className="px-3 py-1.5 bg-amber-50 text-amber-800 font-bold text-xs rounded-lg hover:bg-amber-100 transition flex items-center gap-1 border border-amber-200 cursor-pointer"
                      >
                        <AlertTriangle size={14} /> Eskalasi
                      </button>
                      <button
                        onClick={() => handleDecideLeave(req.id, "APPROVED")}
                        className="px-3.5 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <CheckCircle size={14} /> Setujui
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-4 text-center bg-slate-50 rounded-xl border border-slate-100">
                Tidak ada permohonan sakit/izin yang membutuhkan persetujuan saat ini.
              </p>
            )}
          </div>

          {/* Riwayat Approval Log */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900">Riwayat Validasi Izin DPL</h3>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedApprovalStatus}
                  onChange={(e) => {
                    setSelectedApprovalStatus(e.target.value);
                    setApprovalPage(1);
                  }}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none"
                >
                  <option value="ALL">Semua Status Review</option>
                  <option value="APPROVED">Disetujui (APPROVED)</option>
                  <option value="REJECTED">Ditolak (REJECTED)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10.5px]">
                  <tr>
                    <th className="px-4 py-3.5">Nama Mahasiswa</th>
                    <th className="px-4 py-3.5">Jenis Izin</th>
                    <th className="px-4 py-3.5 min-w-[240px]">Alasan / Catatan</th>
                    <th className="px-4 py-3.5 text-center">Status Keputusan</th>
                    <th className="px-4 py-3.5">Waktu Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedApprovalHistory.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{log.studentName}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                          log.type === "SAKIT" ? "bg-red-50 text-red-700 border-red-200" : "bg-purple-50 text-purple-700 border-purple-200"
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">{log.reason}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                            log.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {log.status === "APPROVED" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {log.status === "APPROVED" ? "Disetujui" : "Ditolak"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {log.reviewedAt ? new Date(log.reviewedAt).toLocaleString("id-ID") : "-"}
                      </td>
                    </tr>
                  ))}

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
              <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-t border-slate-200/80 text-xs">
                <span className="text-slate-500 font-medium">
                  Halaman {approvalPage} dari {totalApprovalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={approvalPage === 1}
                    onClick={() => setApprovalPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg disabled:opacity-50 font-medium hover:bg-slate-100 transition"
                  >
                    Sebelumnya
                  </button>
                  <button
                    disabled={approvalPage === totalApprovalPages}
                    onClick={() => setApprovalPage((p) => Math.min(totalApprovalPages, p + 1))}
                    className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg disabled:opacity-50 font-medium hover:bg-slate-100 transition"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 5: PETA SEBARAN */}
      {activeTab === "MAP" && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin size={18} className="text-emerald-600" /> Peta Sebaran Wilayah Bimbingan & Tempat Sampah
              </h3>
              <p className="text-xs text-slate-500">
                Pilih Kelurahan untuk melihat detail titik RW dampingan dan lokasi tempat sampah warga.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                {mapCoverage?.rwAreas.length || 0} Wilayah RW
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                {mapCoverage?.bins.length || 0} Titik Sampah
              </span>
            </div>
          </div>

          <div className="h-[520px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
            {/* Top Floating Control Bar */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              {selectedKelurahanMap ? (
                <button
                  onClick={() => setSelectedKelurahanMap(null)}
                  className="bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl backdrop-blur-md shadow-lg border border-slate-700 flex items-center gap-2 transition cursor-pointer"
                >
                  <span>← Kembali ke Ringkasan Kelurahan</span>
                  <span className="bg-emerald-500/30 text-emerald-300 text-[10px] px-2 py-0.5 rounded-md border border-emerald-500/40">
                    {selectedKelurahanMap}
                  </span>
                </button>
              ) : (
                <div className="bg-slate-900/85 backdrop-blur-md text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Klik icon Kelurahan di bawah untuk zoom ke detail tempat</span>
                </div>
              )}
            </div>

            <MapContainer
              center={
                selectedKelurahanMap
                  ? [
                    kelurahanCentroids.find((k) => k.name.toLowerCase() === selectedKelurahanMap.toLowerCase())?.lat || -6.8903,
                    kelurahanCentroids.find((k) => k.name.toLowerCase() === selectedKelurahanMap.toLowerCase())?.lng || 107.6110,
                  ]
                  : [-6.8903, 107.6110]
              }
              zoom={selectedKelurahanMap ? 16 : 14}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <MapAutoFlyer
                center={
                  selectedKelurahanMap
                    ? [
                      kelurahanCentroids.find((k) => k.name.toLowerCase() === selectedKelurahanMap.toLowerCase())?.lat || -6.8903,
                      kelurahanCentroids.find((k) => k.name.toLowerCase() === selectedKelurahanMap.toLowerCase())?.lng || 107.6110,
                    ]
                    : [-6.8903, 107.6110]
                }
                zoom={selectedKelurahanMap ? 16 : 14}
              />
              <MapZoomListener
                selectedKelurahan={selectedKelurahanMap}
                setSelectedKelurahan={setSelectedKelurahanMap}
              />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* RENDER KELURAHAN BOUNDARY POLYGONS (ZONA PER DAERAH KECAMATAN COBLONG) */}
              {Object.values(KELURAHAN_GEODATA).map((kelGeo) => {
                const isSelected = selectedKelurahanMap
                  ? kelGeo.name.toLowerCase() === selectedKelurahanMap.toLowerCase()
                  : false;
                const isDplZone = groups.some((g) => g.kelurahan && g.kelurahan.toLowerCase().includes(kelGeo.name.toLowerCase()));

                return (
                  <Polygon
                    key={`poly-kel-${kelGeo.id}`}
                    positions={kelGeo.bounds}
                    pathOptions={{
                      color: kelGeo.color || "#10b981",
                      fillColor: kelGeo.color || "#10b981",
                      fillOpacity: isSelected ? 0.35 : isDplZone ? 0.22 : 0.10,
                      weight: isSelected ? 3 : isDplZone ? 2.5 : 1.5,
                      dashArray: isDplZone ? undefined : "4, 4",
                    }}
                    eventHandlers={{
                      click: () => setSelectedKelurahanMap(kelGeo.name),
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1 text-center font-sans space-y-1">
                        <strong className="text-sm font-bold block text-slate-900">
                          Kelurahan {kelGeo.name}
                        </strong>
                        <p className="text-slate-600">
                          {isDplZone ? (
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                              ✓ Wilayah Bimbingan DPL
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Kecamatan Coblong</span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Total Cakupan: <strong>{kelGeo.rwCount} RW</strong>
                        </p>
                        <button
                          onClick={() => setSelectedKelurahanMap(kelGeo.name)}
                          className="w-full bg-emerald-600 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg hover:bg-emerald-700 transition mt-1 cursor-pointer"
                        >
                          Buka Detail Titik Tempat Sampah →
                        </button>
                      </div>
                    </Popup>
                  </Polygon>
                );
              })}

              {/* LEVEL 1: RENDER ONLY KELURAHAN OVERVIEW MARKERS WHEN NO KELURAHAN SELECTED */}
              {!selectedKelurahanMap &&
                kelurahanCentroids.map((kel) => {
                  const rwsInKel = (mapCoverage?.rwAreas || []).filter((r) =>
                    r.kelurahan.toLowerCase().includes(kel.name.toLowerCase()) ||
                    r.name.toLowerCase().includes(kel.name.toLowerCase())
                  );
                  const isDplZone = groups.some((g) => g.kelurahan && g.kelurahan.toLowerCase().includes(kel.name.toLowerCase()));
                  const countToDisplay = isDplZone && rwsInKel.length > 0 ? rwsInKel.length : kel.rwCount;

                  return (
                    <Marker
                      key={`kel-pin-${kel.name}`}
                      position={[kel.lat, kel.lng]}
                      icon={createKelurahanPinIcon(kel.name, countToDisplay, isDplZone)}
                      eventHandlers={{
                        click: () => setSelectedKelurahanMap(kel.name),
                      }}
                    >
                      <Popup>
                        <div className="text-xs p-1 text-center font-sans space-y-1">
                          <strong className="text-sm font-bold block text-slate-900">
                            Kelurahan {kel.name}
                          </strong>
                          <p className="text-slate-600">
                            {isDplZone ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                                ✓ Wilayah Bimbingan ({rwsInKel.length} RW Aktif)
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">{kel.rwCount} RW (Kec. Coblong)</span>
                            )}
                          </p>
                          <button
                            onClick={() => setSelectedKelurahanMap(kel.name)}
                            className="w-full bg-emerald-600 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg hover:bg-emerald-700 transition cursor-pointer mt-1"
                          >
                            Buka Detail Titik Tempat Sampah →
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

              {/* LEVEL 2: RENDER DETAILED RW AND BIN MARKERS WHEN A KELURAHAN IS SELECTED */}
              {selectedKelurahanMap && (
                <>
                  {/* 1. Render RW Area Markers for Selected Kelurahan */}
                  {(mapCoverage?.rwAreas || [])
                    .filter(
                      (rw) =>
                        rw.kelurahan.toLowerCase().includes(selectedKelurahanMap.toLowerCase()) ||
                        rw.name.toLowerCase().includes(selectedKelurahanMap.toLowerCase())
                    )
                    .map((rw) => {
                      if (!rw.latitude || !rw.longitude) return null;
                      const lat = Number(rw.latitude);
                      const lng = Number(rw.longitude);
                      if (isNaN(lat) || isNaN(lng)) return null;

                      return (
                        <Marker
                          key={`dpl-rw-${rw.id}`}
                          position={[lat, lng]}
                          icon={createRwPinIcon(rw.name)}
                        >
                          <Popup>
                            <div className="text-xs p-1 text-center font-sans">
                              <strong className="text-sm font-bold block mb-1 text-slate-800">
                                Wilayah {rw.name}
                              </strong>
                              <p className="text-slate-600 mb-1">
                                Kelurahan: <strong className="text-emerald-600">{rw.kelurahan}</strong>
                              </p>
                              <p className="text-[10px] text-slate-500 font-semibold italic">
                                Wilayah Pendampingan Mahasiswa KKN
                              </p>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}

                  {/* 2. Render Bin Markers for Selected Kelurahan */}
                  {(mapCoverage?.bins || []).map((bin) => {
                    if (!bin.latitude || !bin.longitude) return null;
                    const lat = Number(bin.latitude);
                    const lng = Number(bin.longitude);
                    if (isNaN(lat) || isNaN(lng)) return null;

                    return (
                      <Marker
                        key={`dpl-bin-${bin.id}`}
                        position={[lat, lng]}
                        icon={createBinPinIcon(bin.status)}
                      >
                        <Popup>
                          <div className="text-xs p-1 text-center font-sans space-y-1">
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full inline-block">
                              Tempat Sampah Aktif
                            </span>
                            <strong className="text-sm font-bold block text-slate-900">
                              {bin.qrCode}
                            </strong>
                            <p className="text-slate-600 text-[11px]">
                              Warga: <strong>{bin.wargaNama || "Warga Binaan"}</strong>
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Status: <span className="font-bold text-slate-800">{bin.status}</span>
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </>
              )}
            </MapContainer>
          </div>
        </div>
      )}

      {/* MODAL 1: DRILLDOWN DAMPAK WARGA DIBANTU */}
      {selectedStudentForCitizens && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Dampak Pendampingan Warga
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Warga Dibantu: {selectedStudentForCitizens.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudentForCitizens(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {loadingCitizens ? (
              <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
                Memuat data warga & pola buang sampah...
              </div>
            ) : assistedCitizensData && assistedCitizensData.citizens.length > 0 ? (
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between text-xs text-slate-700 border border-slate-200/60">
                  <span>Total Warga Didampingi: <strong>{assistedCitizensData.totalCitizensAssisted} Warga</strong></span>
                </div>
                {assistedCitizensData.citizens.map((c) => (
                  <div key={c.binId} className="p-4 border border-slate-200/60 rounded-xl bg-slate-50/40 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{c.warga?.nama || "Warga Binaan"}</p>
                        <p className="text-[11px] text-slate-500">{c.warga?.alamat || "Alamat tercatat"}</p>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${c.polaBuangSampah === "RUTIN"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.polaBuangSampah === "KURANG_RUTIN"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                      >
                        Pola: {c.polaBuangSampah}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-600">
                      <div><span className="text-slate-400 block text-[10px]">Kode QR Tempat Sampah</span> <strong className="text-slate-800">{c.qrCode}</strong></div>
                      <div><span className="text-slate-400 block text-[10px]">Frekuensi</span> <strong className="text-slate-800">{c.totalSetoranCount}x Setor</strong></div>
                      <div><span className="text-slate-400 block text-[10px]">Total Berat</span> <strong className="text-emerald-700">{c.totalKg} Kg</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 italic bg-slate-50 rounded-xl">
                Mahasiswa ini belum mengaktivasi tempat sampah warga.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DRILL-DOWN WARGA DIBANTU */}

      {/* VIEW 6: IDE KREATIF & INOVASI MAHASISWA */}
      {activeTab === "INOVASI" && (
        <div className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[11px] font-semibold block">Total Ide Diajukan</span>
              <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{ideList.length} Karya</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[11px] font-semibold block">Disetujui / Diimplementasikan</span>
              <span className="text-xl font-extrabold text-emerald-600 mt-0.5 block">
                {ideList.filter((i: any) => i.status === "APPROVED" || i.status === "DISETUJUI").length} Karya
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 text-[11px] font-semibold block">Menunggu Evaluasi</span>
              <span className="text-xl font-extrabold text-amber-600 mt-0.5 block">
                {ideList.filter((i: any) => !i.status || i.status === "PENDING" || i.status === "MENUNGGU").length} Karya
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  Tabel Rekapitulasi Karya & Inovasi Sampah Kelompok
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekapitulasi seluruh usulan daur ulang, fasilitas pengolahan, dan karya inovasi mahasiswa bimbingan.
                </p>
              </div>
              <button
                onClick={fetchIdeKreatif}
                className="px-3 py-1.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <RefreshCw size={13} className={ideLoading ? "animate-spin" : ""} />
                Muat Ulang
              </button>
            </div>

            {ideLoading ? (
              <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                <RefreshCw className="animate-spin mx-auto mb-2 text-amber-500" size={22} />
                Memuat ide kreatif mahasiswa...
              </div>
            ) : ideList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-semibold p-6 bg-slate-50">
                Belum ada ide kreatif dari kelompok mahasiswa bimbingan Anda.
                <p className="mt-1 text-[11px] text-slate-400">Klik &quot;Muat Ulang&quot; untuk mengambil data terbaru dari database.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10.5px]">
                    <tr>
                      <th className="px-4 py-3.5 text-center w-12">No</th>
                      <th className="px-4 py-3.5">Tanggal Usulan</th>
                      <th className="px-4 py-3.5 min-w-[180px]">Pengusul & Kelompok</th>
                      <th className="px-4 py-3.5 min-w-[200px]">Judul Inovasi</th>
                      <th className="px-4 py-3.5 min-w-[260px] whitespace-normal">Deskripsi Inovasi</th>
                      <th className="px-4 py-3.5 text-center">Status Evaluasi</th>
                      <th className="px-4 py-3.5 text-center">Dokumentasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ideList.map((ide: any, idx: number) => {
                      const isApproved = ide.status === "APPROVED" || ide.status === "DISETUJUI";
                      const isRejected = ide.status === "REJECTED" || ide.status === "DITOLAK";
                      return (
                        <tr key={ide.id || idx} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                            {ide.createdAt ? new Date(ide.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-slate-900 block">{ide.user?.name || ide.userName || "Mahasiswa KKN"}</span>
                            <span className="text-[11px] text-emerald-700 font-semibold">{ide.kelompokName || "Kelompok KKN Coblong"}</span>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-900">
                            {ide.judul || ide.title || "Tanpa Judul"}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 whitespace-normal max-w-[320px]">
                            <p className="line-clamp-2">{ide.deskripsi || ide.description || "-"}</p>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                                <CheckCircle size={12} /> Disetujui
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                                <XCircle size={12} /> Ditolak
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                                <AlertTriangle size={12} /> Menunggu Evaluasi
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {ide.foto ? (
                              <a
                                href={ide.foto}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs"
                              >
                                <span>Lihat Foto</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Tidak ada foto</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: PENOLAKAN IZIN CATATAN */}
      {rejectingRequestId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-red-600 flex items-center gap-1.5">
                <XCircle size={18} /> Alasan Penolakan Izin
              </h3>
              <button onClick={() => setRejectingRequestId(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-slate-700">Tuliskan Alasan Penolakan untuk Mahasiswa:</label>
              <textarea
                rows={3}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Contoh: Bukti surat sakit tidak melampirkan keterangan dokter resmi..."
                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-red-500"
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setRejectingRequestId(null)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDecideLeave(rejectingRequestId, "REJECTED", rejectionReasonInput)}
                  className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
                >
                  Konfirmasi Penolakan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PENILAIAN SKOR DPL MAHASISWA */}
      {selectedStudentForAssess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <FileCheck size={18} className="text-emerald-600" /> Penilaian Mahasiswa KKN
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedStudentForAssess.name} ({selectedStudentForAssess.nim})</p>
              </div>
              <button onClick={() => setSelectedStudentForAssess(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Skor Evaluasi DPL (0 - 100):</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={assessScoreInput}
                  onChange={(e) => setAssessScoreInput(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Penilaian DPL (Opsional):</label>
                <textarea
                  rows={3}
                  value={assessNoteInput}
                  onChange={(e) => setAssessNoteInput(e.target.value)}
                  placeholder="Catatan keaktifan, kepemimpinan, dan integrasi pemilahan sampah warga..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setSelectedStudentForAssess(null)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  disabled={submittingAssess}
                  onClick={handleSubmitAssessment}
                  className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {submittingAssess ? "Menyimpan..." : "Simpan Skor"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ESKALASI IZIN KE TASKFORCE */}
      {escalatingRequestId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-amber-600 flex items-center gap-1.5">
                <AlertTriangle size={18} /> Eskalasi Izin ke Panitia Taskforce
              </h3>
              <button onClick={() => setEscalatingRequestId(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Pengajuan izin ini akan diteruskan ke Panitia Taskforce untuk evaluasi tingkat lanjut.
              </p>
              <label className="block font-semibold text-slate-700">Catatan / Alasan Eskalasi:</label>
              <textarea
                rows={3}
                value={escalationReasonInput}
                onChange={(e) => setEscalationReasonInput(e.target.value)}
                placeholder="Contoh: Izin melebihi 3 hari berturut-turut, membutuhkan keputusan panitia pusat..."
                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-amber-500"
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEscalatingRequestId(null)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDecideLeave(escalatingRequestId, "ESCALATED", escalationReasonInput)}
                  className="flex-1 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition"
                >
                  Kirim Eskalasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 6: EKSPOR REKAPITULASI KINERJA DPL DENGAN FILTER PERIODE */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-800 text-white">
              <div className="flex items-center gap-2.5">
                <Download size={18} className="text-emerald-400" />
                <h3 className="font-black text-white text-base">Ekspor Rekapitulasi KKN DPL</h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-xs text-emerald-900 font-semibold">
                Total Mahasiswa Binaan: <strong className="text-emerald-950">{students.length} Orang</strong> {selectedGroupFilter ? `(${selectedGroupFilter})` : "(Semua Kelompok)"}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-2 flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-500" /> Filter Periode Laporan:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "SEMUA", label: "Semua Data" },
                    { id: "BULAN_INI", label: "Bulan Berjalan" },
                    { id: "30_HARI", label: "30 Hari Terakhir" },
                    { id: "CUSTOM", label: "Tanggal Kustom" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setExportPeriod(p.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-left flex items-center justify-between cursor-pointer ${
                        exportPeriod === p.id
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{p.label}</span>
                      {exportPeriod === p.id && <CheckCircle size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {exportPeriod === "CUSTOM" && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Mulai:</label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Selesai:</label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExportPerformanceCsv}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={14} />
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DplDashboardPage;
