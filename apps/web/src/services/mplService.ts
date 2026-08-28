/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 *
 * MPL (Mitra Pendamping Lapangan) Service
 * Versi kelurahan dari DPL — scope strict by kelurahan id (bukan kecamatan).
 * Semua endpoint hit /mpl/... agar backend bisa enforce scope kelurahan.
 */

import api from "../utils/api";
import type {
  GroupSummary,
  StudentDetail,
  DplAlerts,
  ApprovalHistoryLog,
  ProgramKerjaItem,
  AspekPenilaianItem,
  RekapNilaiResponse,
  ConfigTargets,
  MapCoverage,
  AssistedCitizensResponse,
} from "./dplService";

// Re-export types agar komponen bisa import dari satu tempat
export type {
  GroupSummary,
  StudentDetail,
  DplAlerts,
  ApprovalHistoryLog,
  ProgramKerjaItem,
  AspekPenilaianItem,
  RekapNilaiResponse,
  ConfigTargets,
  MapCoverage,
  AssistedCitizensResponse,
};

/**
 * mplService — identik dengan dplService tapi:
 * 1. Endpoint prefix: /mpl/ (bukan /dpl/)
 * 2. Backend enforce scope by kelurahan id dari token MPL
 * 3. Tidak ada fallback ke /dpl/ agar tidak bocor lintas scope
 */
export const mplService = {
  getGroupSummary: async (): Promise<GroupSummary[]> => {
    try {
      const res = await api.get("/mpl/groups");
      if (res.data?.success && Array.isArray(res.data.data)) return res.data.data;
      return [];
    } catch (err) {
      console.error("[mplService.getGroupSummary] failed:", err);
      return [];
    }
  },

  getStudents: async (groupId?: string): Promise<StudentDetail[]> => {
    try {
      const res = await api.get("/mpl/students", { params: { groupId } });
      if (res.data?.success && Array.isArray(res.data.data)) return res.data.data;
      return [];
    } catch (err) {
      console.error("[mplService.getStudents] failed:", err);
      return [];
    }
  },

  getAssistedCitizens: async (studentId: string): Promise<AssistedCitizensResponse> => {
    try {
      const res = await api.get(`/mpl/students/${studentId}/citizens`);
      if (res.data?.success && res.data.data) return res.data.data;
    } catch (err) {
      console.error("[mplService.getAssistedCitizens] failed:", err);
    }
    return { student: { id: studentId, name: "-", jurusan: "-" }, totalCitizensAssisted: 0, citizens: [] };
  },

  getMapCoverage: async (): Promise<MapCoverage> => {
    try {
      const res = await api.get("/mpl/map-coverage");
      if (res.data?.success && res.data.data) return res.data.data;
    } catch (err) {
      console.error("[mplService.getMapCoverage] failed:", err);
    }
    return { groups: [], rwAreas: [], bins: [] };
  },

  getAlerts: async (): Promise<DplAlerts> => {
    try {
      const res = await api.get("/mpl/alerts");
      if (res.data?.success && res.data.data) return res.data.data;
    } catch (err) {
      console.error("[mplService.getAlerts] failed:", err);
    }
    return { pendingApprovalsCount: 0, pendingRequests: [] };
  },

  getApprovalHistory: async (): Promise<ApprovalHistoryLog[]> => {
    try {
      const res = await api.get("/mpl/approvals/history");
      if (res.data?.success && Array.isArray(res.data.data)) return res.data.data;
    } catch (err) {
      console.error("[mplService.getApprovalHistory] failed:", err);
    }
    return [];
  },

  assessStudent: async (studentId: string, score: number, note?: string) => {
    const res = await api.post(`/mpl/students/${studentId}/assess`, { score, note });
    return res.data;
  },

  decideLeaveRequest: async (
    requestId: string,
    status: "APPROVED" | "REJECTED" | "ESCALATED",
    note?: string
  ) => {
    const res = await api.post(`/mpl/approvals/${requestId}/decide`, { status, note });
    return res.data;
  },

  decideCancelLeaveRequest: async (
    requestId: string,
    action: "APPROVE_HADIR" | "REJECT_CANCEL",
    note?: string
  ) => {
    const res = await api.post(`/mpl/approvals/${requestId}/cancel-decide`, { action, note });
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
      const res = await api.get("/mpl/program-kerja", { params: { groupId, ...filters } });
      if (res.data?.success && Array.isArray(res.data.data)) return res.data.data;
      return [];
    } catch (err) {
      console.error("[mplService.getProgramKerja] failed:", err);
      return [];
    }
  },

  createProgramKerja: async (data: {
    kelompokId: string;
    nomor?: number;
    judul?: string;
    deskripsi: string;
    kategori?: string;
    sumber?: string;
    waktuPelaksanaan?: string;
    linkGoogleDrive?: string;
    kebutuhanBiaya?: number;
    status?: string;
    statusUsulan?: string;
    statusPelaksanaan?: string;
  }) => {
    const res = await api.post("/mpl/program-kerja", data);
    return res.data;
  },

  updateProgramKerja: async (id: string, data: Record<string, unknown>) => {
    const res = await api.put(`/mpl/program-kerja/${id}`, data);
    return res.data;
  },

  deleteProgramKerja: async (id: string) => {
    const res = await api.delete(`/mpl/program-kerja/${id}`);
    return res.data;
  },

  decideProgramKerja: async (
    id: string,
    status: string,
    catatanDpl?: string,
    statusPelaksanaan?: string
  ) => {
    const res = await api.patch(`/mpl/program-kerja/${id}/decision`, {
      status,
      statusUsulan: status,
      statusPelaksanaan,
      catatanDpl,
    });
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
    const res = await api.patch(`/mpl/program-kerja/${id}/penilaian`, {
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
    const res = await api.get(`/mpl/program-kerja/${id}/bukti`);
    return res.data?.data || null;
  },

  getRekapNilaiAkhir: async (groupId?: string): Promise<RekapNilaiResponse> => {
    try {
      const res = await api.get("/mpl/penilaian/rekap", { params: { groupId } });
      if (res.data?.success && res.data.data) return res.data.data;
    } catch {}
    return { groups: [], students: [], stats: { totalStudents: 0, rerataNilai: 0, rerataKehadiran: 0 } };
  },

  getConfigTargets: async (): Promise<ConfigTargets> => {
    try {
      const res = await api.get("/mpl/config-targets");
      if (res.data?.success && res.data.data) return res.data.data;
    } catch {}
    return {
      targetTotalKegiatan: 2000,
      targetTotalJam: 100,
      targetHarianJam: 2,
      targetHarianKegiatan: 5,
    };
  },

  updateConfigTargets: async (data: Partial<ConfigTargets>): Promise<ConfigTargets> => {
    const res = await api.put("/mpl/config-targets", data);
    return res.data?.data || res.data;
  },
};
