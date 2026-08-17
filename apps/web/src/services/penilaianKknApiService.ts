/**
 * Project: TrashCare
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Frontend API Service for Penilaian KKN Mahasiswa (70% Mitra + 30% DPL)
 */

import api from "./api";

export interface StudentInfo {
  id: string;
  nama: string;
  nim: string;
  programStudi: string;
  fakultas: string;
  kelompok: string;
  kelompokId: string;
  rw: string;
  kelurahan: string;
  dplNama: string;
  dplNip: string;
  periodeKkn: string;
  namaMitraPenilai: string;
}

export interface RequirementsInfo {
  attendanceRate: number;
  isAttendanceValid: boolean;
  wargaBinaanCount: number;
  isWargaValid: boolean;
  prokerCount: number;
  isProkerValid: boolean;
  isEvidenceValid: boolean;
}

export interface AssessmentData {
  id?: string;
  studentId: string;
  kelompokId?: string | null;
  dplId?: string | null;
  mitraId?: string | null;
  namaMitraPenilai: string;
  skorMitraKehadiran: number;
  skorMitraWargaBinaan: number;
  skorMitraProker: number;
  skorMitraKomunikasi: number;
  skorMitraTanggungJawab: number;
  skorMitraBuktiKegiatan: number;
  skorMitraDampak: number;
  skorMitraInisiatif: number;
  subtotalMitra: number;
  skorDplPerencanaan: number;
  skorDplKontribusi: number;
  skorDplLogbook: number;
  skorDplAnalisis: number;
  skorDplOutput: number;
  skorDplLaporanAkhir: number;
  subtotalDpl: number;
  nilaiAkhir: number;
  kategoriNilai: string;
  catatanDpl: string;
  catatanMitra: string;
  status: "DRAFT" | "TERSIMPAN" | "FINAL";
  isFinalized: boolean;
  finalizedAt?: string | null;
}

export interface StudentPenilaianResponse {
  student: StudentInfo;
  requirements: RequirementsInfo;
  assessment: AssessmentData;
}

export const penilaianKknApiService = {
  getStudentPenilaian: async (studentId: string): Promise<StudentPenilaianResponse> => {
    const res = await api.get(`/penilaian-kkn/student/${studentId}`);
    return res.data.data;
  },

  savePenilaian: async (payload: Partial<AssessmentData> & { studentId: string }) => {
    const res = await api.post("/penilaian-kkn/save", payload);
    return res.data;
  },

  finalizePenilaian: async (payload: Partial<AssessmentData> & { studentId: string }) => {
    const res = await api.post("/penilaian-kkn/finalize", payload);
    return res.data;
  },

  getRekapPenilaian: async (groupId?: string) => {
    const res = await api.get("/penilaian-kkn/rekap", { params: { groupId } });
    return res.data.data;
  },
};
