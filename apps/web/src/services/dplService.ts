import api from "../utils/api";

export interface GroupSummary {
  id: string;
  name: string;
  kelurahan: string;
  cakupanRw: number[];
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
    const res = await api.get("/dpl/groups");
    return res.data.data;
  },

  getStudents: async (groupId?: string): Promise<StudentDetail[]> => {
    const res = await api.get("/dpl/students", { params: { groupId } });
    return res.data.data;
  },

  getAssistedCitizens: async (studentId: string): Promise<AssistedCitizensResponse> => {
    const res = await api.get(`/dpl/students/${studentId}/citizens`);
    return res.data.data;
  },

  getMapCoverage: async (): Promise<MapCoverage> => {
    const res = await api.get("/dpl/map-coverage");
    return res.data.data;
  },

  getAlerts: async (): Promise<DplAlerts> => {
    const res = await api.get("/dpl/alerts");
    return res.data.data;
  },

  getApprovalHistory: async (): Promise<ApprovalHistoryLog[]> => {
    const res = await api.get("/dpl/approvals/history");
    return res.data.data;
  },

  assessStudent: async (studentId: string, score: number, note?: string) => {
    const res = await api.post(`/dpl/students/${studentId}/assess`, { score, note });
    return res.data.data;
  },

  decideLeaveRequest: async (requestId: string, status: "APPROVED" | "REJECTED", note?: string) => {
    const res = await api.post(`/dpl/approvals/${requestId}/decide`, { status, note });
    return res.data.data;
  },
};
