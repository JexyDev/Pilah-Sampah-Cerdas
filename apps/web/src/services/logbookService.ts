/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Frontend API Service for Logbook KKN (Mahasiswa & DPL)
 */

import api from "./api";

export interface LogbookMahasiswaItem {
  nomor: number;
  id: string;
  kelompokId: string;
  kelompokNama: string;
  kelurahan: string;
  cakupanRw?: string[];
  penulisId: string;
  penulisNama: string;
  penulisNim: string;
  penulisJurusan?: string;
  penulisFakultas?: string;
  penulisFotoProfil?: string | null;
  isKetua: boolean;
  tanggalKegiatan: string;
  waktuMulai: string;
  waktuSelesai: string;
  waktuLengkap: string;
  tempat: string;
  deskripsi: string;
  fotoBuktiUrl: string;
  attachmentUrls?: string[];
  platformOs?: string;
  tipeAktivitas: "KELOMPOK" | "INDIVIDU";
  pekanKe: number;
  statusApproval: "MENUNGGU_PERSETUJUAN_KETUA" | "DITOLAK_KETUA" | "MENUNGGU_VERIFIKASI_DPL" | "DISETUJUI_DPL" | "PERLU_REVISI_DPL";
  programKerjaId?: string | null;
  programKerjaDeskripsi?: string | null;
  programKerjaKategori?: string | null;
  programKerja?: {
    id: string;
    nomor?: number;
    deskripsi?: string;
    kategori?: string;
    status?: string;
    statusUsulan?: string;
    statusPelaksanaan?: string;
    linkGoogleDrive?: string;
    waktuPelaksanaan?: string;
  } | null;
  fasilitasId?: string | null;
  fasilitasNama?: string | null;
  fasilitas?: {
    id: string;
    nama: string;
    jenis?: string;
    alamat?: string;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  anggotaKelompok?: Array<{ id: string; userId?: string; nim?: string; name: string; isKetua: boolean }>;
  disetujuiKetuaOleh?: string | null;
  disetujuiKetuaPada?: string | null;
  catatanKetua?: string | null;
  diverifikasiDplOleh?: string | null;
  diverifikasiDplPada?: string | null;
  catatanDpl?: string | null;
  createdAt: string;
}

export interface LogbookDplItem {
  id: string;
  dplId: string;
  dplNama: string;
  kelompokId: string;
  kelompokNama: string;
  kelurahan: string;
  pekanKe: number;
  tanggal: string;
  tempat: string;
  deskripsi: string;
  arahanEvaluasi?: string;
  fotoBuktiUrl?: string;
  createdAt: string;
}

export interface LogbookComplianceStats {
  isAggregate?: boolean;
  kelompok?: {
    id: string;
    name: string;
    kelurahan: string;
    dplNama: string;
    dplNip?: string;
    dplPhone?: string;
    ketuaNama: string;
    ketuaNim?: string;
    studentCount: number;
  } | null;
  targetCount: number;
  totalSubmitted: number;
  approvedCount: number;
  pendingKetuaCount: number;
  pendingDplCount: number;
  revisiCount: number;
  complianceRate: number;
  calculatedScore: number;
  isTargetMet: boolean;
  shortageCount: number;
  pekanBreakdown: Record<
    number,
    {
      total: number;
      approved: number;
      pending?: number;
      target?: number;
      completionRate?: number;
      isMet?: boolean;
    }
  >;
  studentsList?: Array<{
    id: string;
    userId: string;
    name: string;
    nim: string;
    jurusan: string;
    fakultas: string;
    isKetua: boolean;
    submittedCount: number;
    approvedCount: number;
    contributionPct: number;
  }>;
  recentApprovedActivities?: Array<{
    id: string;
    tanggalKegiatan: string;
    penulisNama: string;
    penulisNim: string;
    tempat: string;
    deskripsi: string;
    pekanKe: number;
    kategori: string;
    diverifikasiDplPada: string | null;
    catatanDpl: string | null;
  }>;
  groupsSummary?: Array<{
    id: string;
    name: string;
    kelurahan: string;
    dplNama: string;
    studentCount: number;
    totalSubmitted: number;
    approvedCount: number;
    targetCount: number;
    complianceRate: number;
    isTargetMet: boolean;
  }>;
  gradingIntegration: {
    targetAktivitas: number;
    aktivitasTerverifikasi: number;
    skorDasarLogbook: number;
    bobotDplPersen: number;
    kontribusiPoinDpl: number;
    kontribusiNilaiAkhirKkn: number;
    statusSyaratNilai: "MEMENUHI_SYARAT" | "BELUM_MEMENUHI";
    statusLabel: string;
    rekomendasi?: string;
  };
}

export type ComplianceStats = LogbookComplianceStats;

export const logbookApiService = {
  /**
   * Mengambil daftar logbook tabular mahasiswa
   */
  getMahasiswaLogbooks: async (params?: {
    groupId?: string;
    pekanKe?: number;
    statusApproval?: string;
    tipeAktivitas?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<LogbookMahasiswaItem[]> => {
    const res = await api.get("/logbook/mahasiswa", { params });
    return res.data?.data || [];
  },

  /**
   * Tambah logbook aktivitas baru
   */
  createMahasiswaLogbook: async (data: FormData | Record<string, any>) => {
    const isFormData = data instanceof FormData;
    const res = await api.post("/logbook/mahasiswa", data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return res.data;
  },

  /**
   * Update / Edit logbook aktivitas mahasiswa (Developer / DPL)
   */
  updateMahasiswaLogbook: async (id: string, data: FormData | Record<string, any>) => {
    const isFormData = data instanceof FormData;
    const res = await api.put(`/logbook/mahasiswa/${id}`, data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return res.data;
  },

  /**
   * Persetujuan / Penolakan oleh Ketua Kelompok
   */
  approveByKetua: async (
    id: string,
    action: "APPROVE" | "REJECT",
    catatanKetua?: string
  ) => {
    const res = await api.patch(`/logbook/mahasiswa/${id}/approve-ketua`, {
      action,
      catatanKetua,
    });
    return res.data;
  },

  /**
   * Verifikasi & Feedback oleh DPL (Single)
   */
  verifikasiByDpl: async (
    id: string,
    action: "APPROVE" | "REVISI",
    catatanDpl?: string
  ) => {
    const res = await api.patch(`/logbook/mahasiswa/${id}/verifikasi-dpl`, {
      action,
      catatanDpl,
    });
    return res.data;
  },

  /**
   * Batch Verifikasi oleh DPL
   */
  batchVerifikasiByDpl: async (
    logbookIds: string[],
    action: "APPROVE" | "REVISI" = "APPROVE",
    catatanDpl?: string
  ) => {
    const res = await api.post("/logbook/mahasiswa/batch-verifikasi-dpl", {
      logbookIds,
      action,
      catatanDpl,
    });
    return res.data;
  },

  /**
   * Hapus logbook aktivitas mahasiswa
   */
  deleteMahasiswaLogbook: async (id: string) => {
    const res = await api.delete(`/logbook/mahasiswa/${id}`);
    return res.data;
  },

  /**
   * Mengambil riwayat logbook monitoring mingguan DPL
   */
  getDplLogbooks: async (groupId?: string): Promise<LogbookDplItem[]> => {
    const res = await api.get("/logbook/dpl", {
      params: groupId && groupId !== "ALL" ? { groupId } : undefined,
    });
    return res.data?.data || [];
  },

  /**
   * Tambah logbook monitoring mingguan DPL
   */
  createDplLogbook: async (data: FormData | Record<string, any>) => {
    const isFormData = data instanceof FormData;
    const res = await api.post("/logbook/dpl", data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return res.data;
  },

  /**
   * Mengambil statistik kepatuhan dan skor logbook
   */
  getComplianceScore: async (kelompokId: string): Promise<LogbookComplianceStats> => {
    const res = await api.get(`/logbook/kepatuhan/${kelompokId}`);
    return res.data?.data;
  },

  /**
   * Mengambil batas toleransi backdate
   */
  getToleranceConfig: async (): Promise<{ toleranceDays: number; description: string }> => {
    const res = await api.get("/logbook/config/toleransi");
    return res.data?.data;
  },

  /**
   * Update batas toleransi (developer)
   */
  updateToleranceConfig: async (toleranceDays: number) => {
    const res = await api.patch("/logbook/config/toleransi", { toleranceDays });
    return res.data;
  },
};
