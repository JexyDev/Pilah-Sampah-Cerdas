import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users,
  Award,
  QrCode,
  CalendarCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MapPin,
  FileCheck,
  Star,
  Search,
  Filter,
  Eye,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
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
    map.flyTo(center, zoom, { duration: 1.1 });
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

const createKelurahanPinIcon = (kelName: string, rwCount: number) => {
  return L.divIcon({
    className: "custom-kelurahan-pin-icon",
    html: `
      <div style="background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 6px 14px; border-radius: 20px; border: 2.5px solid #10b981; box-shadow: 0 4px 16px rgba(0,0,0,0.35); font-family: sans-serif; display: flex; align-items: center; gap: 6px; cursor: pointer; white-space: nowrap; transition: transform 0.2s;">
        <span style="background-color: #10b981; width: 10px; height: 10px; border-radius: 50%; display: inline-block;"></span>
        <span style="font-weight: 800; font-size: 12px;">Kel. ${kelName}</span>
        <span style="background-color: rgba(16,185,129,0.25); color: #34d399; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 10px;">${rwCount} RW</span>
      </div>
    `,
    iconSize: [130, 36],
    iconAnchor: [65, 18],
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

type TabType = "OVERVIEW" | "KELOMPOK" | "MAHASISWA" | "APPROVAL" | "MAP";

export const DplDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab")?.toUpperCase() || "OVERVIEW";

  // Normalize tab string alias
  const activeTab: TabType = useMemo(() => {
    if (rawTab === "STUDENTS") return "MAHASISWA";
    if (rawTab === "APPROVALS") return "APPROVAL";
    if (["OVERVIEW", "KELOMPOK", "MAHASISWA", "APPROVAL", "MAP"].includes(rawTab)) {
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

  const kelurahanCentroids = useMemo(
    () => [
      { name: "Dago", lat: -6.8850, lng: 107.6140 },
      { name: "Sadang Serang", lat: -6.8930, lng: 107.6250 },
      { name: "Sekeloa", lat: -6.8910, lng: 107.6180 },
      { name: "Lebak Gede", lat: -6.8890, lng: 107.6100 },
      { name: "Lebak Siliwangi", lat: -6.8870, lng: 107.6060 },
      { name: "Cipaganti", lat: -6.8950, lng: 107.6030 },
    ],
    []
  );

  // Filters & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("");
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState<string>("ALL");

  const [kelompokPage, setKelompokPage] = useState(1);
  const [mahasiswaPage, setMahasiswaPage] = useState(1);
  const [approvalPage, setApprovalPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Drill-down Modal States
  const [selectedStudentForCitizens, setSelectedStudentForCitizens] = useState<StudentDetail | null>(null);
  const [assistedCitizensData, setAssistedCitizensData] = useState<AssistedCitizensResponse | null>(null);
  const [loadingCitizens, setLoadingCitizens] = useState(false);

  // Assessment Form Modal States
  const [selectedStudentForAssessment, setSelectedStudentForAssessment] = useState<StudentDetail | null>(null);
  const [assessmentScoreInput, setAssessmentScoreInput] = useState<number>(85);
  const [assessmentNoteInput, setAssessmentNoteInput] = useState("");
  const [submittingAssessment, setSubmittingAssessment] = useState(false);

  // Rejection Note Modal States
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

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
      toast.error("Gagal memuat data Dashboard DPL");
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

  const handleOpenAssessmentModal = (student: StudentDetail) => {
    setSelectedStudentForAssessment(student);
    setAssessmentScoreInput(student.assessmentScore || 85);
    setAssessmentNoteInput("");
  };

  const handleSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForAssessment) return;
    setSubmittingAssessment(true);
    try {
      await dplService.assessStudent(
        selectedStudentForAssessment.id,
        assessmentScoreInput,
        assessmentNoteInput
      );
      toast.success(`Penilaian untuk ${selectedStudentForAssessment.name} berhasil disimpan!`);
      setSelectedStudentForAssessment(null);
      const updatedStudents = await dplService.getStudents();
      setStudents(updatedStudents);
    } catch (err: any) {
      toast.error("Gagal menyimpan penilaian mahasiswa");
    } finally {
      setSubmittingAssessment(false);
    }
  };

  const handleDecideLeave = async (requestId: string, status: "APPROVED" | "REJECTED", note?: string) => {
    try {
      await dplService.decideLeaveRequest(requestId, status, note);
      toast.success(status === "APPROVED" ? "Pengajuan berhasil disetujui" : "Pengajuan berhasil ditolak");
      setRejectingRequestId(null);
      setRejectionReasonInput("");
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
    const start = (kelompokPage - 1) * 6;
    return filteredKelompok.slice(start, start + 6);
  }, [filteredKelompok, kelompokPage]);

  const totalKelompokPages = Math.max(1, Math.ceil(filteredKelompok.length / 6));

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

  const totalAllStudents = groups.reduce((acc, g) => acc + g.studentCount, 0);
  const totalActivatedBins = groups.reduce((acc, g) => acc + g.activatedBinsCount, 0);
  const avgOverallAttendance =
    groups.length > 0
      ? Math.round(groups.reduce((acc, g) => acc + g.avgAttendanceRate, 0) / groups.length)
      : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-600 font-medium">Memuat Data Panel Bimbingan DPL...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Executive Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold w-fit mb-2 border border-emerald-500/30">
            <Sparkles size={14} /> Panel Dosen Pembimbing Lapangan (DPL)
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {activeTab === "OVERVIEW" && "Ringkasan Bimbingan KKN"}
            {activeTab === "KELOMPOK" && "Kelompok Bimbingan DPL"}
            {activeTab === "MAHASISWA" && "Mahasiswa & Dampak Warga"}
            {activeTab === "APPROVAL" && "Persetujuan Sakit / Izin"}
            {activeTab === "MAP" && "Peta Sebaran RW Dampingan"}
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Portal evaluasi kinerja mahasiswa KKN, pendampingan warga, dan validasi izin presensi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            className="p-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold border border-slate-700"
            title="Refresh Data"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          {alerts && alerts.pendingApprovalsCount > 0 && (
            <button
              onClick={() => setActiveTab("APPROVAL")}
              className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-amber-500/30 transition"
            >
              <AlertTriangle size={16} className="animate-pulse" />
              <span>{alerts.pendingApprovalsCount} Izin Pending</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Total Kelompok</p>
            <h3 className="text-lg font-bold text-slate-900">
              {groups.length} <span className="text-xs font-normal text-slate-500">({totalAllStudents} Mhs)</span>
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <QrCode size={20} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Aktivasi Sampah</p>
            <h3 className="text-lg font-bold text-slate-900">{totalActivatedBins} <span className="text-xs font-normal text-slate-500">Tong</span></h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <CalendarCheck size={20} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Tingkat Kehadiran</p>
            <h3 className="text-lg font-bold text-slate-900">{avgOverallAttendance}%</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Permohonan Izin</p>
            <h3 className="text-lg font-bold text-slate-900">{alerts?.pendingApprovalsCount || 0} <span className="text-xs font-normal text-slate-500">Pending</span></h3>
          </div>
        </div>
      </div>

      {/* VIEW 1: OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
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
                      RW {grp.cakupanRw?.join(", ") || "-"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Mahasiswa</span>
                      <span className="font-bold text-slate-800">{grp.studentCount} Orang</span>
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60 w-full sm:w-80 text-xs">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedKelompok.map((grp) => (
              <div key={grp.id} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 hover:border-emerald-500/50 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {grp.kelurahan}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2">{grp.name}</h3>
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    RW: {grp.cakupanRw?.join(", ") || "-"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="text-slate-400 text-[10px]">Jumlah Anggota</p>
                    <p className="font-bold text-slate-800">{grp.studentCount} Mahasiswa</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="text-slate-400 text-[10px]">Aktivasi Tong</p>
                    <p className="font-bold text-blue-600">{grp.activatedBinsCount} Tong</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="text-slate-400 text-[10px]">Rata Kehadiran</p>
                    <p className="font-bold text-emerald-600">{grp.avgAttendanceRate}%</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="text-slate-400 text-[10px]">Total Poin</p>
                    <p className="font-bold text-purple-600">{grp.totalGroupPoints} Pts</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedGroupFilter(grp.name);
                    setActiveTab("MAHASISWA");
                  }}
                  className="w-full py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition flex items-center justify-center gap-1 border border-emerald-200/60"
                >
                  <Eye size={14} /> lihat Anggota Mahasiswa
                </button>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalKelompokPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200/80 text-xs">
              <span className="text-slate-500">
                Halaman {kelompokPage} dari {totalKelompokPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={kelompokPage === 1}
                  onClick={() => setKelompokPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg disabled:opacity-50 font-medium hover:bg-slate-200 transition"
                >
                  Sebelumnya
                </button>
                <button
                  disabled={kelompokPage === totalKelompokPages}
                  onClick={() => setKelompokPage((p) => Math.min(totalKelompokPages, p + 1))}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg disabled:opacity-50 font-medium hover:bg-slate-200 transition"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: MAHASISWA & DAMPAK WARGA */}
      {activeTab === "MAHASISWA" && (
        <div className="space-y-4">
          {/* Controls Filter & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60 w-full sm:w-80 text-xs">
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

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={15} className="text-slate-400" />
              <select
                value={selectedGroupFilter}
                onChange={(e) => {
                  setSelectedGroupFilter(e.target.value);
                  setMahasiswaPage(1);
                }}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none w-full sm:w-auto"
              >
                <option value="">Semua Kelompok Bimbingan</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Mahasiswa */}
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="p-3.5">Mahasiswa Bimbingan</th>
                    <th className="p-3.5">Kelompok KKN</th>
                    <th className="p-3.5">Kehadiran (%)</th>
                    <th className="p-3.5">Status (H/S/I/A)</th>
                    <th className="p-3.5">Skor Penilaian DPL</th>
                    <th className="p-3.5 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs border border-emerald-200">
                            {st.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                              {st.name}
                              {st.isKetua && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-bold">
                                  Ketua
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {st.jurusan} • {st.nim}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">{st.kelompokName}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          {st.attendanceRate}%
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 font-semibold text-[11px]">
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded" title="Hadir">{st.attendedCount}H</span>
                          <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded" title="Sakit">{st.sickCount}S</span>
                          <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded" title="Izin">{st.izinCount}I</span>
                          <span className={`px-1.5 py-0.5 rounded ${st.alphaCount > 0 ? "text-red-700 bg-red-100 font-bold" : "text-slate-500 bg-slate-100"}`} title="Alpha">{st.alphaCount}A</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {st.assessmentScore > 0 ? (
                          <span className="bg-slate-100 px-2 py-1 rounded text-slate-900 border border-slate-200">
                            {st.assessmentScore} Pts
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal italic">Belum dinilai</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenCitizensDrilldown(st)}
                            className="px-2.5 py-1.5 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition flex items-center gap-1 text-[11px] border border-blue-200/60"
                            title="Detail Warga & Tempat Sampah Dibantu"
                          >
                            <QrCode size={13} /> Dampak Warga
                          </button>
                          <button
                            onClick={() => handleOpenAssessmentModal(st)}
                            className="px-2.5 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition flex items-center gap-1 text-[11px]"
                            title="Form Input Skor Penilaian DPL"
                          >
                            <Star size={13} /> Nilai
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {paginatedStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 italic text-xs">
                        Tidak ada data mahasiswa bimbingan yang cocok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalStudentPages > 1 && (
              <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-t border-slate-200/80 text-xs">
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

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRejectingRequestId(req.id)}
                        className="px-3 py-1.5 bg-red-50 text-red-700 font-bold text-xs rounded-lg hover:bg-red-100 transition flex items-center gap-1 border border-red-200"
                      >
                        <XCircle size={14} /> Tolak
                      </button>
                      <button
                        onClick={() => handleDecideLeave(req.id, "APPROVED")}
                        className="px-3.5 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition flex items-center gap-1 shadow-xs"
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
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="p-3">Nama Mahasiswa</th>
                    <th className="p-3">Jenis Izin</th>
                    <th className="p-3">Alasan / Catatan</th>
                    <th className="p-3">Status Decision</th>
                    <th className="p-3">Waktu Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedApprovalHistory.map((log) => (
                    <tr key={log.id}>
                      <td className="p-3 font-bold text-slate-900">{log.studentName}</td>
                      <td className="p-3 font-semibold">{log.type}</td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{log.reason}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[11px] ${log.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                            }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">
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
                <MapPin size={18} className="text-emerald-600" /> Peta Sebaran Wilayah Bimbingan & Tong Sampah
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

              {/* LEVEL 1: RENDER ONLY KELURAHAN OVERVIEW MARKERS WHEN NO KELURAHAN SELECTED */}
              {!selectedKelurahanMap &&
                kelurahanCentroids.map((kel) => {
                  const rwsInKel = (mapCoverage?.rwAreas || []).filter((r) =>
                    r.kelurahan.toLowerCase().includes(kel.name.toLowerCase()) ||
                    r.name.toLowerCase().includes(kel.name.toLowerCase())
                  );

                  return (
                    <Marker
                      key={`kel-pin-${kel.name}`}
                      position={[kel.lat, kel.lng]}
                      icon={createKelurahanPinIcon(kel.name, rwsInKel.length || 10)}
                      eventHandlers={{
                        click: () => setSelectedKelurahanMap(kel.name),
                      }}
                    >
                      <Popup>
                        <div className="text-xs p-1 text-center font-sans">
                          <strong className="text-sm font-bold block text-slate-900 mb-1">
                            Kelurahan {kel.name}
                          </strong>
                          <p className="text-slate-600 mb-2">
                            Total Wilayah: <strong>{rwsInKel.length} RW</strong>
                          </p>
                          <button
                            onClick={() => setSelectedKelurahanMap(kel.name)}
                            className="w-full bg-emerald-600 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg hover:bg-emerald-700 transition"
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
                              Tong Sampah Aktif
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
                      <div><span className="text-slate-400 block text-[10px]">Kode QR Bin</span> <strong className="text-slate-800">{c.qrCode}</strong></div>
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

      {/* MODAL 2: FORM PENILAIAN DPL */}
      {selectedStudentForAssessment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Form Penilaian Aktivitas DPL</h3>
                <p className="text-xs text-slate-500">{selectedStudentForAssessment.name} ({selectedStudentForAssessment.jurusan})</p>
              </div>
              <button onClick={() => setSelectedStudentForAssessment(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitAssessment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Skor Penilaian (0 - 100):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={assessmentScoreInput}
                  onChange={(e) => setAssessmentScoreInput(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-bold text-sm outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Evaluasi DPL:</label>
                <textarea
                  rows={3}
                  value={assessmentNoteInput}
                  onChange={(e) => setAssessmentNoteInput(e.target.value)}
                  placeholder="Catatan evaluasi keaktifan mahasiswa..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForAssessment(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAssessment}
                  className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition"
                >
                  {submittingAssessment ? "Menyimpan..." : "Simpan Penilaian"}
                </button>
              </div>
            </form>
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
    </div>
  );
};

export default DplDashboardPage;
