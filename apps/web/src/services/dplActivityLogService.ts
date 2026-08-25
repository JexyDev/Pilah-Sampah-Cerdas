/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Frontend API Service for Log Aktivitas DPL
 */

import api from "./api";

export interface DplActivityLogItem {
  id: string;
  dplId: string;
  dplNama: string;
  kelompokId: string;
  kelompokNama: string;
  kelurahan: string;
  tanggal: string;
  tanggalFormatted: string;
  waktuMulai: string;
  waktuSelesai: string;
  waktuLengkap: string;
  kategori: string;
  lokasi: string;
  tempat: string;
  ringkasanAktivitas: string;
  deskripsi: string;
  hasilTindakLanjut: string;
  arahanEvaluasi: string;
  programKerjaId?: string | null;
  programKerjaDeskripsi?: string | null;
  durasiMenit: number;
  durasi: string;
  bukti: string;
  fotoBuktiUrl?: string | null;
  simpanLokasi: boolean;
  status: "DRAF" | "TERKIRIM" | "TERVERIFIKASI" | string;
  pekanKe: number;
  createdAt: string;
}

export interface DplActivityStats {
  totalAktivitas: number;
  bulanIni: number;
  totalDurasi: string;
  totalDurasiJam: number;
  belumDikirim: number;
}

export interface DplActivityLogsResponse {
  stats: DplActivityStats;
  items: DplActivityLogItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const dplActivityLogService = {
  /**
   * Mengambil riwayat log aktivitas DPL dengan statistik
   */
  getActivityLogs: async (params?: {
    search?: string;
    groupId?: string;
    kategori?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<DplActivityLogsResponse> => {
    const res = await api.get("/dpl/activity-logs", { params });
    return (
      res.data?.data || {
        stats: { totalAktivitas: 0, bulanIni: 0, totalDurasi: "0 jam", totalDurasiJam: 0, belumDikirim: 0 },
        items: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
      }
    );
  },

  /**
   * Menyimpan aktivitas DPL baru (Draf atau Terkirim)
   */
  createActivityLog: async (data: FormData | Record<string, any>) => {
    const res = await api.post("/dpl/activity-logs", data);
    return res.data;
  },

  /**
   * Memperbarui aktivitas DPL (Edit Draf atau Kirim)
   */
  updateActivityLog: async (id: string, data: FormData | Record<string, any>) => {
    const res = await api.put(`/dpl/activity-logs/${id}`, data);
    return res.data;
  },

  /**
   * Menghapus aktivitas DPL
   */
  deleteActivityLog: async (id: string) => {
    const res = await api.delete(`/dpl/activity-logs/${id}`);
    return res.data;
  },
};
