import api from "../utils/api";

export interface GroupSummary {
  id: string;
  name: string;
  kelurahan: string;
  kecamatan?: string | null;
  kabupaten?: string | null;
  provinsi?: string | null;
  cakupanRw: number[] | string[] | string;
  posko?: {
    id: string;
    nama: string;
    alamat: string;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  ketua?: {
    id: string;
    userId: string;
    name: string;
    nim: string;
    phone?: string;
  } | null;
  dpl?: {
    id: string;
    name: string;
    nip?: string | null;
    institusi?: string | null;
    programStudi?: string | null;
    phone?: string | null;
  } | null;
  studentCount: number;
  activeTodayCount?: number;
  actualHours?: number;
  targetHours?: number;
  targetTotalKegiatan?: number;
  activatedBinsCount: number;
  organikBinsCount?: number;
  anorganikBinsCount?: number;
  totalWasteWeight?: number;
  avgAttendanceRate: number;
  totalGroupPoints: number;
  programKerja?: any[];
}

export interface StudentDetail {
  id: string;
  userId: string;
  name: string;
  phone: string;
  nim: string;
  jurusan: string;
  fakultas: string;
  fotoProfil?: string;
  isKetua: boolean;
  kelompokName: string;
  assessmentScore: number;
  baseAssessmentScore?: number;
  isAssessed?: boolean;
  individualPoints: number;
  attendanceRate: number;
  attendedCount: number;
  sickCount: number;
  izinCount: number;
  alphaCount: number;
  totalHours?: number;
  totalMinutes?: number;
  remainingMinutes?: number;
  targetHours?: number;
  progressPercentage?: number;
  attendances: Array<{
    id: string;
    scheduleTitle: string;
    attendedAt: string;
    status: string;
  }>;
  leaveRequests: Array<{
    id: string;
    type: string;
    reason: string;
    status: string;
    createdAt: string;
  }>;
}

export interface CitizenImpact {
  binId: string;
  qrCode: string;
  binStatus: string;
  registeredAt: string;
  warga: {
    id: string;
    nama: string;
    phone: string;
    alamat: string;
  } | null;
  totalSetoranCount: number;
  recentSetoranCount: number;
  totalKg: number;
  totalPoints: number;
  polaBuangSampah: "RUTIN" | "KURANG_RUTIN" | "BELUM_SETOR";
}

export interface AssistedCitizensResponse {
  student: {
    id: string;
    name: string;
    jurusan: string;
  };
  totalCitizensAssisted: number;
  citizens: CitizenImpact[];
}

export interface MapCoverage {
  groups: Array<{ id: string; name: string; kelurahan: string; cakupanRw: number[] }>;
  rwAreas: Array<{ id: number; name: string; kelurahan: string; latitude: number; longitude: number }>;
  bins: Array<{ id: string; qrCode: string; status: string; latitude: number; longitude: number; wargaNama: string }>;
}

export interface DplAlerts {
  pendingApprovalsCount: number;
  pendingRequests: Array<{
    id: string;
    studentId: string;
    studentName: string;
    type: string;
    reason: string;
    evidenceUrl?: string;
    startDate: string;
    endDate: string;
    createdAt: string;
    status?: string;
  }>;
}

export interface ApprovalHistoryLog {
  id: string;
  studentName: string;
  type: string;
  reason: string;
  status: string;
  startDate?: string;
  endDate?: string;
  reviewedAt: string;
  rejectionReason?: string;
}

export interface AspekPenilaianItem {
  no: number;
  aspek: string;
  bobot: number;
  nilai: number;
  skor: number;
}

export interface ProgramKerjaItem {
  id: string;
  kelompokId: string;
  kelompokName: string;
  kelurahan: string;
  nomor: number;
  judul?: string;
  deskripsi: string;
  kategori?: string;
  sumber?: string;
  waktuPelaksanaan?: string | null;
  linkGoogleDrive?: string | null;
  kebutuhanBiaya: number;
  status: "BELUM_DISETUJUI" | "DITERIMA" | "DISETUJUI" | "DITOLAK" | "TIDAK_DISETUJUI" | "SEDANG_BERJALAN" | "SEDANG_DILAKSANAKAN" | "SELESAI";
  statusUsulan?: "BELUM_DISETUJUI" | "DISETUJUI" | "DITOLAK" | string;
  statusPelaksanaan?: "BELUM_MULAI" | "SEDANG_BERJALAN" | "SELESAI" | string;
  catatanDpl?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  skorPenilaian?: number | null;
  aspekPenilaian?: AspekPenilaianItem[] | null;
  predikat?: string | null;
  statusPenilaian?: "BELUM_DINILAI" | "SEDANG_DINILAI" | "SUDAH_DINILAI" | string;
  evaluasiDpl?: string | null;
  createdAt: string;
}

export interface RekapNilaiStudent {
  id: string;
  userId: string;
  name: string;
  nim: string;
  jurusan: string;
  fakultas: string;
  kelompokId: string;
  kelompokName: string;
  kelurahan: string;
  isKetua: boolean;
  kehadiran: number;
  poinDampingan: number;
  individuDpl?: number | null;
  individuMpl?: number | null;
  individuGabungan?: number | null;
  prokerDpl?: number | null;
  prokerMpl?: number | null;
  prokerGabungan?: number | null;
  kelompokDpl?: number | null;
  kelompokMpl?: number | null;
  kelompokGabungan?: number | null;
  nilaiAkhir?: number | null;
  predikat?: string | null;
  status?: string;
  skorIndividu?: number;
  catatanIndividu?: string;
  skorProkerKelompok?: number;
  tingkatKehadiran?: number;
  hurufMutu?: string;
  statusLulus?: string;
}

export interface RekapNilaiResponse {
  groups: Array<{
    id: string;
    name: string;
    kelurahan: string | null;
    totalProker: number;
    prokerDisetujui: number;
  }>;
  students: RekapNilaiStudent[];
  stats: {
    totalStudents: number;
    rerataNilai: number;
    rerataKehadiran: number;
  };
}

export interface ConfigTargets {
  targetTotalKegiatan: number;
  targetTotalJam: number;
  targetHarianJam: number;
  targetHarianKegiatan: number;
  attendanceMinDurationHours?: number;
  attendanceMinDurationMinutes?: number;
  attendanceMinDurationSeconds?: number;
  hariKerja?: string;
  jamKerja?: string;
  targetPekan?: number;
  targetTotalHari?: number;
  catatanDpl?: string;
}

export const dplService = {
  getGroupSummary: async (): Promise<GroupSummary[]> => {
    try {
      let res;
      try {
        res = await api.get("/dpl/groups");
      } catch {
        res = await api.get("/dpl/group-summary");
      }
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      console.error("[dplService.getGroupSummary] failed:", err);
      return [];
    }
  },

  getStudents: async (groupId?: string): Promise<StudentDetail[]> => {
    try {
      const res = await api.get("/dpl/students", { params: { groupId } });
      if (res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      console.error("[dplService.getStudents] failed:", err);
      return [];
    }
  },

  getAssistedCitizens: async (studentId: string): Promise<AssistedCitizensResponse> => {
    try {
      const res = await api.get(`/dpl/students/${studentId}/citizens`);
      if (res.data.success && res.data.data) return res.data.data;
    } catch (err) {
      console.error("[dplService.getAssistedCitizens] failed:", err);
    }
    return {
      student: { id: studentId, name: "-", jurusan: "-" },
      totalCitizensAssisted: 0,
      citizens: [],
    };
  },

  getMapCoverage: async (): Promise<MapCoverage> => {
    try {
      const res = await api.get("/dpl/map-coverage");
      if (res.data.success && res.data.data) return res.data.data;
    } catch (err) {
      console.error("[dplService.getMapCoverage] failed:", err);
    }
    return {
      groups: [],
      rwAreas: [],
      bins: [],
    };
  },

  getAlerts: async (): Promise<DplAlerts> => {
    try {
      const res = await api.get("/dpl/alerts");
      if (res.data.success && res.data.data) return res.data.data;
    } catch (err) {
      console.error("[dplService.getAlerts] failed:", err);
    }
    return {
      pendingApprovalsCount: 0,
      pendingRequests: [],
    };
  },

  getApprovalHistory: async (): Promise<ApprovalHistoryLog[]> => {
    try {
      const res = await api.get("/dpl/approvals/history");
      if (res.data.success && Array.isArray(res.data.data)) return res.data.data;
    } catch (err) {
      console.error("[dplService.getApprovalHistory] failed:", err);
    }
    return [];
  },

  assessStudent: async (studentId: string, score: number, note?: string) => {
    const res = await api.post(`/dpl/students/${studentId}/assess`, { score, note });
    return res.data;
  },

  decideLeaveRequest: async (
    requestId: string,
    status: "APPROVED" | "REJECTED" | "ESCALATED",
    note?: string
  ) => {
    const res = await api.post(`/dpl/approvals/${requestId}/decide`, { status, note });
    return res.data;
  },

  decideCancelLeaveRequest: async (
    requestId: string,
    action: "APPROVE_HADIR" | "REJECT_CANCEL",
    note?: string
  ) => {
    const res = await api.post(`/dpl/approvals/${requestId}/cancel-decide`, { action, note });
    return res.data;
  },

  getProgramKerja: async (
    groupId?: string,
    filters?: {
      kategori?: string;
      statusUsulan?: string;
      statusPelaksanaan?: string;
      statusPenilaian?: string;
      search?: string;
    }
  ): Promise<ProgramKerjaItem[]> => {
    try {
      const res = await api.get("/dpl/program-kerja", {
        params: {
          groupId,
          ...filters,
        },
      });
      if (res.data.success && Array.isArray(res.data.data)) return res.data.data;
      return [];
    } catch (err) {
      console.error("[dplService.getProgramKerja] failed:", err);
      return [];
    }
  },

  createProgramKerja: async (data: {
    kelompokId: string;
    nomor?: number;
    deskripsi: string;
    kategori?: string;
    sumber?: string;
    waktuPelaksanaan?: string;
    linkGoogleDrive?: string;
    kebutuhanBiaya?: number;
    status?: "BELUM_DISETUJUI" | "DITERIMA" | "DISETUJUI" | "DITOLAK" | "TIDAK_DISETUJUI" | "SEDANG_BERJALAN" | "SEDANG_DILAKSANAKAN" | "SELESAI";
    statusUsulan?: "BELUM_DISETUJUI" | "DISETUJUI" | "DITOLAK" | string;
    statusPelaksanaan?: "BELUM_MULAI" | "SEDANG_BERJALAN" | "SELESAI" | string;
  }) => {
    const res = await api.post("/dpl/program-kerja", data);
    return res.data;
  },

  updateProgramKerja: async (
    id: string,
    data: {
      nomor?: number;
      deskripsi?: string;
      kategori?: string;
      sumber?: string;
      waktuPelaksanaan?: string;
      linkGoogleDrive?: string;
      kebutuhanBiaya?: number;
      status?: "BELUM_DISETUJUI" | "DITERIMA" | "DISETUJUI" | "DITOLAK" | "TIDAK_DISETUJUI" | "SEDANG_BERJALAN" | "SEDANG_DILAKSANAKAN" | "SELESAI";
      statusUsulan?: "BELUM_DISETUJUI" | "DISETUJUI" | "DITOLAK" | string;
      statusPelaksanaan?: "BELUM_MULAI" | "SEDANG_BERJALAN" | "SELESAI" | string;
      catatanDpl?: string;
    }
  ) => {
    const res = await api.put(`/dpl/program-kerja/${id}`, data);
    return res.data;
  },

  deleteProgramKerja: async (id: string) => {
    const res = await api.delete(`/dpl/program-kerja/${id}`);
    return res.data;
  },

  decideProgramKerja: async (
    id: string,
    status: "DITERIMA" | "DISETUJUI" | "DITOLAK" | "TIDAK_DISETUJUI" | "SEDANG_BERJALAN" | "SEDANG_DILAKSANAKAN" | "SELESAI" | "BELUM_DISETUJUI",
    catatanDpl?: string,
    statusPelaksanaan?: string
  ) => {
    const res = await api.patch(`/dpl/program-kerja/${id}/decision`, { status, statusUsulan: status, statusPelaksanaan, catatanDpl });
    return res.data;
  },

  assessProgramKerja: async (
    id: string,
    skorPenilaian: number,
    evaluasiDpl?: string,
    aspekPenilaian?: AspekPenilaianItem[],
    predikat?: string,
    statusPenilaian?: "BELUM_DINILAI" | "SEDANG_DINILAI" | "SUDAH_DINILAI",
    statusPelaksanaan?: string
  ) => {
    const res = await api.patch(`/dpl/program-kerja/${id}/penilaian`, {
      skorPenilaian,
      evaluasiDpl,
      aspekPenilaian,
      predikat,
      statusPenilaian,
      statusPelaksanaan,
    });
    return res.data;
  },

  getProgramKerjaBukti: async (id: string) => {
    const res = await api.get(`/dpl/program-kerja/${id}/bukti`);
    return res.data?.data || null;
  },

  getRekapNilaiAkhir: async (groupId?: string): Promise<RekapNilaiResponse> => {
    try {
      const res = await api.get("/dpl/penilaian/rekap", { params: { groupId } });
      if (res.data.success && res.data.data) return res.data.data;
    } catch {}
    return {
      groups: [],
      students: [],
      stats: { totalStudents: 0, rerataNilai: 0, rerataKehadiran: 0 },
    };
  },

  getConfigTargets: async (): Promise<ConfigTargets> => {
    try {
      const res = await api.get("/dpl/config-targets");
      if (res.data.success && res.data.data) return res.data.data;
    } catch {}
    return {
      targetTotalKegiatan: 2000,
      targetTotalJam: 100,
      targetHarianJam: 2,
      targetHarianKegiatan: 5,
      attendanceMinDurationHours: 2,
      attendanceMinDurationMinutes: 0,
      attendanceMinDurationSeconds: 0,
    };
  },

  updateConfigTargets: async (data: Partial<ConfigTargets>): Promise<ConfigTargets> => {
    const res = await api.put("/dpl/config-targets", data);
    return res.data?.data || res.data;
  },
};
