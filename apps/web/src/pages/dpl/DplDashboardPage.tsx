import React, { useEffect, useState } from "react";
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
  Activity,
  UserCheck,
  Sparkles,
} from "lucide-react";
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

export const DplDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [alerts, setAlerts] = useState<DplAlerts | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryLog[]>([]);
  const [mapCoverage, setMapCoverage] = useState<MapCoverage | null>(null);

  // Drill-down Modal States
  const [selectedStudentForCitizens, setSelectedStudentForCitizens] = useState<StudentDetail | null>(null);
  const [assistedCitizensData, setAssistedCitizensData] = useState<AssistedCitizensResponse | null>(null);
  const [loadingCitizens, setLoadingCitizens] = useState(false);

  // Assessment Form Modal States
  const [selectedStudentForAssessment, setSelectedStudentForAssessment] = useState<StudentDetail | null>(null);
  const [assessmentScoreInput, setAssessmentScoreInput] = useState<number>(85);
  const [assessmentNoteInput, setAssessmentNoteInput] = useState("");
  const [submittingAssessment, setSubmittingAssessment] = useState(false);

  // Active Tab View: 'OVERVIEW' | 'STUDENTS' | 'MAP' | 'APPROVALS'
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "STUDENTS" | "MAP" | "APPROVALS">("OVERVIEW");

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
      await dplService.assessStudent(selectedStudentForAssessment.id, assessmentScoreInput, assessmentNoteInput);
      toast.success(`Penilaian untuk ${selectedStudentForAssessment.name} berhasil disimpan!`);
      setSelectedStudentForAssessment(null);
      // Refresh students
      const updatedStudents = await dplService.getStudents();
      setStudents(updatedStudents);
    } catch (err: any) {
      toast.error("Gagal menyimpan penilaian mahasiswa");
    } finally {
      setSubmittingAssessment(false);
    }
  };

  const handleDecideLeave = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    try {
      await dplService.decideLeaveRequest(requestId, status);
      toast.success(status === "APPROVED" ? "Pengajuan disetujui" : "Pengajuan ditolak");
      // Refresh alerts & history
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

  const filteredStudents = students.filter((s) => {
    const matchesGroup = selectedGroupFilter ? s.kelompokName === selectedGroupFilter : true;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.jurusan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nim.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const totalAllStudents = groups.reduce((acc, g) => acc + g.studentCount, 0);
  const totalActivatedBins = groups.reduce((acc, g) => acc + g.activatedBinsCount, 0);
  const avgOverallAttendance =
    groups.length > 0
      ? Math.round(groups.reduce((acc, g) => acc + g.avgAttendanceRate, 0) / groups.length)
      : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-600 font-medium">Memuat Real Data Dashboard DPL...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 bg-emerald-700/50 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold w-fit mb-2 text-emerald-200 border border-emerald-500/30">
            <Sparkles size={14} /> Portal Dosen Pembimbing Lapangan (DPL)
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Dashboard Bimbingan KKN</h1>
          <p className="text-emerald-100 text-sm mt-1">
            Monitoring keaktifan mahasiswa, dampak pendampingan warga, dan validasi izin secara real-time.
          </p>
        </div>

        {alerts && alerts.pendingApprovalsCount > 0 && (
          <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl p-3 flex items-center gap-3 backdrop-blur">
            <AlertTriangle size={24} className="text-amber-300 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-amber-200">Perhatian Required</p>
              <p className="text-xs text-white">
                <span className="font-extrabold text-amber-300">{alerts.pendingApprovalsCount}</span> Pengajuan Sakit/Izin menunggu approval Anda.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("APPROVALS")}
              className="px-3 py-1.5 bg-amber-400 text-amber-950 font-bold text-xs rounded-lg hover:bg-amber-300 transition"
            >
              Review
            </button>
          </div>
        )}
      </div>

      {/* Metric Cards (1. Ringkasan Kelompok Bimbingan) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Kelompok / Mhs</p>
            <h3 className="text-xl font-black text-gray-800">
              {groups.length} <span className="text-sm font-semibold text-gray-500">Kelompok ({totalAllStudents} Mhs)</span>
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <QrCode size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Warga Dibantu Aktivasi</p>
            <h3 className="text-xl font-black text-gray-800">{totalActivatedBins} <span className="text-xs font-normal text-gray-500">Tong Sampah</span></h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CalendarCheck size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Rata-Rata Kehadiran</p>
            <h3 className="text-xl font-black text-gray-800">{avgOverallAttendance}%</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Approval Pending</p>
            <h3 className="text-xl font-black text-gray-800">{alerts?.pendingApprovalsCount || 0} <span className="text-xs font-normal text-gray-500">Permohonan</span></h3>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("OVERVIEW")}
          className={`px-4 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === "OVERVIEW"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Activity size={18} /> Kelompok Bimbingan
        </button>
        <button
          onClick={() => setActiveTab("STUDENTS")}
          className={`px-4 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === "STUDENTS"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <UserCheck size={18} /> Detail Mahasiswa & Dampak Warga
        </button>
        <button
          onClick={() => setActiveTab("APPROVALS")}
          className={`px-4 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === "APPROVALS"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileCheck size={18} />
          Approval Sakit/Izin
          {alerts && alerts.pendingApprovalsCount > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
              {alerts.pendingApprovalsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("MAP")}
          className={`px-4 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === "MAP"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <MapPin size={18} /> Peta Sebaran RW
        </button>
      </div>

      {/* TAB 1: OVERVIEW KELOMPOK */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Daftar Kelompok Bimbingan DPL</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((grp) => (
              <div key={grp.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                      {grp.kelurahan}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-2">{grp.name}</h3>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    RW: {grp.cakupanRw?.join(", ") || "-"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-xl">
                    <p className="text-gray-500">Anggota Kelompok</p>
                    <p className="text-sm font-bold text-gray-800">{grp.studentCount} Mahasiswa</p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl">
                    <p className="text-gray-500">Aktivasi Tong</p>
                    <p className="text-sm font-bold text-blue-600">{grp.activatedBinsCount} Tong</p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl">
                    <p className="text-gray-500">Kehadiran Kelompok</p>
                    <p className="text-sm font-bold text-emerald-600">{grp.avgAttendanceRate}%</p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl">
                    <p className="text-gray-500">Total Poin</p>
                    <p className="text-sm font-bold text-purple-600">{grp.totalGroupPoints} Pts</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedGroupFilter(grp.name);
                    setActiveTab("STUDENTS");
                  }}
                  className="w-full py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition flex items-center justify-center gap-1"
                >
                  <Eye size={14} /> Lihat Detail Mahasiswa
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DETAIL MAHASISWA & DAMPAK WARGA */}
      {activeTab === "STUDENTS" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 flex-1">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama mahasiswa, NIM, prodi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm outline-none bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg p-2 outline-none"
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

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                <tr>
                  <th className="p-3.5">Mahasiswa</th>
                  <th className="p-3.5">Kelompok</th>
                  <th className="p-3.5">Kehadiran</th>
                  <th className="p-3.5">Status (H/S/I/A)</th>
                  <th className="p-3.5">Skor DPL</th>
                  <th className="p-3.5 text-center">Aksi Bimbingan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          {st.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 flex items-center gap-1">
                            {st.name} {st.isKetua && <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded">Ketua</span>}
                          </p>
                          <p className="text-[11px] text-gray-500">{st.jurusan} • {st.nim}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-gray-700">{st.kelompokName}</td>
                    <td className="p-3.5">
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        {st.attendanceRate}%
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded" title="Hadir">{st.attendedCount}H</span>
                        <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded" title="Sakit">{st.sickCount}S</span>
                        <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded" title="Izin">{st.izinCount}I</span>
                        <span className={`px-1.5 py-0.5 rounded ${st.alphaCount > 0 ? "text-red-700 bg-red-100 font-bold" : "text-gray-500 bg-gray-100"}`} title="Alpha">{st.alphaCount}A</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-gray-800">
                      {st.assessmentScore > 0 ? `${st.assessmentScore} Pts` : <span className="text-gray-400 font-normal italic">Belum dinilai</span>}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenCitizensDrilldown(st)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition flex items-center gap-1 text-[11px]"
                          title="Lihat Warga yang Dibantu & Pola Buang Sampah"
                        >
                          <QrCode size={13} /> Dampak Warga
                        </button>
                        <button
                          onClick={() => handleOpenAssessmentModal(st)}
                          className="px-2.5 py-1 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition flex items-center gap-1 text-[11px]"
                          title="Input Form Penilaian Aktivitas DPL"
                        >
                          <Star size={13} /> Nilai
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: APPROVAL SAKIT / IZIN */}
      {activeTab === "APPROVALS" && (
        <div className="space-y-6">
          {/* Pending Approval Requests */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FileCheck size={20} className="text-amber-500" /> Pengajuan Izin/Sakit Menunggu Approval
            </h2>

            {alerts?.pendingRequests && alerts.pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {alerts.pendingRequests.map((req) => (
                  <div key={req.id} className="p-4 border border-amber-200 bg-amber-50/50 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{req.studentName}</span>
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                          {req.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">Alasan:</span> {req.reason}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Tanggal: {new Date(req.startDate).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecideLeave(req.id, "REJECTED")}
                        className="px-3 py-1.5 bg-red-100 text-red-700 font-bold text-xs rounded-lg hover:bg-red-200 transition flex items-center gap-1"
                      >
                        <XCircle size={14} /> Tolak
                      </button>
                      <button
                        onClick={() => handleDecideLeave(req.id, "APPROVED")}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition flex items-center gap-1"
                      >
                        <CheckCircle size={14} /> Setujui
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic p-4 text-center bg-gray-50 rounded-xl">
                Tidak ada pengajuan sakit/izin yang menunggu approval saat ini.
              </p>
            )}
          </div>

          {/* Riwayat Approval Log */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-800">Riwayat Log Approval DPL</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Mahasiswa</th>
                    <th className="p-3">Tipe</th>
                    <th className="p-3">Alasan</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Tanggal Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {approvalHistory.map((log) => (
                    <tr key={log.id}>
                      <td className="p-3 font-bold text-gray-800">{log.studentName}</td>
                      <td className="p-3 font-semibold">{log.type}</td>
                      <td className="p-3 text-gray-600">{log.reason}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            log.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400">
                        {log.reviewedAt ? new Date(log.reviewedAt).toLocaleString("id-ID") : "-"}
                      </td>
                    </tr>
                  ))}
                  {approvalHistory.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-400 italic">
                        Belum ada riwayat approval.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PETA SEBARAN */}
      {activeTab === "MAP" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <MapPin size={20} className="text-emerald-600" /> Peta Sebaran Wilayah Bimbingan & Tong Sampah Warga
          </h2>
          <p className="text-xs text-gray-500">
            Peta koordinat sebaran RW dampingan kelompok bimbingan dan tempat sampah warga yang telah diaktivasi mahasiswa.
          </p>

          <div className="bg-emerald-950/90 text-white rounded-2xl p-8 min-h-[350px] flex flex-col items-center justify-center text-center relative overflow-hidden border border-emerald-800 shadow-inner">
            <MapPin size={48} className="text-emerald-400 animate-bounce mb-3" />
            <h3 className="text-xl font-bold text-emerald-200">Cakupan Wilayah DPL</h3>
            <p className="text-xs text-emerald-300 max-w-md mt-1">
              Terdeteksi <span className="font-extrabold text-white">{mapCoverage?.rwAreas.length || 0} Wilayah RW</span> & <span className="font-extrabold text-white">{mapCoverage?.bins.length || 0} Titik Tempat Sampah Aktif</span>.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {mapCoverage?.rwAreas.map((rw) => (
                <span key={rw.id} className="bg-emerald-800/60 border border-emerald-600/40 text-emerald-200 text-xs px-3 py-1 rounded-full">
                  {rw.kelurahan} - {rw.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: DRILLDOWN DAMPAK WARGA DIBANTU */}
      {selectedStudentForCitizens && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Drill-Down Dampak Nyata</span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">
                  Warga Dibantu oleh {selectedStudentForCitizens.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudentForCitizens(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {loadingCitizens ? (
              <div className="py-12 text-center text-sm text-gray-500 animate-pulse">Memuat data warga & pola buang...</div>
            ) : assistedCitizensData && assistedCitizensData.citizens.length > 0 ? (
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded-xl flex items-center justify-between text-xs text-blue-900 font-medium">
                  <span>Total Warga Didampingi: <strong>{assistedCitizensData.totalCitizensAssisted} Warga</strong></span>
                </div>
                {assistedCitizensData.citizens.map((c) => (
                  <div key={c.binId} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{c.warga?.nama || "Warga Binaan"}</p>
                        <p className="text-xs text-gray-500">{c.warga?.alamat || "Alamat tercatat"}</p>
                      </div>
                      <span
                        className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                          c.polaBuangSampah === "RUTIN"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.polaBuangSampah === "KURANG_RUTIN"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {c.polaBuangSampah === "RUTIN" ? "⚡ Pola Buang Sampah: RUTIN" : "Pola: KURANG RUTIN"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 text-xs text-gray-600">
                      <div><span className="text-gray-400">Kode QR:</span> <br/><strong className="text-gray-800">{c.qrCode}</strong></div>
                      <div><span className="text-gray-400">Total Setoran:</span> <br/><strong className="text-gray-800">{c.totalSetoranCount}x Setor</strong></div>
                      <div><span className="text-gray-400">Total Berat:</span> <br/><strong className="text-emerald-700">{c.totalKg} Kg</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-gray-500 italic bg-gray-50 rounded-xl">
                Mahasiswa ini belum mengaktivasi tempat sampah warga.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: FORM PENILAIAN DPL */}
      {selectedStudentForAssessment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Form Penilaian DPL</h3>
                <p className="text-xs text-gray-500">{selectedStudentForAssessment.name} ({selectedStudentForAssessment.jurusan})</p>
              </div>
              <button onClick={() => setSelectedStudentForAssessment(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitAssessment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Skor Penilaian Aktivitas (0 - 100):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={assessmentScoreInput}
                  onChange={(e) => setAssessmentScoreInput(Number(e.target.value))}
                  className="w-full p-2.5 border border-gray-200 rounded-xl font-bold text-base outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Catatan Evaluasi / Umpan Balik DPL:</label>
                <textarea
                  rows={3}
                  value={assessmentNoteInput}
                  onChange={(e) => setAssessmentNoteInput(e.target.value)}
                  placeholder="Contoh: Mahasiswa sangat aktif membantu pendaftaran warga dan edukasi pemilahan..."
                  className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForAssessment(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAssessment}
                  className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition"
                >
                  {submittingAssessment ? "Menyimpan..." : "Simpan Penilaian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DplDashboardPage;
