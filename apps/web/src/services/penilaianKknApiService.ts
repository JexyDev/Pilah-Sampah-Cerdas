/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Frontend API Service for Penilaian KKN Mahasiswa (50% Mitra + 50% DPL)
 */

import api from "./api";

export interface StudentInfo {
  id: string;
  nama: string;
  nim: string;
  jenjangPendidikan?: string;
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

export interface StudentRekapItem {
  studentId: string;
  nama: string;
  nim: string;
  jenjangPendidikan?: string;
  jurusan?: string;
  programStudi?: string;
  fakultas?: string;
  kelompok: string;
  kelurahan?: string;
  rw?: string;
  dplNama?: string;
  subtotalMitra: number;
  subtotalDpl: number;
  nilaiAkhir: number;
  kategori: string;
  status: string;
  statusDpl: "BELUM_DINILAI" | "SEDANG_DINILAI" | "SUDAH_DINILAI";
  isFinalized: boolean;
  skorDplPerencanaan?: number;
  skorDplKontribusi?: number;
  skorDplLogbook?: number;
  skorDplAnalisis?: number;
  skorDplOutput?: number;
  skorDplLaporanAkhir?: number;
  catatanDpl?: string;
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

export interface LaporanAkhirKelompokItem {
  id: string;
  kelompokId: string;
  no: number;
  namaKelompok: string;
  kelurahan: string;
  cakupanRw: string[] | any;
  dplNama: string;
  dplNip: string;
  dplId?: string | null;
  totalAnggota: number;
  students: Array<{
    studentId: string;
    nim: string;
    nama: string;
    jurusan: string;
    fakultas?: string;
    phone?: string;
    rw?: string;
  }>;
  judulLaporan: string;
  fileUrl: string | null;
  fileName: string | null;
  submittedAt: string;
  updatedAt: string;
  statusTelaah: "DISETUJUI" | "PERLU_REVISI" | "MENUNGGU_TELAAH" | "BELUM_UNGGAH";
  status: "Sudah Dinilai" | "Belum Dinilai";
  nilaiAkhir: number | null;
  predikat: string;
  rubrikScores: {
    sistematika: number;
    analisis: number;
    output: number;
    refleksi: number;
  };
  catatanBab: {
    bab1: string;
    bab2: string;
    bab3: string;
    bab4: string;
  };
  catatanUmum: string;
}

export interface StudentPenilaianResponse {
  student: StudentInfo;
  requirements: RequirementsInfo;
  assessment: AssessmentData;
}

export interface LaporanAkhirItem {
  studentId: string;
  nim: string;
  nama: string;
  jurusan: string;
  fakultas?: string;
  kelompok: string;
  kelompokId?: string;
  dplNama?: string;
  dplNip?: string;
  judulLaporan: string;
  fileUrl: string | null;
  fileName?: string | null;
  status: "Sudah Dinilai" | "Belum Dinilai";
  statusTelaah?: "DISETUJUI" | "PERLU_REVISI" | "MENUNGGU_TELAAH" | "BELUM_UNGGAH";
  nilai: number | null;
  predikat?: string;
  rubrikScores?: {
    sistematika: number;
    analisis: number;
    dampak?: number;
    output?: number;
    rekomendasi?: number;
    refleksi?: number;
  };
  catatan?: string;
  submittedAt?: string;
  updatedAt?: string;
}

export interface LaporanAkhirResponse {
  stats: {
    totalKelompok?: number;
    disetujuiCount?: number;
    perluRevisiCount?: number;
    menungguTelaahCount?: number;
    totalMahasiswa?: number;
    sudahDinilaiCount?: number;
    belumDinilaiCount?: number;
  };
  students: LaporanAkhirItem[];
  kelompokList: LaporanAkhirKelompokItem[];
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

  getLaporanAkhirList: async (groupId?: string): Promise<LaporanAkhirResponse> => {
    const res = await api.get("/penilaian-kkn/laporan-akhir", { params: { groupId } });
    return res.data.data;
  },

  saveLaporanAkhirKelompokScore: async (
    kelompokId: string,
    payload: {
      statusTelaah: "DISETUJUI" | "PERLU_REVISI" | "MENUNGGU_TELAAH";
      rubrikScores: {
        sistematika: number;
        analisis: number;
        output: number;
        refleksi: number;
      };
      catatanBab?: {
        bab1?: string;
        bab2?: string;
        bab3?: string;
        bab4?: string;
      };
      catatanUmum?: string;
      judulLaporan?: string;
      fileUrl?: string;
    }
  ) => {
    const res = await api.post(`/penilaian-kkn/laporan-akhir/kelompok/${kelompokId}/assess`, payload);
    return res.data;
  },

  saveLaporanAkhirScore: async (studentId: string, score: number, catatan?: string) => {
    const res = await api.post(`/penilaian-kkn/laporan-akhir/${studentId}/assess`, {
      score,
      catatan,
    });
    return res.data;
  },
};
