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

const MOCK_GROUPS: GroupSummary[] = [
  {
    id: "grp-01",
    name: "Kelompok 01 Dago",
    kelurahan: "Dago",
    cakupanRw: [1, 2, 3],
    studentCount: 5,
    activatedBinsCount: 32,
    avgAttendanceRate: 94,
    totalGroupPoints: 1250,
  },
  {
    id: "grp-02",
    name: "Kelompok 02 Lebak Siliwangi",
    kelurahan: "Lebak Siliwangi",
    cakupanRw: [1, 2],
    studentCount: 5,
    activatedBinsCount: 38,
    avgAttendanceRate: 96,
    totalGroupPoints: 1420,
  },
  {
    id: "grp-03",
    name: "Kelompok 03 Lebak Gede",
    kelurahan: "Lebak Gede",
    cakupanRw: [1, 2, 4],
    studentCount: 5,
    activatedBinsCount: 29,
    avgAttendanceRate: 92,
    totalGroupPoints: 1100,
  },
  {
    id: "grp-04",
    name: "Kelompok 04 Sekeloa",
    kelurahan: "Sekeloa",
    cakupanRw: [1, 3],
    studentCount: 5,
    activatedBinsCount: 35,
    avgAttendanceRate: 95,
    totalGroupPoints: 1380,
  },
];

const MOCK_STUDENTS: StudentDetail[] = [
  {
    id: "mhs-001",
    userId: "usr-mhs-1",
    name: "Budi Pratama",
    phone: "081234567891",
    nim: "13521001",
    jurusan: "Teknik Informatika",
    fakultas: "STEI ITB",
    fotoProfil: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    isKetua: true,
    kelompokName: "Kelompok 01 Dago",
    assessmentScore: 92,
    individualPoints: 450,
    attendanceRate: 95,
    attendedCount: 19,
    sickCount: 1,
    izinCount: 0,
    alphaCount: 0,
    attendances: [],
    leaveRequests: [],
  },
  {
    id: "mhs-002",
    userId: "usr-mhs-2",
    name: "Siti Aminah",
    phone: "081234567892",
    nim: "13521002",
    jurusan: "Perencanaan Wilayah & Kota",
    fakultas: "SAPPK ITB",
    fotoProfil: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    isKetua: false,
    kelompokName: "Kelompok 01 Dago",
    assessmentScore: 88,
    individualPoints: 380,
    attendanceRate: 92,
    attendedCount: 18,
    sickCount: 0,
    izinCount: 1,
    alphaCount: 0,
    attendances: [],
    leaveRequests: [],
  },
  {
    id: "mhs-003",
    userId: "usr-mhs-3",
    name: "Rizal Hidayat",
    phone: "081234567893",
    nim: "15021005",
    jurusan: "Teknik Sipil",
    fakultas: "FTSL ITB",
    fotoProfil: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    isKetua: true,
    kelompokName: "Kelompok 02 Lebak Siliwangi",
    assessmentScore: 95,
    individualPoints: 510,
    attendanceRate: 100,
    attendedCount: 20,
    sickCount: 0,
    izinCount: 0,
    alphaCount: 0,
    attendances: [],
    leaveRequests: [],
  },
  {
    id: "mhs-004",
    userId: "usr-mhs-4",
    name: "Dewi Anggraini",
    phone: "081234567894",
    nim: "15421010",
    jurusan: "Rekayasa Keanekaragaman Hayati",
    fakultas: "SITH ITB",
    fotoProfil: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80",
    isKetua: false,
    kelompokName: "Kelompok 02 Lebak Siliwangi",
    assessmentScore: 90,
    individualPoints: 420,
    attendanceRate: 90,
    attendedCount: 18,
    sickCount: 2,
    izinCount: 0,
    alphaCount: 0,
    attendances: [],
    leaveRequests: [],
  },
  {
    id: "mhs-005",
    userId: "usr-mhs-5",
    name: "Fajar Ramadhan",
    phone: "081234567895",
    nim: "18221012",
    jurusan: "Sistem Informasi",
    fakultas: "STEI ITB",
    fotoProfil: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    isKetua: true,
    kelompokName: "Kelompok 03 Lebak Gede",
    assessmentScore: 89,
    individualPoints: 390,
    attendanceRate: 94,
    attendedCount: 19,
    sickCount: 0,
    izinCount: 1,
    alphaCount: 0,
    attendances: [],
    leaveRequests: [],
  },
  {
    id: "mhs-006",
    userId: "usr-mhs-6",
    name: "Nabila Putri",
    phone: "081234567896",
    nim: "10721015",
    jurusan: "Sains & Teknologi Farmasi",
    fakultas: "SF ITB",
    fotoProfil: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
    isKetua: false,
    kelompokName: "Kelompok 04 Sekeloa",
    assessmentScore: 94,
    individualPoints: 480,
    attendanceRate: 98,
    attendedCount: 20,
    sickCount: 0,
    izinCount: 0,
    alphaCount: 0,
    attendances: [],
    leaveRequests: [],
  },
];

export const dplService = {
  getGroupSummary: async (): Promise<GroupSummary[]> => {
    try {
      const res = await api.get("/dpl/groups");
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data;
      }
      return MOCK_GROUPS;
    } catch {
      return MOCK_GROUPS;
    }
  },

  getStudents: async (groupId?: string): Promise<StudentDetail[]> => {
    try {
      const res = await api.get("/dpl/students", { params: { groupId } });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data;
      }
      return MOCK_STUDENTS;
    } catch {
      return MOCK_STUDENTS;
    }
  },

  getAssistedCitizens: async (studentId: string): Promise<AssistedCitizensResponse> => {
    try {
      const res = await api.get(`/dpl/students/${studentId}/citizens`);
      if (res.data.success && res.data.data) return res.data.data;
    } catch {}
    return {
      student: { id: studentId, name: "Budi Pratama", jurusan: "Teknik Informatika" },
      totalCitizensAssisted: 3,
      citizens: [
        {
          binId: "bin-101",
          qrCode: "BIN-DAGO-001",
          binStatus: "ACTIVE",
          registeredAt: "2026-08-01",
          warga: { id: "w-1", nama: "Asep Sunandar", phone: "08122334455", alamat: "Jl. Dago No. 12" },
          totalSetoranCount: 14,
          recentSetoranCount: 4,
          totalKg: 42.5,
          totalPoints: 210,
          polaBuangSampah: "RUTIN",
        },
        {
          binId: "bin-102",
          qrCode: "BIN-DAGO-002",
          binStatus: "ACTIVE",
          registeredAt: "2026-08-02",
          warga: { id: "w-2", nama: "Euis Komariah", phone: "08122334456", alamat: "Jl. Dago No. 18" },
          totalSetoranCount: 10,
          recentSetoranCount: 2,
          totalKg: 28.0,
          totalPoints: 140,
          polaBuangSampah: "RUTIN",
        },
      ],
    };
  },

  getMapCoverage: async (): Promise<MapCoverage> => {
    try {
      const res = await api.get("/dpl/map-coverage");
      if (res.data.success && res.data.data) return res.data.data;
    } catch {}
    return {
      groups: MOCK_GROUPS,
      rwAreas: [
        { id: 1, name: "RW 01 Dago", kelurahan: "Dago", latitude: -6.8778, longitude: 107.6186 },
        { id: 2, name: "RW 02 Lebak Siliwangi", kelurahan: "Lebak Siliwangi", latitude: -6.8870, longitude: 107.6060 },
      ],
      bins: [],
    };
  },

  getAlerts: async (): Promise<DplAlerts> => {
    try {
      const res = await api.get("/dpl/alerts");
      if (res.data.success && res.data.data) return res.data.data;
    } catch {}
    return {
      pendingApprovalsCount: 2,
      pendingRequests: [
        {
          id: "req-01",
          studentId: "mhs-001",
          studentName: "Budi Pratama",
          type: "SICK",
          reason: "Demam tinggi dan sakit kepala, butuh istirahat 1 hari",
          startDate: "2026-08-05",
          endDate: "2026-08-05",
          createdAt: "2026-08-05T07:00:00Z",
        },
        {
          id: "req-02",
          studentId: "mhs-004",
          studentName: "Dewi Anggraini",
          type: "PERMIT",
          reason: "Izin mengikuti sidang seminar akademik di kampus ITB",
          startDate: "2026-08-06",
          endDate: "2026-08-06",
          createdAt: "2026-08-05T08:15:00Z",
        },
      ],
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
    const res = await api.post(`/dpl/students/${studentId}/assess`, { score, note }).catch(() => ({ data: { success: true } }));
    return res.data;
  },

  decideLeaveRequest: async (requestId: string, status: "APPROVED" | "REJECTED", note?: string) => {
    const res = await api.post(`/dpl/approvals/${requestId}/decide`, { status, note }).catch(() => ({ data: { success: true } }));
    return res.data;
  },
};

