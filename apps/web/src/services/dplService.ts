import api from "../utils/api";

export interface GroupSummary {
  id: string;
  name: string;
  kelurahan: string;
  cakupanRw: number[] | string[] | string;
  studentCount: number;
  activatedBinsCount: number;
  avgAttendanceRate: number;
  totalGroupPoints: number;
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
  individualPoints: number;
  attendanceRate: number;
  attendedCount: number;
  sickCount: number;
  izinCount: number;
  alphaCount: number;
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
  }>;
}

export interface ApprovalHistoryLog {
  id: string;
  studentName: string;
  type: string;
  reason: string;
  status: string;
  reviewedAt: string;
  rejectionReason?: string;
}

export const dplService = {
  getGroupSummary: async (): Promise<GroupSummary[]> => {
    try {
      const res = await api.get("/dpl/groups");
      if (res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch {
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
    } catch {
      return [];
    }
  },

  getAssistedCitizens: async (studentId: string): Promise<AssistedCitizensResponse> => {
    try {
      const res = await api.get(`/dpl/students/${studentId}/citizens`);
      if (res.data.success && res.data.data) return res.data.data;
    } catch {}
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
    } catch {}
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
    } catch {}
    return {
      pendingApprovalsCount: 0,
      pendingRequests: [],
    };
  },

  getApprovalHistory: async (): Promise<ApprovalHistoryLog[]> => {
    try {
      const res = await api.get("/dpl/approvals/history");
      if (res.data.success && Array.isArray(res.data.data)) return res.data.data;
    } catch {}
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
};
